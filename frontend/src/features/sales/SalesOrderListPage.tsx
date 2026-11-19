import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Typography,
  Alert,
  Tooltip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { apiClient } from '../../api/client';
import { SalesOrder } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const SalesOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Switch tab based on location (e.g. /sales/returns)
  const isReturnsRoute = location.pathname.includes('/returns');
  const [activeTab, setActiveTab] = useState(isReturnsRoute ? 1 : 0);

  useEffect(() => {
    if (location.pathname.includes('/returns')) {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [location.pathname]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. Fetch Sales Orders
  const {
    data: ordersData,
    isLoading: loadingOrders,
    isError: isOrdersError,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['sales-orders', search, statusFilter],
    queryFn: async () => {
      let url = '/sales/orders/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  // 2. Fetch Sales Returns
  const {
    data: returnsData,
    isLoading: loadingReturns,
    isError: isReturnsError,
    refetch: refetchReturns,
  } = useQuery({
    queryKey: ['sales-returns', search],
    queryFn: async () => {
      let url = '/sales/returns/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await apiClient.get(url);
      return res.data;
    },
    enabled: activeTab === 1,
  });

  const orders: SalesOrder[] = Array.isArray(ordersData?.data)
    ? ordersData.data
    : ordersData?.data?.results || [];

  const returns: any[] = Array.isArray(returnsData?.data)
    ? returnsData.data
    : returnsData?.data?.results || [];

  // Metrics computation
  const totalRevenue = orders.reduce((sum, so) => sum + Number(so.grand_total || 0), 0);
  const deliveredCount = orders.filter((so) => ['DELIVERED', 'COMPLETED', 'DISPATCHED'].includes(so.status)).length;
  const pendingCount = orders.filter((so) => ['DRAFT', 'CONFIRMED', 'PAYMENT_PENDING'].includes(so.status)).length;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearch('');
    setStatusFilter('');
    if (newValue === 1) {
      navigate('/sales/returns');
    } else {
      navigate('/sales');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Sales Orders & Distribution"
        subtitle="Manage wholesale dealer orders, dispatches, payments, invoices, and product returns"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => (activeTab === 0 ? refetchOrders() : refetchReturns())}
              sx={{ borderColor: '#E2E8F0', color: '#475569' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="medium"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/orders/new')}
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
            >
              Create Sales Order
            </Button>
          </Box>
        }
      />

      {/* Metric Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                TOTAL ORDERS
              </Typography>
              <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#F0FDF4', color: '#16A34A' }}>
                <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
              {orders.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
              Active sales catalog
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                FULFILLED / DISPATCHED
              </Typography>
              <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#EFF6FF', color: '#2563EB' }}>
                <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
              {deliveredCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Completed deliveries
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                PENDING FULFILLMENT
              </Typography>
              <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#FFFBEB', color: '#D97706' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
              {pendingCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Requires action or dispatch
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                GROSS REVENUE
              </Typography>
              <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#F0FDFA', color: '#0D9488' }}>
                <CurrencyRupeeIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 600 }}>
              Across all dealer orders
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#FAFAFA' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 1.5,
              },
            }}
          >
            <Tab
              icon={<ReceiptLongOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Sales Orders</span>
                  <Chip label={orders.length} size="small" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }} />
                </Box>
              }
            />
            <Tab
              icon={<AssignmentReturnOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Sales Returns & Replacements</span>
                  <Chip label={returns.length} size="small" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }} />
                </Box>
              }
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          {/* Error Banner */}
          {((activeTab === 0 && isOrdersError) || (activeTab === 1 && isReturnsError)) && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => (activeTab === 0 ? refetchOrders() : refetchReturns())}>
                  Retry
                </Button>
              }
              sx={{ mb: 2.5, borderRadius: '8px' }}
            >
              Failed to load sales data from server. Please check your connection and retry.
            </Alert>
          )}

          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder={activeTab === 0 ? "Search order number, customer, notes..." : "Search return number or customer..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 280 }}
            />

            {activeTab === 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {['', 'DRAFT', 'CONFIRMED', 'PAYMENT_RECEIVED', 'DISPATCHED', 'COMPLETED'].map((st) => (
                  <Chip
                    key={st}
                    label={st ? st.replace(/_/g, ' ') : 'All Statuses'}
                    size="small"
                    clickable
                    onClick={() => setStatusFilter(st)}
                    color={statusFilter === st ? 'primary' : 'default'}
                    variant={statusFilter === st ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* TAB 0: SALES ORDERS */}
          {activeTab === 0 && (
            <>
              {loadingOrders ? (
                <LoadingState rows={6} />
              ) : orders.length === 0 ? (
                <EmptyState
                  title="No sales orders found"
                  description="Create a sales order for wholesale dealers, retail partners, or distributors."
                  actionText="Create Sales Order"
                  onAction={() => navigate('/sales/orders/new')}
                />
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>ORDER NUMBER</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>CUSTOMER / DEALER</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>ORDER DATE</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>DELIVERY EXPECTED</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>PAYMENT TERMS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>GRAND TOTAL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>PAID AMOUNT</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>STATUS</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>ACTION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((so) => {
                        const grandTotal = Number(so.grand_total || 0);
                        const paidAmount = Number(so.paid_amount || 0);
                        const isFullyPaid = paidAmount >= grandTotal && grandTotal > 0;

                        return (
                          <TableRow
                            key={so.id}
                            hover
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}
                            onClick={() => navigate(`/sales/orders/${so.id}`)}
                          >
                            <TableCell sx={{ fontWeight: 700, color: '#16A34A' }}>
                              {so.sales_order_number}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                              {so.customer_name || 'N/A'}
                            </TableCell>
                            <TableCell>{so.order_date || 'N/A'}</TableCell>
                            <TableCell>{so.delivery_date || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                label={so.payment_type ? so.payment_type.replace(/_/g, ' ') : 'CREDIT'}
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 22, bgcolor: '#F1F5F9', color: '#334155' }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                              ₹{grandTotal.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: isFullyPaid ? '#059669' : '#D97706' }}>
                              ₹{paidAmount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={so.status} />
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Tooltip title="View Order Details">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/sales/orders/${so.id}`)}
                                  sx={{ color: '#16A34A', '&:hover': { bgcolor: '#F0FDF4' } }}
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* TAB 1: SALES RETURNS */}
          {activeTab === 1 && (
            <>
              {loadingReturns ? (
                <LoadingState rows={6} />
              ) : returns.length === 0 ? (
                <EmptyState
                  title="No sales returns recorded"
                  description="When dealers return damaged or unsold products, return receipts are managed here."
                  icon={<AssignmentReturnOutlinedIcon sx={{ fontSize: 52, color: '#94A3B8' }} />}
                />
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>RETURN NO.</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>SALES ORDER</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>CUSTOMER / DEALER</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>PRODUCT</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>QTY</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>REFUND AMOUNT</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>REASON</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>STATUS</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>RETURN DATE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {returns.map((ret: any) => (
                        <TableRow key={ret.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ fontWeight: 700, color: '#EA580C' }}>
                            {ret.return_number}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>
                            {ret.sales_order_number || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{ret.customer_name || 'N/A'}</TableCell>
                          <TableCell>{ret.product_name || 'N/A'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{ret.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            ₹{Number(ret.total || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Chip label={ret.reason ? ret.reason.replace(/_/g, ' ') : 'N/A'} size="small" sx={{ fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={ret.status} />
                          </TableCell>
                          <TableCell>{ret.return_date || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
