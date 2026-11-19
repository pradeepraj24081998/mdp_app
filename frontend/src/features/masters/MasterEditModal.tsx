import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Unit, Employee, ProductionUnit } from '../../types';

interface MasterEditModalProps {
  open: boolean;
  onClose: () => void;
  type: 'material' | 'product' | 'vendor' | 'customer' | 'unit' | 'production_unit' | 'warehouse';
  data: any;
  units: Unit[];
  employees: Employee[];
  productionUnits?: ProductionUnit[];
}

export const MasterEditModal: React.FC<MasterEditModalProps> = ({
  open,
  onClose,
  type,
  data,
  units,
  employees,
  productionUnits = [],
}) => {
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        unit: data.unit || (units.find((u) => u.code === data.unit_code)?.id || ''),
      });
    }
  }, [data, units]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const getEndpointAndQueryKey = () => {
    switch (type) {
      case 'material':
        return { endpoint: `/materials/${data?.id}/`, queryKey: 'masters-materials' };
      case 'product':
        return { endpoint: `/products/${data?.id}/`, queryKey: 'masters-products' };
      case 'vendor':
        return { endpoint: `/vendors/${data?.id}/`, queryKey: 'masters-vendors' };
      case 'customer':
        return { endpoint: `/customers/${data?.id}/`, queryKey: 'masters-customers' };
      case 'unit':
        return { endpoint: `/units/${data?.id}/`, queryKey: 'masters-units' };
      case 'production_unit':
        return { endpoint: `/production-units/${data?.id}/`, queryKey: 'masters-production-units' };
      case 'warehouse':
        return { endpoint: `/warehouses/${data?.id}/`, queryKey: 'masters-warehouses' };
      default:
        return { endpoint: '', queryKey: '' };
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { endpoint } = getEndpointAndQueryKey();
      const payload: any = { ...formData };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.unit_code;
      delete payload.unit_name;
      delete payload.manager_name;
      delete payload.production_unit_name;
      delete payload.employees;

      // Handle null manager & production_unit
      if (type === 'production_unit' && !payload.manager) {
        payload.manager = null;
      }
      if (type === 'warehouse') {
        if (!payload.manager) payload.manager = null;
        if (!payload.production_unit) payload.production_unit = null;
      }

      const res = await apiClient.patch(endpoint, payload);
      return res.data;
    },
    onSuccess: () => {
      const { queryKey } = getEndpointAndQueryKey();
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onClose();
    },
  });

  if (!data) return null;

  const getTitle = () => {
    switch (type) {
      case 'material':
        return `Edit Material: ${data.material_code}`;
      case 'product':
        return `Edit Product: ${data.product_code}`;
      case 'vendor':
        return `Edit Vendor: ${data.vendor_code}`;
      case 'customer':
        return `Edit Customer: ${data.customer_code}`;
      case 'unit':
        return `Edit Unit: ${data.code}`;
      case 'production_unit':
        return `Edit Production Unit: ${data.production_unit_code}`;
      case 'warehouse':
        return `Edit Warehouse: ${data.warehouse_code}`;
      default:
        return 'Edit Master Record';
    }
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.15rem' }}>
            {getTitle()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Update fields and click Save Changes to persist across the ERP catalog
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* MATERIAL FORM */}
          {type === 'material' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Material Code"
                value={formData.material_code || ''}
                disabled
                helperText="Auto-generated System ID (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Material Name"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Description & Specifications"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Category Type"
                  value={formData.material_type || 'RAW_MATERIAL'}
                  onChange={(e) => handleChange('material_type', e.target.value)}
                >
                  <MenuItem value="RAW_MATERIAL">Raw Material</MenuItem>
                  <MenuItem value="PACKING_MATERIAL">Packing Material</MenuItem>
                  <MenuItem value="CONSUMABLE">Consumable</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Unit of Measurement"
                  required
                  value={formData.unit || ''}
                  onChange={(e) => handleChange('unit', e.target.value)}
                >
                  {units.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Minimum Stock Threshold"
                  value={formData.minimum_stock ?? 0}
                  onChange={(e) => handleChange('minimum_stock', parseFloat(e.target.value) || 0)}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Reorder Stock Level"
                  value={formData.reorder_level ?? 0}
                  onChange={(e) => handleChange('reorder_level', parseFloat(e.target.value) || 0)}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    color="primary"
                  />
                }
                label="Active in Procurement & Inventory"
              />
            </>
          )}

          {/* PRODUCT FORM */}
          {type === 'product' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Product Code"
                value={formData.product_code || ''}
                disabled
                helperText="Auto-generated System ID (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Product Name"
                required
                value={formData.product_name || ''}
                onChange={(e) => handleChange('product_name', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Product Category"
                value={formData.category || 'Incense Sticks'}
                onChange={(e) => handleChange('category', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Cost Price (₹)"
                  value={formData.cost_price ?? 0}
                  onChange={(e) => handleChange('cost_price', parseFloat(e.target.value) || 0)}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Selling Price / MRP (₹)"
                  value={formData.selling_price ?? 0}
                  onChange={(e) => handleChange('selling_price', parseFloat(e.target.value) || 0)}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Unit of Measurement"
                  required
                  value={formData.unit || ''}
                  onChange={(e) => handleChange('unit', e.target.value)}
                >
                  {units.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Minimum Stock Threshold"
                  value={formData.minimum_stock ?? 0}
                  onChange={(e) => handleChange('minimum_stock', parseFloat(e.target.value) || 0)}
                />
              </Box>
            </>
          )}

          {/* VENDOR FORM */}
          {type === 'vendor' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Vendor Code"
                value={formData.vendor_code || ''}
                disabled
                helperText="Auto-generated System ID (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Vendor / Company Name"
                required
                value={formData.vendor_name || ''}
                onChange={(e) => handleChange('vendor_name', e.target.value)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Person"
                  value={formData.contact_person || ''}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="GSTIN Number"
                  value={formData.gst_number || ''}
                  onChange={(e) => handleChange('gst_number', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tax Number / CST"
                  value={formData.tax_number || ''}
                  onChange={(e) => handleChange('tax_number', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Payment Terms"
                  value={formData.payment_terms || 'Net 30'}
                  onChange={(e) => handleChange('payment_terms', e.target.value)}
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Physical Address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="State"
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Pincode"
                  value={formData.pincode || ''}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Logistics & Internal Notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </>
          )}

          {/* CUSTOMER FORM */}
          {type === 'customer' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Customer Code"
                value={formData.customer_code || ''}
                disabled
                helperText="Auto-generated System ID (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Customer / Company Name"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Customer Type"
                  value={formData.customer_type || 'DEALER'}
                  onChange={(e) => handleChange('customer_type', e.target.value)}
                >
                  <MenuItem value="DEALER">Dealer</MenuItem>
                  <MenuItem value="WHOLESALER">Wholesaler</MenuItem>
                  <MenuItem value="RETAILER">Retailer</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Person"
                  value={formData.contact_person || ''}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="GSTIN Number"
                  value={formData.gst_number || ''}
                  onChange={(e) => handleChange('gst_number', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Credit Limit (₹)"
                  value={formData.credit_limit ?? 0}
                  onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || 0)}
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Payment Terms"
                value={formData.payment_terms || 'Net 15'}
                onChange={(e) => handleChange('payment_terms', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Physical Address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="State"
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Pincode"
                  value={formData.pincode || ''}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                />
              </Box>
            </>
          )}

          {/* UNIT OF MEASUREMENT FORM */}
          {type === 'unit' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Unit Code"
                value={formData.code || ''}
                disabled
                helperText="Auto-generated System ID (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Unit Name"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Symbol / Abbreviation"
                value={formData.symbol || ''}
                onChange={(e) => handleChange('symbol', e.target.value)}
              />
            </>
          )}

          {/* PRODUCTION UNIT FORM */}
          {type === 'production_unit' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Production Unit Code"
                value={formData.production_unit_code || ''}
                disabled
                helperText="Auto-generated System ID (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Production Unit Name"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Facility Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Physical Address / Location"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Assigned Plant Manager"
                value={formData.manager || ''}
                onChange={(e) => handleChange('manager', e.target.value)}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code} - {emp.designation_name || emp.department_name})
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          {/* WAREHOUSE FIELDS */}
          {type === 'warehouse' && (
            <>
              <TextField
                fullWidth
                size="small"
                label="Warehouse Code"
                value={formData.warehouse_code || ''}
                disabled
                helperText="Auto-generated Code (Cannot be edited)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip label="READ-ONLY" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Warehouse Name"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />

              <TextField
                select
                fullWidth
                size="small"
                label="Warehouse Manager"
                value={formData.manager || ''}
                onChange={(e) => handleChange('manager', e.target.value)}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code} - {emp.designation_name || emp.department_name})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== false}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: formData.is_active !== false ? '#15803D' : '#64748B' }}>
                    {formData.is_active !== false ? 'Active Warehouse (Operational)' : 'Inactive Warehouse'}
                  </Typography>
                }
              />
            </>
          )}
        </Box>

      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate()}
          sx={{
            bgcolor: '#14532D',
            '&:hover': { bgcolor: '#0B3B1F' },
            fontWeight: 700,
            px: 2.5,
          }}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
