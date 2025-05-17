import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { useAuth } from '../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { styled } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

const MessageStatus = ({ status, isOwnMessage }) => {
  if (!isOwnMessage) return null;

  switch (status) {
    case 'SENT':
      return <DoneIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />;
    case 'DELIVERED':
      return <DoneAllIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />;
    case 'READ':
      return <DoneAllIcon sx={{ fontSize: 16, color: 'primary.light' }} />;
    default:
      return null;
  }
};

const MessageMenu = ({ message, onEdit, onDelete, onReact, isOwnMessage }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(message);
    handleClose();
  };

  const handleDelete = () => {
    onDelete(message);
    handleClose();
  };

  const handleReact = (reaction) => {
    onReact(message, reaction);
    handleClose();
  };

  // Hide menu if message is deleted
  if (message.deleted) return null;

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {isOwnMessage && (
          <>
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => handleReact('👍')}>👍</MenuItem>
        <MenuItem onClick={() => handleReact('❤️')}>❤️</MenuItem>
        <MenuItem onClick={() => handleReact('😂')}>😂</MenuItem>
        <MenuItem onClick={() => handleReact('😮')}>😮</MenuItem>
      </Menu>
    </>
  );
};

const ChatContainer = styled(Container)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));

const ChatPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  background: 'rgba(255,255,255,0.98)',
}));

const UsersList = styled(Box)(({ theme }) => ({
  width: 300,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  background: 'rgba(255,255,255,0.95)',
  zIndex: 2,
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  background: `
    linear-gradient(rgba(30,30,60,0.65), rgba(60,30,60,0.55)),
    url('/branding/chat-bg.jpg') center/cover no-repeat
  `,
  backgroundAttachment: 'fixed',
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '70%',
  backgroundColor: isOwn ? theme.palette.primary.main : '#fff',
  color: isOwn ? '#fff' : theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  borderTopRightRadius: isOwn ? theme.spacing(0.5) : theme.spacing(2),
  borderTopLeftRadius: isOwn ? theme.spacing(2) : theme.spacing(0.5),
  boxShadow: theme.shadows[2],
  position: 'relative',
  marginLeft: isOwn ? 'auto' : 0,
  marginRight: isOwn ? 0 : 'auto',
  transition: 'background 0.2s',
  animation: 'fadeIn 0.4s',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'none' },
  },
}));

const MessageInputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  background: 'rgba(255,255,255,0.98)',
  position: 'sticky',
  bottom: 0,
  zIndex: 2,
}));

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const location = useLocation();

  const PAGE_SIZE = 20;

  const connectWebSocket = useCallback(() => {
    if (!user?.token) {
      console.log('No user token available, skipping WebSocket connection');
      return;
    }

    console.log('Initializing WebSocket connection with token:', user.token.substring(0, 20) + '...');
    const socket = new SockJS('http://localhost:8080/ws', null, {
      transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      timeout: 5000,
      sessionId: () => {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    });

    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setError('Connection error. Please try again.');
        setConnected(false);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error. Please try again.');
        setConnected(false);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
        setConnected(false);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (user?.token) {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }
        }, 5000);
      }
    });

    stompClient.onConnect = (frame) => {
      console.log('WebSocket connected:', frame);
      setConnected(true);
      setError(null);

      // Request initial users list
      console.log('Requesting initial users list');
      stompClient.publish({
        destination: '/app/users',
        body: JSON.stringify({ userId: user.id }),
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
    };

    stompClient.activate();
    setStompClient(stompClient);

    return () => {
      console.log('Cleaning up WebSocket connection');
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [user?.token, user?.id]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  useEffect(() => {
    if (!stompClient?.connected || !user?.id) {
      console.log('WebSocket not connected or no user ID, skipping subscription');
      return;
    }

    console.log('Setting up message subscription for user:', user.id);
    
    // Subscribe to user's message queue
    const messageSubscription = stompClient.subscribe(`/user/${user.id}/queue/messages`, (message) => {
      console.log('Received WebSocket message:', message);
      try {
        const receivedMessage = JSON.parse(message.body);
        console.log('Parsed message:', receivedMessage);
        
        if (!receivedMessage) {
          console.log('Received empty message');
          return;
        }

        setMessages((prev) => {
          console.log('Current messages state:', prev);
          const newMessages = Array.isArray(receivedMessage) ? receivedMessage : [receivedMessage];
          console.log('New messages to add:', newMessages);
          
          if (Array.isArray(receivedMessage)) {
            // This is a batch of messages (initial load)
            console.log('Processing batch of messages, length:', newMessages.length);
            setLoading(false);
            if (newMessages.length < PAGE_SIZE) {
              console.log('No more messages available');
              setHasMore(false);
            }
            // Sort messages by timestamp in ascending order
            const sortedMessages = [...newMessages].sort((a, b) => 
              new Date(a.timestamp) - new Date(b.timestamp)
            );
            console.log('Final sorted messages:', sortedMessages);
            return sortedMessages;
          } else {
            // This is a single message update
            console.log('Processing single message update');
            let updatedMessages = prev;
            if (receivedMessage.deleted) {
              // Remove the deleted message from the list
              updatedMessages = prev.filter(msg => msg._id !== receivedMessage._id);
            } else {
              // Update existing message or add new one
              updatedMessages = prev.map(msg =>
                msg._id === receivedMessage._id ? receivedMessage : msg
              );
              // If message doesn't exist, add it
              if (!prev.some(msg => msg._id === receivedMessage._id)) {
                updatedMessages.push(receivedMessage);
              }
            }
            // Sort messages by timestamp
            const sortedMessages = updatedMessages.sort((a, b) => 
              new Date(a.timestamp) - new Date(b.timestamp)
            );
            console.log('Updated messages after processing update:', sortedMessages);
            return sortedMessages;
          }
        });
        // Send delivery acknowledgment if the current user is the recipient
        if (
          receivedMessage.recipientId === user.id &&
          receivedMessage.status === 'SENT' // Only acknowledge if not already delivered/read
        ) {
          stompClient.publish({
            destination: '/app/message/delivered',
            body: JSON.stringify({
              messageId: receivedMessage._id,
              userId: user.id,
            }),
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        setLoading(false);
        setError('Failed to process message. Please try again.');
      }
    });

    // Subscribe to error messages
    const errorSubscription = stompClient.subscribe(`/user/${user.id}/queue/errors`, (message) => {
      console.error('Received error message:', message);
      try {
        const error = JSON.parse(message.body);
        setError(error.message || 'An error occurred');
        setLoading(false);
      } catch (error) {
        console.error('Error parsing error message:', error);
        setError('An error occurred');
        setLoading(false);
      }
    });

    setSubscriptions(prev => [...prev, messageSubscription, errorSubscription]);

    return () => {
      console.log('Cleaning up message subscriptions');
      messageSubscription.unsubscribe();
      errorSubscription.unsubscribe();
    };
  }, [stompClient?.connected, user?.id]);

  useEffect(() => {
    if (selectedUser && stompClient?.connected) {
      console.log('Selected user changed, requesting messages for:', selectedUser.id);
      // Clear messages when switching users
      setMessages([]);
      setPage(0);
      setHasMore(true);
      setLoading(true);
      
      // Request previous messages
      const messageRequest = {
        userId: user.id,
        recipientId: selectedUser.id,
        page: 0,
        size: PAGE_SIZE
      };
      console.log('Sending initial message request:', messageRequest);
      
      try {
        stompClient.publish({
          destination: '/app/messages',
          body: JSON.stringify(messageRequest),
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });
        console.log('Message request sent successfully');
      } catch (error) {
        console.error('Error sending message request:', error);
        setLoading(false);
        setError('Failed to load messages. Please try again.');
      }
    }
  }, [selectedUser, stompClient, user?.id, user?.token]);

  const loadMessages = () => {
    if (!selectedUser || !stompClient?.connected || !hasMore || loading) {
      console.log('Skipping message load:', {
        noSelectedUser: !selectedUser,
        notConnected: !stompClient?.connected,
        noMoreMessages: !hasMore,
        isLoading: loading
      });
      return;
    }

    console.log('Loading messages for page:', page, 'with size:', PAGE_SIZE);
    setLoading(true);
    const messageRequest = {
      userId: user.id,
      recipientId: selectedUser.id,
      page: page,
      size: PAGE_SIZE
    };
    console.log('Sending message request:', messageRequest);
    
    try {
      stompClient.publish({
        destination: '/app/messages',
        body: JSON.stringify(messageRequest),
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      console.log('Message request sent successfully');
    } catch (error) {
      console.error('Error sending message request:', error);
      setLoading(false);
      setError('Failed to load messages. Please try again.');
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Load more messages when scrolling to the top
    if (scrollTop === 0 && hasMore && !loading) {
      console.log('Scrolled to top, loading more messages');
      setPage(prev => prev + 1);
      loadMessages();
    }
  };

  // Add effect to mark messages as read when they become visible
  useEffect(() => {
    if (selectedUser && stompClient?.connected) {
      const unreadMessages = messages.filter(
        msg => msg.recipientId === user.id && msg.status !== 'READ'
      );

      unreadMessages.forEach(msg => {
        stompClient.publish({
          destination: '/app/message/read',
          body: JSON.stringify({
            messageId: msg._id,
            userId: user.id,
          }),
        });
      });
    }
  }, [messages, selectedUser, stompClient, user?.id]);

  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    console.log('Messages updated, current messages:', messages);
    if (messagesEndRef.current) {
      console.log('Scrolling to bottom');
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add users subscription
  useEffect(() => {
    if (!stompClient?.connected || !user?.id) {
      console.log('WebSocket not connected or no user ID, skipping users subscription');
      return;
    }

    console.log('Setting up users subscription');
    const usersSubscription = stompClient.subscribe('/topic/users', (message) => {
      console.log('Received users list:', message);
      try {
        const usersList = JSON.parse(message.body);
        console.log('Parsed users list:', usersList);
        setUsers(usersList);
      } catch (error) {
        console.error('Error parsing users list:', error);
        setError('Failed to load users list');
      }
    });

    setSubscriptions(prev => [...prev, usersSubscription]);

    return () => {
      console.log('Cleaning up users subscription');
      usersSubscription.unsubscribe();
    };
  }, [stompClient?.connected, user?.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !stompClient?.connected) {
      console.log('Cannot send message:', {
        messageEmpty: !newMessage.trim(),
        noSelectedUser: !selectedUser,
        notConnected: !stompClient?.connected
      });
      return;
    }

    const messageId = `${user.id}-${selectedUser.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      senderId: user.id,
      recipientId: selectedUser.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      _id: messageId,
      type: 'TEXT'
    };

    console.log('Sending message:', message);
    stompClient.publish({
      destination: '/app/chat',
      body: JSON.stringify(message),
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });

    setNewMessage('');
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const handleDeleteMessage = (message) => {
    if (!stompClient?.connected) return;

    stompClient.publish({
      destination: '/app/message/delete',
      body: JSON.stringify({
        messageId: message._id,
        userId: user.id
      }),
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const handleReactToMessage = (message, reaction) => {
    if (!stompClient?.connected) return;

    stompClient.publish({
      destination: '/app/message/react',
      body: JSON.stringify({
        messageId: message._id,
        userId: user.id,
        reaction
      }),
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const handleSearch = () => {
    if (!stompClient?.connected || !searchQuery.trim()) return;

    stompClient.publish({
      destination: '/app/messages/search',
      body: JSON.stringify({
        userId: user.id,
        query: searchQuery
      }),
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const handleArchiveChat = () => {
    if (!stompClient?.connected || !selectedUser) return;

    stompClient.publish({
      destination: '/app/chat/archive',
      body: JSON.stringify({
        userId: user.id,
        recipientId: selectedUser.id
      }),
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  // Voice recording logic
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setAudioBlob(null);
    } catch (err) {
      setError('Could not start audio recording.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSendAudio = async () => {
    if (!audioBlob || !selectedUser || !stompClient?.connected) return;
    setAudioUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');
      const res = await fetch('http://localhost:8080/api/chat/upload-audio', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (data.url) {
        const messageId = `${user.id}-${selectedUser.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const message = {
          senderId: user.id,
          recipientId: selectedUser.id,
          content: '',
          timestamp: new Date().toISOString(),
          _id: messageId,
          type: 'FILE',
          metadata: { audioUrl: data.url }
        };
        stompClient.publish({
          destination: '/app/chat',
          body: JSON.stringify(message),
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        setAudioBlob(null);
      } else {
        setError('Failed to upload audio.');
      }
    } catch (err) {
      setError('Failed to upload audio.');
    }
    setAudioUploading(false);
  };

  // Auto-select user from query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdFromQuery = params.get('userId');
    if (userIdFromQuery && users.length > 0) {
      const foundUser = users.find(u => u.id === userIdFromQuery);
      if (foundUser) {
        setSelectedUser(foundUser);
      }
    }
  }, [location.search, users]);

  return (
    <ChatContainer>
      <ChatPaper>
        {/* Users List */}
        <UsersList>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Conversations
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
          }}
              sx={{ mt: 1 }}
            />
          </Box>
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem
                  button
                  selected={selectedUser?.id === user.id}
                  onClick={() => setSelectedUser(user)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="error"
                      badgeContent={user.unreadCount || 0}
                      invisible={!user.unreadCount}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: selectedUser?.id === user.id ? 'primary.main' : 'grey.500',
                        }}
                      >
                        {user.name[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.name}
                    secondary={user.lastMessage}
                    primaryTypographyProps={{
                      fontWeight: selectedUser?.id === user.id ? 600 : 400,
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                      style: { maxWidth: '150px' }
                    }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </UsersList>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <ChatHeader>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {selectedUser.name[0]}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedUser.name}
                  </Typography>
                </Box>
                <IconButton onClick={handleArchiveChat}>
                  <ArchiveIcon />
                </IconButton>
              </ChatHeader>

              {/* Messages Area */}
              <MessagesArea
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                {messages.map((message) => (
                  <Box
                    key={message._id || `${message.senderId}-${message.recipientId}-${message.timestamp}`}
                    sx={{
                      display: 'flex',
                      justifyContent: message.senderId === user.id ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <MessageBubble
                      isOwn={message.senderId === user.id}
                    >
                      {message.deleted ? (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                          This message was deleted
                        </Typography>
                      ) : (
                        <>
                          {message.type === 'FILE' && message.metadata?.audioUrl ? (
                            <audio controls src={`http://localhost:8080${message.metadata.audioUrl}`} style={{ width: '100%' }} />
                          ) : (
                            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                              {message.content}
                              {message.edited && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, opacity: 0.7 }}
                                >
                                  (edited)
                                </Typography>
                              )}
                            </Typography>
                          )}
                          {message.reactions && Object.entries(message.reactions).length > 0 && (
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 0.5, 
                              mt: 0.5,
                              flexWrap: 'wrap'
                            }}>
                              {Object.entries(message.reactions).map(([userId, reaction]) => (
                                <Tooltip key={userId} title={users.find(u => u.id === userId)?.name || userId}>
                                  <Typography variant="caption">{reaction}</Typography>
                                </Tooltip>
                              ))}
                            </Box>
                          )}
                        </>
                      )}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        mt: 0.5,
                        gap: 0.5
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: message.senderId === user.id ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                          }}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                        <MessageStatus 
                          status={message.status} 
                          isOwnMessage={message.senderId === user.id} 
                        />
                        <MessageMenu
                          message={message}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          onReact={handleReactToMessage}
                          isOwnMessage={message.senderId === user.id}
                        />
                      </Box>
                    </MessageBubble>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </MessagesArea>

              {/* Message Input */}
              <MessageInputArea>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editingMessage) {
                        // Handle edit
                        stompClient.publish({
                          destination: '/app/message/edit',
                          body: JSON.stringify({
                            messageId: editingMessage._id,
                            content: newMessage,
                            userId: user.id
                          }),
                        });
                        setEditingMessage(null);
                      } else {
                      handleSendMessage();
                    }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color={recording ? 'error' : 'primary'}
                          onClick={recording ? handleStopRecording : handleStartRecording}
                          disabled={audioUploading}
                          sx={{ mr: 1 }}
                        >
                          {recording ? <StopIcon /> : <MicIcon />}
                        </IconButton>
                        {audioBlob && !recording && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 1 }}>
                            <audio controls src={URL.createObjectURL(audioBlob)} style={{ maxWidth: 220 }} />
                <Button
                  variant="contained"
                  color="primary"
                              size="small"
                              onClick={handleSendAudio}
                              disabled={audioUploading}
                            >
                              {audioUploading ? 'Sending...' : 'Send Voice'}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => setAudioBlob(null)}
                              disabled={audioUploading}
                            >
                              Cancel
                </Button>
              </Box>
                        )}
                        <IconButton
                          color="primary"
                          onClick={() => {
                            if (editingMessage) {
                              stompClient.publish({
                                destination: '/app/message/edit',
                                body: JSON.stringify({
                                  messageId: editingMessage._id,
                                  content: newMessage,
                                  userId: user.id
                                }),
                              });
                              setEditingMessage(null);
                            } else {
                              handleSendMessage();
                            }
                          }}
                          disabled={!newMessage.trim()}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    startAdornment: editingMessage && (
                      <InputAdornment position="start">
                        <Typography variant="caption" color="text.secondary">
                          Editing message...
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </MessageInputArea>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </ChatPaper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default Chat; 