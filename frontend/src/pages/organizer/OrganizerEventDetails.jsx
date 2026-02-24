import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

// ===== NEW: Import AttendanceDashboard component =====
import AttendanceDashboard from './AttendanceDashboard';
// ===== NEW: Import MerchandiseOrders component =====
import MerchandiseOrders from './MerchandiseOrders';

const OrganizerEventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    // ===== NEW: Add activeTab state =====
    const [activeTab, setActiveTab] = useState('overview');
    // ===== NEW: Add pendingOrders count for badge =====
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [analytics, setAnalytics] = useState({
        totalRegistrations: 0,
        totalRevenue: 0,
        totalAttendance: 0,
        teamCompletion: 0
    });

    useEffect(() => {
        fetchEventDetails();
        fetchParticipants();
        fetchPendingOrdersCount();
    }, [id]);

    useEffect(() => {
        filterParticipants();
    }, [searchTerm, statusFilter, paymentFilter, participants]);

    const fetchEventDetails = async () => {
        try {
            const response = await API.get(`/events/${id}`);
            if (response.data.success) {
                setEvent(response.data.data);
                
                // Calculate analytics
                const registrations = await API.get(`/events/${id}/registrations`);
                if (registrations.data.success) {
                    const regs = registrations.data.data;
                    const totalRegs = regs.length;
                    const totalRev = regs.reduce((sum, r) => sum + (r.orderDetails?.totalAmount || 0), 0);
                    const totalAtt = regs.filter(r => r.attendanceMarked).length;
                    const teamEvents = regs.filter(r => r.formResponses?.teamName);
                    const teamCompletion = teamEvents.length > 0 ? (teamEvents.filter(r => r.attendanceMarked).length / teamEvents.length) * 100 : 0;
                    
                    setAnalytics({
                        totalRegistrations: totalRegs,
                        totalRevenue: totalRev,
                        totalAttendance: totalAtt,
                        teamCompletion: Math.round(teamCompletion)
                    });
                }
            }
        } catch (error) {
            toast.error('Failed to fetch event details');
            navigate('/organizer/dashboard');
        }
    };

    const fetchParticipants = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (paymentFilter) params.append('payment', paymentFilter);
            
            const response = await API.get(`/events/${id}/participants?${params.toString()}`);
            if (response.data.success) {
                setParticipants(response.data.data);
                setFilteredParticipants(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch participants');
        } finally {
            setLoading(false);
        }
    };

    // ===== NEW: Fetch pending orders count for badge =====
    const fetchPendingOrdersCount = async () => {
        try {
            const response = await API.get(`/events/${id}/orders/pending`);
            if (response.data.success) {
                setPendingOrdersCount(response.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch pending orders count');
        }
    };

    const filterParticipants = () => {
        let filtered = participants;
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.participantId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.participantId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.participantId.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredParticipants(filtered);
    };

    const handleExportCSV = async () => {
        try {
            const response = await API.get(`/events/${id}/participants/export`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `participants-${event.eventName}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('CSV downloaded successfully');
        } catch (error) {
            toast.error('Failed to export CSV');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const response = await API.patch(`/events/${id}/status`, { status: newStatus });
            if (response.data.success) {
                setEvent(response.data.data);
                toast.success(`Event status updated to ${newStatus}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ border: '4px solid #f3f4f6', borderTopColor: '#4f46e5', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                <button
                    onClick={() => navigate('/organizer/dashboard')}
                    style={{ marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                    ← Back to Dashboard
                </button>

                {/* ===== Tabs Navigation (UPDATED with Merchandise Orders) ===== */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                    <nav style={{ display: 'flex', padding: '0 1rem' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                padding: '1rem 1.5rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'overview' ? '600' : '400',
                                color: activeTab === 'overview' ? '#4f46e5' : '#6b7280',
                                borderBottom: activeTab === 'overview' ? '2px solid #4f46e5' : '2px solid transparent'
                            }}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            style={{
                                padding: '1rem 1.5rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'participants' ? '600' : '400',
                                color: activeTab === 'participants' ? '#4f46e5' : '#6b7280',
                                borderBottom: activeTab === 'participants' ? '2px solid #4f46e5' : '2px solid transparent'
                            }}
                        >
                            Participants
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            style={{
                                padding: '1rem 1.5rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'attendance' ? '600' : '400',
                                color: activeTab === 'attendance' ? '#4f46e5' : '#6b7280',
                                borderBottom: activeTab === 'attendance' ? '2px solid #4f46e5' : '2px solid transparent'
                            }}
                        >
                            Attendance Tracking
                        </button>
                        {/* ===== NEW: Merchandise Orders Tab with Badge ===== */}
                        <button
                            onClick={() => setActiveTab('orders')}
                            style={{
                                padding: '1rem 1.5rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'orders' ? '600' : '400',
                                color: activeTab === 'orders' ? '#4f46e5' : '#6b7280',
                                borderBottom: activeTab === 'orders' ? '2px solid #4f46e5' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Merchandise Orders
                            {pendingOrdersCount > 0 && (
                                <span style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '9999px'
                                }}>
                                    {pendingOrdersCount}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* ===== Tab Content ===== */}
                {activeTab === 'overview' && (
                    <>
                        {/* Event Overview */}
                        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>{event.eventName}</h1>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <p><strong>Type:</strong> {event.eventType}</p>
                                    <p><strong>Status:</strong> 
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            backgroundColor: event.status === 'published' ? '#10b981' : 
                                                          event.status === 'draft' ? '#6b7280' :
                                                          event.status === 'ongoing' ? '#f59e0b' : '#ef4444',
                                            color: 'white'
                                        }}>
                                            {event.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p><strong>Dates:</strong> {new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}</p>
                                    <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p><strong>Eligibility:</strong> {event.eligibility}</p>
                                    <p><strong>Pricing:</strong> {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}</p>
                                </div>
                            </div>

                            {/* ===== NEW: Merchandise Variants Stock Display ===== */}
                            {event.eventType === 'merchandise' && event.itemDetails && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Item Details</h3>
                                    <p style={{ marginBottom: '0.5rem' }}><strong>Item:</strong> {event.itemDetails.name}</p>
                                    <p style={{ marginBottom: '1rem' }}><strong>Description:</strong> {event.itemDetails.description}</p>
                                    
                                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Variants & Stock</h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f9fafb' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Size</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Color</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Price</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Stock</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>SKU</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {event.itemDetails.variants.map((variant, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                        <td style={{ padding: '0.75rem' }}>{variant.size}</td>
                                                        <td style={{ padding: '0.75rem' }}>{variant.color}</td>
                                                        <td style={{ padding: '0.75rem' }}>₹{variant.price}</td>
                                                        <td style={{ 
                                                            padding: '0.75rem',
                                                            fontWeight: 'bold',
                                                            color: variant.stock > 0 ? '#10b981' : '#ef4444'
                                                        }}>
                                                            {variant.stock}
                                                        </td>
                                                        <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{variant.sku || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Total Stock Summary */}
                                    <div style={{ 
                                        marginTop: '1rem', 
                                        padding: '1rem', 
                                        backgroundColor: '#f3f4f6', 
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: '600' }}>Total Stock Available:</span>
                                        <span style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: 'bold',
                                            color: event.itemDetails.variants.reduce((sum, v) => sum + v.stock, 0) > 0 ? '#10b981' : '#ef4444'
                                        }}>
                                            {event.itemDetails.variants.reduce((sum, v) => sum + v.stock, 0)} units
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Status Change Buttons */}
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                {event.status === 'draft' && (
                                    <button onClick={() => handleStatusChange('published')} style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                        Publish Event
                                    </button>
                                )}
                                {event.status === 'published' && (
                                    <>
                                        <button onClick={() => handleStatusChange('ongoing')} style={{ padding: '0.5rem 1rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            Start Event
                                        </button>
                                        <button onClick={() => handleStatusChange('closed')} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            Close Registrations
                                        </button>
                                    </>
                                )}
                                {event.status === 'ongoing' && (
                                    <>
                                        <button onClick={() => handleStatusChange('completed')} style={{ padding: '0.5rem 1rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            Mark Completed
                                        </button>
                                        <button onClick={() => handleStatusChange('closed')} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                                            Close Registrations
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Analytics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Registrations</h3>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>{analytics.totalRegistrations}</p>
                            </div>
                            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Revenue</h3>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>₹{analytics.totalRevenue}</p>
                            </div>
                            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Attendance</h3>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{analytics.totalAttendance}</p>
                            </div>
                            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Team Completion</h3>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{analytics.teamCompletion}%</p>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'participants' && (
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Participants</h2>
                            <button
                                onClick={handleExportCSV}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                                Export CSV
                            </button>
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            >
                                <option value="">All Status</option>
                                <option value="registered">Registered</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="attended">Attended</option>
                            </select>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            >
                                <option value="">All Payments</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {/* Participants Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Registration Date</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Payment</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Team</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                                No participants found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredParticipants.map(p => (
                                            <tr key={p._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '0.75rem' }}>{p.participantId.firstName} {p.participantId.lastName}</td>
                                                <td style={{ padding: '0.75rem' }}>{p.participantId.email}</td>
                                                <td style={{ padding: '0.75rem' }}>{new Date(p.registeredAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: p.status === 'registered' ? '#dbeafe' :
                                                                      p.status === 'pending' ? '#fed7aa' :
                                                                      p.status === 'approved' ? '#d1fae5' :
                                                                      p.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                                                        color: p.status === 'registered' ? '#1e40af' :
                                                               p.status === 'pending' ? '#92400e' :
                                                               p.status === 'approved' ? '#065f46' :
                                                               p.status === 'rejected' ? '#991b1b' : '#374151'
                                                    }}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: p.orderDetails?.paymentStatus === 'approved' ? '#d1fae5' :
                                                                      p.orderDetails?.paymentStatus === 'pending' ? '#fed7aa' :
                                                                      p.orderDetails?.paymentStatus === 'rejected' ? '#fee2e2' : '#f3f4f6',
                                                        color: p.orderDetails?.paymentStatus === 'approved' ? '#065f46' :
                                                               p.orderDetails?.paymentStatus === 'pending' ? '#92400e' :
                                                               p.orderDetails?.paymentStatus === 'rejected' ? '#991b1b' : '#374151'
                                                    }}>
                                                        {p.orderDetails?.paymentStatus || 'N/A'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{p.formResponses?.teamName || '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: p.attendanceMarked ? '#d1fae5' : '#fee2e2',
                                                        color: p.attendanceMarked ? '#065f46' : '#991b1b'
                                                    }}>
                                                        {p.attendanceMarked ? 'Present' : 'Absent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== Attendance Tracking Tab ===== */}
                {activeTab === 'attendance' && (
                    <AttendanceDashboard />
                )}

                {/* ===== NEW: Merchandise Orders Tab ===== */}
                {activeTab === 'orders' && (
                    <MerchandiseOrders />
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

export default OrganizerEventDetails;