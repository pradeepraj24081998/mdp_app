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
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface RoleDetailModalProps {
  open: boolean;
  onClose: () => void;
  role: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  open,
  onClose,
  role,
  onEdit,
  onDelete,
}) => {
  if (!role) return null;

  const isSystemRole = role.code === 'SUPER_ADMIN' || role.code === 'ADMIN';

  // Group permissions by module
  const permissionsByModule = (role.permissions || []).reduce((acc: Record<string, any[]>, perm: any) => {
    const mod = perm.module || 'GENERAL';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const moduleNames = Object.keys(permissionsByModule).sort();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}>
      {/* Header Banner */}
      <DialogTitle
        sx={{
          p: 0,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
          color: '#FFFFFF',
        }}
      >
        <Box sx={{ px: 3, py: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box sx={{ bgcolor: '#FFFFFF', p: 1, borderRadius: '8px', display: 'flex', color: '#1E3A8A' }}>
              <SecurityOutlinedIcon />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {role.name}
                </Typography>
                <Chip
                  label={role.code}
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
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mt: 0.2 }}>
                Role & Access Permission Profile
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        {/* Overview Box */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            p: 2,
            mb: 3,
            bgcolor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              ROLE CODE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
              {role.code}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              STATUS
            </Typography>
            <Chip
              label={role.status || 'ACTIVE'}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                bgcolor: role.status === 'INACTIVE' ? '#FEF2F2' : '#F0FDF4',
                color: role.status === 'INACTIVE' ? '#DC2626' : '#166534',
                fontWeight: 700,
              }}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              TOTAL PERMISSIONS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
              {role.permissions?.length || 0} Assigned
            </Typography>
          </Box>
        </Box>

        {/* Role Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
            ROLE RESPONSIBILITIES & DESCRIPTION
          </Typography>
          <Typography variant="body2" sx={{ color: '#1E293B', bgcolor: '#F1F5F9', p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            {role.description || 'Standard system role for operational workflows.'}
          </Typography>
        </Box>

        {/* Granular Permissions Section */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <VerifiedUserOutlinedIcon sx={{ color: '#2563EB', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Assigned Module Permissions ({role.permissions?.length || 0})
            </Typography>
          </Box>

          {moduleNames.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic', p: 2, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: '8px' }}>
              No granular permissions assigned to this role yet. Click Edit to assign permissions.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
              {moduleNames.map((module) => (
                <Box
                  key={module}
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.8 }}>
                    {module} ({permissionsByModule[module].length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                    {permissionsByModule[module].map((p: any) => (
                      <Chip
                        key={p.id || p.code}
                        label={p.name || p.code}
                        size="small"
                        sx={{
                          fontSize: '0.72rem',
                          height: 22,
                          bgcolor: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      {/* Modal Actions */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
        <Box>
          {isSystemRole ? (
            <Tooltip title="Core system roles cannot be deleted for security" arrow>
              <span>
                <Button size="small" variant="outlined" disabled startIcon={<LockOutlinedIcon />} sx={{ color: '#94A3B8' }}>
                  System Role (Protected)
                </Button>
              </span>
            </Tooltip>
          ) : (
            onDelete && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={onDelete}
                sx={{
                  color: '#DC2626',
                  borderColor: '#FECACA',
                  '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
                }}
              >
                Delete Role
              </Button>
            )
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEdit && (
            <Button
              size="small"
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={onEdit}
              sx={{ bgcolor: '#166534', '&:hover': { bgcolor: '#14532D' }, fontWeight: 700 }}
            >
              Edit Role
            </Button>
          )}
          <Button onClick={onClose} variant="contained" color="inherit" sx={{ bgcolor: '#E2E8F0', color: '#1E293B', '&:hover': { bgcolor: '#CBD5E1' } }}>
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
