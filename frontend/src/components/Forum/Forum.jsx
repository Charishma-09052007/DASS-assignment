import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import ForumMessage from './ForumMessage';
import { toast } from 'react-hot-toast';

const Forum = () => {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [threads, setThreads] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({});
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const socketRef = useRef();
    const typingTimeoutRef = useRef();
    const user = getCurrentUser();

    useEffect(() => {
        console.log('🔌 Connecting to socket server...');
        
        socketRef.current = io('http://localhost:5000');
        
        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected!');
            setConnectionStatus('connected');
            socketRef.current.emit('join-event', id);
        });

        socketRef.current.on('connect_error', (error) => {
            console.log('❌ Socket error:', error);
            setConnectionStatus('error');
        });
        
        socketRef.current.on('new-message', (message) => {
            if (!message.parentId) {
                setMessages(prev => [message, ...prev]);
            } else {
                setThreads(prev => ({
                    ...prev,
                    [message.parentId]: [...(prev[message.parentId] || []), message]
                }));
            }
            toast.success('New message in forum');
        });

        socketRef.current.on('message-pinned', ({ messageId, isPinned }) => {
            setMessages(prev => prev.map(m => 
                m._id === messageId ? { ...m, isPinned } : m
            ));
        });

        socketRef.current.on('message-deleted', (messageId) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        socketRef.current.on('message-updated', (updatedMessage) => {
            setMessages(prev => prev.map(m => 
                m._id === updatedMessage._id ? updatedMessage : m
            ));
        });

        socketRef.current.on('user-typing', ({ userId, userName }) => {
            setTypingUsers(prev => ({ ...prev, [userId]: userName }));
        });

        socketRef.current.on('user-stopped-typing', ({ userId }) => {
            setTypingUsers(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        });

        fetchMessages();

        return () => {
            socketRef.current.emit('leave-event', id);
            socketRef.current.disconnect();
        };
    }, [id]);

    const fetchMessages = async () => {
        try {
            const response = await API.get(`/forum/${id}`);
            if (response.data.success) {
                setMessages(response.data.data.messages);
                setThreads(response.data.data.threads);
            }
        } catch (error) {
            toast.error('Failed to load forum');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await API.post(`/forum/${id}`, {
                content: newMessage,
                isAnnouncement
            });
            setNewMessage('');
            setIsAnnouncement(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send');
        }
    };

    const handleReply = async (parentId, content) => {
        try {
            await API.post(`/forum/${id}`, { content, parentId });
        } catch (error) {
            toast.error('Failed to send reply');
        }
    };

    const handleReact = async (messageId, reaction) => {
        try {
            await API.post(`/forum/${messageId}/react`, { reaction });
        } catch (error) {
            toast.error('Failed to add reaction');
        }
    };

    const handlePin = async (messageId, isPinned) => {
        try {
            await API.patch(`/forum/${messageId}/pin`, { isPinned });
            toast.success(`Message ${isPinned ? 'pinned' : 'unpinned'}`);
        } catch (error) {
            toast.error('Failed to pin message');
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Delete this message?')) {
            try {
                await API.delete(`/forum/${messageId}`);
                toast.success('Message deleted');
            } catch (error) {
                toast.error('Failed to delete message');
            }
        }
    };

    const handleTyping = () => {
        if (socketRef.current && user) {
            socketRef.current.emit('typing', {
                eventId: id,
                userId: user._id,
                userName: `${user.firstName} ${user.lastName}`
            });

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('stop-typing', {
                    eventId: id,
                    userId: user._id
                });
            }, 1000);
        }
    };

    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem' }}>
            {/* Connection Status */}
            <div style={{ 
                marginBottom: '1rem', 
                padding: '0.5rem', 
                backgroundColor: connectionStatus === 'connected' ? '#d1fae5' : '#fee2e2',
                borderRadius: '0.375rem',
                textAlign: 'center',
                color: connectionStatus === 'connected' ? '#065f46' : '#991b1b'
            }}>
                {connectionStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2>Discussion Forum ({messages.length})</h2>
            </div>

            {/* New Message */}
            <div style={{ marginBottom: '2rem' }}>
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyUp={handleTyping}
                    placeholder="Write your message..."
                    rows="3"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={isAnnouncement}
                            onChange={(e) => setIsAnnouncement(e.target.checked)}
                            disabled={!isOrganizer}
                        />
                        Post as Announcement {!isOrganizer && '(Organizer only)'}
                    </label>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                    >
                        Post
                    </button>
                </div>
            </div>

            {/* Typing Indicator */}
            {Object.keys(typingUsers).length > 0 && (
                <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#fef3c7', 
                    border: '2px solid #f59e0b',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#92400e'
                }}>
                    ✏️ {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                </div>
            )}

            {/* Messages */}
            <div>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb' }}>
                        No messages yet. Be the first to post!
                    </div>
                ) : (
                    messages.map(message => (
                        <ForumMessage
                            key={message._id}
                            message={message}
                            thread={threads[message._id]}
                            onReply={handleReply}
                            onReact={handleReact}
                            onPin={handlePin}
                            onDelete={handleDelete}
                            currentUser={user}
                            isOrganizer={isOrganizer}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Forum;