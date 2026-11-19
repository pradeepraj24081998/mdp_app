import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { Material, Vendor } from '../../types';

interface LineItemForm {
  material: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
}

export const PurchaseCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vendor, setVendor] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [freight, setFreight] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<LineItemForm[]>([
    { material: '', unit: '', quantity: 0, unit_price: 0, discount: 0, tax: 0 },
  ]);

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await apiClient.get('/vendors/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['materials-list'],
    queryFn: async () => {
      const res = await apiClient.get('/materials/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const unselectedMaterials = materials.filter((m) => !items.some((it) => it.material === m.id));
  const canAddMoreItems = unselectedMaterials.length > 0;

  const handleAddItem = () => {
    if (canAddMoreItems) {
      setItems([...items, { material: '', unit: '', quantity: 1, unit_price: 0, discount: 0, tax: 0 }]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    } else {
      setItems([{ material: '', unit: '', quantity: 1, unit_price: 0, discount: 0, tax: 0 }]);
    }
  };

  const handleMaterialChange = (idx: number, matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      material: matId,
      unit: mat?.unit || '',
    };
    setItems(updated);
  };

  const handleItemFieldChange = (idx: number, field: keyof LineItemForm, val: any) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setItems(updated);
  };

  // Subtotal & Grand total
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_price) - it.discount, 0);
  const totalTax = items.reduce((acc, it) => acc + Number(it.tax || 0), 0);
  const grandTotal = subtotal + totalTax + Number(freight || 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vendor,
        purchase_date: purchaseDate,
        expected_date: expectedDate,
        payment_terms: paymentTerms,
        freight: Number(freight),
        notes,
        items: items.map((it) => ({
          material: it.material,
          unit: it.unit,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          discount: Number(it.discount),
          tax: Number(it.tax),
        })),
      };
      const res = await apiClient.post('/purchases/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigate('/purchases');
    },
    onError: (err: any) => {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (typeof err?.response?.data === 'object' ? JSON.stringify(err.response.data) : null) ||
        err?.message ||
        'Failed to create purchase order';
      alert(`Error creating purchase order: ${errMsg}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) {
      alert('Please select a vendor');
      return;
    }
    if (items.some((i) => !i.material)) {
      alert('Please select materials for all line items');
      return;
    }
    if (items.some((i) => Number(i.quantity) <= 0)) {
      alert('Please enter a quantity greater than 0 for all items');
      return;
    }
    if (items.some((i) => Number(i.unit_price) <= 0)) {
      alert('Please enter an agreed unit price/rate greater than ₹0 for all items');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Box>
      <PageHeader
        title="Create Purchase Order"
        subtitle="Issue new procurement requisition for raw & packaging materials"
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/purchases' },
          { label: 'New' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main PO Info */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2.5 }}>
                  General Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Vendor / Supplier"
                      required
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                    >
                      {vendors.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.vendor_name} ({v.vendor_code})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Purchase Date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputLabelProps={{ shrink: true }}
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Expected Delivery"
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputLabelProps={{ shrink: true }}
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Payment Terms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label="Procurement Notes & Instructions"
                      placeholder="e.g. Delivery required in sealed HDPE drums..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Line Items Table */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Order Items
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    disabled={!canAddMoreItems}
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200 }}>MATERIAL</TableCell>
                        <TableCell sx={{ width: 120 }}>QUANTITY</TableCell>
                        <TableCell sx={{ width: 130 }}>UNIT RATE (₹)</TableCell>
                        <TableCell sx={{ width: 110 }}>DISCOUNT (₹)</TableCell>
                        <TableCell sx={{ width: 110 }}>GST / TAX (₹)</TableCell>
                        <TableCell align="right" sx={{ width: 130 }}>TOTAL (₹)</TableCell>
                        <TableCell align="center" sx={{ width: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((it, idx) => {
                        const lineTotal = (it.quantity * it.unit_price) - it.discount + Number(it.tax || 0);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                required
                                value={it.material}
                                onChange={(e) => handleMaterialChange(idx, e.target.value)}
                              >
                                {materials
                                  .filter((m) => m.id === it.material || !items.some((other, i) => i !== idx && other.material === m.id))
                                  .map((m) => (
                                    <MenuItem key={m.id} value={m.id}>
                                      {m.name} ({m.material_code})
                                    </MenuItem>
                                  ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0.01, step: 'any' }}
                                value={it.quantity}
                                onChange={(e) => handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0, step: 'any' }}
                                value={it.unit_price}
                                onChange={(e) => handleItemFieldChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0 }}
                                value={it.discount}
                                onChange={(e) => handleItemFieldChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0 }}
                                value={it.tax}
                                onChange={(e) => handleItemFieldChange(idx, 'tax', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                              ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={items.length <= 1 && !it.material}
                                sx={{ color: items.length > 1 || it.material ? '#EF4444' : '#D4D4D8' }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Summary Sidebar */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ position: 'sticky', top: 88 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                  Financial Estimate
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Items Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Cumulative Tax:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>+₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Freight / Logistics:</Typography>
                    <TextField
                      size="small"
                      type="number"
                      sx={{ width: 110 }}
                      value={freight}
                      onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Grand Total:</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.4rem' }}>
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/purchases')}
                    sx={{ py: 1.2, fontWeight: 600, color: '#64748B', borderColor: '#CBD5E1', textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    color="primary"
                    disabled={createMutation.isPending}
                    sx={{ py: 1.2, fontWeight: 700, textTransform: 'none' }}
                  >
                    {createMutation.isPending ? 'Saving Order...' : 'Save Purchase Order'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
