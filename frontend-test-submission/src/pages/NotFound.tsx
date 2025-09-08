import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
} from '@mui/material';
import { Home, Search } from '@mui/icons-material';
import { logger } from '../middleware/logger';

/**
 * 404 Not Found page with comprehensive error logging
 */
const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error('routing', '404 Error: User attempted to access non-existent route', {
      pathname: location.pathname,
      search: location.search,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname, location.search]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: '8rem',
            fontWeight: 700,
            color: 'primary.main',
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom color="text.primary">
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          The page you're looking for doesn't exist. It might have been moved, deleted, 
          or you might have entered the wrong URL.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            component={Link}
            to="/"
            sx={{ minWidth: 150 }}
          >
            Go Home
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<Search />}
            component={Link}
            to="/statistics"
            sx={{ minWidth: 150 }}
          >
            View Statistics
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            If you believe this is an error, please contact support or try again later.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;