import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import OrderEditor from './OrderEditor';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function OrderManagement() {
  const { orders, loading, ORDER_STATUS } = useOrders();
  const [filter, setFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [localOrders, setLocalOrders] = useState([]);

  // Initialize localOrders when orders change
  useEffect(() => {
    if (orders) {
      setLocalOrders(orders);
    }
  }, [orders]);

  const filteredOrders = filter === 'all' 
    ? localOrders
    : localOrders.filter(order => order.status === filter);

  // Sort orders by creation date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
    return dateB - dateA;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.APPROVED:
      case ORDER_STATUS.BIDDING:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.FUNDED:
      case ORDER_STATUS.SOURCING:
        return 'bg-indigo-100 text-indigo-800';
      case ORDER_STATUS.DELIVERED:
      case ORDER_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.REJECTED:
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
  };

  const handleOrderUpdate = (updatedOrder) => {
    // Update local state
    setLocalOrders(localOrders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      
      // Update local state
      setLocalOrders(localOrders.filter(order => order.id !== orderId));
      
      // Reset delete confirmation
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order: ' + error.message);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            
            <button
              onClick={() => setFilter(ORDER_STATUS.PENDING_APPROVAL)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === ORDER_STATUS.PENDING_APPROVAL ? 'bg-primary-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
            >
              Pending Approval
            </button>
            
            <button
              onClick={() => setFilter(ORDER_STATUS.BIDDING)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === ORDER_STATUS.BIDDING ? 'bg-primary-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Bidding
            </button>
            
            <button
              onClick={() => setFilter(ORDER_STATUS.FUNDED)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === ORDER_STATUS.FUNDED ? 'bg-primary-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
            >
              Funded
            </button>
            
            <button
              onClick={() => setFilter(ORDER_STATUS.DELIVERED)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === ORDER_STATUS.DELIVERED ? 'bg-primary-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }`}
            >
              Delivered
            </button>
            
            <button
              onClick={() => setFilter(ORDER_STATUS.COMPLETED)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === ORDER_STATUS.COMPLETED ? 'bg-primary-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No orders found with the selected filter.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Broker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOrders.map(order => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.title}</div>
                    <div className="text-sm text-gray-500">{order.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.brokerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${order.expectedBudget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                      View
                    </Link>
                    <button 
                      onClick={() => handleEditClick(order)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(order.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Editor Modal */}
      {editingOrder && (
        <OrderEditor 
          order={editingOrder} 
          onClose={() => setEditingOrder(null)} 
          onUpdate={handleOrderUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
              <p className="mb-4">Are you sure you want to delete this order? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteOrder(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 