import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KycForm from '../components/kyc/KycForm';

const KycPage = () => {
  const { currentUser, USER_ROLES } = useAuth();

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is an admin, redirect to dashboard
  if (currentUser.role === USER_ROLES.ADMIN) {
    return <Navigate to="/dashboard" />;
  }

  // If user is already verified, redirect to dashboard
  if (currentUser.isVerified) {
    return <Navigate to="/dashboard" />;
  }

  // If KYC is pending, redirect to pending verification page
  if (currentUser.kycStatus === 'pending') {
    return <Navigate to="/pending-verification" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Identity Verification</h1>
      <KycForm />
    </div>
  );
};

export default KycPage; 