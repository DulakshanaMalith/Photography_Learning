import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardMedia,
  Fade,
  Zoom,
  Divider,
  Tooltip,
  alpha,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Delete,
  Edit,
  Image,
  VideoLibrary,
  Share,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)`,
  padding: theme.spacing(6, 0, 4, 0),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[2],
}));

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [postComments, setPostComments] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [shareSnackbar, setShareSnackbar] = useState({ open: false, message: '' });
  const { user, isAuthenticated, logout, refreshToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    console.log('Debug - getAuthHeader - Token from localStorage:', token ? 'exists' : 'null');
    
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('Debug - getAuthHeader - Returning headers:', headers);
    return headers;
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) {
        console.log('Debug - fetchPosts - No headers available');
        return;
      }

      console.log('Debug - fetchPosts - Fetching posts with token:', localStorage.getItem('token')?.substring(0, 20) + '...');
      const response = await axios.get('http://localhost:8080/api/feed', {
        headers: headers
      });

      const validPosts = response.data.map(post => {
        const author = post.author ? {
          id: post.author.id || 'unknown',
          name: post.author.name || 'Unknown User',
          email: post.author.email || 'unknown@example.com',
          avatar: post.author.avatar || null
        } : {
          id: 'unknown',
          name: 'Unknown User',
          email: 'unknown@example.com',
          avatar: null
        };

        const comments = (post.comments || []).map(comment => {
          console.log('Debug - Processing comment:', comment);
          const commentId = comment.id;
          const commentAuthor = comment.author ? {
            id: comment.author.id || 'unknown',
            name: comment.author.name || 'Unknown User',
            email: comment.author.email || 'unknown@example.com',
            avatar: comment.author.avatar || null
          } : {
            id: 'unknown',
            name: 'Unknown User',
            email: 'unknown@example.com',
            avatar: null
          };

          return {
            ...comment,
            id: commentId,
            author: commentAuthor,
            createdAt: comment.createdAt || new Date().toISOString(),
            updatedAt: comment.updatedAt || new Date().toISOString()
          };
        }).filter(comment => comment.id != null);

        console.log('Debug - Processed comments for post:', comments);

        return {
          ...post,
          author,
          comments: comments,
          likes: post.likes || [],
          commentCount: comments.length
        };
      });

      setPosts(validPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (error.response?.status === 401) {
        console.log('Debug - fetchPosts - Got 401, attempting token refresh');
        const refreshed = await refreshToken();
        if (refreshed) {
          return fetchPosts();
        } else {
          console.warn('Authentication failed. Please log in again.');
          logout();
        }
      }
      setPosts([]);
    }
  }, [getAuthHeader, refreshToken, logout]);

  const fetchComments = useCallback(async (postId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Debug - No token found, redirecting to login');
        navigate('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Debug - Fetching comments for post:', postId);
      console.log('Debug - Using token:', token.substring(0, 20) + '...');
      console.log('Debug - Current axios defaults:', axios.defaults.headers.common['Authorization']);

      const response = await axios.get(`http://localhost:8080/api/feed/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        console.log('Debug - Comments fetched successfully:', response.data.length);
        setPostComments(prev => ({
          ...prev,
          [postId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      if (error.response?.status === 401) {
        console.log('Debug - fetchComments - Got 401, attempting token refresh');
        const refreshed = await refreshToken();
        console.log('Debug - fetchComments - Token refresh result:', refreshed);
        
        if (refreshed) {
          const newToken = localStorage.getItem('token');
          console.log('Debug - fetchComments - Retrying with new token:', newToken.substring(0, 20) + '...');
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            const retryResponse = await axios.get(`http://localhost:8080/api/feed/${postId}/comments`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (retryResponse.data) {
              console.log('Debug - Comments fetched successfully after token refresh:', retryResponse.data.length);
              setPostComments(prev => ({
                ...prev,
                [postId]: retryResponse.data
              }));
              return;
            }
          } catch (retryError) {
            console.error('Error after token refresh:', retryError);
            if (retryError.response?.status === 401) {
              console.warn('Authentication failed even after token refresh');
              logout();
              navigate('/login');
            }
          }
        } else {
          console.warn('Authentication failed. Please log in again.');
          logout();
          navigate('/login');
        }
      }
    }
  }, [navigate, refreshToken, logout]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, fetchPosts]);

  // Fetch comments for each post on mount
  useEffect(() => {
    if (posts.length > 0) {
      posts.forEach(post => {
        fetchComments(post.id);
      });
    }
  }, [posts, fetchComments]);

  // Auto-select post from query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postIdFromQuery = params.get('postId');
    if (postIdFromQuery && posts.length > 0) {
      const foundPost = posts.find(p => p.id === postIdFromQuery);
      if (foundPost) {
        setSelectedPost(foundPost);
      }
    }
  }, [location.search, posts]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedVideo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage && !selectedVideo) return;
    try {
      const headers = getAuthHeader();
      if (!headers) return;

      await axios.post('http://localhost:8080/api/feed', {
        content: newPost,
        imageUrl: selectedImage,
        videoUrl: selectedVideo,
        author: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }, {
        headers: headers
      });
      setNewPost('');
      setSelectedImage(null);
      setSelectedVideo(null);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('Authentication failed. Please log in again.');
        logout();
      }
    }
  };

  const handleLike = async (postId) => {
    if (!postId) {
      console.error('Cannot like post: postId is undefined');
      return;
    }
    
    try {
      const headers = getAuthHeader();
      if (!headers) return;

      const response = await axios.post(`http://localhost:8080/api/feed/${postId}/like`, {}, { headers });
      
      if (response.status === 200) {
        setPosts(posts.map(post => 
          post.id === postId ? response.data : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (error.response?.data?.includes('not authorized')) {
          alert('You are not authorized to like this post');
        } else {
          console.warn('Authentication failed. Please log in again.');
          logout();
        }
      }
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) {
      console.warn('Attempted to add empty comment');
      return;
    }

    if (!postId) {
      console.error('Cannot add comment: post ID is undefined');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Debug - No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Debug - Adding comment to post:', postId);
      const response = await axios.post(
        `http://localhost:8080/api/feed/${postId}/comments`,
        { content: commentText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        console.log('Comment added successfully:', response.data);
        setCommentText('');
        // Update post and comments
        const updatedPost = response.data.post;
        const updatedComments = response.data.comments;
        
        // Update posts state with the new post data
        setPosts(posts.map(p => {
          if (p.id === updatedPost.id) {
            return {
              ...updatedPost,
              author: p.author, // Preserve the author data
              likes: updatedPost.likes || []
            };
          }
          return p;
        }));
        
        // Update comments state
        setPostComments(prev => ({
          ...prev,
          [postId]: updatedComments
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return handleComment(postId);
        } else {
          alert('Please log in to comment');
          navigate('/login');
        }
      } else {
        alert(error.response?.data?.message || 'Failed to add comment. Please try again.');
      }
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:8080/api/feed/${postId}`, {
        headers: getAuthHeader()
      });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      if (error.response?.status === 403) {
        if (error.response?.data?.message?.includes('not authorized')) {
          alert('You are not authorized to delete this post');
        } else {
          console.warn('Authentication failed. Please log in again.');
          logout();
        }
      }
    }
  };

  const handleUpdateComment = async (postId, commentId, updatedText) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Debug - No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Debug - Updating comment:', {
        postId,
        commentId,
        textLength: updatedText.length
      });

      const response = await axios({
        method: 'put',
        url: `http://localhost:8080/api/feed/${postId}/comments/${commentId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { content: updatedText }
      });

      if (response.data) {
        console.log('Debug - Comment updated successfully');
        setEditingCommentId(null);
        setEditCommentText('');
        
        // Update post and comments
        const updatedPost = response.data.post;
        const updatedComments = response.data.comments;
        
        // Update posts state with the new post data
        setPosts(posts.map(p => {
          if (p.id === updatedPost.id) {
            return {
              ...updatedPost,
              author: p.author, // Preserve the author data
              likes: updatedPost.likes || []
            };
          }
          return p;
        }));
        
        // Update comments state
        setPostComments(prev => ({
          ...prev,
          [postId]: updatedComments
        }));
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      if (error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return handleUpdateComment(postId, commentId, updatedText);
        } else {
          alert('Please log in to update comment');
          navigate('/login');
        }
      } else {
        alert(error.response?.data?.message || 'Failed to update comment. Please try again.');
      }
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Debug - No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Debug - Deleting comment:', {
        postId,
        commentId
      });

      const response = await axios({
        method: 'delete',
        url: `http://localhost:8080/api/feed/${postId}/comments/${commentId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        console.log('Debug - Comment deleted successfully');
        
        // Update post and comments
        const updatedPost = response.data.post;
        const updatedComments = response.data.comments;
        
        // Update posts state with the new post data
        setPosts(posts.map(p => {
          if (p.id === updatedPost.id) {
            return {
              ...updatedPost,
              author: p.author, // Preserve the author data
              likes: updatedPost.likes || []
            };
          }
          return p;
        }));
        
        // Update comments state
        setPostComments(prev => ({
          ...prev,
          [postId]: updatedComments
        }));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return handleDeleteComment(postId, commentId);
        } else {
          alert('Please log in to delete comment');
          navigate('/login');
        }
      } else {
        alert(error.response?.data?.message || 'Failed to delete comment. Please try again.');
      }
    }
  };

  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}/feed?postId=${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setShareSnackbar({ open: true, message: 'Post URL copied to clipboard!' });
    }).catch(() => {
      setShareSnackbar({ open: true, message: 'Failed to copy URL. Please try again.' });
    });
  };

  const handleCloseSnackbar = () => {
    setShareSnackbar({ open: false, message: '' });
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Please log in to view and interact with posts
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
          >
            Log In
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <HeroSection>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
          Welcome to the Feed
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
          See what photographers are sharing and join the conversation!
        </Typography>
      </HeroSection>

      <Fade in={true} timeout={1000}>
        <Paper 
          elevation={4} 
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 4,
            background: (theme) => `rgba(255,255,255,0.95)`,
            boxShadow: (theme) => `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.08)}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={user?.avatar} 
              alt={user?.name}
              sx={{ 
                width: 56, 
                height: 56, 
                mr: 2,
                border: (theme) => `3px solid ${theme.palette.primary.main}`,
                boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '1.2rem',
              }}
            >
              Share your thoughts, {user?.name}...
            </Typography>
          </Box>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '&.Mui-focused': {
                  boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) => theme.palette.primary.main,
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
                fontSize: '1rem',
                '&::placeholder': {
                  color: (theme) => alpha(theme.palette.text.primary, 0.6),
                  opacity: 1,
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleImageSelect}
            />
            <label htmlFor="image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Image />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  borderColor: (theme) => alpha(theme.palette.common.black, 0.3),
                  color: (theme) => alpha(theme.palette.common.black, 0.8),
                  backgroundColor: (theme) => alpha(theme.palette.common.black, 0.03),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.common.black, 0.08),
                    borderColor: (theme) => alpha(theme.palette.common.black, 0.5),
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => `0 4px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: 1,
                    '& svg': {
                      fontSize: '1.2rem',
                      color: (theme) => alpha(theme.palette.common.black, 0.8),
                    },
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Add Image
              </Button>
            </label>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="video-upload"
              type="file"
              onChange={handleVideoSelect}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<VideoLibrary />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  borderColor: (theme) => alpha(theme.palette.common.black, 0.3),
                  color: (theme) => alpha(theme.palette.common.black, 0.8),
                  backgroundColor: (theme) => alpha(theme.palette.common.black, 0.03),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.common.black, 0.08),
                    borderColor: (theme) => alpha(theme.palette.common.black, 0.5),
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => `0 4px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: 1,
                    '& svg': {
                      fontSize: '1.2rem',
                      color: (theme) => alpha(theme.palette.common.black, 0.8),
                    },
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Add Video
              </Button>
            </label>
          </Box>
          {selectedImage && (
            <Box sx={{ 
              mb: 2,
              position: 'relative',
              '&:hover .remove-button': {
                opacity: 1,
              },
            }}>
              <img
                src={selectedImage}
                alt="Selected"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  borderRadius: 8,
                  objectFit: 'cover',
                  boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              />
              <Button
                size="small"
                onClick={() => setSelectedImage(null)}
                className="remove-button"
                sx={{ 
                  mt: 1,
                  color: 'error.main',
                  opacity: 0.7,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                Remove Image
              </Button>
            </Box>
          )}
          {selectedVideo && (
            <Box sx={{ 
              mb: 2,
              position: 'relative',
              '&:hover .remove-button': {
                opacity: 1,
              },
            }}>
              <video
                src={selectedVideo}
                controls
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  borderRadius: 8,
                  boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              />
              <Button
                size="small"
                onClick={() => setSelectedVideo(null)}
                className="remove-button"
                sx={{ 
                  mt: 1,
                  color: 'error.main',
                  opacity: 0.7,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                Remove Video
              </Button>
            </Box>
          )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreatePost}
            disabled={!newPost.trim() && !selectedImage && !selectedVideo}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: (theme) => `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              '&:disabled': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                color: 'white',
              },
              transition: 'all 0.3s ease',
            }}
        >
          Post
        </Button>
      </Paper>
      </Fade>

      {posts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <img
            src="https://cdn.jsdelivr.net/gh/duyetdev/illustrations@main/undraw_empty_xct9.svg"
            alt="No posts"
            style={{ width: 220, marginBottom: 24, opacity: 0.8 }}
          />
          <Typography variant="h5" sx={{ color: 'grey.400', mb: 1 }}>
            No posts yet
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.500' }}>
            Be the first to share something with the community!
          </Typography>
        </Box>
      )}

      {posts.map((post, index) => (
        <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }} key={post.id}>
          <Card 
            sx={{ 
              mb: 3,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: (theme) => `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.10)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px) scale(1.01)',
                boxShadow: (theme) => `0 12px 36px 0 ${alpha(theme.palette.primary.main, 0.13)}`,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={post.author?.avatar || '/default-avatar.png'} 
                  alt={post.author?.name || 'Anonymous User'}
                  sx={{ 
                    mr: 2,
                    width: 48,
                    height: 48,
                    border: (theme) => `2px solid ${theme.palette.primary.main}`,
                  }} 
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {post.author?.name || 'Anonymous User'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {post.content}
              </Typography>
              {post.imageUrl && (
                <CardMedia
                  component="img"
                  image={post.imageUrl}
                  alt="Post image"
                  sx={{ 
                    mt: 2, 
                    maxHeight: '400px', 
                    objectFit: 'contain',
                    borderRadius: 1,
                  }}
                />
              )}
              {post.videoUrl && (
                <CardMedia
                  component="video"
                  src={post.videoUrl}
                  controls
                  sx={{ 
                    mt: 2, 
                    maxHeight: '400px',
                    borderRadius: 1,
                  }}
                />
              )}
            </CardContent>
            <Divider />
            <CardActions sx={{ px: 2, py: 1 }}>
              <Tooltip title={post.likes?.includes(user?.email) ? "Unlike" : "Like"}>
                <IconButton
                  onClick={() => handleLike(post.id)}
                  sx={{ 
                    color: post.likes?.includes(user?.email) ? 'secondary.main' : 'text.secondary',
                    '&:hover': {
                      color: 'secondary.main',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {post.likes?.includes(user?.email) ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary">
                {post.likes?.length || 0}
              </Typography>
              <Tooltip title="Comment">
                <IconButton 
                  onClick={() => setSelectedPost(post)}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Comment />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary">
                {post.commentCount || 0}
              </Typography>
              <Tooltip title="Share">
                <IconButton 
                  onClick={() => handleShare(post.id)}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Share />
                </IconButton>
              </Tooltip>
              {post.author?.id === user?.id && (
                <>
                  <Tooltip title="Edit">
                    <IconButton 
                      onClick={() => {
                        setEditingPost(post);
                        setIsEditing(true);
                        setEditText(post.content);
                      }}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      onClick={() => handleDeletePost(post.id)}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </CardActions>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Comments
              </Typography>
              {postComments[post.id]?.map((comment) => (
                <Card 
                  key={comment.id} 
                  sx={{ 
                    mb: 1, 
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => `0 4px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        src={comment.author?.avatar} 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          mr: 1,
                          border: (theme) => `1px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        {comment.author?.name?.[0] || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {comment.author?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Box>
                    {editingCommentId === comment.id ? (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => {
                            handleUpdateComment(post.id, comment.id, editCommentText);
                          }}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                          }}
                        >
                          Save
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditCommentText('');
                          }}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ pl: 4 }}>
                        {comment.content}
                      </Typography>
                    )}
                    {comment.author?.email === user?.email && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        mt: 1,
                        gap: 1,
                      }}>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentText(comment.content);
                          }}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'primary.main',
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteComment(post.id, comment.id)}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'error.main',
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                mt: 2,
              }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={() => handleComment(post.id)}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                  }}
                >
                  Post
                </Button>
              </Box>
            </Box>
          </Card>
        </Zoom>
      ))}

      <Dialog
        open={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingPost(null);
          setEditText('');
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setIsEditing(false);
              setEditingPost(null);
              setEditText('');
            }}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={async () => {
              if (!editingPost || !editingPost.id) return;
              try {
                const headers = getAuthHeader();
                if (!headers) return;
                await axios.put(`http://localhost:8080/api/feed/${editingPost.id}`, {
                  content: editText,
                }, {
                  headers: headers
                });
                setIsEditing(false);
                setEditingPost(null);
                setEditText('');
                fetchPosts();
              } catch (error) {
                console.error('Error editing post:', error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                  if (error.response?.data?.includes('not authorized')) {
                    alert('You are not authorized to edit this post');
                  } else {
                    console.warn('Authentication failed. Please log in again.');
                    logout();
                  }
                }
              }
            }}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={shareSnackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {shareSnackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Feed; 