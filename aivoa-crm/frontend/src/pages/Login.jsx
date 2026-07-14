import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, clearError } from '../store/authSlice';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Container,
} from '@mui/material';
import { Mail, Lock, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('agent@aivoa.ai');
  const [password, setPassword] = useState('password123');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(loginStart());
    try {
      // In production, endpoints are proxied via vite.config.js to http://localhost:8000
      const response = await axios.post('/api/login', { email, password });
      dispatch(loginSuccess({
        token: response.data.access_token,
        user: response.data.user
      }));
      navigate('/');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => theme.palette.background.gradient,
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      {/* Background decorative blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(50px)',
          zIndex: 0,
        }}
      />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '16px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Stethoscope size={32} color="#ffffff" />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, textAlign: 'center', letterSpacing: '-0.025em' }}>
              AIVOA<Box component="span" sx={{ color: 'primary.main' }}>.AI</Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              AI-First Healthcare CRM Portal
            </Typography>
          </Box>

          <Card
            sx={{
              backdropFilter: 'blur(16px)',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Sign In
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={18} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Password"
                    type="password"
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.5, mt: 1 }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Login to Portal'
                    )}
                  </Button>
                </Box>
              </form>

              <Box sx={{ mt: 3, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  DEMO CREDENTIALS:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Email: <strong>agent@aivoa.ai</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Password: <strong>password123</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
