import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const KycForm = () => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    address: '',
    phoneNumber: '',
  });
  const [idFrontFile, setIdFrontFile] = useState(null);
  const [idBackFile, setIdBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);
  
  // Return null if KYC is pending
  if (currentUser?.kycStatus === 'pending') {
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    
    const fileRef = ref(storage, `kyc/${currentUser.uid}/${path}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!idFrontFile || !selfieFile) {
      toast.error('ID front and selfie are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload files to Firebase Storage
      const idFrontUrl = await uploadFile(idFrontFile, 'id_front');
      const idBackUrl = await uploadFile(idBackFile, 'id_back');
      const selfieUrl = await uploadFile(selfieFile, 'selfie');
      const addressProofUrl = await uploadFile(addressProofFile, 'address_proof');
       
      // Update user document with KYC info
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        kyc: {
          ...formData,
          idFrontUrl,
          idBackUrl,
          selfieUrl,
          addressProofUrl,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
        kycStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });
      
      toast.success('KYC documents submitted successfully!');
      
      window.location.href = '/pending-verification';
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error('Failed to submit KYC documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">KYC Verification</h2>
      <p className="mb-6 text-gray-600">
        Please provide the required information and documents to verify your identity.
        All documents must be clear, legible, and unexpired.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">ID Type</label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Document Upload</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ID Front <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, setIdFrontFile)}
                className="w-full border border-gray-300 rounded-md p-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">JPG, PNG or PDF, max 5MB</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ID Back
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, setIdBackFile)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
              <p className="text-sm text-gray-500 mt-1">JPG, PNG or PDF, max 5MB</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Selfie with ID <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setSelfieFile)}
                className="w-full border border-gray-300 rounded-md p-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">JPG or PNG, max 5MB</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Proof of Address
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, setAddressProofFile)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
              <p className="text-sm text-gray-500 mt-1">JPG, PNG or PDF, max 5MB</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary border-black border-2 text-black rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Documents'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KycForm; 