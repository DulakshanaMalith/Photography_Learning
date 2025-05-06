import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Photographers = () => {
  const [photographers, setPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    qualifications: '',
    budget: '',
    portfolioUrl: '',
  });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Debug - Auth State:', {
      user,
      isAuthenticated,
      token,
    });
    fetchPhotographers();
  }, [user, isAuthenticated]);

  const fetchPhotographers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/photographers');
      console.log('Debug - Fetched photographers:', response.data);
      setPhotographers(response.data);
    } catch (error) {
      console.error('Error fetching photographers:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching photographers. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.email) {
        setSnackbar({
          open: true,
          message: 'Name and email are required fields',
          severity: 'error'
        });
        return;
      }

      if (isEditing && selectedPhotographer?.id) {
        await axios.put(`http://localhost:8080/api/photographers/${selectedPhotographer.id}`, formData);
      } else {
        await axios.post('http://localhost:8080/api/photographers', formData);
      }

      setDialogOpen(false);
      setIsEditing(false);
      setSelectedPhotographer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        qualifications: '',
        budget: '',
        portfolioUrl: '',
      });
      await fetchPhotographers();
      setSnackbar({
        open: true,
        message: `Photographer profile ${isEditing ? 'updated' : 'created'} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving photographer:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save photographer. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleEdit = (photographer) => {
    if (!photographer || !photographer.id) {
      setSnackbar({
        open: true,
        message: 'Invalid photographer data',
        severity: 'error'
      });
      return;
    }
    setSelectedPhotographer(photographer);
    setFormData({
      name: photographer.name || '',
      email: photographer.email || '',
      phone: photographer.phoneNumber || '',
      qualifications: photographer.qualifications || '',
      budget: photographer.budget || '',
      portfolioUrl: photographer.portfolioUrl || '',
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (photographer) => {
    console.log('Debug - Attempting to delete photographer:', photographer);
    
    if (!photographer || !photographer.id) {
      console.error('Debug - Invalid photographer data:', { photographer });
      setSnackbar({
        open: true,
        message: 'Invalid photographer data',
        severity: 'error'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this photographer profile?')) {
      try {
        const token = localStorage.getItem('token');
        console.log('Debug - Deleting photographer with ID:', photographer.id);
        
        await axios.delete(`http://localhost:8080/api/photographers/${photographer.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        await fetchPhotographers();
        setSnackbar({
          open: true,
          message: 'Photographer profile deleted successfully!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Debug - Error deleting photographer:', error.response || error);
        const errorMessage = error.response?.status === 403
          ? 'You are not authorized to delete this profile.'
          : error.response?.data?.message || 'Failed to delete photographer. Please try again.';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    }
  };

  const handleHire = (photographer) => {
    setSelectedPhotographer(photographer);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isOwner = (photographer) => {
    // Now we only check if the user is authenticated
    return isAuthenticated;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Photographers</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (!isAuthenticated) {
              setSnackbar({
                open: true,
                message: 'Please log in to add a photographer profile',
                severity: 'warning'
              });
              return;
            }
            setIsEditing(false);
            setFormData({
              name: '',
              email: user?.email || '',
              phone: '',
              qualifications: '',
              budget: '',
              portfolioUrl: '',
            });
            setDialogOpen(true);
          }}
        >
          Add Photographer Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        {photographers.map((photographer) => (
          <Grid item xs={12} sm={6} md={4} key={photographer.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>{photographer.name?.[0] || '?'}</Avatar>
                  <Typography variant="h6">{photographer.name || 'Unknown Photographer'}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email: {photographer.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Qualifications: {photographer.qualifications || 'Not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Budget: ${photographer.budget || '0'}
                </Typography>
                {photographer.portfolioUrl && (
                  <Typography variant="body2" color="text.secondary">
                    Portfolio: {photographer.portfolioUrl}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleHire(photographer)}
                  >
                    Hire Me
                  </Button>
                </Box>
                {isAuthenticated && (
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(photographer)}
                      title="Edit profile"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(photographer)}
                      title="Delete profile"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setIsEditing(false);
        }}
        key="add-photographer-dialog"
      >
        <DialogTitle>{isEditing ? 'Edit Photographer Profile' : 'Add Photographer Profile'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            required
            disabled={true}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Qualifications"
            value={formData.qualifications}
            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Portfolio URL"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setIsEditing(false);
          }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedPhotographer && !isEditing}
        onClose={() => setSelectedPhotographer(null)}
        key="contact-info-dialog"
      >
        <DialogTitle>Contact Information</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Phone: {selectedPhotographer?.phone || 'Not available'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPhotographer(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Photographers; 