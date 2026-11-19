import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Box,
  Typography,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import LayoutDashboard from '@mui/icons-material/DashboardOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { MdpLogo } from '../common/MdpLogo';

export const SIDEBAR_EXPANDED_WIDTH = 224;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard fontSize="small" />, color: '#059669', bg: '#ECFDF5' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Planning', path: '/planning', icon: <CalendarMonthOutlinedIcon fontSize="small" />, color: '#2563EB', bg: '#EFF6FF' },
      { label: 'Purchasing', path: '/purchases', icon: <ShoppingBagOutlinedIcon fontSize="small" />, color: '#D97706', bg: '#FFFBEB' },
      { label: 'Inward & QC', path: '/inward', icon: <MoveToInboxOutlinedIcon fontSize="small" />, color: '#0D9488', bg: '#F0FDFA' },
      { label: 'Inventory', path: '/inventory', icon: <Inventory2OutlinedIcon fontSize="small" />, color: '#6366F1', bg: '#EEF2FF' },
      { label: 'Production', path: '/production', icon: <PrecisionManufacturingOutlinedIcon fontSize="small" />, color: '#7C3AED', bg: '#F5F3FF' },
      { label: 'Shipping', path: '/shipping', icon: <LocalShippingOutlinedIcon fontSize="small" />, color: '#0284C7', bg: '#F0F9FF' },
      { label: 'Sales Orders', path: '/sales', icon: <ReceiptLongOutlinedIcon fontSize="small" />, color: '#16A34A', bg: '#F0FDF4' },
      { label: 'Sales Returns', path: '/sales/returns', icon: <AssignmentReturnOutlinedIcon fontSize="small" />, color: '#EA580C', bg: '#FFF7ED' },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { label: 'Reports', path: '/reports', icon: <BarChartOutlinedIcon fontSize="small" />, color: '#9333EA', bg: '#FAF5FF' },
    ],
  },
  {
    title: 'MASTERS',
    items: [
      { label: 'Masters', path: '/masters', icon: <CategoryOutlinedIcon fontSize="small" />, color: '#E11D48', bg: '#FFF1F2' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Notifications', path: '/notifications', icon: <NotificationsNoneOutlinedIcon fontSize="small" />, color: '#F59E0B', bg: '#FFFBEB' },
      { label: 'Audit Logs', path: '/audit-logs', icon: <HistoryEduOutlinedIcon fontSize="small" />, color: '#64748B', bg: '#F8FAFC' },
      { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon fontSize="small" />, color: '#52525B', bg: '#F4F4F5' },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentWidth = isMobile
    ? SIDEBAR_EXPANDED_WIDTH
    : collapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_EXPANDED_WIDTH;

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E4E4E7',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          px: collapsed && !isMobile ? 1.5 : 2.5,
          py: 2,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          borderBottom: '1px solid #F4F4F5',
        }}
      >
        <Box
          onClick={() => {
            navigate('/dashboard');
            if (isMobile) onCloseMobile();
          }}
          sx={{ cursor: 'pointer', overflow: 'hidden' }}
        >
          <MdpLogo compact={collapsed && !isMobile} />
        </Box>

        {!isMobile && !collapsed && (
          <Tooltip title="Collapse sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                color: '#71717A',
                border: '1px solid #E4E4E7',
                '&:hover': {
                  color: '#18181B',
                  backgroundColor: '#F4F4F5',
                },
              }}
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Navigation Sections */}
      <List
        sx={{
          flexGrow: 1,
          px: 1.2,
          py: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#E4E4E7', borderRadius: '4px' },
        }}
      >
        {navSections.map((section, sIdx) => (
          <Box key={sIdx} sx={{ mb: 1.5 }}>
            {section.title && (!collapsed || isMobile) && (
              <ListSubheader
                disableSticky
                sx={{
                  px: 1.5,
                  py: 0.5,
                  lineHeight: '1.2rem',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#A1A1AA',
                  backgroundColor: 'transparent',
                }}
              >
                {section.title}
              </ListSubheader>
            )}

            {section.items.map((item) => {
              const isMaster = item.path.startsWith('/masters');
              const isSalesOrder = item.path === '/sales';
              const isSalesReturn = item.path === '/sales/returns';

              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard' || location.pathname === '/'
                  : isSalesOrder
                  ? location.pathname === '/sales' || location.pathname.startsWith('/sales/orders') || location.pathname === '/sales/new'
                  : isSalesReturn
                  ? location.pathname === '/sales/returns'
                  : isMaster
                  ? location.pathname.startsWith('/masters')
                  : location.pathname.startsWith(item.path);

              const buttonContent = (
                <ListItemButton
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) onCloseMobile();
                  }}
                  sx={{
                    borderRadius: '8px',
                    py: 0.85,
                    px: collapsed && !isMobile ? 1.2 : 1.4,
                    mb: 0.35,
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    backgroundColor: isActive ? item.bg : 'transparent',
                    color: isActive ? item.color : '#3F3F46',
                    border: isActive ? `1px solid ${item.color}35` : '1px solid transparent',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: item.bg,
                      color: item.color,
                      '& .nav-icon': {
                        transform: 'scale(1.12)',
                        color: item.color,
                        opacity: 1,
                      },
                    },
                    ...(isActive && {
                      fontWeight: 700,
                      boxShadow: `0 2px 6px ${item.color}15`,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '18%',
                        bottom: '18%',
                        width: 3.5,
                        borderRadius: '0 3px 3px 0',
                        backgroundColor: item.color,
                      },
                    }),
                  }}
                >
                  <ListItemIcon
                    className="nav-icon"
                    sx={{
                      minWidth: collapsed && !isMobile ? 'auto' : 32,
                      color: item.color,
                      opacity: isActive ? 1 : 0.72,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {(!collapsed || isMobile) && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.835rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? item.color : '#27272A',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </ListItemButton>
              );

              if (collapsed && !isMobile) {
                return (
                  <Tooltip key={item.path} title={item.label} placement="right" arrow>
                    {buttonContent}
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
          </Box>
        ))}
      </List>

      <Divider sx={{ borderColor: '#F4F4F5' }} />

      {/* Footer / User status pill */}
      <Box sx={{ p: 1.5 }}>
        {collapsed && !isMobile ? (
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                width: '100%',
                borderRadius: '6px',
                color: '#71717A',
                '&:hover': { backgroundColor: '#F4F4F5', color: '#18181B' },
              }}
            >
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.2,
              py: 0.8,
              borderRadius: '7px',
              backgroundColor: '#FAFAF9',
              border: '1px solid #E4E4E7',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#15803D',
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3F3F46', fontSize: '0.72rem' }}>
                Unit A & B Active
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#A1A1AA', fontSize: '0.68rem' }}>
              v2.5
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_EXPANDED_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Persistent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentWidth,
          flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            border: 'none',
            transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};
