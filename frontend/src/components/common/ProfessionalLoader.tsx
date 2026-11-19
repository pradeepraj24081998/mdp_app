import React from 'react';
import { Box, Typography, CircularProgress, keyframes } from '@mui/material';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

interface ProfessionalLoaderProps {
  message?: string;
  submessage?: string;
  size?: number;
  fullscreen?: boolean;
}

export const ProfessionalLoader: React.FC<ProfessionalLoaderProps> = ({
  message = 'Loading MDP Aroma...',
  submessage = 'Connecting to workspace',
  size = 36,
  fullscreen = false,
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
        {/* Subtle background track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{ color: '#E4E4E7' }}
        />
        {/* Deep Green primary spinner */}
        <CircularProgress
          variant="indeterminate"
          disableShrink
          size={size}
          thickness={4}
          sx={{
            color: '#14532D',
            position: 'absolute',
            left: 0,
            animationDuration: '850ms',
          }}
        />
      </Box>

      {message && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#18181B',
            letterSpacing: '-0.01em',
            mb: 0.3,
          }}
        >
          {message}
        </Typography>
      )}

      {submessage && (
        <Typography
          variant="caption"
          sx={{
            color: '#71717A',
            fontSize: '0.75rem',
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        >
          {submessage}
        </Typography>
      )}
    </Box>
  );

  if (fullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(251, 251, 250, 0.88)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};
