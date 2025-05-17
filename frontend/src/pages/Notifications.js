import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  IconButton,
  Badge,
  Alert,
  Snackbar,
  Button,
  CircularProgress,
  Chip,
  Fade,
} from '@mui/material';
import {
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, refreshToken, logout } = useAuth();
  const navigate = useNavigate();
  const didInitialFetch = useRef(false);
  const intervalRef = useRef(null);

  // Debug: Log auth state and user on every render
  // console.log('Debug - Notifications render:', { isAuthenticated, user });

  const fetchNotifications = async (isInitial = false) => {
    if (!isAuthenticated) return;
    if (isInitial) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get('http://localhost:8080/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setNotifications(
        response.data.map(n => ({
          ...n,
          _id: n._id || n.id // support both _id and id
        }))
      );
      setError('');
    } catch (error) {
      if (error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return fetchNotifications(isInitial);
        } else {
          setError('Session expired. Please log in again.');
          logout();
          navigate('/login');
        }
      } else {
        setError('Failed to fetch notifications');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!didInitialFetch.current) {
      fetchNotifications(true);
      didInitialFetch.current = true;
    }
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (isAuthenticated) {
          fetchNotifications(false);
        }
      }, 30000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
  };
  }, [isAuthenticated]);

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`http://localhost:8080/api/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setNotifications(notifications.filter((n) => n._id !== notificationId));
    } catch (error) {
      setError('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axios.put('http://localhost:8080/api/notifications/mark-all-read', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      // Disable auto-refresh temporarily
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Re-enable auto-refresh after 5 seconds
      setTimeout(() => {
        if (isAuthenticated) {
          intervalRef.current = setInterval(() => {
            fetchNotifications(false);
          }, 30000);
        }
      }, 5000);
    } catch (error) {
      setError('Failed to mark all as read');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axios.delete('http://localhost:8080/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setNotifications([]);
    } catch (error) {
      setError('Failed to delete all notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <LikeIcon color="secondary" />;
      case 'comment':
        return <CommentIcon color="primary" />;
      case 'message':
        return <ChatIcon color="success" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.sender?.name || 'Someone'} liked your post`;
      case 'comment':
        return `${notification.sender?.name || 'Someone'} commented on your post`;
      case 'message':
        return `${notification.sender?.name || 'Someone'} sent you a message`;
      default:
        return 'You have a new notification';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: 0, px: 0 }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: '100%',
          minHeight: 180,
          background: 'linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)',
          bgcolor: 'rgba(255,255,255,0.85)',
          color: 'primary.main',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0,
          mb: 4,
          pt: 6,
          pb: 4,
          boxShadow: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <NotificationsIcon sx={{ fontSize: 56, mb: 1, color: 'primary.main', opacity: 0.85 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: 1, color: 'primary.main', mb: 1 }}>
          Your Notifications
        </Typography>
        <Typography variant="h6" sx={{ color: 'primary.main', opacity: 0.7 }}>
          Stay up to date with the latest activity on your posts and messages.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2, px: 2, gap: 1 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<MarkReadIcon />}
          onClick={handleMarkAllAsRead}
          disabled={notifications.length === 0}
        >
          Mark all as read
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteAll}
          disabled={notifications.length === 0}
        >
          Delete all
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <img
            src="https://cdn.jsdelivr.net/gh/duyetdev/illustrations@main/undraw_empty_xct9.svg"
            alt="No notifications"
            style={{ width: 220, marginBottom: 24, opacity: 0.8 }}
          />
          <Typography variant="h5" sx={{ color: 'grey.200', mb: 1 }}>
            No notifications yet
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            You're all caught up! Interact with posts or chat to receive notifications.
      </Typography>
        </Box>
      ) : (
        <List sx={{ px: 2 }}>
          {notifications.map((notification, idx) => (
            <Fade in timeout={500 + idx * 100} key={notification._id}>
          <ListItem
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteNotification(notification._id)}
                sx={{ color: 'common.white', opacity: 0.8, '&:hover': { color: 'error.main', opacity: 1 } }}
              >
                <DeleteIcon />
              </IconButton>
            }
            sx={{
              bgcolor: notification.isRead ? 'grey.900' : 'grey.300',
              color: notification.isRead ? 'grey.200' : 'grey.900',
              borderRadius: 3,
              mb: 2,
              boxShadow: notification.isRead ? 1 : 4,
              fontWeight: notification.isRead ? 400 : 700,
              transition: 'all 0.25s',
              borderLeft: notification.isRead ? '6px solid #90caf9' : '6px solid #757575',
              position: 'relative',
              '&:hover': {
                boxShadow: 8,
                transform: 'scale(1.02)',
              },
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      !notification.isRead ? (
                        <Chip size="small" color="secondary" label="New" sx={{ fontWeight: 700, fontSize: 10 }} />
                      ) : null
                    }
              >
                    <Avatar
                      src={notification.sender?.avatar || ''}
                      sx={{
                        bgcolor: notification.isRead ? 'grey.800' : 'secondary.main',
                        color: 'common.white',
                        border: !notification.isRead ? '2.5px solid #ff4081' : '2.5px solid #90caf9',
                        boxShadow: notification.isRead ? 1 : 4,
                        width: 48,
                        height: 48,
                        fontSize: 24,
                        fontWeight: 700,
                        transition: 'all 0.2s',
                      }}
                    >
                      {notification.sender?.name ? notification.sender.name[0] : '?'}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getNotificationIcon(notification.type)}
                      {notification.type === 'message' ? (
                        <Link
                          to={`/chat?userId=${notification.sender?.id}`}
                          style={{
                            fontWeight: notification.isRead ? 400 : 700,
                            color: notification.isRead ? '#bdbdbd' : '#1976d2',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          }}
                        >
                          {getNotificationText(notification)}
                        </Link>
                      ) : notification.postId ? (
                        <Link
                          to={`/feed?postId=${notification.postId}`}
                          style={{
                            fontWeight: notification.isRead ? 400 : 700,
                            color: notification.isRead ? '#bdbdbd' : '#1976d2',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          }}
                        >
                          {getNotificationText(notification)}
                        </Link>
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 700,
                            color: notification.isRead ? 'grey.200' : 'primary.contrastText',
                          }}
                        >
                          {getNotificationText(notification)}
                        </Typography>
                      )}
                    </Box>
                  }
              secondary={
                    <Typography variant="body2" sx={{ color: 'grey.400', fontSize: 14 }}>
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              }
            />
          </ListItem>
            </Fade>
          ))}
        </List>
      )}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ color: 'common.white', bgcolor: 'error.main' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Notifications; 