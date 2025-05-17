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
  Paper,
  InputAdornment,
  Chip,
  Fade,
  Zoom,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Camera as CameraIcon,
  AttachMoney as MoneyIcon,
  School as SchoolIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Photographers = () => {
  const [photographers, setPhotographers] = useState([]);
  const [filteredPhotographers, setFilteredPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    qualifications: '',
    budget: '',
    portfolioUrl: '',
  });
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchPhotographers();
  }, [user, isAuthenticated]);

  useEffect(() => {
    const filtered = photographers.filter(photographer => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;

      const searchableFields = [
        photographer.name,
        photographer.email,
        photographer.phone,
        photographer.qualifications,
        photographer.budget?.toString(),
        photographer.portfolioUrl
      ].map(field => (field || '').toLowerCase());

      return searchableFields.some(field => field.includes(searchLower));
    });
    setFilteredPhotographers(filtered);
  }, [searchQuery, photographers]);

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
      phone: photographer.phone || '',
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
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/images/photography-hero.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          mb: 4,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" align="center" gutterBottom>
            Find Your Perfect Photographer
          </Typography>
          <Typography variant="h5" align="center">
            Connect with professional photographers for your special moments
          </Typography>
        </Container>
      </Box>

    <Container maxWidth="lg">
        {/* Search and Filter Section */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by name, email, phone, qualifications, budget..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                helperText={searchQuery && `Found ${filteredPhotographers.length} photographers`}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
                startIcon={<CameraIcon />}
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
            </Grid>
          </Grid>
        </Paper>

        {/* Photographers Grid */}
      <Grid container spacing={3}>
          {filteredPhotographers.map((photographer, index) => (
          <Grid item xs={12} sm={6} md={4} key={photographer.id}>
              <Zoom in style={{ transitionDelay: `${index * 50}ms` }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          mr: 2,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '1.5rem',
                        }}
                      >
                        {photographer.name?.[0] || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {photographer.name || 'Unknown Photographer'}
                        </Typography>
                        <Chip
                          icon={<MoneyIcon />}
                          label={`$${photographer.budget || '0'}`}
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        {photographer.qualifications && (
                          <Chip
                            icon={<SchoolIcon />}
                            label="Professional"
                            size="small"
                            color="secondary"
                          />
                        )}
                      </Box>
                </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <EmailIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        {photographer.email}
                </Typography>
                      {photographer.phone && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <PhoneIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          {photographer.phone}
                </Typography>
                      )}
                      {photographer.qualifications && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <SchoolIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          {photographer.qualifications}
                </Typography>
                      )}
                {photographer.portfolioUrl && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <LinkIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          <a
                            href={photographer.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: theme.palette.primary.main }}
                          >
                            View Portfolio
                          </a>
                  </Typography>
                )}
                    </Box>
              </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Box>
                      {isOwner(photographer) && (
                        <>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(photographer)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(photographer)}
                    >
                      <DeleteIcon />
                    </IconButton>
                        </>
                      )}
                  </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleHire(photographer)}
                    >
                      Contact
                    </Button>
              </CardActions>
            </Card>
              </Zoom>
          </Grid>
        ))}
      </Grid>

        {/* Contact Dialog */}
        <Dialog 
          open={!!selectedPhotographer && !isEditing} 
          onClose={() => {
            setSelectedPhotographer(null);
            setIsEditing(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Contact {selectedPhotographer?.name || 'Photographer'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="primary" />
                  <Typography>
                    Email: {selectedPhotographer?.email || 'Not available'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="primary" />
                  <Typography>
                    Phone: {selectedPhotographer?.phone || 'Not available'}
                  </Typography>
                </Box>
                {selectedPhotographer?.portfolioUrl && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon color="primary" />
                    <Typography>
                      Portfolio: {' '}
                      <a
                        href={selectedPhotographer.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: theme.palette.primary.main }}
                      >
                        View Portfolio
                      </a>
                    </Typography>
                  </Box>
                )}
                {selectedPhotographer?.qualifications && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="primary" />
                    <Typography>
                      Qualifications: {selectedPhotographer.qualifications}
                    </Typography>
                  </Box>
                )}
                {selectedPhotographer?.budget && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="primary" />
                    <Typography>
                      Budget: ${selectedPhotographer.budget}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedPhotographer(null)}>Close</Button>
            {selectedPhotographer?.email && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EmailIcon />}
                onClick={() => window.location.href = `mailto:${selectedPhotographer.email}`}
              >
                Send Email
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setIsEditing(false);
            setSelectedPhotographer(null);
        }}
          maxWidth="sm" 
          fullWidth
      >
          <DialogTitle>
            {isEditing ? 'Edit Photographer Profile' : 'Add Photographer Profile'}
          </DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 2 }}>
          <TextField
                fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
          />
          <TextField
                fullWidth
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
                type="email"
          />
          <TextField
            fullWidth
                label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Qualifications"
            value={formData.qualifications}
            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
            margin="normal"
                multiline
                rows={2}
          />
          <TextField
            fullWidth
            label="Budget"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            margin="normal"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
          />
          <TextField
            fullWidth
            label="Portfolio URL"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            margin="normal"
          />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
              {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

        {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
    </Box>
  );
};

export default Photographers; 