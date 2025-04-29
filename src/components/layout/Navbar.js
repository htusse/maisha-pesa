import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Controls mobile menu

  // This ensures users can easily end their session securely
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Makes it obvious to users where they are in the app
  const isActive = (path) => {
    return location.pathname === path ? 'text-white bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-800';
  };

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between h-16">
          {/* App logo and name */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-xl font-bold hover:text-white transition-colors duration-200"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Maisha Pesa</span>
            </Link>
          </div>

          {/* Main navigation links - only visible on desktop and when logged in
              These adapt based on user role to show relevant options */}
          {currentUser && (
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              
              {/* Broker-specific action - only they can create orders */}
              {currentUser.role === 'broker' && (
                <Link 
                  to="/orders/new" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/orders/new')}`}
                >
                  Create Order
                </Link>
              )}
              
              {/* Everyone can view orders, but what they see is filtered by role */}
              <Link 
                to="/orders" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/orders')}`}
              >
                Orders
              </Link>
              
              {/* Chat access is limited to roles that need direct communication */}
              {['contractor', 'broker'].includes(currentUser.role) && (
                <Link 
                  to="/messages" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/messages')}`}
                >
                  Messages
                </Link>
              )}
            </div>
          )}

          {/* User profile and auth buttons section
              Shows different options for logged-in vs guest users */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {/* User info display with name and role */}
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-white">{currentUser.fullName}</span>
                    {currentUser.role && (
                      <span className="text-xs text-primary-200 capitalize">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-800 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-800 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="inline-flex items-center justify-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger menu for mobile - toggles the mobile menu view
              This ensures good UX on smaller screens */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu - only visible on small screens when toggled
          Provides the same options as desktop but in a space-efficient format */}
      {isMenuOpen && currentUser && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard')}`}
              onClick={() => setIsMenuOpen(false)} // Close menu after navigation
            >
              Dashboard
            </Link>
            
            {currentUser.role === 'broker' && (
              <Link 
                to="/orders/new" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/orders/new')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Create Order
              </Link>
            )}
            
            <Link 
              to="/orders" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/orders')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Orders
            </Link>
            
            {['contractor', 'broker'].includes(currentUser.role) && (
              <Link 
                to="/messages" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/chats')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Messages
              </Link>
            )}
          </div>
          {/* User profile section in mobile view */}
          <div className="pt-4 pb-3 border-t border-primary-800">
            <div className="px-2 space-y-1">
              <div className="px-3 py-2">
                <div className="text-base font-medium text-white">{currentUser.fullName}</div>
                <div className="text-sm text-primary-200 capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-100 hover:text-white hover:bg-primary-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 