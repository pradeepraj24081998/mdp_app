import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddAlertOutlinedIcon from '@mui/icons-material/AddAlertOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { NotificationItem } from '../../types';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Unread, 2: Read

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/');
      const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.results || [];
      return list;
    },
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/notifications/${id}/mark_read/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => apiClient.post('/notifications/mark_all_read/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/notifications/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const createTestNotifMutation = useMutation({
    mutationFn: async () => {
      const types = [
        { title: 'Purchase Approval Needed', message: 'Direct PO-000002 has been submitted for Manager Review (Total: ₹8,940.00).', type: 'PURCHASE_APPROVAL' },
        { title: 'Material Received at Gate', message: 'Gate inward delivery recorded from VSN Plastics for PO-000001.', type: 'MATERIAL_RECEIVED' },
        { title: 'Low Stock Alert', message: 'Inventory for 23 Inch Tray is at 12 units (Reorder threshold: 20).', type: 'LOW_STOCK' },
        { title: 'Production Batch Completed', message: 'Batch BATCH-2026-001 completed 500 units of Sandalwood Agarbatti.', type: 'PRODUCTION_COMPLETED' },
      ];
      const randomItem = types[Math.floor(Math.random() * types.length)];
      return apiClient.post('/notifications/', {
        title: randomItem.title,
        message: randomItem.message,
        notification_type: randomItem.type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === 1) return !n.is_read;
    if (activeTab === 2) return n.is_read;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE_APPROVAL':
        return <ShoppingBagOutlinedIcon sx={{ color: '#D97706', fontSize: 18 }} />;
      case 'LOW_STOCK':
      case 'DAMAGED_MATERIAL':
        return <WarningAmberOutlinedIcon sx={{ color: '#DC2626', fontSize: 18 }} />;
      case 'MATERIAL_RECEIVED':
        return <MoveToInboxOutlinedIcon sx={{ color: '#0D9488', fontSize: 18 }} />;
      case 'PRODUCTION_COMPLETED':
        return <PrecisionManufacturingOutlinedIcon sx={{ color: '#7C3AED', fontSize: 18 }} />;
      default:
        return <ReceiptLongOutlinedIcon sx={{ color: '#2563EB', fontSize: 18 }} />;
    }
  };

  return (
    <Box>
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Real-time broadcast events, procurement approvals, stock threshold warnings, and production completions"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddAlertOutlinedIcon />}
              onClick={() => createTestNotifMutation.mutate()}
              disabled={createTestNotifMutation.isPending}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                textTransform: 'none',
                borderColor: '#E2E8F0',
                color: '#334155',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              Send Test Notification
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                sx={{
                  bgcolor: '#14532D',
                  borderRadius: '8px',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#0B3B1F' },
                }}
              >
                Mark All Read
              </Button>
            )}
          </Box>
        }
      />

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab
                label={`All (${notifications.length})`}
                sx={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'none' }}
              />
              <Tab
                label={`Unread (${unreadCount})`}
                sx={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'none' }}
              />
              <Tab
                label={`Read (${notifications.length - unreadCount})`}
                sx={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'none' }}
              />
            </Tabs>
          </Box>

          {isLoading ? (
            <LoadingState rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={activeTab === 1 ? 'No unread notifications' : 'No notifications found'}
              description={
                activeTab === 1
                  ? 'You are all caught up! There are no pending alerts requiring attention.'
                  : 'System broadcasts and workflow events will appear here.'
              }
              actionText="Generate Sample Alert"
              onAction={() => createTestNotifMutation.mutate()}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {filtered.map((notif) => (
                <Paper
                  key={notif.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    borderColor: notif.is_read ? '#E2E8F0' : '#BBF7D0',
                    bgcolor: notif.is_read ? '#FFFFFF' : '#F0FDF4',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: notif.is_read ? '#F8FAFC' : '#DCFCE7',
                        border: notif.is_read ? '1px solid #E2E8F0' : '1px solid #BBF7D0',
                        mt: 0.2,
                      }}
                    >
                      {getTypeIcon(notif.notification_type)}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notif.is_read ? 600 : 700,
                            color: '#0F172A',
                            fontSize: '0.88rem',
                          }}
                        >
                          {notif.title}
                        </Typography>
                        {!notif.is_read && (
                          <Chip
                            label="New"
                            size="small"
                            color="success"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                        <Chip
                          label={notif.notification_type.replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: '#F1F5F9',
                            color: '#475569',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', mb: 0.5 }}>
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {!notif.is_read && (
                      <Tooltip title="Mark as read" arrow>
                        <IconButton
                          size="small"
                          onClick={() => markReadMutation.mutate(notif.id)}
                          sx={{ color: '#16A34A', bgcolor: '#DCFCE7', '&:hover': { bgcolor: '#BBF7D0' } }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete notification" arrow>
                      <IconButton
                        size="small"
                        onClick={() => deleteMutation.mutate(notif.id)}
                        sx={{ color: '#94A3B8', '&:hover': { color: '#E11D48', bgcolor: '#FFF1F2' } }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
