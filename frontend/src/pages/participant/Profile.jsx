
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { toast } from 'react-hot-toast';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const user = getCurrentUser();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await API.get('/users/profile');
            if (response.data.success) {
                setProfile(response.data.data);
                setFormData({
                    firstName: response.data.data.firstName,
                    lastName: response.data.data.lastName,
                    contactNumber: response.data.data.contactNumber,
                    collegeName: response.data.data.collegeName || '',
                    interests: response.data.data.interests || []
                });
            }
        } catch (error) {
            toast.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInterestsChange = (e) => {
        const interests = e.target.value.split(',').map(i => i.trim());
        setFormData(prev => ({ ...prev, interests }));
    };

    const handleSaveProfile = async () => {
        try {
            const response = await API.put('/users/profile', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                contactNumber: formData.contactNumber,
                collegeName: formData.collegeName,
                interests: formData.interests
            });
            
            if (response.data.success) {
                toast.success('Profile updated successfully');
                setEditing(false);
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        
        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        try {
            const response = await API.put('/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (response.data.success) {
                toast.success('Password changed successfully');
                setChangingPassword(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '16rem' 
            }}>
                <div style={{
                    border: '2px solid #f3f4f6',
                    borderTopColor: '#4f46e5',
                    borderRadius: '50%',
                    width: '3rem',
                    height: '3rem',
                    animation: 'spin 1s linear infinite'
                }} />
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#f3f4f6', 
            padding: '2rem 0' 
        }}>
            <div style={{ 
                maxWidth: '48rem', 
                margin: '0 auto', 
                padding: '0 1rem' 
            }}>
                <h1 style={{ 
                    fontSize: '1.875rem', 
                    fontWeight: 'bold', 
                    color: '#111827', 
                    marginBottom: '2rem' 
                }}>
                    My Profile
                </h1>

                <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '0.5rem', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    {/* Profile Header */}
                    <div style={{ 
                        backgroundColor: '#4f46e5', 
                        padding: '1rem 1.5rem' 
                    }}>
                        <h2 style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '600', 
                            color: 'white' 
                        }}>
                            Personal Information
                        </h2>
                    </div>

                    {/* Profile Content */}
                    <div style={{ padding: '1.5rem' }}>
                        {/* Non-Editable Fields */}
                        <div style={{ 
                            marginBottom: '1.5rem', 
                            paddingBottom: '1.5rem', 
                            borderBottom: '1px solid #e5e7eb' 
                        }}>
                            <h3 style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '500', 
                                color: '#6b7280', 
                                marginBottom: '0.75rem' 
                            }}>
                                Account Information (Cannot be changed)
                            </h3>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: '1rem' 
                            }}>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.875rem', 
                                        color: '#4b5563' 
                                    }}>
                                        Email
                                    </label>
                                    <p style={{ 
                                        marginTop: '0.25rem', 
                                        color: '#111827', 
                                        backgroundColor: '#f9fafb', 
                                        padding: '0.5rem', 
                                        borderRadius: '0.375rem' 
                                    }}>
                                        {profile?.email}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.875rem', 
                                        color: '#4b5563' 
                                    }}>
                                        Participant Type
                                    </label>
                                    <p style={{ 
                                        marginTop: '0.25rem', 
                                        color: '#111827', 
                                        backgroundColor: '#f9fafb', 
                                        padding: '0.5rem', 
                                        borderRadius: '0.375rem',
                                        textTransform: 'capitalize'
                                    }}>
                                        {profile?.participantType || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div style={{ 
                            marginBottom: '1.5rem', 
                            paddingBottom: '1.5rem', 
                            borderBottom: '1px solid #e5e7eb' 
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: '0.75rem' 
                            }}>
                                <h3 style={{ 
                                    fontSize: '0.875rem', 
                                    fontWeight: '500', 
                                    color: '#6b7280' 
                                }}>
                                    Personal Details
                                </h3>
                                <button
                                    onClick={() => setEditing(!editing)}
                                    style={{
                                        color: '#4f46e5',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(2, 1fr)', 
                                        gap: '1rem' 
                                    }}>
                                        <div>
                                            <label style={{ 
                                                display: 'block', 
                                                fontSize: '0.875rem', 
                                                fontWeight: '500', 
                                                color: '#374151', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ 
                                                display: 'block', 
                                                fontSize: '0.875rem', 
                                                fontWeight: '500', 
                                                color: '#374151', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            fontWeight: '500', 
                                            color: '#374151', 
                                            marginBottom: '0.25rem' 
                                        }}>
                                            Contact Number
                                        </label>
                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            fontWeight: '500', 
                                            color: '#374151', 
                                            marginBottom: '0.25rem' 
                                        }}>
                                            College/Organization
                                        </label>
                                        <input
                                            type="text"
                                            name="collegeName"
                                            value={formData.collegeName}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            fontWeight: '500', 
                                            color: '#374151', 
                                            marginBottom: '0.25rem' 
                                        }}>
                                            Interests (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.interests?.join(', ')}
                                            onChange={handleInterestsChange}
                                            placeholder="coding, music, sports"
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'flex-end', 
                                        gap: '0.75rem' 
                                    }}>
                                        <button
                                            onClick={() => setEditing(false)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                backgroundColor: 'white',
                                                color: '#374151',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                backgroundColor: '#4f46e5',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: '1rem' 
                                }}>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            color: '#4b5563' 
                                        }}>
                                            First Name
                                        </label>
                                        <p style={{ 
                                            marginTop: '0.25rem', 
                                            color: '#111827' 
                                        }}>
                                            {profile?.firstName}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            color: '#4b5563' 
                                        }}>
                                            Last Name
                                        </label>
                                        <p style={{ 
                                            marginTop: '0.25rem', 
                                            color: '#111827' 
                                        }}>
                                            {profile?.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            color: '#4b5563' 
                                        }}>
                                            Contact Number
                                        </label>
                                        <p style={{ 
                                            marginTop: '0.25rem', 
                                            color: '#111827' 
                                        }}>
                                            {profile?.contactNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            color: '#4b5563' 
                                        }}>
                                            College/Organization
                                        </label>
                                        <p style={{ 
                                            marginTop: '0.25rem', 
                                            color: '#111827' 
                                        }}>
                                            {profile?.collegeName || 'Not provided'}
                                        </p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            color: '#4b5563' 
                                        }}>
                                            Interests
                                        </label>
                                        <div style={{ 
                                            marginTop: '0.25rem', 
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                            gap: '0.5rem' 
                                        }}>
                                            {profile?.interests?.length > 0 ? (
                                                profile.interests.map(interest => (
                                                    <span key={interest} style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#e0e7ff',
                                                        color: '#4f46e5',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {interest}
                                                    </span>
                                                ))
                                            ) : (
                                                <p style={{ color: '#6b7280' }}>No interests selected</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Followed Clubs */}
                        <div style={{ 
                            marginBottom: '1.5rem', 
                            paddingBottom: '1.5rem', 
                            borderBottom: '1px solid #e5e7eb' 
                        }}>
                            <h3 style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '500', 
                                color: '#6b7280', 
                                marginBottom: '0.75rem' 
                            }}>
                                Followed Clubs
                            </h3>
                            {profile?.followedClubs?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {profile.followedClubs.map(club => (
                                        <div key={club._id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            backgroundColor: '#f9fafb',
                                            borderRadius: '0.5rem'
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: '500' }}>{club.organizerDetails?.organizerName}</p>
                                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{club.organizerDetails?.category}</p>
                                            </div>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Following</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#6b7280' }}>Not following any clubs</p>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div>
                            <h3 style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '500', 
                                color: '#6b7280', 
                                marginBottom: '0.75rem' 
                            }}>
                                Security Settings
                            </h3>
                            
                            {!changingPassword ? (
                                <button
                                    onClick={() => setChangingPassword(true)}
                                    style={{
                                        color: '#4f46e5',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Change Password
                                </button>
                            ) : (
                                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            fontWeight: '500', 
                                            color: '#374151', 
                                            marginBottom: '0.25rem' 
                                        }}>
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '1rem'
                                            }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            fontWeight: '500', 
                                            color: '#374151', 
                                            marginBottom: '0.25rem' 
                                        }}>
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '1rem'
                                            }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontSize: '0.875rem', 
                                            fontWeight: '500', 
                                            color: '#374151', 
                                            marginBottom: '0.25rem' 
                                        }}>
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '1rem'
                                            }}
                                            required
                                        />
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'flex-end', 
                                        gap: '0.75rem' 
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => setChangingPassword(false)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                backgroundColor: 'white',
                                                color: '#374151',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                backgroundColor: '#4f46e5',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
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

export default Profile;