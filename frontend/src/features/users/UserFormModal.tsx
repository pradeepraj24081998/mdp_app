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
  Chip,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  SelectChangeEvent,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { User } from '../../types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null; // If null/undefined, mode is "Create", otherwise "Edit"
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, user }) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(user);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  // Fetch users for duplicate detection
  const { data: existingUsers = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  // Populate or reset form fields
  useEffect(() => {
    if (open) {
      setErrorMessage('');
      setShowPassword(false);
      if (user) {
        setEmail(user.email || '');
        setUsername(user.username || '');
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setPhone(user.phone || '');
        setPassword(''); // Blank by default on edit to keep unchanged
        setSelectedRoleIds((user.roles || []).map((r) => r.id));
        setIsActive(user.is_active ?? true);
        setIsStaff(user.is_staff ?? false);
      } else {
        setEmail('');
        setUsername('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setPassword('12345');
        setSelectedRoleIds([]);
        setIsActive(true);
        setIsStaff(false);
      }
    }
  }, [open, user]);

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedRoleIds(typeof value === 'string' ? value.split(',') : value);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const effectivePassword = password && password.trim() ? password.trim() : (!isEdit ? '12345' : '');

      const payload: Record<string, any> = {
        email: email.trim(),
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        role_ids: selectedRoleIds,
        is_active: isActive,
        is_staff: isStaff,
      };

      if (!isEdit) {
        payload.password = effectivePassword;
        const res = await apiClient.post('/users/', payload);
        return res.data;
      } else {
        if (effectivePassword) {
          payload.password = effectivePassword;
        }
        const res = await apiClient.patch(`/users/${user?.id}/`, payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
    onError: (err: any) => {
      const respData = err.response?.data;
      let msg = respData?.message || err.message || 'Failed to save user account.';
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
    if (!email || !email.trim()) {
      setErrorMessage('Email Address is required.');
      return;
    }
    if (!username || !username.trim()) {
      setErrorMessage('Username is required.');
      return;
    }

    // Check duplicate email when creating
    if (!isEdit) {
      const emailDup = existingUsers.find(
        (u) => u.email?.toLowerCase().trim() === email.trim().toLowerCase()
      );
      if (emailDup) {
        setErrorMessage(
          `A user account with email '${email.trim()}' already exists (Username: @${emailDup.username}). Please choose another email or edit the existing account.`
        );
        return;
      }

      const usernameDup = existingUsers.find(
        (u) => u.username?.toLowerCase().trim() === username.trim().toLowerCase()
      );
      if (usernameDup) {
        setErrorMessage(
          `Username '@${username.trim()}' is already taken. Please choose a different username.`
        );
        return;
      }
    }

    // If password provided or on create, enforce min length
    const effectivePassword = password && password.trim() ? password.trim() : (!isEdit ? '12345' : '');
    if (!isEdit && effectivePassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (isEdit && password && password.trim().length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
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
      maxWidth="md"
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
            ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'
            : 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
          color: '#FFFFFF',
        }}
      >
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <PersonOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {isEdit ? 'Edit User Account' : 'Create Application User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mt: 0.2 }}>
                {isEdit
                  ? `Editing credentials & access for ${user?.email}`
                  : 'Add a new digital identity for portal access and operations'}
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
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2.5, borderRadius: '8px' }}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
          {/* Row 1: Email & Username */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              type="email"
              label="Email Address (Login)"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@company.com"
            />

            <TextField
              size="small"
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isEdit}
              helperText={isEdit ? 'Unique login identifier (Cannot be edited)' : undefined}
              placeholder="e.g. jdoe"
              slotProps={{
                input: {
                  readOnly: isEdit,
                  startAdornment: isEdit ? (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
          </Box>

          {/* Row 2: First & Last Name */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
            />
            <TextField
              size="small"
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Doe"
            />
          </Box>

          {/* Row 3: Phone Number & Password (SIDE BY SIDE - ALWAYS VISIBLE!) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
            />

            <TextField
              size="small"
              type={showPassword ? 'text' : 'password'}
              label={isEdit ? 'Change Password (Optional)' : 'Password (Login Credential)'}
              required={!isEdit}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Leave blank to keep existing' : 'e.g. 12345'}
              helperText={
                isEdit
                  ? 'Leave blank to keep existing password. Min 8 characters.'
                  : password
                    ? 'Minimum 8 characters.'
                    : 'Will default to 12345 if left blank.'
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {!isEdit && !password && (
                        <Tooltip title="Use Default (12345)" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setPassword('12345')}
                            sx={{ color: '#166534', mr: 0.5 }}
                          >
                            <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        sx={{ color: '#64748B' }}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* Row 4: Security Roles Multi-Select */}
          <FormControl fullWidth size="small">
            <InputLabel id="roles-select-label">Assign System Roles</InputLabel>
            <Select
              labelId="roles-select-label"
              multiple
              value={selectedRoleIds}
              onChange={handleRoleChange}
              input={<OutlinedInput label="Assign System Roles" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((val) => {
                    const r = roles.find((role: any) => role.id === val);
                    return (
                      <Chip
                        key={val}
                        label={r ? r.name : val}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {roles.map((r: any) => (
                <MenuItem key={r.id} value={r.id}>
                  <Checkbox checked={selectedRoleIds.indexOf(r.id) > -1} size="small" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {r.code} {r.description ? `• ${r.description}` : ''}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Row 5: Account Status and Staff Admin Toggles (2 columns, compact) */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '10px',
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="success"
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
                    Active Account Status
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>
                    Can login & access authorized features.
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={isStaff}
                  onChange={(e) => setIsStaff(e.target.checked)}
                  size="small"
                  sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#D97706' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
                    Staff Administrator
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>
                    Allows access to Django backend admin.
                  </Typography>
                </Box>
              }
            />
          </Box>
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
            bgcolor: isEdit ? '#1E3A8A' : '#14532D',
            '&:hover': { bgcolor: isEdit ? '#172554' : '#0B3B1F' },
            fontWeight: 700,
            px: 3,
          }}
        >
          {saveMutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
