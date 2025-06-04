import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, JSX } from 'react';
import { API_BASE_URL } from '@/lib/utils';

const USER_DATA_KEY = 'userData';
const SYNC_QUEUE_KEY = 'syncQueue';

interface SyncResult {
    type: string;
    model: string;
    tempId?: string;
    id?: string;
    error?: string;
}

interface UserData {
  patients: any[];
  consultations: any[];
  activities: any[];
  lastSync?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    role: string;
  };
}

interface SyncChange {
  type: 'create' | 'update' | 'delete';
  model: string;
  data: any;
  tempId?: string;
}

interface AppState {
  userData: UserData | null;
  syncQueue: SyncChange[];
}

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  syncOfflineChanges: () => Promise<{success: boolean; error?: string}>;
  addToSyncQueue: (change: SyncChange) => void;
  addActivity: (description: string, type: string, relatedId?: string | number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({children}: {children: ReactNode}): JSX.Element => {
  const [state, setState] = useState<AppState>(() => {
    const storedUserData = localStorage.getItem(USER_DATA_KEY);
    const storedQueue = localStorage.getItem(SYNC_QUEUE_KEY);

    return {
      userData: storedUserData ? (JSON.parse(storedUserData) as UserData) : null,
      syncQueue: storedQueue ? (JSON.parse(storedQueue) as SyncChange[]) : [],
    };
  });

// replace temporary IDs
const replaceTempIds = useCallback((userData: UserData, model: string, tempId: string, realId: string): UserData => {
    const modelKey = `${model.toLowerCase()}s` as keyof UserData;
    const updatedUserData: UserData = { ...userData };
    const modelArray = updatedUserData[modelKey];

    if (Array.isArray(modelArray)) {
        updatedUserData[modelKey] = modelArray.map(item => {
            if (item.id === tempId || item.tempId === tempId) { return { ...item, id: realId, tempId }; }
            return item;
        });
    } else { console.warn(`ReplaceTempIds: ${modelKey} is not an array: `, updatedUserData[modelKey]); }

    return updatedUserData;
}, []);

//add to sync queue
const addToSyncQueue = useCallback((change: SyncChange): void => {
    setState(prev => ({
      ...prev, syncQueue: [...prev.syncQueue, change],
    }));
}, []);

// sync function
const syncOfflineChanges = useCallback(async (): Promise<{success: boolean; error?: string}> => {
    if (state.syncQueue.length === 0) return { success: true };

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authenticatipn token  missing");
        const response = await axios.post(`${API_BASE_URL}/api/sync`, {changes: state.syncQueue}, {headers: {Authorization: `Bearer ${token}`}});

        // Update local data with server IDs
        if(state.userData) {
            let updatedUserData = { ...state.userData };

            response.data.results.forEach((result: SyncResult) => {
            if (result.type === 'create' && result.tempId && result.id) {
                updatedUserData = replaceTempIds(updatedUserData, result.model, result.tempId, result.id);
            }
            });

            // update last sync time
            updatedUserData.lastSync = new Date().toISOString();

            //Update state
            setState(prev => ({ ...prev, userData: updatedUserData, syncQueue: [] }));
        }
        return { success: true };
    } catch (error) {
        console.error('Sync failed', error);
        return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }, [state.syncQueue, state.userData, replaceTempIds]);

  // persist to local cahnges whenever state changes
  useEffect(() => {
    if (state.userData) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(state.userData));
    }
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(state.syncQueue));
  }, [state.syncQueue]);

  const addActivity = useCallback((description: string, type: string, relatedId?: string | number) => {
    if (!state.userData) return;

    const newActivity = {
      id: Date.now(),
      description,
      type,
      lastUpdated: new Date().toISOString(),
    };

    const updatedActivities = [...state.userData.activities, newActivity];

    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData!,
        activities: updatedActivities,
      },
    }));
  }, [state.userData, setState]);

  // Memoize the context value so children only re-render on actual changes
  const contextValue = useMemo(
    () => ({
      state,
      setState,
      syncOfflineChanges,
      addToSyncQueue,
      addActivity,
    }),
    [state, syncOfflineChanges, addToSyncQueue]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
