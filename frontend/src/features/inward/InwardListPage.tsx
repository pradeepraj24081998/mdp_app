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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Paper,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { apiClient } from '../../api/client';
import { InwardReceipt, PurchaseOrder, Employee } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

interface FormErrors {
  selectedPO?: string;
  receivedDate?: string;
  invoiceNumber?: string;
  receivedBy?: string;
  general?: string;
}

export const InwardListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [selectedPO, setSelectedPO] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Validation states
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { data: inwards = [], isLoading } = useQuery<InwardReceipt[]>({
    queryKey: ['inwards'],
    queryFn: async () => {
      const res = await apiClient.get('/inwards/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: poList = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['po-receivable'],
    queryFn: async () => {
      const res = await apiClient.get('/purchases/?status=ORDERED,PARTIALLY_RECEIVED');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: createModalOpen,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: createModalOpen,
  });

  const handleOpenModal = () => {
    setSelectedPO('');
    setReceivedDate(new Date().toISOString().split('T')[0]);
    setInvoiceNumber('');
    setReceivedBy('');
    setNotes('');
    setFormErrors({});
    setTouched({});
    setCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setFormErrors({});
    setTouched({});
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!selectedPO.trim()) {
      errors.selectedPO = 'Please select an approved Purchase Order.';
    }

    if (!receivedDate.trim()) {
      errors.receivedDate = 'Delivery received date is required.';
    }

    if (!invoiceNumber.trim()) {
      errors.invoiceNumber = 'Vendor Delivery Bill / Invoice No is required.';
    }

    if (!receivedBy.trim()) {
      errors.receivedBy = 'Please select the workforce staff member who received the delivery.';
    }

    return errors;
  };

  const handlePOChange = (val: string) => {
    setSelectedPO(val);
    if (touched.selectedPO) {
      setFormErrors((prev) => ({
        ...prev,
        selectedPO: val.trim() ? undefined : 'Please select an approved Purchase Order.',
        general: undefined,
      }));
    }
  };

  const handleDateChange = (val: string) => {
    setReceivedDate(val);
    if (touched.receivedDate) {
      setFormErrors((prev) => ({
        ...prev,
        receivedDate: val.trim() ? undefined : 'Delivery received date is required.',
        general: undefined,
      }));
    }
  };

  const handleInvoiceChange = (val: string) => {
    setInvoiceNumber(val);
    if (touched.invoiceNumber) {
      setFormErrors((prev) => ({
        ...prev,
        invoiceNumber: val.trim() ? undefined : 'Vendor Delivery Bill / Invoice No is required.',
        general: undefined,
      }));
    }
  };

  const handleReceivedByChange = (val: string) => {
    setReceivedBy(val);
    if (touched.receivedBy) {
      setFormErrors((prev) => ({
        ...prev,
        receivedBy: val.trim() ? undefined : 'Please select the workforce staff member who received the delivery.',
        general: undefined,
      }));
    }
  };

  const createInwardMutation = useMutation({
    mutationFn: async () => {
      const poObj = poList.find((p) => p.id === selectedPO);
      const res = await apiClient.post('/inwards/', {
        purchase_order: selectedPO,
        vendor: poObj?.vendor,
        received_date: receivedDate,
        invoice_number: invoiceNumber.trim(),
        received_by: receivedBy,
        notes: notes.trim(),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inwards'] });
      handleCloseModal();
      const inwardId = data?.data?.id || data?.id;
      if (inwardId) {
        navigate(`/inward/${inwardId}/verify`);
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.data?.errors && typeof err?.response?.data?.errors === 'object'
          ? Object.entries(err.response.data.errors)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join(' | ')
          : null) ||
        err?.message ||
        'Failed to record Gate Inward delivery. Please check the entries.';
      setFormErrors((prev) => ({ ...prev, general: msg }));
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setTouched({
      selectedPO: true,
      receivedDate: true,
      invoiceNumber: true,
      receivedBy: true,
    });

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    createInwardMutation.mutate();
  };

  const selectedPOObj = poList.find((p) => p.id === selectedPO);

  return (
    <Box>
      <PageHeader
        title="Gate Inward & Receiving"
        subtitle="Record physical material delivery arrivals and perform quality inspection"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            Record Gate Inward
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          {isLoading ? (
            <LoadingState rows={6} />
          ) : inwards.length === 0 ? (
            <EmptyState
              title="No inward receipts recorded"
              description="Record physical arrivals of purchase orders at the factory gate."
              actionText="Record Gate Inward"
              onAction={handleOpenModal}
            />
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>INWARD NUMBER</TableCell>
                    <TableCell>PURCHASE ORDER</TableCell>
                    <TableCell>VENDOR</TableCell>
                    <TableCell>RECEIVED DATE</TableCell>
                    <TableCell>VENDOR INVOICE NO</TableCell>
                    <TableCell>RECEIVED BY (STORE)</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell align="center">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inwards.map((inw) => (
                    <TableRow key={inw.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>
                        {inw.inward_number}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {inw.purchase_number}
                      </TableCell>
                      <TableCell>{inw.vendor_name}</TableCell>
                      <TableCell>{inw.received_date}</TableCell>
                      <TableCell>{inw.invoice_number || 'N/A'}</TableCell>
                      <TableCell>{inw.received_by_name || 'Store Staff'}</TableCell>
                      <TableCell>
                        <StatusBadge status={inw.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant={inw.is_stock_updated ? 'outlined' : 'contained'}
                          color={inw.is_stock_updated ? 'inherit' : 'primary'}
                          startIcon={<FactCheckOutlinedIcon />}
                          onClick={() => navigate(`/inward/${inw.id}/verify`)}
                          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                        >
                          {inw.is_stock_updated ? 'View Details' : 'Verify Quality'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Record Gate Inward Dialog */}
      <Dialog
        open={createModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2.5 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Record Inward Gate Delivery</DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {formErrors.general && (
                <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                  {formErrors.general}
                </Alert>
              )}

              {poList.length === 0 && (
                <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                  No Purchase Orders currently in 'ORDERED' or 'PARTIALLY RECEIVED' status found. To receive goods at the gate, please ensure the Purchase Order is approved and marked as ORDERED.
                </Alert>
              )}

              <TextField
                select
                fullWidth
                size="small"
                label="Select Purchase Order"
                required
                value={selectedPO}
                onChange={(e) => handlePOChange(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, selectedPO: true }))}
                error={Boolean(touched.selectedPO && formErrors.selectedPO)}
                helperText={
                  (touched.selectedPO && formErrors.selectedPO) ||
                  'Select an ordered or partially received PO to log this delivery arrival.'
                }
              >
                {poList.length === 0 ? (
                  <MenuItem disabled value="">
                    <em>No receivable POs available</em>
                  </MenuItem>
                ) : (
                  poList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>
                          <strong>{p.purchase_number}</strong> — {p.vendor_name} (₹{Number(p.grand_total || 0).toLocaleString('en-IN')})
                        </span>
                        {p.status === 'PARTIALLY_RECEIVED' ? (
                          <Chip
                            size="small"
                            label="Balance Delivery"
                            color="warning"
                            sx={{ height: 20, fontSize: '0.68rem', ml: 1, fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Ordered"
                            color="primary"
                            sx={{ height: 20, fontSize: '0.68rem', ml: 1, fontWeight: 700 }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </TextField>

              {/* Selected PO Summary Card */}
              {selectedPOObj && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: '#F8FAFC',
                    borderColor: '#E2E8F0',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      Purchase Order Details
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedPOObj.status}
                      color="primary"
                      sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      PO: {selectedPOObj.purchase_number}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                      Vendor: {selectedPOObj.vendor_name || 'N/A'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Order Total: ₹{Number(selectedPOObj.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  {selectedPOObj.status === 'PARTIALLY_RECEIVED' && (
                    <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.78rem' }}>
                      <strong>Pending Balance Delivery:</strong> This PO was previously partially received (or had damaged items). This gate inward receipt will record the replacement / pending balance arrival.
                    </Alert>
                  )}
                </Paper>
              )}

              <TextField
                fullWidth
                size="small"
                type="date"
                label="Delivery Received Date"
                required
                InputLabelProps={{ shrink: true }}
                value={receivedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, receivedDate: true }))}
                error={Boolean(touched.receivedDate && formErrors.receivedDate)}
                helperText={touched.receivedDate && formErrors.receivedDate}
              />

              <TextField
                fullWidth
                size="small"
                label="Vendor Delivery Bill / Invoice No"
                required
                placeholder="e.g. INV-2026-987 / DC-4412"
                value={invoiceNumber}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, invoiceNumber: true }))}
                error={Boolean(touched.invoiceNumber && formErrors.invoiceNumber)}
                helperText={
                  (touched.invoiceNumber && formErrors.invoiceNumber) ||
                  'Enter the physical delivery challan or invoice bill number provided by the delivery vehicle'
                }
              />

              <TextField
                select
                fullWidth
                size="small"
                label="Received By (Workforce Staff)"
                required
                value={receivedBy}
                onChange={(e) => handleReceivedByChange(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, receivedBy: true }))}
                error={Boolean(touched.receivedBy && formErrors.receivedBy)}
                helperText={
                  (touched.receivedBy && formErrors.receivedBy) ||
                  'Select the store keeper or workforce staff receiving goods at the factory gate'
                }
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.employee_code} - {emp.name} ({emp.designation_name || 'Staff'})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Dock Arrival Remarks"
                placeholder="e.g. Unloaded at gate 2, intact seal, driver contact..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 500 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createInwardMutation.isPending || poList.length === 0}
              startIcon={
                createInwardMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <FactCheckOutlinedIcon />
                )
              }
              sx={{ px: 3, fontWeight: 600 }}
            >
              {createInwardMutation.isPending ? 'Validating & Recording...' : 'Generate Gate Inward'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
