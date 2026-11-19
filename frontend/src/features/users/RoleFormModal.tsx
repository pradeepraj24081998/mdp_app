import React, { useState, useEffect, useMemo } from 'react';
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
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  role?: any; // If null/undefined, mode is "Create", otherwise "Edit"
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ open, onClose, role }) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(role);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch next unique code if creating
  const { data: nextCode = '' } = useQuery({
    queryKey: ['next-code-role'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/next-code/');
      return res.data.data?.code || '';
    },
    enabled: open && !isEdit,
  });

  // Fetch all system permissions
  const { data: allPermissions = [] } = useQuery({
    queryKey: ['system-permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/permissions/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: open,
  });

  // Initialize or reset form fields
  useEffect(() => {
    if (open) {
      setErrorMessage('');
      setPermSearch('');
      if (role) {
        setCode(role.code || '');
        setName(role.name || '');
        setDescription(role.description || '');
        setStatus(role.status || 'ACTIVE');
        const permIds = (role.permissions || []).map((p: any) => p.id);
        setSelectedPermIds(permIds);
      } else {
        setCode(nextCode || '');
        setName('');
        setDescription('');
        setStatus('ACTIVE');
        setSelectedPermIds([]);
      }
    }
  }, [open, role, nextCode]);

  // Group permissions by module and filter
  const filteredPermissions = useMemo(() => {
    const q = permSearch.toLowerCase().trim();
    return allPermissions.filter(
      (p: any) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q)
    );
  }, [allPermissions, permSearch]);

  const permissionsByModule = useMemo(() => {
    return filteredPermissions.reduce((acc: Record<string, any[]>, perm: any) => {
      const mod = perm.module || 'GENERAL';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [filteredPermissions]);

  const modules = Object.keys(permissionsByModule).sort();

  // Toggle single permission
  const handleTogglePerm = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // Toggle all permissions in a module
  const handleToggleModule = (moduleName: string) => {
    const modulePerms = permissionsByModule[moduleName] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPermIds.includes(id));

    if (allSelected) {
      // Unselect all in module
      setSelectedPermIds((prev) => prev.filter((id) => !modulePermIds.includes(id)));
    } else {
      // Select all in module
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...modulePermIds])));
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      const finalCode = (code || nextCode).trim().toUpperCase();
      const payload = {
        code: finalCode,
        name: name.trim(),
        description: description.trim(),
        status,
        permission_ids: selectedPermIds,
      };

      if (isEdit) {
        return apiClient.put(`/roles/${role.id}/`, payload);
      } else {
        return apiClient.post('/roles/', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-role'] });
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.code && `Role code: ${err.response.data.code.join(' ')}`) ||
        (err.response?.data?.name && `Role name: ${err.response.data.name.join(' ')}`) ||
        err.message ||
        'Failed to save role.';
      setErrorMessage(msg);
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}>
      {/* Modal Title */}
      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {isEdit ? 'Edit Role Profile' : 'Add New Role Master'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, mt: 0.5 }}>
          {errorMessage && (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {errorMessage}
            </Alert>
          )}

          {/* Code and Status Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Role Code"
              required
              value={code || (!isEdit ? nextCode : '')}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isEdit}
              helperText={isEdit ? "System Role Code (Cannot be edited)" : "Auto-generated sequence code"}
              slotProps={{
                input: {
                  readOnly: isEdit,
                  startAdornment: isEdit ? (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ) : undefined,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip
                        icon={!isEdit ? <AutoAwesomeIcon sx={{ fontSize: '12px !important' }} /> : undefined}
                        label={isEdit ? "READ-ONLY" : "AUTO ID"}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20, bgcolor: isEdit ? '#F1F5F9' : '#EFF6FF', color: isEdit ? '#475569' : '#2563EB', fontWeight: 700 }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </TextField>
          </Box>

          {/* Role Name */}
          <TextField
            fullWidth
            size="small"
            label="Role Title / Name"
            required
            placeholder="e.g. Store & Inventory Executive"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Description */}
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Role Responsibilities & Description"
            placeholder="e.g. Oversees factory raw material inward, verification, and bin allocations."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Divider sx={{ my: 0.5 }} />

          {/* Granular Permissions Picker */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Granular Permission Matrix
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  {selectedPermIds.length} of {allPermissions.length} permissions granted
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Search permissions..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                sx={{ width: 190 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
              {modules.map((moduleName) => {
                const modulePerms = permissionsByModule[moduleName] || [];
                const modulePermIds = modulePerms.map((p) => p.id);
                const allSelected = modulePermIds.length > 0 && modulePermIds.every((id) => selectedPermIds.includes(id));
                const someSelected = modulePermIds.some((id) => selectedPermIds.includes(id));

                return (
                  <Box
                    key={moduleName}
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {moduleName} ({modulePerms.length})
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleToggleModule(moduleName)}
                        sx={{ fontSize: '0.7rem', py: 0.2, px: 1, minWidth: 'auto', textTransform: 'none', color: '#2563EB' }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.8 }}>
                      {modulePerms.map((p) => {
                        const isChecked = selectedPermIds.includes(p.id);
                        return (
                          <Box
                            key={p.id}
                            onClick={() => handleTogglePerm(p.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 0.8,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              bgcolor: isChecked ? '#EFF6FF' : '#FFFFFF',
                              border: isChecked ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                              '&:hover': { bgcolor: isChecked ? '#DBEAFE' : '#F1F5F9' },
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              sx={{ p: 0.3, mr: 0.8, color: '#94A3B8', '&.Mui-checked': { color: '#2563EB' } }}
                            />
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" sx={{ fontWeight: isChecked ? 700 : 500, fontSize: '0.78rem', color: isChecked ? '#1E3A8A' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', fontFamily: 'monospace', display: 'block' }}>
                                {p.code}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} color="inherit" disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={() => saveMutation.mutate()}
          disabled={!name.trim() || saveMutation.isPending}
          sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' }, fontWeight: 700 }}
        >
          {saveMutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role Master'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
