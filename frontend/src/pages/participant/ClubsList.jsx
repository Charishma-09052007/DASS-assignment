import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { toast } from 'react-hot-toast';

const ClubsList = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState({});
    const user = getCurrentUser();

    useEffect(() => {
        fetchClubs();
        if (user?.followedClubs) {
            const followMap = {};
            user.followedClubs.forEach(clubId => {
                followMap[clubId] = true;
            });
            setFollowing(followMap);
        }
    }, []);

    const fetchClubs = async () => {
        try {
            const response = await API.get('/users/clubs');
            if (response.data.success) {
                setClubs(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch clubs');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (clubId) => {
        try {
            const response = await API.post(`/users/follow/${clubId}`);
            if (response.data.success) {
                setFollowing(prev => ({
                    ...prev,
                    [clubId]: !prev[clubId]
                }));
                toast.success(response.data.message);
                
                // Update local storage user data
                const updatedUser = { ...user };
                if (response.data.message === 'Followed') {
                    updatedUser.followedClubs = [...(updatedUser.followedClubs || []), clubId];
                } else {
                    updatedUser.followedClubs = updatedUser.followedClubs.filter(id => id !== clubId);
                }
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Clubs & Organizations</h1>

                {clubs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500 text-lg">No clubs found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clubs.map(club => (
                            <div key={club._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    {/* Club Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                <Link to={`/clubs/${club._id}`} className="hover:text-indigo-600">
                                                    {club.organizerDetails?.organizerName}
                                                </Link>
                                            </h2>
                                            <p className="text-sm text-indigo-600 mt-1">
                                                {club.organizerDetails?.category}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            club.organizerDetails?.category === 'technical' ? 'bg-blue-100 text-blue-800' :
                                            club.organizerDetails?.category === 'cultural' ? 'bg-purple-100 text-purple-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {club.organizerDetails?.category}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {club.organizerDetails?.description}
                                    </p>

                                    {/* Contact Email */}
                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {club.organizerDetails?.contactEmail}
                                    </div>

                                    {/* Follow/Unfollow Button */}
                                    <button
                                        onClick={() => handleFollow(club._id)}
                                        className={`w-full py-2 px-4 rounded-md transition-colors font-medium ${
                                            following[club._id]
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                    >
                                        {following[club._id] ? 'Following' : 'Follow'}
                                    </button>

                                    {/* View Details Link */}
                                    <div className="mt-3 text-center">
                                        <Link
                                            to={`/clubs/${club._id}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-800"
                                        >
                                            View Details →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsList;