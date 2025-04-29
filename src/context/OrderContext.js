import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

export const ORDER_STATUS = {
  DRAFT: 'draft',               // Broker started but not submitted yet
  PENDING_APPROVAL: 'pending_approval', // Waiting for contractor to accept/reject
  APPROVED: 'approved',         // Contractor said yes, ready for next step
  REJECTED: 'rejected',         // Contractor said no, needs rework
  BIDDING: 'bidding',           // Open for investors to place funding offers
  FUNDED: 'funded',             // Money secured, ready to begin work
  FUNDING_CONFIRMED: 'funding_confirmed', // Investor has confirmed the funding
  SOURCING: 'sourcing',         // Materials being acquired for the job
  SOURCING_READY: 'sourcing_ready', // All materials are ready for delivery
  DELIVERED: 'delivered',       // Materials on site, awaiting final completion
  COMPLETED: 'completed',       // Job done, payment distributed
  CANCELLED: 'cancelled',       // Something went wrong, order terminated
};

const OrderContext = createContext();

export function useOrders() {
  return useContext(OrderContext);
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { getRevenueShares, settings } = useSettings();

  // brokers create orders to initiate projects
  async function createOrder(orderData) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      // Build a complete order object with all required fields
      const newOrder = {
        ...orderData,
        brokerId: currentUser.uid,
        brokerName: currentUser.fullName,
        status: ORDER_STATUS.PENDING_APPROVAL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        bids: [],               // Will hold investor funding offers
        biddingDeadline: orderData.biddingDeadline,
        biddingStatus: 'open',  // Track if bidding is open/closed
        funding: {
          amount: 0,
          investorId: null,
          funded: false,
        },
        sourcing: {
          sourcingAgentId: null,
          items: [],            // Will track materials needed
          completed: false,
        },
        revenueShares: {        // How profits get split between parties
          contractor: 0,
          broker: 0,
          investor: 0,
          admin: 0,
        },
      };
      
      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      return { id: docRef.id, ...newOrder };
    } catch (error) {
      throw error;
    }
  }

  async function updateOrderStatus(orderId, status, additionalData = {}) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(), // Always track when things change
        ...additionalData,
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // contractor decides if they'll take the job
  async function respondToOrder(orderId, approved, reason = '') {
    if (!currentUser) throw new Error('User not authenticated');
    
    const status = approved ? ORDER_STATUS.APPROVED : ORDER_STATUS.REJECTED;
    const additionalData = approved ? {} : { rejectionReason: reason };
    
    if (approved) {
      // If approved, we move directly to bidding to keep things moving
      additionalData.status = ORDER_STATUS.BIDDING;
    }
    
    return updateOrderStatus(orderId, status, additionalData);
  }

  // Investors compete to fund projects
  async function submitBid(orderId, amount, terms) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderSnap.data();

      // Check if bidding deadline has passed
      if (orderData.biddingDeadline) {
        const deadlineDate = new Date(orderData.biddingDeadline);
        const now = new Date();
        
        if (now > deadlineDate) {
          throw new Error('Bidding deadline has passed');
        }
      }

      // Check if bidding is still open
      if (orderData.biddingStatus !== 'open') {
        throw new Error('Bidding is closed for this order');
      }
      
      // Find if the investor has already bid on this order
      const existingBidIndex = orderData.bids?.findIndex(
        bid => bid.investorId === currentUser.uid
      );

      // Create a structured bid object with all necessary details
      const newBid = {
        investorId: currentUser.uid,
        investorName: currentUser.fullName,
        amount,                 
        terms,                 
        timestamp: new Date().toISOString(),
        status: 'pending',     
      };
      
      let updatedBids;
      
      // If the investor has already bid, update their bid
      if (existingBidIndex >= 0) {
        updatedBids = [...orderData.bids];
        updatedBids[existingBidIndex] = newBid;
      } else {
        // Add to existing bids array rather than replacing
        updatedBids = [...(orderData.bids || []), newBid];
      }
      
      // Calculate the highest bid
      const highestBid = updatedBids.reduce((highest, current) => 
        (current.amount > highest.amount) ? current : highest, 
        { amount: 0 }
      );
      
      // Update the highest bid information
      await updateDoc(orderRef, {
        bids: updatedBids,
        highestBid: {
          amount: highestBid.amount,
          investorId: highestBid.investorId,
          investorName: highestBid.investorName,
          timestamp: highestBid.timestamp,
        },
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, bid: newBid };
    } catch (error) {
      throw error;
    }
  }

  // Investor confirms funding commitment after being selected as the winner
  async function confirmFunding(orderId) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderSnap.data();
      
      // Ensure the current user is the selected investor
      if (orderData.funding.investorId !== currentUser.uid) {
        throw new Error('Only the selected investor can confirm funding');
      }
      
      await updateDoc(orderRef, {
        status: ORDER_STATUS.FUNDING_CONFIRMED,
        'funding.funded': true,
        'funding.pendingConfirmation': false,
        'funding.fundedAt': new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Sourcing agents specify what materials are needed for the project
  async function allocateItems(orderId, items) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      // Check if the order funding is confirmed
      const orderData = orderSnap.data();
      if (orderData.status !== ORDER_STATUS.FUNDING_CONFIRMED) {
        throw new Error('Funding must be confirmed before allocation');
      }
      
      // Add ready status to each item
      const itemsWithReadyStatus = items.map(item => ({
        ...item,
        ready: false,
        readyAt: null,
        allocated: true,
        allocatedAt: new Date().toISOString()
      }));
      
      await updateDoc(orderRef, {
        status: ORDER_STATUS.SOURCING,
        'sourcing.sourcingAgentId': currentUser.uid,
        'sourcing.sourcingAgentName': currentUser.fullName,
        'sourcing.items': itemsWithReadyStatus,
        'sourcing.startedAt': new Date().toISOString(),
        'sourcing.status': 'in_progress',
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Mark specific items as ready for delivery
  async function markItemsReady(orderId, itemIndices) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderSnap.data();
      
      // Ensure the current user is the sourcing agent
      if (orderData.sourcing?.sourcingAgentId !== currentUser.uid) {
        throw new Error('Only the assigned sourcing agent can mark items as ready');
      }

      // Ensure the order is in the correct status
      if (orderData.status !== ORDER_STATUS.SOURCING && orderData.status !== ORDER_STATUS.SOURCING_READY) {
        throw new Error('Order must be in sourcing status to mark items ready');
      }
      
      // Update the ready status of specified items
      const updatedItems = [...orderData.sourcing.items];
      const now = new Date().toISOString();
      
      itemIndices.forEach(index => {
        if (index >= 0 && index < updatedItems.length) {
          updatedItems[index] = {
            ...updatedItems[index],
            ready: true,
            readyAt: now
          };
        }
      });
      
      // Check if all items are ready
      const allItemsReady = updatedItems.every(item => item.ready);
      
      const updateData = {
        'sourcing.items': updatedItems,
        'sourcing.lastUpdatedAt': now,
        updatedAt: serverTimestamp(),
      };

      // Update order status if all items are ready
      if (allItemsReady) {
        updateData.status = ORDER_STATUS.SOURCING_READY;
        updateData['sourcing.status'] = 'ready';
        updateData['sourcing.readyAt'] = now;
      }
      
      await updateDoc(orderRef, updateData);
      
      // If all items are ready, create a notification for the sourcing agent
      if (allItemsReady) {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          userId: currentUser.uid,
          type: 'ITEMS_READY',
          orderId,
          orderTitle: orderData.title,
          message: `All items for order ${orderData.title} are ready for delivery.`,
          read: false,
          timestamp: serverTimestamp(),
        });
      }
      
      return { success: true, allItemsReady };
    } catch (error) {
      throw error;
    }
  }

  // Mark that materials have been delivered to the work site
  async function completeDelivery(orderId) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderSnap.data();
      
      // Ensure the current user is the sourcing agent
      if (orderData.sourcing?.sourcingAgentId !== currentUser.uid) {
        throw new Error('Only the assigned sourcing agent can complete delivery');
      }

      // Ensure the order is in SOURCING_READY status
      if (orderData.status !== ORDER_STATUS.SOURCING_READY) {
        throw new Error('All items must be ready before completing delivery');
      }

      const now = new Date().toISOString();
      
      await updateDoc(orderRef, {
        status: ORDER_STATUS.DELIVERED,
        'sourcing.completed': true,
        'sourcing.status': 'delivered',
        'sourcing.completedAt': now,
        'sourcing.deliveryDetails': {
          completedBy: currentUser.uid,
          completedByName: currentUser.fullName,
          timestamp: now
        },
        updatedAt: serverTimestamp(),
      });
      
      // Create a delivery notification for the contractor
      if (orderData.contractorId) {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          userId: orderData.contractorId,
          type: 'DELIVERY_COMPLETED',
          orderId,
          orderTitle: orderData.title,
          message: `Materials for order ${orderData.title} have been delivered and are ready for use.`,
          read: false,
          timestamp: serverTimestamp(),
        });
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Add a new function to track sourcing progress
  async function updateSourcingProgress(orderId, progress) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderSnap.data();
      
      // Ensure the current user is the sourcing agent
      if (orderData.sourcing?.sourcingAgentId !== currentUser.uid) {
        throw new Error('Only the assigned sourcing agent can update progress');
      }

      // Ensure the order is in a valid status for progress updates
      if (![ORDER_STATUS.SOURCING, ORDER_STATUS.SOURCING_READY].includes(orderData.status)) {
        throw new Error('Can only update progress while sourcing is in progress');
      }

      await updateDoc(orderRef, {
        'sourcing.progress': progress,
        'sourcing.lastProgressUpdate': new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // This is where everyone gets their fair share of the project's value
  async function finalizeOrder(orderId, totalRevenue) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      // Get revenue share percentages from settings
      const revenueSharePercentages = getRevenueShares();
      
      // Calculate each party's cut based on current settings
      const contractorShare = totalRevenue * revenueSharePercentages.contractor;
      const brokerShare = totalRevenue * revenueSharePercentages.broker;
      const investorShare = totalRevenue * revenueSharePercentages.investor;
      const adminShare = totalRevenue * revenueSharePercentages.admin;
      
      await updateDoc(orderRef, {
        status: ORDER_STATUS.COMPLETED,
        completedAt: new Date().toISOString(),
        totalRevenue,
        revenueShares: {
          contractor: contractorShare,
          broker: brokerShare,
          investor: investorShare,
          admin: adminShare,
        },
        updatedAt: serverTimestamp(),
      });
      
      return { 
        success: true,
        shares: {
          contractor: contractorShare,
          broker: brokerShare,
          investor: investorShare,
          admin: adminShare,
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Add new function to handle funding expiration
  async function handleFundingExpiration(orderId, orderData) {
    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      
      // Reset bids to pending status
      const resetBids = (orderData.bids || []).map(bid => ({
        ...bid,
        status: 'pending'
      }));
      
      // Create transaction history record
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        type: 'FUNDING_EXPIRED',
        orderId,
        orderTitle: orderData.title,
        previousInvestor: {
          id: orderData.funding.investorId,
          name: orderData.funding.investorName,
          amount: orderData.funding.amount
        },
        timestamp: serverTimestamp(),
      });
      
      // Create notifications for relevant parties
      const notificationsCollection = collection(db, 'notifications');
      
      // Notify broker
      const brokerNotifRef = doc(notificationsCollection);
      batch.set(brokerNotifRef, {
        userId: orderData.brokerId,
        type: 'FUNDING_EXPIRED',
        orderId,
        orderTitle: orderData.title,
        message: `Funding confirmation deadline expired for order ${orderData.title}. Order has returned to bidding status.`,
        read: false,
        timestamp: serverTimestamp(),
      });
      
      // Notify previous investor
      const investorNotifRef = doc(notificationsCollection);
      batch.set(investorNotifRef, {
        userId: orderData.funding.investorId,
        type: 'FUNDING_EXPIRED',
        orderId,
        orderTitle: orderData.title,
        message: `Your funding confirmation deadline for order ${orderData.title} has expired. The order has returned to bidding status.`,
        read: false,
        timestamp: serverTimestamp(),
      });
      
      // Update order status
      batch.update(orderRef, {
        status: ORDER_STATUS.BIDDING,
        bids: resetBids,
        funding: {
          ...orderData.funding,
          pendingConfirmation: false,
          expirationReason: 'Funding confirmation deadline expired',
          expiredAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      
      await batch.commit();
      
      console.log(`Successfully handled funding expiration for order ${orderId}`);
    } catch (error) {
      console.error('Error handling funding expiration:', error);
      throw error;
    }
  }

  // Add new function to handle bidding deadline expiration
  async function handleBiddingDeadline(orderId, orderData) {
    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      
      // Get the highest bid
      const highestBid = orderData.bids.reduce((highest, current) => 
        (current.amount > highest.amount) ? current : highest, 
        { amount: 0 }
      );

      // Update bids status
      const updatedBids = orderData.bids.map(bid => ({
        ...bid,
        status: bid.investorId === highestBid.investorId ? 'accepted' : 'rejected'
      }));

      // Update order status
      batch.update(orderRef, {
        status: ORDER_STATUS.FUNDED,
        biddingStatus: 'closed',
        bids: updatedBids,
        funding: {
          amount: highestBid.amount,
          investorId: highestBid.investorId,
          investorName: highestBid.investorName,
          funded: false,
          pendingConfirmation: true,
          selectedAt: new Date().toISOString(),
          confirmationDeadline: (() => {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + (settings?.fundingConfirmationDeadlineDays || 7));
            return deadline.toISOString();
          })()
        },
        updatedAt: serverTimestamp(),
      });

      // Create notifications
      const notificationsCollection = collection(db, 'notifications');
      
      // Notify broker
      batch.set(doc(notificationsCollection), {
        userId: orderData.brokerId,
        type: 'BIDDING_CLOSED',
        orderId,
        orderTitle: orderData.title,
        message: `Bidding has closed for order ${orderData.title}. Highest bid: $${highestBid.amount} by ${highestBid.investorName}`,
        read: false,
        timestamp: serverTimestamp(),
      });

      // Notify winning investor
      batch.set(doc(notificationsCollection), {
        userId: highestBid.investorId,
        type: 'BID_WON',
        orderId,
        orderTitle: orderData.title,
        message: `Congratulations! You won the bid for order ${orderData.title}. Please confirm funding.`,
        read: false,
        timestamp: serverTimestamp(),
      });

      await batch.commit();
      
      console.log(`Successfully handled bidding deadline for order ${orderId}`);
    } catch (error) {
      console.error('Error handling bidding deadline:', error);
      throw error;
    }
  }

  // Different users see different orders based on their role
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let ordersQuery;
    const ordersRef = collection(db, 'orders');

    // This ensures everyone only sees what's relevant to them
    switch (currentUser.role) {
      case 'contractor':
        // Contractors only see jobs assigned to them
        ordersQuery = query(ordersRef, where('contractorId', '==', currentUser.uid));
        break;
      case 'broker':
        // Brokers see orders they've created
        ordersQuery = query(ordersRef, where('brokerId', '==', currentUser.uid));
        break;
      case 'investor':
        // Investors see orders they can bid on or have funded
        ordersQuery = query(
          ordersRef, 
          where('status', 'in', [ORDER_STATUS.BIDDING, ORDER_STATUS.FUNDED, ORDER_STATUS.FUNDING_CONFIRMED, ORDER_STATUS.SOURCING, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED])
        );
        break;
      case 'sourcing_agent':
        // Sourcing agents see funded orders ready for material allocation
        ordersQuery = query(
          ordersRef, 
          where('status', 'in', [ORDER_STATUS.FUNDING_CONFIRMED, ORDER_STATUS.SOURCING, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED])
        );
        break;
      case 'client':
        // Clients see orders they've requested
        ordersQuery = query(ordersRef, where('clientId', '==', currentUser.uid));
        break;
      case 'admin':
        // Admins see everything
        ordersQuery = ordersRef;
        break;
      default:
        ordersQuery = ordersRef;
    }

    // Real-time updates so everyone sees the latest status changes immediately
    const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setOrders(ordersData);
      setLoading(false);
    });

    // Add to global unsubscribers
    if (!window.firestoreUnsubscribers) {
      window.firestoreUnsubscribers = [];
    }
    window.firestoreUnsubscribers.push(unsubscribe);

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

  useEffect(() => {
    if (!currentUser) return;

    const checkDeadlines = async () => {
      try {
        const now = new Date();
        
        // Check for orders with passed bidding deadlines
        const biddingOrders = await getDocs(
          query(
            collection(db, 'orders'),
            where('status', '==', ORDER_STATUS.BIDDING),
            where('biddingStatus', '==', 'open')
          )
        );
        
        for (const orderDoc of biddingOrders.docs) {
          const orderData = orderDoc.data();
          
          if (orderData.biddingDeadline) {
            const deadlineDate = new Date(orderData.biddingDeadline);
            
            if (deadlineDate < now) {
              console.log(`Bidding deadline reached for order ${orderDoc.id}`);
              await handleBiddingDeadline(orderDoc.id, orderData);
            }
          }
        }

        // Check for expired funding confirmation deadlines
        const fundedOrders = await getDocs(
          query(
            collection(db, 'orders'),
            where('status', '==', ORDER_STATUS.FUNDED),
            where('funding.pendingConfirmation', '==', true)
          )
        );
        
        for (const orderDoc of fundedOrders.docs) {
          const orderData = orderDoc.data();
          
          if (orderData.funding?.confirmationDeadline) {
            const deadlineDate = new Date(orderData.funding.confirmationDeadline);
            
            if (deadlineDate < now) {
              console.log(`Funding confirmation deadline expired for order ${orderDoc.id}`);
              await handleFundingExpiration(orderDoc.id, orderData);
            }
          }
        }
      } catch (error) {
        console.error('Error checking deadlines:', error);
      }
    };

    // Run immediately and then every 5 minutes
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    respondToOrder,
    submitBid,
    confirmFunding,
    allocateItems,
    markItemsReady,
    completeDelivery,
    updateSourcingProgress,
    finalizeOrder,
    ORDER_STATUS,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
} 