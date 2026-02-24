import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import './App.css'; // Import plain CSS

// Import all components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import Profile from './pages/participant/Profile';
import ClubsList from './pages/participant/ClubsList';
import ClubDetails from './pages/participant/ClubDetails';

// ===== NEW IMPORTS FOR TASK 10 =====
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEventDetails from './pages/organizer/OrganizerEventDetails';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import OrganizerProfile from './pages/organizer/OrganizerProfile';

// ===== NEW IMPORTS FOR TASK 11 =====
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageClubs from './pages/admin/ManageClubs';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';

// ===== UPDATED: API setup with better debug logging =====
console.log('🔍 All env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));
console.log('🔍 REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('🔍 Final API_BASE_URL:', API_BASE_URL);
console.log('🔍 Login endpoint will be:', `${API_BASE_URL}/auth/login`);

const API = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Export for use in other files
export { API, API_BASE_URL };

function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);
    const [showTestMode, setShowTestMode] = useState(false);

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            console.log('🔍 Attempting login to:', `${API_BASE_URL}/auth/login`);
            
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            });

            console.log('🔍 Login response:', response.data);

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
                setUser(response.data.data.user);
                setMessage('Login successful!');
                
                // Redirect after 1 second
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                setMessage(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('🔍 Login error:', error);
            console.error('🔍 Error response:', error.response);
            console.error('🔍 Error config:', error.config);
            
            if (error.code === 'ERR_NETWORK') {
                setMessage('Network error: Cannot connect to backend. Check if backend is running and CORS is configured.');
            } else if (error.response) {
                setMessage(`Server error (${error.response.status}): ${error.response.data?.message || error.message}`);
            } else {
                setMessage('Error: ' + error.message);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setMessage('Logged out');
        window.location.href = '/login';
    };

    // If in test mode, show your original test interface
    if (showTestMode) {
        if (user) {
            return (
                <div style={{ 
                    backgroundColor: '#f0f2f5', 
                    minHeight: '100vh',
                    padding: '20px'
                }}>
                    <div style={{ 
                        maxWidth: '800px', 
                        margin: '0 auto', 
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '30px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h1 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                Welcome, {user.firstName} {user.lastName}!
                            </h1>
                            <button 
                                onClick={() => setShowTestMode(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Switch to Full App
                            </button>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ color: '#555' }}>User Details:</h3>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            <p><strong>Type:</strong> {user.participantType || 'N/A'}</p>
                            <p><strong>College:</strong> {user.collegeName}</p>
                            <p><strong>Contact:</strong> {user.contactNumber}</p>
                        </div>
                        
                        <div style={{ 
                            marginTop: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px',
                            border: '1px solid #e9ecef'
                        }}>
                            <h4 style={{ marginTop: 0, color: '#495057' }}>LocalStorage Data:</h4>
                            <p><strong>Token:</strong> <span style={{ color: '#6c757d' }}>{localStorage.getItem('token')?.substring(0, 30)}...</span></p>
                            <p><strong>User:</strong></p>
                            <pre style={{ 
                                backgroundColor: '#e9ecef', 
                                padding: '10px', 
                                borderRadius: '5px',
                                overflow: 'auto'
                            }}>
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                        
                        <button 
                            onClick={handleLogout}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginTop: '20px',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            );
        }

        // Show login form in test mode
        return (
            <div style={{ 
                backgroundColor: '#f0f2f5', 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{ 
                    maxWidth: '400px', 
                    width: '100%',
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, color: '#333' }}>Test Login</h2>
                        <button 
                            onClick={() => setShowTestMode(false)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Full App
                        </button>
                    </div>
                    
                    {message && (
                        <p style={{ 
                            color: message.includes('successful') ? '#28a745' : '#dc3545',
                            textAlign: 'center',
                            marginBottom: '20px',
                            padding: '10px',
                            backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
                            borderRadius: '5px'
                        }}>
                            {message}
                        </p>
                    )}
                    
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Email:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    fontSize: '16px'
                                }}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Password:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    fontSize: '16px'
                                }}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Login
                        </button>
                    </form>
                    
                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                        Test: admin@iiit.ac.in / Admin@123456
                    </p>
                </div>
            </div>
        );
    }

    // Full App Mode with Router
    return (
        <Router>
            <div className="app-container">
                <Navbar user={user} onLogout={handleLogout} />
                <Toaster position="top-right" />
                
                {/* Test Mode Toggle Button */}
                <div className="test-mode-btn-container">
                    <button
                        onClick={() => setShowTestMode(true)}
                        className="test-mode-btn"
                    >
                        Switch to Test Mode
                    </button>
                </div>
                
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Participant Routes */}
                    <Route path="/dashboard" element={
                        <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/browse-events" element={
                        <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                            <BrowseEvents />
                        </PrivateRoute>
                    } />
                    <Route path="/events/:id" element={
                        <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                            <EventDetails />
                        </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/clubs" element={
                        <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                            <ClubsList />
                        </PrivateRoute>
                    } />
                    <Route path="/clubs/:id" element={
                        <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                            <ClubDetails />
                        </PrivateRoute>
                    } />
                    
                    {/* ===== ORGANIZER ROUTES FOR TASK 10 ===== */}
                    <Route path="/organizer/dashboard" element={
                        <PrivateRoute allowedRoles={['organizer', 'admin']}>
                            <OrganizerDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/organizer/events/:id" element={
                        <PrivateRoute allowedRoles={['organizer', 'admin']}>
                            <OrganizerEventDetails />
                        </PrivateRoute>
                    } />
                    <Route path="/create-event" element={
                        <PrivateRoute allowedRoles={['organizer', 'admin']}>
                            <CreateEvent />
                        </PrivateRoute>
                    } />
                    <Route path="/edit-event/:id" element={
                        <PrivateRoute allowedRoles={['organizer', 'admin']}>
                            <EditEvent />
                        </PrivateRoute>
                    } />
                    <Route path="/organizer/profile" element={
                        <PrivateRoute allowedRoles={['organizer', 'admin']}>
                            <OrganizerProfile />
                        </PrivateRoute>
                    } />
                    
                    {/* ===== NEW ADMIN ROUTES FOR TASK 11 ===== */}
                    <Route path="/admin/dashboard" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/admin/clubs" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <ManageClubs />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/admin/password-resets" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <PasswordResetRequests />
                        </PrivateRoute>
                    } />
                    
                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;