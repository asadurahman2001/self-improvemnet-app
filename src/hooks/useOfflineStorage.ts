import { useState, useEffect } from 'react';

interface OfflineData {
  [key: string]: any;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineData = (key: string, data: any) => {
    try {
      const existingData = localStorage.getItem('offline_data');
      const offlineData: OfflineData = existingData ? JSON.parse(existingData) : {};
      offlineData[key] = data;
      localStorage.setItem('offline_data', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const getOfflineData = (key: string) => {
    try {
      const existingData = localStorage.getItem('offline_data');
      const offlineData: OfflineData = existingData ? JSON.parse(existingData) : {};
      return offlineData[key] || null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  };

  const addToPendingSync = (action: any) => {
    const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
    pending.push({ ...action, timestamp: Date.now() });
    localStorage.setItem('pending_sync', JSON.stringify(pending));
    setPendingSync(pending);
  };

  const clearPendingSync = () => {
    localStorage.removeItem('pending_sync');
    setPendingSync([]);
  };

  const getPendingSync = () => {
    return JSON.parse(localStorage.getItem('pending_sync') || '[]');
  };

  return {
    isOnline,
    saveOfflineData,
    getOfflineData,
    addToPendingSync,
    clearPendingSync,
    getPendingSync,
    pendingSync
  };
};