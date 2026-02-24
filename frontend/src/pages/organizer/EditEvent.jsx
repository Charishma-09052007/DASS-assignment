import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import FormBuilder from '../../components/FormBuilder';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState(null);
    const [formData, setFormData] = useState({
        eventName: '',
        eventDescription: '',
        registrationDeadline: '',
        registrationFee: 0,
        eventStartDate: '',
        eventEndDate: '',
        eventTags: [],
        eligibility: 'everyone',
        registrationLimit: '',
        customForm: null,
        itemDetails: {
            name: '',
            description: '',
            variants: [],
            purchaseLimitPerUser: 1
        }
    });
    const [tagInput, setTagInput] = useState('');
    const [hasRegistrations, setHasRegistrations] = useState(false);

    useEffect(() => {
        fetchEvent();
        checkRegistrations();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await API.get(`/events/${id}`);
            if (response.data.success) {
                const eventData = response.data.data;
                setEvent(eventData);
                setFormData({
                    eventName: eventData.eventName,
                    eventDescription: eventData.eventDescription,
                    registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline).toISOString().slice(0, 16) : '',
                    registrationFee: eventData.registrationFee,
                    eventStartDate: eventData.eventStartDate ? new Date(eventData.eventStartDate).toISOString().slice(0, 16) : '',
                    eventEndDate: eventData.eventEndDate ? new Date(eventData.eventEndDate).toISOString().slice(0, 16) : '',
                    eventTags: eventData.eventTags || [],
                    eligibility: eventData.eligibility,
                    registrationLimit: eventData.registrationLimit || '',
                    customForm: eventData.customForm,
                    itemDetails: eventData.itemDetails || {
                        name: '',
                        description: '',
                        variants: [],
                        purchaseLimitPerUser: 1
                    }
                });
            }
        } catch (error) {
            toast.error('Failed to fetch event');
            navigate('/organizer/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const checkRegistrations = async () => {
        try {
            const response = await API.get(`/events/${id}/registrations`);
            if (response.data.success && response.data.count > 0) {
                setHasRegistrations(true);
            }
        } catch (error) {
            console.error('Failed to check registrations');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.eventTags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                eventTags: [...prev.eventTags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            eventTags: prev.eventTags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            itemDetails: {
                ...prev.itemDetails,
                variants: [
                    ...prev.itemDetails.variants,
                    { size: '', color: '', stock: 0, price: 0, sku: '' }
                ]
            }
        }));
    };

    const handleVariantChange = (index, field, value) => {
        const updatedVariants = [...formData.itemDetails.variants];
        updatedVariants[index][field] = value;
        setFormData(prev => ({
            ...prev,
            itemDetails: { ...prev.itemDetails, variants: updatedVariants }
        }));
    };

    const handleRemoveVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            itemDetails: {
                ...prev.itemDetails,
                variants: prev.itemDetails.variants.filter((_, i) => i !== index)
            }
        }));
    };

    const handleFormSave = (formFields) => {
        setFormData(prev => ({ ...prev, customForm: { fields: formFields } }));
    };

    const handleCloseRegistrations = async () => {
        try {
            const response = await API.patch(`/events/${id}/status`, { status: 'closed' });
            if (response.data.success) {
                toast.success('Registrations closed');
                fetchEvent();
            }
        } catch (error) {
            toast.error('Failed to close registrations');
        }
    };

    const handleExtendDeadline = async () => {
        try {
            const response = await API.put(`/events/${id}`, {
                registrationDeadline: formData.registrationDeadline
            });
            if (response.data.success) {
                toast.success('Deadline extended');
            }
        } catch (error) {
            toast.error('Failed to extend deadline');
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const updateData = { ...formData };
            
            // Different update rules based on event status
            if (event.status === 'draft') {
                // Can update everything
                const response = await API.put(`/events/${id}`, updateData);
                if (response.data.success) {
                    toast.success('Event updated successfully');
                    navigate(`/organizer/events/${id}`);
                }
            } else if (event.status === 'published') {
                // Can only update description, deadline, limit, and close registrations
                const response = await API.put(`/events/${id}`, {
                    eventDescription: updateData.eventDescription,
                    registrationDeadline: updateData.registrationDeadline,
                    registrationLimit: updateData.registrationLimit
                });
                if (response.data.success) {
                    toast.success('Event updated successfully');
                    navigate(`/organizer/events/${id}`);
                }
            } else {
                // Ongoing/Completed - no edits except status
                toast.error('Cannot edit event in current status');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ border: '4px solid #f3f4f6', borderTopColor: '#4f46e5', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    const isDraft = event?.status === 'draft';
    const isPublished = event?.status === 'published';
    const isOngoingOrCompleted = ['ongoing', 'completed'].includes(event?.status);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Edit Event</h1>
                    <div>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            backgroundColor: event?.status === 'draft' ? '#6b7280' :
                                           event?.status === 'published' ? '#10b981' :
                                           event?.status === 'ongoing' ? '#f59e0b' : '#8b5cf6',
                            color: 'white'
                        }}>
                            {event?.status}
                        </span>
                    </div>
                </div>

                {hasRegistrations && event?.eventType === 'normal' && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
                        <p style={{ color: '#991b1b' }}>
                            ⚠️ This event already has registrations. The registration form is locked and cannot be edited.
                        </p>
                    </div>
                )}

                {isOngoingOrCompleted && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
                        <p style={{ color: '#991b1b' }}>
                            ⚠️ This event is {event?.status}. Only status changes are allowed.
                        </p>
                    </div>
                )}

                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {/* Basic Info - Editable based on status */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Basic Information</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Name</label>
                            <input
                                type="text"
                                name="eventName"
                                value={formData.eventName}
                                onChange={handleInputChange}
                                disabled={!isDraft}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                    cursor: !isDraft ? 'not-allowed' : 'text'
                                }}
                            />
                            {!isDraft && <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Event name cannot be changed after creation</p>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Description</label>
                            <textarea
                                name="eventDescription"
                                value={formData.eventDescription}
                                onChange={handleInputChange}
                                disabled={isOngoingOrCompleted}
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    backgroundColor: isOngoingOrCompleted ? '#f3f4f6' : 'white',
                                    cursor: isOngoingOrCompleted ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration Deadline</label>
                                <input
                                    type="datetime-local"
                                    name="registrationDeadline"
                                    value={formData.registrationDeadline}
                                    onChange={handleInputChange}
                                    disabled={isOngoingOrCompleted}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: isOngoingOrCompleted ? '#f3f4f6' : 'white',
                                        cursor: isOngoingOrCompleted ? 'not-allowed' : 'text'
                                    }}
                                />
                                {isPublished && (
                                    <button
                                        onClick={handleExtendDeadline}
                                        style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                                    >
                                        Extend Deadline
                                    </button>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration Fee (₹)</label>
                                <input
                                    type="number"
                                    name="registrationFee"
                                    value={formData.registrationFee}
                                    onChange={handleInputChange}
                                    disabled={!isDraft}
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                                <input
                                    type="datetime-local"
                                    name="eventStartDate"
                                    value={formData.eventStartDate}
                                    onChange={handleInputChange}
                                    disabled={!isDraft}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
                                <input
                                    type="datetime-local"
                                    name="eventEndDate"
                                    value={formData.eventEndDate}
                                    onChange={handleInputChange}
                                    disabled={!isDraft}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tags</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Add a tag"
                                    disabled={!isDraft}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                />
                                {isDraft && (
                                    <button
                                        onClick={handleAddTag}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        Add
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {formData.eventTags.map(tag => (
                                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', backgroundColor: '#e0e7ff', borderRadius: '9999px' }}>
                                        #{tag}
                                        {isDraft && (
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                style={{ marginLeft: '0.25rem', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Eligibility</label>
                            <select
                                name="eligibility"
                                value={formData.eligibility}
                                onChange={handleInputChange}
                                disabled={!isDraft}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                    cursor: !isDraft ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="everyone">Everyone</option>
                                <option value="iiit-only">IIIT Students Only</option>
                                <option value="non-iiit-only">Non-IIIT Only</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration Limit</label>
                            <input
                                type="number"
                                name="registrationLimit"
                                value={formData.registrationLimit}
                                onChange={handleInputChange}
                                disabled={isOngoingOrCompleted}
                                min="1"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    backgroundColor: isOngoingOrCompleted ? '#f3f4f6' : 'white',
                                    cursor: isOngoingOrCompleted ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>
                    </div>

                    {/* Type-specific sections */}
                    {event?.eventType === 'merchandise' && (
                        <div style={{ marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Item Details</h2>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Item Name</label>
                                <input
                                    type="text"
                                    value={formData.itemDetails.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        itemDetails: { ...prev.itemDetails, name: e.target.value }
                                    }))}
                                    disabled={!isDraft}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Item Description</label>
                                <textarea
                                    value={formData.itemDetails.description}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        itemDetails: { ...prev.itemDetails, description: e.target.value }
                                    }))}
                                    disabled={!isDraft}
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Purchase Limit Per User</label>
                                <input
                                    type="number"
                                    value={formData.itemDetails.purchaseLimitPerUser}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        itemDetails: { ...prev.itemDetails, purchaseLimitPerUser: parseInt(e.target.value) }
                                    }))}
                                    disabled={!isDraft}
                                    min="1"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                        cursor: !isDraft ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ fontWeight: '500' }}>Variants</label>
                                    {isDraft && (
                                        <button
                                            onClick={handleAddVariant}
                                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            + Add Variant
                                        </button>
                                    )}
                                </div>
                                
                                {formData.itemDetails.variants.map((variant, index) => (
                                    <div key={index} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Size"
                                                value={variant.size}
                                                onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                                disabled={!isDraft}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                                    cursor: !isDraft ? 'not-allowed' : 'text'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Color"
                                                value={variant.color}
                                                onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                                disabled={!isDraft}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                                    cursor: !isDraft ? 'not-allowed' : 'text'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <input
                                                type="number"
                                                placeholder="Stock"
                                                value={variant.stock}
                                                onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                                                disabled={!isDraft}
                                                min="0"
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                                    cursor: !isDraft ? 'not-allowed' : 'text'
                                                }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={variant.price}
                                                onChange={(e) => handleVariantChange(index, 'price', parseInt(e.target.value))}
                                                disabled={!isDraft}
                                                min="0"
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                                    cursor: !isDraft ? 'not-allowed' : 'text'
                                                }}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="SKU (optional)"
                                            value={variant.sku}
                                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                            disabled={!isDraft}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                marginBottom: '0.5rem',
                                                backgroundColor: !isDraft ? '#f3f4f6' : 'white',
                                                cursor: !isDraft ? 'not-allowed' : 'text'
                                            }}
                                        />
                                        {isDraft && (
                                            <button
                                                onClick={() => handleRemoveVariant(index)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {event?.eventType === 'normal' && !hasRegistrations && isDraft && (
                        <div style={{ marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Registration Form</h2>
                            <FormBuilder 
                                onSave={handleFormSave} 
                                initialFields={formData.customForm?.fields || []} 
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                        <button
                            onClick={() => navigate(`/organizer/events/${id}`)}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <div>
                            {isPublished && (
                                <button
                                    onClick={handleCloseRegistrations}
                                    style={{ marginRight: '1rem', padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                >
                                    Close Registrations
                                </button>
                            )}
                            {!isOngoingOrCompleted && (
                                <button
                                    onClick={handleUpdate}
                                    disabled={saving}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
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

export default EditEvent;