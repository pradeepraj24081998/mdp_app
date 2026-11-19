import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const AuditLogsPage: React.FC = () => {
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', moduleFilter],
    queryFn: async () => {
      let url = '/audit-logs/?';
      if (moduleFilter) url += `module=${moduleFilter}&`;
      const res = await apiClient.get(url);
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  return (
    <Box>
      <PageHeader
        title="Compliance & Audit Trail"
        subtitle="Immutable transaction history recording all data mutations, state transitions, and user actions"
      />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ mb: 2.5, maxWidth: 280 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter by Domain Module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <MenuItem value="">-- All System Modules --</MenuItem>
              <MenuItem value="MASTERS">MASTERS</MenuItem>
              <MenuItem value="PLANNING">PLANNING</MenuItem>
              <MenuItem value="PURCHASING">PURCHASING</MenuItem>
              <MenuItem value="INWARD">INWARD</MenuItem>
              <MenuItem value="INVENTORY">INVENTORY</MenuItem>
              <MenuItem value="PRODUCTION">PRODUCTION</MenuItem>
              <MenuItem value="SHIPPING">SHIPPING</MenuItem>
              <MenuItem value="SALES">SALES</MenuItem>
              <MenuItem value="ACCOUNTS">ACCOUNTS</MenuItem>
              <MenuItem value="EMPLOYEES">EMPLOYEES</MenuItem>
              <MenuItem value="SYSTEM">SYSTEM</MenuItem>
            </TextField>
          </Box>

          {isLoading ? (
            <LoadingState rows={8} />
          ) : logs.length === 0 ? (
            <EmptyState title="No audit logs found" />
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>TIMESTAMP</TableCell>
                    <TableCell>USER ACCOUNT</TableCell>
                    <TableCell>ACTION</TableCell>
                    <TableCell>MODULE</TableCell>
                    <TableCell>TARGET ENTITY</TableCell>
                    <TableCell>IP ADDRESS</TableCell>
                    <TableCell align="center">DIFF</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {log.user_name || log.user_email || 'System / Daemon'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            fontWeight: 600,
                            bgcolor: log.action === 'CREATE' ? '#ECFDF5' : (log.action === 'APPROVE' ? '#EFF6FF' : '#F1F5F9'),
                            color: log.action === 'CREATE' ? '#059669' : (log.action === 'APPROVE' ? '#2563EB' : '#475569'),
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{log.module}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>
                        {log.object_repr || log.object_id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        {log.ip_address || '127.0.0.1'}
                      </TableCell>
                      <TableCell align="center">
                        {(log.old_value || log.new_value) && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSelectedLog(log)}
                            sx={{ fontSize: '0.72rem', py: 0.2 }}
                          >
                            Inspect
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Inspect Dialog */}
      <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Audit Change Payload</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
              PREVIOUS STATE (OLD VALUE)
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#F8FAFC', mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(selectedLog?.old_value || {}, null, 2)}</pre>
            </Paper>

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
              COMMITTED STATE (NEW VALUE)
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#F0FDF4', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(selectedLog?.new_value || {}, null, 2)}</pre>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedLog(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
