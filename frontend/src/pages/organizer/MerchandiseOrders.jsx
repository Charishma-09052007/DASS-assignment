import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

const MerchandiseOrders = () => {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchPendingOrders();
    }, [id]);

    const fetchPendingOrders = async () => {
        try {
            const response = await API.get(`/events/${id}/orders/pending`);
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (orderId) => {
        try {
            const response = await API.post(`/orders/${orderId}/approve`);
            if (response.data.success) {
                toast.success('Payment approved successfully');
                fetchPendingOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve payment');
        }
    };

    const handleReject = async (orderId) => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            const response = await API.post(`/orders/${orderId}/reject`, {
                reason: rejectReason
            });
            if (response.data.success) {
                toast.success('Payment rejected');
                setSelectedOrder(null);
                setRejectReason('');
                fetchPendingOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject payment');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <div style={{ border: '4px solid #f3f4f6', borderTopColor: '#4f46e5', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
                Pending Merchandise Orders ({orders.length})
            </h2>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                    <p style={{ color: '#6b7280' }}>No pending orders</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.map(order => (
                        <div key={order._id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontWeight: '600' }}>
                                        {order.participantId.firstName} {order.participantId.lastName}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{order.participantId.email}</p>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Contact: {order.participantId.contactNumber}</p>
                                </div>
                                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fed7aa', color: '#92400e', borderRadius: '9999px', fontSize: '0.75rem' }}>
                                    Pending
                                </span>
                            </div>

                            {/* Order Items */}
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Items:</p>
                                {order.orderDetails.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                                        <span>{item.quantity}x {item.size} - {item.color}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e5e7eb' }}>
                                    <span>Total Amount:</span>
                                    <span>₹{order.orderDetails.totalAmount}</span>
                                </div>
                            </div>

                            {/* Payment Proof (mock) */}
                            <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Payment Proof:</p>
                                <p style={{ fontSize: '0.875rem', color: '#4f46e5' }}>screenshot-{order.ticketId}.png</p>
                            </div>

                            {/* Action Buttons */}
                            {selectedOrder === order._id ? (
                                <div style={{ marginTop: '1rem' }}>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        rows="2"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleReject(order._id)}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Confirm Reject
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(null);
                                                setRejectReason('');
                                            }}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleApprove(order._id)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        Approve Payment
                                    </button>
                                    <button
                                        onClick={() => setSelectedOrder(order._id)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default MerchandiseOrders;