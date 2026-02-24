import React, { useState } from 'react';

const FormBuilder = ({ onSave, initialFields = [] }) => {
    const [fields, setFields] = useState(initialFields);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [currentField, setCurrentField] = useState({
        type: 'text',
        label: '',
        placeholder: '',
        required: false,
        options: []
    });

    const fieldTypes = [
        { value: 'text', label: 'Text Input' },
        { value: 'textarea', label: 'Text Area' },
        { value: 'number', label: 'Number' },
        { value: 'email', label: 'Email' },
        { value: 'tel', label: 'Phone' },
        { value: 'date', label: 'Date' },
        { value: 'select', label: 'Dropdown' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'radio', label: 'Radio Button' },
        { value: 'file', label: 'File Upload' }
    ];

    const handleAddField = () => {
        if (!currentField.label) {
            alert('Please enter a field label');
            return;
        }

        if (editingIndex >= 0) {
            const updatedFields = [...fields];
            updatedFields[editingIndex] = { ...currentField };
            setFields(updatedFields);
            setEditingIndex(-1);
        } else {
            setFields([...fields, { ...currentField }]);
        }

        setCurrentField({
            type: 'text',
            label: '',
            placeholder: '',
            required: false,
            options: []
        });
    };

    const handleEditField = (index) => {
        setEditingIndex(index);
        setCurrentField({ ...fields[index] });
    };

    const handleDeleteField = (index) => {
        if (window.confirm('Are you sure you want to delete this field?')) {
            setFields(fields.filter((_, i) => i !== index));
        }
    };

    const handleMoveUp = (index) => {
        if (index > 0) {
            const newFields = [...fields];
            [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
            setFields(newFields);
        }
    };

    const handleMoveDown = (index) => {
        if (index < fields.length - 1) {
            const newFields = [...fields];
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
            setFields(newFields);
        }
    };

    const handleAddOption = () => {
        setCurrentField({
            ...currentField,
            options: [...(currentField.options || []), '']
        });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...(currentField.options || [])];
        newOptions[index] = value;
        setCurrentField({ ...currentField, options: newOptions });
    };

    const handleRemoveOption = (index) => {
        const newOptions = [...(currentField.options || [])];
        newOptions.splice(index, 1);
        setCurrentField({ ...currentField, options: newOptions });
    };

    const handleSave = () => {
        onSave(fields);
        alert('Form configuration saved successfully!');
    };

    return (
        <div style={{ fontFamily: 'sans-serif' }}>
            {/* Field Editor */}
            <div style={{ 
                marginBottom: '2rem', 
                padding: '1.5rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
            }}>
                <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#111827'
                }}>
                    {editingIndex >= 0 ? '✏️ Edit Field' : '➕ Add New Field'}
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        Field Type
                    </label>
                    <select
                        value={currentField.type}
                        onChange={(e) => setCurrentField({ ...currentField, type: e.target.value })}
                        style={{ 
                            width: '100%', 
                            padding: '0.625rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            backgroundColor: 'white'
                        }}
                    >
                        {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        Field Label *
                    </label>
                    <input
                        type="text"
                        value={currentField.label}
                        onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                        placeholder="e.g., Full Name, Email, etc."
                        style={{ 
                            width: '100%', 
                            padding: '0.625rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        Placeholder (optional)
                    </label>
                    <input
                        type="text"
                        value={currentField.placeholder}
                        onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                        style={{ 
                            width: '100%', 
                            padding: '0.625rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={currentField.required}
                            onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
                            style={{ 
                                marginRight: '0.5rem',
                                width: '1rem',
                                height: '1rem',
                                cursor: 'pointer'
                            }}
                        />
                        <span>Required field</span>
                    </label>
                </div>

                {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && (
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontSize: '0.875rem', 
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Options
                        </label>
                        {(currentField.options || []).map((option, index) => (
                            <div key={index} style={{ 
                                display: 'flex', 
                                marginBottom: '0.5rem',
                                gap: '0.5rem'
                            }}>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    style={{ 
                                        flex: 1, 
                                        padding: '0.5rem', 
                                        border: '1px solid #d1d5db', 
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem'
                                    }}
                                />
                                <button
                                    onClick={() => handleRemoveOption(index)}
                                    style={{ 
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddOption}
                            style={{ 
                                marginTop: '0.5rem', 
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            + Add Option
                        </button>
                    </div>
                )}

                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    marginTop: '1rem'
                }}>
                    <button
                        onClick={handleAddField}
                        style={{ 
                            padding: '0.625rem 1.25rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            flex: 1
                        }}
                    >
                        {editingIndex >= 0 ? 'Update Field' : 'Add Field'}
                    </button>
                    {editingIndex >= 0 && (
                        <button
                            onClick={() => {
                                setEditingIndex(-1);
                                setCurrentField({
                                    type: 'text',
                                    label: '',
                                    placeholder: '',
                                    required: false,
                                    options: []
                                });
                            }}
                            style={{ 
                                padding: '0.625rem 1.25rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Fields List */}
            {fields.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        marginBottom: '1rem',
                        color: '#111827'
                    }}>
                        📋 Form Fields ({fields.length})
                    </h3>
                    {fields.map((field, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                marginBottom: '0.75rem',
                                backgroundColor: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    marginBottom: '0.25rem'
                                }}>
                                    <span style={{ 
                                        fontWeight: '600',
                                        color: '#111827'
                                    }}>
                                        {field.label}
                                    </span>
                                    {field.required && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.125rem 0.375rem',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            borderRadius: '9999px'
                                        }}>
                                            Required
                                        </span>
                                    )}
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '1rem',
                                    fontSize: '0.875rem',
                                    color: '#6b7280'
                                }}>
                                    <span>Type: {fieldTypes.find(t => t.value === field.type)?.label}</span>
                                    {field.placeholder && <span>Placeholder: "{field.placeholder}"</span>}
                                    {field.options?.length > 0 && (
                                        <span>Options: {field.options.length}</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: index === 0 ? '#d1d5db' : '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.125rem'
                                    }}
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === fields.length - 1}
                                    style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: index === fields.length - 1 ? '#d1d5db' : '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.125rem'
                                    }}
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => handleEditField(index)}
                                    style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteField(index)}
                                    style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem'
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Save Form Button */}
            {fields.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    marginTop: '1rem'
                }}>
                    <button
                        onClick={handleSave}
                        style={{ 
                            padding: '0.75rem 2rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        💾 Save Form Configuration
                    </button>
                </div>
            )}

            {/* Preview Section */}
            {fields.length > 0 && (
                <div style={{ 
                    marginTop: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.5rem',
                    border: '2px dashed #d1d5db'
                }}>
                    <h4 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        marginBottom: '1rem',
                        color: '#374151'
                    }}>
                        👁️ Preview
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {fields.map((field, index) => (
                            <div key={index}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#374151'
                                }}>
                                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        placeholder={field.placeholder}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            backgroundColor: 'white'
                                        }}
                                        rows="3"
                                        disabled
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            backgroundColor: 'white'
                                        }}
                                        disabled
                                    >
                                        <option value="">Select an option</option>
                                        {field.options?.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'radio' ? (
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {field.options?.map((opt, i) => (
                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <input type="radio" name={`preview-${index}`} disabled />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : field.type === 'checkbox' ? (
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {field.options?.map((opt, i) => (
                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <input type="checkbox" disabled />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : field.type === 'file' ? (
                                    <input
                                        type="file"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            backgroundColor: 'white'
                                        }}
                                        disabled
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            backgroundColor: 'white'
                                        }}
                                        disabled
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormBuilder;