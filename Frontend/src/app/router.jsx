import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth, RequirePermission } from './guards/RequireAuth';

import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { AcceptInvitePage } from '../features/auth/AcceptInvitePage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AssetListPage } from '../features/assets/AssetListPage';
import { AssetFormPage } from '../features/assets/AssetFormPage';
import { AssetDetailPage } from '../features/assets/AssetDetailPage';
import { MapPage } from '../features/map/MapPage';
import { WorkOrdersPage } from '../features/workorders/WorkOrdersPage';
import { PublicReportPage } from '../features/reports/PublicReportPage';
import { ReportStatusPage } from '../features/reports/ReportStatusPage';
import { StaffReportsPage } from '../features/reports/StaffReportsPage';
import { PublicAssetPage } from '../features/public/PublicAssetPage';
import { QrScanPage } from '../features/scan/QrScanPage';
import { UsersPage } from '../features/admin/UsersPage';
import { ZonesPage, CategoriesPage } from '../features/admin/ZonesPage';
import { AuditLogPage } from '../features/admin/AuditLogPage';
import { ForbiddenPage, NotFoundPage } from '../features/admin/ForbiddenPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/signup',
    element: <RegisterPage />
  },
  {
    path: '/accept-invite',
    element: <AcceptInvitePage />
  },
  {
    path: '/report',
    element: <PublicReportPage />
  },
  {
    path: '/report/:code',
    element: <ReportStatusPage />
  },
  {
    path: '/a/:assetCode',
    element: <PublicAssetPage />
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <RequirePermission perm="dashboard:read">
            <DashboardPage />
          </RequirePermission>
        )
      },
      {
        path: 'map',
        element: (
          <RequirePermission perm="asset:read">
            <MapPage />
          </RequirePermission>
        )
      },
      {
        path: 'assets',
        element: (
          <RequirePermission perm="asset:read">
            <AssetListPage />
          </RequirePermission>
        )
      },
      {
        path: 'assets/new',
        element: (
          <RequirePermission perm="asset:create">
            <AssetFormPage />
          </RequirePermission>
        )
      },
      {
        path: 'assets/:id',
        element: (
          <RequirePermission perm="asset:read">
            <AssetDetailPage />
          </RequirePermission>
        )
      },
      {
        path: 'scan',
        element: (
          <RequirePermission perm="asset:read">
            <QrScanPage />
          </RequirePermission>
        )
      },
      {
        path: 'work-orders',
        element: (
          <RequirePermission perm="workorder:read">
            <WorkOrdersPage />
          </RequirePermission>
        )
      },
      {
        path: 'reports/staff',
        element: (
          <RequirePermission perm="report:read">
            <StaffReportsPage />
          </RequirePermission>
        )
      },
      {
        path: 'admin/users',
        element: (
          <RequirePermission perm="user:read">
            <UsersPage />
          </RequirePermission>
        )
      },
      {
        path: 'admin/zones',
        element: (
          <RequirePermission perm="zone:manage">
            <ZonesPage />
          </RequirePermission>
        )
      },
      {
        path: 'admin/categories',
        element: (
          <RequirePermission perm="category:manage">
            <CategoriesPage />
          </RequirePermission>
        )
      },
      {
        path: 'admin/audit',
        element: (
          <RequirePermission perm="audit:read">
            <AuditLogPage />
          </RequirePermission>
        )
      },
      {
        path: '403',
        element: <ForbiddenPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);
