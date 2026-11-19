import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  module: string;
  path: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Query multiple endpoints in parallel
        const [materialsRes, vendorsRes, purchasesRes, salesRes] = await Promise.allSettled([
          apiClient.get(`/materials/?search=${encodeURIComponent(query)}`),
          apiClient.get(`/vendors/?search=${encodeURIComponent(query)}`),
          apiClient.get(`/purchases/?search=${encodeURIComponent(query)}`),
          apiClient.get(`/sales/orders/?search=${encodeURIComponent(query)}`),
        ]);

        const combined: SearchResultItem[] = [];

        if (materialsRes.status === 'fulfilled' && materialsRes.value.data?.data) {
          const list = Array.isArray(materialsRes.value.data.data) ? materialsRes.value.data.data : materialsRes.value.data.data.results || [];
          list.slice(0, 3).forEach((m: any) => {
            combined.push({
              id: m.id,
              title: `${m.material_code} - ${m.name}`,
              subtitle: `Raw Material • Type: ${m.material_type}`,
              module: 'Material',
              path: '/masters/materials',
            });
          });
        }

        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.data?.data) {
          const list = Array.isArray(vendorsRes.value.data.data) ? vendorsRes.value.data.data : vendorsRes.value.data.data.results || [];
          list.slice(0, 3).forEach((v: any) => {
            combined.push({
              id: v.id,
              title: `${v.vendor_code} - ${v.vendor_name}`,
              subtitle: `Vendor • ${v.city || 'India'} • ${v.phone}`,
              module: 'Vendor',
              path: '/masters/vendors',
            });
          });
        }

        if (purchasesRes.status === 'fulfilled' && purchasesRes.value.data?.data) {
          const list = Array.isArray(purchasesRes.value.data.data) ? purchasesRes.value.data.data : purchasesRes.value.data.data.results || [];
          list.slice(0, 3).forEach((p: any) => {
            combined.push({
              id: p.id,
              title: `${p.purchase_number} (₹${p.grand_total})`,
              subtitle: `PO • ${p.vendor_name} • Status: ${p.status}`,
              module: 'Purchase Order',
              path: `/purchases/${p.id}`,
            });
          });
        }

        if (salesRes.status === 'fulfilled' && salesRes.value.data?.data) {
          const list = Array.isArray(salesRes.value.data.data) ? salesRes.value.data.data : salesRes.value.data.data.results || [];
          list.slice(0, 3).forEach((s: any) => {
            combined.push({
              id: s.id,
              title: `${s.sales_order_number} (₹${s.grand_total})`,
              subtitle: `Sales Order • ${s.customer_name} • Status: ${s.status}`,
              module: 'Sales Order',
              path: `/sales/orders/${s.id}`,
            });
          });
        }

        setResults(combined);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px', top: -100 } }}>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search materials, vendors, purchases, sales orders, employees... (Press Esc to exit)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="standard"
          slotProps={{
            input: {
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#2563EB', mr: 1 }} />
                </InputAdornment>
              ),
              sx: { fontSize: '1rem', py: 1 },
            },
          }}
        />
        <Divider sx={{ my: 1.5 }} />

        {loading && (
          <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 2 }}>
            Searching ERP system...
          </Typography>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 2 }}>
            No matching entities found for "{query}".
          </Typography>
        )}

        <List sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {results.map((item) => (
            <ListItemButton
              key={`${item.module}-${item.id}`}
              onClick={() => handleSelect(item.path)}
              sx={{
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': { backgroundColor: '#F8FAFC' },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      {item.title}
                    </Typography>
                    <Chip label={item.module} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#F1F5F9', color: '#475569' }} />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {item.subtitle}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};
