import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Chip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Employee, ProductionUnit, User } from '../../types';

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null; // If null/undefined, mode is "Create", otherwise "Edit"
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ open, onClose, employee }) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(employee);

  const [empCode, setEmpCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [empType, setEmpType] = useState('PERMANENT');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [productionUnit, setProductionUnit] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [errorMessage, setErrorMessage] = useState('');

  // Next Code Query for Create Mode
  const { data: nextEmpCode = '' } = useQuery({
    queryKey: ['next-code-employee'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/next-code/');
      return res.data.data?.code || '';
    },
    enabled: open && !isEdit,
  });

  // Queries for Dropdowns
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await apiClient.get('/departments/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  const { data: designations = [] } = useQuery<any[]>({
    queryKey: ['designations-list', department],
    queryFn: async () => {
      let url = '/designations/';
      if (department) url += `?department=${department}`;
      const res = await apiClient.get(url);
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  const { data: productionUnits = [] } = useQuery<ProductionUnit[]>({
    queryKey: ['production-units-list'],
    queryFn: async () => {
      const res = await apiClient.get('/production-units/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users-list-for-employee'],
    queryFn: async () => {
      const res = await apiClient.get('/users/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  // Reset or Populate form fields
  useEffect(() => {
    if (open) {
      setErrorMessage('');
      if (employee) {
        setEmpCode(employee.employee_code || '');
        setName(employee.name || '');
        setPhone(employee.phone || '');
        setEmail(employee.email || '');
        setDepartment(employee.department || '');
        setDesignation(employee.designation || '');
        setEmpType(employee.employment_type || 'PERMANENT');
        setJoiningDate(employee.joining_date ? employee.joining_date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setDob(employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '');
        setAddress(employee.address || '');
        setProductionUnit(employee.production_unit || '');
        setUserId(employee.user || '');
        setStatus(employee.status || 'ACTIVE');
      } else {
        setEmpCode(nextEmpCode || '');
        setName('');
        setPhone('');
        setEmail('');
        setDepartment('');
        setDesignation('');
        setEmpType('PERMANENT');
        setJoiningDate(new Date().toISOString().split('T')[0]);
        setDob('');
        setAddress('');
        setProductionUnit('');
        setUserId('');
        setStatus('ACTIVE');
      }
    }
  }, [open, employee, nextEmpCode]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        employee_code: empCode.trim(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        department,
        designation,
        employment_type: empType,
        joining_date: joiningDate,
        date_of_birth: dob || null,
        address: address.trim(),
        production_unit: productionUnit || null,
        user: userId || null,
        status,
      };

      if (!isEdit) {
        const res = await apiClient.post('/employees/', payload);
        return res.data;
      } else {
        const res = await apiClient.patch(`/employees/${employee?.id}/`, payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['masters-employees-list'] });
      onClose();
    },
    onError: (err: any) => {
      const respData = err.response?.data;
      let msg = respData?.message || err.message || 'Failed to save employee record.';
      if (respData?.errors) {
        const errorDetails = Object.entries(respData.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (errorDetails) msg += ` (${errorDetails})`;
      }
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!empCode || !name || !phone || !department || !designation || !joiningDate) {
      setErrorMessage('Please fill in all required fields (Code, Name, Phone, Department, Designation, Joining Date).');
      return;
    }
    setErrorMessage('');
    saveMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saveMutation.isPending) onClose();
      }}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: { borderRadius: '16px', overflow: 'hidden' },
        },
      }}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        sx: { borderRadius: '16px', overflow: 'hidden' },
      }}
    >
      {/* Header Banner */}
      <DialogTitle
        sx={{
          p: 0,
          background: isEdit
            ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
            : 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
          color: '#FFFFFF',
        }}
      >
        <Box sx={{ px: 3, py: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                p: 1,
                borderRadius: '10px',
                display: 'flex',
                color: '#FFFFFF',
              }}
            >
              <BadgeOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {isEdit ? 'Edit Employee Record' : 'Add Workforce Member'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                {isEdit
                  ? `Updating profile and assignments for ${employee?.name}`
                  : 'Register a new workforce personnel for production and operations'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={saveMutation.isPending}
            sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, mt: 0.5 }}>
          {/* Employee Code & Name */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              size="small"
              label="Employee Code"
              required
              value={empCode}
              disabled
              helperText={isEdit ? "Auto-generated System ID (Cannot be edited)" : "Auto-generated sequence code (Read-only)"}
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip
                        label="READ-ONLY"
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              size="small"
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
          </Box>

          {/* Phone & Email */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              size="small"
              label="Phone Number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
            />

            <TextField
              size="small"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh@company.com"
            />
          </Box>

          {/* Department & Designation */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              select
              size="small"
              label="Department"
              required
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setDesignation(''); // Reset designation when department changes
              }}
            >
              {departments.map((d: any) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Designation"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              disabled={!department && designations.length === 0}
            >
              {designations.map((des: any) => (
                <MenuItem key={des.id} value={des.id}>
                  {des.name} ({des.code})
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Employment Type & Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              select
              size="small"
              label="Employment Type"
              value={empType}
              onChange={(e) => setEmpType(e.target.value)}
            >
              <MenuItem value="PERMANENT">Permanent</MenuItem>
              <MenuItem value="CONTRACT">Contract</MenuItem>
              <MenuItem value="DAILY_WAGE">Daily Wage</MenuItem>
              <MenuItem value="INTERN">Intern</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Record Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </TextField>
          </Box>

          {/* Joining Date & Date of Birth */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              size="small"
              type="date"
              label="Joining Date"
              required
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              type="date"
              label="Date of Birth (Optional)"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Production Unit & Linked User */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              select
              size="small"
              label="Assigned Production Facility"
              value={productionUnit}
              onChange={(e) => setProductionUnit(e.target.value)}
            >
              <MenuItem value="">-- Unassigned / HQ --</MenuItem>
              {productionUnits.map((pu) => (
                <MenuItem key={pu.id} value={pu.id}>
                  {pu.name} ({pu.production_unit_code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Link System Login User (Optional)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <MenuItem value="">-- No Linked Login --</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email} ({u.username})
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Residential Address */}
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address, City, State, PIN..."
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} color="inherit" disabled={saveMutation.isPending} sx={{ fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          disabled={saveMutation.isPending}
          sx={{
            bgcolor: isEdit ? '#0284C7' : '#14532D',
            '&:hover': { bgcolor: isEdit ? '#0369A1' : '#0B3B1F' },
            fontWeight: 600,
          }}
        >
          {saveMutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
