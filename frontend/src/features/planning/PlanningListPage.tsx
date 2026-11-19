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
  TableSortLabel,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { generatePlanningPdf } from '../../utils/generatePlanningPdf';
import { PlanDetailModal } from './PlanDetailModal';

export const PlanningListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Server-side filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Server-side column sorting states
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Action states
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);

  // Column sort click handler
  const handleRequestSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const orderingParam = `${sortOrder === 'desc' ? '-' : ''}${sortField}`;

  // Server-side queried plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans', search, statusFilter, sortField, sortOrder, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      params.append('ordering', orderingParam);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const qs = params.toString();
      const res = await apiClient.get(`/planning/${qs ? `?${qs}` : ''}`);
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  // Direct 1-Click Move to Purchase
  const convertMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/planning/${id}/create-purchase/`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      const purchaseId = data.data.data.purchase_id;
      // Immediately navigate to the newly created Purchase Order where prices & terms are set!
      navigate(`/purchases/${purchaseId}`);
    },
  });

  // Plan Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/planning/${id}/`),
    onSuccess: () => {
      setPlanToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  // Export all filtered plans to Excel (CSV)
  const handleExportAllToExcel = () => {
    const headers = [
      'Plan Number',
      'Vendor',
      'Planning Date',
      'Required Date',
      'Total Items',
      'Items Detail',
      'Status',
    ];
    const rows = plans.map((p: any) => [
      `"${p.planning_number}"`,
      `"${p.vendor_name || 'Open Spot'}"`,
      p.planning_date,
      p.required_date,
      p.items?.length || 0,
      `"${(p.items || []).map((it: any) => `${it.material_name} (${it.quantity} ${it.unit_code})`).join('; ')}"`,
      `"${p.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['MDP AROMA - MATERIAL PROCUREMENT PLANNING REPORT']
        .concat([''])
        .concat([headers.join(',')])
        .concat(rows.map((e: any[]) => e.join(',')))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Planning_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export individual plan to CSV
  const handleExportSinglePlan = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = ['Line #', 'Material Code', 'Material Name', 'Quantity', 'Unit'];
    const rows = (p.items || []).map((it: any, index: number) => [
      index + 1,
      `"${it.material_code || ''}"`,
      `"${it.material_name || ''}"`,
      it.quantity,
      `"${it.unit_code || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [`MDP AROMA MATERIAL REQUISITION: ${p.planning_number}`]
        .concat([`Vendor: ${p.vendor_name || 'Open Spot'}`, `Required By: ${p.required_date}`, ''])
        .concat([headers.join(',')])
        .concat(rows.map((e: any[]) => e.join(',')))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${p.planning_number}_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSortField('planning_date');
    setSortOrder('desc');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    search || statusFilter || startDate || endDate || sortField !== 'planning_date' || sortOrder !== 'desc'
  );

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Procurement Material Planning"
        subtitle="Forecast raw material requirements without pricing. Once confirmed, plans move directly to the Purchase list where commercial pricing is managed."
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExportAllToExcel}
              disabled={plans.length === 0}
              sx={{
                borderRadius: '8px',
                color: '#0D9488',
                borderColor: '#99F6E4',
                fontWeight: 700,
                fontSize: '0.82rem',
                textTransform: 'none',
                '&:hover': { bgcolor: '#F0FDFA', borderColor: '#0D9488' },
              }}
            >
              Export to Excel (CSV)
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/planning/new')}
              sx={{
                borderRadius: '8px',
                backgroundColor: '#14532D',
                fontWeight: 700,
                fontSize: '0.82rem',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(20, 83, 45, 0.25)',
                '&:hover': { backgroundColor: '#0B3B1F' },
              }}
            >
              Create Material Plan
            </Button>
          </Box>
        }
      />

      <Card sx={{ borderRadius: '12px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Top Row: Server Search & Date Range & Sorting Dropdown */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input with Clear Button */}
            <TextField
              size="small"
              placeholder="Search plan #, vendor, material name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.5 }}>
                        <CloseRoundedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ minWidth: { xs: '100%', sm: 260 }, flex: { sm: 1 } }}
            />

            {/* Date Range Filter: Clean inline pill without overlapping text */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: '4px 10px',
                bgcolor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#475569' }}>
                <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: '#64748B' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
                  Dates:
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>
                  From
                </Typography>
                <TextField
                  size="small"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{
                    width: 135,
                    '& .MuiInputBase-root': {
                      height: 32,
                      fontSize: '0.78rem',
                      bgcolor: '#FFFFFF',
                      borderRadius: '6px',
                    },
                    '& input': { p: '4px 6px' },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>
                  To
                </Typography>
                <TextField
                  size="small"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{
                    width: 135,
                    '& .MuiInputBase-root': {
                      height: 32,
                      fontSize: '0.78rem',
                      bgcolor: '#FFFFFF',
                      borderRadius: '6px',
                    },
                    '& input': { p: '4px 6px' },
                  }}
                />
              </Box>

              {(startDate || endDate) && (
                <Tooltip title="Clear Date Range" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    sx={{ p: 0.25 }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Quick Sort Dropdown (synced with column headers) */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="sort-select-label" sx={{ fontSize: '0.82rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SortRoundedIcon sx={{ fontSize: 16 }} />
                  <span>Sort By</span>
                </Box>
              </InputLabel>
              <Select
                labelId="sort-select-label"
                label="Sort By Planning"
                value={orderingParam}
                onChange={(e) => {
                  const val = e.target.value as string;
                  if (val.startsWith('-')) {
                    setSortOrder('desc');
                    setSortField(val.substring(1));
                  } else {
                    setSortOrder('asc');
                    setSortField(val);
                  }
                }}
                sx={{ fontSize: '0.82rem', borderRadius: '8px' }}
              >
                <MenuItem value="-created_at">Latest Created (Newest First)</MenuItem>
                <MenuItem value="-planning_date">Planning Date (Newest First)</MenuItem>
                <MenuItem value="planning_date">Planning Date (Oldest First)</MenuItem>
                <MenuItem value="required_date">Required Date (Earliest First)</MenuItem>
                <MenuItem value="-required_date">Required Date (Latest First)</MenuItem>
                <MenuItem value="planning_number">Plan Number (A to Z)</MenuItem>
                <MenuItem value="-planning_number">Plan Number (Z to A)</MenuItem>
                <MenuItem value="vendor__vendor_name">Vendor Name (A to Z)</MenuItem>
                <MenuItem value="-vendor__vendor_name">Vendor Name (Z to A)</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<FilterAltOffOutlinedIcon />}
                onClick={handleResetFilters}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  color: '#64748B',
                  borderColor: '#CBD5E1',
                }}
              >
                Reset
              </Button>
            )}
          </Box>

          {/* Bottom Row: Status Filter Chips */}
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 0.5 }}>
              STATUS:
            </Typography>
            {[
              { label: 'All Plans', value: '' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Submitted', value: 'SUBMITTED' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Moved to Purchase', value: 'PURCHASE_CREATED' },
            ].map((st) => (
              <Chip
                key={st.value}
                label={st.label}
                size="small"
                clickable
                onClick={() => setStatusFilter(st.value)}
                color={statusFilter === st.value ? 'primary' : 'default'}
                variant={statusFilter === st.value ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  bgcolor: statusFilter === st.value ? '#14532D !important' : 'transparent',
                  color: statusFilter === st.value ? '#FFFFFF !important' : '#334155',
                }}
              />
            ))}

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                Showing {plans.length} plan{plans.length === 1 ? '' : 's'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Sorted by: {sortField.replace('vendor__vendor_name', 'vendor').replace(/_/g, ' ')} ({sortOrder})
              </Typography>
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ mt: 3 }}>
              <LoadingState rows={5} />
            </Box>
          ) : plans.length === 0 ? (
            <Box sx={{ mt: 2 }}>
              <EmptyState
                title="No procurement plans match the criteria"
                description={
                  hasActiveFilters
                    ? 'No plans matched your status, search, or date range filters. Try resetting the filters.'
                    : 'Forecast raw materials based on sales demand and production schedules. Items move to the Purchase list upon confirmation.'
                }
                actionText={hasActiveFilters ? 'Reset All Filters' : 'Create Material Plan'}
                onAction={hasActiveFilters ? handleResetFilters : () => navigate('/planning/new')}
              />
            </Box>
          ) : (
            <TableContainer sx={{ border: '1px solid #F4F4F5', borderRadius: '8px', mt: 2.5 }}>
              <Table size="medium">
                <TableHead sx={{ backgroundColor: '#FAFAF9' }}>
                  <TableRow>
                    {/* PLAN NUMBER - Sortable */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                      <TableSortLabel
                        active={sortField === 'planning_number'}
                        direction={sortField === 'planning_number' ? sortOrder : 'asc'}
                        onClick={() => handleRequestSort('planning_number')}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: '#52525B',
                          '&.Mui-active': { color: '#14532D' },
                          '& .MuiTableSortLabel-icon': { color: '#14532D !important' },
                        }}
                      >
                        PLAN NUMBER
                      </TableSortLabel>
                    </TableCell>

                    {/* PREFERRED VENDOR - Sortable */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                      <TableSortLabel
                        active={sortField === 'vendor__vendor_name'}
                        direction={sortField === 'vendor__vendor_name' ? sortOrder : 'asc'}
                        onClick={() => handleRequestSort('vendor__vendor_name')}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: '#52525B',
                          '&.Mui-active': { color: '#14532D' },
                          '& .MuiTableSortLabel-icon': { color: '#14532D !important' },
                        }}
                      >
                        PREFERRED VENDOR
                      </TableSortLabel>
                    </TableCell>

                    {/* PLANNING DATE - Sortable */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                      <TableSortLabel
                        active={sortField === 'planning_date'}
                        direction={sortField === 'planning_date' ? sortOrder : 'desc'}
                        onClick={() => handleRequestSort('planning_date')}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: '#52525B',
                          '&.Mui-active': { color: '#14532D' },
                          '& .MuiTableSortLabel-icon': { color: '#14532D !important' },
                        }}
                      >
                        PLANNING DATE
                      </TableSortLabel>
                    </TableCell>

                    {/* REQUIRED BY - Sortable */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                      <TableSortLabel
                        active={sortField === 'required_date'}
                        direction={sortField === 'required_date' ? sortOrder : 'asc'}
                        onClick={() => handleRequestSort('required_date')}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: '#52525B',
                          '&.Mui-active': { color: '#14532D' },
                          '& .MuiTableSortLabel-icon': { color: '#14532D !important' },
                        }}
                      >
                        REQUIRED BY
                      </TableSortLabel>
                    </TableCell>

                    {/* PLANNED MATERIALS */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                      PLANNED MATERIALS (QTY & UNIT)
                    </TableCell>

                    {/* STATUS - Sortable */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                      <TableSortLabel
                        active={sortField === 'status'}
                        direction={sortField === 'status' ? sortOrder : 'asc'}
                        onClick={() => handleRequestSort('status')}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: '#52525B',
                          '&.Mui-active': { color: '#14532D' },
                          '& .MuiTableSortLabel-icon': { color: '#14532D !important' },
                        }}
                      >
                        STATUS
                      </TableSortLabel>
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B', width: 170 }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.map((p: any) => {
                    const isPurchased = p.status === 'PURCHASE_CREATED';

                    return (
                      <TableRow
                        key={p.id}
                        hover
                        onClick={() => setSelectedPlan(p)}
                        sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                      >
                        {/* Plan Number & Click to View */}
                        <TableCell>
                          <Tooltip title="Click to View Plan Details & BOM" arrow>
                            <Typography
                              variant="body2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlan(p);
                              }}
                              sx={{
                                fontWeight: 700,
                                color: '#2563EB',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {p.planning_number}
                            </Typography>
                          </Tooltip>
                          <Typography variant="caption" sx={{ color: '#71717A', fontSize: '0.68rem', display: 'block' }}>
                            Ref #{p.id.slice(0, 8)}
                          </Typography>
                        </TableCell>

                        {/* Vendor Name */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B' }}>
                            {p.vendor_name || 'Open / Unassigned Spot'}
                          </Typography>
                        </TableCell>

                        {/* Planning Date */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                            {p.planning_date}
                          </Typography>
                        </TableCell>

                        {/* Required by Date */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626', fontSize: '0.82rem' }}>
                            {p.required_date}
                          </Typography>
                        </TableCell>

                        {/* Planned Items (Materials, Quantities, Units - NO PRICES) */}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, maxWidth: 360 }}>
                            {p.items?.map((it: any) => (
                              <Chip
                                key={it.id}
                                label={`${it.material_name}: ${Number(it.quantity).toLocaleString('en-IN')} ${it.unit_code}`}
                                size="small"
                                sx={{
                                  bgcolor: '#F4F4F5',
                                  color: '#18181B',
                                  fontWeight: 600,
                                  fontSize: '0.72rem',
                                  border: '1px solid #E4E4E7',
                                }}
                              />
                            ))}
                          </Box>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>

                        {/* Actions: Small / Icon-Only buttons */}
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                            {/* View Plan Option */}
                            <Tooltip title="View Plan Details & BOM" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlan(p);
                                }}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                  bgcolor: '#EFF6FF',
                                  '&:hover': { bgcolor: '#DBEAFE', borderColor: '#2563EB' },
                                }}
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            {/* Move to Purchase: Small Icon-Only Button */}
                            {!isPurchased && (
                              <Tooltip title="Move to Purchase List (1-Click)" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => convertMutation.mutate(p.id)}
                                    disabled={convertMutation.isPending}
                                    sx={{
                                      bgcolor: '#14532D',
                                      color: '#FFFFFF',
                                      border: '1px solid #14532D',
                                      width: 30,
                                      height: 30,
                                      '&:hover': { bgcolor: '#0B3B1F' },
                                      '&.Mui-disabled': { bgcolor: '#94A3B8', color: '#FFFFFF' },
                                    }}
                                  >
                                    <ShoppingCartCheckoutIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {/* Already in Purchase: View in Purchases Icon */}
                            {isPurchased && (
                              <Tooltip title="View in Purchases" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => navigate('/purchases')}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    color: '#059669',
                                    borderColor: '#A7F3D0',
                                    border: '1px solid #A7F3D0',
                                    bgcolor: '#ECFDF5',
                                    '&:hover': { bgcolor: '#D1FAE5' },
                                  }}
                                >
                                  <LaunchRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Direct Vector PDF Generation (No screenshot / No window.print) */}
                            <Tooltip title="Generate & Download PDF Document" arrow>
                              <IconButton
                                size="small"
                                onClick={() => generatePlanningPdf(p)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  bgcolor: '#FEF2F2',
                                  '&:hover': { bgcolor: '#FEE2E2', borderColor: '#DC2626' },
                                }}
                              >
                                <PictureAsPdfOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            {/* Export Single Plan CSV */}
                            <Tooltip title="Download Plan BOM (Excel/CSV)" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => handleExportSinglePlan(p, e)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: '#0D9488',
                                  border: '1px solid #CCFBF1',
                                  bgcolor: '#F0FDFA',
                                  '&:hover': { bgcolor: '#CCFBF1', borderColor: '#0D9488' },
                                }}
                              >
                                <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            {/* Delete Plan Option */}
                            <Tooltip
                              title={
                                isPurchased
                                  ? 'Cannot delete plan after Purchase Order has been created'
                                  : 'Delete Material Plan'
                              }
                              arrow
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={isPurchased || deleteMutation.isPending}
                                  onClick={() => setPlanToDelete(p)}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    color: '#EF4444',
                                    border: '1px solid #FFE4E6',
                                    bgcolor: '#FFF1F2',
                                    '&:hover': { bgcolor: '#FFE4E6', borderColor: '#EF4444' },
                                    '&.Mui-disabled': { opacity: 0.35 },
                                  }}
                                >
                                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>


      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(planToDelete)}
        title="Delete Material Plan"
        message={`Are you sure you want to delete Material Plan "${planToDelete?.planning_number}"? This requisition will be permanently removed.`}
        confirmText="Delete Plan"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (planToDelete) {
            deleteMutation.mutate(planToDelete.id);
          }
        }}
        onCancel={() => setPlanToDelete(null)}
      />

      {/* Plan Detail / View Modal */}
      <PlanDetailModal
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        onConvertToPurchase={(id) => {
          setSelectedPlan(null);
          convertMutation.mutate(id);
        }}
        isConverting={convertMutation.isPending}
      />
    </Box>
  );
};
