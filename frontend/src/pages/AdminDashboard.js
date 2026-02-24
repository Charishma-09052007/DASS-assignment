import React, { useEffect } from 'react';

function AdminDashboard() {
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome {user.firstName} {user.lastName}</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default AdminDashboard;
