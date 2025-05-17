import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, Badge } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Camera as CameraIcon,
  School as SchoolIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', icon: <HomeIcon />, label: 'Feed' },
    { path: '/photographers', icon: <CameraIcon />, label: 'Photographers' },
    { path: '/learning-plans', icon: <SchoolIcon />, label: 'Learning Plans' },
    { path: '/chat', icon: <ChatIcon />, label: 'Chat' },
    { path: '/notifications', icon: <NotificationsIcon />, label: 'Notifications' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Photography Learning Platform
          </Typography>
          {user ? (
            <>
              {menuItems.map((item) => (
                <IconButton
                  key={item.path}
                  color={location.pathname === item.path ? 'secondary' : 'inherit'}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                </IconButton>
              ))}
              <IconButton color="inherit" onClick={() => navigate('/profile')}>
                <AccountCircleIcon />
              </IconButton>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 