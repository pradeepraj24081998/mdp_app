import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { ProfessionalLoader } from './ProfessionalLoader';

interface LoadingStateProps {
  rows?: number;
  height?: number;
  variant?: 'table' | 'cards' | 'detail' | 'spinner';
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 5,
  height = 42,
  variant = 'table',
  message,
}) => {
  if (variant === 'spinner') {
    return <ProfessionalLoader message={message} />;
  }

  if (variant === 'cards') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {Array.from(new Array(4)).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={110}
            sx={{ borderRadius: '10px', bgcolor: '#F4F4F5' }}
          />
        ))}
      </Box>
    );
  }

  if (variant === 'detail') {
    return (
      <Box sx={{ width: '100%', py: 1 }}>
        <Skeleton variant="rounded" height={64} sx={{ mb: 2.5, borderRadius: '10px', bgcolor: '#F4F4F5' }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          {Array.from(new Array(4)).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: '10px', bgcolor: '#F4F4F5' }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: '10px', bgcolor: '#F4F4F5' }} />
      </Box>
    );
  }

  // Default: Table skeleton
  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Skeleton variant="rounded" height={38} sx={{ mb: 1.5, borderRadius: '8px', bgcolor: '#E4E4E7' }} />
      {Array.from(new Array(rows)).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={height}
          sx={{ mb: 0.8, borderRadius: '6px', bgcolor: '#F4F4F5' }}
        />
      ))}
    </Box>
  );
};
