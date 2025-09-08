import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Refresh, GetApp } from '@mui/icons-material';
import { ShortUrl } from '../types';
import { urlService } from '../services/urlService';
import { StatisticsCards } from '../components/StatisticsCards';
import { UrlTable } from '../components/UrlTable';
import { logger } from '../middleware/logger';

/**
 * Comprehensive statistics and analytics page
 * Shows all created URLs with detailed click analytics
 */
export const StatisticsPage: React.FC = () => {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({
    totalUrls: 0,
    totalClicks: 0,
    activeUrls: 0,
    expiredUrls: 0,
  });

  useEffect(() => {
    logger.logUserAction('statistics_page_visit', 'statistics');
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('statistics', 'Loading statistics data');

      // Load all URLs
      const allUrls = urlService.getAllUrls();
      setUrls(allUrls);

      // Get analytics summary
      const analyticsData = urlService.getAnalyticsSummary();
      setAnalytics(analyticsData);

      logger.info('statistics', 'Statistics loaded successfully', {
        urlCount: allUrls.length,
        totalClicks: analyticsData.totalClicks,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      setError(errorMessage);
      
      logger.error('statistics', 'Failed to load statistics', {
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    logger.logUserAction('refresh_statistics', 'statistics');
    loadStatistics();
  };

  const handleExportData = () => {
    try {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        analytics,
        urls: urls.map(url => ({
          shortcode: url.shortcode,
          originalUrl: url.originalUrl,
          createdAt: url.createdAt,
          expiresAt: url.expiresAt,
          clicks: url.clicks.length,
          isCustomShortcode: url.isCustomShortcode,
          validityMinutes: url.validityMinutes,
        })),
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `url-shortener-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.logUserAction('export_statistics_data', 'statistics', {
        urlCount: urls.length,
        totalClicks: analytics.totalClicks,
      });

    } catch (error) {
      logger.error('statistics', 'Failed to export data', {
        error: error instanceof Error ? error.message : 'Export failed',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            Statistics & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive overview of your short URLs and their performance
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportData}
            disabled={urls.length === 0}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <StatisticsCards
        totalUrls={analytics.totalUrls}
        totalClicks={analytics.totalClicks}
        activeUrls={analytics.activeUrls}
        expiredUrls={analytics.expiredUrls}
      />

      {/* Performance Insights */}
      {urls.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Performance Insights
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Average Clicks per URL
              </Typography>
              <Typography variant="h6" color="primary.main">
                {analytics.totalUrls > 0 ? (analytics.totalClicks / analytics.totalUrls).toFixed(1) : '0'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Most Popular URL
              </Typography>
              <Typography variant="h6" color="primary.main">
                {urls.length > 0 ? 
                  `/${urls.reduce((prev, current) => 
                    prev.clicks.length > current.clicks.length ? prev : current
                  ).shortcode}` : 'N/A'
                }
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Active Rate
              </Typography>
              <Typography variant="h6" color="success.main">
                {analytics.totalUrls > 0 ? 
                  `${((analytics.activeUrls / analytics.totalUrls) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Custom Shortcodes
              </Typography>
              <Typography variant="h6" color="info.main">
                {urls.filter(url => url.isCustomShortcode).length}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* URLs Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            All Short URLs ({urls.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed view of all your shortened URLs with click analytics
          </Typography>
        </Box>
        <UrlTable urls={urls} />
      </Paper>
    </Box>
  );
};