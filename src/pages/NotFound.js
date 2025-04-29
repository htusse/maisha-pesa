import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <p className="text-2xl font-medium text-gray-800 mb-8">Page Not Found</p>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary">
        Go Back Home
      </Link>
    </div>
  );
} 