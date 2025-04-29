import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function OrderForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    contractorId: '',
    expectedBudget: '',
    deadline: '',
    biddingDeadline: '',
    category: '',
    items: [],
  });
  
  const [contractors, setContractors] = useState([]);
  const [clients, setClients] = useState([]);
  const [itemInput, setItemInput] = useState({ name: '', quantity: '', unit: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { createOrder } = useOrders();
  const { currentUser, USER_ROLES } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch contractors
        const contractorsQuery = query(
          collection(db, 'users'),
          where('role', '==', USER_ROLES.CONTRACTOR),
          where('isVerified', '==', true)
        );
        
        const contractorsSnapshot = await getDocs(contractorsQuery);
        const contractorsData = [];
        contractorsSnapshot.forEach((doc) => {
          contractorsData.push({ id: doc.id, ...doc.data() });
        });
        setContractors(contractorsData);
        
        // Fetch clients
        const clientsQuery = query(
          collection(db, 'users'),
          where('role', '==', USER_ROLES.CLIENT),
          where('isVerified', '==', true)
        );
        
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsData = [];
        clientsSnapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...doc.data() });
        });
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users.');
      }
    };
    
    fetchUsers();
  }, [USER_ROLES]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemInput({ ...itemInput, [name]: value });
  };

  const addItem = () => {
    if (!itemInput.name || !itemInput.quantity) {
      return;
    }
    
    const newItem = { ...itemInput, id: Date.now().toString() };
    setFormData({ ...formData, items: [...formData.items, newItem] });
    setItemInput({ name: '', quantity: '', unit: '' });
  };

  const removeItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Format the data for submission
      const orderData = {
        ...formData,
        expectedBudget: parseFloat(formData.expectedBudget),
        createdBy: currentUser.uid,
      };
      
      await createOrder(orderData);
      navigate('/orders');
    } catch (error) {
      setError('Failed to create order. ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Order</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Order Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="input"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter order title"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="input"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="construction">Construction</option>
              <option value="it">IT Services</option>
              <option value="supplies">Supplies</option>
              <option value="consulting">Consulting</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientId">
              Client
            </label>
            <select
              id="clientId"
              name="clientId"
              className="input"
              value={formData.clientId}
              onChange={handleChange}
              required
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.fullName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contractorId">
              Contractor
            </label>
            <select
              id="contractorId"
              name="contractorId"
              className="input"
              value={formData.contractorId}
              onChange={handleChange}
              required
            >
              <option value="">Select Contractor</option>
              {contractors.map(contractor => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.fullName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expectedBudget">
              Expected Budget
            </label>
            <input
              id="expectedBudget"
              name="expectedBudget"
              type="number"
              className="input"
              value={formData.expectedBudget}
              onChange={handleChange}
              required
              placeholder="Enter expected budget"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deadline">
              Project Deadline
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              className="input"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="biddingDeadline">
              Bidding Deadline
            </label>
            <input
              id="biddingDeadline"
              name="biddingDeadline"
              type="datetime-local"
              className="input"
              value={formData.biddingDeadline}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="input h-32"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Detailed description of the order"
          ></textarea>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Items</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <input
                id="itemName"
                name="name"
                type="text"
                className="input"
                value={itemInput.name}
                onChange={handleItemInputChange}
                placeholder="Item name"
              />
            </div>
            
            <div>
              <input
                id="itemQuantity"
                name="quantity"
                type="number"
                className="input"
                value={itemInput.quantity}
                onChange={handleItemInputChange}
                placeholder="Quantity"
                min="1"
              />
            </div>
            
            <div>
              <div className="flex space-x-2">
                <input
                  id="itemUnit"
                  name="unit"
                  type="text"
                  className="input"
                  value={itemInput.unit}
                  onChange={handleItemInputChange}
                  placeholder="Unit (e.g., kg, pc)"
                />
                
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          {formData.items.length > 0 ? (
            <div className="mt-4 border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No items added yet.</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
} 