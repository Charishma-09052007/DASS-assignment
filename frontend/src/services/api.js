import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

console.log("🌍 API BASE URL:", API_BASE_URL);

const API = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;