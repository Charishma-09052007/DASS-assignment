import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const { registerParticipant } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    collegeName: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate IIIT email
    if (name === 'email') {
      if (value.endsWith('@iiit.ac.in') || value.endsWith('@students.iiit.ac.in')) {
        setEmailError('');
        // Auto-fill college name for IIIT students
        setFormData(prev => ({ ...prev, collegeName: 'IIIT Hyderabad' }));
      } else {
        setEmailError('Non-IIIT participants must provide college name');
      }
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!formData.email.endsWith('@iiit.ac.in') && 
        !formData.email.endsWith('@students.iiit.ac.in') && 
        !formData.collegeName) {
      setError('College name is required for non-IIIT participants');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    const result = await registerParticipant(formData);
    if (result.success) {
      navigate('/participant/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Participant Registration
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                required
                fullWidth
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              <TextField
                required
                fullWidth
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={!!emailError}
              helperText={emailError}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="contactNumber"
              label="Contact Number"
              value={formData.contactNumber}
              onChange={handleChange}
              inputProps={{ maxLength: 10 }}
            />
            
            <TextField
              margin="normal"
              fullWidth
              name="collegeName"
              label="College/Organization Name"
              value={formData.collegeName}
              onChange={handleChange}
              disabled={formData.email.endsWith('@iiit.ac.in') || formData.email.endsWith('@students.iiit.ac.in')}
              required={!formData.email.endsWith('@iiit.ac.in') && !formData.email.endsWith('@students.iiit.ac.in')}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              startIcon={<PersonAdd />}
            >
              Register
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;