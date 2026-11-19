import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Button,
  Popover,
  List,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { useNavigate } from 'react-router-dom';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { NotificationItem } from '../../types';

interface AppHeaderProps {
  onOpenSearch: () => void;
  onToggleMobile?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenSearch,
  onToggleMobile,
  onToggleCollapse,
}) => {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications/');
      if (res.data.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
        setNotifications(list.slice(0, 8));
        setUnreadCount(list.filter((n: NotificationItem) => !n.is_read).length);
      }
    } catch {
      // Quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark_all_read/');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const userInitial = user?.first_name ? user.first_name[0].toUpperCase() : 'A';
  const roleName = roles?.[0]?.replace('_', ' ') || 'Super Admin';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4E4E7',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          minHeight: '60px !important',
          gap: 2,
        }}
      >
        {/* Left Section: Mobile Menu & Search Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={onToggleMobile}
            size="small"
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: '#3F3F46',
              border: '1px solid #E4E4E7',
              borderRadius: '7px',
            }}
          >
            <MenuRoundedIcon fontSize="small" />
          </IconButton>

          {/* Command Palette Button (Ctrl + K) */}
          <Button
            onClick={onOpenSearch}
            variant="outlined"
            size="small"
            startIcon={<SearchRoundedIcon sx={{ color: '#71717A', fontSize: 18 }} />}
            sx={{
              borderColor: '#E4E4E7',
              color: '#71717A',
              textTransform: 'none',
              fontSize: '0.82rem',
              fontWeight: 500,
              px: 1.8,
              py: 0.6,
              borderRadius: '8px',
              backgroundColor: '#FAFAF9',
              width: { xs: 200, sm: 280, md: 340 },
              justifyContent: 'space-between',
              '&:hover': {
                borderColor: '#D4D4D8',
                backgroundColor: '#FFFFFF',
              },
            }}
          >
            <span>Search anything...</span>
            <Chip
              label="Ctrl K"
              size="small"
              sx={{
                height: 19,
                fontSize: '0.66rem',
                fontWeight: 600,
                bgcolor: '#FFFFFF',
                border: '1px solid #E4E4E7',
                color: '#52525B',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Button>
          {/* Active Factory Plant Pill */}
          <Chip
            size="small"
            icon={<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16A34A', boxShadow: '0 0 6px #22C55E', mx: 0.5 }} />}
            label="Plant 1 & 2: Active"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              bgcolor: '#F0FDF4',
              color: '#166534',
              fontWeight: 700,
              fontSize: '0.72rem',
              border: '1px solid #BBF7D0',
              height: 26,
            }}
          />
        </Box>

        {/* Right Section: Help, Notifications, User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Help Center */}
          <Tooltip title="Help & Documentation">
            <IconButton
              size="small"
              sx={{
                color: '#71717A',
                borderRadius: '8px',
                width: 34,
                height: 34,
                border: '1px solid #E4E4E7',
                '&:hover': { color: '#18181B', backgroundColor: '#FAFAF9' },
              }}
            >
              <HelpOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{
                color: '#71717A',
                borderRadius: '8px',
                width: 34,
                height: 34,
                border: '1px solid #E4E4E7',
                '&:hover': { color: '#18181B', backgroundColor: '#FAFAF9' },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: 16,
                    minWidth: 16,
                    fontWeight: 700,
                    bgcolor: '#D97706',
                    color: '#FFFFFF',
                    boxShadow: '0 0 8px rgba(217, 119, 6, 0.4)',
                  },
                }}
              >
                <NotificationsNoneOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ my: 1.5, borderColor: '#E4E4E7' }} />

          {/* User Profile */}
          <Button
            onClick={(e) => setUserAnchor(e.currentTarget)}
            size="small"
            endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" sx={{ color: '#71717A' }} />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              p: '4px 10px 4px 6px',
              color: '#18181B',
              border: '1px solid transparent',
              '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #14532D 0%, #059669 100%)',
                color: '#FFFFFF',
                boxShadow: '0 0 0 2px #DCFCE7',
                mr: 1,
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#09090B', lineHeight: 1.2, fontSize: '0.82rem' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Administrator'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontSize: '0.68rem', fontWeight: 600 }}>
                {roleName}
              </Typography>
            </Box>
          </Button>

          {/* User Menu */}
          <Menu
            anchorEl={userAnchor}
            open={Boolean(userAnchor)}
            onClose={() => setUserAnchor(null)}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 200,
                  borderRadius: '9px',
                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E4E4E7',
                  mt: 0.5,
                  p: 0.5,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 1.8, py: 1.2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#18181B' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Administrator'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717A' }}>
                {user?.email || 'admin@dmp.com'}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                navigate('/settings');
              }}
              sx={{
                borderRadius: '6px',
                color: '#3F3F46',
                fontSize: '0.84rem',
                fontWeight: 500,
                gap: 1,
                py: 0.8,
                '&:hover': { bgcolor: '#F4F4F5' },
              }}
            >
              <SettingsOutlinedIcon fontSize="small" sx={{ color: '#71717A' }} />
              System Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                logout();
              }}
              sx={{
                borderRadius: '6px',
                color: '#B91C1C',
                fontSize: '0.84rem',
                fontWeight: 500,
                gap: 1,
                py: 0.8,
                '&:hover': { bgcolor: '#FEF2F2' },
              }}
            >
              <LogoutRoundedIcon fontSize="small" />
              Sign Out
            </MenuItem>
          </Menu>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  width: { xs: 300, sm: 360 },
                  maxHeight: 440,
                  borderRadius: '10px',
                  boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E4E4E7',
                  mt: 0.5,
                },
              },
            }}
          >
            <Box
              sx={{
                p: 1.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #E4E4E7',
                backgroundColor: '#FAFAF9',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181B' }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Typography>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllRead}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', color: '#14532D' }}
                >
                  Mark all as read
                </Button>
              )}
            </Box>

            <List sx={{ p: 0, maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#71717A' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                    No unread notifications
                  </Typography>
                </Box>
              ) : (
                notifications.map((n) => (
                  <ListItemButton
                    key={n.id}
                    sx={{
                      borderBottom: '1px solid #F4F4F5',
                      py: 1.2,
                      px: 2,
                      bgcolor: n.is_read ? 'transparent' : '#F0FDF4',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: n.is_read ? 500 : 600, color: '#18181B', fontSize: '0.82rem' }}
                        >
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#71717A', display: 'block', mt: 0.2 }}>
                          {n.message}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))
              )}
            </List>
            <Box sx={{ p: 1, borderTop: '1px solid #E4E4E7', bgcolor: '#FAFAF9', textAlign: 'center' }}>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  setNotifAnchor(null);
                  navigate('/notifications');
                }}
                sx={{ fontSize: '0.78rem', textTransform: 'none', color: '#15803D', fontWeight: 600 }}
              >
                View All Notifications →
              </Button>
            </Box>
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
