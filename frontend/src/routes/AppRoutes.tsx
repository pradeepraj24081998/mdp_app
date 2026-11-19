import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PlanningListPage } from '../features/planning/PlanningListPage';
import { PlanningCreatePage } from '../features/planning/PlanningCreatePage';
import { PurchaseListPage } from '../features/purchasing/PurchaseListPage';
import { PurchaseCreatePage } from '../features/purchasing/PurchaseCreatePage';
import { PurchaseDetailPage } from '../features/purchasing/PurchaseDetailPage';
import { ShippingListPage } from '../features/shipping/ShippingListPage';
import { InwardListPage } from '../features/inward/InwardListPage';
import { InwardVerificationPage } from '../features/inward/InwardVerificationPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { ProductionListPage } from '../features/production/ProductionListPage';
import { ProductionDetailPage } from '../features/production/ProductionDetailPage';
import { SalesOrderListPage } from '../features/sales/SalesOrderListPage';
import { SalesOrderCreatePage } from '../features/sales/SalesOrderCreatePage';
import { SalesOrderDetailPage } from '../features/sales/SalesOrderDetailPage';
import { MastersPage } from '../features/masters/MastersPage';
import { EmployeesPage } from '../features/employees/EmployeesPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { AuditLogsPage } from '../features/audit/AuditLogsPage';
import { UsersPage } from '../features/users/UsersPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Workspace Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Planning */}
        <Route path="planning" element={<PlanningListPage />} />
        <Route path="planning/new" element={<PlanningCreatePage />} />

        {/* Purchasing */}
        <Route path="purchases" element={<PurchaseListPage />} />
        <Route path="purchases/new" element={<PurchaseCreatePage />} />
        <Route path="purchases/:id" element={<PurchaseDetailPage />} />

        {/* Shipping */}
        <Route path="shipping" element={<ShippingListPage />} />

        {/* Inward Receiving & Verification */}
        <Route path="inward" element={<InwardListPage />} />
        <Route path="inward/:id/verify" element={<InwardVerificationPage />} />

        {/* Inventory Ledger & Stock */}
        <Route path="inventory" element={<InventoryPage />} />

        {/* Production */}
        <Route path="production" element={<ProductionListPage />} />
        <Route path="production/orders" element={<ProductionListPage />} />
        <Route path="production/orders/:id" element={<ProductionDetailPage />} />

        {/* Sales */}
        <Route path="sales" element={<SalesOrderListPage />} />
        <Route path="sales/orders" element={<SalesOrderListPage />} />
        <Route path="sales/returns" element={<SalesOrderListPage />} />
        <Route path="sales/new" element={<SalesOrderCreatePage />} />
        <Route path="sales/orders/new" element={<SalesOrderCreatePage />} />
        <Route path="sales/:id" element={<SalesOrderDetailPage />} />
        <Route path="sales/orders/:id" element={<SalesOrderDetailPage />} />

        {/* Masters & Catalogs */}
        <Route path="masters" element={<MastersPage />} />
        <Route path="masters/*" element={<MastersPage />} />

        {/* Redirect standalone routes to unified Master Screen */}
        <Route path="warehouses" element={<Navigate to="/masters/warehouses" replace />} />
        <Route path="employees" element={<Navigate to="/masters/employees" replace />} />
        <Route path="users" element={<Navigate to="/masters/users" replace />} />


        {/* BI Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Audit Trail */}
        <Route path="audit-logs" element={<AuditLogsPage />} />

        {/* Notifications & System Alerts */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* System Settings */}
        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
