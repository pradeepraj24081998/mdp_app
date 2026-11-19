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
  Alert,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { generatePurchasePdf } from '../../utils/generatePurchasePdf';

export const PurchaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const deleteMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/purchases/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigate('/purchases');
    },
  });

  // Vendor editing & Commercial rate editing modal states
  const [editRatesOpen, setEditRatesOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [freightVal, setFreightVal] = useState<number>(0);
  const [paymentTermsVal, setPaymentTermsVal] = useState<string>('Net 30');
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  // Alternative Vendor / Shop Purchasing modal states
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [itemToSplit, setItemToSplit] = useState<any | null>(null);
  const [targetVendorId, setTargetVendorId] = useState<string>('');
  const [splitQuantity, setSplitQuantity] = useState<number>(1);
  const [splitPrice, setSplitPrice] = useState<number>(0);
  const [splitSuccess, setSplitSuccess] = useState<any | null>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!po) return;
    setDownloadingPdf(true);
    try {
      const { generatePurchasePdf: genPdf } = await import('../../utils/generatePurchasePdf');
      genPdf(po);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 600);
    }
  };

  // Fetch PO detail
  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const res = await apiClient.get(`/purchases/${id}/`);
      return res.data?.data ?? res.data;
    },
  });

  // Fetch all vendors for editing & alternative sourcing
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await apiClient.get('/vendors/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data?.results || res.data || [];
    },
  });

  // Alternative quotes / spot prices
  const { data: spotQuotes } = useQuery({
    queryKey: ['alternative-sources', po?.items?.[0]?.material],
    queryFn: async () => {
      if (!po?.items?.[0]?.material) return [];
      const res = await apiClient.get(`/purchases/alternative-sources/?material_id=${po.items[0].material}`);
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!po?.items?.[0]?.material,
  });

  const openEditModal = () => {
    if (po) {
      setSelectedVendorId(po.vendor || '');
      setEditedItems(
        (po.items || []).map((it: any) => ({
          material: it.material,
          material_name: it.material_name,
          material_code: it.material_code,
          unit: it.unit,
          unit_code: it.unit_code,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price || 0),
          discount: Number(it.discount || 0),
          tax: Number(it.tax || 0),
        }))
      );
      setFreightVal(Number(po.freight || 0));
      setPaymentTermsVal(po.payment_terms || 'Net 30');
      setEditRatesOpen(true);
    }
  };

  const openSplitModal = (item: any) => {
    setItemToSplit(item);
    setSplitQuantity(Number(item.quantity || 1));
    setSplitPrice(Number(item.unit_price || 0));
    setTargetVendorId('');
    setSplitSuccess(null);
    setSplitModalOpen(true);
  };

  const updateRatesMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vendor: selectedVendorId || po.vendor,
        freight: Number(freightVal),
        payment_terms: po.payment_terms || 'Net 30',
        items: editedItems.map((it) => ({
          material: it.material,
          unit: it.unit,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          discount: Number(it.discount || 0),
          tax: Number(it.tax || 0),
        })),
      };
      const res = await apiClient.patch(`/purchases/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      setEditRatesOpen(false);
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  const splitItemMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        item_id: itemToSplit.id,
        target_vendor_id: targetVendorId,
        quantity: splitQuantity,
        unit_price: splitPrice,
      };
      const res = await apiClient.post(`/purchases/${id}/split-item-vendor/`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setSplitSuccess(data.data);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => apiClient.post(`/purchases/${id}/submit/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', id] }),
  });

  const approveMutation = useMutation({
    mutationFn: async () => apiClient.post(`/purchases/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => apiClient.post(`/purchases/${id}/reject/`, { reason }),
    onSuccess: () => {
      setRejectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
    },
  });

  const orderMutation = useMutation({
    mutationFn: async () => apiClient.post(`/purchases/${id}/mark-ordered/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', id] }),
  });

  if (isLoading || !po) {
    return <LoadingState rows={8} />;
  }

  return (
    <Box>
      <PageHeader
        title={`Purchase Order: ${po.purchase_number}`}
        subtitle={`Issued to ${po.vendor_name} on ${po.purchase_date}${
          po.planning_number ? ` • Generated from Plan: ${po.planning_number}` : ''
        }`}
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/purchases' },
          { label: po.purchase_number },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Generate & Download PDF Order (No Screenshot / No Print) */}
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              sx={{
                borderRadius: '8px',
                bgcolor: '#DC2626',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                '&:hover': { bgcolor: '#B91C1C' },
              }}
            >
              {downloadingPdf ? 'Generating PDF...' : 'Download PDF Order'}
            </Button>

            {(po.status === 'DRAFT' || po.status === 'REJECTED' || po.status === 'CANCELLED' || !po.items?.length) && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => setDeleteOpen(true)}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: '#FECDD3',
                  color: '#E11D48',
                  bgcolor: '#FFF1F2',
                  '&:hover': { bgcolor: '#FFE4E6', borderColor: '#E11D48' },
                }}
              >
                Delete Order
              </Button>
            )}

            {(po.status === 'DRAFT' || po.status === 'ACTIVE') && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<HighlightOffIcon />}
                  onClick={() => setRejectOpen(true)}
                  sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                >
                  Reject / Cancel
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={openEditModal}
                  sx={{
                    borderRadius: '8px',
                    color: '#0D9488',
                    borderColor: '#99F6E4',
                    bgcolor: '#F0FDFA',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#CCFBF1', borderColor: '#0D9488' },
                  }}
                >
                  Edit Vendor & Rates
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SendOutlinedIcon />}
                  onClick={() => setSubmitConfirmOpen(true)}
                  disabled={submitMutation.isPending || Number(po.grand_total) === 0}
                  sx={{
                    borderRadius: '8px',
                    bgcolor: '#14532D',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#0B3B1F' },
                  }}
                >
                  Submit for Review
                </Button>
              </>
            )}

            {(po.status === 'MANAGER_REVIEW' || po.status === 'PENDING_ADMIN_APPROVAL') && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<HighlightOffIcon />}
                  onClick={() => setRejectOpen(true)}
                  sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                >
                  {po.status === 'PENDING_ADMIN_APPROVAL' ? 'Admin Approve (Tier 2)' : 'Approve PO'}
                </Button>
              </>
            )}

            {po.status === 'APPROVED' && (
              <Button
                variant="contained"
                size="small"
                startIcon={<LocalShippingOutlinedIcon />}
                onClick={() => orderMutation.mutate()}
                disabled={orderMutation.isPending}
                sx={{ borderRadius: '8px', bgcolor: '#14532D', fontWeight: 700, textTransform: 'none' }}
              >
                Mark as Ordered
              </Button>
            )}
          </Box>
        }
      />

      {/* Warning banner if PO has no procurement line items */}
      {(!po.items || po.items.length === 0) && (
        <Alert
          severity="warning"
          action={
            <Button
              color="error"
              size="small"
              variant="contained"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => setDeleteOpen(true)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Delete Empty PO
            </Button>
          }
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            No Procurement Items in Purchase Order
          </Typography>
          This purchase order has 0 procurement items and cannot be submitted. You can soft-delete it so it does not appear on the list screen.
        </Alert>
      )}

      {/* Plan Origin Rate Setting Reminder */}
      {po.status === 'DRAFT' && Number(po.grand_total) === 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: '10px', border: '1px solid #FDE68A', bgcolor: '#FFFBEB' }}
          action={
            <Button
              size="small"
              variant="contained"
              onClick={openEditModal}
              sx={{ bgcolor: '#B45309', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#92400E' } }}
            >
              Set Agreed Rates & Vendor
            </Button>
          }
        >
          <strong>Commercial Rates & Vendor Required:</strong> This requisition was generated from Material Plan{' '}
          <strong>{po.planning_number || 'Requisition'}</strong>. Please enter the agreed vendor unit rates, GST/taxes, and payment terms before submitting for management approval.
        </Alert>
      )}

      {po.status === 'REJECTED' && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          <strong>Rejection Notice:</strong> {po.rejection_reason || 'No detailed reason specified.'}
        </Alert>
      )}

      {/* Tabs for Details vs Spot Purchasing */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2.5 }}>
        <Tab label="Purchase Order Details" sx={{ fontWeight: 600 }} />
        <Tab label="Alternative Vendor Comparison (Spot Purchase)" sx={{ fontWeight: 600 }} />
      </Tabs>

      {activeTab === 0 ? (
        <Grid container spacing={3}>
          {/* Main Items Table */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Procurement Line Items
                  </Typography>
                  {(po.status === 'DRAFT' || po.status === 'ACTIVE') && (
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Material missing from this vendor? Click "Buy Another Shop" to source from an alternative supplier.
                    </Typography>
                  )}
                </Box>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#FAFAF9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>QUANTITY</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>UNIT RATE</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>DISCOUNT</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>TAX</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                        {(po.status === 'DRAFT' || po.status === 'ACTIVE') && (
                          <TableCell align="center" sx={{ fontWeight: 700, width: 140 }}>
                            SUPPLIER ACTION
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {po.items?.map((item: any) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#18181B' }}>
                              {item.material_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {item.material_code}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {Number(item.quantity).toLocaleString()} {item.unit_code}
                          </TableCell>
                          <TableCell align="right">₹{Number(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell align="right">₹{Number(item.discount).toFixed(2)}</TableCell>
                          <TableCell align="right">₹{Number(item.tax).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          {(po.status === 'DRAFT' || po.status === 'ACTIVE') && (
                            <TableCell align="center">
                              <Tooltip
                                title={`If ${po.vendor_name} doesn't stock this, transfer to another vendor/shop`}
                                arrow
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<StoreOutlinedIcon sx={{ fontSize: 14 }} />}
                                  onClick={() => openSplitModal(item)}
                                  sx={{
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#B45309',
                                    borderColor: '#FDE68A',
                                    bgcolor: '#FFFBEB',
                                    py: 0.3,
                                    px: 1,
                                    '&:hover': { bgcolor: '#FEF3C7', borderColor: '#B45309' },
                                  }}
                                >
                                  Buy Another Shop
                                </Button>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {po.notes && (
                  <Box sx={{ mt: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 0.5 }}>
                      ORDER NOTES & SPECIFICATIONS
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B' }}>
                      {po.notes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Approval History Audit Trail */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 2 }}>
                  Approval Workflow & Audit History
                </Typography>
                {po.approvals?.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    No approvals recorded yet.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#FAFAF9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>TIER</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ACTION</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>AUTHORIZED BY</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>DATE</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>NOTES</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {po.approvals?.map((app: any) => (
                          <TableRow key={app.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{app.tier}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={app.action}
                                color={app.action === 'APPROVED' ? 'success' : 'error'}
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>{app.action_by_name || 'System'}</TableCell>
                            <TableCell>{new Date(app.created_at).toLocaleString()}</TableCell>
                            <TableCell>{app.notes || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Sidebar: Vendor Info & Commercial Totals */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Vendor Details
                  </Typography>
                  {po.status === 'DRAFT' && (
                    <Button
                      size="small"
                      startIcon={<EditOutlinedIcon sx={{ fontSize: 13 }} />}
                      onClick={openEditModal}
                      sx={{ fontSize: '0.72rem', textTransform: 'none', color: '#0D9488' }}
                    >
                      Change Vendor
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Vendor Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {po.vendor_name}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Vendor Code</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{po.vendor_code || 'VND-DEFAULT'}</Typography>
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Payment Terms</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB' }}>
                    {po.payment_terms || 'Net 30'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Expected Delivery Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>
                    {po.expected_date}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 1 }}>
                  Commercial Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{Number(po.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Discount</Typography>
                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>
                    -₹{Number(po.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>GST / Tax</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{Number(po.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Freight & Shipping</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{Number(po.freight || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Grand Total
                  </Typography>
                  <Typography variant="h2" sx={{ color: '#14532D', fontWeight: 800, fontSize: '1.45rem' }}>
                    ₹{Number(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <StatusBadge status={po.status} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        /* Alternative Quotes Comparison Tab */
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 1 }}>
              Marketplace Spot Quotes for Material
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
              Compare rates with pre-approved vendors. If the current vendor cannot fulfill the order, you can split or switch vendors immediately.
            </Typography>

            {(!spotQuotes || spotQuotes.length === 0) ? (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                No active competing market quotes found for this item. You can still use "Buy Another Shop" to purchase from any approved vendor.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#FAFAF9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>VENDOR</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>OFFERED RATE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>DELIVERY LEAD TIME</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>ACTION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {spotQuotes.map((q: any) => (
                      <TableRow key={q.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{q.vendor_name}</TableCell>
                        <TableCell>{q.material_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          ₹{Number(q.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">{q.lead_time_days || '3-5'} days</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<StoreOutlinedIcon sx={{ fontSize: 14 }} />}
                            onClick={() => {
                              if (po.items?.[0]) {
                                openSplitModal(po.items[0]);
                                setTargetVendorId(q.vendor);
                                setSplitPrice(Number(q.unit_price));
                              }
                            }}
                            sx={{ borderRadius: '6px', fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
                          >
                            Buy from this Vendor
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
      )}

      {/* Rejection Dialog with Mandatory Reason */}
      <ConfirmationDialog
        open={rejectOpen}
        title="Reject Purchase Order"
        message="Are you sure you want to reject this purchase order? A clear rejection reason must be recorded for audit compliance."
        confirmText="Confirm Rejection"
        confirmColor="error"
        requireReason={true}
        reasonLabel="Mandatory Rejection Reason"
        onConfirm={(reason) => rejectMutation.mutate(reason || '')}
        onCancel={() => setRejectOpen(false)}
        loading={rejectMutation.isPending}
      />

      {/* Submit for Review Confirmation Dialog */}
      <ConfirmationDialog
        open={submitConfirmOpen}
        title="Review & Submit Purchase Order"
        message={`Please verify the purchase order information before submitting for approval:
• Purchase Order: ${po.purchase_number}
• Supplier / Vendor: ${po.vendor_name}
• Total Items: ${po.items?.length || 0}
• Total Quantity: ${(po.items || []).reduce((acc: number, it: any) => acc + Number(it.quantity || 0), 0)} units
• Grand Total: ₹${Number(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}

Are you sure you want to submit this order to Management for Review?`}
        confirmText="Confirm & Submit"
        confirmColor="primary"
        onConfirm={() => {
          setSubmitConfirmOpen(false);
          submitMutation.mutate();
        }}
        onCancel={() => setSubmitConfirmOpen(false)}
        loading={submitMutation.isPending}
      />

      {/* Edit Vendor & Commercial Rates Modal */}
      <Dialog open={editRatesOpen} onClose={() => setEditRatesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#18181B' }}>
          Edit Vendor & Commercial Rates
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#71717A', mb: 2.5 }}>
            Update vendor supplier shop, order quantities (e.g. if supplier has partial stock), agreed unit rates, GST taxes, freight, and payment terms for PO{' '}
            <strong>{po.purchase_number}</strong>.
          </Typography>

          {/* Vendor Edit Dropdown */}
          <Box sx={{ mb: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
              Select Vendor / Supplier Shop:
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                sx={{ bgcolor: '#FFFFFF', borderRadius: '6px', fontWeight: 600 }}
              >
                {vendors.map((v: any) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.vendor_name} ({v.vendor_code || 'VND'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', mb: 2.5 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#FAFAF9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, verticalAlign: 'bottom', pb: 1.2 }}>MATERIAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 135, verticalAlign: 'bottom', pb: 1.2 }}>
                    ORDER QTY
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 125, verticalAlign: 'bottom', pb: 1.2 }}>
                    AGREED RATE (₹)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 105, verticalAlign: 'bottom', pb: 1.2 }}>
                    DISCOUNT (₹)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 105, verticalAlign: 'bottom', pb: 1.2 }}>
                    GST / TAX (₹)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 125, verticalAlign: 'bottom', pb: 1.2 }}>
                    NET TOTAL (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editedItems.map((item, index) => {
                  const qty = Number(item.quantity || 0);
                  const rate = Number(item.unit_price || 0);
                  const disc = Number(item.discount || 0);
                  const tax = Number(item.tax || 0);
                  const lineSubtotal = qty * rate - disc + tax;

                  return (
                    <TableRow key={item.material}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.material_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {item.material_code}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editedItems];
                            updated[index].quantity = Math.max(0, val);
                            setEditedItems(updated);
                          }}
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end" sx={{ mr: -0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.72rem' }}>
                                    {item.unit_code}
                                  </Typography>
                                </InputAdornment>
                              ),
                            },
                            htmlInput: { min: 0.001, step: 'any', style: { textAlign: 'right', fontWeight: 700, paddingRight: 4 } },
                          }}
                          sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editedItems];
                            updated[index].unit_price = Math.max(0, val);
                            setEditedItems(updated);
                          }}
                          slotProps={{
                            htmlInput: { min: 0, step: '0.01', style: { textAlign: 'right', fontWeight: 700 } },
                          }}
                          sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.discount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editedItems];
                            updated[index].discount = Math.max(0, val);
                            setEditedItems(updated);
                          }}
                          slotProps={{
                            htmlInput: { min: 0, step: '0.01', style: { textAlign: 'right' } },
                          }}
                          sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.tax}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editedItems];
                            updated[index].tax = Math.max(0, val);
                            setEditedItems(updated);
                          }}
                          slotProps={{
                            htmlInput: { min: 0, step: '0.01', style: { textAlign: 'right' } },
                          }}
                          sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        ₹{Math.max(0, lineSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ maxWidth: 360 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
              Freight & Logistics Charges (₹)
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={freightVal}
              onChange={(e) => setFreightVal(parseFloat(e.target.value) || 0)}
              slotProps={{
                htmlInput: { min: 0, step: '0.01', style: { fontWeight: 600 } },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
            />
          </Box>

          {/* Pre-Submit Information Check Card */}
          {(() => {
            const hasZeroQty = editedItems.some((it) => Number(it.quantity) <= 0);
            const hasZeroRate = editedItems.some((it) => Number(it.unit_price) <= 0);
            const totalQty = editedItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
            const subtotalVal = editedItems.reduce(
              (acc, it) =>
                acc +
                (Number(it.quantity || 0) * Number(it.unit_price || 0) -
                  Number(it.discount || 0) +
                  Number(it.tax || 0)),
              0
            );
            const grandTotalVal = Math.max(0, subtotalVal + Number(freightVal || 0));

            return (
              <Box
                sx={{
                  mt: 2.5,
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: hasZeroQty || hasZeroRate ? '#FDE68A' : '#BBF7D0',
                  bgcolor: hasZeroQty || hasZeroRate ? '#FFFBEB' : '#F0FDF4',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: hasZeroQty || hasZeroRate ? '#B45309' : '#15803D',
                        display: 'block',
                      }}
                    >
                      Pre-Submit Check & Order Summary
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: hasZeroQty || hasZeroRate ? '#92400E' : '#166534',
                        mt: 0.3,
                      }}
                    >
                      {hasZeroQty
                        ? '⚠️ Quantity check failed: Order Quantity must be greater than 0.'
                        : hasZeroRate
                        ? '⚠️ Rate check required: Agreed Rate is ₹0. Please enter the agreed rate per unit before saving.'
                        : `✓ Verified: ${editedItems.length} item(s) • Total Quantity: ${totalQty} • Materials: ₹${subtotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                      Grand Total (incl. Freight)
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        color: hasZeroQty || hasZeroRate ? '#B45309' : '#14532D',
                      }}
                    >
                      ₹{grandTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditRatesOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              updateRatesMutation.isPending ||
              editedItems.some((it) => Number(it.quantity) <= 0 || Number(it.unit_price) <= 0)
            }
            onClick={() => updateRatesMutation.mutate()}
            sx={{
              borderRadius: '8px',
              bgcolor: '#14532D',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#0B3B1F' },
            }}
          >
            {updateRatesMutation.isPending ? 'Saving...' : 'Save Vendor & Rates'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alternative Shop / Vendor Purchase Modal */}
      <Dialog
        open={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#18181B' }}>
          Purchase from Another Shop / Vendor
        </DialogTitle>
        <DialogContent>
          {splitSuccess ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px' }}>
                <strong>New Purchase Order Created!</strong>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Successfully created <strong>{splitSuccess.new_purchase_number}</strong> with{' '}
                  <strong>{splitSuccess.vendor_name}</strong> for {splitSuccess.quantity} units of{' '}
                  {splitSuccess.material_name}.
                </Typography>
              </Alert>
              <Button
                fullWidth
                variant="contained"
                endIcon={<LaunchRoundedIcon />}
                onClick={() => navigate(`/purchases/${splitSuccess.new_purchase_id}`)}
                sx={{
                  bgcolor: '#14532D',
                  fontWeight: 700,
                  textTransform: 'none',
                  py: 1,
                  borderRadius: '8px',
                  '&:hover': { bgcolor: '#0B3B1F' },
                }}
              >
                Open New Purchase Order ({splitSuccess.new_purchase_number})
              </Button>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
                If <strong>{po.vendor_name}</strong> does not supply or has run out of{' '}
                <strong>{itemToSplit?.material_name}</strong>, select another vendor/shop to create an independent purchase order.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
                  Material to Source:
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  disabled
                  value={`${itemToSplit?.material_name || ''} (${itemToSplit?.material_code || ''})`}
                  sx={{ bgcolor: '#F8FAFC' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
                  Select Alternative Supplier / Shop: *
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={targetVendorId}
                    onChange={(e) => setTargetVendorId(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: '6px' }}
                  >
                    <MenuItem value="" disabled>
                      -- Choose a Vendor / Shop --
                    </MenuItem>
                    {vendors
                      .filter((v: any) => v.id !== po.vendor)
                      .map((v: any) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.vendor_name} ({v.vendor_code || 'VND'})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
                    Quantity to Purchase ({itemToSplit?.unit_code || 'Units'}):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={splitQuantity}
                    onChange={(e) => setSplitQuantity(Math.max(1, Number(e.target.value)))}
                    slotProps={{
                      htmlInput: { min: 1, max: Number(itemToSplit?.quantity || 1) },
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                  />
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                    Max available in this PO: {itemToSplit?.quantity}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.5, display: 'block' }}>
                    Agreed Unit Price (₹, optional):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={splitPrice}
                    onChange={(e) => setSplitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    slotProps={{
                      htmlInput: { min: 0, step: '0.01' },
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSplitModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
            {splitSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!splitSuccess && (
            <Button
              variant="contained"
              disabled={!targetVendorId || splitItemMutation.isPending}
              onClick={() => splitItemMutation.mutate()}
              sx={{
                borderRadius: '8px',
                bgcolor: '#14532D',
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                '&:hover': { bgcolor: '#0B3B1F' },
              }}
            >
              {splitItemMutation.isPending ? 'Creating PO...' : 'Create Purchase Order with This Shop'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Soft Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#991B1B' }}>
          Delete Purchase Order
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
            Are you sure you want to soft-delete Purchase Order <strong>{po.purchase_number}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
            This will remove the purchase order from active listings and archive it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            color="inherit"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Yes, Soft Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
