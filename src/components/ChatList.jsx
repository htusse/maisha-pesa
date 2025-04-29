import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { IoAdd } from 'react-icons/io5';
import UserSelectionModal from './UserSelectionModal';

export default function ChatList() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const { chats, loadingChats, isUserOnline } = useChat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Format timestamp in a user-friendly way
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return format(date, 'h:mm a');
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return format(date, 'EEEE'); // Day name
    } else {
      return format(date, 'MMM d'); // Month and day
    }
  };

  // Get the name of the other person in the chat
  const getChatName = (chat) => {
    if (!currentUser) return '';
    return currentUser.role === 'contractor'
      ? chat.brokerName || 'Broker'
      : chat.contractorName || 'Contractor';
  };

  // Get the ID of the other person in the chat
  const getOtherUserId = (chat) => {
    if (!currentUser) return '';
    return currentUser.role === 'contractor'
      ? chat.brokerId
      : chat.contractorId;
  };

  // Calculate number of unread messages
  const getUnreadCount = (chat) => {
    if (!chat.lastMessage || !currentUser) return 0;
    if (chat.lastMessageSenderId === currentUser.uid) return 0;
    return chat.unreadCount || 0;
  };


  if (loadingChats) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <IoAdd className="text-xl" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-gray-500">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start chatting with contractors or brokers
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {chats.map((chat) => {
              const unreadCount = getUnreadCount(chat);
              const isActive = chat.id === chatId;
              const otherUserId = getOtherUserId(chat);
              const isOnline = isUserOnline(otherUserId);
              
              return (
                <li 
                  key={chat.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                >
                  <Link 
                    to={`/messages/${chat.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-lg font-medium">
                            {getChatName(chat).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {getChatName(chat)}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(chat.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          {chat.lastMessageSenderId === currentUser?.uid && (
                            <span className="mr-1 text-gray-400">
                              {chat.lastMessageRead ? '✓✓' : '✓'}
                            </span>
                          )}
                          <p className={`text-sm truncate ${unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <UserSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
} 