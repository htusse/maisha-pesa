import React from 'react';
import OrderForm from '../components/orders/OrderForm';

export default function CreateOrder() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Order</h1>
      <OrderForm />
    </div>
  );
} 