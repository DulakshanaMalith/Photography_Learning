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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LearningPlans = () => {
  const [plans, setPlans] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    level: '',
    topics: '',
  });
  const { user } = useAuth();

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setDialogOpen(true)}
        >
          Create Learning Plan
        </Button>
      </Box>

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    {plan.author?.name?.[0] || '?'}
                  </Avatar>
                  <Typography variant="h6">
                    {plan.author?.name || 'Unknown Author'}
                  </Typography>
                </Box>
                <Typography variant="h5" gutterBottom>
                  {plan.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {plan.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duration: {plan.duration}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Level: {plan.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Topics: {plan.topics}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Details
                </Button>
                <Button size="small" color="primary" onClick={() => handleEdit(plan)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(plan)}>
                  Delete
                </Button>
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
          setSelectedPlan(null);
        }}
        key="add-learning-plan-dialog"
      >
        <DialogTitle>{isEditing ? 'Edit Learning Plan' : 'Add Learning Plan'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            required
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            fullWidth
            label="Duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Topics"
            multiline
            rows={2}
            value={formData.topics}
            onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setIsEditing(false);
            setSelectedPlan(null);
          }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LearningPlans; 