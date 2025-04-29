import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-200"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 