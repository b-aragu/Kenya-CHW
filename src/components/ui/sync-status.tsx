
import { useState, useEffect } from "react";

export const SyncStatus = () => {
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'offline'>('synced');
  
  useEffect(() => {
    // Check initial online status
    const isOnline = navigator.onLine;
    setSyncState(isOnline ? 'synced' : 'offline');

    // Listen for online/offline events
    const handleOnline = () => setSyncState('syncing');
    const handleOffline = () => setSyncState('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simulate sync completion after 2 seconds when online
    const syncInterval = setInterval(() => {
      if (navigator.onLine && syncState === 'syncing') {
        setSyncState('synced');
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [syncState]);
  
  // Icon and status text based on sync state
  let icon = null;
  let statusText = '';
  let statusClass = '';
  
  switch (syncState) {
    case 'synced':
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
      statusText = 'Synced';
      statusClass = 'text-green-500';
      break;
    case 'syncing':
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
          <path d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9"></path>
          <path d="M21 12c0-4.97-4.03-9-9-9"></path>
        </svg>
      );
      statusText = 'Syncing';
      statusClass = 'text-yellow-400';
      break;
    case 'offline':
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 0 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      );
      statusText = 'Offline';
      statusClass = 'text-gray-400';
      break;
  }

  return (
    <div className={`flex items-center gap-1 ${statusClass} text-xs`}>
      {icon}
      <span>{statusText}</span>
    </div>
  );
};
