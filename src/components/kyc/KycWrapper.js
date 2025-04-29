import React from 'react';
import { useAuth } from '../../context/AuthContext';
import KycStatus from './KycStatus';

const KycWrapper = ({ children }) => {
  const { currentUser } = useAuth();
  
  // If the user is an admin, don't show KYC status
  if (currentUser && currentUser.role === 'admin') {
    return children;
  }
  
  return (
    <div>
      <KycStatus />
      {children}
    </div>
  );
};

export default KycWrapper; 