import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  Button,
  Snackbar,
  Tooltip,
  Divider,
  Collapse,
} from '@mui/material';
import {
  ContentCopy,
  Launch,
  AccessTime,
  Link as LinkIcon,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { ShortUrl, CreateUrlsResponse } from '../types';
import { logger } from '../middleware/logger';

interface UrlResultsProps {
  response: CreateUrlsResponse | null;
}

/**
 * Display component for URL shortening results
 * Shows successful URLs and errors with comprehensive information
 */
export const UrlResults: React.FC<UrlResultsProps> = ({ response }) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  if (!response) return null;

  const handleCopyUrl = async (shortcode: string) => {
    const shortUrl = `${window.location.origin}/${shortcode}`;
    
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedUrl(shortcode);
      setTimeout(() => setCopiedUrl(null), 2000);
      
      logger.logUserAction('copy_short_url', 'url-results', { shortcode });
    } catch (error) {
      logger.error('url-results', 'Failed to copy URL to clipboard', { 
        shortcode, 
        error: error.message 
      });
    }
  };

  const handleOpenUrl = (originalUrl: string, shortcode: string) => {
    window.open(originalUrl, '_blank', 'noopener,noreferrer');
    logger.logUserAction('open_original_url', 'url-results', { shortcode });
  };

  const toggleExpanded = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const isExpired = (expiresAt: Date) => {
    return new Date() > expiresAt;
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Results
      </Typography>

      {/* Success Results */}
      {response.success.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircle color="success" />
            <Typography variant="h6" color="success.main">
              Successfully Created ({response.success.length})
            </Typography>
          </Box>

          {response.success.map((url) => (
            <Card 
              key={url.id} 
              className="url-card"
              sx={{ 
                mb: 2, 
                backgroundColor: isExpired(url.expiresAt) ? 'error.lighter' : 'background.paper',
                opacity: isExpired(url.expiresAt) ? 0.7 : 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LinkIcon color="primary" fontSize="small" />
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontFamily: 'monospace',
                          color: 'primary.main',
                          wordBreak: 'break-all',
                        }}
                      >
                        {window.location.origin}/{url.shortcode}
                      </Typography>
                      {url.isCustomShortcode && (
                        <Chip label="Custom" size="small" color="secondary" />
                      )}
                    </Box>
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ wordBreak: 'break-all', mb: 1 }}
                    >
                      {url.originalUrl}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<AccessTime />}
                        label={isExpired(url.expiresAt) ? 'Expired' : `Expires in ${getTimeRemaining(url.expiresAt)}`}
                        size="small"
                        color={isExpired(url.expiresAt) ? 'error' : 'default'}
                        variant={isExpired(url.expiresAt) ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label={`Created ${formatDateTime(url.createdAt)}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                    <Tooltip title={copiedUrl === url.shortcode ? 'Copied!' : 'Copy short URL'}>
                      <IconButton
                        onClick={() => handleCopyUrl(url.shortcode)}
                        color={copiedUrl === url.shortcode ? 'success' : 'primary'}
                        disabled={isExpired(url.expiresAt)}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Open original URL">
                      <IconButton
                        onClick={() => handleOpenUrl(url.originalUrl, url.shortcode)}
                        color="primary"
                      >
                        <Launch />
                      </IconButton>
                    </Tooltip>

                    <IconButton
                      onClick={() => toggleExpanded(url.id)}
                      size="small"
                    >
                      {expandedCard === url.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={expandedCard === url.id}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Validity Period
                      </Typography>
                      <Typography variant="body2">
                        {url.validityMinutes} minutes
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Expiry Date
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(url.expiresAt)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Clicks
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight={600}>
                        {url.clicks.length}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Shortcode Type
                      </Typography>
                      <Typography variant="body2">
                        {url.isCustomShortcode ? 'Custom' : 'Generated'}
                      </Typography>
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Error Results */}
      {response.errors.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ErrorIcon color="error" />
            <Typography variant="h6" color="error.main">
              Errors ({response.errors.length})
            </Typography>
          </Box>

          {response.errors.map((error, index) => (
            <Alert key={index} severity="error" sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>URL #{error.index + 1}:</strong> {error.error}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Copy Success Snackbar */}
      <Snackbar
        open={!!copiedUrl}
        autoHideDuration={2000}
        onClose={() => setCopiedUrl(null)}
        message="Short URL copied to clipboard!"
      />
    </Paper>
  );
};