import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  Tooltip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { apiClient } from '../../api/client';
import {
  StockBalance,
  StockTransaction,
  Material,
  Product,
  ProductionUnit,
  Warehouse,
  InventorySummary,
  InventoryCatalogItem,
} from '../../types';

import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0); // 0: Stock Balances, 1: Double-Entry Ledger
  const [stockView, setStockView] = useState<'CATALOG' | 'LOTS'>('CATALOG');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MATERIAL' | 'PRODUCT'>('ALL');
  const [search, setSearch] = useState('');

  // Old / Opening Stock Modal State
  const [openingOpen, setOpeningOpen] = useState(false);
  const [openingItemType, setOpeningItemType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL');
  const [openingItem, setOpeningItem] = useState('');
  const [openingLocation, setOpeningLocation] = useState('');
  const [openingQty, setOpeningQty] = useState(0);
  const [openingRate, setOpeningRate] = useState(0);
  const [openingDate, setOpeningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [openingReason, setOpeningReason] = useState('Opening stock migration from legacy register');

  // Adjustment Modal State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustMaterial, setAdjustMaterial] = useState('');
  const [adjustLocation, setAdjustLocation] = useState('');
  const [systemQty, setSystemQty] = useState(0);
  const [physicalQty, setPhysicalQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Transfer Modal State
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMaterial, setTransferMaterial] = useState('');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferQty, setTransferQty] = useState(0);

  // 1. Real-time Inventory KPI Summary
  const { data: summary, isLoading: loadingSummary } = useQuery<InventorySummary>({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/balances/summary/');
      return res.data?.data ?? res.data ?? {};
    },
    refetchInterval: 15000,
  });

  // 2. All 24 Catalog Items Stock Health
  const { data: allItems = [], isLoading: loadingAllItems } = useQuery<InventoryCatalogItem[]>({
    queryKey: ['inventory-all-items'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/balances/all_items/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
    refetchInterval: 15000,
  });

  // 3. Location & Batch Specific Stock Balances
  const { data: balances = [], isLoading: loadingBalances } = useQuery<StockBalance[]>({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/balances/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
  });

  // 4. Double-Entry Stock Ledger
  const { data: transactions = [], isLoading: loadingTx } = useQuery<StockTransaction[]>({
    queryKey: ['stock-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/transactions/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
    enabled: activeTab === 1,
  });

  // 5. Materials & Production Units for Modals
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['materials-list'],
    queryFn: async () => {
      const res = await apiClient.get('/materials/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
  });

  const { data: productionUnits = [] } = useQuery<ProductionUnit[]>({
    queryKey: ['production-units'],
    queryFn: async () => {
      const res = await apiClient.get('/production-units/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['warehouses-list'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
  });


  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await apiClient.get('/products/');
      return Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.results || [];
    },
  });

  // Mutations
  const openingStockMutation = useMutation({
    mutationFn: async () => {
      let unitId = '';
      if (openingItemType === 'MATERIAL') {
        const m = materials.find((mat) => mat.id === openingItem);
        unitId = m?.unit || '';
      } else {
        const p = products.find((prod) => prod.id === openingItem);
        unitId = p?.unit || '';
      }

      const res = await apiClient.post('/inventory/opening-stock/', {
        material: openingItemType === 'MATERIAL' ? openingItem : null,
        product: openingItemType === 'PRODUCT' ? openingItem : null,
        unit: unitId,
        location: openingLocation,
        quantity: Number(openingQty),
        rate: Number(openingRate),
        date: openingDate || new Date().toISOString().split('T')[0],
        reason: openingReason || 'Legacy inventory register migration',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      setOpeningOpen(false);
      setOpeningItem('');
      setOpeningQty(0);
      setOpeningRate(0);
      setOpeningReason('Opening stock migration from legacy register');
    },
  });
  const adjustMutation = useMutation({
    mutationFn: async () => {
      const mat = materials.find((m) => m.id === adjustMaterial);
      const res = await apiClient.post('/inventory/adjustments/', {
        material: adjustMaterial,
        unit: mat?.unit,
        location: adjustLocation,
        system_quantity: Number(systemQty),
        physical_quantity: Number(physicalQty),
        reason_type: 'PHYSICAL_COUNT',
        reason: adjustReason || 'Physical inventory reconciliation',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      setAdjustOpen(false);
      setAdjustMaterial('');
      setAdjustLocation('');
      setSystemQty(0);
      setPhysicalQty(0);
      setAdjustReason('');
    },
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const mat = materials.find((m) => m.id === transferMaterial);
      const res = await apiClient.post('/inventory/transfers/', {
        material: transferMaterial,
        unit: mat?.unit,
        from_location: transferFrom,
        to_location: transferTo,
        quantity: Number(transferQty),
        notes: 'Inter-facility inventory transfer',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      setTransferOpen(false);
      setTransferMaterial('');
      setTransferFrom('');
      setTransferTo('');
      setTransferQty(0);
    },
  });

  // Handle quick adjustment button click
  const handleOpenAdjustForItem = (item: InventoryCatalogItem) => {
    setAdjustMaterial(item.id);
    setSystemQty(item.usable_quantity);
    setPhysicalQty(item.usable_quantity);
    if (productionUnits.length > 0) {
      setAdjustLocation(productionUnits[0].id);
    }
    setAdjustOpen(true);
  };

  // Filter Catalog Items
  const filteredCatalogItems = allItems.filter((item) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      item.item_code.toLowerCase().includes(term) ||
      item.item_name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (statusFilter === 'IN_STOCK') return item.status === 'IN_STOCK';
    if (statusFilter === 'LOW_STOCK') return item.status === 'LOW_STOCK';
    if (statusFilter === 'OUT_OF_STOCK') return item.status === 'OUT_OF_STOCK';
    if (statusFilter === 'MATERIAL') return item.item_type === 'MATERIAL';
    if (statusFilter === 'PRODUCT') return item.item_type === 'PRODUCT';
    return true;
  });

  // Filter Specific Lot Balances
  const filteredBalances = balances.filter((b) => {
    const term = search.toLowerCase();
    const name = (b.material_name || b.product_name || '').toLowerCase();
    const code = (b.material_code || b.product_code || '').toLowerCase();
    return !term || name.includes(term) || code.includes(term);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
      <PageHeader
        title="Inventory & Stock Ledger"
        subtitle="100% Real-time stock status, low-stock threshold radar, immutable ledger, and multi-location transfers"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                if (productionUnits.length > 0 && !openingLocation) {
                  setOpeningLocation(productionUnits[0].id);
                }
                setOpeningOpen(true);
              }}
              sx={{
                bgcolor: '#0284C7',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                '&:hover': { bgcolor: '#0369A1' },
              }}
            >
              Enter Old Stock (Opening)
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={() => setTransferOpen(true)}
              sx={{
                borderColor: '#CBD5E1',
                color: '#334155',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              Transfer Stock
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setAdjustOpen(true)}
              sx={{
                bgcolor: '#14532D',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#0B3B1F' },
              }}
            >
              Adjust Physical Stock
            </Button>
          </Box>
        }
      />

      {/* 4 REAL INVENTORY KPI STAT CARDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {/* 1. Total Catalog SKUs */}
        <StatCard
          title="Catalog SKUs In Stock"
          value={`${summary?.in_stock_items ?? 0} / ${summary?.total_catalog_items ?? 24}`}
          subtitle={`${summary?.total_materials ?? 20} Materials | ${summary?.total_products ?? 4} Finished Goods`}
          trend={{
            value: Number(summary?.out_of_stock_items ?? 0) > 0 ? `${summary?.out_of_stock_items} Out of Stock` : 'All Stocked',
            isPositive: Number(summary?.out_of_stock_items ?? 0) === 0,
          }}
          icon={<Inventory2OutlinedIcon fontSize="small" />}
          iconColor="#2563EB"
          iconBg="#EFF6FF"
          borderColor="#BFDBFE"
        />

        {/* 2. Total Usable Stock Units */}
        <StatCard
          title="Available Usable Units"
          value={`${Number(summary?.total_usable_units ?? 0).toLocaleString()} Units`}
          subtitle={`Across ${summary?.active_lots ?? 0} active warehouse lots`}
          trend={{
            value: Number(summary?.total_usable_units ?? 0) > 0 ? 'Stock Available' : 'Zero Inventory',
            isPositive: Number(summary?.total_usable_units ?? 0) > 0,
          }}
          icon={<LayersOutlinedIcon fontSize="small" />}
          iconColor="#059669"
          iconBg="#ECFDF5"
          borderColor="#A7F3D0"
        />

        {/* 3. Low Stock Alert Radar */}
        <StatCard
          title="Low Stock Radar"
          value={`${summary?.low_stock_items ?? 0} SKUs Below Min`}
          subtitle="At or below minimum reorder threshold"
          trend={{
            value: Number(summary?.low_stock_items ?? 0) > 0 ? 'Reorder Needed' : 'Healthy Inventory',
            isPositive: Number(summary?.low_stock_items ?? 0) === 0,
          }}
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
          iconColor="#DC2626"
          iconBg="#FEF2F2"
          borderColor="#FECACA"
          onClick={() => {
            setActiveTab(0);
            setStockView('CATALOG');
            setStatusFilter('LOW_STOCK');
          }}
        />

        {/* 4. Real Stock Asset Valuation */}
        <StatCard
          title="Real Stock Valuation"
          value={`₹${Number(summary?.total_valuation ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Calculated at actual weighted cost price"
          trend={{
            value: 'Real Ledger Asset',
            isPositive: true,
          }}
          icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
          borderColor="#DDD6FE"
        />
      </Box>

      {/* MAIN INVENTORY CARD */}
      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* TABS: STOCK BALANCES VS DOUBLE-ENTRY LEDGER */}
          <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 2.5 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label="Live Stock Inventory" sx={{ fontWeight: 700, fontSize: '0.86rem' }} />
              <Tab label="Immutable Double-Entry Ledger" sx={{ fontWeight: 700, fontSize: '0.86rem' }} />
            </Tabs>
          </Box>

          {activeTab === 0 ? (
            <>
              {/* CONTROLS HEADER: Search + Status Filter Pills + View Switcher */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2.5,
                }}
              >
                {/* Search Bar */}
                <TextField
                  size="small"
                  placeholder="Search SKU code, name, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ width: { xs: '100%', md: 320 } }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearch('')}>
                            <ClearOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                />

                {/* View Toggle: All Catalog vs Specific Warehouse Lots */}
                <ToggleButtonGroup
                  size="small"
                  value={stockView}
                  exclusive
                  onChange={(_, val) => val && setStockView(val)}
                  sx={{ bgcolor: '#F8FAFC' }}
                >
                  <ToggleButton value="CATALOG" sx={{ textTransform: 'none', fontWeight: 600, px: 2, fontSize: '0.8rem' }}>
                    All Catalog Items ({allItems.length})
                  </ToggleButton>
                  <ToggleButton value="LOTS" sx={{ textTransform: 'none', fontWeight: 600, px: 2, fontSize: '0.8rem' }}>
                    Warehouse Lots ({balances.length})
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* FILTER PILLS */}
              {stockView === 'CATALOG' && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                  <Chip
                    label={`All Items (${allItems.length})`}
                    size="small"
                    onClick={() => setStatusFilter('ALL')}
                    variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'ALL' ? '#0F172A' : 'transparent',
                      color: statusFilter === 'ALL' ? '#FFFFFF' : '#475569',
                    }}
                  />
                  <Chip
                    icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 15 }} />}
                    label={`In Stock (${summary?.in_stock_items ?? 0})`}
                    size="small"
                    onClick={() => setStatusFilter('IN_STOCK')}
                    variant={statusFilter === 'IN_STOCK' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'IN_STOCK' ? '#16A34A' : 'transparent',
                      color: statusFilter === 'IN_STOCK' ? '#FFFFFF' : '#166534',
                      borderColor: '#BBF7D0',
                    }}
                  />
                  <Chip
                    icon={<WarningAmberOutlinedIcon sx={{ fontSize: 15 }} />}
                    label={`Low Stock Alert (${summary?.low_stock_items ?? 0})`}
                    size="small"
                    onClick={() => setStatusFilter('LOW_STOCK')}
                    variant={statusFilter === 'LOW_STOCK' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'LOW_STOCK' ? '#DC2626' : 'transparent',
                      color: statusFilter === 'LOW_STOCK' ? '#FFFFFF' : '#991B1B',
                      borderColor: '#FECACA',
                    }}
                  />
                  <Chip
                    label={`Out of Stock (${summary?.out_of_stock_items ?? 0})`}
                    size="small"
                    onClick={() => setStatusFilter('OUT_OF_STOCK')}
                    variant={statusFilter === 'OUT_OF_STOCK' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'OUT_OF_STOCK' ? '#64748B' : 'transparent',
                      color: statusFilter === 'OUT_OF_STOCK' ? '#FFFFFF' : '#475569',
                      borderColor: '#CBD5E1',
                    }}
                  />
                  <Chip
                    label={`Raw Materials (${summary?.total_materials ?? 20})`}
                    size="small"
                    onClick={() => setStatusFilter('MATERIAL')}
                    variant={statusFilter === 'MATERIAL' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'MATERIAL' ? '#2563EB' : 'transparent',
                      color: statusFilter === 'MATERIAL' ? '#FFFFFF' : '#1E40AF',
                      borderColor: '#BFDBFE',
                    }}
                  />
                  <Chip
                    label={`Finished Products (${summary?.total_products ?? 4})`}
                    size="small"
                    onClick={() => setStatusFilter('PRODUCT')}
                    variant={statusFilter === 'PRODUCT' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'PRODUCT' ? '#7C3AED' : 'transparent',
                      color: statusFilter === 'PRODUCT' ? '#FFFFFF' : '#5B21B6',
                      borderColor: '#DDD6FE',
                    }}
                  />
                </Box>
              )}

              {/* VIEW 1: ALL CATALOG ITEMS STOCK HEALTH */}
              {stockView === 'CATALOG' ? (
                loadingAllItems ? (
                  <LoadingState rows={8} />
                ) : filteredCatalogItems.length === 0 ? (
                  <EmptyState
                    title="No matching inventory items found"
                    description="Try adjusting your search query or filter tags."
                  />
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SKU CODE</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ITEM DESCRIPTION</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CATEGORY</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#059669', bgcolor: '#F0FDF4' }}>
                            USABLE STOCK
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                            MIN STOCK
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                            REORDER LEVEL
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                            STATUS
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                            ACTION
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredCatalogItems.map((item) => {
                          const isLow = item.status === 'LOW_STOCK';
                          const isInStock = item.status === 'IN_STOCK';

                          return (
                            <TableRow key={item.id} hover sx={{ bgcolor: isLow ? '#FFFBEB15' : 'inherit' }}>
                              <TableCell sx={{ fontWeight: 700, color: item.item_type === 'PRODUCT' ? '#7C3AED' : '#2563EB' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {item.item_code}
                                  <Chip
                                    label={item.item_type === 'PRODUCT' ? 'Product' : 'Material'}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      bgcolor: item.item_type === 'PRODUCT' ? '#F5F3FF' : '#EFF6FF',
                                      color: item.item_type === 'PRODUCT' ? '#7C3AED' : '#2563EB',
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>
                                {item.item_name}
                              </TableCell>
                              <TableCell sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                                {item.category}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.88rem',
                                  color: isInStock ? '#16A34A' : '#64748B',
                                  bgcolor: isInStock ? '#F0FDF4' : 'inherit',
                                }}
                              >
                                {item.usable_quantity.toLocaleString()} {item.unit_code}
                              </TableCell>
                              <TableCell align="right" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                                {item.minimum_stock > 0 ? `${item.minimum_stock.toLocaleString()} ${item.unit_code}` : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                                {item.reorder_level > 0 ? `${item.reorder_level.toLocaleString()} ${item.unit_code}` : '—'}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={
                                    isInStock
                                      ? 'In Stock'
                                      : isLow
                                      ? 'Low Stock (Reorder)'
                                      : 'Out of Stock'
                                  }
                                  sx={{
                                    height: 22,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    bgcolor: isInStock
                                      ? '#ECFDF5'
                                      : isLow
                                      ? '#FEF2F2'
                                      : '#F1F5F9',
                                    color: isInStock
                                      ? '#059669'
                                      : isLow
                                      ? '#DC2626'
                                      : '#64748B',
                                    border: `1px solid ${
                                      isInStock
                                        ? '#A7F3D0'
                                        : isLow
                                        ? '#FECACA'
                                        : '#E2E8F0'
                                    }`,
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenAdjustForItem(item)}
                                  sx={{
                                    fontSize: '0.72rem',
                                    py: 0.3,
                                    px: 1.2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: '#E2E8F0',
                                    color: '#334155',
                                    '&:hover': { bgcolor: '#F8FAFC' },
                                  }}
                                >
                                  Adjust
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              ) : (
                /* VIEW 2: SPECIFIC WAREHOUSE LOTS */
                loadingBalances ? (
                  <LoadingState rows={6} />
                ) : filteredBalances.length === 0 ? (
                  <EmptyState
                    title="No warehouse lots currently stocked"
                    description="Items will appear here once initial opening stock or material inward receipts are verified."
                  />
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ITEM CODE</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ITEM DESCRIPTION</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>LOCATION / WAREHOUSE</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#059669', bgcolor: '#F0FDF4' }}>
                            USABLE STOCK
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                            RESERVED
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#DC2626', bgcolor: '#FEF2F2' }}>
                            QUARANTINED
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UOM</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>LAST UPDATED</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredBalances.map((b) => (
                          <TableRow key={b.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: '#2563EB' }}>
                              {b.material_code || b.product_code || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>
                              {b.material_name || b.product_name}
                              {b.batch_number && (
                                <Chip
                                  label={`Batch: ${b.batch_number}`}
                                  size="small"
                                  sx={{ ml: 1, height: 18, fontSize: '0.68rem', bgcolor: '#F1F5F9' }}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ color: '#475569' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnOutlinedIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
                                {b.location_name || 'Main Factory / Peenya'}
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#059669', bgcolor: '#F0FDF4' }}>
                              {Number(b.usable_quantity).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#64748B' }}>
                              {Number(b.reserved_quantity).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#DC2626', bgcolor: '#FEF2F2' }}>
                              {Number(b.quarantined_quantity).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ color: '#64748B' }}>{b.unit_code}</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                              {new Date(b.updated_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              )}
            </>
          ) : (
            /* TAB 1: IMMUTABLE DOUBLE-ENTRY LEDGER */
            loadingTx ? (
              <LoadingState rows={8} />
            ) : transactions.length === 0 ? (
              <EmptyState
                title="No stock ledger transactions recorded yet"
                description="Any physical inventory action (Inward receiving, production issue, adjustments, or dispatch) will append immutable audit records here."
              />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>TIMESTAMP</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>TRANSACTION TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ITEM / MATERIAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>QTY DELTA</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>RUNNING BALANCE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SOURCE / DESTINATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>OPERATOR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => {
                      const isIncoming =
                        tx.transaction_type.includes('IN') ||
                        tx.transaction_type.includes('OUTPUT') ||
                        tx.transaction_type.includes('OPENING');

                      return (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ fontSize: '0.76rem', color: '#64748B' }}>
                            {new Date(tx.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tx.transaction_type.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                height: 20,
                                fontWeight: 700,
                                bgcolor: isIncoming ? '#ECFDF5' : '#EFF6FF',
                                color: isIncoming ? '#059669' : '#2563EB',
                                border: `1px solid ${isIncoming ? '#A7F3D0' : '#BFDBFE'}`,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>
                            {tx.material_name || tx.product_name}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: isIncoming ? '#059669' : '#2563EB',
                            }}
                          >
                            {isIncoming ? '+' : '-'}{Number(tx.quantity).toLocaleString()} {tx.unit_code}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {Number(tx.balance_after).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#475569' }}>
                            {tx.to_location_name || tx.from_location_name || tx.reference_type || 'Main Facility'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {tx.created_by_name || 'System Administrator'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: PHYSICAL STOCK ADJUSTMENT */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Physical Stock Reconciliation & Adjustment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Catalog Item / Material"
              required
              value={adjustMaterial}
              onChange={(e) => {
                const id = e.target.value;
                setAdjustMaterial(id);
                const found = allItems.find((it) => it.id === id);
                if (found) {
                  setSystemQty(found.usable_quantity);
                  setPhysicalQty(found.usable_quantity);
                }
              }}
            >
              {allItems.map((it) => (
                <MenuItem key={it.id} value={it.id}>
                  {it.item_code} - {it.item_name} ({it.usable_quantity} {it.unit_code} in stock)
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Warehouse Facility / Production Unit"
              required
              value={adjustLocation}
              onChange={(e) => setAdjustLocation(e.target.value)}
            >
              {productionUnits.map((pu) => (
                <MenuItem key={pu.id} value={pu.id}>
                  {pu.name} ({pu.production_unit_code})
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="System Book Quantity"
                value={systemQty}
                onChange={(e) => setSystemQty(parseFloat(e.target.value) || 0)}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Physical Counted Quantity"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(parseFloat(e.target.value) || 0)}
              />
            </Box>

            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                Stock Adjustment Variance: {physicalQty - systemQty >= 0 ? `+${physicalQty - systemQty}` : physicalQty - systemQty} Units
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Physical stock will be updated and an immutable audit transaction will be appended to the ledger.
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Adjustment Reason / Note"
              placeholder="e.g. Month-end physical stock audit count"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdjustOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!adjustMaterial || !adjustLocation || adjustMutation.isPending}
            onClick={() => adjustMutation.mutate()}
            sx={{ bgcolor: '#14532D', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {adjustMutation.isPending ? 'Saving...' : 'Post Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: INTER-FACILITY STOCK TRANSFER */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Inter-Facility Stock Transfer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Material"
              required
              value={transferMaterial}
              onChange={(e) => setTransferMaterial(e.target.value)}
            >
              {materials.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.material_code} - {m.name}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Origin Facility (From)"
                required
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
              >
                {productionUnits.map((pu) => (
                  <MenuItem key={pu.id} value={pu.id}>
                    {pu.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="Destination Facility (To)"
                required
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              >
                {productionUnits
                  .filter((pu) => pu.id !== transferFrom)
                  .map((pu) => (
                    <MenuItem key={pu.id} value={pu.id}>
                      {pu.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Transfer Quantity"
              required
              value={transferQty}
              onChange={(e) => setTransferQty(parseFloat(e.target.value) || 0)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTransferOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!transferMaterial || !transferFrom || !transferTo || transferQty <= 0 || transferMutation.isPending}
            onClick={() => transferMutation.mutate()}
            sx={{ bgcolor: '#14532D', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {transferMutation.isPending ? 'Transferring...' : 'Execute Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 3: ENTER OLD STOCK (OPENING STOCK MIGRATION) */}
      <Dialog open={openingOpen} onClose={() => setOpeningOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Enter Old / Opening Stock (Legacy Migration)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.84rem' }}>
              Record existing legacy warehouse inventory into the system. This directly credits the usable stock balance and appends an immutable opening transaction to the audit ledger.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="Raw / Packing Material"
                clickable
                color={openingItemType === 'MATERIAL' ? 'primary' : 'default'}
                onClick={() => {
                  setOpeningItemType('MATERIAL');
                  setOpeningItem('');
                }}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Finished Goods Product"
                clickable
                color={openingItemType === 'PRODUCT' ? 'secondary' : 'default'}
                onClick={() => {
                  setOpeningItemType('PRODUCT');
                  setOpeningItem('');
                }}
                sx={{ fontWeight: 700 }}
              />
            </Box>

            <TextField
              select
              fullWidth
              size="small"
              label={openingItemType === 'MATERIAL' ? 'Select Raw Material' : 'Select Finished Product'}
              required
              value={openingItem}
              onChange={(e) => {
                const id = e.target.value;
                setOpeningItem(id);
                if (openingItemType === 'PRODUCT') {
                  const p = products.find((prod) => prod.id === id);
                  if (p && p.cost_price) setOpeningRate(Number(p.cost_price));
                }
              }}
            >
              {openingItemType === 'MATERIAL'
                ? materials.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.material_code} - {m.name} ({m.unit_code || 'UOM'})
                    </MenuItem>
                  ))
                : products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.product_code} - {p.product_name}
                    </MenuItem>
                  ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Warehouse / Storage Facility"
              required
              value={openingLocation}
              onChange={(e) => setOpeningLocation(e.target.value)}
            >
              {warehouses.length > 0 && (
                <MenuItem disabled sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#0D9488' }}>
                  ── WAREHOUSES & GODOWNS ──
                </MenuItem>
              )}
              {warehouses.map((wh) => (
                <MenuItem
                  key={wh.id}
                  value={wh.production_unit || productionUnits[0]?.id || wh.id}
                >
                  {wh.warehouse_code} - {wh.name} ({wh.warehouse_type.replace(/_/g, ' ')})
                </MenuItem>
              ))}
              {productionUnits.length > 0 && (
                <MenuItem disabled sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#4F46E5' }}>
                  ── PRODUCTION PLANTS ──
                </MenuItem>
              )}
              {productionUnits.map((pu) => (
                <MenuItem key={pu.id} value={pu.id}>
                  {pu.production_unit_code} - {pu.name}
                </MenuItem>
              ))}
            </TextField>


            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Opening Quantity"
                required
                value={openingQty}
                onChange={(e) => setOpeningQty(parseFloat(e.target.value) || 0)}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Unit Cost / Rate (₹)"
                required
                value={openingRate}
                onChange={(e) => setOpeningRate(parseFloat(e.target.value) || 0)}
              />
            </Box>

            <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>
                Total Opening Stock Asset Valuation: ₹{(openingQty * openingRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              type="date"
              label="Stock Verification Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              label="Legacy Register Reference / Notes"
              placeholder="e.g. Physical inventory count verified by Store Manager"
              value={openingReason}
              onChange={(e) => setOpeningReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpeningOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!openingItem || !openingLocation || openingQty <= 0 || openingStockMutation.isPending}
            onClick={() => openingStockMutation.mutate()}
            sx={{ bgcolor: '#0284C7', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0369A1' } }}
          >
            {openingStockMutation.isPending ? 'Posting...' : 'Post Opening Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
