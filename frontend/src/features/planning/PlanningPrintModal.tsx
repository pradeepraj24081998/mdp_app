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
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { MdpLogo } from '../../components/common/MdpLogo';
import { generatePlanningPdf } from '../../utils/generatePlanningPdf';

interface PlanningPrintModalProps {
  open: boolean;
  onClose: () => void;
  plan: any;
}

export const PlanningPrintModal: React.FC<PlanningPrintModalProps> = ({ open, onClose, plan }) => {
  if (!plan) return null;

  const handleDownloadPdf = () => {
    generatePlanningPdf(plan);
  };

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
        .concat([`Date: ${plan.planning_date}`, `Vendor: ${plan.vendor_name || 'Open / Unassigned'}`, `Required By: ${plan.required_date}`, ''])
        .concat([headers.join(',')])
        .concat(rows.map((e: any[]) => e.join(',')))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Plan_${plan.planning_number}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: '#FFFFFF' }} id="printable-plan-slip">
        {/* Printable Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2.5, borderBottom: '2px solid #14532D' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MdpLogo />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#14532D', letterSpacing: '-0.02em' }}>
                MDP Aroma Private Limited
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                Plot 42, Fragrance Industrial Zone, Bangalore, Karnataka - 560099
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                GSTIN: 29AABCM1234F1Z6 • Phone: +91 80 2345 6789
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#09090B' }}>
              MATERIAL REQUISITION SLIP
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
              {plan.planning_number}
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717A', display: 'block' }}>
              Date: {plan.planning_date}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534', bgcolor: '#F0FDF4', px: 1, py: 0.2, borderRadius: '4px', border: '1px solid #BBF7D0', display: 'inline-block', mt: 0.5 }}>
              Status: {plan.status}
            </Typography>
          </Box>
        </Box>

        {/* Plan Metadata */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, my: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              TARGET VENDOR
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              {plan.vendor_name || 'Open / Unassigned Spot Requisition'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              FACTORY REQUIRED BY DATE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
              {plan.required_date}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              APPROVED / VERIFIED BY
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {plan.approved_by_name || 'Pending Review'}
            </Typography>
          </Box>
        </Box>

        {/* Materials Table (Strictly Quantitative - No Prices) */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 1 }}>
          Required Materials Breakdown (Quantitative Bill of Materials)
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', mb: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 48, fontSize: '0.76rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 140, fontSize: '0.76rem' }}>MATERIAL CODE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem' }}>MATERIAL DESCRIPTION</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 150, fontSize: '0.76rem' }}>REQUIRED QTY</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 100, fontSize: '0.76rem' }}>UNIT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(plan.items || []).map((it: any, index: number) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#FAFAF9' } }}>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{it.material_code || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{it.material_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                    {Number(it.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{it.unit_code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {plan.notes && (
          <Box sx={{ p: 1.8, bgcolor: '#FAFAF9', borderRadius: '8px', border: '1px solid #E4E4E7', mb: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#52525B', display: 'block', mb: 0.3 }}>
              REQUISITION PURPOSE / NOTES
            </Typography>
            <Typography variant="body2" sx={{ color: '#27272A' }}>
              {plan.notes}
            </Typography>
          </Box>
        )}

        {/* Authorization Signatures */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, pt: 4, borderTop: '1px solid #E2E8F0', mt: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ borderBottom: '1px solid #94A3B8', height: 40, mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
              Production Planner
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.68rem' }}>
              Prepared & Requisitioned
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ borderBottom: '1px solid #94A3B8', height: 40, mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
              Factory Operations Manager
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.68rem' }}>
              Verified & Approved
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ borderBottom: '1px solid #94A3B8', height: 40, mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
              Purchase Dept Sign-off
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.68rem' }}>
              Commercial PO Generation
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} startIcon={<CloseRoundedIcon />} sx={{ color: '#64748B', textTransform: 'none' }}>
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlinedIcon />}
          onClick={handleDownloadCsv}
          sx={{ borderRadius: '8px', color: '#0D9488', borderColor: '#99F6E4', textTransform: 'none' }}
        >
          Download Excel (CSV)
        </Button>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfOutlinedIcon />}
          onClick={handleDownloadPdf}
          sx={{
            borderRadius: '8px',
            bgcolor: '#14532D',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: '#0B3B1F' },
          }}
        >
          Download PDF Document
        </Button>
      </DialogActions>
    </Dialog>
  );
};
