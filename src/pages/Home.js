import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function Home() {
  const { currentUser } = useAuth();
  const { settings } = useSettings();

  // Prepare revenue shares data for display - always use default values for unauthenticated users
  const revenueSharesData = !currentUser ? [
    { role: "Contractor", percentage: "20%" },
    { role: "Broker", percentage: "10%" },
    { role: "Investor", percentage: "40%" },
    { role: "Admin", percentage: "30%" }
  ] : [
    { role: "Contractor", percentage: `${(settings.revenueShares.contractor * 100).toFixed(0)}%` },
    { role: "Broker", percentage: `${(settings.revenueShares.broker * 100).toFixed(0)}%` },
    { role: "Investor", percentage: `${(settings.revenueShares.investor * 100).toFixed(0)}%` },
    { role: "Admin", percentage: `${(settings.revenueShares.admin * 100).toFixed(0)}%` }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 opacity-40"></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Welcome to</span>
              <span className="block text-primary-600 mt-2">Maisha Pesa</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600 leading-relaxed">
              Connecting Tenderpreneurs with Investors and Resources. Streamline your tender process and access funding with ease.
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              {!currentUser ? (
                <>
                  <Link
                    to="/signup"
                    className="transform hover:scale-105 transition-all duration-200 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 md:text-lg md:px-10 shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="transform hover:scale-105 transition-all duration-200 inline-flex items-center justify-center px-8 py-4 border-2 border-primary-600 text-base font-medium rounded-xl text-primary-600 bg-white hover:bg-primary-50 md:text-lg md:px-10 shadow-lg hover:shadow-xl"
                  >
                    Log In
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="transform hover:scale-105 transition-all duration-200 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 md:text-lg md:px-10 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 sm:text-4xl mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: 1,
                title: "Connect",
                description: "Contractors and Brokers work together to create and approve orders.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )
              },
              {
                step: 2,
                title: "Fund",
                description: "Investors review and bid on approved orders, providing necessary funding.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                step: 3,
                title: "Deliver",
                description: "Sourcing Agents allocate items and track delivery with real-time status updates.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }
            ].map(({ step, title, description, icon }) => (
              <div key={step} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100 to-primary-50 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                <div className="relative bg-white p-8 rounded-lg shadow-lg transform group-hover:-translate-y-1 transition duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-6">
                    {icon}
                  </div>
                  <div className="absolute top-6 right-8 text-4xl font-bold text-primary-100">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Share Model Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 sm:text-4xl mb-16">
            Revenue Share Model
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {revenueSharesData.map(({ role, percentage }) => (
              <div key={role} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100 to-primary-50 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                <div className="relative bg-white p-6 rounded-lg shadow-lg transform group-hover:-translate-y-1 transition duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{role}</h3>
                  <p className="text-4xl font-bold text-primary-600">{percentage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Roles Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 sm:text-4xl mb-16">
            Key Roles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                role: "Contractor",
                description: "Access to tenders but limited funding. Approve orders created by brokers."
              },
              {
                role: "Broker",
                description: "Create orders and chat with contractors. Select winning bids from investors."
              },
              {
                role: "Investor",
                description: "Bid on approved orders and provide funding for successful transactions."
              },
              {
                role: "Sourcing Agent",
                description: "Allocate items for funded orders and track the sourcing process."
              },
              {
                role: "Client",
                description: "Track order status in real-time and receive delivery updates."
              },
              {
                role: "Admin",
                description: "Verify KYC for users and oversee platform operations."
              }
            ].map(({ role, description }) => (
              <div key={role} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100 to-primary-50 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                <div className="relative bg-white p-8 rounded-lg shadow-lg transform group-hover:-translate-y-1 transition duration-200">
                  <h3 className="text-xl font-semibold text-primary-700 mb-4">{role}</h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-primary-600 py-16 px-8 overflow-hidden shadow-2xl">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800"></div>
            </div>
            <div className="relative">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                <div className="mb-12 lg:mb-0">
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Ready to get started?
                  </h2>
                  <p className="mt-4 text-lg text-primary-100">
                    Join our platform today and connect with the right partners for your tender needs.
                  </p>
                </div>
                <div className="flex items-center justify-center lg:justify-end">
                  {!currentUser ? (
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-primary-700 bg-white hover:bg-primary-50 md:text-lg md:px-10 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Create your account
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-primary-700 bg-white hover:bg-primary-50 md:text-lg md:px-10 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      View Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 