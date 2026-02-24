import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { toast } from 'react-hot-toast';

const OrganizerProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        contactNumber: '',
        organizerDetails: {
            organizerName: '',
            category: '',
            description: '',
            contactEmail: ''
        }
    });
    const [discordWebhook, setDiscordWebhook] = useState('');
    const [showWebhookInput, setShowWebhookInput] = useState(false);

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
                    organizerDetails: response.data.data.organizerDetails || {
                        organizerName: '',
                        category: '',
                        description: '',
                        contactEmail: response.data.data.email || ''
                    }
                });
                setDiscordWebhook(response.data.data.organizerDetails?.discordWebhook || '');
            }
        } catch (error) {
            toast.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('organizer.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                organizerDetails: {
                    ...prev.organizerDetails,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveProfile = async () => {
        try {
            const response = await API.put('/organizer/profile', formData);
            if (response.data.success) {
                toast.success('Profile updated successfully');
                setEditing(false);
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleSaveWebhook = async () => {
        try {
            const response = await API.post('/organizer/discord-webhook', { webhookUrl: discordWebhook });
            if (response.data.success) {
                toast.success('Discord webhook saved successfully');
                setShowWebhookInput(false);
                fetchProfile();
            }
        } catch (error) {
            toast.error('Failed to save webhook');
        }
    };

    const testDiscordWebhook = () => {
        toast.success('Test message sent to Discord (simulated)');
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
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
                    Organizer Profile
                </h1>

                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {/* Profile Header */}
                    <div style={{ backgroundColor: '#4f46e5', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>Organizer Information</h2>
                    </div>

                    {/* Profile Content */}
                    <div style={{ padding: '1.5rem' }}>
                        {/* Non-Editable Field */}
                        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.75rem' }}>
                                Account Email (Cannot be changed)
                            </h3>
                            <p style={{ padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', color: '#374151' }}>
                                {profile?.email}
                            </p>
                        </div>

                        {/* Editable Fields */}
                        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>Personal Information</h3>
                                <button
                                    onClick={() => setEditing(!editing)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: editing ? '#ef4444' : '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>

                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Contact Number</label>
                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e5e7eb' }}>
                                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>Organizer Details</h4>
                                        
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Organizer Name</label>
                                            <input
                                                type="text"
                                                name="organizer.organizerName"
                                                value={formData.organizerDetails.organizerName}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Category</label>
                                            <select
                                                name="organizer.category"
                                                value={formData.organizerDetails.category}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                            >
                                                <option value="">Select Category</option>
                                                <option value="technical">Technical</option>
                                                <option value="cultural">Cultural</option>
                                                <option value="sports">Sports</option>
                                                <option value="academic">Academic</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Description</label>
                                            <textarea
                                                name="organizer.description"
                                                value={formData.organizerDetails.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Contact Email</label>
                                            <input
                                                type="email"
                                                name="organizer.contactEmail"
                                                value={formData.organizerDetails.contactEmail}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <button
                                            onClick={handleSaveProfile}
                                            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>First Name</p>
                                            <p style={{ fontWeight: '500' }}>{profile?.firstName}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Last Name</p>
                                            <p style={{ fontWeight: '500' }}>{profile?.lastName}</p>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Contact Number</p>
                                        <p style={{ fontWeight: '500' }}>{profile?.contactNumber}</p>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Organizer Details</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Organizer Name</p>
                                                <p style={{ fontWeight: '500' }}>{profile?.organizerDetails?.organizerName || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Category</p>
                                                <p style={{ fontWeight: '500', textTransform: 'capitalize' }}>{profile?.organizerDetails?.category || 'Not set'}</p>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Description</p>
                                            <p>{profile?.organizerDetails?.description || 'No description provided'}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Contact Email</p>
                                            <p>{profile?.organizerDetails?.contactEmail || profile?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Discord Webhook Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>Discord Integration</h3>
                                {!showWebhookInput && (
                                    <button
                                        onClick={() => setShowWebhookInput(true)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        {discordWebhook ? 'Update Webhook' : 'Add Webhook'}
                                    </button>
                                )}
                            </div>

                            {showWebhookInput ? (
                                <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                                        Enter your Discord webhook URL to automatically post new events to a Discord channel.
                                    </p>
                                    <input
                                        type="url"
                                        value={discordWebhook}
                                        onChange={(e) => setDiscordWebhook(e.target.value)}
                                        placeholder="https://discord.com/api/webhooks/..."
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginBottom: '1rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={handleSaveWebhook}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Save Webhook
                                        </button>
                                        {discordWebhook && (
                                            <button
                                                onClick={testDiscordWebhook}
                                                style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                            >
                                                Test Webhook
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowWebhookInput(false)}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                discordWebhook ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '0.375rem' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>✅ Webhook configured</span>
                                        <button
                                            onClick={testDiscordWebhook}
                                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem' }}
                                        >
                                            Test
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                                        No Discord webhook configured. New events will not be posted to Discord.
                                    </p>
                                )
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

export default OrganizerProfile;