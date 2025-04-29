import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

// Available user roles
export const USER_ROLES = {
  CONTRACTOR: 'contractor',      
  BROKER: 'broker',              
  SOURCING_AGENT: 'sourcing_agent', 
  INVESTOR: 'investor',          
  CLIENT: 'client',              
  ADMIN: 'admin',                
};

// Create the auth context that will be used throughout the app
export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Track current user and loading state
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // creates both Firebase auth and Firestore profile
  async function signup(email, password, fullName, role) {
    try {
      // Create the auth user - this manages login credentials
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);
      
      // Add a friendly display name - shows up in UI instead of email
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });
      //console.log('Profile updated:', userCredential.user);
      
      // Create extended user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        fullName,
        role,
        isVerified: false, // KYC verification status - everyone starts unverified
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      //console.log('User document created:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error; 
    }
  }

  // login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // logout
  async function logout() {
    try {
      // Clear any active listeners
      if (window.firestoreUnsubscribers) {
        for (const unsubscribe of window.firestoreUnsubscribers) {
          unsubscribe();
        }
        window.firestoreUnsubscribers = [];
      }
      
      // Perform the actual signout
      await signOut(auth);
      
      // Clear any cached data
      setCurrentUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  // Listen for auth state changes when the app loads
  useEffect(() => {
    // This listener fires whenever auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If user is logged in, fetch their extended profile data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({
            ...user,
            ...userDoc.data(), // Combine auth user with Firestore data
          });
        } else {
          // Fallback if profile doesn't exist yet
          setCurrentUser(user);
        }
      } else {
        // No user is signed in
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    USER_ROLES,
  };

  // This prevents flashing of unauthenticated content
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 