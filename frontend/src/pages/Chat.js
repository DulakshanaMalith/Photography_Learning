import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit('join', user._id);

      socket.on('users', (usersList) => {
        setUsers(usersList.filter((u) => u._id !== user._id));
      });

      socket.on('message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('previousMessages', (previousMessages) => {
        setMessages(previousMessages);
      });
    }
  }, [socket, user._id]);

  useEffect(() => {
    if (selectedUser && socket) {
      socket.emit('getMessages', {
        userId: user._id,
        recipientId: selectedUser._id,
      });
    }
  }, [selectedUser, socket, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    socket.emit('message', {
      senderId: user._id,
      recipientId: selectedUser._id,
      content: newMessage,
    });

    setNewMessage('');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', height: '80vh' }}>
        <Paper
          elevation={3}
          sx={{
            width: '300px',
            overflow: 'auto',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          <List>
            {users.map((user) => (
              <React.Fragment key={user._id}>
                <ListItem
                  button
                  selected={selectedUser?._id === user._id}
                  onClick={() => setSelectedUser(user)}
                >
                  <ListItemAvatar>
                    <Avatar>{user.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.name} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              <Paper
                elevation={3}
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {messages.map((message) => (
                  <Box
                    key={message._id || message.timestamp}
                    sx={{
                      display: 'flex',
                      justifyContent:
                        message.senderId === user._id ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor:
                          message.senderId === user._id ? '#e3f2fd' : '#f5f5f5',
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Paper>
              <Box sx={{ p: 2, display: 'flex' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendMessage}
                  sx={{ ml: 2 }}
                >
                  Send
                </Button>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a user to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Chat; 