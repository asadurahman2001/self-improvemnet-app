import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineStorage } from './useOfflineStorage';
import { supabase } from '../lib/supabase';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const { isOnline, getPendingSync, clearPendingSync } = useOfflineStorage();

  useEffect(() => {
    if (isOnline && user) {
      syncPendingData();
    }
  }, [isOnline, user]);

  const syncPendingData = async () => {
    const pendingActions = getPendingSync();
    
    if (pendingActions.length === 0) return;

    try {
      for (const action of pendingActions) {
        await syncAction(action);
      }
      clearPendingSync();
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const syncAction = async (action: any) => {
    const { table, operation, data } = action;

    switch (operation) {
      case 'insert':
        await supabase.from(table).insert(data);
        break;
      case 'update':
        await supabase.from(table).update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from(table).delete().eq('id', data.id);
        break;
      default:
        console.warn('Unknown operation:', operation);
    }
  };

  return { syncPendingData };
};