import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PortalLayout from './layouts/PortalLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import PortalDashboard from './pages/portal/Dashboard.jsx';
import Reports from './pages/portal/Reports.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import SettingsPortal from './pages/admin/SettingsPortal.jsx';
import SettingsEmail from './pages/admin/SettingsEmail.jsx';
import MenuWebsiteSettingsLayout from './pages/admin/MenuWebsiteSettingsLayout.jsx';
import MenuAddPage from './pages/admin/MenuAddPage.jsx';
import SubmenuAddPage from './pages/admin/SubmenuAddPage.jsx';
import Pages from './pages/admin/Pages.jsx';
import SettingsLogs from './pages/admin/SettingsLogs.jsx';
import States from './pages/admin/States.jsx';
import Locations from './pages/admin/Locations.jsx';
import ProjectAdd from './pages/admin/ProjectAdd.jsx';
import ProjectManage from './pages/admin/ProjectManage.jsx';
import ProjectCategories from './pages/admin/ProjectCategories.jsx';
import Users from './pages/admin/Users.jsx';
import Roles from './pages/admin/Roles.jsx';
import './styles/theme.css';

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PortalLayout />}>
            <Route index element={<PortalDashboard />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="settings" element={<Navigate to="/admin/settings/portal" replace />} />
              <Route path="settings/portal" element={<SettingsPortal />} />
              <Route path="settings/email" element={<SettingsEmail />} />
              <Route path="settings/menus" element={<Navigate to="/admin/settings/menu-website/add-menu" replace />} />
              <Route path="settings/menu-website" element={<MenuWebsiteSettingsLayout />}>
                <Route index element={<Navigate to="add-menu" replace />} />
                <Route path="add-menu" element={<MenuAddPage />} />
                <Route path="add-submenu" element={<SubmenuAddPage />} />
              </Route>
              <Route path="settings/pages" element={<Pages />} />
              <Route path="settings/logs" element={<SettingsLogs />} />
              <Route path="states" element={<States />} />
              <Route path="locations" element={<Locations />} />
              <Route path="projects" element={<Navigate to="/admin/projects/manage" replace />} />
              <Route path="projects/manage" element={<ProjectManage />} />
              <Route path="projects/new" element={<ProjectAdd />} />
              <Route path="projects/categories" element={<ProjectCategories />} />
              <Route path="projects/approve" element={<Navigate to="/admin/projects/manage" replace />} />
              <Route path="users" element={<Users />} />
              <Route path="roles" element={<Roles />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
