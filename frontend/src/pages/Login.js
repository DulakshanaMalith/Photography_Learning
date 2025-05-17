import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  useTheme,
  alpha,
  InputAdornment,
  IconButton,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        try {
          const origin = window.location.origin;
          const config = {
            client_id: '352546676662-gbiq96v7jgk9uuiknjf9369jccchmcs6.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: false,
            context: 'signin',
            ux_mode: 'popup',
            origin: origin,
            prompt_parent_id: 'googleSignInButton',
            allowed_parent_origin: origin
          };
          
          window.google.accounts.id.initialize(config);
          window.google.accounts.id.renderButton(
            document.getElementById('googleSignInButton'),
            { 
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: 280,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'center'
            }
          );
        } catch (err) {
          console.error('Error initializing Google Sign-In:', err);
          setError('Failed to initialize Google Sign-In. Please try again later.');
        }
      } else {
        console.error('Google Sign-In script not loaded');
        setError('Google Sign-In is not available. Please try again later.');
      }
    };

    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        setError('Failed to load Google Sign-In. Please try again later.');
      };
      document.body.appendChild(script);
    };

    if (document.readyState === 'complete') {
      loadGoogleScript();
    } else {
      window.addEventListener('load', loadGoogleScript);
      return () => window.removeEventListener('load', loadGoogleScript);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      if (response.credential) {
        await googleLogin(response.credential);
      } else {
        throw new Error('No credential received from Google');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Google login failed. Please try again.');
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword && !validatePassword(newPassword)) {
      setPasswordError('Password must be at least 6 characters long');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    let isValid = true;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    }

    if (!isValid) return;

    try {
      await login(email, password);
    } catch (error) {
      setError(error.message || 'Login failed');
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
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to continue your photography journey
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
                label="Email"
                type="email"
                value={email}
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
                type={showPassword ? 'text' : 'password'}
                value={password}
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
                Sign In
              </Button>
            </form>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                OR
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <div id="googleSignInButton"></div>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  color="primary"
                  onClick={() => navigate('/register')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Container>
  );
};

export default Login; 