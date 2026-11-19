import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Menu,
  MenuItem,
  Chip,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { apiClient } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/metrics/');
      return res.data?.data ?? res.data ?? {};
    },
    refetchInterval: 15000,
  });

  if (isLoading || !data) {
    return (
      <Box sx={{ py: 2, width: '100%' }}>
        <LoadingState variant="cards" />
        <LoadingState variant="table" rows={6} />
      </Box>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const userName = user?.first_name || 'Admin';

  // 100% Real 6-Month Trend Data from API
  const revenueTrendData = (charts?.revenue_trend || []).map((m: any) => ({
    month: m.month,
    sales: Number(m.sales || 0),
    purchases: Number(m.purchases || 0),
  }));

  const hasTrendData = revenueTrendData.some((m: any) => m.sales > 0 || m.purchases > 0);

  // 100% Real Top Finished Products Data from API
  const productData = (charts?.top_products || []).map((p: any, i: number) => ({
    product_name: p.product_name,
    total_qty: Number(p.total_qty || 0),
    total_revenue: Number(p.total_revenue || 0),
    color: p.color || '#7C3AED',
  }));

  // Real recent activities from AuditLog
  const recentActivities = charts?.recent_activities || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', boxSizing: 'border-box' }}>
      {/* HEADER SECTION */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          width: '100%',
        }}
      >
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.8rem' },
              fontWeight: 800,
              color: '#18181B',
              letterSpacing: '-0.025em',
            }}
          >
            {greeting}, {userName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717A', mt: 0.2 }}>
            Real-time live operational metrics across MDP Aroma factory units.
          </Typography>
        </Box>

        {/* Quick Action Buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReceiptLongOutlinedIcon sx={{ color: '#059669', fontSize: 18 }} />}
            onClick={() => navigate('/sales/orders/new')}
            sx={{
              color: '#065F46',
              borderColor: '#A7F3D0',
              bgcolor: '#ECFDF5',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              px: 1.5,
              '&:hover': { bgcolor: '#D1FAE5', borderColor: '#059669' },
            }}
          >
            + Sales Order
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ShoppingBagOutlinedIcon sx={{ color: '#D97706', fontSize: 18 }} />}
            onClick={() => navigate('/purchases/new')}
            sx={{
              color: '#92400E',
              borderColor: '#FDE68A',
              bgcolor: '#FFFBEB',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              px: 1.5,
              '&:hover': { bgcolor: '#FEF3C7', borderColor: '#D97706' },
            }}
          >
            + Purchase Order
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              backgroundColor: '#14532D',
              color: '#FFFFFF',
              borderRadius: '8px',
              px: 1.8,
              py: 0.75,
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(20, 83, 45, 0.25)',
              '&:hover': { backgroundColor: '#0B3B1F' },
            }}
          >
            New Transaction
          </Button>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 220,
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E4E4E7',
                  mt: 0.5,
                  p: 0.5,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate('/purchases/new');
              }}
              sx={{ fontSize: '0.84rem', py: 0.9, gap: 1.2 }}
            >
              <ShoppingBagOutlinedIcon fontSize="small" sx={{ color: '#D97706' }} />
              Create Purchase Order
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate('/production');
              }}
              sx={{ fontSize: '0.84rem', py: 0.9, gap: 1.2 }}
            >
              <PrecisionManufacturingOutlinedIcon fontSize="small" sx={{ color: '#7C3AED' }} />
              Start Production Batch
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate('/sales/orders/new');
              }}
              sx={{ fontSize: '0.84rem', py: 0.9, gap: 1.2 }}
            >
              <ReceiptLongOutlinedIcon fontSize="small" sx={{ color: '#059669' }} />
              Create Sales Order
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate('/inward');
              }}
              sx={{ fontSize: '0.84rem', py: 0.9, gap: 1.2 }}
            >
              <MoveToInboxOutlinedIcon fontSize="small" sx={{ color: '#0D9488' }} />
              Material Gate Inward
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* REAL-TIME FACTORY & LEDGER STATUS RIBBON */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          flexWrap: 'wrap',
          p: 1.2,
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E4E4E7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Chip
          icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16A34A', boxShadow: '0 0 6px #16A34A' }} />}
          label={`Master Catalogs: ${kpis.total_materials ?? 0} Materials | ${kpis.total_products ?? 0} Products Active`}
          size="small"
          sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '0.74rem', border: '1px solid #BBF7D0' }}
        />
        <Chip
          icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0284C7' }} />}
          label={`Suppliers & Clients: ${kpis.total_vendors ?? 0} Vendors | ${kpis.total_customers ?? 0} Customers`}
          size="small"
          sx={{ bgcolor: '#F0F9FF', color: '#075985', fontWeight: 600, fontSize: '0.74rem', border: '1px solid #BAE6FD' }}
        />
        <Chip
          icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D97706' }} />}
          label={`Inward Gate: ${kpis.pending_inward ?? 0} Pending Verification`}
          size="small"
          sx={{ bgcolor: '#FFFBEB', color: '#92400E', fontWeight: 600, fontSize: '0.74rem', border: '1px solid #FDE68A' }}
        />
        <Chip
          icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />}
          label={`Production: ${kpis.active_production_orders ?? 0} Active Batch Orders`}
          size="small"
          sx={{ bgcolor: '#F5F3FF', color: '#5B21B6', fontWeight: 600, fontSize: '0.74rem', border: '1px solid #DDD6FE' }}
        />
      </Box>

      {/* 4 REAL KPI STAT CARDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          width: '100%',
        }}
      >
        {/* 1. Today's Sales - Cash / Revenue */}
        <StatCard
          title="Today's Sales"
          value={`₹${Number(kpis.sales_today ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`Month: ₹${Number(kpis.sales_month ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          trend={{
            value: Number(kpis.sales_today ?? 0) > 0 ? 'Active Sales' : 'No Sales Today',
            isPositive: Number(kpis.sales_today ?? 0) > 0,
          }}
          icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
          iconColor="#059669"
          iconBg="#ECFDF5"
          borderColor="#A7F3D0"
          onClick={() => navigate('/sales')}
        />

        {/* 2. Pending Purchases - Procurement */}
        <StatCard
          title="Pending Purchases"
          value={Number(kpis.pending_purchases ?? 0)}
          subtitle={`${kpis.pending_approvals ?? 0} requiring sign-off`}
          trend={{
            value: Number(kpis.pending_approvals ?? 0) > 0 ? `${kpis.pending_approvals} Need Approval` : 'All Approved',
            isPositive: Number(kpis.pending_approvals ?? 0) === 0,
          }}
          icon={<ShoppingBagOutlinedIcon fontSize="small" />}
          iconColor="#D97706"
          iconBg="#FFFBEB"
          borderColor="#FDE68A"
          onClick={() => navigate('/purchases')}
        />

        {/* 3. Production - Manufacturing Output */}
        <StatCard
          title="Production Output"
          value={`${Number(kpis.production_today_units ?? 0).toLocaleString()} Units`}
          subtitle={`${kpis.active_production_orders ?? 0} active batch orders`}
          trend={{
            value: Number(kpis.active_production_orders ?? 0) > 0 ? `${kpis.active_production_orders} Batches Active` : 'Shopfloor Ready',
            isPositive: true,
          }}
          icon={<PrecisionManufacturingOutlinedIcon fontSize="small" />}
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
          borderColor="#DDD6FE"
          onClick={() => navigate('/production')}
        />

        {/* 4. Low Stock - Inventory Alert */}
        <StatCard
          title="Low Stock Radar"
          value={`${kpis.low_stock_count ?? 0} Materials`}
          subtitle="At or below reorder level"
          trend={{
            value: Number(kpis.low_stock_count ?? 0) > 0 ? 'Reorder Needed' : 'Inventory Healthy',
            isPositive: Number(kpis.low_stock_count ?? 0) === 0,
          }}
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
          iconColor="#DC2626"
          iconBg="#FEF2F2"
          borderColor="#FECACA"
          onClick={() => navigate('/inventory')}
        />
      </Box>

      {/* FULL-WIDTH RESPONSIVE ANALYTICS SECTION */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '7.5fr 4.5fr' },
          gap: 2.5,
          width: '100%',
        }}
      >
        {/* Left Column: Visual Charts */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          {/* Revenue vs Purchases Trajectory Dual Area Chart */}
          <Card sx={{ border: '1px solid #E4E4E7', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.8 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181B' }}>
                    Revenue & Procurement Performance
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717A' }}>
                    {hasTrendData
                      ? 'Live wholesale customer sales vs vendor procurement dispatches'
                      : 'Live ledger data: No transactions recorded in this 6-month cycle yet'}
                  </Typography>
                </Box>
                <Chip
                  label="6-Month Trend"
                  size="small"
                  sx={{ bgcolor: '#F0FDF4', color: '#14532D', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #BBF7D0' }}
                />
              </Box>

              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTrendData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#A1A1AA"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#E4E4E7' }}
                    />
                    <YAxis
                      stroke="#A1A1AA"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E4E4E7',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        fontSize: '0.82rem',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`]}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      name="Sales Revenue (₹)"
                      dataKey="sales"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                    />
                    <Area
                      type="monotone"
                      name="Purchases (₹)"
                      dataKey="purchases"
                      stroke="#D97706"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#purchaseGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Production Output by Product Bar Chart */}
          <Card sx={{ border: '1px solid #E4E4E7', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.8 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181B' }}>
                    Top Finished Products by Sales Volume
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717A' }}>
                    Wholesale customer order volumes across product catalog
                  </Typography>
                </Box>
                <Chip
                  label="Sales Volume"
                  size="small"
                  sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #DDD6FE' }}
                />
              </Box>

              {productData.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
                  <Inventory2OutlinedIcon sx={{ fontSize: 36, mb: 1, color: '#CBD5E1' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                    No sales dispatch volume recorded yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Create sales orders to track and visualize finished product volumes here.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productData}
                      margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                      <XAxis
                        dataKey="product_name"
                        stroke="#A1A1AA"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E4E4E7' }}
                        tickFormatter={(v) => (v.length > 14 ? `${v.substring(0, 13)}...` : v)}
                      />
                      <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E4E4E7',
                          fontSize: '0.82rem',
                        }}
                        formatter={(val: any) => [`${val} Units`, 'Volume Sold']}
                      />
                      <Bar dataKey="total_qty" name="Units Sold" radius={[6, 6, 0, 0]}>
                        {productData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Column: Pending Actions & Real Live Activity Log */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          {/* Pending Actions */}
          <Card sx={{ border: '1px solid #E4E4E7', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181B' }}>
                  Pending Actions
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717A' }}>
                  Immediate review
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {[
                  {
                    label: 'Purchase Approvals Required',
                    count: kpis.pending_approvals ?? 0,
                    link: '/purchases',
                    icon: <ShoppingBagOutlinedIcon fontSize="small" />,
                    color: '#D97706',
                    bg: '#FFFBEB',
                  },
                  {
                    label: 'Gate Inward Verification',
                    count: kpis.pending_inward ?? 0,
                    link: '/inward',
                    icon: <FactCheckOutlinedIcon fontSize="small" />,
                    color: '#0D9488',
                    bg: '#CCFBF1',
                  },
                  {
                    label: 'Low Stock Reorder Alerts',
                    count: kpis.low_stock_count ?? 0,
                    link: '/inventory',
                    icon: <WarningAmberOutlinedIcon fontSize="small" />,
                    color: '#DC2626',
                    bg: '#FEF2F2',
                  },
                  {
                    label: 'Pending Shipments in Transit',
                    count: kpis.in_transit_shipments ?? 0,
                    link: '/shipping',
                    icon: <LocalShippingOutlinedIcon fontSize="small" />,
                    color: '#0284C7',
                    bg: '#E0F2FE',
                  },
                  {
                    label: 'Active Production Batches',
                    count: kpis.active_production_orders ?? 0,
                    link: '/production',
                    icon: <PrecisionManufacturingOutlinedIcon fontSize="small" />,
                    color: '#7C3AED',
                    bg: '#F5F3FF',
                  },
                ].map((action, i) => (
                  <Paper
                    key={i}
                    onClick={() => navigate(action.link)}
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.3,
                      borderRadius: '8px',
                      border: '1px solid #F4F4F5',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor: action.bg,
                        borderColor: action.color,
                        transform: 'translateX(3px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '8px',
                          backgroundColor: action.bg,
                          color: action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${action.color}30`,
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B', fontSize: '0.84rem' }}>
                        {action.label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box
                        sx={{
                          px: 1.1,
                          py: 0.3,
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E4E4E7',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          color: action.color,
                        }}
                      >
                        {action.count}
                      </Box>
                      <ArrowForwardRoundedIcon sx={{ fontSize: 15, color: '#A1A1AA' }} />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Real Live Activity Log from AuditLog */}
          <Card sx={{ border: '1px solid #E4E4E7', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181B' }}>
                  Live System Activity
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/audit-logs')}
                  sx={{ fontSize: '0.74rem', textTransform: 'none', color: '#14532D', fontWeight: 600 }}
                >
                  View Audit Logs
                </Button>
              </Box>

              {recentActivities.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                    No recent activities recorded.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                  {recentActivities.map((item: any, idx: number) => {
                    const isCreate = item.action === 'CREATE';
                    const isUpdate = item.action === 'UPDATE';
                    const isLogin = item.action === 'LOGIN';
                    const color = isCreate ? '#059669' : isUpdate ? '#0D9488' : isLogin ? '#2563EB' : '#D97706';

                    return (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.4 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: '#71717A',
                            minWidth: 64,
                            pt: 0.15,
                            fontSize: '0.74rem',
                          }}
                        >
                          {item.time}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                          <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
                            {isCreate ? (
                              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                            ) : isLogin ? (
                              <StorageOutlinedIcon sx={{ fontSize: 17 }} />
                            ) : (
                              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 17 }} />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#27272A',
                              fontSize: '0.82rem',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.text}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
