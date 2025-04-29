import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import KycWrapper from '../components/kyc/KycWrapper';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { orders, loading, ORDER_STATUS } = useOrders();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef);
        const querySnapshot = await getDocs(usersQuery);
        const usersData = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Sort orders by most recent first
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
    return dateB - dateA;
  });

  // Only show a limited number of recent orders
  const recentOrders = sortedOrders.slice(0, 5);

  const renderRoleBasedDashboard = () => {
    switch (currentUser.role) {
      case 'contractor':
        return renderContractorDashboard();
      case 'broker':
        return renderBrokerDashboard();
      case 'investor':
        return renderInvestorDashboard();
      case 'sourcing_agent':
        return renderSourcingAgentDashboard();
      case 'client':
        return renderClientDashboard();
      case 'admin':
        return renderAdminDashboard();
      default:
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-700">Welcome to Maisha Pesa!</p>
          </div>
        );
    }
  };

  const renderContractorDashboard = () => {
    const pendingApprovalOrders = orders.filter(
      order => order.contractorId === currentUser.uid && order.status === ORDER_STATUS.PENDING_APPROVAL
    );

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-primary-600">{pendingApprovalOrders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View all orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Active Orders</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                order.contractorId === currentUser.uid && 
                [ORDER_STATUS.APPROVED, ORDER_STATUS.BIDDING, ORDER_STATUS.FUNDED, ORDER_STATUS.SOURCING].includes(order.status)
              ).length}
            </p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View active orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Completed Orders</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                order.contractorId === currentUser.uid && 
                order.status === ORDER_STATUS.COMPLETED
              ).length}
            </p>
          </div>
        </div>
        
        {pendingApprovalOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-8">
            <h3 className="font-semibold text-amber-800 mb-2">Orders Pending Your Approval</h3>
            <ul className="divide-y divide-amber-200">
              {pendingApprovalOrders.map(order => (
                <li key={order.id} className="py-3">
                  <Link to={`/orders/${order.id}`} className="flex justify-between items-center hover:bg-amber-100 p-2 rounded">
                    <span className="font-medium">{order.title}</span>
                    <span className="text-sm text-gray-600">View Order</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderBrokerDashboard = () => {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Your Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{orders.length}</p>
            <div className="mt-4">
              <Link to="/orders/new" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm">
                Create New Order
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Pending Approval</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => order.status === ORDER_STATUS.PENDING_APPROVAL).length}
            </p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View all orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Active Bidding</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => order.status === ORDER_STATUS.BIDDING).length}
            </p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View orders with bids
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderInvestorDashboard = () => {
    const biddingOrders = orders.filter(order => order.status === ORDER_STATUS.BIDDING);
    const fundedOrders = orders.filter(
      order => order.status !== ORDER_STATUS.BIDDING && 
      order.funding && 
      order.funding.investorId === currentUser.uid
    );

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Available to Bid</h3>
            <p className="text-3xl font-bold text-primary-600">{biddingOrders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View opportunities
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Your Funded Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{fundedOrders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View funded orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Completed Investments</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                order.status === ORDER_STATUS.COMPLETED && 
                order.funding && 
                order.funding.investorId === currentUser.uid
              ).length}
            </p>
          </div>
        </div>
        
        {biddingOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-8">
            <h3 className="font-semibold text-blue-800 mb-2">Orders Available for Bidding</h3>
            <ul className="divide-y divide-blue-200">
              {biddingOrders.slice(0, 3).map(order => (
                <li key={order.id} className="py-3">
                  <Link to={`/orders/${order.id}`} className="flex justify-between items-center hover:bg-blue-100 p-2 rounded">
                    <div>
                      <span className="font-medium block">{order.title}</span>
                      <span className="text-sm text-gray-600">Budget: ${order.expectedBudget}</span>
                    </div>
                    <span className="text-sm text-primary-600">Bid Now</span>
                  </Link>
                </li>
              ))}
            </ul>
            {biddingOrders.length > 3 && (
              <Link to="/orders" className="text-blue-700 hover:text-blue-900 text-sm mt-2 inline-block">
                View all {biddingOrders.length} opportunities
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSourcingAgentDashboard = () => {
    const fundedOrders = orders.filter(order => order.status === ORDER_STATUS.FUNDING_CONFIRMED);
    const allocatedOrders = orders.filter(
      order => order.status === ORDER_STATUS.SOURCING && 
      order.sourcing && 
      order.sourcing.sourcingAgentId === currentUser.uid
    );

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Orders To Source</h3>
            <p className="text-3xl font-bold text-primary-600">{fundedOrders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View available orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Your Active Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{allocatedOrders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View your orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Completed Orders</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.COMPLETED) && 
                order.sourcing && 
                order.sourcing.sourcingAgentId === currentUser.uid
              ).length}
            </p>
          </div>
        </div>
        
        {fundedOrders.length > 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-8">
            <h3 className="font-semibold text-green-800 mb-2">Orders with Confirmed Funding</h3>
            <ul className="divide-y divide-green-200">
              {fundedOrders.slice(0, 3).map(order => (
                <li key={order.id} className="py-3">
                  <Link to={`/orders/${order.id}`} className="flex justify-between items-center hover:bg-green-100 p-2 rounded">
                    <div>
                      <span className="font-medium block">{order.title}</span>
                      <span className="text-sm text-gray-600">Funded: ${order.funding?.amount || 0}</span>
                    </div>
                    <span className="text-sm text-primary-600">Allocate Items</span>
                  </Link>
                </li>
              ))}
            </ul>
            {fundedOrders.length > 3 && (
              <Link to="/orders" className="text-green-700 hover:text-green-900 text-sm mt-2 inline-block">
                View all {fundedOrders.length} orders
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderClientDashboard = () => {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Your Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{orders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View all orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                [ORDER_STATUS.APPROVED, ORDER_STATUS.BIDDING, ORDER_STATUS.FUNDED, ORDER_STATUS.SOURCING].includes(order.status)
              ).length}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status)
              ).length}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const pendingVerificationCount = users.filter(user => user.kycStatus === 'pending').length;

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">All Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{orders.length}</p>
            <Link to="/orders" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              View all orders
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Pending Verification</h3>
            <p className="text-3xl font-bold text-primary-600">{pendingVerificationCount}</p>
            <Link to="/admin/users" className="text-primary-600 hover:text-primary-800 text-sm mt-4 inline-block">
              Verify users
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Active</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => 
                [ORDER_STATUS.APPROVED, ORDER_STATUS.BIDDING, ORDER_STATUS.FUNDED, ORDER_STATUS.SOURCING].includes(order.status)
              ).length}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-600">
              {orders.filter(order => order.status === ORDER_STATUS.COMPLETED).length}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-4">Administration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/users" className="bg-gray-100 hover:bg-gray-200 p-4 rounded-md text-center">
              User Management
            </Link>
            <Link to="/admin/orders" className="bg-gray-100 hover:bg-gray-200 p-4 rounded-md text-center">
              Order Management
            </Link>
            <Link to="/admin/settings" className="bg-gray-100 hover:bg-gray-200 p-4 rounded-md text-center">
              Platform Settings
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <KycWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {currentUser.fullName}
          </h1>
          <p className="text-gray-600">
            <span className="capitalize">{(currentUser.role || '').replace('_', ' ')}</span> Dashboard
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {renderRoleBasedDashboard()}
            
            {recentOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map(order => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.title}</div>
                            <div className="text-sm text-gray-500">{order.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${order.status === ORDER_STATUS.COMPLETED ? 'bg-green-100 text-green-800' : 
                                order.status === ORDER_STATUS.PENDING_APPROVAL ? 'bg-yellow-100 text-yellow-800' :
                                order.status === ORDER_STATUS.REJECTED ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'}`}>
                              {order?.status?.replace(/_/g, ' ')}
                            </span>
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
                </div>
                
                <div className="mt-4 text-right">
                  <Link to="/orders" className="text-primary-600 hover:text-primary-800">
                    View all orders
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </KycWrapper>
  );
} 