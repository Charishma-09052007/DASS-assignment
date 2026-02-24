import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { EVENT_TYPE_ICONS } from '../../utils/constants';
import { toast } from 'react-hot-toast';

const ClubDetails = () => {
    const { id } = useParams();
    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [isFollowing, setIsFollowing] = useState(false);
    const user = getCurrentUser();

    useEffect(() => {
        fetchClubDetails();
        fetchClubEvents();
    }, [id]);

    useEffect(() => {
        if (user?.followedClubs) {
            setIsFollowing(user.followedClubs.includes(id));
        }
    }, [user, id]);

    const fetchClubDetails = async () => {
        try {
            // Get club details from users/clubs endpoint
            const response = await API.get('/users/clubs');
            if (response.data.success) {
                const foundClub = response.data.data.find(c => c._id === id);
                if (foundClub) {
                    setClub(foundClub);
                } else {
                    toast.error('Club not found');
                }
            }
        } catch (error) {
            toast.error('Failed to fetch club details');
        }
    };

    const fetchClubEvents = async () => {
        try {
            const response = await API.get(`/events?organizerId=${id}`);
            if (response.data.success) {
                setEvents(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            const response = await API.post(`/users/follow/${id}`);
            if (response.data.success) {
                setIsFollowing(!isFollowing);
                toast.success(response.data.message);
                
                // Update local storage
                const updatedUser = { ...user };
                if (response.data.message === 'Followed') {
                    updatedUser.followedClubs = [...(updatedUser.followedClubs || []), id];
                } else {
                    updatedUser.followedClubs = updatedUser.followedClubs.filter(clubId => clubId !== id);
                }
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const filteredEvents = events.filter(event => {
        const now = new Date();
        if (activeTab === 'upcoming') {
            return new Date(event.eventStartDate) > now;
        } else {
            return new Date(event.eventEndDate) < now;
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Club not found</p>
                <Link to="/clubs" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                    Back to Clubs
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Club Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                    <div className="bg-indigo-600 px-6 py-8">
                        <h1 className="text-3xl font-bold text-white">{club.organizerDetails?.organizerName}</h1>
                        <p className="text-indigo-100 mt-2">{club.organizerDetails?.category}</p>
                    </div>

                    <div className="p-6">
                        {/* Description */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
                            <p className="text-gray-600">{club.organizerDetails?.description}</p>
                        </div>

                        {/* Contact Information */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h2>
                            <div className="space-y-2">
                                <div className="flex items-center text-gray-600">
                                    <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {club.organizerDetails?.contactEmail}
                                </div>
                            </div>
                        </div>

                        {/* Follow Button */}
                        <button
                            onClick={handleFollow}
                            className={`w-full py-3 px-4 rounded-lg transition-colors font-medium ${
                                isFollowing
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isFollowing ? 'Following' : 'Follow this Club'}
                        </button>
                    </div>
                </div>

                {/* Events Section */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'upcoming'
                                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Upcoming Events
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'past'
                                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Past Events
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {filteredEvents.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No {activeTab} events found
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {filteredEvents.map(event => (
                                    <Link
                                        key={event._id}
                                        to={`/events/${event._id}`}
                                        className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center mb-2">
                                                    <span className="text-xl mr-2">
                                                        {EVENT_TYPE_ICONS[event.eventType]}
                                                    </span>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {event.eventName}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                    {event.eventDescription}
                                                </p>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <span className="mr-4">
                                                        📅 {new Date(event.eventStartDate).toLocaleDateString()}
                                                    </span>
                                                    <span>
                                                        💰 {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                event.eventType === 'normal'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {event.eventType}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDetails;