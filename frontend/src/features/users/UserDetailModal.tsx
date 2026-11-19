import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { User } from '../../types';

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  isCurrentUser?: boolean;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  onClose,
  user,
  onEdit,
  onDelete,
  isCurrentUser = false,
}) => {
  if (!user) return null;

  const displayName = user.full_name?.trim() || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      {/* Header Banner */}
      <DialogTitle
        sx={{
          p: 0,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
        }}
      >
        <Box sx={{ px: 3, py: 2.4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                p: 1.2,
                borderRadius: '12px',
                display: 'flex',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <PersonOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {displayName}
                </Typography>
                <Chip
                  label={`@${user.username}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mt: 0.3 }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        {/* Status & Privileges Badges */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            p: 2,
            borderRadius: '10px',
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              ACCOUNT STATUS
            </Typography>
            <Chip
              label={user.is_active ? 'ACTIVE' : 'DEACTIVATED'}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: user.is_active ? '#ECFDF5' : '#FEF2F2',
                color: user.is_active ? '#059669' : '#DC2626',
                fontWeight: 700,
                fontSize: '0.72rem',
                border: user.is_active ? '1px solid #A7F3D0' : '1px solid #FECACA',
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              SYSTEM PRIVILEGES
            </Typography>
            {user.is_staff ? (
              <Chip
                icon={<AdminPanelSettingsOutlinedIcon sx={{ '&&': { color: '#B45309', fontSize: 16 } }} />}
                label="STAFF ADMIN"
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: '#FEF3C7',
                  color: '#B45309',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid #FDE68A',
                }}
              />
            ) : (
              <Chip
                label="STANDARD USER"
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: '#F1F5F9',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid #CBD5E1',
                }}
              />
            )}
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              ASSIGNED ROLES
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB', mt: 0.5 }}>
              {user.roles?.length || 0} Assigned
            </Typography>
          </Box>
        </Box>

        {/* Detailed User Information */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, letterSpacing: '0.02em' }}>
          USER ACCOUNT DETAILS
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <EmailOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Login Email
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', wordBreak: 'break-all' }}>
              {user.email}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <PersonOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Username
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
              {user.username}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <PersonOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Full Name
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Not Provided'}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Phone Number
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {user.phone || 'Not Provided'}
            </Typography>
          </Box>

          {user.created_at && (
            <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Account Created
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                {new Date(user.created_at).toLocaleDateString()} {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}

          {user.updated_at && (
            <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Last Modified
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                {new Date(user.updated_at).toLocaleDateString()} {new Date(user.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Assigned System Roles */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: '#2563EB' }} />
            ASSIGNED ROLES & PERMISSIONS
          </Typography>

          {(!user.roles || user.roles.length === 0) ? (
            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                No security roles currently assigned to this user.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {user.roles.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                      {r.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2563EB', fontFamily: 'monospace' }}>
                      Code: {r.code}
                    </Typography>
                  </Box>
                  <Chip
                    label="Assigned"
                    size="small"
                    sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Box>
          {isCurrentUser ? (
            <Tooltip title="You cannot delete your own logged-in user account." arrow>
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  disabled
                  startIcon={<LockOutlinedIcon />}
                  sx={{ opacity: 0.6 }}
                >
                  Delete Account
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => onDelete && onDelete(user)}
              sx={{
                borderColor: '#FECACA',
                color: '#DC2626',
                '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
              }}
            >
              Delete User
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => onEdit && onEdit(user)}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' }, fontWeight: 600 }}
          >
            Edit User Profile
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
