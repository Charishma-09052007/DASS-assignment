import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

const AttendanceDashboard = () => {
    const { id } = useParams();
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanMode, setScanMode] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [manualMode, setManualMode] = useState(false);
    const [manualData, setManualData] = useState({
        participantId: '',
        reason: ''
    });

    useEffect(() => {
        fetchAttendance();
    }, [id]);

    const fetchAttendance = async () => {
        try {
            const response = await API.get(`/events/${id}/attendance/dashboard`);
            if (response.data.success) {
                setAttendance(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async () => {
        if (!ticketId.trim()) {
            toast.error('Please enter a ticket ID');
            return;
        }

        try {
            const response = await API.post(`/events/${id}/attendance/scan`, {
                ticketId: ticketId.trim()
            });
            
            if (response.data.success) {
                toast.success(`Attendance marked for ${response.data.data.participant.firstName} ${response.data.data.participant.lastName}`);
                setTicketId('');
                fetchAttendance();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark attendance');
        }
    };

    const handleManualMark = async () => {
        if (!manualData.participantId) {
            toast.error('Please select a participant');
            return;
        }

        try {
            const response = await API.post(`/events/${id}/attendance/manual`, manualData);
            if (response.data.success) {
                toast.success(`Attendance marked manually`);
                setManualMode(false);
                setManualData({ participantId: '', reason: '' });
                fetchAttendance();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark attendance');
        }
    };

    const handleExport = async () => {
        try {
            const response = await API.get(`/events/${id}/attendance/export`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Attendance report downloaded');
        } catch (error) {
            toast.error('Failed to export attendance');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Attendance Tracking</h2>
                <button
                    onClick={handleExport}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Registered</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>{attendance?.total || 0}</p>
                </div>
                <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Scanned</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{attendance?.scanned.count || 0}</p>
                </div>
                <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Not Scanned</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{attendance?.notScanned.count || 0}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => {
                        setScanMode(!scanMode);
                        setManualMode(false);
                    }}
                    style={{ padding: '0.5rem 1rem', backgroundColor: scanMode ? '#6b7280' : '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                    {scanMode ? 'Cancel Scan' : 'Scan QR Code'}
                </button>
                <button
                    onClick={() => {
                        setManualMode(!manualMode);
                        setScanMode(false);
                    }}
                    style={{ padding: '0.5rem 1rem', backgroundColor: manualMode ? '#6b7280' : '#f59e0b', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                    {manualMode ? 'Cancel Manual' : 'Manual Entry'}
                </button>
            </div>

            {/* Scan Mode */}
            {scanMode && (
                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Scan QR Code</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value)}
                            placeholder="Enter ticket ID from QR code"
                            style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                        />
                        <button
                            onClick={handleScan}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                        >
                            Mark Attendance
                        </button>
                    </div>
                </div>
            )}

            {/* Manual Mode */}
            {manualMode && (
                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Manual Attendance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select
                            value={manualData.participantId}
                            onChange={(e) => setManualData({ ...manualData, participantId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                        >
                            <option value="">Select Participant</option>
                            {attendance?.notScanned.list.map(p => (
                                <option key={p._id} value={p.participantId._id}>
                                    {p.participantId.firstName} {p.participantId.lastName} - {p.participantId.email} (Ticket: {p.ticketId})
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={manualData.reason}
                            onChange={(e) => setManualData({ ...manualData, reason: e.target.value })}
                            placeholder="Reason for manual entry"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                        />
                        <button
                            onClick={handleManualMark}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                        >
                            Mark Attendance
                        </button>
                    </div>
                </div>
            )}

            {/* Participants List */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Participants</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Name</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Email</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Ticket ID</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Scanned At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance?.notScanned.list.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem' }}>{p.participantId.firstName} {p.participantId.lastName}</td>
                                    <td style={{ padding: '0.75rem' }}>{p.participantId.email}</td>
                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#4f46e5' }}>{p.ticketId}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '9999px', fontSize: '0.75rem' }}>
                                            Not Scanned
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>-</td>
                                </tr>
                            ))}
                            {attendance?.scanned.list.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f0fdf4' }}>
                                    <td style={{ padding: '0.75rem' }}>{p.participantId.firstName} {p.participantId.lastName}</td>
                                    <td style={{ padding: '0.75rem' }}>{p.participantId.email}</td>
                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#4f46e5' }}>{p.ticketId}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '9999px', fontSize: '0.75rem' }}>
                                            Present
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{new Date(p.attendanceMarkedAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {(!attendance?.notScanned.list.length && !attendance?.scanned.list.length) && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                        No participants found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AttendanceDashboard;