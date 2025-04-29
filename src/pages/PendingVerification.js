import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PendingVerification() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Format the submission date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-yellow-100 p-4 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-center mt-4">Account Pending Verification</h1>
      </div>
      
      <div className="mb-6 text-center">
        <p className="text-gray-700 mb-4">
          Hello, <span className="font-semibold">{currentUser?.fullName}</span>
        </p>
        <p className="text-gray-700 mb-4">
          Your account is currently pending KYC verification by an admin. This process typically takes 1-2 business days.
        </p>
        {currentUser?.kyc?.submittedAt && (
          <p className="text-gray-700 mb-4">
            Documents submitted on: <span className="font-medium">{formatDate(currentUser.kyc.submittedAt)}</span>
          </p>
        )}
        <p className="text-gray-700 mb-4">
          Once verified, you'll be able to access the platform as a <span className="capitalize font-medium">{currentUser?.role?.replace('_', ' ')}</span>.
        </p>
      </div>
      
      {/* Document Submission Details */}
      {currentUser?.kyc && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Submitted Documents</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ID Document: <span className="capitalize">{currentUser.kyc.idType?.replace('_', ' ')}</span>
            </li>
            {currentUser.kyc.idFrontUrl && (
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ID Front: Uploaded
              </li>
            )}
            {currentUser.kyc.idBackUrl && (
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ID Back: Uploaded
              </li>
            )}
            {currentUser.kyc.selfieUrl && (
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Selfie with ID: Uploaded
              </li>
            )}
            {currentUser.kyc.addressProofUrl && (
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Proof of Address: Uploaded
              </li>
            )}
          </ul>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between">
          <Link to="/" className="text-primary-600 hover:text-primary-800">
            Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
} 