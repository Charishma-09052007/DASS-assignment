import React, { useState } from 'react';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                // Save token to localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
                
                // Redirect based on role
                const role = response.data.data.user.role;
                if (role === 'admin') {
                    window.location.href = '/admin/dashboard';
                } else if (role === 'participant') {
                    window.location.href = '/participant/dashboard';
                }
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage('Login failed');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
            <h2>Login</h2>
            {message && <p style={{ color: 'red' }}>{message}</p>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                        required
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                        required
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: 'blue', color: 'white' }}>
                    Login
                </button>
            </form>
        </div>
    );
}

export default Login;