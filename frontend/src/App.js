import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import Photographers from './pages/Photographers';
import LearningPlans from './pages/LearningPlans';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Error from './pages/Error';
import { AuthProvider } from './context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/photographers" element={<Photographers />} />
              <Route path="/learning-plans" element={<LearningPlans />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Error />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App; 