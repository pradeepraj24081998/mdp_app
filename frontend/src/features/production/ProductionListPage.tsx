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
  Chip,
  IconButton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { apiClient } from '../../api/client';
import { ProductionOrder, Product, ProductionUnit, Employee } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const ProductionListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [product, setProduct] = useState('');
  const [productionUnit, setProductionUnit] = useState('');
  const [batchNumber, setBatchNumber] = useState(`BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [plannedQty, setPlannedQty] = useState(5000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [supervisor, setSupervisor] = useState('');

  const { data: orders = [], isLoading } = useQuery<ProductionOrder[]>({
    queryKey: ['production-orders'],
    queryFn: async () => {
      const res = await apiClient.get('/production/orders/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await apiClient.get('/products/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: createOpen,
  });

  const { data: units = [] } = useQuery<ProductionUnit[]>({
    queryKey: ['units-list'],
    queryFn: async () => {
      const res = await apiClient.get('/production-units/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: createOpen,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
    enabled: createOpen,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/production/orders/', {
        product,
        production_unit: productionUnit,
        batch_number: batchNumber,
        planned_quantity: Number(plannedQty),
        start_date: startDate,
        expected_completion: expectedDate,
        supervisor: supervisor || null,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      setCreateOpen(false);
      navigate(`/production/orders/${data.data.id}`);
    },
  });

  return (
    <Box>
      <PageHeader
        title="Production & Manufacturing"
        subtitle="Manage batch manufacturing runs, raw material issues, and finished goods quality checks"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create Production Order
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          {isLoading ? (
            <LoadingState rows={6} />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No production orders found"
              description="Plan a new production batch order for rolling or perfuming incense sticks."
              actionText="Create Production Order"
              onAction={() => setCreateOpen(true)}
            />
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>ORDER NUMBER</TableCell>
                    <TableCell>BATCH NUMBER</TableCell>
                    <TableCell>FINISHED PRODUCT</TableCell>
                    <TableCell>FACILITY UNIT</TableCell>
                    <TableCell align="right">PLANNED QTY</TableCell>
                    <TableCell align="right">ACTUAL OUTPUT</TableCell>
                    <TableCell>START DATE</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell align="center">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((ord) => (
                    <TableRow
                      key={ord.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/production/orders/${ord.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>
                        {ord.production_number}
                      </TableCell>
                      <TableCell>
                        <Chip label={ord.batch_number} size="small" sx={{ fontWeight: 600, bgcolor: '#F1F5F9' }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{ord.product_name}</TableCell>
                      <TableCell>{ord.production_unit_name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {Number(ord.planned_quantity).toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                        {Number(ord.actual_quantity) > 0 ? Number(ord.actual_quantity).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{ord.start_date}</TableCell>
                      <TableCell>
                        <StatusBadge status={ord.status} />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/production/orders/${ord.id}`)}
                          sx={{ color: '#2563EB' }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Order Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Plan Batch Production Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Finished Good / Product"
              required
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.product_name} ({p.product_code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Assigned Factory Unit"
              required
              value={productionUnit}
              onChange={(e) => setProductionUnit(e.target.value)}
            >
              {units.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} ({u.production_unit_code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              label="Batch Number"
              required
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Planned Batch Quantity"
              required
              value={plannedQty}
              onChange={(e) => setPlannedQty(parseFloat(e.target.value) || 0)}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Expected Completion"
                InputLabelProps={{ shrink: true }}
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </Box>

            <TextField
              select
              fullWidth
              size="small"
              label="Floor Supervisor (Employee)"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
            >
              <MenuItem value="">-- None / Unassigned --</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.name} ({emp.designation_name})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!product || !productionUnit || plannedQty <= 0 || createOrderMutation.isPending}
            onClick={() => createOrderMutation.mutate()}
          >
            {createOrderMutation.isPending ? 'Scheduling...' : 'Schedule Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
