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
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  TablePagination,
  Typography,
  Tooltip,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { apiClient } from '../../api/client';
import { PurchaseOrder } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { generatePurchasePdf } from '../../utils/generatePurchasePdf';

export const PurchaseListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletePoState, setDeletePoState] = useState<{ open: boolean; po: any }>({
    open: false,
    po: null,
  });
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: async (poId: string) => apiClient.delete(`/purchases/${poId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setDeletePoState({ open: false, po: null });
    },
  });

  const handleRequestSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(0);
  };

  const handleDownloadRowPdf = async (po: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { generatePurchasePdf: genPdf } = await import('../../utils/generatePurchasePdf');
      genPdf(po);
    } catch (err) {
      console.error('Error generating row PDF:', err);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', search, statusFilter, page, rowsPerPage, sortField, sortOrder],
    queryFn: async () => {
      let url = `/purchases/?page=${page + 1}&page_size=${rowsPerPage}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (sortField) {
        const prefix = sortOrder === 'desc' ? '-' : '';
        url += `&ordering=${prefix}${sortField}`;
      }
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  const rawPurchases: PurchaseOrder[] = Array.isArray(data?.data) ? data.data : data?.data?.results || [];
  // Exclude empty purchase orders with 0 items from the list view
  const purchases: PurchaseOrder[] = rawPurchases.filter((po: any) => {
    const matCount = po.total_materials_count ?? po.items?.length ?? 0;
    return matCount > 0;
  });
  const totalCount = data?.pagination?.total ? Math.min(data.pagination.total, purchases.length) : purchases.length;

  return (
    <Box>
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage vendor procurement, multi-tier authorizations, and purchase requisitions"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/purchases/new')}
          >
            Create Purchase Order
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Global search PO, vendor, materials..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearch(''); setPage(0); }}>
                        <ClearIcon sx={{ fontSize: '1rem', color: '#94A3B8' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ minWidth: 300 }}
            />
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
              {['', 'DRAFT', 'MANAGER_REVIEW', 'APPROVED', 'ORDERED', 'RECEIVED', 'COMPLETED'].map((st) => (
                <Chip
                  key={st}
                  label={st ? st.replace(/_/g, ' ') : 'All Statuses'}
                  size="small"
                  clickable
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(0);
                  }}
                  color={statusFilter === st ? 'primary' : 'default'}
                  variant={statusFilter === st ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              ))}
            </Box>

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<Inventory2OutlinedIcon sx={{ fontSize: '0.88rem !important' }} />}
                label={`Total Lines: ${purchases.reduce((acc: number, p: any) => acc + (p.total_materials_count ?? p.items?.length ?? 0), 0)} materials`}
                size="small"
                sx={{
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#334155',
                  '& .MuiChip-icon': { color: '#0D9488' },
                }}
              />
            </Box>
          </Box>

          {isLoading ? (
            <LoadingState rows={6} />
          ) : purchases.length === 0 ? (
            <EmptyState
              title="No purchase orders found"
              description="Create a new purchase order or adjust your search filter criteria."
              actionText="Create Purchase Order"
              onAction={() => navigate('/purchases/new')}
            />
          ) : (
            <>
              <TableContainer>
                <Table size="medium">
                  <TableHead sx={{ backgroundColor: '#FAFAF9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'purchase_number'}
                          direction={sortField === 'purchase_number' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('purchase_number')}
                        >
                          PO NUMBER
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'vendor__vendor_name'}
                          direction={sortField === 'vendor__vendor_name' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('vendor__vendor_name')}
                        >
                          VENDOR
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        MATERIALS
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'purchase_date'}
                          direction={sortField === 'purchase_date' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('purchase_date')}
                        >
                          ORDER DATE
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'expected_date'}
                          direction={sortField === 'expected_date' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('expected_date')}
                        >
                          EXPECTED
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'subtotal'}
                          direction={sortField === 'subtotal' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('subtotal')}
                        >
                          SUBTOTAL
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'tax'}
                          direction={sortField === 'tax' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('tax')}
                        >
                          GST / TAX
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'grand_total'}
                          direction={sortField === 'grand_total' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('grand_total')}
                        >
                          GRAND TOTAL
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        <TableSortLabel
                          active={sortField === 'status'}
                          direction={sortField === 'status' ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort('status')}
                        >
                          STATUS
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((po: any) => {
                      const matCount = po.total_materials_count ?? po.items?.length ?? 0;
                      const totalQty = po.total_quantity ?? (po.items || []).reduce((acc: number, it: any) => acc + Number(it.quantity || 0), 0);
                      const itemsSnippet = (po.items || []).map((it: any) => `${it.material_name || 'Item'} (${it.quantity} ${it.unit_code || ''})`).join(', ');

                      return (
                        <TableRow
                          key={po.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/purchases/${po.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                              {po.purchase_number}
                            </Typography>
                            {po.planning_number && (
                              <Chip
                                size="small"
                                label={`From Plan: ${po.planning_number}`}
                                sx={{
                                  height: 18,
                                  bgcolor: '#EEF2FF',
                                  color: '#4F46E5',
                                  fontSize: '0.66rem',
                                  fontWeight: 600,
                                  border: '1px solid #C7D2FE',
                                  mt: 0.3,
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B' }}>
                              {po.vendor_name || 'Vendor'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717A', fontSize: '0.7rem' }}>
                              {po.payment_terms || 'Net 30'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={itemsSnippet || `${matCount} materials`} arrow placement="top">
                              <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.3 }}>
                                <Chip
                                  icon={<Inventory2OutlinedIcon sx={{ fontSize: '0.85rem !important' }} />}
                                  label={`${matCount} ${matCount === 1 ? 'Material' : 'Materials'}`}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    bgcolor: '#F0FDF4',
                                    color: '#15803D',
                                    border: '1px solid #BBF7D0',
                                    cursor: 'pointer',
                                    '& .MuiChip-icon': { color: '#16A34A' },
                                  }}
                                />
                                {totalQty > 0 && (
                                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', fontWeight: 600, pl: 0.2 }}>
                                    {Number(totalQty).toLocaleString('en-IN')} units total
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{po.purchase_date}</TableCell>
                          <TableCell sx={{ color: '#DC2626', fontWeight: 500 }}>{po.expected_date}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>
                            ₹{Number(po.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#059669', fontWeight: 600 }}>
                            ₹{Number(po.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                            ₹{Number(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={po.status} />
                          </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Generate & Download PO PDF Document" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDownloadRowPdf(po, e)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  '&:hover': { bgcolor: '#FEE2E2', borderColor: '#DC2626' },
                                }}
                              >
                                <PictureAsPdfOutlinedIcon sx={{ fontSize: '1.05rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/purchases/${po.id}`)}
                              sx={{
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                color: '#2563EB',
                                borderColor: '#BFDBFE',
                                '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' },
                              }}
                            >
                              Details & Rates
                            </Button>
                            <Tooltip title="Soft Delete Purchase Order" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletePoState({ open: true, po });
                                }}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: '#FFF1F2',
                                  color: '#E11D48',
                                  border: '1px solid #FECDD3',
                                  '&:hover': { bgcolor: '#FFE4E6', borderColor: '#E11D48' },
                                }}
                              >
                                <DeleteOutlineRoundedIcon sx={{ fontSize: '1.05rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Soft Delete Confirmation Dialog */}
      <Dialog
        open={deletePoState.open}
        onClose={() => {
          if (!deleteMutation.isPending) setDeletePoState({ open: false, po: null });
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
            Are you sure you want to soft-delete Purchase Order <strong>{deletePoState.po?.purchase_number}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
            This will soft-delete the purchase order so it will not appear on active listings.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setDeletePoState({ open: false, po: null })}
            color="inherit"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deletePoState.po?.id) {
                deleteMutation.mutate(deletePoState.po.id);
              }
            }}
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
