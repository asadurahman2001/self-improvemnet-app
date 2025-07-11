import React from 'react';
import { useOfflineStorage } from '../hooks/useOfflineStorage';
import { Wifi, WifiOff, Cloud, CloudOff, FolderSync as Sync } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingSync } = useOfflineStorage();

  // Don't show indicator if there's no meaningful status to display
  if (isOnline && pendingSync.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 lg:top-4 lg:left-80 z-40 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' 
        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Online</span>
            {pendingSync.length > 0 && (
              <div className="flex items-center space-x-1">
                <Sync className="w-3 h-3 animate-spin" />
                <span className="text-xs">({pendingSync.length})</span>
              </div>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline</span>
            {pendingSync.length > 0 && (
              <div className="flex items-center space-x-1">
                <CloudOff className="w-3 h-3" />
                <span className="text-xs">({pendingSync.length})</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};