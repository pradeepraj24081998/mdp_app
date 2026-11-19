import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There is currently no data to display for this view.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px dashed #CBD5E1',
      }}
    >
      <Box sx={{ color: '#94A3B8', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon || <InboxOutlinedIcon sx={{ fontSize: 52, color: '#94A3B8' }} />}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 420, mb: actionText ? 2.5 : 0 }}>
        {description}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} sx={{ mt: 1 }}>
          {actionText}
        </Button>
      )}
    </Box>
  );
};
