import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { REGISTRATION_STATUS, STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

const TicketCard = ({ registration, onClose }) => {
    const downloadTicket = () => {
        const canvas = document.getElementById('qrcode');
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ticket-${registration.ticketId}.png`;
        link.href = url;
        link.click();
    };

    // Status color mapping (if STATUS_COLORS provides class names, we'll convert to style)
    const getStatusStyle = (status) => {
        const colorMap = {
            'registered': { bg: '#dbeafe', text: '#1e40af' },
            'pending': { bg: '#fed7aa', text: '#92400e' },
            'approved': { bg: '#d1fae5', text: '#065f46' },
            'rejected': { bg: '#fee2e2', text: '#991b1b' },
            'cancelled': { bg: '#e5e7eb', text: '#374151' },
            'completed': { bg: '#e9d5ff', text: '#6b21a8' },
            'attended': { bg: '#cffafe', text: '#0891b2' }
        };
        return colorMap[status] || { bg: '#e5e7eb', text: '#374151' };
    };

    const statusStyle = getStatusStyle(registration.status);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            overflow: 'auto',
            zIndex: 50
        }}>
            <div style={{
                position: 'relative',
                top: '80px',
                margin: '0 auto',
                padding: '20px',
                border: '1px solid #e5e7eb',
                width: '400px',
                maxWidth: '90%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                backgroundColor: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        lineHeight: '1.5rem',
                        fontWeight: '500',
                        color: '#111827',
                        marginBottom: '1rem'
                    }}>
                        Your Ticket
                    </h3>
                    
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Ticket ID</p>
                        <p style={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#4f46e5'
                        }}>
                            {registration.ticketId}
                        </p>
                        
                        <div style={{
                            marginTop: '1rem',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <QRCodeCanvas
                                id="qrcode"
                                value={JSON.stringify({
                                    ticketId: registration.ticketId,
                                    eventId: registration.eventId._id,
                                    participantId: registration.participantId
                                })}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        
                        <div style={{
                            marginTop: '1rem',
                            textAlign: 'left'
                        }}>
                            <p>
                                <span style={{ fontWeight: '600' }}>Event:</span>{' '}
                                {registration.eventId.eventName}
                            </p>
                            <p>
                                <span style={{ fontWeight: '600' }}>Type:</span>{' '}
                                {registration.eventId.eventType}
                            </p>
                            <p>
                                <span style={{ fontWeight: '600' }}>Status:</span>{' '}
                                <span style={{
                                    marginLeft: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.text
                                }}>
                                    {STATUS_LABELS[registration.status]}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <button
                            onClick={downloadTicket}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
                        >
                            Download QR
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#e5e7eb',
                                color: '#1f2937',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#d1d5db'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;