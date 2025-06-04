import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/context/AppContext";

// Define the shape of our context
interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  queuedItems: number;
  syncNow: () => Promise<void>;
  lastSynced: Date | null;
}

// Create the context with default values
const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  isSyncing: false,
  queuedItems: 0,
  syncNow: async () => {},
  lastSynced: null,
});

// Custom hook to use the sync context
export const useSync = () => useContext(SyncContext);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { state, syncOfflineChanges } = useAppContext();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  // Calculate queued items from context
  const queuedItems = state.syncQueue.length;

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load last synced time from localStorage on mount
  useEffect(() => {
    const lastSyncedTime = localStorage.getItem('lastSynced');
    if (lastSyncedTime) {
      setLastSynced(new Date(lastSyncedTime));
    }
  }, []);

  // Function to manually trigger synchronization
  const syncNow = async (): Promise<void> => {
    if (!isOnline || isSyncing || queuedItems === 0) {
      return;
    }

    setIsSyncing(true);
    
    try {
      const result = await syncOfflineChanges();
      
      if (result.success) {
        // Update last synced time
        const now = new Date();
        setLastSynced(now);
        localStorage.setItem('lastSynced', now.toString());
        
        toast({
          title: "Sync completed",
          description: `Successfully synced ${queuedItems} items.`,
        });
      } else {
        toast({
          title: "Sync failed",
          description: result.error || "Failed to sync data",
          variant: "destructive",
        });
      }
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
    if (isOnline && queuedItems > 0 && !isSyncing) {
      // Wait a moment before trying to sync to ensure stable connection
      const timer = setTimeout(() => {
        syncNow();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, queuedItems, isSyncing]);

  // The value that will be provided to consumers of this context
  const contextValue: SyncContextType = {
    isOnline,
    isSyncing,
    queuedItems,
    syncNow,
    lastSynced,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};