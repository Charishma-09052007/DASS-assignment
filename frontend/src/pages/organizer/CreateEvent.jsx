import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import FormBuilder from '../../components/FormBuilder';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        eventName: '',
        eventDescription: '',
        eventType: 'normal',
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
    const [loading, setLoading] = useState(false);

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

    const validateStep1 = () => {
        if (!formData.eventName) return 'Event name is required';
        if (!formData.eventDescription) return 'Event description is required';
        if (!formData.registrationDeadline) return 'Registration deadline is required';
        if (!formData.eventStartDate) return 'Event start date is required';
        if (!formData.eventEndDate) return 'Event end date is required';
        
        const deadline = new Date(formData.registrationDeadline);
        const start = new Date(formData.eventStartDate);
        const end = new Date(formData.eventEndDate);
        const now = new Date();

        if (deadline < now) return 'Registration deadline must be in the future';
        if (start < deadline) return 'Event start date must be after registration deadline';
        if (end < start) return 'Event end date must be after start date';

        return null;
    };

    const validateStep2 = () => {
        if (formData.eventType === 'merchandise') {
            if (!formData.itemDetails.name) return 'Item name is required';
            if (formData.itemDetails.variants.length === 0) return 'At least one variant is required';
            
            for (let i = 0; i < formData.itemDetails.variants.length; i++) {
                const v = formData.itemDetails.variants[i];
                if (!v.size) return `Variant ${i + 1}: Size is required`;
                if (!v.color) return `Variant ${i + 1}: Color is required`;
                if (v.stock <= 0) return `Variant ${i + 1}: Stock must be greater than 0`;
                if (v.price < 0) return `Variant ${i + 1}: Price cannot be negative`;
            }
        }
        return null;
    };

    const handleSaveDraft = async () => {
        const error = validateStep1();
        if (error) {
            toast.error(error);
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/events', {
                ...formData,
                status: 'draft'
            });
            
            if (response.data.success) {
                toast.success('Event saved as draft');
                navigate(`/organizer/events/${response.data.data._id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        const error1 = validateStep1();
        if (error1) {
            toast.error(error1);
            setStep(1);
            return;
        }

        const error2 = validateStep2();
        if (error2) {
            toast.error(error2);
            setStep(2);
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/events', {
                ...formData,
                status: 'published'
            });
            
            if (response.data.success) {
                toast.success('Event published successfully');
                navigate(`/organizer/events/${response.data.data._id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
                    Create New Event
                </h1>

                {/* Progress Steps */}
                <div style={{ display: 'flex', marginBottom: '2rem', position: 'relative' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            margin: '0 auto',
                            borderRadius: '50%',
                            backgroundColor: step >= 1 ? '#4f46e5' : '#d1d5db',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>1</div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: step >= 1 ? '#4f46e5' : '#6b7280' }}>
                            Basic Info
                        </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            margin: '0 auto',
                            borderRadius: '50%',
                            backgroundColor: step >= 2 ? '#4f46e5' : '#d1d5db',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>2</div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: step >= 2 ? '#4f46e5' : '#6b7280' }}>
                            {formData.eventType === 'merchandise' ? 'Item Details' : 'Registration Form'}
                        </p>
                    </div>
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Basic Information</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Name *</label>
                            <input
                                type="text"
                                name="eventName"
                                value={formData.eventName}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Description *</label>
                            <textarea
                                name="eventDescription"
                                value={formData.eventDescription}
                                onChange={handleInputChange}
                                rows="4"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Event Type *</label>
                            <select
                                name="eventType"
                                value={formData.eventType}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            >
                                <option value="normal">Normal Event</option>
                                <option value="merchandise">Merchandise Event</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration Deadline *</label>
                                <input
                                    type="datetime-local"
                                    name="registrationDeadline"
                                    value={formData.registrationDeadline}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration Fee (₹)</label>
                                <input
                                    type="number"
                                    name="registrationFee"
                                    value={formData.registrationFee}
                                    onChange={handleInputChange}
                                    min="0"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date *</label>
                                <input
                                    type="datetime-local"
                                    name="eventStartDate"
                                    value={formData.eventStartDate}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date *</label>
                                <input
                                    type="datetime-local"
                                    name="eventEndDate"
                                    value={formData.eventEndDate}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    required
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
                                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                />
                                <button
                                    onClick={handleAddTag}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                >
                                    Add
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {formData.eventTags.map(tag => (
                                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', backgroundColor: '#e0e7ff', borderRadius: '9999px' }}>
                                        #{tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            style={{ marginLeft: '0.25rem', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Eligibility *</label>
                            <select
                                name="eligibility"
                                value={formData.eligibility}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            >
                                <option value="everyone">Everyone</option>
                                <option value="iiit-only">IIIT Students Only</option>
                                <option value="non-iiit-only">Non-IIIT Only</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Registration Limit (leave empty for unlimited)</label>
                            <input
                                type="number"
                                name="registrationLimit"
                                value={formData.registrationLimit}
                                onChange={handleInputChange}
                                min="1"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                            <button
                                onClick={() => navigate('/organizer/dashboard')}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <div>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={loading}
                                    style={{ marginRight: '1rem', padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                >
                                    Next: {formData.eventType === 'merchandise' ? 'Item Details' : 'Form Builder'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Type-specific details */}
                {step === 2 && (
                    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            {formData.eventType === 'merchandise' ? 'Item Details' : 'Registration Form Builder'}
                        </h2>

                        {formData.eventType === 'merchandise' ? (
                            // Merchandise Details
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Item Name *</label>
                                    <input
                                        type="text"
                                        value={formData.itemDetails.name}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            itemDetails: { ...prev.itemDetails, name: e.target.value }
                                        }))}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                        required
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
                                        rows="3"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
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
                                        min="1"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <label style={{ fontWeight: '500' }}>Variants *</label>
                                        <button
                                            onClick={handleAddVariant}
                                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                        >
                                            + Add Variant
                                        </button>
                                    </div>
                                    
                                    {formData.itemDetails.variants.map((variant, index) => (
                                        <div key={index} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Size (e.g., M, L, XL)"
                                                    value={variant.size}
                                                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Color"
                                                    value={variant.color}
                                                    onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Stock"
                                                    value={variant.stock}
                                                    onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                                                    min="0"
                                                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={variant.price}
                                                    onChange={(e) => handleVariantChange(index, 'price', parseInt(e.target.value))}
                                                    min="0"
                                                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="SKU (optional)"
                                                value={variant.sku}
                                                onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                                            />
                                            <button
                                                onClick={() => handleRemoveVariant(index)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Form Builder for Normal Events
                            <FormBuilder onSave={handleFormSave} />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={loading}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                            >
                                {loading ? 'Publishing...' : 'Publish Event'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateEvent;