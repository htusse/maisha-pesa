import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function searchUsers(searchTerm, role) {
  try {
    // Create a base query for verified users with the specified role
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', role),
      where('isVerified', '==', true)
    );

    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter users based on search term
    return users.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
} 