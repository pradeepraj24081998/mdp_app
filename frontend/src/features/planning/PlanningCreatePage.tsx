import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { Material, Vendor } from '../../types';

interface PlanningLineItem {
  material: string;
  unit: string;
  unit_code: string;
  quantity: number;
}

export const PlanningCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vendor, setVendor] = useState('');
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PlanningLineItem[]>([
    { material: '', unit: '', unit_code: '', quantity: 0 },
  ]);

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await apiClient.get('/vendors/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['materials-list'],
    queryFn: async () => {
      const res = await apiClient.get('/materials/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const unselectedMaterials = materials.filter((m) => !items.some((it) => it.material === m.id));
  const canAddMoreItems = unselectedMaterials.length > 0;

  const handleAddItem = () => {
    if (canAddMoreItems) {
      setItems([...items, { material: '', unit: '', unit_code: '', quantity: 100 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      // If only one row remains, clear it instead of locking the user
      setItems([{ material: '', unit: '', unit_code: '', quantity: 100 }]);
    }
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      material: matId,
      unit: (mat as any)?.unit || '',
      unit_code: (mat as any)?.unit_code || (mat as any)?.unit?.code || 'KG',
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(0, qty),
    };
    setItems(updated);
  };

  // Mutation 1: Save as Draft
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        planning_date: planningDate,
        vendor: vendor || null,
        required_date: requiredDate,
        notes,
        status: 'DRAFT',
        items: items.map((it) => {
          const mat = materials.find((m) => m.id === it.material);
          return {
            material: it.material,
            unit: it.unit || (mat as any)?.unit,
            quantity: Number(it.quantity),
            estimated_rate: 0, // No price in planning
          };
        }),
      };
      const res = await apiClient.post('/planning/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      navigate('/planning');
    },
  });

  // Mutation 2: Confirm & Move to Purchase List
  const confirmAndMoveMutation = useMutation({
    mutationFn: async () => {
      // Step A: Create the plan
      const payload = {
        planning_date: planningDate,
        vendor: vendor || null,
        required_date: requiredDate,
        notes,
        status: 'APPROVED',
        items: items.map((it) => {
          const mat = materials.find((m) => m.id === it.material);
          return {
            material: it.material,
            unit: it.unit || (mat as any)?.unit,
            quantity: Number(it.quantity),
            estimated_rate: 0, // No price in planning
          };
        }),
      };
      const planRes = await apiClient.post('/planning/', payload);
      const planId = planRes.data.data?.id || planRes.data?.id;

      // Step B: Convert to Purchase Order
      const poRes = await apiClient.post(`/planning/${planId}/create-purchase/`, {
        vendor_id: vendor || null,
      });
      return poRes.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      const purchaseId = data.data?.purchase_id || data.purchase_id;
      // Navigate to the newly generated Purchase Order where commercial prices can be set!
      navigate(`/purchases/${purchaseId}`);
    },
  });

  const totalQuantity = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const isValid = items.every((it) => it.material && it.quantity > 0);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Create Material Procurement Plan"
        subtitle="Specify required manufacturing quantities without commercial pricing. Upon confirmation, items move directly to the Purchase list."
        breadcrumbs={[
          { label: 'Planning', href: '/planning' },
          { label: 'New Material Plan' },
        ]}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/planning')}
            sx={{ borderRadius: '8px' }}
          >
            Back to Planning List
          </Button>
        }
      />

      {/* Non-Pricing Explanation Notice */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon fontSize="inherit" />}
        sx={{
          mb: 3,
          borderRadius: '10px',
          backgroundColor: '#F0F9FF',
          border: '1px solid #BAE6FD',
          color: '#0369A1',
          fontSize: '0.86rem',
        }}
      >
        <strong>Production Requisition Workflow:</strong> Material planning captures <strong>Materials, Required Quantities, and Target Units</strong>. Commercial pricing, vendor discounts, GST taxes, and freight terms are entered when this plan is confirmed and transferred to the <strong>Purchase Order</strong>.
      </Alert>

      <Grid container spacing={3}>
        {/* Left Column: Requisition Header Meta */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181B', mb: 2.5 }}>
                Plan Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                {/* Target Vendor */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#3F3F46', mb: 0.6, display: 'block' }}>
                    Preferred Vendor
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#FAFAF9' },
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Select Preferred Vendor (or Open Spot) --</em>
                    </MenuItem>
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vendor_name} ({v.vendor_code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* Planning Date */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#3F3F46', mb: 0.6, display: 'block' }}>
                    Planning Date
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={planningDate}
                    onChange={(e) => setPlanningDate(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#FAFAF9' },
                    }}
                  />
                </Box>

                {/* Required by Date */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#3F3F46', mb: 0.6, display: 'block' }}>
                    Factory Required by Date *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#FAFAF9' },
                    }}
                  />
                </Box>

                {/* Notes */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#3F3F46', mb: 0.6, display: 'block' }}>
                    Production Purpose / Requisition Notes
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    placeholder="e.g. Sourced for Q4 festive Agarbatti manufacturing (Unit A & B dipping)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#FAFAF9' },
                    }}
                  />
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Requisition Summary Card */}
                <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.8 }}>
                    PLAN REQUISITION SUMMARY
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#334155' }}>Total Line Items:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>{items.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#334155' }}>Total Quantity:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                      {totalQuantity.toLocaleString()} Units
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Required Materials Line Items Table (NO PRICE) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181B' }}>
                    Planned Material Items
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717A' }}>
                    Add raw materials, packaging materials, and quantities needed for manufacturing
                  </Typography>
                </Box>
                <Tooltip title={!canAddMoreItems ? 'All catalog materials have already been selected' : ''} arrow>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      disabled={!canAddMoreItems}
                      sx={{
                        borderRadius: '8px',
                        color: '#2563EB',
                        borderColor: '#BFDBFE',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' },
                      }}
                    >
                      Add Material Line
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E4E7', borderRadius: '10px', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#FAFAF9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B', width: 48 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B' }}>MATERIAL NAME *</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B', width: 170 }}>
                        REQUIRED QTY *
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B', width: 120 }}>UNIT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#52525B', width: 64 }}>ACTION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => {
                      const selectedMat = materials.find((m) => m.id === item.material);
                      const unitDisplay = item.unit_code || (selectedMat as any)?.unit_code || 'KG';

                      return (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ color: '#71717A', fontWeight: 600 }}>{idx + 1}</TableCell>

                          {/* Material Selector */}
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={item.material}
                              onChange={(e) => handleMaterialChange(idx, e.target.value)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '6px',
                                  fontSize: '0.84rem',
                                  backgroundColor: '#FFFFFF',
                                },
                              }}
                            >
                              <MenuItem value="" disabled>
                                <em>-- Select Material --</em>
                              </MenuItem>
                              {materials
                                .filter((m) => m.id === item.material || !items.some((it, i) => i !== idx && it.material === m.id))
                                .map((m) => (
                                  <MenuItem key={m.id} value={m.id}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
                                        {m.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#71717A', fontSize: '0.7rem' }}>
                                        Code: {m.material_code} • Type: {m.material_type}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                            </TextField>
                          </TableCell>

                          {/* Required Quantity */}
                          <TableCell align="right">
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                              slotProps={{
                                htmlInput: { min: 1, step: 'any', style: { textAlign: 'right', fontWeight: 600 } },
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '6px',
                                  fontSize: '0.84rem',
                                  backgroundColor: '#FFFFFF',
                                },
                              }}
                            />
                          </TableCell>

                          {/* Unit (Auto-filled) */}
                          <TableCell>
                            <Box
                              sx={{
                                px: 1.2,
                                py: 0.8,
                                borderRadius: '6px',
                                backgroundColor: '#F4F4F5',
                                border: '1px solid #E4E4E7',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                color: '#27272A',
                                textAlign: 'center',
                              }}
                            >
                              {unitDisplay}
                            </Box>
                          </TableCell>

                          {/* Delete Item */}
                          <TableCell align="center">
                            <Tooltip title={items.length > 1 ? 'Remove material line' : 'Clear material selection'} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={items.length <= 1 && !item.material}
                                  onClick={() => handleRemoveItem(idx)}
                                  sx={{ color: items.length > 1 || item.material ? '#EF4444' : '#D4D4D8' }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Action Buttons Row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 3,
                  pt: 2.5,
                  borderTop: '1px solid #F4F4F5',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/planning')}
                  sx={{ borderRadius: '8px', color: '#71717A', borderColor: '#E4E4E7', textTransform: 'none' }}
                >
                  Discard
                </Button>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {/* Save Draft */}
                  <Button
                    variant="outlined"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={!isValid || saveDraftMutation.isPending || confirmAndMoveMutation.isPending}
                    onClick={() => saveDraftMutation.mutate()}
                    sx={{
                      borderRadius: '8px',
                      color: '#4F46E5',
                      borderColor: '#C7D2FE',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      textTransform: 'none',
                      px: 2,
                      '&:hover': { bgcolor: '#EEF2FF', borderColor: '#4F46E5' },
                    }}
                  >
                    {saveDraftMutation.isPending ? 'Saving...' : 'Save as Draft Plan'}
                  </Button>

                  {/* Confirm and Move to Purchase */}
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCartCheckoutIcon />}
                    disabled={!isValid || saveDraftMutation.isPending || confirmAndMoveMutation.isPending}
                    onClick={() => confirmAndMoveMutation.mutate()}
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: '#14532D',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      boxShadow: '0 2px 8px rgba(20, 83, 45, 0.25)',
                      '&:hover': { backgroundColor: '#0B3B1F' },
                    }}
                  >
                    {confirmAndMoveMutation.isPending ? 'Generating Purchase Order...' : 'Confirm & Move to Purchase List'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
