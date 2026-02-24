import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

const CreateClub = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: ''
    });
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await API.post('/admin/clubs', formData);
            if (response.data.success) {
                setCredentials(response.data.data.credentials);
                toast.success('Club created successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create club');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const handleDone = () => {
        navigate('/admin/clubs');
    };

    if (credentials) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Club Created Successfully!</h2>
                        
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.375rem' }}>
                            <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {credentials.email}</p>
                            <p style={{ marginBottom: '1rem' }}><strong>Password:</strong> {credentials.password}</p>
                            <p style={{ fontSize: '0.875rem', color: '#065f46' }}>
                                Share these credentials with the club organizer. They can login immediately.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => copyToClipboard(`Email: ${credentials.email}\nPassword: ${credentials.password}`)}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                                Copy Credentials
                            </button>
                            <button
                                onClick={handleDone}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
                    Create New Club
                </h1>

                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Organizer Name *</label>
                            <input
                                type="text"
                                name="organizerName"
                                value={formData.organizerName}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                placeholder="e.g., Robotics Club"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category *</label>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                placeholder="Describe the club's purpose and activities"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Contact Email (Optional)</label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                placeholder="public contact email"
                            />
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Login email will be auto-generated as: organizername@iiit.ac.in
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/clubs')}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                            >
                                {loading ? 'Creating...' : 'Create Club'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateClub;