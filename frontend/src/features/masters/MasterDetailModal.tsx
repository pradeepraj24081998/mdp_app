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
  Grid,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

interface MasterDetailModalProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  type: 'material' | 'product' | 'vendor' | 'customer' | 'unit' | 'production_unit' | 'warehouse';
  data: any;
}

export const MasterDetailModal: React.FC<MasterDetailModalProps> = ({
  open,
  onClose,
  onEdit,
  onDelete,
  type,
  data,
}) => {
  if (!data) return null;

  const getTitleAndSubtitle = () => {
    switch (type) {
      case 'material':
        return {
          title: data.name,
          code: data.material_code,
          category: data.material_type?.replace(/_/g, ' '),
          categoryColor: '#2563EB',
          categoryBg: '#EFF6FF',
        };
      case 'product':
        return {
          title: data.product_name,
          code: data.product_code,
          category: data.category,
          categoryColor: '#059669',
          categoryBg: '#ECFDF5',
        };
      case 'vendor':
        return {
          title: data.vendor_name,
          code: data.vendor_code,
          category: 'Supplier / Vendor',
          categoryColor: '#D97706',
          categoryBg: '#FFFBEB',
        };
      case 'customer':
        return {
          title: data.name,
          code: data.customer_code,
          category: data.customer_type || 'Customer',
          categoryColor: '#7C3AED',
          categoryBg: '#F5F3FF',
        };
      case 'unit':
        return {
          title: `${data.name} (${data.code})`,
          code: data.code,
          category: 'Unit of Measurement',
          categoryColor: '#0891B2',
          categoryBg: '#ECFEFF',
        };
      case 'production_unit':
        return {
          title: data.name,
          code: data.production_unit_code,
          category: 'Manufacturing Facility',
          categoryColor: '#4F46E5',
          categoryBg: '#EEF2FF',
        };
      case 'warehouse':
        return {
          title: data.name,
          code: data.warehouse_code,
          category: (data.warehouse_type || 'Warehouse').replace(/_/g, ' '),
          categoryColor: '#0D9488',
          categoryBg: '#F0FDFA',
        };
      default:
        return {
          title: 'Master Record',
          code: '',
          category: 'Master Item',
          categoryColor: '#64748B',
          categoryBg: '#F8FAFC',
        };
    }
  };


  const header = getTitleAndSubtitle();

  const renderField = (label: string, value: React.ReactNode) => (
    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ p: 2.5, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {header.code}
            </Typography>
            <Chip
              label={header.category}
              size="small"
              sx={{
                bgcolor: header.categoryBg,
                color: header.categoryColor,
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
            <Chip
              label={data.is_active === false ? 'INACTIVE' : 'ACTIVE'}
              size="small"
              sx={{
                bgcolor: data.is_active === false ? '#FEF2F2' : '#F0FDF4',
                color: data.is_active === false ? '#DC2626' : '#166534',
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 20,
              }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.2rem', lineHeight: 1.3 }}>
            {header.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* MATERIAL DETAILS */}
        {type === 'material' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Material Code', data.material_code)}
            {renderField('Category Type', data.material_type?.replace(/_/g, ' '))}
            {renderField('Unit of Measurement', `${data.unit_name || ''} (${data.unit_code || ''})`)}
            {renderField('Minimum Stock Level', `${Number(data.minimum_stock).toLocaleString()} ${data.unit_code || ''}`)}
            {renderField('Reorder Threshold', `${Number(data.reorder_level).toLocaleString()} ${data.unit_code || ''}`)}
            {renderField('Status', data.is_active ? 'Active in Catalog' : 'Inactive')}
            <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
              {renderField('Description & Specs', data.description || 'No detailed specifications recorded.')}
            </Box>
          </Box>
        )}

        {/* PRODUCT DETAILS */}
        {type === 'product' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Product Code', data.product_code)}
            {renderField('Category', data.category)}
            {renderField('Cost Price (Production)', `₹${Number(data.cost_price || 0).toFixed(2)}`)}
            {renderField('Selling Price (MRP)', `₹${Number(data.selling_price || 0).toFixed(2)}`)}
            {renderField('Unit of Measurement', `${data.unit_name || ''} (${data.unit_code || ''})`)}
            {renderField('Minimum Stock Threshold', `${Number(data.minimum_stock || 0).toLocaleString()} ${data.unit_code || ''}`)}
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderField('Product Description', data.description || 'No description entered.')}
            </Box>
          </Box>
        )}

        {/* VENDOR DETAILS */}
        {type === 'vendor' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Vendor Code', data.vendor_code)}
            {renderField('Contact Person', data.contact_person)}
            {renderField('Phone Number', data.phone)}
            {renderField('Email Address', data.email)}
            {renderField('GSTIN / GST Number', data.gst_number || 'N/A')}
            {renderField('Tax / CST Registration', data.tax_number || 'N/A')}
            {renderField('Payment Terms', data.payment_terms || 'Net 30')}
            {renderField('City & State', [data.city, data.state, data.country].filter(Boolean).join(', '))}
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderField('Full Physical Address', [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ') || 'N/A')}
            </Box>
            {data.notes && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                {renderField('Internal Notes / Logistics', data.notes)}
              </Box>
            )}
          </Box>
        )}

        {/* CUSTOMER DETAILS */}
        {type === 'customer' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Customer / Dealer Code', data.customer_code)}
            {renderField('Customer Type', data.customer_type)}
            {renderField('Contact Person', data.contact_person)}
            {renderField('Phone Number', data.phone)}
            {renderField('Email Address', data.email)}
            {renderField('GSTIN Number', data.gst_number || 'N/A')}
            {renderField('Credit Limit', `₹${Number(data.credit_limit || 0).toLocaleString('en-IN')}`)}
            {renderField('Payment Terms', data.payment_terms || 'Net 15')}
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderField('Address Location', [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ') || 'N/A')}
            </Box>
          </Box>
        )}

        {/* UNIT OF MEASUREMENT DETAILS */}
        {type === 'unit' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Unit Code', data.code)}
            {renderField('Unit Name', data.name)}
            {renderField('Symbol / Abbreviation', data.symbol || data.code.toLowerCase())}
            {renderField('Status', 'Active')}
          </Box>
        )}

        {/* PRODUCTION UNIT DETAILS */}
        {type === 'production_unit' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Unit Code', data.production_unit_code)}
            {renderField('Facility Name', data.name)}
            {renderField('Plant Manager', data.manager_name || 'Unassigned')}
            {renderField('Operational Status', 'Active Facility')}
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderField('Description', data.description || 'Standard manufacturing and processing plant.')}
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderField('Address / Physical Facility', data.address || 'N/A')}
            </Box>
          </Box>
        )}

        {/* WAREHOUSE DETAILS */}
        {type === 'warehouse' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1 }}>
            {renderField('Warehouse Code', data.warehouse_code)}
            {renderField('Warehouse Name', data.name)}
            {renderField('Warehouse Manager', data.manager_name || 'Unassigned')}
            {renderField('Status', data.is_active !== false ? 'Active' : 'Inactive')}
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderField('Address', data.address || 'N/A')}
            </Box>
          </Box>
        )}

      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
          Close
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => {
                onClose();
                onDelete();
              }}
              sx={{
                fontWeight: 700,
                borderColor: '#FCA5A5',
                color: '#DC2626',
                '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
              }}
            >
              Delete Record
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              onClose();
              onEdit();
            }}
            sx={{
              bgcolor: '#14532D',
              '&:hover': { bgcolor: '#0B3B1F' },
              fontWeight: 700,
              px: 2.5,
            }}
          >
            Edit Record
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
