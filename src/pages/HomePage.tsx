import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Alert,
  Snackbar,
  Paper,
  Chip,
} from '@mui/material';
import { TrendingUp, Speed, Security } from '@mui/icons-material';
import { CreateUrlRequest, CreateUrlsResponse } from '../types';
import { urlService } from '../services/urlService';
import { UrlForm } from '../components/UrlForm';
import { UrlResults } from '../components/UrlResults';
import { logger } from '../middleware/logger';

/**
 * Main homepage for URL shortening
 * Features the form, results display, and key benefits
 */
export const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CreateUrlsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    logger.logUserAction('homepage_visit', 'homepage');
  }, []);

  const handleSubmitUrls = async (requests: CreateUrlRequest[]): Promise<void> => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      logger.info('homepage', 'Starting URL creation process', { 
        requestCount: requests.length 
      });

      const result = await urlService.createUrls(requests);
      setResponse(result);

      // Show success message
      const successCount = result.success.length;
      const errorCount = result.errors.length;
      
      if (successCount > 0 && errorCount === 0) {
        setSuccessMessage(`Successfully created ${successCount} short URL${successCount !== 1 ? 's' : ''}!`);
      } else if (successCount > 0 && errorCount > 0) {
        setSuccessMessage(`Created ${successCount} URL${successCount !== 1 ? 's' : ''} successfully. ${errorCount} failed.`);
      }

      logger.info('homepage', 'URL creation completed', {
        successCount,
        errorCount,
        totalRequests: requests.length,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      logger.error('homepage', 'URL creation failed', {
        error: errorMessage,
        requestCount: requests.length,
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Speed />,
      title: 'Lightning Fast',
      description: 'Generate short URLs instantly with our optimized system',
    },
    {
      icon: <Security />,
      title: 'Secure & Reliable',
      description: 'Your URLs are safely stored with comprehensive analytics',
    },
    {
      icon: <TrendingUp />,
      title: 'Advanced Analytics',
      description: 'Track clicks, referrers, and geographic data in real-time',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
          URL Shortener Pro
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9, mb: 3 }}>
          Transform long URLs into powerful, trackable short links
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="Up to 5 URLs at once" 
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} 
          />
          <Chip 
            label="Custom shortcodes" 
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} 
          />
          <Chip 
            label="Detailed analytics" 
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} 
          />
        </Box>
      </Paper>

      {/* Features Section */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {features.map((feature, index) => (
          <Paper key={index} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'white',
                margin: '0 auto 16px',
              }}
            >
              {feature.icon}
            </Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {feature.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Main Form */}
      <UrlForm onSubmit={handleSubmitUrls} loading={loading} />

      {/* Results */}
      <UrlResults response={response} />

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};