import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ role }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    switch (role) {
      case 'participant':
        return ['Dashboard', 'Browse Events', 'Clubs/Organizers', 'Profile'];
      case 'organizer':
        return ['Dashboard', 'Create Event', 'Profile', 'Ongoing Events'];
      case 'admin':
        return ['Dashboard', 'Manage Clubs/Organizers', 'Password Reset Requests'];
      default:
        return [];
    }
  };

  const handleNavigation = (item) => {
    const path = `/${role}/${item.toLowerCase().replace(/\s+/g, '-')}`;
    navigate(path);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Felicity Event Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {getNavItems().map((item) => (
            <Button 
              key={item} 
              color="inherit"
              onClick={() => handleNavigation(item)}
            >
              {item}
            </Button>
          ))}
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;