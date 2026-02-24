export const EVENT_TYPES = {
    NORMAL: 'normal',
    MERCHANDISE: 'merchandise'
};

export const EVENT_TYPE_LABELS = {
    [EVENT_TYPES.NORMAL]: 'Normal Event',
    [EVENT_TYPES.MERCHANDISE]: 'Merchandise'
};

export const EVENT_TYPE_ICONS = {
    [EVENT_TYPES.NORMAL]: '🎪',
    [EVENT_TYPES.MERCHANDISE]: '🛍️'
};

export const ELIGIBILITY_TYPES = {
    EVERYONE: 'everyone',
    IIIT_ONLY: 'iiit-only',
    NON_IIIT_ONLY: 'non-iiit-only'
};

export const ELIGIBILITY_LABELS = {
    [ELIGIBILITY_TYPES.EVERYONE]: 'Everyone',
    [ELIGIBILITY_TYPES.IIIT_ONLY]: 'IIIT Students Only',
    [ELIGIBILITY_TYPES.NON_IIIT_ONLY]: 'Non-IIIT Only'
};

export const REGISTRATION_STATUS = {
    REGISTERED: 'registered',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    ATTENDED: 'attended'
};

export const STATUS_LABELS = {
    [REGISTRATION_STATUS.REGISTERED]: 'Registered',
    [REGISTRATION_STATUS.PENDING]: 'Pending Approval',
    [REGISTRATION_STATUS.APPROVED]: 'Approved',
    [REGISTRATION_STATUS.REJECTED]: 'Rejected',
    [REGISTRATION_STATUS.CANCELLED]: 'Cancelled',
    [REGISTRATION_STATUS.COMPLETED]: 'Completed',
    [REGISTRATION_STATUS.ATTENDED]: 'Attended'
};

export const STATUS_COLORS = {
    [REGISTRATION_STATUS.REGISTERED]: 'bg-green-100 text-green-800',
    [REGISTRATION_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [REGISTRATION_STATUS.APPROVED]: 'bg-blue-100 text-blue-800',
    [REGISTRATION_STATUS.REJECTED]: 'bg-red-100 text-red-800',
    [REGISTRATION_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
    [REGISTRATION_STATUS.COMPLETED]: 'bg-purple-100 text-purple-800',
    [REGISTRATION_STATUS.ATTENDED]: 'bg-indigo-100 text-indigo-800'
};