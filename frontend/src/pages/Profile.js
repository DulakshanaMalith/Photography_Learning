import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  Divider,
  Chip,
  Fade,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md" disableGutters sx={{ minHeight: '100vh', px: 0, bgcolor: 'background.default' }}>
      {/* Subtle Hero/Banner Section */}
      <Box
        sx={{
          width: '100%',
          minHeight: 120,
          background: 'linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          borderRadius: 0,
          mb: -10,
          pt: 4,
          pb: 0,
          boxShadow: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Fade in timeout={700}>
          <Box sx={{ position: 'relative', mb: -8 }}>
            <Avatar
              src={user?.avatar || user?.profilePicture || ''}
              alt={user?.name}
              sx={{
                width: 140,
                height: 140,
                border: '6px solid #fff',
                boxShadow: 4,
                bgcolor: 'secondary.main',
                fontSize: 56,
                fontWeight: 700,
                color: 'white',
                mb: 1,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {user?.name ? user.name[0] : <PersonIcon fontSize="inherit" />}
            </Avatar>
            {/* Colored ring for avatar */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: '4px solid #90caf9',
                zIndex: 1,
                boxShadow: 2,
                opacity: 0.7,
              }}
            />
          </Box>
        </Fade>
      </Box>
      {/* Glassmorphism Card for Details */}
      <Container maxWidth="sm" sx={{ mt: -10, mb: 4, zIndex: 2, position: 'relative' }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 5,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            textAlign: 'center',
          }}
        >
          <Chip label="Member" color="secondary" sx={{ fontWeight: 700, fontSize: 16, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1, mb: 0.5 }}>
            {user?.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
            {user?.email}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'left' }}>
                Account Information
              </Typography>
              <Box sx={{ pl: 2, textAlign: 'left' }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {user?.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
                {/* Add more fields as desired */}
              </Box>
            </Grid>
            {/* Example stats section (customize as needed) */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>0</Typography>
                  <Typography variant="body2" color="text.secondary">Posts</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>0</Typography>
                  <Typography variant="body2" color="text.secondary">Followers</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>0</Typography>
                  <Typography variant="body2" color="text.secondary">Following</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/')}
                  sx={{ fontWeight: 700, px: 4, borderRadius: 3 }}
                >
                  Back to Home
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/edit-profile')}
                  sx={{ fontWeight: 700, px: 4, borderRadius: 3 }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Container>
  );
};

export default Profile; 