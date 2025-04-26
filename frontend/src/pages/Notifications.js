import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:8080/api/notifications/${notificationId}`);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <LikeIcon color="secondary" />;
      case 'comment':
        return <CommentIcon color="primary" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.sender.name} liked your post`;
      case 'comment':
        return `${notification.sender.name} commented on your post`;
      default:
        return '';
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      <List>
        {notifications.map((notification) => (
          <ListItem
            key={notification._id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteNotification(notification._id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={getNotificationIcon(notification.type)}
              >
                <Avatar src={notification.sender.avatar}>
                  {notification.sender.name[0]}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={getNotificationText(notification)}
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              }
            />
          </ListItem>
        ))}
        {notifications.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        )}
      </List>
    </Container>
  );
};

export default Notifications; 