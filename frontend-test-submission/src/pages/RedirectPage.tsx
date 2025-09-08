import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import { Launch, Home } from '@mui/icons-material';
import { urlService } from '../services/urlService';
import { logger } from '../middleware/logger';

/**
 * Redirect page that handles shortcode resolution and analytics tracking
 * Redirects to original URL while recording click analytics
 */
export const RedirectPage: React.FC = () => {
  const { shortcode } = useParams<{ shortcode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!shortcode) {
      setError('Invalid shortcode');
      setLoading(false);
      return;
    }

    handleRedirect();
  }, [shortcode]);

  const handleRedirect = async () => {
    if (!shortcode) return;

    try {
      logger.info('redirect', 'Processing redirect request', { shortcode });

      const url = await urlService.redirectUrl(shortcode);
      setOriginalUrl(url);

      // Brief delay to show redirect message, then redirect
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = url;
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redirect failed';
      setError(errorMessage);
      
      logger.warn('redirect', 'Redirect failed', {
        shortcode,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    if (originalUrl) {
      logger.logUserAction('manual_redirect', 'redirect', { shortcode });
      window.location.href = originalUrl;
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Resolving short URL...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error.main" gutterBottom>
            URL Not Found
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>

          <Typography variant="body1" color="text.secondary" paragraph>
            The short URL you're looking for doesn't exist or has expired.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              href="/"
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (redirecting && originalUrl) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" gutterBottom>
          Redirecting you now...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 500 }}>
          Taking you to: <strong>{originalUrl}</strong>
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<Launch />}
          onClick={handleManualRedirect}
          sx={{ mt: 2 }}
        >
          Click here if not redirected automatically
        </Button>
      </Box>
    );
  }

  // Fallback redirect using React Router
  if (originalUrl) {
    window.location.href = originalUrl;
    return <Navigate to="/" replace />;
  }

  return null;
};