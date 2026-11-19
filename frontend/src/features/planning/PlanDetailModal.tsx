import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { MdpLogo } from '../../components/common/MdpLogo';
import { StatusBadge } from '../../components/common/StatusBadge';
import { generatePlanningPdf } from '../../utils/generatePlanningPdf';

interface PlanDetailModalProps {
  open: boolean;
  onClose: () => void;
  plan: any;
  onConvertToPurchase?: (planId: string) => void;
  isConverting?: boolean;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  open,
  onClose,
  plan,
  onConvertToPurchase,
  isConverting = false,
}) => {
  if (!plan) return null;

  const totalQuantity = (plan.items || []).reduce(
    (sum: number, it: any) => sum + Number(it.quantity || 0),
    0
  );

  const handleDownloadCsv = () => {
    const headers = ['Line #', 'Material Code', 'Material Name', 'Quantity', 'Unit'];
    const rows = (plan.items || []).map((it: any, index: number) => [
      index + 1,
      `"${it.material_code || ''}"`,
      `"${it.material_name || ''}"`,
      it.quantity,
      `"${it.unit_code || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [`MATERIAL PROCUREMENT PLAN: ${plan.planning_number}`]
        .concat([
          `Date: ${plan.planning_date}`,
          `Vendor: ${plan.vendor_name || 'Open Market / Unassigned'}`,
          `Required By: ${plan.required_date}`,
          `Status: ${plan.status}`,
          '',
        ])
        .concat([headers.join(',')])
        .concat(rows.map((e: any[]) => e.join(',')))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${plan.planning_number}_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPurchased = plan.status === 'PURCHASE_CREATED';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}>
      {/* Header Banner */}
      <DialogTitle
        sx={{
          p: 0,
          background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
          color: '#FFFFFF',
        }}
      >
        <Box sx={{ px: 3, py: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#FFFFFF', p: 0.8, borderRadius: '8px', display: 'flex' }}>
              <MdpLogo compact />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {plan.planning_number}
                </Typography>
                <Chip
                  label={plan.status?.replace(/_/g, ' ')}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mt: 0.3 }}>
                Material Procurement & Production Requisition Plan
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        {/* Requisition Meta Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 2,
            p: 2,
            mb: 3,
            bgcolor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Vendor */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.5 }}>
              <StoreOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Target Vendor
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              {plan.vendor_name || 'Open Market Requisition'}
            </Typography>
          </Box>

          {/* Planning Date */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.5 }}>
              <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Planning Date
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {plan.planning_date}
            </Typography>
          </Box>

          {/* Required Date */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#DC2626', mb: 0.5 }}>
              <EventAvailableOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Required By
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626' }}>
              {plan.required_date}
            </Typography>
          </Box>

          {/* Verification */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B', mb: 0.5 }}>
              <FactCheckOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Approval / Review
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {plan.approved_by_name || 'Pending Review'}
            </Typography>
          </Box>
        </Box>

        {/* Special Instructions / Notes */}
        {plan.notes && (
          <Box sx={{ mb: 3, p: 1.8, bgcolor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <NotesOutlinedIcon sx={{ color: '#D97706', fontSize: 20, mt: 0.2 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.2 }}>
                Requisition Notes & Instructions
              </Typography>
              <Typography variant="body2" sx={{ color: '#78350F' }}>
                {plan.notes}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Items Section Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory2OutlinedIcon sx={{ color: '#166534', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Requisition Materials Bill ({(plan.items || []).length} items)
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
            Total Qty: <strong style={{ color: '#0F172A' }}>{totalQuantity.toLocaleString('en-IN')} Units</strong>
          </Typography>
        </Box>

        {/* Materials Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.74rem', width: 44, textAlign: 'center' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.74rem', width: 130 }}>ITEM CODE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.74rem' }}>MATERIAL DESCRIPTION</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.74rem', width: 140 }}>REQUIRED QTY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.74rem', width: 90 }}>UNIT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(plan.items || []).map((it: any, index: number) => (
                <TableRow key={it.id || index} sx={{ '&:nth-of-type(even)': { bgcolor: '#FAFAF9' }, '&:hover': { bgcolor: '#F1F5F9' } }}>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                    {it.material_code || '-'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                    {it.material_name}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                    {Number(it.quantity).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                    <Chip label={it.unit_code || 'NOS'} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#ECFEFF', color: '#0891B2', fontWeight: 700 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <Divider />

      {/* Modal Actions */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PictureAsPdfOutlinedIcon />}
            onClick={() => generatePlanningPdf(plan)}
            sx={{
              color: '#DC2626',
              borderColor: '#FECACA',
              '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
            }}
          >
            Export PDF
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleDownloadCsv}
            sx={{
              color: '#0D9488',
              borderColor: '#CCFBF1',
              '&:hover': { bgcolor: '#F0FDFA', borderColor: '#0D9488' },
            }}
          >
            Export CSV
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isPurchased && onConvertToPurchase && (
            <Button
              size="small"
              variant="contained"
              startIcon={<ShoppingCartCheckoutIcon />}
              onClick={() => onConvertToPurchase(plan.id)}
              disabled={isConverting}
              sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' }, fontWeight: 700 }}
            >
              {isConverting ? 'Transferring...' : 'Move to Purchase Order'}
            </Button>
          )}
          <Button onClick={onClose} variant="contained" color="inherit" sx={{ bgcolor: '#E2E8F0', color: '#1E293B', '&:hover': { bgcolor: '#CBD5E1' } }}>
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
