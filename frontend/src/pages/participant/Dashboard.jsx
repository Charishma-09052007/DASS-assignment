import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import TicketCard from '../../components/TicketCard';
import { EVENT_TYPE_ICONS, REGISTRATION_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const user = getCurrentUser();

    const tabs = [
        { id: 'upcoming', label: 'Upcoming Events' },
        { id: 'normal', label: 'Normal' },
        { id: 'merchandise', label: 'Merchandise' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled/Rejected' }
    ];

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const response = await API.get('/user/registrations');
            if (response.data.success) {
                setRegistrations(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch registrations');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredRegistrations = () => {
        const now = new Date();
        
        switch(activeTab) {
            case 'upcoming':
                return registrations.filter(r => 
                    r.eventId && 
                    new Date(r.eventId.eventStartDate) > now &&
                    ['registered', 'approved', 'pending'].includes(r.status)
                );
            case 'normal':
                return registrations.filter(r => r.registrationType === 'normal');
            case 'merchandise':
                return registrations.filter(r => r.registrationType === 'merchandise');
            case 'completed':
                return registrations.filter(r => 
                    ['completed', 'attended'].includes(r.status)
                );
            case 'cancelled':
                return registrations.filter(r => 
                    ['cancelled', 'rejected'].includes(r.status)
                );
            default:
                return registrations;
        }
    };

    const handleTicketClick = (registration) => {
        setSelectedTicket(registration);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const filteredRegistrations = getFilteredRegistrations();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Events Dashboard</h1>
                
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                                {tab.id === 'upcoming' && (
                                    <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                                        {filteredRegistrations.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Events Grid */}
                {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500 text-lg">No events found</p>
                        {activeTab === 'upcoming' && (
                            <Link to="/browse-events" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                                Browse Events →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRegistrations.map(reg => (
                            <div key={reg._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    {/* Event Type Icon */}
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-2xl">
                                            {EVENT_TYPE_ICONS[reg.registrationType]}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[reg.status]}`}>
                                            {STATUS_LABELS[reg.status]}
                                        </span>
                                    </div>

                                    {/* Event Details */}
                                    <h3 className="text-xl font-semibold mb-2">
                                        <Link to={`/events/${reg.eventId?._id}`} className="hover:text-indigo-600">
                                            {reg.eventId?.eventName || 'Event Deleted'}
                                        </Link>
                                    </h3>
                                    
                                    <p className="text-sm text-gray-600 mb-3">
                                        by {reg.eventId?.organizerId?.organizerDetails?.organizerName || 'Unknown'}
                                    </p>

                                    {/* Schedule */}
                                    {reg.eventId && (
                                        <div className="mb-4 text-sm">
                                            <div className="flex items-center text-gray-600 mb-1">
                                                <span className="mr-2">📅</span>
                                                {new Date(reg.eventId.eventStartDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <span className="mr-2">⏰</span>
                                                {new Date(reg.eventId.eventStartDate).toLocaleTimeString()} - 
                                                {new Date(reg.eventId.eventEndDate).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ticket ID (clickable) */}
                                    {reg.ticketId && (
                                        <button
                                            onClick={() => handleTicketClick(reg)}
                                            className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            🎫 Ticket ID: {reg.ticketId}
                                        </button>
                                    )}

                                    {/* Order Details for Merchandise */}
                                    {reg.registrationType === 'merchandise' && reg.orderDetails && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium mb-2">Order Details:</p>
                                            {reg.orderDetails.items?.map((item, idx) => (
                                                <div key={idx} className="text-xs text-gray-600">
                                                    {item.quantity}x {item.size} - {item.color} (₹{item.price})
                                                </div>
                                            ))}
                                            <p className="text-sm font-medium mt-2">
                                                Total: ₹{reg.orderDetails.totalAmount}
                                            </p>
                                        </div>
                                    )}

                                    {/* Team Name (if applicable) */}
                                    {reg.formResponses?.teamName && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            Team: {reg.formResponses.teamName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Ticket Modal */}
                {selectedTicket && (
                    <TicketCard
                        registration={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;