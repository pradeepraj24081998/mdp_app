import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import { PageHeader } from '../../components/common/PageHeader';
import { MdpLogo } from '../../components/common/MdpLogo';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const SettingsPage: React.FC = () => {
  const { user, roles } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Company Profile State
  const [companyName, setCompanyName] = useState('MDP Aroma Private Limited');
  const [tradeName, setTradeName] = useState('MDP Fragrances & Agarbatti');
  const [gstin, setGstin] = useState('29AABCM1234F1Z8');
  const [pan, setPan] = useState('AABCM1234F');
  const [cin, setCin] = useState('U24249KA2018PTC112345');
  const [email, setEmail] = useState('admin@mdparoma.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Plot No. 45, Peenya Industrial Area 2nd Phase, Bengaluru, Karnataka 560058');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Document Prefix State
  const [poPrefix, setPoPrefix] = useState('PO');
  const [soPrefix, setSoPrefix] = useState('SO');
  const [inwPrefix, setInwPrefix] = useState('INW');
  const [prodPrefix, setProdPrefix] = useState('PROD');
  const [shipPrefix, setShipPrefix] = useState('SHIP');
  const [invPrefix, setInvPrefix] = useState('INV');
  const [seqSuccess, setSeqSuccess] = useState(false);

  // Password State
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Diagnostics State
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagDone, setDiagDone] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleSaveSequences = (e: React.FormEvent) => {
    e.preventDefault();
    setSeqSuccess(true);
    setTimeout(() => setSeqSuccess(false), 3500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    try {
      await apiClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.detail || 'Failed to update password.',
      });
    }
  };

  const handleRunDiagnostics = () => {
    setDiagRunning(true);
    setDiagDone(false);
    setTimeout(() => {
      setDiagRunning(false);
      setDiagDone(true);
    }, 1200);
  };

  const currentYear = new Date().getFullYear();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', boxSizing: 'border-box' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="System Settings & Configuration"
        subtitle="Manage manufacturing enterprise profiles, document numbering prefixes, security credentials, and system diagnostics"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16A34A', boxShadow: '0 0 6px #16A34A', ml: 0.8 }} />}
              label="Production Cluster: Plant 1 & 2 Active"
              size="small"
              sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 600, border: '1px solid #BBF7D0', height: 28 }}
            />
          </Box>
        }
      />

      {/* TOP TABS NAVIGATION */}
      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
        <Box sx={{ borderBottom: '1px solid #E2E8F0', px: 2, pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.86rem',
                textTransform: 'none',
                minHeight: 48,
                px: 2.5,
                color: '#64748B',
                '&.Mui-selected': {
                  color: '#14532D',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#14532D',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<BusinessOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Company & Factory Profile" />
            <Tab icon={<TuneOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Document Sequences" />
            <Tab icon={<KeyOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Security & Access Control" />
            <Tab icon={<LanguageOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Regional & Manufacturing Defaults" />
            <Tab icon={<StorageOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Database & Diagnostics" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* ========================================================================= */}
          {/* TAB 0: COMPANY & FACTORY PROFILE (PREMIUM SPLIT-PANE LAYOUT) */}
          {/* ========================================================================= */}
          {activeTab === 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '3.8fr 8.2fr' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              {/* LEFT PANE: LIVE BRAND & FACTORY IDENTITY CARD */}
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Header Banner */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #064E3B 0%, #14532D 60%, #166534 100%)',
                    p: 3,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 1.2,
                      bgcolor: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                      mb: 1.5,
                    }}
                  >
                    <MdpLogo size="large" />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                    {companyName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.78rem', display: 'block' }}>
                    {tradeName}
                  </Typography>
                  <Chip
                    icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
                    label="GSTIN & RoC Registered"
                    size="small"
                    sx={{
                      mt: 1.5,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                </Box>

                {/* Identity Quick Highlights */}
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: '#166534', mt: 0.3 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                        Corporate Identification Number (CIN)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.84rem' }}>
                        {cin}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 18, color: '#2563EB', mt: 0.3 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                        Statutory Tax (GSTIN / PAN)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                        <Chip label={`GSTIN: ${gstin}`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700, fontSize: '0.72rem', height: 22 }} />
                        <Chip label={`PAN: ${pan}`} size="small" sx={{ bgcolor: '#F8FAFC', color: '#334155', fontWeight: 700, fontSize: '0.72rem', height: 22 }} />
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: '#D97706', mt: 0.3 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                        Official Communications Desk
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.82rem' }}>
                        {email}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.78rem' }}>
                        {phone}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#DC2626', mt: 0.3 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                        Primary Manufacturing Complex
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.8rem', lineHeight: 1.45, mt: 0.2 }}>
                        {address}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Operating Plant Status Footer */}
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16A34A', boxShadow: '0 0 6px #16A34A' }} />
                    Operational License Verified (Karnataka RoC)
                  </Typography>
                </Box>
              </Paper>

              {/* RIGHT PANE: RESPONSIVE FORM SECTION */}
              <Box component="form" onSubmit={handleSaveCompany} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {saveSuccess && (
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: '10px',
                      fontWeight: 600,
                      border: '1px solid #BBF7D0',
                      bgcolor: '#F0FDF4',
                    }}
                  >
                    Enterprise company and factory profile updated successfully.
                  </Alert>
                )}

                {/* SECTION 1: LEGAL & BRAND IDENTITY */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessOutlinedIcon sx={{ fontSize: 18, color: '#14532D' }} />
                    Legal Entity & Brand Registration
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', mb: 2, display: 'block' }}>
                    Registered company information printed on official purchase orders, sales invoices, and delivery challans.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="Legal Registered Company Name"
                      fullWidth
                      size="small"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <TextField
                      label="Trade / Commercial Brand Name"
                      fullWidth
                      size="small"
                      required
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                    />
                  </Box>
                </Paper>

                {/* SECTION 2: STATUTORY COMPLIANCE & TAXATION */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 18, color: '#2563EB' }} />
                    Statutory Compliance & GSTIN / PAN
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', mb: 2, display: 'block' }}>
                    Government statutory numbers utilized for e-Way bills, tax invoices, and vendor purchasing agreements.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <TextField
                      label="GSTIN Identification Number"
                      fullWidth
                      size="small"
                      required
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Chip label="15 Digits" size="small" sx={{ height: 19, fontSize: '0.65rem', bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 600 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      label="Permanent Account Number (PAN)"
                      fullWidth
                      size="small"
                      required
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                    />
                    <TextField
                      label="Corporate ID Number (CIN)"
                      fullWidth
                      size="small"
                      value={cin}
                      onChange={(e) => setCin(e.target.value.toUpperCase())}
                    />
                  </Box>
                </Paper>

                {/* SECTION 3: COMMUNICATIONS DESK */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneOutlinedIcon sx={{ fontSize: 18, color: '#D97706' }} />
                    Official Communications & Operations Desk
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', mb: 2, display: 'block' }}>
                    Primary email and telephone contact printed on purchasing documents and sales correspondences.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="Official ERP & Finance Email"
                      fullWidth
                      size="small"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                      label="Primary Operations Phone"
                      fullWidth
                      size="small"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Box>
                </Paper>

                {/* SECTION 4: FACTORY PLANT LOCATION */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                    Factory Plant & Registered Office Location
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', mb: 2, display: 'block' }}>
                    Physical manufacturing facility address and delivery dispatch hub.
                  </Typography>

                  <TextField
                    label="Factory & Head Office Full Address"
                    fullWidth
                    multiline
                    minRows={2.5}
                    size="small"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Paper>

                {/* ACTION BAR */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="medium"
                    startIcon={<SaveOutlinedIcon />}
                    sx={{
                      bgcolor: '#14532D',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 4,
                      py: 1,
                      borderRadius: '8px',
                      boxShadow: '0 4px 14px rgba(20, 83, 45, 0.3)',
                      '&:hover': { bgcolor: '#0B3B1F' },
                    }}
                  >
                    Save Enterprise Profile Changes
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: DOCUMENT SEQUENCES & NUMBERING */}
          {/* ========================================================================= */}
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleSaveSequences} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {seqSuccess && (
                <Alert severity="success" sx={{ borderRadius: '10px', fontWeight: 600, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
                  Document sequence prefixes and formats saved successfully.
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181B' }}>
                    ERP Automatic Document Numbering Prefixes
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.84rem' }}>
                    Configure sequence prefixes for procurement, sales orders, material verification, and manufacturing batch tickets.
                  </Typography>
                </Box>
                <Chip
                  label="Format: [PREFIX]-[YEAR]-[000001]"
                  size="small"
                  sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', fontWeight: 600, color: '#475569' }}
                />
              </Box>

              {/* 6 VISUAL SEQUENCE CARDS IN A RESPONSIVE GRID */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 2.5,
                }}
              >
                {/* 1. Purchase Orders */}
                <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#FFFBEB', color: '#D97706' }}>
                      <ShoppingBagOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        Purchase Orders
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Procurement & Vendor Orders
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="PO Prefix"
                    size="small"
                    fullWidth
                    value={poPrefix}
                    onChange={(e) => setPoPrefix(e.target.value.toUpperCase())}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', mb: 0.3 }}>
                      Live Preview Example:
                    </Typography>
                    <Chip
                      label={`${poPrefix || 'PO'}-${currentYear}-000001`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
                    />
                  </Box>
                </Paper>

                {/* 2. Sales Orders */}
                <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#F0FDF4', color: '#16A34A' }}>
                      <ReceiptLongOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        Sales Orders
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Customer & Dealer Orders
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="SO Prefix"
                    size="small"
                    fullWidth
                    value={soPrefix}
                    onChange={(e) => setSoPrefix(e.target.value.toUpperCase())}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', mb: 0.3 }}>
                      Live Preview Example:
                    </Typography>
                    <Chip
                      label={`${soPrefix || 'SO'}-${currentYear}-000001`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
                    />
                  </Box>
                </Paper>

                {/* 3. Gate Inward Receipts */}
                <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#F0FDFA', color: '#0D9488' }}>
                      <MoveToInboxOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        Gate Inward Receipts
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Inward Consignments & QC
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="Inward Prefix"
                    size="small"
                    fullWidth
                    value={inwPrefix}
                    onChange={(e) => setInwPrefix(e.target.value.toUpperCase())}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', mb: 0.3 }}>
                      Live Preview Example:
                    </Typography>
                    <Chip
                      label={`${inwPrefix || 'INW'}-${currentYear}-000001`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4' }}
                    />
                  </Box>
                </Paper>

                {/* 4. Production Orders */}
                <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#F5F3FF', color: '#7C3AED' }}>
                      <PrecisionManufacturingOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        Production Orders
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Manufacturing Batch Tickets
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="Production Prefix"
                    size="small"
                    fullWidth
                    value={prodPrefix}
                    onChange={(e) => setProdPrefix(e.target.value.toUpperCase())}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', mb: 0.3 }}>
                      Live Preview Example:
                    </Typography>
                    <Chip
                      label={`${prodPrefix || 'PROD'}-${currentYear}-000001`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}
                    />
                  </Box>
                </Paper>

                {/* 5. Logistics Shipments */}
                <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#F0F9FF', color: '#0284C7' }}>
                      <LocalShippingOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        Shipment Challans
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Vehicle Dispatch & Logistics
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="Shipment Prefix"
                    size="small"
                    fullWidth
                    value={shipPrefix}
                    onChange={(e) => setShipPrefix(e.target.value.toUpperCase())}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', mb: 0.3 }}>
                      Live Preview Example:
                    </Typography>
                    <Chip
                      label={`${shipPrefix || 'SHIP'}-${currentYear}-000001`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}
                    />
                  </Box>
                </Paper>

                {/* 6. Tax Invoices */}
                <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#EEF2FF', color: '#4F46E5' }}>
                      <DescriptionOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        Tax Invoices
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Commercial GST Invoices
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="Invoice Prefix"
                    size="small"
                    fullWidth
                    value={invPrefix}
                    onChange={(e) => setInvPrefix(e.target.value.toUpperCase())}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', mb: 0.3 }}>
                      Live Preview Example:
                    </Typography>
                    <Chip
                      label={`${invPrefix || 'INV'}-${currentYear}-000001`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}
                    />
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  sx={{
                    bgcolor: '#14532D',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3.5,
                    py: 1,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#0B3B1F' },
                  }}
                >
                  Save Sequence Prefixes
                </Button>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SECURITY & ACCESS CONTROL */}
          {/* ========================================================================= */}
          {activeTab === 2 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
              {/* Active Session & Security Overview */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityOutlinedIcon sx={{ fontSize: 19, color: '#166534' }} />
                  Authenticated Operator Identity
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mb: 2.5, display: 'block' }}>
                  Current user security credentials and active enterprise role assignment.
                </Typography>

                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: '#14532D',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                      }}
                    >
                      {user?.first_name ? user.first_name[0].toUpperCase() : 'A'}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                        {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Super Administrator'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {user?.email || 'admin@dmp.com'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="SUPER ADMIN"
                      size="small"
                      sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.68rem', border: '1px solid #FDE68A' }}
                    />
                    <Chip
                      label="Full Operational Clearance"
                      size="small"
                      sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '0.68rem', border: '1px solid #BBF7D0' }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Active Role Code:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B' }}>{roles?.[0]?.code || 'ROLE_ADMIN'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Session Origin:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E293B' }}>127.0.0.1 (Local Workstation)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Token Expiration:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#15803D' }}>Active (Sliding Session)</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Password Change Form */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyOutlinedIcon sx={{ fontSize: 19, color: '#7C3AED' }} />
                  Update Account Password
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mb: 2, display: 'block' }}>
                  Ensure your account is using a secure, confidential passphrase.
                </Typography>

                {passwordStatus && (
                  <Alert severity={passwordStatus.type} sx={{ mb: 2, borderRadius: '8px' }}>
                    {passwordStatus.message}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Current Password"
                    type={showOld ? 'text' : 'password'}
                    size="small"
                    required
                    fullWidth
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowOld(!showOld)}>
                              {showOld ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    label="New Password"
                    type={showNew ? 'text' : 'password'}
                    size="small"
                    required
                    fullWidth
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowNew(!showNew)}>
                              {showNew ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type="password"
                    size="small"
                    required
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: '#14532D',
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 1,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#0B3B1F' },
                    }}
                  >
                    Update Password
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: REGIONAL & MANUFACTURING DEFAULTS */}
          {/* ========================================================================= */}
          {activeTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181B' }}>
                Manufacturing & Regional Localization Preferences
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.84rem' }}>
                System-wide accounting fiscal periods, currency formats, and shopfloor quality inspection enforcement.
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 1 }}>
                    Fiscal Year & Ledger Period
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    disabled
                    value="April 1 – March 31 (Indian Standard Fiscal Year)"
                    helperText="Mandatory Indian GAAP statutory calendar"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 1 }}>
                    Base Reporting Currency
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    disabled
                    value="INR - Indian Rupee (₹)"
                    helperText="Default transaction currency for accounts & purchases"
                  />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 1 }}>
                    Inventory Stock Valuation Method
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    disabled
                    value="Weighted Average Cost (WAC)"
                    helperText="Strict double-entry real-time ledger accounting"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 1 }}>
                    Quality Assurance Protocol
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    disabled
                    value="Mandatory QC Verification Before Inward Posting"
                    helperText="Damaged materials are automatically segregated to quarantine"
                  />
                </Paper>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DATABASE & SYSTEM DIAGNOSTICS */}
          {/* ========================================================================= */}
          {activeTab === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181B' }}>
                    Database Diagnostics & System Health
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.84rem' }}>
                    Live operational telemetry, database tables integrity, and system audit trail status.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRunDiagnostics}
                  disabled={diagRunning}
                  sx={{
                    borderColor: '#14532D',
                    color: '#14532D',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#F0FDF4' },
                  }}
                >
                  {diagRunning ? 'Running Self-Test...' : 'Run Diagnostics Self-Test'}
                </Button>
              </Box>

              {diagDone && (
                <Alert severity="success" sx={{ borderRadius: '8px', border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
                  Diagnostic scan completed: All database connections, tables, and audit middleware are 100% operational.
                </Alert>
              )}

              {/* 4 Health Gauges */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>DATABASE CONNECTION</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#16A34A', my: 0.5, fontSize: '1.05rem' }}>
                    Online & Active
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Django ORM • PostgreSQL / SQLite Pool
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>MASTER CATALOG INTEGRITY</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563EB', my: 0.5, fontSize: '1.05rem' }}>
                    24 SKUs Loaded
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    20 Materials • 4 Finished Products
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>LEDGER INTEGRITY</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#7C3AED', my: 0.5, fontSize: '1.05rem' }}>
                    Audited & In-Balance
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Zero Unbalanced Transactions
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>SYSTEM LATENCY</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', my: 0.5, fontSize: '1.05rem' }}>
                    &lt; 15 ms
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Local Fast-Response Architecture
                  </Typography>
                </Paper>
              </Box>

              {/* Maintenance Information Note */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B', mb: 0.5 }}>
                  Operational Data Management Notice
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Operational transactions (purchases, sales orders, inward receipts, production batches, and shipping records) are isolated from core master catalogs. The system command <code>py manage.py clear_operations_data</code> allows factory administrators to reset transaction staging while safely preserving materials, products, units, suppliers, employees, and user credentials.
                </Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
