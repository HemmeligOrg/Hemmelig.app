import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { SecretsPage } from './pages/Dashboard/SecretsPage';
import { AccountPage } from './pages/Dashboard/AccountPage';
import { AnalyticsPage } from './pages/Dashboard/AnalyticsPage';
import { UsersPage } from './pages/Dashboard/UsersPage';
import { InstancePage } from './pages/Dashboard/InstancePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          {/* Content */}
          <div className="relative">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={
                <DashboardLayout>
                  <SecretsPage />
                </DashboardLayout>
              } />
              <Route path="/dashboard/account" element={
                <DashboardLayout>
                  <AccountPage />
                </DashboardLayout>
              } />
              <Route path="/dashboard/analytics" element={
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              } />
              <Route path="/dashboard/users" element={
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              } />
              <Route path="/dashboard/instance" element={
                <DashboardLayout>
                  <InstancePage />
                </DashboardLayout>
              } />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;