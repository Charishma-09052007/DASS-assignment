import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

const ManageClubs = () => {
    const [clubs, setClubs] = useState([]);
    const [deletedClubs, setDeletedClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const [formData, setFormData] = useState({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: ''
    });
    const [newCredentials, setNewCredentials] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchClubs();
        fetchDeletedClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const response = await API.get('/admin/clubs');
            if (response.data.success) {
                setClubs(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch clubs');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeletedClubs = async () => {
        try {
            const response = await API.get('/admin/clubs/deleted');
            if (response.data.success) {
                setDeletedClubs(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch deleted clubs');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateClub = async (e) => {
        e.preventDefault();
        try {
            const response = await API.post('/admin/clubs', formData);
            if (response.data.success) {
                setNewCredentials(response.data.data.credentials);
                toast.success('Club created successfully');
                setFormData({
                    organizerName: '',
                    category: '',
                    description: '',
                    contactEmail: ''
                });
                fetchClubs();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create club');
        }
    };

    const handleDisableClub = async (clubId) => {
        if (window.confirm('Are you sure you want to disable this club? They will not be able to login.')) {
            try {
                const response = await API.patch(`/admin/clubs/${clubId}/disable`);
                if (response.data.success) {
                    toast.success('Club disabled successfully');
                    fetchClubs();
                    fetchDeletedClubs();
                }
            } catch (error) {
                toast.error('Failed to disable club');
            }
        }
    };

    const handleRestoreClub = async (clubId) => {
        try {
            const response = await API.patch(`/admin/clubs/${clubId}/restore`);
            if (response.data.success) {
                toast.success('Club restored successfully');
                fetchClubs();
                fetchDeletedClubs();
            }
        } catch (error) {
            toast.error('Failed to restore club');
        }
    };

    const handlePermanentDelete = async (clubId) => {
        if (window.confirm('Are you sure you want to permanently delete this club? This action cannot be undone.')) {
            try {
                const response = await API.delete(`/admin/clubs/${clubId}`);
                if (response.data.success) {
                    toast.success('Club permanently deleted');
                    fetchDeletedClubs();
                }
            } catch (error) {
                toast.error('Failed to delete club');
            }
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Manage Clubs & Organizers</h1>
                    <div>
                        <button
                            onClick={() => setShowDeleted(!showDeleted)}
                            style={{ marginRight: '1rem', padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                        >
                            {showDeleted ? 'Show Active Clubs' : 'Show Deleted Clubs'}
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                        >
                            + Add New Club
                        </button>
                    </div>
                </div>

                {/* Clubs List */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Club Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Contact Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showDeleted ? deletedClubs : clubs).length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                        No clubs found
                                    </td>
                                </tr>
                            ) : (
                                (showDeleted ? deletedClubs : clubs).map(club => (
                                    <tr key={club._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem' }}>{club.organizerDetails?.organizerName || club.firstName + ' ' + club.lastName}</td>
                                        <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{club.organizerDetails?.category || 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>{club.email}</td>
                                        <td style={{ padding: '1rem' }}>{club.organizerDetails?.contactEmail || club.email}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(club.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                backgroundColor: club.isActive ? '#d1fae5' : '#fee2e2',
                                                color: club.isActive ? '#065f46' : '#991b1b'
                                            }}>
                                                {club.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {club.isActive ? (
                                                <button
                                                    onClick={() => handleDisableClub(club._id)}
                                                    style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                                >
                                                    Disable
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleRestoreClub(club._id)}
                                                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                                    >
                                                        Restore
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(club._id)}
                                                        style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                                    >
                                                        Delete Permanently
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Club Modal */}
                {showAddModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '0.5rem',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New Club</h2>
                            
                            {newCredentials ? (
                                <div>
                                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.375rem' }}>
                                        <h3 style={{ fontWeight: '600', color: '#065f46', marginBottom: '0.5rem' }}>Club Created Successfully!</h3>
                                        <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {newCredentials.email}</p>
                                        <p style={{ marginBottom: '1rem' }}><strong>Password:</strong> {newCredentials.password}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#065f46' }}>Share these credentials with the club organizer.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <button
                                            onClick={() => copyToClipboard(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`)}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Copy Credentials
                                        </button>
                                        <button
                                            onClick={() => {
                                                setNewCredentials(null);
                                                setShowAddModal(false);
                                            }}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateClub}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Organizer Name *</label>
                                        <input
                                            type="text"
                                            name="organizerName"
                                            value={formData.organizerName}
                                            onChange={handleInputChange}
                                            required
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Category *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
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
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Contact Email (Optional)</label>
                                        <input
                                            type="email"
                                            name="contactEmail"
                                            value={formData.contactEmail}
                                            onChange={handleInputChange}
                                            placeholder="If different from login email"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                        />
                                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                            Login email will be auto-generated as: organizername@iiit.ac.in
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            Create Club
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ManageClubs;