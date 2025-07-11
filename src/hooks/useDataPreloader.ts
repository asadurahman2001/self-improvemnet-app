import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PreloadedData {
  studySessions: any[];
  prayerRecords: any[];
  quranSessions: any[];
  habitRecords: any[];
  attendanceRecords: any[];
  classSchedules: any[];
  sleepRecords: any[];
  exams: any[];
  achievements: any[];
  profile: any;
  loading: boolean;
  lastUpdated: string;
}

export const useDataPreloader = () => {
  const { user } = useAuth();
  const [preloadedData, setPreloadedData] = useState<PreloadedData>({
    studySessions: [],
    prayerRecords: [],
    quranSessions: [],
    habitRecords: [],
    attendanceRecords: [],
    classSchedules: [],
    sleepRecords: [],
    exams: [],
    achievements: [],
    profile: null,
    loading: true,
    lastUpdated: ''
  });

  useEffect(() => {
    if (user) {
      preloadAllData();
    }
  }, [user]);

  const preloadAllData = async () => {
    if (!user) return;

    try {
      setPreloadedData(prev => ({ ...prev, loading: true }));

      // Load all data in parallel for better performance
      const [
        studySessionsResult,
        prayerRecordsResult,
        quranSessionsResult,
        habitRecordsResult,
        attendanceRecordsResult,
        classSchedulesResult,
        sleepRecordsResult,
        examsResult,
        profileResult
      ] = await Promise.all([
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('prayer_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('quran_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('attendance_records').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('class_schedules').select('*').eq('user_id', user.id).order('time'),
        supabase.from('sleep_records').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('exams').select('*').eq('user_id', user.id).order('date'),
        supabase.from('profiles').select('*').eq('user_id', user.id).single()
      ]);

      // Store in localStorage for offline access
      const dataToCache = {
        studySessions: studySessionsResult.data || [],
        prayerRecords: prayerRecordsResult.data || [],
        quranSessions: quranSessionsResult.data || [],
        habitRecords: habitRecordsResult.data || [],
        attendanceRecords: attendanceRecordsResult.data || [],
        classSchedules: classSchedulesResult.data || [],
        sleepRecords: sleepRecordsResult.data || [],
        exams: examsResult.data || [],
        profile: profileResult.data,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('preloaded_data', JSON.stringify(dataToCache));

      setPreloadedData({
        ...dataToCache,
        achievements: [], // Will be calculated from other data
        loading: false
      });

    } catch (error) {
      console.error('Error preloading data:', error);
      
      // Try to load from cache if online loading fails
      const cachedData = localStorage.getItem('preloaded_data');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setPreloadedData({
          ...parsed,
          achievements: [],
          loading: false
        });
      } else {
        setPreloadedData(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const refreshData = () => {
    if (user) {
      preloadAllData();
    }
  };

  return { preloadedData, refreshData };
};