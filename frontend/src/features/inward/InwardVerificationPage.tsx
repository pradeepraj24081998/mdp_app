import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { apiClient } from '../../api/client';
import { InwardReceipt, InwardItem } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';

interface VerificationRow {
  item_id: string;
  material_name: string;
  unit_code: string;
  ordered_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  damaged_quantity: number;
  rejected_quantity: number;
  remarks: string;
}

export const InwardVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [validationError, setValidationError] = useState('');

  const { data: inward, isLoading } = useQuery<InwardReceipt>({
    queryKey: ['inward', id],
    queryFn: async () => {
      const res = await apiClient.get(`/inwards/${id}/`);
      return res.data?.data ?? res.data;
    },
  });

  useEffect(() => {
    if (inward && inward.items) {
      setRows(
        inward.items.map((item: InwardItem) => ({
          item_id: item.id,
          material_name: item.material_name || 'Material',
          unit_code: item.unit_code || '',
          ordered_quantity: Number(item.ordered_quantity),
          received_quantity: Number(item.received_quantity),
          accepted_quantity: Number(item.accepted_quantity || item.received_quantity),
          damaged_quantity: Number(item.damaged_quantity || 0),
          rejected_quantity: Number(item.rejected_quantity || 0),
          remarks: item.remarks || '',
        }))
      );
    }
  }, [inward]);

  const handleFieldChange = (idx: number, field: keyof VerificationRow, val: any) => {
    const updated = [...rows];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setRows(updated);
    setValidationError('');
  };

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (rows.length === 0) {
        throw new Error('No items found in this inward receipt to verify.');
      }
      // Validate non-negative and sum <= received
      for (const r of rows) {
        if (
          Number(r.accepted_quantity) < 0 ||
          Number(r.damaged_quantity) < 0 ||
          Number(r.rejected_quantity) < 0
        ) {
          throw new Error(`Quantities cannot be negative for ${r.material_name}.`);
        }
        const sum = Number(r.accepted_quantity) + Number(r.damaged_quantity) + Number(r.rejected_quantity);
        if (sum > r.received_quantity) {
          throw new Error(
            `Sum of accepted (${r.accepted_quantity}), damaged (${r.damaged_quantity}), and rejected (${r.rejected_quantity}) cannot exceed received quantity (${r.received_quantity}) for ${r.material_name}.`
          );
        }
      }

      const payload = {
        items: rows.map((r) => ({
          item_id: r.item_id,
          accepted_quantity: Number(r.accepted_quantity),
          damaged_quantity: Number(r.damaged_quantity),
          rejected_quantity: Number(r.rejected_quantity),
          remarks: r.remarks,
        })),
      };
      const res = await apiClient.post(`/inwards/${id}/verify/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward', id] });
      queryClient.invalidateQueries({ queryKey: ['inwards'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Verification failed. Please check line item quantities.';
      setValidationError(msg);
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ claimId, newStatus }: { claimId: string; newStatus: string }) => {
      const res = await apiClient.patch(`/damaged-returns/${claimId}/`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward', id] });
      queryClient.invalidateQueries({ queryKey: ['inwards'] });
    },
    onError: (err: any) => {
      alert(`Failed to update claim status: ${err?.message || 'Error'}`);
    },
  });

  const returnClaims = (inward?.items || []).flatMap((item) =>
    (item.return_requests || []).map((req) => ({
      ...req,
      material_name: item.material_name || req.material_name,
      material_code: item.material_code,
      unit_code: item.unit_code,
    }))
  );

  const totalDamagedUnits = (inward?.items || []).reduce(
    (acc, it) => acc + Number(it.damaged_quantity || 0) + Number(it.rejected_quantity || 0),
    0
  );

  if (isLoading || !inward) {
    return <LoadingState rows={7} />;
  }

  return (
    <Box>
      <PageHeader
        title={`Quality Verification: ${inward.inward_number}`}
        subtitle={`Gate inward arrived on ${inward.received_date} for PO: ${inward.purchase_number}`}
        breadcrumbs={[
          { label: 'Gate Inward', href: '/inward' },
          { label: inward.inward_number },
          { label: 'Quality Verification' },
        ]}
      />

      {/* Critical Business Rule Warning Banner */}
      <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px' }}>
        <strong>Strict ERP Business Protocol:</strong> Received quantity at factory gate does <strong>NOT</strong> enter usable stock automatically. Only verified <em>Accepted Quantity</em> will be credited to usable inventory. Any recorded <em>Damaged Quantity</em> will be quarantined and automatically registered for vendor return/credit note claims.
      </Alert>

      {validationError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {validationError}
        </Alert>
      )}

      {inward.is_stock_updated && (
        <Alert
          severity={inward.status === 'PARTIALLY_ACCEPTED' ? 'warning' : 'success'}
          sx={{ mb: 3, borderRadius: '8px' }}
        >
          {inward.status === 'PARTIALLY_ACCEPTED' ? (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Consignment Partially Accepted (Damages Found)
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Only the verified good quantity has entered usable warehouse stock. All damaged items ({totalDamagedUnits} units) have been quarantined and registered as vendor return claims below.
              </Typography>
            </Box>
          ) : (
            <Box>
              <strong>Verified & Posted:</strong> This inward consignment has been inspected and usable stock was posted to inventory. Status: <StatusBadge status={inward.status} />
            </Box>
          )}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Material Inspection Matrix
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Verify physical lot against PO specifications and separate damages/shortages
              </Typography>
            </Box>
            <StatusBadge status={inward.status} />
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>MATERIAL</TableCell>
                  <TableCell align="right">ORDERED</TableCell>
                  <TableCell align="right">GATE RECV</TableCell>
                  <TableCell sx={{ width: 140, bgcolor: '#F0FDF4' }}>ACCEPTED QTY (STOCK)</TableCell>
                  <TableCell sx={{ width: 130, bgcolor: '#FEF2F2' }}>DAMAGED QTY (RETURN)</TableCell>
                  <TableCell sx={{ width: 130 }}>REJECTED QTY</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>QA REMARKS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.item_id}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {row.material_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        UOM: {row.unit_code}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {row.ordered_quantity.toLocaleString()} {row.unit_code}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#2563EB' }}>
                      {row.received_quantity.toLocaleString()} {row.unit_code}
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#F0FDF4' }}>
                      <TextField
                        size="small"
                        type="number"
                        disabled={inward.is_stock_updated}
                        value={row.accepted_quantity}
                        onChange={(e) => handleFieldChange(idx, 'accepted_quantity', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 'any' }}
                        sx={{ bgcolor: '#FFFFFF' }}
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#FEF2F2' }}>
                      <TextField
                        size="small"
                        type="number"
                        disabled={inward.is_stock_updated}
                        value={row.damaged_quantity}
                        onChange={(e) => handleFieldChange(idx, 'damaged_quantity', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 'any' }}
                        sx={{ bgcolor: '#FFFFFF' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={inward.is_stock_updated}
                        value={row.rejected_quantity}
                        onChange={(e) => handleFieldChange(idx, 'rejected_quantity', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 'any' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        disabled={inward.is_stock_updated}
                        value={row.remarks}
                        placeholder="e.g. Moisture within 8% threshold..."
                        onChange={(e) => handleFieldChange(idx, 'remarks', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!inward.is_stock_updated && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/inward')}>
                Back to Inwards
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleOutlineIcon />}
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
                sx={{ px: 3, fontWeight: 700 }}
              >
                {verifyMutation.isPending ? 'Verifying & Posting...' : 'Verify Quality & Post Usable Stock'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quarantined Damaged Stock & Vendor Claims Resolution Card */}
      {(inward.status === 'PARTIALLY_ACCEPTED' || returnClaims.length > 0) && (
        <Card sx={{ mb: 3, border: '1px solid #FECACA', bgcolor: '#FFFDFD' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentReturnOutlinedIcon sx={{ color: '#DC2626' }} />
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#991B1B' }}>
                    Quarantined Damaged Stock & Vendor Return Claims
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Damaged/rejected materials are safely quarantined away from factory stock. Track vendor resolutions below.
                </Typography>
              </Box>
              <Chip
                label={`${returnClaims.length} Active Return Claim${returnClaims.length === 1 ? '' : 's'}`}
                color="error"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>

            {returnClaims.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                No explicit return claims were generated for this lot.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #FCA5A5', mt: 1.5, mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#FEF2F2' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#991B1B' }}>MATERIAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#991B1B' }}>DAMAGED QTY</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#991B1B' }}>VENDOR</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#991B1B' }}>CLAIM TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#991B1B' }}>CLAIM STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#991B1B' }}>REMARKS / REASON</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#991B1B', minWidth: 190 }}>ACTION / STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returnClaims.map((claim) => (
                      <TableRow key={claim.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {claim.material_name}
                          </Typography>
                          {claim.material_code && (
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {claim.material_code}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                            {Number(claim.quantity).toLocaleString()} {claim.unit_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {claim.vendor_name || 'Vendor'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={claim.return_type === 'CREDIT' ? 'Credit Note' : 'Replacement'}
                            sx={{
                              bgcolor: claim.return_type === 'CREDIT' ? '#EFF6FF' : '#F0FDF4',
                              color: claim.return_type === 'CREDIT' ? '#1D4ED8' : '#15803D',
                              border: `1px solid ${claim.return_type === 'CREDIT' ? '#BFDBFE' : '#BBF7D0'}`,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={claim.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#475569' }}>
                            {claim.notes || 'Damage reported during gate verification'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <FormControl size="small" fullWidth sx={{ maxWidth: 190 }}>
                            <Select
                              value={claim.status}
                              disabled={updateClaimMutation.isPending}
                              onChange={(e) =>
                                updateClaimMutation.mutate({
                                  claimId: claim.id,
                                  newStatus: e.target.value as string,
                                })
                              }
                              sx={{ fontSize: '0.75rem', height: 32, bgcolor: '#FFFFFF' }}
                            >
                              <MenuItem value="REQUESTED">Return Requested</MenuItem>
                              <MenuItem value="DISPATCHED_TO_VENDOR">Dispatched to Vendor</MenuItem>
                              <MenuItem value="REPLACED">Replacement Received</MenuItem>
                              <MenuItem value="CREDITED">Credit Note Received</MenuItem>
                              <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Resolution Options Guidance */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>
              How to Handle & Settle this Partially Accepted Consignment:
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: '#BBF7D0',
                    bgcolor: '#F0FDF4',
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocalShippingOutlinedIcon sx={{ color: '#15803D' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#14532D' }}>
                        Option 1: Vendor Sends Replacement Delivery
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                      When the vendor delivers the replacement or pending balance items to the factory gate:
                      <br />
                      1. Go to <strong>Gate Inward</strong> and click <strong>Record Gate Inward</strong>.
                      <br />
                      2. Select Purchase Order <strong>{inward.purchase_number}</strong> (marked as <em>Balance Delivery</em>).
                      <br />
                      3. Verify the replacement delivery. Once accepted, the PO will automatically update to <strong>COMPLETED</strong>.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<LocalShippingOutlinedIcon />}
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/inward')}
                    sx={{
                      bgcolor: '#16A34A',
                      fontWeight: 700,
                      textTransform: 'none',
                      alignSelf: 'flex-start',
                      '&:hover': { bgcolor: '#15803D' },
                    }}
                  >
                    Go to Gate Inward
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: '#BFDBFE',
                    bgcolor: '#EFF6FF',
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ReceiptLongOutlinedIcon sx={{ color: '#1D4ED8' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                        Option 2: Settle via Credit Note / Bill Deduction
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#1E40AF', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                      If the vendor will <strong>not</strong> send replacements and instead reduces the bill amount:
                      <br />
                      1. In the claims table above, change the claim status to <strong>Credit Note Received</strong>.
                      <br />
                      2. Finance / Accounts will pay the vendor bill for only the accepted good units (or apply the vendor's credit note).
                      <br />
                      3. The damaged units remain quarantined and will not enter usable inventory.
                    </Typography>
                  </Box>
                  {returnClaims.some((c) => c.status === 'REQUESTED' || c.status === 'DISPATCHED_TO_VENDOR') && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ReceiptLongOutlinedIcon />}
                      onClick={() => {
                        const target = returnClaims.find((c) => c.status === 'REQUESTED' || c.status === 'DISPATCHED_TO_VENDOR');
                        if (target) {
                          updateClaimMutation.mutate({ claimId: target.id, newStatus: 'CREDITED' });
                        }
                      }}
                      sx={{
                        color: '#2563EB',
                        borderColor: '#93C5FD',
                        fontWeight: 700,
                        textTransform: 'none',
                        alignSelf: 'flex-start',
                        bgcolor: '#FFFFFF',
                        '&:hover': { bgcolor: '#DBEAFE', borderColor: '#2563EB' },
                      }}
                    >
                      Mark Active Claim as Credited
                    </Button>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
