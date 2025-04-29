import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  setDoc,
  deleteDoc,
  increment,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { debounce } from 'lodash';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // Pull in all relevant chats when the user logs in
  useEffect(() => {
    let unsubscribe = null;

    const loadChats = async () => {
      if (!currentUser) {
        setChats([]);
        setLoadingChats(false);
        return;
      }

      setLoadingChats(true);
      
      try {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', currentUser.uid),
          orderBy('lastMessageTime', 'desc')
        );

        unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
          const chatData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setChats(chatData);
          setLoadingChats(false);
        }, (error) => {
          console.error('Error fetching chats:', error);
          setLoadingChats(false);
        });

        // Add to global unsubscribers
        if (!window.firestoreUnsubscribers) {
          window.firestoreUnsubscribers = [];
        }
        window.firestoreUnsubscribers.push(unsubscribe);
      } catch (error) {
        console.error('Error setting up chat listener:', error);
        setLoadingChats(false);
      }
    };

    loadChats();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        // Remove from global unsubscribers
        if (window.firestoreUnsubscribers) {
          const index = window.firestoreUnsubscribers.indexOf(unsubscribe);
          if (index > -1) {
            window.firestoreUnsubscribers.splice(index, 1);
          }
        }
      }
    };
  }, [currentUser]);

  // Watch for other users typing to show the "X is typing..." indicator
  useEffect(() => {
    if (!currentUser) return;

    const typingRef = collection(db, 'typing');
    const q = query(
      typingRef,
      where('recipientId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typingData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        typingData[data.chatId] = data.timestamp;
      });
      setTypingUsers(typingData);
    });

    // Add to global unsubscribers
    if (!window.firestoreUnsubscribers) {
      window.firestoreUnsubscribers = [];
    }
    window.firestoreUnsubscribers.push(unsubscribe);

    // Clean up listener when component unmounts
    return () => {
      unsubscribe();
      // Remove from global unsubscribers
      if (window.firestoreUnsubscribers) {
        const index = window.firestoreUnsubscribers.indexOf(unsubscribe);
        if (index > -1) {
          window.firestoreUnsubscribers.splice(index, 1);
        }
      }
    };
  }, [currentUser]);

  // Track online status
  useEffect(() => {
    if (!currentUser) return;

    // Create or update user's online status
    const userStatusRef = doc(db, 'userStatus', currentUser.uid);
    const updateOnlineStatus = async () => {
      await setDoc(userStatusRef, {
        online: true,
        lastSeen: serverTimestamp(),
        uid: currentUser.uid
      });
    };

    // Update status when component mounts
    updateOnlineStatus();

    // Set up listener for online users
    const statusQuery = query(collection(db, 'userStatus'), where('online', '==', true));
    const unsubscribeStatus = onSnapshot(statusQuery, (snapshot) => {
      const onlineUsersData = {};
      snapshot.docs.forEach(doc => {
        onlineUsersData[doc.data().uid] = true;
      });
      setOnlineUsers(onlineUsersData);
    });

    // Add to global unsubscribers
    if (!window.firestoreUnsubscribers) {
      window.firestoreUnsubscribers = [];
    }
    window.firestoreUnsubscribers.push(unsubscribeStatus);

    // Update last seen on interval
    const intervalId = setInterval(updateOnlineStatus, 30000);

    // Cleanup: Set offline status when component unmounts
    return () => {
      clearInterval(intervalId);
      unsubscribeStatus();
      // Remove from global unsubscribers
      if (window.firestoreUnsubscribers) {
        const index = window.firestoreUnsubscribers.indexOf(unsubscribeStatus);
        if (index > -1) {
          window.firestoreUnsubscribers.splice(index, 1);
        }
      }
      setDoc(userStatusRef, {
        online: false,
        lastSeen: serverTimestamp(),
        uid: currentUser.uid
      });
    };
  }, [currentUser]);

  // When user clicks on a chat, load all its messages
  const loadMessages = async (chatId) => {
    if (!chatId || !currentUser) return;
    
    setCurrentChatId(chatId);
    setLoadingMessages(true);
    
    try {
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageData);
        setLoadingMessages(false);
      }, (error) => {
        console.error('Error fetching messages:', error);
        setLoadingMessages(false);
      });
      
      return () => {
        unsubscribe();
        setMessages([]);
        setCurrentChatId(null);
      };
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoadingMessages(false);
      return () => {};
    }
  };

  // Cleanup chat state when user logs out
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setMessages([]);
      setCurrentChatId(null);
      setLoadingChats(false);
      setLoadingMessages(false);
    }
  }, [currentUser]);

  // This function handles all the complex logic of sending a message
  const sendMessage = async (chatId, text) => {
    if (!currentUser || !chatId || !text.trim()) {
      throw new Error('Missing required information to send message');
    }

    try {
      // Make sure we're sending to a valid chat
      const currentChat = chats.find(chat => chat.id === chatId);
      if (!currentChat) {
        throw new Error('Chat not found');
      }

      console.log('Saving message:', { chatId, text, senderId: currentUser.uid });
      
      // Store the actual message content in a subcollection
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid]
      });
      
      console.log('Message saved with ID:', messageRef.id);

      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUser.uid,
        unreadCount: {
          [currentUser.uid]: 0, 
          [currentChat.contractorId === currentUser.uid ? currentChat.brokerId : currentChat.contractorId]: increment(1)
        }
      });
      
      console.log('Chat updated with latest message');

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Tracks when users read messages
  // This powers the "seen" indicators and clears notification badges
  const markMessageAsRead = async (chatId, messageId) => {
    if (!currentUser || !chatId || !messageId) return;

    try {
      // Add current user to the "readBy" array for this message
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(currentUser.uid)
      });

      // Clear unread badge count in the chat list
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${currentUser.uid}`]: 0
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Creates the "X is typing..." effect when someone is composing a message
  // Debounced to prevent flooding the database with updates
  const updateTypingStatus = debounce(async (chatId, isTyping) => {
    if (!currentUser || !chatId) return;

    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      // Figure out who should receive the typing notification
      const recipientId = chat.contractorId === currentUser.uid ? chat.brokerId : chat.contractorId;
      const typingRef = doc(db, 'typing', `${chatId}_${currentUser.uid}`);

      if (isTyping) {
        // Create/update typing indicator document
        await setDoc(typingRef, {
          userId: currentUser.uid,
          chatId,
          recipientId,
          timestamp: serverTimestamp()
        }, { merge: true });
      } else {
        // Remove typing indicator when user stops typing
        await deleteDoc(typingRef);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, 500); 

  // Start a new conversation with someone
  const createChat = async (contractorId, brokerId, initialMessage) => {
    if (!currentUser || !contractorId || !brokerId) {
      throw new Error('Cannot create chat: missing user information');
    }

    try {
      // Set up the initial chat structure
      const chatData = {
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: initialMessage || '',
        lastMessageSenderId: currentUser.uid,
        contractorId,
        brokerId,
        participants: [contractorId, brokerId],
        unreadCount: {
          [currentUser.uid]: 0,
          [contractorId === currentUser.uid ? brokerId : contractorId]: initialMessage ? 1 : 0
        }
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);

      if (initialMessage) {
        await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
          text: initialMessage,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email,
          timestamp: serverTimestamp(),
          readBy: [currentUser.uid]
        });
      }

      return chatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  // Helper to determine if someone is actively typing right now
  const isUserTyping = (chatId) => {
    if (!typingUsers[chatId]) return false;
    
    const now = new Date();
    const typingTimestamp = typingUsers[chatId].toDate();
    const timeDiff = now - typingTimestamp;
    
    return timeDiff < 5000;
  };

  // Get details of a specific chat by ID
  const getCurrentChat = async (chatId) => {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }
    
    // First check if the chat is already in our state
    const existingChat = chats.find(chat => chat.id === chatId);
    if (existingChat) {
      return existingChat;
    }
    
    // If not found in state, attempt to fetch it directly from Firestore
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = { id: chatSnap.id, ...chatSnap.data() };
        
        // Verify that the current user is allowed to access this chat
        if (
          chatData.contractorId === currentUser.uid || 
          chatData.brokerId === currentUser.uid
        ) {
          // Add to local state to avoid future fetches
          setChats(prevChats => {
            if (!prevChats.find(c => c.id === chatData.id)) {
              return [...prevChats, chatData];
            }
            return prevChats;
          });
          return chatData;
        } else {
          throw new Error('You do not have permission to access this chat');
        }
      } else {
        throw new Error('Chat not found');
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  };

  const isUserOnline = (userId) => {
    return !!onlineUsers[userId];
  };

  useEffect(() => {
    const migrateExistingChats = async () => {
      if (!currentUser) return;

      try {
        const contractorChatsQuery = query(
          collection(db, 'chats'),
          where('contractorId', '==', currentUser.uid)
        );
        const brokerChatsQuery = query(
          collection(db, 'chats'),
          where('brokerId', '==', currentUser.uid)
        );

        const [contractorSnap, brokerSnap] = await Promise.all([
          getDocs(contractorChatsQuery),
          getDocs(brokerChatsQuery)
        ]);

        const batch = writeBatch(db);
        let hasUpdates = false;

        // Update contractor chats
        contractorSnap.docs.forEach(doc => {
          const data = doc.data();
          if (!data.participants) {
            hasUpdates = true;
            batch.update(doc.ref, {
              participants: [data.contractorId, data.brokerId]
            });
          }
        });

        // Update broker chats
        brokerSnap.docs.forEach(doc => {
          const data = doc.data();
          if (!data.participants) {
            hasUpdates = true;
            batch.update(doc.ref, {
              participants: [data.contractorId, data.brokerId]
            });
          }
        });

        if (hasUpdates) {
          await batch.commit();
          console.log('Successfully migrated existing chats');
        }
      } catch (error) {
        console.error('Error migrating chats:', error);
      }
    };

    migrateExistingChats();
  }, [currentUser]);


  const value = {
    chats,
    messages,
    loadingChats,
    loadingMessages,
    messagesLoading: loadingMessages,
    loadMessages,
    sendMessage,
    createChat,
    markMessageAsRead,
    updateTypingStatus,
    isUserTyping,
    getCurrentChat,
    isUserOnline,
    onlineUsers
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 