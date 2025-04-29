import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { orders, loading, ORDER_STATUS } = useOrders();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('all');

  const filteredOrders = filter === 'all' 
    ? orders
    : orders.filter(order => order.status === filter);

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
        return 'bg-indigo-100 text-indigo-800';
      case ORDER_STATUS.FUNDING_CONFIRMED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.SOURCING:
        return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.SOURCING_READY:
        return 'bg-teal-100 text-teal-800';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        {currentUser.role === 'broker' && (
          <Link
            to="/orders/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create New Order
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            
            {currentUser.role === 'sourcing_agent' ? (
              <>
                <button
                  onClick={() => setFilter(ORDER_STATUS.FUNDING_CONFIRMED)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.FUNDING_CONFIRMED ? 'bg-primary-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  Ready to Source
                </button>
                
                <button
                  onClick={() => setFilter(ORDER_STATUS.SOURCING)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.SOURCING ? 'bg-primary-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  }`}
                >
                  In Progress
                </button>

                <button
                  onClick={() => setFilter(ORDER_STATUS.SOURCING_READY)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.SOURCING_READY ? 'bg-primary-600 text-white' : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                  }`}
                >
                  Ready for Delivery
                </button>
                
                <button
                  onClick={() => setFilter(ORDER_STATUS.DELIVERED)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.DELIVERED ? 'bg-primary-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  Delivered
                </button>
              </>
            ) : (
              <>
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
                  onClick={() => setFilter(ORDER_STATUS.FUNDING_CONFIRMED)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.FUNDING_CONFIRMED ? 'bg-primary-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  Funding Confirmed
                </button>
                
                <button
                  onClick={() => setFilter(ORDER_STATUS.SOURCING)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.SOURCING ? 'bg-primary-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  }`}
                >
                  Sourcing
                </button>

                <button
                  onClick={() => setFilter(ORDER_STATUS.SOURCING_READY)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.SOURCING_READY ? 'bg-primary-600 text-white' : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                  }`}
                >
                  Ready for Delivery
                </button>
                
                <button
                  onClick={() => setFilter(ORDER_STATUS.COMPLETED)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === ORDER_STATUS.COMPLETED ? 'bg-primary-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  Completed
                </button>
              </>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No orders found.</p>
            {currentUser.role === 'broker' && (
              <Link to="/orders/new" className="text-primary-600 hover:text-primary-800 mt-2 inline-block">
                Create your first order
              </Link>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    ${order.expectedBudget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 