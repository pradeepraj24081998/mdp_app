import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Employee } from '../../types';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { EmployeeFormModal } from './EmployeeFormModal';

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // View, Edit, and Delete States
  const [employeeDetailState, setEmployeeDetailState] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({
    open: false,
    employee: null,
  });

  const [employeeFormState, setEmployeeFormState] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({
    open: false,
    employee: null,
  });

  const [employeeDeleteState, setEmployeeDeleteState] = useState<{
    open: boolean;
    employee: Employee | null;
    error?: string;
  }>({
    open: false,
    employee: null,
    error: undefined,
  });

  // Query Employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  // Delete Mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await apiClient.delete(`/employees/${employeeId}/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['masters-employees-list'] });
      setEmployeeDeleteState({ open: false, employee: null, error: undefined });
      if (employeeDetailState.open) {
        setEmployeeDetailState({ open: false, employee: null });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete employee record.';
      setEmployeeDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  const filteredEmployees = employees.filter((e) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (e.name && e.name.toLowerCase().includes(term)) ||
      (e.employee_code && e.employee_code.toLowerCase().includes(term)) ||
      (e.designation_name && e.designation_name.toLowerCase().includes(term)) ||
      (e.department_name && e.department_name.toLowerCase().includes(term)) ||
      (e.phone && e.phone.toLowerCase().includes(term)) ||
      (e.email && e.email.toLowerCase().includes(term))
    );
  });

  return (
    <Box>
      <PageHeader
        title="Workforce & Personnel"
        subtitle="Manage company employees, production floor workers, drivers, and material handlers"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEmployeeFormState({ open: true, employee: null })}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            Add Employee
          </Button>
        }
      />

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ mb: 2.5, maxWidth: 360 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search employee code, name, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {isLoading ? (
            <LoadingState rows={6} />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              title="No employee records found"
              description="Add biological workforce personnel to assign to production batches and material dispatches."
              actionText="Add Employee"
              onAction={() => setEmployeeFormState({ open: true, employee: null })}
            />
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>EMPLOYEE CODE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>NAME</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DEPARTMENT</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DESIGNATION</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>EMPLOYMENT TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PHONE NUMBER</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow
                      key={emp.id}
                      hover
                      onClick={() => setEmployeeDetailState({ open: true, employee: emp })}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#0284C7', fontFamily: 'monospace' }}>
                        {emp.employee_code}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{emp.name}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{emp.department_name || '-'}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{emp.designation_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={emp.employment_type?.replace(/_/g, ' ') || 'PERMANENT'}
                          size="small"
                          sx={{
                            fontSize: '0.72rem',
                            height: 22,
                            bgcolor: emp.employment_type === 'PERMANENT' ? '#ECFDF5' : '#EFF6FF',
                            color: emp.employment_type === 'PERMANENT' ? '#059669' : '#2563EB',
                            fontWeight: 600,
                            border: emp.employment_type === 'PERMANENT' ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{emp.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={emp.status || 'ACTIVE'}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            height: 18,
                            bgcolor: emp.status === 'INACTIVE' ? '#FEF2F2' : '#F0FDF4',
                            color: emp.status === 'INACTIVE' ? '#DC2626' : '#166534',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                          {/* View Employee */}
                          <Tooltip title="View Employee Profile" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setEmployeeDetailState({ open: true, employee: emp })}
                              sx={{
                                width: 30,
                                height: 30,
                                color: '#0284C7',
                                bgcolor: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                '&:hover': { bgcolor: '#E0F2FE' },
                              }}
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Edit Employee */}
                          <Tooltip title="Edit Employee Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setEmployeeFormState({ open: true, employee: emp })}
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

                          {/* Delete Employee */}
                          <Tooltip title="Delete Employee" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setEmployeeDeleteState({ open: true, employee: emp, error: undefined })}
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
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        open={employeeDetailState.open}
        employee={employeeDetailState.employee}
        onClose={() => setEmployeeDetailState({ open: false, employee: null })}
        onEdit={(emp) => {
          setEmployeeDetailState({ open: false, employee: null });
          setEmployeeFormState({ open: true, employee: emp });
        }}
        onDelete={(emp) => {
          setEmployeeDetailState({ open: false, employee: null });
          setEmployeeDeleteState({ open: true, employee: emp, error: undefined });
        }}
      />

      {/* Employee Form Modal (Add / Edit) */}
      <EmployeeFormModal
        open={employeeFormState.open}
        employee={employeeFormState.employee}
        onClose={() => setEmployeeFormState({ open: false, employee: null })}
      />

      {/* Employee Delete Confirmation Dialog */}
      <Dialog
        open={employeeDeleteState.open}
        onClose={() => {
          if (!deleteEmployeeMutation.isPending) {
            setEmployeeDeleteState({ open: false, employee: null, error: undefined });
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm Employee Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this employee from the workforce directory?
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                EMPLOYEE RECORD
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {employeeDeleteState.employee?.employee_code} - {employeeDeleteState.employee?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 0.3 }}>
                {employeeDeleteState.employee?.designation_name} • {employeeDeleteState.employee?.department_name}
              </Typography>
            </Box>
            {employeeDeleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {employeeDeleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Note: Employees linked to active production batches, inward quality verifications, or shipments cannot be deleted until reassignments are made.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setEmployeeDeleteState({ open: false, employee: null, error: undefined })}
            color="inherit"
            disabled={deleteEmployeeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (employeeDeleteState.employee?.id) {
                deleteEmployeeMutation.mutate(employeeDeleteState.employee.id);
              }
            }}
            disabled={deleteEmployeeMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Yes, Delete Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
