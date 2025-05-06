import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const { user, isAuthenticated, logout, refreshToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    console.log('Debug - getAuthHeader - Token from localStorage:', token ? 'exists' : 'null');
    
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }

    // Basic token validation (check if it's a valid JWT format)
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
  };

  const fetchPosts = async () => {
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
        // Process author information
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

        // Process and validate comments
        const comments = (post.comments || []).map(comment => {
          console.log('Debug - Processing comment:', comment);

          // Keep the original ID from the server, don't generate one
          const commentId = comment.id;

          // Ensure comment author information is valid
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

          // Return validated comment object with original ID
          return {
            ...comment,
            id: commentId, // Keep original ID
            author: commentAuthor,
            createdAt: comment.createdAt || new Date().toISOString(),
            updatedAt: comment.updatedAt || new Date().toISOString()
          };
        }).filter(comment => comment.id != null); // Only keep comments with valid IDs

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
  };

  const fetchComments = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Debug - No token found, redirecting to login');
        navigate('/login');
        return;
      }

      // Ensure axios defaults are set with the current token
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
          // Get the new token after refresh
          const newToken = localStorage.getItem('token');
          console.log('Debug - fetchComments - Retrying with new token:', newToken.substring(0, 20) + '...');
          
          // Update axios defaults with new token
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Add a small delay to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Retry the request with new token
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
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    try {
      const headers = getAuthHeader();
      if (!headers) return;

      await axios.post('http://localhost:8080/api/feed', {
        content: newPost,
        author: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }, {
        headers: headers
      });
      setNewPost('');
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

  const handleComment = async () => {
    if (!commentText.trim()) {
      console.warn('Attempted to add empty comment');
      return;
    }

    if (!selectedPost || !selectedPost.id) {
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

      console.log('Debug - Adding comment to post:', selectedPost.id);
      const response = await axios.post(
        `http://localhost:8080/api/feed/${selectedPost.id}/comments`,
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
          [selectedPost.id]: updatedComments
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return handleComment();
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

  const handleEditPost = async () => {
    if (!selectedPost || !selectedPost.id) {
      console.error('Cannot edit post: post ID is undefined');
      return;
    }

    try {
      const headers = getAuthHeader();
      if (!headers) return;

      await axios.put(`http://localhost:8080/api/feed/${selectedPost.id}`, {
        content: editText,
      }, {
        headers: headers
      });
      
      setIsEditing(false);
      setSelectedPost(null);
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
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreatePost}
          disabled={!newPost.trim()}
        >
          Post
        </Button>
      </Paper>

      {posts.map((post) => (
        <Card key={post.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                src={post.author?.avatar || '/default-avatar.png'} 
                alt={post.author?.name || 'Anonymous User'}
                sx={{ mr: 2 }} 
              />
              <Typography variant="h6">
                {post.author?.name || 'Anonymous User'}
              </Typography>
            </Box>
            <Typography variant="body1">{post.content}</Typography>
          </CardContent>
          <CardActions>
            <IconButton
              onClick={() => handleLike(post.id)}
              color={post.likes?.includes(user?.email) ? 'secondary' : 'default'}
            >
              {post.likes?.includes(user?.email) ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <Typography>{post.likes?.length || 0}</Typography>
            <IconButton onClick={() => setSelectedPost(post)}>
              <Comment />
            </IconButton>
            <Typography>{post.commentCount || 0}</Typography>
            {post.author?.id === user?.id && (
              <>
                <IconButton onClick={() => {
                  setSelectedPost(post);
                  setIsEditing(true);
                  setEditText(post.content);
                }}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDeletePost(post.id)}>
                  <Delete />
                </IconButton>
              </>
            )}
          </CardActions>
        </Card>
      ))}

      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Comments</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            {postComments[selectedPost?.id]?.map((comment) => (
              <Card key={comment.id} sx={{ mb: 1, bgcolor: 'grey.100' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      src={comment.author?.avatar} 
                      sx={{ width: 24, height: 24, mr: 1 }}
                    >
                      {comment.author?.name?.[0] || '?'}
                    </Avatar>
                    <Typography variant="subtitle2">
                      {comment.author?.name || 'Unknown User'}
                    </Typography>
                  </Box>
                  
                  {editingCommentId === comment.id ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                      />
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => {
                          handleUpdateComment(selectedPost.id, comment.id, editCommentText);
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
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body2">{comment.content}</Typography>
                      {comment.author?.email === user?.email && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditCommentText(comment.content);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button variant="contained" onClick={handleComment}>
              Post
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
      >
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={handleEditPost}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Feed; 