import React from 'react';
import { useParams } from 'react-router-dom';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';

export default function Messages() {
  const { chatId } = useParams();

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat list sidebar */}
      <div className="w-80 border-r flex-shrink-0 bg-white">
        <ChatList />
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-gray-50">
        {chatId ? (
          <Chat />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Welcome to Messages</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a conversation or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 