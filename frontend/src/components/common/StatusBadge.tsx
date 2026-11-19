import React from 'react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  // Approvals & Success
  APPROVED: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  COMPLETED: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  PASSED: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  PAID: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  VERIFIED: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  ACTIVE: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  DELIVERED: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  HEALTHY: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },

  // Warnings & Reviews
  PENDING: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  REVIEW: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  MANAGER_REVIEW: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  PENDING_ADMIN_APPROVAL: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  PARTIALLY_RECEIVED: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  PARTIALLY_PAID: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  PARTIALLY_ACCEPTED: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  QUALITY_CHECK: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  LOW: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  UNDER_REVIEW: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },

  // In Progress & Active Transactions
  DRAFT: { bg: '#F4F4F5', text: '#52525B', border: '#E4E4E7' },
  SUBMITTED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  ORDERED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  RECEIVED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  IN_PROGRESS: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  IN_TRANSIT: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  CONFIRMED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  READY_TO_DISPATCH: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  DISPATCHED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  MATERIAL_ISSUED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  MATERIAL_REQUESTED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  PLANNED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },

  // Errors, Rejections & Inactive
  REJECTED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  CANCELLED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  DAMAGED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  FAILED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  SHORT: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  CRITICAL: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  OUT_OF_STOCK: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  INACTIVE: { bg: '#F4F4F5', text: '#71717A', border: '#E4E4E7' },
  UNPAID: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  RETURNED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toUpperCase().trim();
  const config = statusColors[normalized] || { bg: '#F4F4F5', text: '#52525B', border: '#E4E4E7' };

  return (
    <Chip
      label={normalized.replace(/_/g, ' ')}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.text,
        fontWeight: 600,
        fontSize: '0.72rem',
        letterSpacing: '0.02em',
        borderRadius: '5px',
        border: `1px solid ${config.border}`,
        height: 22,
      }}
    />
  );
};
