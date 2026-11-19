import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: invReport = [], isLoading: loadingInv } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/inventory/');
      return res.data?.data ?? res.data ?? [];
    },
    enabled: activeTab === 0,
  });

  const { data: purReport = [], isLoading: loadingPur } = useQuery({
    queryKey: ['report-purchases', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/purchases/?start_date=${startDate}&end_date=${endDate}`);
      return res.data?.data ?? res.data ?? [];
    },
    enabled: activeTab === 1,
  });

  const { data: salesReport = [], isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/sales/?start_date=${startDate}&end_date=${endDate}`);
      return res.data?.data ?? res.data ?? [];
    },
    enabled: activeTab === 2,
  });

  const handleExportCSV = (reportType: string) => {
    let url = `/reports/${reportType}/?export=csv`;
    if (startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }
    window.open(`${apiClient.defaults.baseURL}${url}`, '_blank');
  };

  return (
    <Box>
      <PageHeader
        title="Business Intelligence Reports"
        subtitle="Exportable summaries for inventory balances, purchasing commitments, and sales revenue"
        action={
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => handleExportCSV(activeTab === 0 ? 'inventory' : (activeTab === 1 ? 'purchases' : 'sales'))}
          >
            Export to CSV
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label="Current Stock Matrix" sx={{ fontWeight: 600 }} />
              <Tab label="Purchase Summary" sx={{ fontWeight: 600 }} />
              <Tab label="Sales Revenue" sx={{ fontWeight: 600 }} />
            </Tabs>

            {activeTab !== 0 && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField
                  size="small"
                  type="date"
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To Date"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {/* Inventory Stock Tab */}
          {activeTab === 0 && (
            loadingInv ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ITEM CODE</TableCell>
                      <TableCell>ITEM NAME</TableCell>
                      <TableCell>LOCATION / UNIT</TableCell>
                      <TableCell align="right">USABLE QUANTITY</TableCell>
                      <TableCell align="right">RESERVED</TableCell>
                      <TableCell align="right">QUARANTINED</TableCell>
                      <TableCell>UOM</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invReport.map((row: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{row.item_code}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{row.item_name}</TableCell>
                        <TableCell>{row.location}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                          {Number(row.usable_quantity).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{Number(row.reserved_quantity).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#DC2626' }}>
                          {Number(row.quarantined_quantity).toLocaleString()}
                        </TableCell>
                        <TableCell>{row.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* Purchase Summary Tab */}
          {activeTab === 1 && (
            loadingPur ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>PO NUMBER</TableCell>
                      <TableCell>VENDOR</TableCell>
                      <TableCell>DATE</TableCell>
                      <TableCell align="right">SUBTOTAL</TableCell>
                      <TableCell align="right">TAX</TableCell>
                      <TableCell align="right">GRAND TOTAL</TableCell>
                      <TableCell>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purReport.map((row: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{row.purchase_number}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{row.vendor}</TableCell>
                        <TableCell>{row.purchase_date}</TableCell>
                        <TableCell align="right">₹{Number(row.subtotal).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{Number(row.tax).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          ₹{Number(row.grand_total).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* Sales Revenue Tab */}
          {activeTab === 2 && (
            loadingSales ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ORDER NUMBER</TableCell>
                      <TableCell>CUSTOMER / DEALER</TableCell>
                      <TableCell>ORDER DATE</TableCell>
                      <TableCell align="right">ORDER VALUE</TableCell>
                      <TableCell align="right">PAID AMOUNT</TableCell>
                      <TableCell align="right">OUTSTANDING</TableCell>
                      <TableCell>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesReport.map((row: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{row.order_number}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{row.customer}</TableCell>
                        <TableCell>{row.order_date}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{Number(row.grand_total).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#059669', fontWeight: 600 }}>
                          ₹{Number(row.paid_amount).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: Number(row.balance) > 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                          ₹{Number(row.balance).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
