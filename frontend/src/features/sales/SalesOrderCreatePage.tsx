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
import { Customer, Product } from '../../types';

interface SalesItemForm {
  product: string;
  quantity: number;
  rate: number;
  discount: number;
  tax: number;
}

export const SalesOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customer, setCustomer] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [paymentType, setPaymentType] = useState('CREDIT');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<SalesItemForm[]>([
    { product: '', quantity: 100, rate: 180, discount: 0, tax: 0 },
  ]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/customers/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await apiClient.get('/products/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const handleAddItem = () => {
    setItems([...items, { product: '', quantity: 50, rate: 150, discount: 0, tax: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleProductChange = (idx: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      product: prodId,
      rate: Number(prod?.selling_price || 0),
    };
    setItems(updated);
  };

  const handleItemFieldChange = (idx: number, field: keyof SalesItemForm, val: any) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.rate) - it.discount, 0);
  const totalTax = items.reduce((acc, it) => acc + Number(it.tax || 0), 0);
  const grandTotal = subtotal + totalTax;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer,
        order_date: orderDate,
        delivery_date: deliveryDate,
        payment_type: paymentType,
        notes,
        items: items.map((it) => ({
          product: it.product,
          quantity: Number(it.quantity),
          rate: Number(it.rate),
          discount: Number(it.discount),
          tax: Number(it.tax),
        })),
      };
      const res = await apiClient.post('/sales/orders/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      navigate(`/sales/orders/${data.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      alert('Please select a customer/dealer');
      return;
    }
    if (items.some((i) => !i.product)) {
      alert('Please select products for all lines');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Box>
      <PageHeader
        title="Create Sales Order"
        subtitle="Book wholesale dealer order and schedule dispatch fulfillment"
        breadcrumbs={[
          { label: 'Sales Orders', href: '/sales' },
          { label: 'New' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2.5 }}>
                  Customer & Terms
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Customer / Dealer"
                      required
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                    >
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.customer_code} - {c.customer_type})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Order Date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputLabelProps={{ shrink: true }}
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Delivery Expected"
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputLabelProps={{ shrink: true }}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Payment Terms"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                    >
                      <MenuItem value="ADVANCE">Advance Full Payment</MenuItem>
                      <MenuItem value="PARTIAL_ADVANCE">Partial Advance</MenuItem>
                      <MenuItem value="CREDIT">Dealer Credit Term</MenuItem>
                      <MenuItem value="CASH_ON_DELIVERY">Cash on Delivery (COD)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label="Dispatch Notes / Special Instructions"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Line Items */}
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
                  >
                    Add Product
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200 }}>PRODUCT</TableCell>
                        <TableCell sx={{ width: 120 }}>QUANTITY</TableCell>
                        <TableCell sx={{ width: 130 }}>RATE (₹)</TableCell>
                        <TableCell sx={{ width: 110 }}>DISCOUNT (₹)</TableCell>
                        <TableCell sx={{ width: 110 }}>GST / TAX (₹)</TableCell>
                        <TableCell align="right" sx={{ width: 130 }}>TOTAL (₹)</TableCell>
                        <TableCell align="center" sx={{ width: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((it, idx) => {
                        const lineTotal = (it.quantity * it.rate) - it.discount + Number(it.tax || 0);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                required
                                value={it.product}
                                onChange={(e) => handleProductChange(idx, e.target.value)}
                              >
                                {products.map((p) => (
                                  <MenuItem key={p.id} value={p.id}>
                                    {p.product_name} ({p.product_code})
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 1 }}
                                value={it.quantity}
                                onChange={(e) => handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                inputProps={{ min: 0 }}
                                value={it.rate}
                                onChange={(e) => handleItemFieldChange(idx, 'rate', parseFloat(e.target.value) || 0)}
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
                                disabled={items.length <= 1}
                                sx={{ color: '#EF4444' }}
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

          {/* Right Summary */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ position: 'sticky', top: 88 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                  Order Total
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>GST / Tax:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>+₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Grand Total:</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.4rem' }}>
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={createMutation.isPending}
                  sx={{ mt: 3, py: 1.2, fontWeight: 600 }}
                >
                  {createMutation.isPending ? 'Booking Order...' : 'Confirm Sales Order'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
