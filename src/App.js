import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ChatProvider } from './context/ChatContext';
import { SettingsProvider } from './context/SettingsContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PendingVerification from './pages/PendingVerification';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';
import KycPage from './pages/KycPage';
import Unauthorized from './pages/Unauthorized';
import AdminPanel from './pages/admin/AdminPanel';
import NotFound from './pages/NotFound';
import { USER_ROLES } from './context/AuthContext';
import Messages from './pages/Messages';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <OrderProvider>
            <ChatProvider>
              <Layout>
                {/* Toast notifications for user feedback */}
                <ToastContainer position="top-right" autoClose={3000} />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/signup" element={<SignupForm />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* KYC Routes - for verification flow */}
                  <Route path="/pending-verification" element={<PendingVerification />} />
                  <Route path="/kyc" element={<KycPage />} />
                  
                  {/* Protected Routes - only available to authenticated users */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Orders Routes */}
                  <Route 
                    path="/orders" 
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/orders/:id" 
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/orders/new" 
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.BROKER]}>
                        {/* Only brokers can create orders */}
                        <CreateOrder />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Chat Routes */}
                  <Route 
                    path="/messages" 
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/messages/:chatId" 
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin Routes - special access */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminPanel />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 Page - for non-existent routes */}
                  <Route path="/not-found" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/not-found" />} />
                </Routes>
              </Layout>
            </ChatProvider>
          </OrderProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
