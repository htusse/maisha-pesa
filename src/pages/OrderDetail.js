import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { toast } from 'react-toastify';

export default function OrderDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { respondToOrder, submitBid, confirmFunding, allocateItems, markItemsReady, completeDelivery, updateSourcingProgress, finalizeOrder, updateOrderStatus, ORDER_STATUS } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidTerms, setBidTerms] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [allocationItems, setAllocationItems] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [timeRemainingClass, setTimeRemainingClass] = useState('');
  const [sourcingProgress, setSourcingProgress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          
          // Fetch client details
          let clientData = null;
          if (orderData.clientId) {
            const clientRef = doc(db, 'users', orderData.clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
              clientData = clientSnap.data();
            }
          }
          
          setOrder({
            id: orderSnap.id,
            ...orderData,
            clientName: clientData ? clientData.fullName : 'Unknown',
            clientEmail: clientData ? clientData.email : null
          });
          
          // Pre-populate allocation items if they exist
          if (orderData.sourcing && orderData.sourcing.items) {
            setAllocationItems(orderData.sourcing.items);
          } else if (orderData.items) {
            setAllocationItems(orderData.items.map(item => ({
              ...item,
              allocated: true,
              source: '',
              price: ''
            })));
          }
        } else {
          // Order not found
          toast.error('Order not found');
          navigate('/orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Error loading order details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id, navigate]);

  // Add function to format remaining time
  const formatTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff <= 0) {
      return 'Deadline passed';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0) timeString += `${hours}h `;
    timeString += `${minutes}m`;

    return timeString;
  };

  // Update useEffect to handle countdown
  useEffect(() => {
    if (!order?.biddingDeadline) return;

    const updateTimeRemaining = () => {
      const remaining = formatTimeRemaining(order.biddingDeadline);
      setTimeRemaining(remaining);
      
      const now = new Date();
      const deadlineDate = new Date(order.biddingDeadline);
      const diff = deadlineDate - now;
      
      // Set color class based on remaining time
      if (diff <= 0) {
        setTimeRemainingClass('text-red-600');
      } else if (diff <= 24 * 60 * 60 * 1000) { // Less than 24 hours
        setTimeRemainingClass('text-orange-600');
      } else {
        setTimeRemainingClass('text-green-600');
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every 1 minute
    
    return () => clearInterval(interval);
  }, [order?.biddingDeadline]);

  // Update time remaining for funding confirmation
  useEffect(() => {
    if (order?.status === ORDER_STATUS.FUNDED && 
        order.funding?.confirmationDeadline && 
        order.funding?.pendingConfirmation) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const deadline = new Date(order.funding.confirmationDeadline);
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeRemaining('Deadline passed');
          setTimeRemainingClass('text-red-600');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        timeString += `${minutes}m`;

        setTimeRemaining(timeString);
        
        // Set color based on time remaining
        if (days >= 2) {
          setTimeRemainingClass('text-green-600');
        } else if (days >= 1) {
          setTimeRemainingClass('text-yellow-600');
        } else {
          setTimeRemainingClass('text-red-600');
        }
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every 1minute
      return () => clearInterval(interval);
    }
  }, [order]);

  const handleApprove = async () => {
    try {
      await respondToOrder(id, true);
      toast.success('Order approved successfully');
      // Update local state
      setOrder(prev => ({ ...prev, status: ORDER_STATUS.BIDDING }));
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    
    try {
      await respondToOrder(id, false, rejectionReason);
      toast.success('Order rejected');
      // Update local state
      setOrder(prev => ({ 
        ...prev, 
        status: ORDER_STATUS.REJECTED,
        rejectionReason
      }));
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.warning('Please enter a valid bid amount');
      return;
    }
    
    // Check if this is outbidding the current highest bid
    if (order.highestBid && parseFloat(bidAmount) <= order.highestBid.amount) {
      toast.warning(`Your bid must be higher than the current highest bid of $${order.highestBid.amount}`);
      return;
    }
    
    try {
      setBidLoading(true);
      await submitBid(id, parseFloat(bidAmount), bidTerms);
      toast.success('Bid submitted successfully');
      // Refresh the order to show the new bid
      const orderRef = doc(db, 'orders', id);
      const orderSnap = await getDoc(orderRef);
      setOrder({
        id: orderSnap.id,
        ...orderSnap.data()
      });
      // Reset form
      setBidAmount('');
      setBidTerms('');
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast.error('Failed to submit bid');
    } finally {
      setBidLoading(false);
    }
  };

  const handleConfirmFunding = async () => {
    try {
      await confirmFunding(id);
      toast.success('Funding confirmed successfully');
      // Update local state
      setOrder(prev => ({
        ...prev,
        status: ORDER_STATUS.FUNDING_CONFIRMED,
        funding: {
          ...prev.funding,
          funded: true,
          pendingConfirmation: false,
          fundedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error confirming funding:', error);
      toast.error('Failed to confirm funding');
    }
  };

  const handleAllocateItems = async () => {
    try {
      // Check if all items are properly allocated
      const validAllocation = allocationItems.every(item => 
        item.allocated && item.source && item.price && parseFloat(item.price) > 0
      );
      
      if (!validAllocation) {
        toast.warning('Please complete all allocation details for each item');
        return;
      }
      
      await allocateItems(id, allocationItems);
      toast.success('Items allocated successfully');
      // Update local state
      setOrder(prev => ({
        ...prev,
        status: ORDER_STATUS.SOURCING,
        sourcing: {
          ...prev.sourcing,
          sourcingAgentId: currentUser.uid,
          sourcingAgentName: currentUser.fullName,
          items: allocationItems,
          startedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error allocating items:', error);
      toast.error('Failed to allocate items');
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      // Verify all items are ready
      const allItemsReady = order.sourcing?.items?.every(item => item.ready);
      if (!allItemsReady) {
        toast.warning('All items must be marked as ready before completing delivery');
        return;
      }

      // Verify user is the sourcing agent
      if (order.sourcing?.sourcingAgentId !== currentUser.uid) {
        toast.error('Only the assigned sourcing agent can complete delivery');
        return;
      }

      // Verify order is in correct status
      if (order.status !== ORDER_STATUS.SOURCING_READY) {
        toast.warning('Order must be in "Ready for Delivery" status to complete delivery');
        return;
      }

      await completeDelivery(id);
      toast.success('Delivery marked as complete');
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        status: ORDER_STATUS.DELIVERED,
        sourcing: {
          ...prev.sourcing,
          completed: true,
          completedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error(error.message || 'Failed to mark delivery as complete');
    }
  };

  const handleUpdateAllocationItem = (index, field, value) => {
    const updatedItems = [...allocationItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'price' ? parseFloat(value) : value
    };
    setAllocationItems(updatedItems);
  };

  const handleUpdateProgress = async () => {
    try {
      await updateSourcingProgress(id, sourcingProgress);
      toast.success('Progress updated successfully');
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        sourcing: {
          ...prev.sourcing,
          progress: sourcingProgress,
          lastProgressUpdate: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.PENDING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Order not found</p>
        <Link to="/orders" className="text-primary-600 hover:text-primary-800 mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !order ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order not found</h2>
          <Link 
            to="/orders" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{order.title}</h1>
                <p className="mt-1 text-sm text-gray-500">Order #{id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                {timeRemaining && (
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${timeRemainingClass} bg-opacity-10`}>
                    {timeRemaining}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Details Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Order Details</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{order.description}</p>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Category</label>
                    <p className="font-medium text-gray-900">{order.category}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Expected Budget</label>
                    <p className="font-medium text-gray-900">${order.expectedBudget}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Deadline</label>
                    <p className="font-medium text-gray-900">{order.deadline}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Broker</label>
                    <p className="font-medium text-gray-900">{order.brokerName}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {order.items && order.items.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Items</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                          {order.status === ORDER_STATUS.SOURCING && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                            {order.status === ORDER_STATUS.SOURCING && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.source || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price ? `$${item.price}` : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {item.ready ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Ready
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bidding Section */}
              {order.status === ORDER_STATUS.BIDDING && currentUser.role === 'investor' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Submit Bid</h2>
                  
                  {order.highestBid && (
                    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-blue-800 font-medium">
                            Current highest bid: ${order.highestBid.amount}
                            {order.highestBid.investorId === currentUser.uid && " (your bid)"}
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            Your bid must be higher than the current highest bid
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitBid} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="bidAmount">
                        Bid Amount ($)
                      </label>
                      <div className="mt-1">
                        <input
                          id="bidAmount"
                          type="number"
                          min={order.highestBid ? (order.highestBid.amount + 1) : 1}
                          step="0.01"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          required
                          placeholder={order.highestBid 
                            ? `Enter amount higher than $${order.highestBid.amount}`
                            : "Enter bid amount"
                          }
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="bidTerms">
                        Terms (Optional)
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="bidTerms"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={bidTerms}
                          onChange={(e) => setBidTerms(e.target.value)}
                          rows={3}
                          placeholder="Any special terms or conditions"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={bidLoading || (order.highestBid && parseFloat(bidAmount) <= order.highestBid.amount)}
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                        (bidLoading || (order.highestBid && parseFloat(bidAmount) <= order.highestBid.amount))
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {bidLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : 'Submit Bid'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Participants Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Participants</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Broker', value: order.brokerName },
                    { label: 'Contractor', value: order.contractorName || 'Pending' },
                    { label: 'Investor', value: order.funding?.investorName || 'Not assigned' },
                    { label: 'Sourcing Agent', value: order.sourcing?.sourcingAgentName || 'Not assigned' },
                    { label: 'Client', value: order.clientName || 'Unknown' }
                  ].map((participant, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-500">{participant.label}</span>
                      <span className="font-medium text-gray-900">{participant.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Cards based on role and status */}
              {currentUser.role === 'contractor' && order.status === ORDER_STATUS.PENDING_APPROVAL && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Contractor Actions</h2>
                  <div className="space-y-4">
                    <button
                      onClick={handleApprove}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Order
                    </button>
                    
                    <div className="space-y-3">
                      <textarea
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Reason for rejection"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      <button
                        onClick={handleReject}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject Order
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Funding Confirmation Card */}
              {order.status === ORDER_STATUS.FUNDED && 
               currentUser.role === 'investor' && 
               order.funding?.investorId === currentUser.uid &&
               order.funding?.pendingConfirmation && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Confirm Funding</h2>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-blue-800 font-medium">
                          Your bid of ${order.funding.amount} has been selected!
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          Please confirm your funding commitment by {new Date(order.funding.confirmationDeadline).toLocaleDateString()}
                        </p>
                        {timeRemaining && (
                          <p className={`text-sm font-medium mt-2 ${timeRemainingClass}`}>
                            Time remaining: {timeRemaining}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleConfirmFunding}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Funding
                  </button>
                </div>
              )}

              {/* Sourcing Agent Actions */}
              {currentUser.role === 'sourcing_agent' && (
                <>
                  {/* Initial Allocation Interface */}
                  {order.status === ORDER_STATUS.FUNDING_CONFIRMED && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-6">Initial Item Allocation</h2>
                      <div className="space-y-4">
                        {allocationItems.map((item, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Quantity: {item.quantity} {item.unit}
                            </p>
                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Source</label>
                                <input
                                  type="text"
                                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  value={item.source || ''}
                                  onChange={(e) => handleUpdateAllocationItem(index, 'source', e.target.value)}
                                  placeholder="Enter source/supplier"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                  </div>
                                  <input
                                    type="number"
                                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                    value={item.price || ''}
                                    onChange={(e) => handleUpdateAllocationItem(index, 'price', e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={handleAllocateItems}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Submit Allocation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sourcing Progress Interface */}
                  {order.status === ORDER_STATUS.SOURCING && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Sourcing Progress</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                      </div>

                      <div className="space-y-6">
                        {/* Progress Update Form */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Update Progress Notes
                          </label>
                          <textarea
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            rows="3"
                            value={sourcingProgress}
                            onChange={(e) => setSourcingProgress(e.target.value)}
                            placeholder="Enter progress update..."
                          />
                          <button
                            onClick={handleUpdateProgress}
                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Update Progress
                          </button>
                        </div>

                        {/* Mark Ready for Delivery Button */}
                        <button
                          onClick={() => updateOrderStatus(id, ORDER_STATUS.SOURCING_READY)}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Ready for Delivery
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ready for Delivery Interface */}
                  {order.status === ORDER_STATUS.SOURCING_READY && (
                    <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-500">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-green-800">Ready for Delivery</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Ready since: {new Date(order.sourcing?.readyAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          All Items Ready
                        </span>
                      </div>

                      <button
                        onClick={handleCompleteDelivery}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete Delivery
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 