import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case 'participant':
        return <Navigate to="/participant/dashboard" />;
      case 'organizer':
        return <Navigate to="/organizer/dashboard" />;
      case 'admin':
        return <Navigate to="/admin/dashboard" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  return children;
};

export default ProtectedRoute;