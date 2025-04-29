import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import UserSelect from './UserSelect';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';

export default function UserSelectionModal({ isOpen, onClose }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { createChat } = useChat();
  const navigate = useNavigate();

  const handleStartChat = async () => {
    if (!selectedUser || !message.trim()) {
      toast.error('Please select a user and write a message');
      return;
    }

    setLoading(true);
    try {
      const contractorId = currentUser.role === 'contractor' ? currentUser.uid : selectedUser.uid;
      const brokerId = currentUser.role === 'broker' ? currentUser.uid : selectedUser.uid;
      
      const chatId = await createChat(contractorId, brokerId, message);
      onClose();
      setSelectedUser(null);
      setMessage('');
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Start New Chat
              </Dialog.Title>

              <div className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700"
                    >
                      Select User
                    </label>
                    <div className="mt-1">
                      <UserSelect
                        role={currentUser?.role === 'contractor' ? 'broker' : 'contractor'}
                        onSelect={setSelectedUser}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Initial Message
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Write your first message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => {
                    onClose();
                    setSelectedUser(null);
                    setMessage('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={handleStartChat}
                  disabled={!selectedUser || !message.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Start Chat'}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 