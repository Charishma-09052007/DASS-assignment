import API from './api';

export const login = async (email, password) => {
    try {
        const response = await API.post('/auth/login', { email, password });
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
};

export const register = async (userData) => {
    try {
        const response = await API.post('/auth/register', userData);
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};