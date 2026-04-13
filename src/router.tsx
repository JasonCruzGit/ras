import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { LoginPage } from './views/LoginPage'
import { DashboardPage } from './views/DashboardPage'
import { DocumentsPage } from './views/DocumentsPage'
import { DocumentDetailPage } from './views/DocumentDetailPage'
import { NewDocumentPage } from './views/NewDocumentPage'
import { InboxPage } from './views/InboxPage'
import { RequireAuth } from './auth/RequireAuth'
import { RequireRole } from './auth/RequireRole'
import { AdminDepartmentsPage } from './views/admin/AdminDepartmentsPage'
import { AdminUsersPage } from './views/admin/AdminUsersPage'
import { ActionSlipPage } from './views/ActionSlipPage'
import { ActionSlipPreviewPage } from './views/ActionSlipPreviewPage'
import { HardcopyUploadPage } from './views/HardcopyUploadPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/print/new',
    element: (
      <RequireAuth>
        <ActionSlipPreviewPage />
      </RequireAuth>
    ),
  },
  {
    path: '/print/documents/:id',
    element: (
      <RequireAuth>
        <ActionSlipPage />
      </RequireAuth>
    ),
  },
  {
    path: '/hardcopy-upload/:token',
    element: <HardcopyUploadPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'documents/new', element: <NewDocumentPage /> },
      { path: 'documents/:id', element: <DocumentDetailPage /> },
      { path: 'inbox', element: <InboxPage /> },
      {
        path: 'admin/departments',
        element: (
          <RequireRole role="admin">
            <AdminDepartmentsPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <RequireRole role="admin">
            <AdminUsersPage />
          </RequireRole>
        ),
      },
    ],
  },
])

