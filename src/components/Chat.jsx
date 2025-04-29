import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { IoSend } from 'react-icons/io5';
import { toast } from 'react-toastify';

export default function Chat() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const {
    chats,
    messages,
    loadingMessages,
    loadMessages,
    sendMessage,
    markMessageAsRead,
    isUserTyping,
    isUserOnline
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Find current chat
  const currentChat = chats.find(chat => chat.id === chatId);

  // Load messages when chat changes
  useEffect(() => {
    let unsubscribe;
    let isMounted = true;
    
    const loadChatMessages = async () => {
      if (!chatId || !isMounted) return;
      
      try {
        const cleanup = await loadMessages(chatId);
        if (typeof cleanup === 'function' && isMounted) {
          unsubscribe = cleanup;
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadChatMessages();

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages, loadingMessages]);

  // Mark messages as read
  useEffect(() => {
    if (!loadingMessages && messages.length > 0 && currentUser && chatId) {
      const unreadMessages = messages.filter(
        msg => !msg.readBy?.includes(currentUser.uid) && msg.senderId !== currentUser.uid
      );
      unreadMessages.forEach(msg => markMessageAsRead(chatId, msg.id));
    }
  }, [messages, currentUser, markMessageAsRead, chatId, loadingMessages]);

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(chatId, newMessage);
      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    return format(date, 'h:mm a');
  };

  // Get recipient name and online status
  const getRecipientInfo = () => {
    if (!currentChat || !currentUser) return { name: 'Chat', isOnline: false };
    const isContractor = currentUser.role === 'contractor';
    const recipientId = isContractor ? currentChat.brokerId : currentChat.contractorId;
    return {
      name: isContractor ? currentChat.brokerName : currentChat.contractorName,
      isOnline: isUserOnline(recipientId)
    };
  };

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  const { name: recipientName, isOnline } = getRecipientInfo();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        <div className="flex-1">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">{recipientName}</h2>
            <div className="ml-2 flex items-center">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="ml-1 text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          {isUserTyping(chatId) && (
            <p className="text-sm text-gray-500">Typing...</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Start the conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-3" key={chatId}>
            {messages.map((message, idx) => {
              const isCurrentUser = message.senderId === currentUser?.uid;
              const showTimestamp = idx === messages.length - 1 || 
                messages[idx + 1]?.senderId !== message.senderId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isCurrentUser
                        ? 'bg-primary text-white rounded-l-lg rounded-tr-lg'
                        : 'bg-white text-gray-900 rounded-r-lg rounded-tl-lg'
                    } p-3 shadow-sm`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    {showTimestamp && (
                      <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-100' : 'text-gray-400'}`}>
                        {formatMessageTime(message.timestamp)}
                        {isCurrentUser && message.readBy?.length > 1 && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`p-2 rounded-full ${
              sending || !newMessage.trim()
                ? 'bg-gray-100 text-gray-400'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            <IoSend className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 