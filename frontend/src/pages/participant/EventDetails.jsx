import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import TicketCard from '../../components/TicketCard';
import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS, ELIGIBILITY_LABELS } from '../../utils/constants';
import { toast } from 'react-hot-toast';

// ===== IMPORT: Forum component =====
import Forum from '../../components/Forum/Forum';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedVariants, setSelectedVariants] = useState([]);
    const [registration, setRegistration] = useState(null);
    // ===== NEW: Add activeTab state =====
    const [activeTab, setActiveTab] = useState('details');
    const user = getCurrentUser();

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await API.get(`/events/${id}`);
            if (response.data.success) {
                setEvent(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch event details');
            navigate('/browse-events');
        } finally {
            setLoading(false);
        }
    };

    const handleNormalRegistration = async () => {
        setRegistering(true);
        try {
            const response = await API.post(`/events/${id}/register`, {
                formResponses: formData
            });
            
            if (response.data.success) {
                setRegistration(response.data.data);
                toast.success('Successfully registered! Check your email for ticket.');
                
                // Send email (mock - in real app, backend sends email)
                console.log('Ticket sent to:', user.email);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleMerchandiseRegistration = async () => {
        if (selectedVariants.length === 0) {
            toast.error('Please select items to purchase');
            return;
        }

        setRegistering(true);
        try {
            const response = await API.post(`/events/${id}/register`, {
                orderDetails: {
                    items: selectedVariants
                }
            });
            
            if (response.data.success) {
                setRegistration(response.data.data);
                toast.success('Order placed! Awaiting approval.');
                
                // Send email (mock)
                console.log('Order confirmation sent to:', user.email);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Order failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleVariantChange = (variantId, quantity) => {
        setSelectedVariants(prev => {
            const existing = prev.find(v => v.variantId === variantId);
            if (existing) {
                if (quantity === 0) {
                    return prev.filter(v => v.variantId !== variantId);
                }
                return prev.map(v => 
                    v.variantId === variantId ? { ...v, quantity } : v
                );
            }
            return [...prev, { variantId, quantity }];
        });
    };

    const isRegistrationBlocked = () => {
        if (!event) return true;
        
        const now = new Date();
        if (new Date(event.registrationDeadline) < now) {
            return true; // Deadline passed
        }
        
        if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
            return true; // Limit reached
        }
        
        if (event.eventType === 'merchandise') {
            const totalStock = event.itemDetails?.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
            if (totalStock === 0) {
                return true; // Out of stock
            }
        }
        
        return false;
    };

    // ===== Calendar integration functions =====
    const handleDownloadICS = async () => {
        try {
            const response = await API.get(`/events/${id}/calendar`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${event.eventName}.ics`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Calendar file downloaded');
        } catch (error) {
            toast.error('Failed to download calendar file');
        }
    };

    const handleGoogleCalendar = async () => {
        try {
            const response = await API.get(`/events/${id}/google-calendar-link`);
            if (response.data.success) {
                window.open(response.data.data.googleLink, '_blank');
            }
        } catch (error) {
            toast.error('Failed to generate Google Calendar link');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Event not found</p>
            </div>
        );
    }

    const blocked = isRegistrationBlocked();
    const deadlinePassed = new Date(event.registrationDeadline) < new Date();
    const limitReached = event.registrationLimit && event.currentRegistrations >= event.registrationLimit;
    const outOfStock = event.eventType === 'merchandise' && 
        (event.itemDetails?.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) === 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ===== Tab Navigation ===== */}
                <div className="bg-white rounded-t-lg shadow-lg overflow-hidden mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'details' 
                                    ? 'border-b-2 border-indigo-600 text-indigo-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Event Details
                        </button>
                        <button
                            onClick={() => setActiveTab('forum')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'forum' 
                                    ? 'border-b-2 border-indigo-600 text-indigo-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Discussion Forum
                        </button>
                    </div>
                </div>

                {/* ===== Tab Content ===== */}
                {activeTab === 'details' ? (
                    /* Event Details Tab */
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-4xl mb-2 inline-block">
                                        {EVENT_TYPE_ICONS[event.eventType]}
                                    </span>
                                    <h1 className="text-3xl font-bold text-gray-900 mt-2">{event.eventName}</h1>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    event.eventType === 'normal' 
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {EVENT_TYPE_LABELS[event.eventType]}
                                </span>
                            </div>

                            <p className="text-gray-600 text-lg mb-6">{event.eventDescription}</p>

                            {/* Event Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-24 text-gray-500">Organizer:</span>
                                        <span className="font-medium">
                                            {event.organizerId?.organizerDetails?.organizerName || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-24 text-gray-500">Category:</span>
                                        <span>{event.organizerId?.organizerDetails?.category || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-24 text-gray-500">Contact:</span>
                                        <span>{event.organizerId?.organizerDetails?.contactEmail || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-24 text-gray-500">Start:</span>
                                        <span className="font-medium">
                                            {new Date(event.eventStartDate).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-24 text-gray-500">End:</span>
                                        <span>{new Date(event.eventEndDate).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-24 text-gray-500">Deadline:</span>
                                        <span className={deadlinePassed ? 'text-red-600' : 'text-green-600'}>
                                            {new Date(event.registrationDeadline).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {event.eventTags?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {event.eventTags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Eligibility & Registration Info */}
                            <div className="border-t pt-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500 block">Eligibility</span>
                                        <span className="font-medium">
                                            {ELIGIBILITY_LABELS[event.eligibility] || 'Everyone'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Registration Fee</span>
                                        <span className="font-medium">
                                            {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Available Spots</span>
                                        <span className={`font-medium ${
                                            event.registrationLimit && event.currentRegistrations >= event.registrationLimit
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                        }`}>
                                            {event.registrationLimit 
                                                ? `${event.registrationLimit - event.currentRegistrations} / ${event.registrationLimit}`
                                                : 'Unlimited'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Merchandise Variants */}
                            {event.eventType === 'merchandise' && event.itemDetails && (
                                <div className="border-t pt-6 mb-6">
                                    <h3 className="text-lg font-semibold mb-4">Select Items</h3>
                                    <p className="text-gray-600 mb-4">{event.itemDetails.description}</p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Max {event.itemDetails.purchaseLimitPerUser} per user
                                    </p>
                                    
                                    <div className="space-y-4">
                                        {event.itemDetails.variants.map(variant => (
                                            <div key={variant._id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <span className="font-medium">{variant.size}</span>
                                                    <span className="ml-2 text-gray-600">- {variant.color}</span>
                                                    <span className="ml-4 text-indigo-600 font-medium">₹{variant.price}</span>
                                                    <span className="ml-4 text-sm text-gray-500">
                                                        Stock: {variant.stock}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            const current = selectedVariants.find(v => v.variantId === variant._id);
                                                            const newQty = Math.max(0, (current?.quantity || 0) - 1);
                                                            handleVariantChange(variant._id, newQty);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                                                        disabled={variant.stock === 0}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center">
                                                        {selectedVariants.find(v => v.variantId === variant._id)?.quantity || 0}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const current = selectedVariants.find(v => v.variantId === variant._id);
                                                            const newQty = Math.min(
                                                                event.itemDetails.purchaseLimitPerUser,
                                                                variant.stock,
                                                                (current?.quantity || 0) + 1
                                                            );
                                                            handleVariantChange(variant._id, newQty);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                                                        disabled={
                                                            variant.stock === 0 ||
                                                            (selectedVariants.find(v => v.variantId === variant._id)?.quantity || 0) >= variant.stock ||
                                                            (selectedVariants.reduce((sum, v) => sum + v.quantity, 0) || 0) >= event.itemDetails.purchaseLimitPerUser
                                                        }
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Registration Button */}
                            {!registration ? (
                                <div className="border-t pt-6">
                                    {blocked ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                            <p className="text-red-700 font-medium">Registration Blocked</p>
                                            <p className="text-sm text-red-600 mt-1">
                                                {deadlinePassed && 'Registration deadline has passed.'}
                                                {limitReached && 'Registration limit reached.'}
                                                {outOfStock && 'Items are out of stock.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={event.eventType === 'normal' 
                                                ? handleNormalRegistration 
                                                : handleMerchandiseRegistration
                                            }
                                            disabled={registering}
                                            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {registering 
                                                ? 'Processing...' 
                                                : event.eventType === 'normal' 
                                                    ? 'Register Now' 
                                                    : 'Place Order'
                                            }
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="border-t pt-6">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-700 font-medium mb-2">
                                            {event.eventType === 'normal' 
                                                ? 'Registration Successful!' 
                                                : 'Order Placed Successfully!'}
                                        </p>
                                        <p className="text-sm text-green-600 mb-3">
                                            Ticket ID: {registration.ticketId}
                                        </p>
                                        <button
                                            onClick={() => setRegistration(registration)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            View Ticket
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Calendar Integration Section */}
                            {user && (
                                <div className="border-t pt-6 mt-6">
                                    <h3 className="text-lg font-semibold mb-4">Add to Calendar</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={handleDownloadICS}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download .ics
                                        </button>
                                        <button
                                            onClick={handleGoogleCalendar}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Google Calendar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Forum Tab */
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <Forum />
                    </div>
                )}
            </div>

            {/* Ticket Modal */}
            {registration && (
                <TicketCard
                    registration={registration}
                    onClose={() => setRegistration(null)}
                />
            )}
        </div>
    );
};

export default EventDetails;