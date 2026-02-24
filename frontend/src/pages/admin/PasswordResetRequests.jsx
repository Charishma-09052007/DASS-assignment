import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

const PasswordResetRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [comment, setComment] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // This would fetch from your backend
            // For now, using mock data
            const mockRequests = [
                {
                    id: 1,
                    clubName: 'Coding Club',
                    email: 'coding.club@iiit.ac.in',
                    requestDate: new Date().toISOString(),
                    reason: 'Forgot password',
                    status: 'pending'
                },
                {
                    id: 2,
                    clubName: 'Music Club',
                    email: 'music.club@iiit.ac.in',
                    requestDate: new Date().toISOString(),
                    reason: 'Need to reset',
                    status: 'pending'
                }
            ];
            setRequests(mockRequests);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (request) => {
        setSelectedRequest(request);
        // Generate random password
        const randomPassword = Math.random().toString(36).slice(-8) + 
                               Math.random().toString(36).slice(-8).toUpperCase();
        setNewPassword(randomPassword);
    };

    const handleReject = async (requestId) => {
        if (window.confirm('Are you sure you want to reject this request?')) {
            try {
                // API call would go here
                toast.success('Request rejected');
                setRequests(requests.filter(r => r.id !== requestId));
            } catch (error) {
                toast.error('Failed to reject request');
            }
        }
    };

    const confirmApprove = async () => {
        try {
            // API call would go here
            toast.success('Password reset approved');
            toast.success(`New password: ${newPassword}`);
            setRequests(requests.filter(r => r.id !== selectedRequest.id));
            setSelectedRequest(null);
            setComment('');
            setNewPassword('');
        } catch (error) {
            toast.error('Failed to approve request');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ border: '4px solid #f3f4f6', borderTopColor: '#4f46e5', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
                    Password Reset Requests
                </h1>

                {requests.length === 0 ? (
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No pending password reset requests</p>
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Club Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Request Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Reason</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr key={request.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem' }}>{request.clubName}</td>
                                        <td style={{ padding: '1rem' }}>{request.email}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(request.requestDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{request.reason}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#fed7aa',
                                                color: '#92400e'
                                            }}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleApprove(request)}
                                                style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(request.id)}
                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Approval Modal */}
                {selectedRequest && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '0.5rem',
                            maxWidth: '500px',
                            width: '90%'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Approve Password Reset</h2>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <p><strong>Club:</strong> {selectedRequest.clubName}</p>
                                <p><strong>Email:</strong> {selectedRequest.email}</p>
                                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>New Password</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={newPassword}
                                        readOnly
                                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: '#f3f4f6' }}
                                    />
                                    <button
                                        onClick={() => copyToClipboard(newPassword)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Comment (Optional)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add any notes about this reset"
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmApprove}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                >
                                    Approve & Generate Password
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PasswordResetRequests;