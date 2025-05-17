import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
  Container,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Camera as CameraIcon,
  School as SchoolIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    console.log('Layout - Auth State:', { 
      isAuthenticated, 
      loading, 
      hasUser: !!user,
      currentPath: location.pathname 
    });
  }, [isAuthenticated, loading, user, location.pathname]);

  const menuItems = [
    { path: '/feed', icon: <HomeIcon />, label: 'Feed' },
    { path: '/photographers', icon: <CameraIcon />, label: 'Photographers' },
    { path: '/learning-plans', icon: <SchoolIcon />, label: 'Learning Plans' },
    { path: '/chat', icon: <ChatIcon />, label: 'Chat' },
    { path: '/notifications', icon: <NotificationsIcon />, label: 'Notifications' },
  ];

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: 'none',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/')}
              >
                Photography Learning Platform
              </Typography>
            </Box>

            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {menuItems.map((item) => (
                  <Tooltip key={item.path} title={item.label}>
                    <IconButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                        backgroundColor: location.pathname === item.path 
                          ? (theme) => alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.icon}
                    </IconButton>
                  </Tooltip>
                ))}

                <Box
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    ml: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      borderRadius: 1,
                    },
                    p: 1,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={handleProfileMenuOpen}
                >
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'block' },
                      fontSize: '1rem',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {user?.name}
                  </Typography>
                  <Avatar
                    src={user?.avatar}
                    alt={user?.name}
                    sx={{
                      width: 36,
                      height: 36,
                      border: (theme) => `2px solid ${theme.palette.primary.main}`,
                    }}
                  />
                </Box>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      borderRadius: 2,
                      boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                    <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Profile
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                    <SettingsIcon sx={{ mr: 1, fontSize: 20 }} /> Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 2,
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 2,
                    boxShadow: (theme) => `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: (theme) => `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                  }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 