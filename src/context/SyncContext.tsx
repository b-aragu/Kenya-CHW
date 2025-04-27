import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { processConsultationQueue, getQueuedConsultations } from '../services/groqService';
import { useToast } from "@/components/ui/use-toast";

// Define the shape of our context
interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  queuedItems: number;
  syncNow: () => Promise<void>;
  lastSynced: Date | null;
  addToQueue: (item: QueuedItem) => void;
}

export interface QueuedItem {
  id: string;
  type: 'consultation' | 'patient' | 'activity';
  data: any;
  timestamp: Date;
}

// Create the context with default values
const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  isSyncing: false,
  queuedItems: 0,
  syncNow: async () => {},
  lastSynced: null,
  addToQueue: () => {},
});

// Custom hook to use the sync context
export const useSync = () => useContext(SyncContext);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedItems, setQueuedItems] = useState(0);
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  // Update online status and check queued items
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // If we just came online, trigger sync
      if (online && !isOnline) {
        syncData();
      }
    };

    const updateQueuedItems = () => {
      const queued = getQueuedConsultations();
      setQueuedItems(queued.length);
    };

    // Set initial values
    updateOnlineStatus();
    updateQueuedItems();

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Check queued items every minute
    const queueCheckInterval = setInterval(updateQueuedItems, 60000);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(queueCheckInterval);
    };
  }, [isOnline]);

  // Load queued items from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('syncQueue');
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        // Convert string timestamps back to Date objects
        const processedQueue = parsedQueue.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setQueue(processedQueue);
      } catch (error) {
        console.error('Failed to parse sync queue:', error);
        // If parsing fails, initialize with empty queue
        localStorage.setItem('syncQueue', JSON.stringify([]));
      }
    }

    // Load last synced time
    const lastSyncedTime = localStorage.getItem('lastSynced');
    if (lastSyncedTime) {
      setLastSynced(new Date(lastSyncedTime));
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('syncQueue', JSON.stringify(queue));
  }, [queue]);

  // Function to add an item to the sync queue
  const addToQueue = (item: QueuedItem) => {
    setQueue(prevQueue => {
      // Check if item with same ID and type already exists
      const existingItemIndex = prevQueue.findIndex(
        qItem => qItem.id === item.id && qItem.type === item.type
      );

      if (existingItemIndex >= 0) {
        // Replace existing item with new one
        const newQueue = [...prevQueue];
        newQueue[existingItemIndex] = item;
        return newQueue;
      } else {
        // Add new item to queue
        return [...prevQueue, item];
      }
    });
  };

  // Function to manually trigger synchronization
  const syncData = async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Process consultation queue
      const results = await processConsultationQueue();
      
      // Update queued items count
      const queued = getQueuedConsultations();
      setQueuedItems(queued.length);
      
      // Update last synced time
      setLastSynced(new Date());
      
      // Show success toast
      if (results.success > 0 || results.failed > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully processed ${results.success} items. Failed: ${results.failed}.`,
          variant: results.failed > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: "Could not synchronize data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to manually trigger sync
  const syncNow = async (): Promise<void> => {
    if (!isOnline || isSyncing || queue.length === 0) {
      return;
    }

    setIsSyncing(true);
    
    try {
      // Here we would typically send the data to an API
      // For now, we'll simulate a successful sync with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Synced items:', queue);
      
      // Update last synced time
      const now = new Date();
      setLastSynced(now);
      localStorage.setItem('lastSynced', now.toString());
      
      // Clear the queue after successful sync
      setQueue([]);
      
      toast({
        title: "Sync completed",
        description: `Successfully synced ${queue.length} items.`,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when we come back online and have items in queue
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      // Wait a moment before trying to sync to ensure stable connection
      const timer = setTimeout(() => {
        syncNow();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, isSyncing]);

  // The value that will be provided to consumers of this context
  const contextValue: SyncContextType = {
    isOnline,
    isSyncing,
    queuedItems,
    syncNow,
    lastSynced,
    addToQueue,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
}; 