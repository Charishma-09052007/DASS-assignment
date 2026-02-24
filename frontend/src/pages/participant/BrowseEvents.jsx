import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, ELIGIBILITY_LABELS } from '../../utils/constants';
import { toast } from 'react-hot-toast';

const BrowseEvents = () => {
    const [events, setEvents] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        eventType: '',
        eligibility: '',
        dateRange: 'all',
        followedOnly: false
    });
    const [clubs, setClubs] = useState([]);
    const user = getCurrentUser();

    useEffect(() => {
        fetchEvents();
        fetchTrending();
        fetchClubs();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [filters]);

    const fetchEvents = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.eventType) params.append('type', filters.eventType);
            if (filters.eligibility) params.append('eligibility', filters.eligibility);
            
            const response = await API.get(`/events?${params.toString()}`);
            if (response.data.success) {
                let filteredEvents = response.data.data;
                
                // Client-side date filtering
                if (filters.dateRange !== 'all') {
                    const now = new Date();
                    filteredEvents = filteredEvents.filter(event => {
                        const eventDate = new Date(event.eventStartDate);
                        switch(filters.dateRange) {
                            case 'today':
                                return eventDate.toDateString() === now.toDateString();
                            case 'week':
                                const weekLater = new Date(now.setDate(now.getDate() + 7));
                                return eventDate <= weekLater;
                            case 'month':
                                const monthLater = new Date(now.setMonth(now.getMonth() + 1));
                                return eventDate <= monthLater;
                            default:
                                return true;
                        }
                    });
                }
                
                // Filter by followed clubs
                if (filters.followedOnly && user?.followedClubs) {
                    filteredEvents = filteredEvents.filter(event => 
                        user.followedClubs.includes(event.organizerId?._id)
                    );
                }
                
                setEvents(filteredEvents);
            }
        } catch (error) {
            toast.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };
const fetchTrending = async () => {
    try {
        // Try this instead
        const response = await API.get('/events?sort=registrations&limit=5');
        if (response.data.success) {
            // Format the data to match what your component expects
            const trendingData = response.data.data.slice(0,5).map(event => ({
                _id: event._id,
                eventName: event.eventName,
                registrations: event.currentRegistrations || 0
            }));
            setTrending(trendingData);
        }
    } catch (error) {
        console.error('Failed to fetch trending');
    }
};

    const fetchClubs = async () => {
        try {
            const response = await API.get('/users/clubs');
            if (response.data.success) {
                setClubs(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch clubs');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            eventType: '',
            eligibility: '',
            dateRange: 'all',
            followedOnly: false
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Events</h1>

                {/* Trending Section */}
                {trending.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="text-2xl mr-2">🔥</span>
                            Trending Now (Last 24h)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {trending.map(event => (
                                <Link
                                    key={event._id}
                                    to={`/events/${event._id}`}
                                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                                >
                                    <h3 className="font-semibold truncate">{event.eventName}</h3>
                                    <p className="text-sm text-gray-600">
                                        {event.registrations} registrations
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search events..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Event Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Event Type
                            </label>
                            <select
                                value={filters.eventType}
                                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Types</option>
                                <option value="normal">Normal Events</option>
                                <option value="merchandise">Merchandise</option>
                            </select>
                        </div>

                        {/* Eligibility Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Eligibility
                            </label>
                            <select
                                value={filters.eligibility}
                                onChange={(e) => handleFilterChange('eligibility', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All</option>
                                <option value="everyone">Everyone</option>
                                <option value="iiit-only">IIIT Only</option>
                                <option value="non-iiit-only">Non-IIIT Only</option>
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date Range
                            </label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        {/* Followed Clubs Toggle */}
                        <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={filters.followedOnly}
                                    onChange={(e) => handleFilterChange('followedOnly', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">My Clubs Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            Clear all filters
                        </button>
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500 text-lg">No events found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <Link
                                key={event._id}
                                to={`/events/${event._id}`}
                                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-2xl">
                                            {EVENT_TYPE_ICONS[event.eventType]}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            event.eventType === 'normal' 
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {EVENT_TYPE_LABELS[event.eventType]}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-semibold mb-2">{event.eventName}</h3>
                                    
                                    <p className="text-sm text-gray-600 mb-3">
by {event.organizerId?.organizerDetails?.organizerName || 
     event.organizerId?.firstName + ' ' + event.organizerId?.lastName || 
     'Coding Club'}                                    </p>

                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {event.eventDescription}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">📅</span>
                                            <span className="ml-1">
                                                {new Date(event.eventStartDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">💰</span>
                                            <span className="ml-1">
                                                {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                            </span>
                                        </div>
                                    </div>

                                    {event.eventTags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {event.eventTags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseEvents;