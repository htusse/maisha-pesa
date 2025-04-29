import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import KycReview from '../../components/admin/KycReview';
import PlatformSettings from '../../components/admin/PlatformSettings';
import OrderManagement from '../../components/admin/OrderManagement';
import UserManagement from '../../components/admin/UserManagement';

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('kyc');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'kyc'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KYC Verification
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'kyc' && (
          <div>
            <h2 className="text-xl font-bold mb-4">KYC Verification</h2>
            <KycReview />
          </div>
        )}
        
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <UserManagement />
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Order Management</h2>
            <OrderManagement />
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold mb-4">System Settings</h2>
            <PlatformSettings />
          </div>
        )}
      </div>
    </div>
  );
} 