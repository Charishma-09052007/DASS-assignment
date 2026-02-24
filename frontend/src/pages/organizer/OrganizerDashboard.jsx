import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { toast } from 'react-hot-toast';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalRegistrations: 0,
        totalRevenue: 0,
        totalAttendance: 0
    });
    const [loading, setLoading] = useState(true);
    const user = getCurrentUser();

    useEffect(() => {
        fetchOrganizerEvents();
    }, []);

    const fetchOrganizerEvents = async () => {
        try {
            const response = await API.get('/organizer/events');
            if (response.data.success) {
                setEvents(response.data.data.events);
                setAnalytics(response.data.data.analytics);
            }
        } catch (error) {
            toast.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'draft': '#6b7280',
            'published': '#10b981',
            'ongoing': '#f59e0b',
            'closed': '#ef4444',
            'completed': '#8b5cf6'
        };
        return colors[status] || '#6b7280';
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
                    Organizer Dashboard
                </h1>

                {/* Analytics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Registrations</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>{analytics.totalRegistrations}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Revenue</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>₹{analytics.totalRevenue}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Attendance</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{analytics.totalAttendance}</p>
                    </div>
                </div>

                {/* Events Carousel */}
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Your Events</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {events.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
                            <p style={{ color: '#6b7280' }}>No events created yet.</p>
                            <Link to="/create-event" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', borderRadius: '0.375rem', textDecoration: 'none' }}>
                                Create Your First Event
                            </Link>
                        </div>
                    ) : (
                        events.map(event => (
                            <Link
                                key={event._id}
                                to={`/organizer/events/${event._id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>{event.eventName}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: getStatusColor(event.status),
                                            color: 'white'
                                        }}>
                                            {event.status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                        {event.eventType} • {new Date(event.eventStartDate).toLocaleDateString()}
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                                        Registrations: {event.currentRegistrations} / {event.registrationLimit || '∞'}
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                                        Fee: {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
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

export default OrganizerDashboard;