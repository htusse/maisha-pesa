import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

export async function createChat(otherUserId, initialMessage) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const chatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUser.uid, otherUserId],
      createdAt: serverTimestamp(),
      lastMessage: initialMessage,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: currentUser.uid,
      unreadCount: 1
    });

    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
} 