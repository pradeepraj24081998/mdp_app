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
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { InvoicePrintModal } from '../../components/common/InvoicePrintModal';
import { generateInvoicePdf } from '../../utils/generateInvoicePdf';

export const SalesOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Return Form
  const [returnProduct, setReturnProduct] = useState('');
  const [returnQty, setReturnQty] = useState(10);
  const [returnPrice, setReturnPrice] = useState(150);
  const [returnReason, setReturnReason] = useState('DAMAGED');
  const [returnUsable, setReturnUsable] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: async () => {
      const res = await apiClient.get(`/sales/orders/${id}/`);
      return res.data?.data ?? res.data;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => apiClient.post(`/sales/orders/${id}/confirm/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-order', id] }),
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => apiClient.post(`/sales/orders/${id}/dispatch/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/sales/orders/${id}/payment/`, {
        amount: Number(payAmount),
        payment_mode: payMode,
        transaction_reference: payRef,
        notes: payNotes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      setPayModalOpen(false);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/sales/returns/', {
        original_sales_order: id,
        customer: order.customer,
        product: returnProduct,
        quantity: Number(returnQty),
        price: Number(returnPrice),
        reason: returnReason,
        return_date: new Date().toISOString().split('T')[0],
        is_usable: returnUsable,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Process return to post to inventory
      apiClient.post(`/sales/returns/${data.data.id}/process/`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
        queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
        setReturnModalOpen(false);
      });
    },
  });

  if (isLoading) {
    return <LoadingState rows={8} />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Sales order not found"
        description="The requested sales order could not be retrieved from the server."
        actionText="Back to Sales Orders"
        onAction={() => navigate('/sales')}
      />
    );
  }

  const invoice = order.invoices?.[0];
  const balanceDue = Math.max(0, Number(order.grand_total) - Number(order.paid_amount));

  return (
    <Box>
      <PageHeader
        title={`Sales Order: ${order.sales_order_number}`}
        subtitle={`Placed by ${order.customer_name} on ${order.order_date}`}
        breadcrumbs={[
          { label: 'Sales Orders', href: '/sales' },
          { label: order.sales_order_number },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => window.print()}
            >
              Print Tax Invoice
            </Button>

            {order.status === 'DRAFT' && (
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                Confirm Order
              </Button>
            )}

            {balanceDue > 0 && order.status !== 'DRAFT' && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PaymentIcon />}
                onClick={() => {
                  setPayAmount(balanceDue);
                  setPayModalOpen(true);
                }}
              >
                Collect Payment
              </Button>
            )}

            {!order.is_stock_deducted && order.status !== 'DRAFT' && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<LocalShippingOutlinedIcon />}
                onClick={() => dispatchMutation.mutate()}
                disabled={dispatchMutation.isPending}
              >
                Fulfill & Dispatch
              </Button>
            )}

            {order.status === 'DISPATCHED' && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<AssignmentReturnOutlinedIcon />}
                onClick={() => {
                  if (order.items?.[0]) {
                    setReturnProduct(order.items[0].product);
                    setReturnPrice(order.items[0].rate);
                  }
                  setReturnModalOpen(true);
                }}
              >
                Record Sales Return
              </Button>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => generateInvoicePdf(order)}
              sx={{
                borderRadius: '8px',
                bgcolor: '#DC2626',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                '&:hover': { bgcolor: '#B91C1C' },
              }}
            >
              Download PDF Invoice
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Main Line Items */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                Ordered Finished Goods
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>PRODUCT</TableCell>
                      <TableCell align="right">QUANTITY</TableCell>
                      <TableCell align="right">UNIT RATE</TableCell>
                      <TableCell align="right">DISCOUNT</TableCell>
                      <TableCell align="right">GST / TAX</TableCell>
                      <TableCell align="right">TOTAL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items?.map((it: any) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {it.product_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {it.product_code}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{Number(it.quantity).toLocaleString()} {it.unit_code}</TableCell>
                        <TableCell align="right">₹{Number(it.rate).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{Number(it.discount).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{Number(it.tax).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          ₹{Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Payment Receipts Ledger */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                Payment Transactions
              </Typography>
              {order.payments?.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  No payment recorded yet. Click "Collect Payment" to log dealer remittance.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>RECEIPT NO</TableCell>
                        <TableCell>DATE</TableCell>
                        <TableCell>MODE</TableCell>
                        <TableCell>REFERENCE</TableCell>
                        <TableCell align="right">AMOUNT PAID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.payments?.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{p.payment_number}</TableCell>
                          <TableCell>{p.payment_date}</TableCell>
                          <TableCell>{p.payment_mode}</TableCell>
                          <TableCell>{p.transaction_reference || 'N/A'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                            ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

        {/* Sidebar Summary & Invoicing */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Order Financials
                </Typography>
                <StatusBadge status={order.status} />
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Customer / Dealer:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Terms:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.payment_type}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Stock Deducted:</Typography>
                  <Chip
                    label={order.is_stock_deducted ? 'FULFILLED' : 'PENDING DISPATCH'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      height: 20,
                      fontSize: '0.68rem',
                      bgcolor: order.is_stock_deducted ? '#ECFDF5' : '#FFFBEB',
                      color: order.is_stock_deducted ? '#059669' : '#D97706',
                    }}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{Number(order.subtotal).toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Discount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>-₹{Number(order.discount).toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>GST / Tax:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>+₹{Number(order.tax).toLocaleString('en-IN')}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grand Total:</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.4rem' }}>
                    ₹{Number(order.grand_total).toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Paid Amount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                    ₹{Number(order.paid_amount).toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Balance Due:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: balanceDue > 0 ? '#DC2626' : '#059669' }}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>

              {invoice && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block' }}>
                    TAX INVOICE LINKED
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                    {invoice.invoice_number}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Dated: {invoice.invoice_date} • Status: {invoice.payment_status}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Collect Payment Modal */}
      <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Customer Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Remittance Amount (₹)"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              helperText={`Balance due: ₹${balanceDue.toLocaleString('en-IN')}`}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Payment Mode"
              value={payMode}
              onChange={(e) => setPayMode(e.target.value)}
            >
              <MenuItem value="BANK_TRANSFER">NEFT / RTGS / Bank Transfer</MenuItem>
              <MenuItem value="UPI">UPI Payment</MenuItem>
              <MenuItem value="CHEQUE">Cheque / Demand Draft</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
            </TextField>

            <TextField
              fullWidth
              size="small"
              label="UTR / Cheque / Transaction Ref"
              placeholder="e.g. UTR12345678"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              label="Payment Notes"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPayModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={payAmount <= 0 || payMutation.isPending}
            onClick={() => payMutation.mutate()}
          >
            {payMutation.isPending ? 'Recording...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Return Modal */}
      <Dialog open={returnModalOpen} onClose={() => setReturnModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Process Customer Sales Return</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Returned Quantity"
              required
              value={returnQty}
              onChange={(e) => setReturnQty(parseFloat(e.target.value) || 0)}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Return Reason"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            >
              <MenuItem value="DAMAGED">Damaged Goods / Packaging</MenuItem>
              <MenuItem value="WRONG_PRODUCT">Wrong Item Sent</MenuItem>
              <MenuItem value="QUALITY_ISSUE">Fragrance / Quality Discrepancy</MenuItem>
              <MenuItem value="CUSTOMER_RETURN">Dealer Overstock Return</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Usability / Quarantine"
              value={returnUsable ? 'USABLE' : 'DAMAGED'}
              onChange={(e) => setReturnUsable(e.target.value === 'USABLE')}
              helperText={
                returnUsable
                  ? 'Product is intact and will be restored to available stock.'
                  : 'Product is damaged and will be segregated in quarantine.'
              }
            >
              <MenuItem value="USABLE">Usable (Return to Active Stock)</MenuItem>
              <MenuItem value="DAMAGED">Damaged (Move to Quarantine)</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReturnModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={returnQty <= 0 || returnMutation.isPending}
            onClick={() => returnMutation.mutate()}
          >
            {returnMutation.isPending ? 'Processing...' : 'Accept Return & Adjust Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Professional Tax Invoice Modal */}
      <InvoicePrintModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        order={order}
        invoice={invoice}
      />
    </Box>
  );
};
