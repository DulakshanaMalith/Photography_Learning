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
  Chip,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  Fade,
  Zoom,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  Topic as TopicIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LearningPlans = () => {
  const [plans, setPlans] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    level: '',
    topics: '',
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const response = await axios.get('http://localhost:8080/api/learning-plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching learning plans:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Please log in to view learning plans');
      }
    }
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title || '',
      description: plan.description || '',
      duration: plan.duration || '',
      level: plan.level || '',
      topics: plan.topics || '',
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (plan) => {
    if (!plan || !plan.id) {
      alert('Invalid learning plan data');
      return;
    }
    if (window.confirm('Are you sure you want to delete this learning plan?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/learning-plans/${plan.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        fetchPlans();
        alert('Learning plan deleted successfully!');
      } catch (error) {
        console.error('Error deleting learning plan:', error);
        alert(error.response?.data?.message || 'Failed to delete learning plan. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.description) {
        alert('Title and description are required fields');
        return;
      }
      if (!user?.id) {
        alert('You must be logged in to create a learning plan');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      if (isEditing && selectedPlan?.id) {
        await axios.put(`http://localhost:8080/api/learning-plans/${selectedPlan.id}`, {
          ...formData,
          author: {
            id: user.id,
            name: user.name
          }
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://localhost:8080/api/learning-plans', {
          ...formData,
          author: {
            id: user.id,
            name: user.name
          }
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      setDialogOpen(false);
      setIsEditing(false);
      setSelectedPlan(null);
      setFormData({
        title: '',
        description: '',
        duration: '',
        level: '',
        topics: '',
      });
      fetchPlans();
    } catch (error) {
      console.error('Error saving learning plan:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Authentication failed. Please log in again.');
      } else if (error.response?.data) {
        alert(error.response.data);
      } else {
        alert('Failed to add learning plan. Please try again.');
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewDetails = (plan) => {
    setSelectedPlanDetails(plan);
    setDetailsDialogOpen(true);
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/learning-hero.jpg")',
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
            Photography Learning Plans
          </Typography>
          <Typography variant="h5" align="center">
            Master photography with structured learning paths
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Action Bar */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                if (!user) {
                  setSnackbar({
                    open: true,
                    message: 'Please log in to create a learning plan',
                    severity: 'warning'
                  });
                  return;
                }
                setDialogOpen(true);
              }}
            >
              Create Learning Plan
            </Button>
          </Box>
        </Paper>

        {/* Learning Plans Grid */}
        <Grid container spacing={3}>
          {plans.map((plan, index) => (
            <Grid item xs={12} sm={6} md={4} key={plan._id}>
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
                          width: 40,
                          height: 40,
                          mr: 2,
                          bgcolor: theme.palette.primary.main,
                        }}
                      >
                        {plan.author?.name?.[0] || '?'}
                      </Avatar>
                      <Typography variant="subtitle1" color="text.secondary">
                        {plan.author?.name || 'Unknown Author'}
                      </Typography>
                    </Box>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {plan.title}
                    </Typography>

                    <Typography
                      variant="body1"
                      paragraph
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {plan.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        icon={<TimeIcon />}
                        label={plan.duration}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        icon={<SchoolIcon />}
                        label={plan.level}
                        size="small"
                        color="secondary"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TopicIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {plan.topics}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                      {user && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(plan)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(plan)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<DescriptionIcon />}
                      onClick={() => handleViewDetails(plan)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Add/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setIsEditing(false);
            setSelectedPlan(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isEditing ? 'Edit Learning Plan' : 'Create Learning Plan'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <DescriptionIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                required
                multiline
                rows={4}
                InputProps={{
                  startAdornment: <DescriptionIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                fullWidth
                label="Duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                margin="normal"
                InputProps={{
                  startAdornment: <TimeIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                fullWidth
                label="Level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                margin="normal"
                InputProps={{
                  startAdornment: <SchoolIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                fullWidth
                label="Topics"
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                margin="normal"
                InputProps={{
                  startAdornment: <TopicIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDialogOpen(false);
              setIsEditing(false);
              setSelectedPlan(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedPlanDetails(null);
          }}
          maxWidth="md"
          fullWidth
        >
          {selectedPlanDetails && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    {selectedPlanDetails.author?.name?.[0] || '?'}
                  </Avatar>
                  <Typography variant="h5" component="div">
                    {selectedPlanDetails.title}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedPlanDetails.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Chip
                      icon={<TimeIcon />}
                      label={`Duration: ${selectedPlanDetails.duration}`}
                      color="primary"
                    />
                    <Chip
                      icon={<SchoolIcon />}
                      label={`Level: ${selectedPlanDetails.level}`}
                      color="secondary"
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Topics Covered
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedPlanDetails.topics}
                  </Typography>

                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Created by {selectedPlanDetails.author?.name || 'Unknown Author'}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    setSelectedPlanDetails(null);
                  }}
                >
                  Close
                </Button>
                {user && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleEdit(selectedPlanDetails);
                    }}
                  >
                    Edit Plan
                  </Button>
                )}
              </DialogActions>
            </>
          )}
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

export default LearningPlans; 