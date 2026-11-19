import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { MdpLogo } from './MdpLogo';

interface InvoicePrintModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
  invoice?: any;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  open,
  onClose,
  order,
  invoice,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = invoice?.invoice_number || `INV-${order.sales_order_number?.replace('SO-', '') || '000124'}`;
  const invoiceDate = invoice?.invoice_date || order.order_date || new Date().toISOString().split('T')[0];
  const grandTotal = Number(invoice?.grand_total || order.grand_total || 0);
  const subtotal = Number(invoice?.subtotal || order.subtotal || 0);
  const tax = Number(invoice?.tax || order.tax || 0);
  const discount = Number(invoice?.discount || order.discount || 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '10px',
            border: '1px solid #E4E4E7',
            boxShadow: '0 12px 36px rgba(0,0,0,0.1)',
          },
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 2.5, sm: 4.5 } }}>
        <Box id="printable-invoice" sx={{ backgroundColor: '#FFFFFF' }}>
          {/* Header Block */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2.5 }}>
            <Box>
              <MdpLogo size="medium" />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B', mt: 1 }}>
                AromaCraft Fragrances & Incense Pvt. Ltd.
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block', maxWidth: 280 }}>
                Plot 42, Peenya Industrial Area Phase II, Bengaluru, Karnataka - 560058
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
                GSTIN: 29AABCA1234F1Z5 • PAN: AABCA1234F
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#14532D', letterSpacing: '-0.02em' }}>
                TAX INVOICE
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mt: 0.5 }}>
                {invoiceNumber}
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
                Date: {invoiceDate}
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
                Ref Order: {order.sales_order_number}
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  mt: 1,
                  px: 1,
                  py: 0.2,
                  borderRadius: '4px',
                  backgroundColor: order.payment_status === 'PAID' ? '#F0FDF4' : '#FFFBEB',
                  color: order.payment_status === 'PAID' ? '#15803D' : '#B45309',
                  border: `1px solid ${order.payment_status === 'PAID' ? '#BBF7D0' : '#FDE68A'}`,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              >
                {order.payment_status === 'PAID' ? 'PAID IN FULL' : 'PAYMENT DUE'}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: '#E4E4E7' }} />

          {/* Bill To / Ship To Details */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#71717A', textTransform: 'uppercase' }}>
                Billed To
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mt: 0.3 }}>
                {order.customer_name || 'Valued Customer'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
                Customer Code: {order.customer_code || 'DEALER-001'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
                Place of Supply: Karnataka (State Code 29)
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#71717A', textTransform: 'uppercase' }}>
                Terms & Logistics
              </Typography>
              <Typography variant="body2" sx={{ color: '#18181B', fontWeight: 500, mt: 0.3 }}>
                Payment Method: {order.payment_type?.replace(/_/g, ' ') || 'Bank Transfer'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
                Dispatch Via: Dedicated Fragrance Transport
              </Typography>
            </Box>
          </Box>

          {/* Line Items Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E4E7', mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#FAFAF9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>ITEM DESCRIPTION</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>QTY</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>RATE (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>DISC (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>TAX (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#52525B', fontSize: '0.76rem' }}>TOTAL (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(order.items || []).map((item: any, idx: number) => (
                  <TableRow key={item.id || idx}>
                    <TableCell sx={{ color: '#71717A', fontSize: '0.8rem' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#18181B', fontSize: '0.82rem' }}>
                      {item.product_name}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.82rem' }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.82rem' }}>₹{Number(item.rate).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#71717A' }}>₹{Number(item.discount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#71717A' }}>₹{Number(item.tax || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#18181B', fontSize: '0.82rem' }}>
                      ₹{Number(item.total).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Financial Calculation Block */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ width: 280 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                <Typography variant="body2" sx={{ color: '#71717A' }}>Taxable Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B' }}>₹{subtotal.toLocaleString('en-IN')}</Typography>
              </Box>
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                  <Typography variant="body2" sx={{ color: '#71717A' }}>Discount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#B91C1C' }}>-₹{discount.toLocaleString('en-IN')}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                <Typography variant="body2" sx={{ color: '#71717A' }}>GST (Output CGST+SGST):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B' }}>₹{tax.toLocaleString('en-IN')}</Typography>
              </Box>
              <Divider sx={{ my: 0.8, borderColor: '#E4E4E7' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#18181B' }}>Grand Total:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#14532D' }}>₹{grandTotal.toLocaleString('en-IN')}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Bank Account Details & Signatory */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, pt: 2, borderTop: '1px solid #E4E4E7' }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#71717A', display: 'block', mb: 0.3 }}>
                Bank Remittance Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#52525B', display: 'block' }}>
                Bank: HDFC Bank Ltd • Branch: Peenya Industrial Estate
              </Typography>
              <Typography variant="caption" sx={{ color: '#52525B', display: 'block' }}>
                A/C No: 50200084729104 • IFSC: HDFC0001245
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#71717A', display: 'block', mb: 4 }}>
                For AromaCraft Fragrances & Incense Pvt. Ltd.
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#18181B', borderTop: '1px dashed #A1A1AA', pt: 0.5, px: 2 }}>
                Authorized Signatory
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E4E4E7' }}>
        <Button onClick={onClose} variant="outlined" startIcon={<CloseRoundedIcon />} sx={{ color: '#71717A' }}>
          Close
        </Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintOutlinedIcon />} sx={{ backgroundColor: '#14532D' }}>
          Print Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};
