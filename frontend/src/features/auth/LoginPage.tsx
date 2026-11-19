import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import { MdpLogo } from '../../components/common/MdpLogo';
import { ProfessionalLoader } from '../../components/common/ProfessionalLoader';

const demoRoles = [
  { label: 'Super Admin', email: 'admin@mdp.com', role: 'Full Access', color: '#14532D', bg: '#F0FDF4', border: '#BBF7D0', icon: '👑' },
  { label: 'Purchase Mgr', email: 'purchase@mdp.com', role: 'Procurement', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🛍️' },
  { label: 'Store Mgr', email: 'store@mdp.com', role: 'Inward & Stock', color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4', icon: '📦' },
  { label: 'Production Mgr', email: 'production@mdp.com', role: 'Batch Processing', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '⚙️' },
  { label: 'Sales Mgr', email: 'sales@mdp.com', role: 'Orders & GST', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '📈' },
  { label: 'Accountant', email: 'accounts@mdp.com', role: 'Ledger & Audit', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: '📊' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@mdp.com');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('12345');
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, '12345');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed demo sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
      }}
    >
      {/* LEFT VISUAL HERO SHOWCASE */}
      {!isMobile && (
        <Box
          sx={{
            flex: { md: '0 0 52%', lg: '0 0 55%' },
            position: 'relative',
            backgroundImage: 'url(/mdp_aroma_incense.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { md: 4, lg: 5 },
            height: '100vh',
            boxSizing: 'border-box',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(20, 83, 45, 0.55) 0%, rgba(15, 23, 42, 0.78) 55%, rgba(15, 23, 42, 0.95) 100%)',
              zIndex: 1,
            },
          }}
        >
          {/* Header Brand Badge */}
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '12px',
                px: 2,
                py: 1,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              <MdpLogo compact light />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, fontSize: '0.95rem' }}>
                  MDP Aroma
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem', fontWeight: 600 }}>
                  Enterprise Manufacturing Platform
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Centered Value Proposition */}
          <Box sx={{ position: 'relative', zIndex: 2, my: 'auto', py: 2, maxWidth: 520 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.5,
                py: 0.4,
                borderRadius: '20px',
                backgroundColor: 'rgba(217, 119, 6, 0.35)',
                border: '1px solid rgba(251, 191, 36, 0.55)',
                color: '#FEF3C7',
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                mb: 1.5,
              }}
            >
              <SpaRoundedIcon sx={{ fontSize: 14, color: '#FBBF24' }} />
              Artisanal Fragrance & Modern ERP
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { md: '1.85rem', lg: '2.25rem' },
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.025em',
                lineHeight: 1.22,
                mb: 1.2,
                textShadow: '0 2px 10px rgba(0,0,0,0.4)',
              }}
            >
              Traditional Fragrance Craftsmanship, Modern Manufacturing Precision.
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#E4E4E7',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                mb: 2.2,
                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            >
              Centralized double-entry stock ledgers, atomic multi-unit production tracking, gate-inward verification, and wholesale GST dispatch.
            </Typography>

            {/* Feature Badges with Clear Vibrant Contrast */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { title: 'Atomic Double-Entry Stock Ledger', desc: 'Immutable balance tracking & negative stock prevention', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
                { title: 'Gate Inward & Quality Verification', desc: 'Only verified material enters active inventory; damages isolated', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' },
                { title: 'Multi-Unit Production Tracking', desc: 'Real-time BOM consumption for dipping, drying & automated rolling', color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' },
              ].map((feat) => (
                <Box
                  key={feat.title}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '10px',
                    px: 1.5,
                    py: 0.8,
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: feat.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircleRoundedIcon sx={{ fontSize: 16, color: feat.color }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.2 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '0.68rem' }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Footer Info */}
          <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.74rem' }}>
              MDP Aroma Enterprise Platform • Release v2.5
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              <Typography variant="caption" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.74rem' }}>
                Unit A & B Factory Online
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* RIGHT LOGIN PANEL - ELEVATED LUXURY CARD */}
      <Box
        sx={{
          flex: { xs: '1 0 100%', md: '0 0 48%', lg: '0 0 45%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2.5, sm: 4, md: 5 },
          backgroundColor: '#F8FAFC',
          overflowY: 'auto',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 440,
            width: '100%',
            p: { xs: 3, sm: 4 },
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Brand Header */}
          <Box sx={{ mb: 3 }}>
            <MdpLogo size="large" />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.45rem', sm: '1.7rem' },
                color: '#09090B',
                letterSpacing: '-0.025em',
                mt: 2.2,
                mb: 0.5,
              }}
            >
              Sign In to Your Workspace
            </Typography>
            <Typography variant="body2" sx={{ color: '#71717A', fontSize: '0.84rem' }}>
              Enter your credentials or click any demo role below for 1-click access.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.2,
                borderRadius: '8px',
                fontSize: '0.82rem',
                border: '1px solid #FECACA',
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 1.8 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', mb: 0.5, display: 'block' }}>
                Email Address or Username
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mdp.com"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    fontSize: '0.88rem',
                    '&:hover': { backgroundColor: '#FFFFFF', borderColor: '#9CA3AF' },
                    '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#14532D', boxShadow: '0 0 0 3px rgba(20, 83, 45, 0.12)' },
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 2.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151' }}>
                  Password
                </Typography>
                <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 600, cursor: 'pointer' }}>
                  Default: 12345
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#6B7280' }}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    fontSize: '0.88rem',
                    '&:hover': { backgroundColor: '#FFFFFF', borderColor: '#9CA3AF' },
                    '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#14532D', boxShadow: '0 0 0 3px rgba(20, 83, 45, 0.12)' },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                py: 1.15,
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.92rem',
                background: 'linear-gradient(135deg, #14532D 0%, #15803D 100%)',
                boxShadow: '0 4px 14px rgba(20, 83, 45, 0.28)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0B3B1F 0%, #14532D 100%)',
                  boxShadow: '0 6px 20px rgba(20, 83, 45, 0.38)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {loading ? 'Authenticating with MDP Aroma...' : 'Sign In to Workspace'}
            </Button>
          </form>

          {loading && (
            <Box sx={{ mt: 2 }}>
              <ProfessionalLoader message="Authenticating..." submessage="Connecting to MDP Aroma workspace" size={28} />
            </Box>
          )}

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              One-Click Role Access
            </Typography>
          </Divider>

          {/* 6 COLORFUL ONE-CLICK DEMO ROLE CARDS */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {demoRoles.map((role) => (
              <Box
                key={role.label}
                onClick={() => handleQuickRole(role.email)}
                sx={{
                  p: 1.1,
                  borderRadius: '9px',
                  border: `1px solid ${role.border}`,
                  backgroundColor: role.bg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.1,
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${role.color}25`,
                    borderColor: role.color,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '7px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    flexShrink: 0,
                  }}
                >
                  {role.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.78rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {role.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {role.role}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

