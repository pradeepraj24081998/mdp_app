import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { RoleDetailModal } from './RoleDetailModal';
import { RoleFormModal } from './RoleFormModal';
import { UserDetailModal } from './UserDetailModal';
import { UserFormModal } from './UserFormModal';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // User search & modals state
  const [userSearch, setUserSearch] = useState('');
  const [userDetailState, setUserDetailState] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [userFormState, setUserFormState] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [userDeleteState, setUserDeleteState] = useState<{ open: boolean; user: User | null; error?: string }>({
    open: false,
    user: null,
    error: undefined,
  });

  // Role Master Search & Modals state
  const [roleSearch, setRoleSearch] = useState('');
  const [roleDetailState, setRoleDetailState] = useState<{ open: boolean; role: any }>({
    open: false,
    role: null,
  });
  const [roleFormState, setRoleFormState] = useState<{ open: boolean; role: any }>({
    open: false,
    role: null,
  });
  const [roleDeleteState, setRoleDeleteState] = useState<{ open: boolean; role: any; error?: string }>({
    open: false,
    role: null,
    error: undefined,
  });

  // Queries
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/users/${userId}/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDeleteState({ open: false, user: null, error: undefined });
      if (userDetailState.open) {
        setUserDetailState({ open: false, user: null });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete user account.';
      setUserDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const res = await apiClient.delete(`/roles/${roleId}/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleDeleteState({ open: false, role: null, error: undefined });
      if (roleDetailState.open) {
        setRoleDetailState({ open: false, role: null });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete role.';
      setRoleDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  // Filtered Users
  const qUser = userSearch.toLowerCase().trim();
  const filteredUsers = users.filter((u) => {
    if (!qUser) return true;
    return (
      u.email.toLowerCase().includes(qUser) ||
      u.username.toLowerCase().includes(qUser) ||
      (u.full_name && u.full_name.toLowerCase().includes(qUser)) ||
      (u.first_name && u.first_name.toLowerCase().includes(qUser)) ||
      (u.last_name && u.last_name.toLowerCase().includes(qUser)) ||
      u.roles?.some((r) => r.name.toLowerCase().includes(qUser) || r.code.toLowerCase().includes(qUser))
    );
  });

  // Filtered Roles
  const qRole = roleSearch.toLowerCase().trim();
  const filteredRoles = roles.filter(
    (r: any) =>
      !qRole ||
      r.name.toLowerCase().includes(qRole) ||
      r.code.toLowerCase().includes(qRole) ||
      (r.description && r.description.toLowerCase().includes(qRole))
  );

  return (
    <Box>
      <PageHeader
        title="User Access & Security"
        subtitle="Manage authentication logins, system administrators, and role-based permissions"
        action={
          activeTab === 0 ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUserFormState({ open: true, user: null })}
              sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
            >
              Create User Account
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setRoleFormState({ open: true, role: null })}
              sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
            >
              Add Role Master
            </Button>
          )
        }
      />

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label={`User Accounts (${users.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`Role Master (${roles.length})`} sx={{ fontWeight: 700 }} />
            </Tabs>

            {activeTab === 0 ? (
              <TextField
                size="small"
                placeholder="Search user by name, email, role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: userSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setUserSearch('')}>
                        <ClearOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <TextField
                size="small"
                placeholder="Search roles by code or title..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                sx={{ width: 280 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: roleSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setRoleSearch('')}>
                        <ClearOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </Box>

          {/* TAB 0: USERS (WITH FULL VIEW, EDIT, DELETE) */}
          {activeTab === 0 ? (
            loadingUsers ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>USER / EMAIL</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>FULL NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>USERNAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ASSIGNED ROLES</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRIVILEGES</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No user accounts found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = currentUser?.id === u.id;

                        return (
                          <TableRow
                            key={u.id}
                            hover
                            onClick={() => setUserDetailState({ open: true, user: u })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{u.email}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{u.full_name || '-'}</TableCell>
                            <TableCell sx={{ color: '#64748B', fontFamily: 'monospace' }}>@{u.username}</TableCell>
                            <TableCell>
                              {u.roles && u.roles.length > 0 ? (
                                u.roles.map((r) => (
                                  <Chip
                                    key={r.id}
                                    label={r.name}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '0.72rem' }}
                                  />
                                ))
                              ) : (
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>No roles assigned</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                size="small"
                                sx={{
                                  bgcolor: u.is_active ? '#ECFDF5' : '#FEF2F2',
                                  color: u.is_active ? '#059669' : '#DC2626',
                                  fontWeight: 600,
                                  fontSize: '0.72rem',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {u.is_staff ? (
                                <Chip label="STAFF ADMIN" size="small" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 600, fontSize: '0.72rem' }} />
                              ) : (
                                <Chip label="STANDARD" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }} />
                              )}
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                {/* View User */}
                                <Tooltip title="View User Account Profile" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setUserDetailState({ open: true, user: u })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#2563EB',
                                      bgcolor: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      '&:hover': { bgcolor: '#DBEAFE' },
                                    }}
                                  >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                {/* Edit User */}
                                <Tooltip title="Edit User Details & Roles" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setUserFormState({ open: true, user: u })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#166534',
                                      bgcolor: '#F0FDF4',
                                      border: '1px solid #BBF7D0',
                                      '&:hover': { bgcolor: '#DCFCE7' },
                                    }}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                {/* Delete User */}
                                {isSelf ? (
                                  <Tooltip title="Your Logged-in Account (Protected)" arrow>
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled
                                        sx={{
                                          width: 30,
                                          height: 30,
                                          opacity: 0.4,
                                        }}
                                      >
                                        <LockOutlinedIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Delete User Account" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => setUserDeleteState({ open: true, user: u, error: undefined })}
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        color: '#DC2626',
                                        bgcolor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        '&:hover': { bgcolor: '#FEE2E2' },
                                      }}
                                    >
                                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            /* TAB 1: ROLE MASTER (FULL CRUD) */
            loadingRoles ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 140 }}>ROLE CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 220 }}>ROLE TITLE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>RESPONSIBILITIES & DESCRIPTION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 150 }}>PERMISSIONS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 100 }}>STATUS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No roles found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoles.map((r: any) => {
                        const isSystem = r.code === 'SUPER_ADMIN' || r.code === 'ADMIN';

                        return (
                          <TableRow
                            key={r.id}
                            hover
                            onClick={() => setRoleDetailState({ open: true, role: r })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                              {r.code}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                              {r.name}
                            </TableCell>
                            <TableCell sx={{ color: '#64748B', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.description || 'System standard role'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${r.permissions?.length || 0} Permissions`}
                                size="small"
                                sx={{
                                  fontSize: '0.72rem',
                                  height: 22,
                                  bgcolor: '#EFF6FF',
                                  color: '#2563EB',
                                  fontWeight: 600,
                                  border: '1px solid #BFDBFE',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={r.status || 'ACTIVE'}
                                size="small"
                                sx={{
                                  fontSize: '0.68rem',
                                  height: 18,
                                  bgcolor: r.status === 'INACTIVE' ? '#FEF2F2' : '#F0FDF4',
                                  color: r.status === 'INACTIVE' ? '#DC2626' : '#166534',
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                {/* View Role */}
                                <Tooltip title="View Role Details & Permissions" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setRoleDetailState({ open: true, role: r })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#2563EB',
                                      bgcolor: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      '&:hover': { bgcolor: '#DBEAFE' },
                                    }}
                                  >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                {/* Edit Role */}
                                <Tooltip title="Edit Role Profile" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setRoleFormState({ open: true, role: r })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#166534',
                                      bgcolor: '#F0FDF4',
                                      border: '1px solid #BBF7D0',
                                      '&:hover': { bgcolor: '#DCFCE7' },
                                    }}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                {/* Delete Role */}
                                {isSystem ? (
                                  <Tooltip title="Core System Role (Protected)" arrow>
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled
                                        sx={{
                                          width: 30,
                                          height: 30,
                                          opacity: 0.4,
                                        }}
                                      >
                                        <LockOutlinedIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Delete Role Master" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => setRoleDeleteState({ open: true, role: r, error: undefined })}
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        color: '#DC2626',
                                        bgcolor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        '&:hover': { bgcolor: '#FEE2E2' },
                                      }}
                                    >
                                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>

      {/* User Detail View Modal */}
      <UserDetailModal
        open={userDetailState.open}
        user={userDetailState.user}
        onClose={() => setUserDetailState({ open: false, user: null })}
        onEdit={(u) => {
          setUserDetailState({ open: false, user: null });
          setUserFormState({ open: true, user: u });
        }}
        onDelete={(u) => {
          setUserDetailState({ open: false, user: null });
          setUserDeleteState({ open: true, user: u, error: undefined });
        }}
        isCurrentUser={currentUser?.id === userDetailState.user?.id}
      />

      {/* User Form Modal (Create / Edit) */}
      <UserFormModal
        open={userFormState.open}
        user={userFormState.user}
        onClose={() => setUserFormState({ open: false, user: null })}
      />

      {/* User Delete Confirmation Dialog */}
      <Dialog
        open={userDeleteState.open}
        onClose={() => {
          if (!deleteUserMutation.isPending) {
            setUserDeleteState({ open: false, user: null, error: undefined });
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm User Account Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this user account from the system?
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                USER ACCOUNT
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {userDeleteState.user?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 0.3 }}>
                Username: @{userDeleteState.user?.username} {userDeleteState.user?.full_name ? `• ${userDeleteState.user.full_name}` : ''}
              </Typography>
            </Box>
            {userDeleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {userDeleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Warning: Deleting this user account will revoke access tokens, delete active sessions, and remove role assignments.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setUserDeleteState({ open: false, user: null, error: undefined })}
            color="inherit"
            disabled={deleteUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (userDeleteState.user?.id) {
                deleteUserMutation.mutate(userDeleteState.user.id);
              }
            }}
            disabled={deleteUserMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteUserMutation.isPending ? 'Deleting...' : 'Yes, Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Detail View Modal */}
      <RoleDetailModal
        open={roleDetailState.open}
        role={roleDetailState.role}
        onClose={() => setRoleDetailState({ open: false, role: null })}
        onEdit={() => {
          const role = roleDetailState.role;
          setRoleDetailState({ open: false, role: null });
          setRoleFormState({ open: true, role });
        }}
        onDelete={() => {
          const role = roleDetailState.role;
          setRoleDetailState({ open: false, role: null });
          setRoleDeleteState({ open: true, role, error: undefined });
        }}
      />

      {/* Role Form Modal (Add / Edit) */}
      <RoleFormModal
        open={roleFormState.open}
        role={roleFormState.role}
        onClose={() => setRoleFormState({ open: false, role: null })}
      />

      {/* Role Delete Confirmation Dialog */}
      <Dialog
        open={roleDeleteState.open}
        onClose={() => {
          if (!deleteRoleMutation.isPending) {
            setRoleDeleteState({ open: false, role: null, error: undefined });
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm Role Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this role from Role Master?
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                ROLE MASTER
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {roleDeleteState.role?.code} - {roleDeleteState.role?.name}
              </Typography>
            </Box>
            {roleDeleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {roleDeleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Note: Roles currently assigned to active employees or login users cannot be deleted. Reassign users first.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setRoleDeleteState({ open: false, role: null, error: undefined })}
            color="inherit"
            disabled={deleteRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (roleDeleteState.role?.id) {
                deleteRoleMutation.mutate(roleDeleteState.role.id);
              }
            }}
            disabled={deleteRoleMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteRoleMutation.isPending ? 'Deleting...' : 'Yes, Delete Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
