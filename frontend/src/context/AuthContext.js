import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const setAuthToken = (token) => {
    console.log('Debug - setAuthToken called with token:', token ? token.substring(0, 20) + '...' : 'null');
    
    // Clear existing token first
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    
    if (token) {
      try {
        // Set new token
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token was set correctly
        const storedToken = localStorage.getItem('token');
        const axiosToken = axios.defaults.headers.common['Authorization'];
        
        const tokenMatch = storedToken === token && 
                          axiosToken === `Bearer ${token}`;
        
        console.log('Debug - setAuthToken verification:', {
          localStorage: storedToken ? storedToken.substring(0, 20) + '...' : 'null',
          axiosDefaults: axiosToken ? axiosToken.substring(7, 27) + '...' : 'null',
          match: tokenMatch
        });
        
        if (!tokenMatch) {
          console.error('Debug - setAuthToken - Token mismatch detected');
          delete axios.defaults.headers.common['Authorization'];
          localStorage.removeItem('token');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Debug - setAuthToken - Error setting token:', error);
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
        return false;
      }
    } else {
      console.log('Debug - Token removed from localStorage and axios defaults');
      return true;
    }
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Debug - refreshToken - Current token:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.log('Debug - refreshToken - No token to refresh');
        return false;
      }

      // Clear existing axios defaults before making the refresh request
      const currentDefaults = { ...axios.defaults.headers.common };
      delete axios.defaults.headers.common['Authorization'];

      console.log('Debug - refreshToken - Attempting refresh');
      const response = await axios.post('http://localhost:8080/api/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Debug - refreshToken - Response:', response.data ? 'success' : 'no data');
      if (response.data && response.data.token) {
        console.log('Debug - refreshToken - New token received:', response.data.token.substring(0, 20) + '...');
        
        // Clear old token first
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
        
        // Small delay to ensure old token is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set new token
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        console.log('Debug - refreshToken - Updated axios defaults with new token');
        
        // Update user data if available
        if (response.data.user) {
          setUser(response.data.user);
        }
        
        // Verify the token was set correctly
        const currentToken = localStorage.getItem('token');
        const axiosToken = axios.defaults.headers.common['Authorization'];
        console.log('Debug - refreshToken - Verification:', {
          localStorage: currentToken ? currentToken.substring(0, 20) + '...' : 'null',
          axiosDefaults: axiosToken ? axiosToken.substring(7, 27) + '...' : 'null',
          match: currentToken && axiosToken === `Bearer ${currentToken}`
        });

        // Test the new token with a simple request
        try {
          const testResponse = await axios.get('http://localhost:8080/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${response.data.token}`
            }
          });
          
          if (testResponse.status === 200) {
            console.log('Debug - refreshToken - New token validated successfully');
            return true;
          } else {
            console.error('Debug - refreshToken - Token validation failed with status:', testResponse.status);
            setAuthToken(null);
            setUser(null);
            return false;
          }
        } catch (validationError) {
          console.error('Debug - refreshToken - Token validation request failed:', validationError.response?.status);
          // Restore previous defaults if validation fails
          axios.defaults.headers.common = currentDefaults;
          setAuthToken(null);
          setUser(null);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error);
      console.log('Debug - refreshToken - Error status:', error.response?.status);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Debug - refreshToken - Auth error, clearing tokens');
        setAuthToken(null);
        setUser(null);
      }
      return false;
    }
  };

  const fetchUserData = async (token) => {
    try {
      console.log('Debug - fetchUserData - Attempting to fetch user data with token:', token ? token.substring(0, 20) + '...' : 'null');
      
      const response = await axios.get('http://localhost:8080/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Debug - fetchUserData - Response received:', response.status);
      console.log('User data fetched:', response.data);
      
      // Add token to user object
      const userWithToken = {
        ...response.data,
        token: token
      };
      setUser(userWithToken);
      return true;
    } catch (error) {
      console.error('Debug - fetchUserData - Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        headers: error.response?.headers
      });
      
      if (error.response?.status === 401) {
        console.log('Debug - fetchUserData - 401 received, attempting token refresh');
        const refreshed = await refreshToken();
        if (refreshed) {
          console.log('Debug - fetchUserData - Token refreshed successfully, retrying fetch');
          return fetchUserData(localStorage.getItem('token'));
        }
        console.log('Debug - fetchUserData - Token refresh failed, clearing auth state');
        setAuthToken(null);
        setUser(null);
        navigate('/login');
      }
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Debug - initializeAuth - Starting authentication initialization');
      const token = localStorage.getItem('token');
      console.log('Debug - initializeAuth - Initial token:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (token) {
        console.log('Debug - initializeAuth - Token found, setting auth token');
        const tokenSet = setAuthToken(token);
        if (!tokenSet) {
          console.log('Debug - initializeAuth - Failed to set auth token');
          setLoading(false);
          return;
        }
        
        console.log('Debug - initializeAuth - Fetching user data');
        const success = await fetchUserData(token);
        if (!success) {
          console.log('Debug - initializeAuth - Failed to fetch user data');
          setAuthToken(null);
          setUser(null);
        } else {
          console.log('Debug - initializeAuth - User data fetched successfully');
        }
      } else {
        console.log('Debug - initializeAuth - No token found');
      }
      setLoading(false);
    };

    initializeAuth();
  }, [navigate]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', email);
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password,
      });
      
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }
      
      const { token, user } = response.data;
      console.log('Login successful, token received');
      setAuthToken(token);
      // Add token to user object
      const userWithToken = {
        ...user,
        token: token
      };
      setUser(userWithToken);
      navigate('/feed');
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred during login');
      }
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration with:', userData);
      const response = await axios.post('http://localhost:8080/api/auth/register', userData);
      const { token, user } = response.data;
      console.log('Registration successful, token received');
      setAuthToken(token);
      // Add token to user object
      const userWithToken = {
        ...user,
        token: token
      };
      setUser(userWithToken);
      navigate('/feed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { message: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    console.log('Logging out');
    setAuthToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const googleLogin = async (token) => {
    try {
      console.log('Attempting Google login with token:', token.substring(0, 20) + '...');
      
      // Ensure we're sending the token with the correct key
      const requestData = {
        credential: token
      };
      
      console.log('Sending request with data:', requestData);
      
      const response = await axios.post('http://localhost:8080/api/auth/google', 
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.data || !response.data.token) {
        console.error('Invalid response from server:', response.data);
        throw new Error('Invalid response from server');
      }
      
      const { token: jwtToken, user } = response.data;
      console.log('Google login successful, token received:', jwtToken.substring(0, 20) + '...');
      setAuthToken(jwtToken);
      // Add token to user object
      const userWithToken = {
        ...user,
        token: jwtToken
      };
      setUser(userWithToken);
      navigate('/feed');
    } catch (error) {
      console.error('Google login error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred during Google login');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      googleLogin,
      refreshToken,
      setAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 