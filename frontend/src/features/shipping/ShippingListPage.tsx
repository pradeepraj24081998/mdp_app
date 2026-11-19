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
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { PurchaseOrder, Employee } from '../../types';

export const ShippingListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [po, setPo] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [fromAddress, setFromAddress] = useState('Mysore Sandalwood Complex');
  const [toAddress, setToAddress] = useState('Plot 41, Industrial Area, Peenya, Bangalore');
  const [transporter, setTransporter] = useState('VRL Logistics Ltd');
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-AB-1234');
  const [driver, setDriver] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [freight, setFreight] = useState(3500);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const res = await apiClient.get('/shipments/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: poList = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['po-list-all'],
    queryFn: async () => {
      const res = await apiClient.get('/purchases/');
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

  const createShipmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/shipments/', {
        purchase_order: po || null,
        lr_number: lrNumber,
        from_address: fromAddress,
        to_address: toAddress,
        transporter,
        vehicle_number: vehicleNumber,
        driver: driver || null,
        date,
        freight_charge: Number(freight),
        status: 'IN_TRANSIT',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setCreateOpen(false);
    },
  });

  return (
    <Box>
      <PageHeader
        title="Shipping & Inbound Logistics"
        subtitle="Track carrier shipments, LR / consignment notes, and freight expenses"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create Shipment Record
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          {isLoading ? (
            <LoadingState rows={5} />
          ) : shipments.length === 0 ? (
            <EmptyState
              title="No shipments registered"
              description="Record LR/Bilty details from transporters delivering materials."
              actionText="Create Shipment Record"
              onAction={() => setCreateOpen(true)}
            />
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>SHIPMENT NO</TableCell>
                    <TableCell>LR / BILTY NO</TableCell>
                    <TableCell>PURCHASE ORDER</TableCell>
                    <TableCell>TRANSPORTER</TableCell>
                    <TableCell>VEHICLE NUMBER</TableCell>
                    <TableCell>ASSIGNED DRIVER</TableCell>
                    <TableCell align="right">FREIGHT CHARGE</TableCell>
                    <TableCell>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipments.map((s: any) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>
                        {s.shipment_number}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.lr_number || 'N/A'}</TableCell>
                      <TableCell>{s.purchase_number || 'Direct Transfer'}</TableCell>
                      <TableCell>{s.transporter}</TableCell>
                      <TableCell>{s.vehicle_number}</TableCell>
                      <TableCell>{s.driver_name || 'Transporter Driver'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{Number(s.freight_charge).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Shipment Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Inbound Shipment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Associated Purchase Order"
              value={po}
              onChange={(e) => setPo(e.target.value)}
            >
              <MenuItem value="">-- Direct Logistics Consignment --</MenuItem>
              {poList.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.purchase_number} ({p.vendor_name})
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="LR / Consignment Bilty No"
                required
                placeholder="e.g. VRL-987654"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Dispatch Date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Transporter Company"
                required
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Vehicle Number"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </Box>

            <TextField
              select
              fullWidth
              size="small"
              label="Assigned Workforce Driver (If in-house)"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
            >
              <MenuItem value="">-- External Carrier Driver --</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.name} ({emp.designation_name})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Freight Charge (₹)"
              value={freight}
              onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!lrNumber || !transporter || createShipmentMutation.isPending}
            onClick={() => createShipmentMutation.mutate()}
          >
            {createShipmentMutation.isPending ? 'Logging...' : 'Log Shipment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
