import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalClubs: 0,
        totalEvents: 0,
        totalParticipants: 0
    });
    const [loading, setLoading] = useState(true);
    const user = getCurrentUser();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const clubs = await API.get('/admin/clubs');
            const events = await API.get('/events');
            const users = await API.get('/test/interests');
            
            setStats({
                totalClubs: clubs.data.count || 0,
                totalEvents: events.data.count || 0,
                totalParticipants: users.data.data?.filter(u => u.role === 'participant').length || 0
            });
        } catch (error) {
            toast.error('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
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
                    Admin Dashboard
                </h1>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Clubs</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>{stats.totalClubs}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Events</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.totalEvents}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Participants</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.totalParticipants}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    <Link to="/admin/clubs" style={{ textDecoration: 'none' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#4f46e5', marginBottom: '0.5rem' }}>Manage Clubs</h3>
                            <p style={{ color: '#6b7280' }}>Add, edit, or remove clubs and organizers</p>
                        </div>
                    </Link>
                    <Link to="/admin/password-resets" style={{ textDecoration: 'none' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#f59e0b', marginBottom: '0.5rem' }}>Password Reset Requests</h3>
                            <p style={{ color: '#6b7280' }}>Handle organizer password reset requests</p>
                        </div>
                    </Link>
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

export default AdminDashboard;