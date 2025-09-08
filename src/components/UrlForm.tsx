import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Divider,
  Collapse,
  FormControlLabel,
  Switch,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add, Remove, Send, Clear, Info } from '@mui/icons-material';
import { CreateUrlRequest } from '../types';
import { logger } from '../middleware/logger';

interface UrlFormProps {
  onSubmit: (requests: CreateUrlRequest[]) => Promise<void>;
  loading: boolean;
}

interface UrlInput {
  id: string;
  originalUrl: string;
  validityMinutes: number;
  customShortcode: string;
  useCustomShortcode: boolean;
}

/**
 * Advanced URL form with validation and batch processing
 * Supports 1-5 URLs with custom shortcodes and validity periods
 */
export const UrlForm: React.FC<UrlFormProps> = ({ onSubmit, loading }) => {
  const [urls, setUrls] = useState<UrlInput[]>([
    {
      id: '1',
      originalUrl: '',
      validityMinutes: 30,
      customShortcode: '',
      useCustomShortcode: false,
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addUrlField = () => {
    if (urls.length >= 5) return;
    
    const newUrl: UrlInput = {
      id: Date.now().toString(),
      originalUrl: '',
      validityMinutes: 30,
      customShortcode: '',
      useCustomShortcode: false,
    };
    
    setUrls([...urls, newUrl]);
    logger.logUserAction('add_url_field', 'url-form', { totalFields: urls.length + 1 });
  };

  const removeUrlField = (id: string) => {
    if (urls.length <= 1) return;
    
    setUrls(urls.filter(url => url.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(id)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
    
    logger.logUserAction('remove_url_field', 'url-form', { totalFields: urls.length - 1 });
  };

  const updateUrl = (id: string, field: keyof UrlInput, value: string | number | boolean) => {
    setUrls(urls.map(url => 
      url.id === id ? { ...url, [field]: value } : url
    ));
    
    // Clear related errors when user starts typing
    if (field === 'originalUrl' || field === 'customShortcode') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${id}_${field}`];
        return newErrors;
      });
    }
  };

  const validateUrls = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    urls.forEach(url => {
      // Validate URL
      if (!url.originalUrl.trim()) {
        newErrors[`${url.id}_originalUrl`] = 'URL is required';
        isValid = false;
      } else {
        try {
          const urlObj = new URL(url.originalUrl.trim());
          if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            newErrors[`${url.id}_originalUrl`] = 'URL must start with http:// or https://';
            isValid = false;
          }
        } catch {
          newErrors[`${url.id}_originalUrl`] = 'Invalid URL format';
          isValid = false;
        }
      }

      // Validate validity minutes
      if (url.validityMinutes <= 0 || url.validityMinutes > 10080) {
        newErrors[`${url.id}_validityMinutes`] = 'Validity must be between 1 and 10080 minutes';
        isValid = false;
      }

      // Validate custom shortcode
      if (url.useCustomShortcode) {
        if (!url.customShortcode.trim()) {
          newErrors[`${url.id}_customShortcode`] = 'Custom shortcode is required when enabled';
          isValid = false;
        } else if (!/^[a-zA-Z0-9]{3,20}$/.test(url.customShortcode.trim())) {
          newErrors[`${url.id}_customShortcode`] = 'Shortcode must be 3-20 alphanumeric characters';
          isValid = false;
        }
      }
    });

    // Check for duplicate custom shortcodes
    const customShortcodes = urls
      .filter(url => url.useCustomShortcode && url.customShortcode.trim())
      .map(url => url.customShortcode.trim().toLowerCase());
    
    const duplicates = customShortcodes.filter((code, index) => customShortcodes.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
      urls.forEach(url => {
        if (url.useCustomShortcode && duplicates.includes(url.customShortcode.trim().toLowerCase())) {
          newErrors[`${url.id}_customShortcode`] = 'Duplicate shortcode in this request';
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrls()) {
      logger.warn('url-form', 'Form validation failed', { 
        errorCount: Object.keys(errors).length,
        urlCount: urls.length 
      });
      return;
    }

    const requests: CreateUrlRequest[] = urls.map(url => ({
      originalUrl: url.originalUrl.trim(),
      validityMinutes: url.validityMinutes,
      customShortcode: url.useCustomShortcode ? url.customShortcode.trim() : undefined,
    }));

    logger.logUserAction('submit_urls', 'url-form', {
      urlCount: requests.length,
      customShortcodes: requests.filter(r => r.customShortcode).length,
    });

    await onSubmit(requests);
  };

  const clearForm = () => {
    setUrls([{
      id: '1',
      originalUrl: '',
      validityMinutes: 30,
      customShortcode: '',
      useCustomShortcode: false,
    }]);
    setErrors({});
    logger.logUserAction('clear_form', 'url-form');
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Shorten URLs
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showAdvanced}
              onChange={(_, checked) => setShowAdvanced(checked)}
            />
          }
          label="Advanced Options"
        />
      </Box>

      <form onSubmit={handleSubmit}>
        {urls.map((url, index) => (
          <Box key={url.id} sx={{ mb: 3 }}>
            {index > 0 && <Divider sx={{ mb: 3 }} />}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ 
                  minWidth: 60, 
                  pt: 2,
                  color: 'primary.main',
                  fontWeight: 600 
                }}
              >
                URL #{index + 1}
              </Typography>
              
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Enter URL to shorten"
                  placeholder="https://example.com/very-long-url"
                  value={url.originalUrl}
                  onChange={(e) => updateUrl(url.id, 'originalUrl', e.target.value)}
                  error={!!errors[`${url.id}_originalUrl`]}
                  helperText={errors[`${url.id}_originalUrl`]}
                  disabled={loading}
                  size="medium"
                />
              </Box>

              {urls.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => removeUrlField(url.id)}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  <Remove />
                </IconButton>
              )}
            </Box>

            <Collapse in={showAdvanced}>
              <Box sx={{ ml: 8, display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Validity (minutes)"
                  type="number"
                  value={url.validityMinutes}
                  onChange={(e) => updateUrl(url.id, 'validityMinutes', parseInt(e.target.value) || 30)}
                  error={!!errors[`${url.id}_validityMinutes`]}
                  helperText={errors[`${url.id}_validityMinutes`] || 'Default: 30 minutes'}
                  disabled={loading}
                  sx={{ minWidth: 150 }}
                  InputProps={{
                    inputProps: {
                      min: 1,
                      max: 10080
                    }
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={url.useCustomShortcode}
                        onChange={(_, checked) => updateUrl(url.id, 'useCustomShortcode', checked)}
                        disabled={loading}
                      />
                    }
                    label="Custom Shortcode"
                    sx={{ mt: 1 }}
                  />

                  {url.useCustomShortcode && (
                    <TextField
                      label="Custom shortcode"
                      placeholder="mycode123"
                      value={url.customShortcode}
                      onChange={(e) => updateUrl(url.id, 'customShortcode', e.target.value)}
                      error={!!errors[`${url.id}_customShortcode`]}
                      helperText={errors[`${url.id}_customShortcode`] || '3-20 alphanumeric characters'}
                      disabled={loading}
                      sx={{ flex: 1 }}
                    />
                  )}
                </Box>
              </Box>
            </Collapse>
          </Box>
        ))}

        {urls.length < 5 && (
          <Button
            startIcon={<Add />}
            onClick={addUrlField}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Add Another URL ({urls.length}/5)
          </Button>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info fontSize="small" />
            <Typography variant="body2">
              You can shorten up to 5 URLs at once. Each URL can have a custom validity period and optional custom shortcode.
            </Typography>
          </Box>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearForm}
            disabled={loading}
          >
            Clear Form
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
            disabled={loading || urls.every(url => !url.originalUrl.trim())}
            sx={{ minWidth: 150 }}
          >
            {loading ? 'Processing...' : `Shorten ${urls.filter(u => u.originalUrl.trim()).length} URL${urls.filter(u => u.originalUrl.trim()).length !== 1 ? 's' : ''}`}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};