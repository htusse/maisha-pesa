import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

// We start with these defaults, but admins can tweak them to balance the ecosystem
const DEFAULT_SETTINGS = {
  revenueShares: {
    contractor: 0.20,  
    broker: 0.10,      
    investor: 0.40,    
    admin: 0.30        
  },

  // Settings for the bidding and funding process
  fundingConfirmationDeadlineDays: 7, // Number of days for an investor to confirm funding

  updatedAt: new Date().toISOString(),
};

// Central place to store and access global platform settings
const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  // Start with defaults but will load from database
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Grab the latest settings when the app loads
  useEffect(() => {
    let unsubscribe = null;

    const fetchSettings = async () => {
      try {
        // If not authenticated, use default settings
        if (!currentUser) {
          setSettings(DEFAULT_SETTINGS);
          setLoading(false);
          return;
        }

        const settingsRef = doc(db, 'settings', 'global');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          // Use stored settings from the database
          setSettings(settingsSnap.data());
        } else {
          // First time setup - initialize with our defaults
          await setDoc(settingsRef, DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // On error, fall back to default settings
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        // Remove from global unsubscribers if exists
        if (window.firestoreUnsubscribers) {
          const index = window.firestoreUnsubscribers.indexOf(unsubscribe);
          if (index > -1) {
            window.firestoreUnsubscribers.splice(index, 1);
          }
        }
      }
    };
  }, [currentUser]);

  // Only admins can change platform settings
  const updateSettings = async (newSettings) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can update platform settings');
    }
    
    try {
      const settingsRef = doc(db, 'settings', 'global');
      const updatedSettings = {
        ...newSettings,
        updatedAt: serverTimestamp() // Track when changes occur for audit purposes
      };
      
      // Save to database and update local state simultaneously
      await setDoc(settingsRef, updatedSettings);
      setSettings(updatedSettings);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Convenience method to grab the revenue splits
  const getRevenueShares = () => {
    return settings.revenueShares;
  };

  const value = {
    settings,
    loading,
    updateSettings,
    getRevenueShares
  };

  return (
    <SettingsContext.Provider value={value}>
      {!loading && children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;