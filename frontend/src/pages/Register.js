import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  useTheme,
  alpha,
  InputAdornment,
  IconButton,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setFormData((prev) => ({ ...prev, email: newEmail }));
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData((prev) => ({ ...prev, password: newPassword }));
    if (newPassword && !validatePassword(newPassword)) {
      setPasswordError('Password must be at least 6 characters long');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setFormData((prev) => ({ ...prev, confirmPassword: newConfirmPassword }));
    if (newConfirmPassword && !validateConfirmPassword(formData.password, newConfirmPassword)) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    return password === confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    let isValid = true;

    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!validatePassword(formData.password)) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    }

    if (!validateConfirmPassword(formData.password, formData.confirmPassword)) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } catch (error) {
      setError(error.message || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Fade in timeout={800}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 4,
              background: (theme) => `linear-gradient(145deg, 
                ${alpha(theme.palette.background.paper, 0.85)}, 
                ${alpha(theme.palette.background.paper, 0.92)})`,
              backdropFilter: 'blur(20px)',
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: (theme) => `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.15)}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 4,
                background: (theme) => `linear-gradient(145deg, 
                  ${alpha(theme.palette.primary.main, 0.03)}, 
                  ${alpha(theme.palette.secondary.main, 0.03)})`,
                zIndex: -1,
              },
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Join our photography learning community
              </Typography>
            </Box>

            {error && (
              <Zoom in>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              </Zoom>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                error={!!emailError}
                helperText={emailError}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handlePasswordChange}
                error={!!passwordError}
                helperText={passwordError}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  boxShadow: (theme) => `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Create Account
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Button
                  color="primary"
                  onClick={() => navigate('/login')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Container>
  );
};

export default Register; 