import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser } = useAuth();

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is admin, they don't need KYC verification
  if (currentUser.role === 'admin') {
    // If roles are specified and admin role is not allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/unauthorized" />;
    }
    return children;
  }

  // If user hasn't submitted KYC documents yet
  if (!currentUser.kycStatus && !currentUser.isVerified) {
    return <Navigate to="/kyc" />;
  }

  // If user has pending KYC verification
  if (currentUser.kycStatus === 'pending') {
    return <Navigate to="/pending-verification" />;
  }

  // If user's KYC was rejected
  if (currentUser.kycStatus === 'rejected') {
    return <Navigate to="/kyc" />;
  }

  // If user is not verified yet
  if (!currentUser.isVerified) {
    return <Navigate to="/pending-verification" />;
  }

  // If roles are specified and user's role is not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
} 