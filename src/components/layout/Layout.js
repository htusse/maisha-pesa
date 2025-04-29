import React from 'react';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className={`flex-grow ${isMessagesPage ? 'p-0' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl'}`}>
        {isMessagesPage ? children : (
          <div className="space-y-8">
            {children}
          </div>
        )}
      </main>
      {!isMessagesPage && (
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Maisha Pesa</h3>
                <p className="text-gray-600 text-sm">Empowering financial connections and fostering growth in our community.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-gray-600 hover:text-primary-600 text-sm">About Us</a></li>
                  <li><a href="/contact" className="text-gray-600 hover:text-primary-600 text-sm">Contact</a></li>
                  <li><a href="/privacy" className="text-gray-600 hover:text-primary-600 text-sm">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Connect With Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Maisha Pesa. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
} 