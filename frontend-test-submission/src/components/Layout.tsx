import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Home, Analytics, GitHub } from '@mui/icons-material';
import { logger } from '../middleware/logger';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main application layout with navigation and responsive design
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  React.useEffect(() => {
    logger.logUserAction('page_view', 'layout', {
      pathname: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname]);

  const handleNavClick = (page: string) => {
    logger.logUserAction('navigation', 'layout', { targetPage: page });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            URL Shortener Pro
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Home">
              <IconButton
                color="inherit"
                component={Link}
                to="/"
                onClick={() => handleNavClick('home')}
                sx={{
                  backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                <Home />
              </IconButton>
            </Tooltip>

            <Tooltip title="Statistics">
              <IconButton
                color="inherit"
                component={Link}
                to="/statistics"
                onClick={() => handleNavClick('statistics')}
                sx={{
                  backgroundColor: location.pathname === '/statistics' ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                <Analytics />
              </IconButton>
            </Tooltip>

            <Tooltip title="View on GitHub">
              <IconButton
                color="inherit"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleNavClick('github')}
              >
                <GitHub />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          py: 4,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          mt: 'auto',
          backgroundColor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            © 2024 URL Shortener Pro - Built with React & Material UI
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};