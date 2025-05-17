import React from 'react';
import { Box, Typography, Button, Container, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)',
  padding: theme.spacing(10, 0),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(6),
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  height: '100%',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <HeroSection>
        <Typography variant="h2" gutterBottom>
          Welcome to Photography Learning Platform
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Learn, share, and connect with photographers around the world.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/login')}
        >
          Get Started
        </Button>
      </HeroSection>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <FeatureCard>
            <Typography variant="h5" gutterBottom>
              Learn
            </Typography>
            <Typography>
              Explore curated learning plans and improve your photography skills.
            </Typography>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <FeatureCard>
            <Typography variant="h5" gutterBottom>
              Share
            </Typography>
            <Typography>
              Share your photos and get feedback from the community.
            </Typography>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <FeatureCard>
            <Typography variant="h5" gutterBottom>
              Connect
            </Typography>
            <Typography>
              Connect with photographers and join a vibrant community.
            </Typography>
          </FeatureCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 