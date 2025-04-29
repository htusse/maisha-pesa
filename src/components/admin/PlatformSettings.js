import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-toastify';

const PlatformSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractorShare: 0,
    brokerShare: 0,
    investorShare: 0,
    adminShare: 0,
    fundingConfirmationDeadlineDays: 7
  });
  const [totalPercentage, setTotalPercentage] = useState(0);

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        contractorShare: settings.revenueShares.contractor * 100,
        brokerShare: settings.revenueShares.broker * 100,
        investorShare: settings.revenueShares.investor * 100,
        adminShare: settings.revenueShares.admin * 100,
        fundingConfirmationDeadlineDays: settings.fundingConfirmationDeadlineDays || 7
      });
    }
  }, [settings]);

  // Calculate total percentage whenever form data changes
  useEffect(() => {
    const total = 
      parseFloat(formData.contractorShare || 0) + 
      parseFloat(formData.brokerShare || 0) + 
      parseFloat(formData.investorShare || 0) + 
      parseFloat(formData.adminShare || 0);
    
    setTotalPercentage(total);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate total percentage
    if (totalPercentage !== 100) {
      toast.error(`Total percentage must be 100%. Current total: ${totalPercentage}%`);
      return;
    }
    
    // Validate funding confirmation deadline days
    const deadlineDays = parseInt(formData.fundingConfirmationDeadlineDays);
    if (isNaN(deadlineDays) || deadlineDays < 1 || deadlineDays > 30) {
      toast.error('Funding confirmation deadline must be between 1 and 30 days');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert percentages to decimals for storage
      const updatedSettings = {
        ...settings,
        revenueShares: {
          contractor: parseFloat(formData.contractorShare) / 100,
          broker: parseFloat(formData.brokerShare) / 100,
          investor: parseFloat(formData.investorShare) / 100,
          admin: parseFloat(formData.adminShare) / 100
        },
        fundingConfirmationDeadlineDays: deadlineDays
      };
      
      await updateSettings(updatedSettings);
      toast.success('Platform settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-6">Platform Settings</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Share Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contractorShare">
                Contractor Share (%)
              </label>
              <input
                id="contractorShare"
                name="contractorShare"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.contractorShare}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brokerShare">
                Broker Share (%)
              </label>
              <input
                id="brokerShare"
                name="brokerShare"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.brokerShare}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="investorShare">
                Investor Share (%)
              </label>
              <input
                id="investorShare"
                name="investorShare"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.investorShare}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminShare">
                Admin Share (%)
              </label>
              <input
                id="adminShare"
                name="adminShare"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.adminShare}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className={`mb-6 p-4 rounded-md ${totalPercentage === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p className="font-medium">Total: {totalPercentage}%</p>
            {totalPercentage !== 100 && (
              <p className="text-sm mt-1">Total percentage must equal 100%</p>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Bidding and Funding Settings</h3>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fundingConfirmationDeadlineDays">
              Funding Confirmation Deadline (Days)
            </label>
            <div className="flex items-center">
              <input
                id="fundingConfirmationDeadlineDays"
                name="fundingConfirmationDeadlineDays"
                type="number"
                min="1"
                max="30"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.fundingConfirmationDeadlineDays}
                onChange={handleChange}
                required
              />
              <span className="ml-2 text-gray-600 text-sm">days</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Number of days investors have to confirm funding after being selected. If not confirmed within this period, the order will return to bidding status.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || totalPercentage !== 100}
            className={`bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              (loading || totalPercentage !== 100) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlatformSettings; 