import React from 'react';
import { Box, Typography } from '@mui/material';

interface MdpLogoProps {
  compact?: boolean;
  size?: 'small' | 'medium' | 'large';
  light?: boolean;
}

export const MdpLogo: React.FC<MdpLogoProps> = ({
  compact = false,
  size = 'medium',
  light = false,
}) => {
  const iconSize = size === 'small' ? 24 : size === 'large' ? 36 : 28;
  const fontSize = size === 'small' ? '0.95rem' : size === 'large' ? '1.35rem' : '1.1rem';

  const iconElement = (
    <Box
      sx={{
        width: iconSize + 6,
        height: iconSize + 6,
        minWidth: iconSize + 6,
        borderRadius: '7px',
        backgroundColor: light ? '#FFFFFF' : '#14532D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: light ? '#14532D' : '#FFFFFF',
        transition: 'transform 0.2s ease',
      }}
    >
      {/* Minimal botanical leaf / subtle aroma flame SVG motif */}
      <svg
        width={iconSize - 4}
        height={iconSize - 4}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C8 6 4 10 4 14.5C4 18.64 7.36 22 11.5 22C12.35 22 13.17 21.85 13.93 21.59C14.7 20.31 15.5 18.23 15.5 15.5C15.5 11.5 12 7 12 2Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M14.5 9.5C16 11.5 18 13.5 18 16C18 17.5 17.3 18.8 16.2 19.8C16.8 17.6 16.5 14.5 14.5 9.5Z"
          fill="#D97706"
          opacity="0.95"
        />
      </svg>
    </Box>
  );

  if (compact) {
    return iconElement;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, userSelect: 'none' }}>
      {iconElement}
      <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize,
            letterSpacing: '-0.025em',
            color: light ? '#FFFFFF' : '#18181B',
            lineHeight: 1.15,
          }}
        >
          MDP Aroma
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: light ? 'rgba(255,255,255,0.7)' : '#71717A',
            fontSize: '0.66rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'block',
          }}
        >
          Enterprise ERP
        </Typography>
      </Box>
    </Box>
  );
};
