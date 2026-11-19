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
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { Employee } from '../../types';

interface EmployeeDetailModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  open,
  onClose,
  employee,
  onEdit,
  onDelete,
}) => {
  if (!employee) return null;

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
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
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
              <BadgeOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {employee.name}
                </Typography>
                <Chip
                  label={employee.employee_code}
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
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', display: 'block', mt: 0.3 }}>
                {employee.designation_name || 'Personnel'} • {employee.department_name || 'Workforce'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        {/* Status & Category Overview Tiles */}
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
              EMPLOYMENT TYPE
            </Typography>
            <Chip
              label={employee.employment_type?.replace(/_/g, ' ') || 'PERMANENT'}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: employee.employment_type === 'PERMANENT' ? '#ECFDF5' : '#EFF6FF',
                color: employee.employment_type === 'PERMANENT' ? '#059669' : '#2563EB',
                fontWeight: 700,
                fontSize: '0.72rem',
                border: employee.employment_type === 'PERMANENT' ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              FACILITY / UNIT
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>
              {employee.production_unit_name || 'Main Facility / HQ'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              RECORD STATUS
            </Typography>
            <Chip
              label={employee.status || 'ACTIVE'}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: employee.status === 'INACTIVE' ? '#FEF2F2' : '#F0FDF4',
                color: employee.status === 'INACTIVE' ? '#DC2626' : '#166534',
                fontWeight: 700,
                fontSize: '0.72rem',
                border: employee.status === 'INACTIVE' ? '1px solid #FECACA' : '1px solid #BBF7D0',
              }}
            />
          </Box>
        </Box>

        {/* Detailed Information Grid */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, letterSpacing: '0.02em' }}>
          PERSONNEL PROFILE DETAILS
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <BadgeOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Employee Code
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284C7', fontFamily: 'monospace' }}>
              {employee.employee_code}
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
              {employee.phone}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <BusinessOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Department
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {employee.department_name || '-'}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <BadgeOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Designation
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {employee.designation_name || '-'}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <EmailOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Email Address
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {employee.email || 'Not Provided'}
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Joining Date
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'Not Set'}
            </Typography>
          </Box>

          {employee.date_of_birth && (
            <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
                <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Date of Birth
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                {new Date(employee.date_of_birth).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <FactoryOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Assigned Unit
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {employee.production_unit_name || 'General / Unassigned'}
            </Typography>
          </Box>
        </Box>

        {/* Address */}
        {employee.address && (
          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.4 }}>
              <HomeOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Residential Address
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#0F172A', whiteSpace: 'pre-wrap' }}>
              {employee.address}
            </Typography>
          </Box>
        )}

        {/* Linked User Account */}
        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#1E3A8A', mb: 0.4 }}>
            <AccountCircleOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Linked System Login Account
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
            {employee.user_email ? (
              <>User Email: {employee.user_email}</>
            ) : (
              <span style={{ color: '#64748B', fontWeight: 400 }}>No system login account linked to this employee</span>
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlineRoundedIcon />}
          onClick={() => onDelete && onDelete(employee)}
          sx={{
            borderColor: '#FECACA',
            color: '#DC2626',
            '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
          }}
        >
          Delete Employee
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => onEdit && onEdit(employee)}
            sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, fontWeight: 600 }}
          >
            Edit Employee Record
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
