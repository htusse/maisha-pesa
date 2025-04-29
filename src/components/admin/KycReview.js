import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const KycReview = () => {
  const [pendingKyc, setPendingKyc] = useState([]);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all users with pending KYC
  useEffect(() => {
    const fetchPendingKyc = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("kycStatus", "==", "pending"));
        const querySnapshot = await getDocs(q);
        
        const pendingKycData = [];
        querySnapshot.forEach((doc) => {
          pendingKycData.push({ id: doc.id, ...doc.data() });
        });
        
        setPendingKyc(pendingKycData);
      } catch (error) {
        console.error('Error fetching pending KYC:', error);
        toast.error('Failed to fetch pending KYC applications');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingKyc();
  }, []);

  const handleApprove = async (userId) => {
    if (!userId || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        isVerified: true,
        kycStatus: 'approved',
        'kyc.status': 'approved',
        'kyc.reviewedAt': new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setPendingKyc(pendingKyc.filter(user => user.id !== userId));
      setSelectedKyc(null);
      
      toast.success('KYC application approved successfully');
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error('Failed to approve KYC application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (userId) => {
    if (!userId || isProcessing || !rejectionReason.trim()) {
      if (!rejectionReason.trim()) {
        toast.error('Please provide a reason for rejection');
      }
      return;
    }
    
    try {
      setIsProcessing(true);
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        kycStatus: 'rejected',
        'kyc.status': 'rejected',
        'kyc.rejectionReason': rejectionReason,
        'kyc.reviewedAt': new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setPendingKyc(pendingKyc.filter(user => user.id !== userId));
      setSelectedKyc(null);
      setRejectionReason('');
      
      toast.success('KYC application rejected');
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error('Failed to reject KYC application');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format the date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Display when there are no pending KYC applications
  if (pendingKyc.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Pending Applications</h3>
        <p className="mt-1 text-gray-500">There are no pending KYC applications to review at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left panel - User list */}
        <div className="md:w-1/3 border-r border-gray-200 overflow-y-auto p-4">
          <h3 className="font-medium text-lg mb-4">Pending KYC Applications ({pendingKyc.length})</h3>
          <ul className="divide-y divide-gray-200">
            {pendingKyc.map(user => (
              <li key={user.id} className="py-3">
                <button
                  onClick={() => setSelectedKyc(user)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${selectedKyc?.id === user.id ? 'bg-primary-50 text-primary' : 'hover:bg-gray-100'}`}
                >
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-sm text-gray-400 flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(user.kyc?.submittedAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right panel - KYC details */}
        <div className="md:w-2/3 p-6 overflow-y-auto">
          {selectedKyc ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{selectedKyc.fullName}</h3>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  {selectedKyc.role?.replace('_', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p>{selectedKyc.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                  <p>{selectedKyc.kyc?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">ID Type</h4>
                  <p className="capitalize">{selectedKyc.kyc?.idType?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">ID Number</h4>
                  <p>{selectedKyc.kyc?.idNumber || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                  <p>{selectedKyc.kyc?.address || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Submitted On</h4>
                  <p>{formatDate(selectedKyc.kyc?.submittedAt)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedKyc.kyc?.idFrontUrl && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">ID Front</h5>
                      <a 
                        href={selectedKyc.kyc.idFrontUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img 
                          src={selectedKyc.kyc.idFrontUrl} 
                          alt="ID Front" 
                          className="h-32 w-auto object-cover border rounded-md hover:opacity-80 transition"
                        />
                      </a>
                    </div>
                  )}
                  
                  {selectedKyc.kyc?.idBackUrl && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">ID Back</h5>
                      <a 
                        href={selectedKyc.kyc.idBackUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img 
                          src={selectedKyc.kyc.idBackUrl} 
                          alt="ID Back" 
                          className="h-32 w-auto object-cover border rounded-md hover:opacity-80 transition"
                        />
                      </a>
                    </div>
                  )}
                  
                  {selectedKyc.kyc?.selfieUrl && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Selfie with ID</h5>
                      <a 
                        href={selectedKyc.kyc.selfieUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img 
                          src={selectedKyc.kyc.selfieUrl} 
                          alt="Selfie with ID" 
                          className="h-32 w-auto object-cover border rounded-md hover:opacity-80 transition"
                        />
                      </a>
                    </div>
                  )}
                  
                  {selectedKyc.kyc?.addressProofUrl && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Proof of Address</h5>
                      <a 
                        href={selectedKyc.kyc.addressProofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img 
                          src={selectedKyc.kyc.addressProofUrl} 
                          alt="Proof of Address" 
                          className="h-32 w-auto object-cover border rounded-md hover:opacity-80 transition"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium mb-3">Application Decision</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (required if rejecting)
                  </label>
                  <textarea
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleReject(selectedKyc.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedKyc.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-primary text-black rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Select a KYC application to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycReview; 