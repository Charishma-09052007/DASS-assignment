import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
    return (
        <nav style={{
            backgroundColor: '#4f46e5',
            padding: '1rem',
            color: 'white',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <Link to="/" style={{ 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                }}>
                    🎪 Felicity Event Management
                </Link>
                
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {user ? (
                        <>
                            {/* Common Dashboard link */}
                            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                                Dashboard
                            </Link>

                            {/* Admin specific links */}
                            {user.role === 'admin' && (
                                <>
                                    <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                                        Admin Dashboard
                                    </Link>
                                    <Link to="/admin/clubs" style={{ color: 'white', textDecoration: 'none' }}>
                                        Manage Clubs
                                    </Link>
                                    <Link to="/admin/password-resets" style={{ color: 'white', textDecoration: 'none' }}>
                                        Password Resets
                                    </Link>
                                </>
                            )}

                            {/* Organizer specific links */}
                            {user.role === 'organizer' && (
                                <>
                                    <Link to="/organizer/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                                        Org Dashboard
                                    </Link>
                                    <Link to="/create-event" style={{ color: 'white', textDecoration: 'none' }}>
                                        Create Event
                                    </Link>
                                    <Link to="/organizer/profile" style={{ color: 'white', textDecoration: 'none' }}>
                                        Org Profile
                                    </Link>
                                </>
                            )}

                            {/* Participant specific links */}
                            {user.role === 'participant' && (
                                <>
                                    <Link to="/browse-events" style={{ color: 'white', textDecoration: 'none' }}>
                                        Browse Events
                                    </Link>
                                    <Link to="/clubs" style={{ color: 'white', textDecoration: 'none' }}>
                                        Clubs
                                    </Link>
                                </>
                            )}

                            {/* Profile link for everyone */}
                            <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
                                Profile
                            </Link>

                            {/* Logout button */}
                            <button
                                onClick={onLogout}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    border: '1px solid white',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.75rem',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                                Login
                            </Link>
                            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;