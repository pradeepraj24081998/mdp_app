import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import RemoveDoneIcon from '@mui/icons-material/RemoveDone';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { Material, Employee, ProductionUnit } from '../../types';

export const ProductionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Modals
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);

  // Dispatch Form
  const [dispMaterial, setDispMaterial] = useState('');
  const [dispQty, setDispQty] = useState(500);
  const [dispHandler, setDispHandler] = useState('');
  const [dispNotes, setDispNotes] = useState('');

  // Complete Form
  const [actualQty, setActualQty] = useState(5000);
  const [qualityStatus, setQualityStatus] = useState('PASSED');

  // Consume Form
  const [consumeMat, setConsumeMat] = useState('');
  const [consumeUsed, setConsumeUsed] = useState(480);
  const [consumeWastage, setConsumeWastage] = useState(20);

  const { data: order, isLoading } = useQuery({
    queryKey: ['production-order', id],
    queryFn: async () => {
      const res = await apiClient.get(`/production/orders/${id}/`);
      return res.data?.data ?? res.data;
    },
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['materials-list'],
    queryFn: async () => {
      const res = await apiClient.get('/materials/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: dispatchOpen || consumeOpen,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: dispatchOpen,
  });

  const startMutation = useMutation({
    mutationFn: async () => apiClient.post(`/production/orders/${id}/start/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production-order', id] }),
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const mat = materials.find((m) => m.id === dispMaterial);
      const res = await apiClient.post(`/production/orders/${id}/dispatch/`, {
        material_id: dispMaterial,
        quantity: Number(dispQty),
        unit_id: mat?.unit,
        material_handler_id: dispHandler,
        notes: dispNotes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-order', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      setDispatchOpen(false);
    },
  });

  const consumeMutation = useMutation({
    mutationFn: async () => {
      const mat = materials.find((m) => m.id === consumeMat);
      const res = await apiClient.post(`/production/orders/${id}/consume/`, {
        consumptions: [
          {
            material_id: consumeMat,
            planned_quantity: Number(consumeUsed) + Number(consumeWastage),
            issued_quantity: Number(consumeUsed) + Number(consumeWastage),
            used_quantity: Number(consumeUsed),
            wastage: Number(consumeWastage),
            unit_id: mat?.unit,
          },
        ],
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-order', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      setConsumeOpen(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/production/orders/${id}/complete/`, {
        actual_quantity: Number(actualQty),
        quality_status: qualityStatus,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-order', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      setCompleteOpen(false);
    },
  });

  if (isLoading || !order) {
    return <LoadingState rows={8} />;
  }

  return (
    <Box>
      <PageHeader
        title={`Batch: ${order.production_number} (${order.batch_number})`}
        subtitle={`Manufacturing ${order.planned_quantity} units of ${order.product_name} at ${order.production_unit_name}`}
        breadcrumbs={[
          { label: 'Production', href: '/production' },
          { label: order.production_number },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {order.status !== 'COMPLETED' && order.status !== 'REJECTED' && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SendIcon />}
                  onClick={() => setDispatchOpen(true)}
                >
                  Dispatch Raw Material
                </Button>

                {order.status === 'MATERIAL_ISSUED' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                  >
                    Start Run
                  </Button>
                )}

                {order.status === 'IN_PROGRESS' && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RemoveDoneIcon />}
                      onClick={() => setConsumeOpen(true)}
                    >
                      Record Consumption
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => setCompleteOpen(true)}
                    >
                      Complete & QC
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Main Details and Dispatches */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Material Dispatches Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                Raw Materials Dispatched to Unit
              </Typography>
              {order.dispatches?.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '8px' }}>
                  No raw materials have been issued to this production unit yet. Click "Dispatch Raw Material" to deduct stock from warehouse and transfer to factory floor.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>DISPATCH NO</TableCell>
                        <TableCell>MATERIAL</TableCell>
                        <TableCell align="right">QUANTITY</TableCell>
                        <TableCell>MATERIAL HANDLER (WORKFORCE)</TableCell>
                        <TableCell>DATE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.dispatches?.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{d.dispatch_number}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{d.material_name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {Number(d.quantity).toLocaleString()} {d.unit_code}
                          </TableCell>
                          <TableCell>{d.handler_name}</TableCell>
                          <TableCell>{d.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Material Consumptions Table */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                Actual Batch Consumption & Wastage
              </Typography>
              {order.consumptions?.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  Consumption records will appear once machine operator logs used quantities and wastage.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>MATERIAL</TableCell>
                        <TableCell align="right">USED QTY</TableCell>
                        <TableCell align="right" sx={{ color: '#DC2626' }}>WASTAGE</TableCell>
                        <TableCell align="right">TOTAL REDUCED</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.consumptions?.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{c.material_name}</TableCell>
                          <TableCell align="right">{Number(c.used_quantity).toLocaleString()} {c.unit_code}</TableCell>
                          <TableCell align="right" sx={{ color: '#DC2626', fontWeight: 600 }}>
                            {Number(c.wastage).toLocaleString()} {c.unit_code}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {(Number(c.used_quantity) + Number(c.wastage)).toLocaleString()} {c.unit_code}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Batch Status
                </Typography>
                <StatusBadge status={order.status} />
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Finished Good:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.product_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Production Unit:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.production_unit_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Supervisor:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.supervisor_name || 'Unassigned'}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Planned Output:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{Number(order.planned_quantity).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Actual Received:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                    {Number(order.actual_quantity) > 0 ? Number(order.actual_quantity).toLocaleString() : 'In Progress'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Raw Material Dispatch Modal */}
      <Dialog open={dispatchOpen} onClose={() => setDispatchOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Dispatch Raw Material to Unit</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Material"
              required
              value={dispMaterial}
              onChange={(e) => setDispMaterial(e.target.value)}
            >
              {materials.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} ({m.material_code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Quantity to Issue"
              required
              value={dispQty}
              onChange={(e) => setDispQty(parseFloat(e.target.value) || 0)}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Material Handler (Workforce Member)"
              required
              value={dispHandler}
              onChange={(e) => setDispHandler(e.target.value)}
              helperText="Mandatory assignment of the employee who transfers goods."
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.name} ({emp.designation_name})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              label="Dispatch Notes"
              placeholder="e.g. Issued 10 bags..."
              value={dispNotes}
              onChange={(e) => setDispNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDispatchOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!dispMaterial || !dispHandler || dispQty <= 0 || dispatchMutation.isPending}
            onClick={() => dispatchMutation.mutate()}
          >
            {dispatchMutation.isPending ? 'Issuing...' : 'Issue & Deduct Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Consumption Modal */}
      <Dialog open={consumeOpen} onClose={() => setConsumeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Material Consumption</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Material Consumed"
              required
              value={consumeMat}
              onChange={(e) => setConsumeMat(e.target.value)}
            >
              {materials.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} ({m.material_code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Actually Used in Products"
              required
              value={consumeUsed}
              onChange={(e) => setConsumeUsed(parseFloat(e.target.value) || 0)}
            />

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Wastage / Breakage"
              value={consumeWastage}
              onChange={(e) => setConsumeWastage(parseFloat(e.target.value) || 0)}
              helperText="Wastage is tracked and deducted from unit stock."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConsumeOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!consumeMat || consumeUsed <= 0 || consumeMutation.isPending}
            onClick={() => consumeMutation.mutate()}
          >
            {consumeMutation.isPending ? 'Logging...' : 'Log Consumption'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete & Quality Check Modal */}
      <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Complete Production Run</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Actual Finished Goods Quantity"
              required
              value={actualQty}
              onChange={(e) => setActualQty(parseFloat(e.target.value) || 0)}
              helperText="This quantity will be added to finished goods usable inventory."
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Quality Inspection Status"
              value={qualityStatus}
              onChange={(e) => setQualityStatus(e.target.value)}
            >
              <MenuItem value="PASSED">PASSED (Add to Stock)</MenuItem>
              <MenuItem value="FAILED">FAILED (Rejected)</MenuItem>
              <MenuItem value="REWORK">REWORK REQUIRED</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCompleteOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={actualQty <= 0 || completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            {completeMutation.isPending ? 'Completing...' : 'Finish & Add to Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
