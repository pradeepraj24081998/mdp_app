import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'success' | 'warning';
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  requireReason = false,
  reasonLabel = 'Reason',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError(true);
      return;
    }
    setError(false);
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError(false);
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: '#0F172A' }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#475569', fontSize: '0.875rem' }}>
          {message}
        </DialogContentText>
        {requireReason && (
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              label={reasonLabel}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError(false);
              }}
              error={error}
              helperText={error ? `${reasonLabel} is required` : ''}
              placeholder="Please provide details..."
              size="small"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
          sx={{ fontWeight: 600 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
