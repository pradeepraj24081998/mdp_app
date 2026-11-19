import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  borderColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#14532D',
  iconBg = '#F0FDF4',
  borderColor = '#E4E4E7',
  trend,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      elevation={0}
      sx={{
        height: '100%',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          backgroundColor: iconColor,
        },
        '&:hover': {
          borderColor: onClick ? iconColor : borderColor,
          boxShadow: onClick ? `0 10px 25px -5px ${iconColor}20, 0 8px 10px -6px ${iconColor}15` : '0 4px 12px rgba(0,0,0,0.05)',
          transform: onClick ? 'translateY(-3px)' : 'none',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.2 }, pt: { xs: 2.2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.2 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#52525B',
              fontWeight: 700,
              fontSize: '0.74rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: iconBg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${iconColor}30`,
                boxShadow: `0 2px 8px ${iconColor}20`,
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'scale(1.08)' },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: '#09090B',
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            mb: 0.8,
          }}
        >
          {value}
        </Typography>

        {(subtitle || trend) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {trend && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  color: trend.isPositive ? '#065F46' : '#991B1B',
                  backgroundColor: trend.isPositive ? '#ECFDF5' : '#FEF2F2',
                  px: 0.9,
                  py: 0.3,
                  borderRadius: '6px',
                  border: `1px solid ${trend.isPositive ? '#A7F3D0' : '#FECACA'}`,
                }}
              >
                {trend.value}
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#71717A', fontSize: '0.74rem', fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

