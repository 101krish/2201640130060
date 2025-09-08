import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Tooltip,
  Collapse,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ContentCopy,
  Launch,
  ExpandMore,
  ExpandLess,
  Visibility,
  AccessTime,
  Link as LinkIcon,
} from '@mui/icons-material';
import { ShortUrl, ClickEvent } from '../types';
import { logger } from '../middleware/logger';

interface UrlTableProps {
  urls: ShortUrl[];
}

/**
 * Comprehensive table displaying all URLs with detailed analytics
 */
export const UrlTable: React.FC<UrlTableProps> = ({ urls }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [clicksDialog, setClicksDialog] = useState<{
    open: boolean;
    clicks: ClickEvent[];
    shortcode: string;
  }>({ open: false, clicks: [], shortcode: '' });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = async (shortcode: string) => {
    const shortUrl = `${window.location.origin}/${shortcode}`;
    
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedUrl(shortcode);
      setTimeout(() => setCopiedUrl(null), 2000);
      
      logger.logUserAction('copy_short_url', 'url-table', { shortcode });
    } catch (error) {
      logger.error('url-table', 'Failed to copy URL to clipboard', { 
        shortcode, 
        error: error.message 
      });
    }
  };

  const handleOpenUrl = (originalUrl: string, shortcode: string) => {
    window.open(originalUrl, '_blank', 'noopener,noreferrer');
    logger.logUserAction('open_original_url', 'url-table', { shortcode });
  };

  const handleViewClicks = (clicks: ClickEvent[], shortcode: string) => {
    setClicksDialog({ open: true, clicks, shortcode });
    logger.logUserAction('view_click_details', 'url-table', { 
      shortcode, 
      clickCount: clicks.length 
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
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

  const sortedUrls = [...urls].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const paginatedUrls = sortedUrls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (urls.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No URLs found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first short URL to see statistics here.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell>Short URL</TableCell>
              <TableCell>Original URL</TableCell>
              <TableCell align="center">Clicks</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUrls.map((url) => (
              <React.Fragment key={url.id}>
                <TableRow
                  className={isExpired(url.expiresAt) ? 'expired-url' : 'url-card'}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        color="primary.main"
                        fontWeight={600}
                      >
                        /{url.shortcode}
                      </Typography>
                      {url.isCustomShortcode && (
                        <Chip label="Custom" size="small" color="secondary" />
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={url.originalUrl}
                    >
                      {url.originalUrl}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {url.clicks.length}
                      </Typography>
                      {url.clicks.length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => handleViewClicks(url.clicks, url.shortcode)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      icon={<AccessTime />}
                      label={isExpired(url.expiresAt) ? 'Expired' : getTimeRemaining(url.expiresAt)}
                      size="small"
                      color={isExpired(url.expiresAt) ? 'error' : 'success'}
                      variant={isExpired(url.expiresAt) ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(url.createdAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title={copiedUrl === url.shortcode ? 'Copied!' : 'Copy short URL'}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUrl(url.shortcode)}
                          color={copiedUrl === url.shortcode ? 'success' : 'primary'}
                          disabled={isExpired(url.expiresAt)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Open original URL">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenUrl(url.originalUrl, url.shortcode)}
                          color="primary"
                        >
                          <Launch fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(url.id)}
                      >
                        {expandedRow === url.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <Collapse in={expandedRow === url.id}>
                      <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Additional Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Validity Period
                            </Typography>
                            <Typography variant="body2">
                              {url.validityMinutes} minutes
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Expires At
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTime(url.expiresAt)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Shortcode Type
                            </Typography>
                            <Typography variant="body2">
                              {url.isCustomShortcode ? 'Custom' : 'Generated'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Last Click
                            </Typography>
                            <Typography variant="body2">
                              {url.clicks.length > 0 
                                ? formatDateTime(url.clicks[url.clicks.length - 1].timestamp)
                                : 'Never'
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={urls.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Click Details Dialog */}
      <Dialog
        open={clicksDialog.open}
        onClose={() => setClicksDialog({ open: false, clicks: [], shortcode: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Click Analytics for /{clicksDialog.shortcode}
        </DialogTitle>
        <DialogContent>
          {clicksDialog.clicks.length === 0 ? (
            <Typography color="text.secondary">
              No clicks recorded yet.
            </Typography>
          ) : (
            <List>
              {clicksDialog.clicks.map((click, index) => (
                <React.Fragment key={click.id}>
                  <ListItem>
                    <ListItemText
                      primary={formatDateTime(click.timestamp)}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="div">
                            <strong>Referrer:</strong> {click.referrer || 'Direct'}
                          </Typography>
                          {click.geoLocation?.country && (
                            <Typography variant="body2" component="div">
                              <strong>Location:</strong> {click.geoLocation.city && `${click.geoLocation.city}, `}{click.geoLocation.country}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" component="div">
                            {click.userAgent}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < clicksDialog.clicks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};