import React, { useState } from 'react';

const ForumMessage = ({ message, thread, onReply, onReact, onPin, onDelete, currentUser, isOrganizer }) => {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [showReplies, setShowReplies] = useState(false);

    const reactions = [
        { emoji: '👍', label: 'Like' },
        { emoji: '❤️', label: 'Love' },
        { emoji: '😂', label: 'Haha' },
        { emoji: '😮', label: 'Wow' },
        { emoji: '😢', label: 'Sad' },
        { emoji: '😡', label: 'Angry' }
    ];

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return `${diff} sec ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        return date.toLocaleDateString();
    };

    const handleReply = () => {
        if (replyContent.trim()) {
            onReply(message._id, replyContent);
            setReplyContent('');
            setShowReplyBox(false);
        }
    };

    const getReactionCount = (emoji) => {
        return message.reactions?.filter(r => r.reaction === emoji).length || 0;
    };

    const userReacted = (emoji) => {
        return message.reactions?.some(r => 
            r.userId === currentUser?._id && r.reaction === emoji
        );
    };

    return (
        <div style={{ 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: message.isAnnouncement ? '#fff3cd' : 
                           message.isPinned ? '#e0f2fe' : '#f9fafb',
            borderRadius: '0.5rem',
            border: message.isAnnouncement ? '1px solid #ffeeba' : 
                    message.isPinned ? '1px solid #bae6fd' : '1px solid #e5e7eb'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'bold' }}>{message.userName}</span>
                    <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem',
                        backgroundColor: message.userRole === 'organizer' ? '#4f46e5' : 
                                       message.userRole === 'admin' ? '#dc2626' : '#6b7280',
                        color: 'white',
                        borderRadius: '12px'
                    }}>
                        {message.userRole}
                    </span>
                    {message.isAnnouncement && (
                        <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem' }}>
                            📢 ANNOUNCEMENT
                        </span>
                    )}
                    {message.isPinned && (
                        <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem' }}>
                            📌 PINNED
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {formatTime(message.createdAt)}
                </span>
            </div>

            {/* Content */}
            <p style={{ marginBottom: '0.75rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {message.content}
            </p>

            {/* Reactions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {reactions.map(reaction => {
                    const count = getReactionCount(reaction.emoji);
                    const reacted = userReacted(reaction.emoji);
                    return (
                        <button
                            key={reaction.emoji}
                            onClick={() => onReact(message._id, reaction.emoji)}
                            style={{
                                padding: '0.25rem 0.75rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '9999px',
                                backgroundColor: reacted ? '#e0f2fe' : 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}
                        >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.label}</span>
                            {count > 0 && (
                                <span style={{ 
                                    backgroundColor: reacted ? '#3b82f6' : '#e5e7eb',
                                    color: reacted ? 'white' : '#374151',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.7rem',
                                    marginLeft: '0.2rem'
                                }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                    💬 Reply
                </button>
                {thread && thread.length > 0 && (
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        {showReplies ? 'Hide' : 'Show'} {thread.length} {thread.length === 1 ? 'reply' : 'replies'}
                    </button>
                )}
                {isOrganizer && (
                    <>
                        <button
                            onClick={() => onPin(message._id, !message.isPinned)}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            📌 {message.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Delete this message?')) {
                                    onDelete(message._id);
                                }
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            🗑️ Delete
                        </button>
                    </>
                )}
            </div>

            {/* Reply Box */}
            {showReplyBox && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        rows="2"
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '0.375rem', 
                            marginBottom: '0.75rem',
                            fontSize: '0.9rem'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleReply}
                            disabled={!replyContent.trim()}
                            style={{ 
                                padding: '0.5rem 1.2rem', 
                                backgroundColor: '#4f46e5', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '0.375rem', 
                                cursor: replyContent.trim() ? 'pointer' : 'not-allowed',
                                opacity: replyContent.trim() ? 1 : 0.5
                            }}
                        >
                            Post Reply
                        </button>
                        <button
                            onClick={() => {
                                setShowReplyBox(false);
                                setReplyContent('');
                            }}
                            style={{ 
                                padding: '0.5rem 1.2rem', 
                                backgroundColor: '#6b7280', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '0.375rem', 
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Replies */}
            {showReplies && thread && thread.length > 0 && (
                <div style={{ marginLeft: '2rem', marginTop: '1rem', borderLeft: '2px solid #e5e7eb', paddingLeft: '1rem' }}>
                    {thread.map(reply => (
                        <ForumMessage
                            key={reply._id}
                            message={reply}
                            onReply={onReply}
                            onReact={onReact}
                            onPin={onPin}
                            onDelete={onDelete}
                            currentUser={currentUser}
                            isOrganizer={isOrganizer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ForumMessage;