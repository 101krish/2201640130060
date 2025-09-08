import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  Link as LinkIcon,
  MouseOutlined,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

interface StatisticsCardsProps {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  expiredUrls: number;
}

/**
 * Statistics overview cards for the analytics dashboard
 */
export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  totalUrls,
  totalClicks,
  activeUrls,
  expiredUrls,
}) => {
  const stats = [
    {
      title: 'Total URLs',
      value: totalUrls,
      icon: <LinkIcon />,
      color: 'primary.main',
      description: 'URLs created',
    },
    {
      title: 'Total Clicks',
      value: totalClicks,
      icon: <MouseOutlined />,
      color: 'success.main',
      description: 'Total redirects',
    },
    {
      title: 'Active URLs',
      value: activeUrls,
      icon: <CheckCircle />,
      color: 'info.main',
      description: 'Currently valid',
    },
    {
      title: 'Expired URLs',
      value: expiredUrls,
      icon: <Schedule />,
      color: 'warning.main',
      description: 'No longer valid',
    },
  ];

  return (
    <Box 
      sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className="stats-card"
          sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: stat.color,
                  color: 'white',
                }}
              >
                {stat.icon}
              </Box>
              <Typography
                variant="h3"
                component="div"
                fontWeight={700}
                color={stat.color}
              >
                {stat.value.toLocaleString()}
              </Typography>
            </Box>
            
            <Typography variant="h6" color="text.primary" gutterBottom>
              {stat.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {stat.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};