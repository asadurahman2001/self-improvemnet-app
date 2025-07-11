import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, Check, Clock, Sun, Sunrise, CloudSun, Sunset, Moon, Users, User, AlertCircle, Edit3, Save, X } from 'lucide-react';

interface Prayer {
  name: string;
  time: string;
  completed: boolean;
  type: 'jamat' | 'individual' | 'kaza' | null;
  icon: React.ComponentType<{ className?: string }>;
}

export const PrayerTracker: React.FC = () => {
  const { user } = useAuth();
  
  // Default prayer times
  const defaultPrayers: Prayer[] = [
    { name: 'Fajr', time: '05:00', completed: false, type: null, icon: Sunrise },
    { name: 'Dhuhr', time: '12:00', completed: false, type: null, icon: Sun },
    { name: 'Asr', time: '16:00', completed: false, type: null, icon: CloudSun },
    { name: 'Maghrib', time: '18:00', completed: false, type: null, icon: Sunset },
    { name: 'Isha', time: '20:00', completed: false, type: null, icon: Moon },
  ];

  const [prayers, setPrayers] = useState<Prayer[]>(defaultPrayers);
  const [loading, setLoading] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [streak, setStreak] = useState(0);
  const [monthlyProgress, setMonthlyProgress] = useState(0);
  const [showPrayerModal, setShowPrayerModal] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({
    totalPrayers: 0,
    totalPossible: 35,
    withJamat: 0,
    consistency: 0,
    bestStreak: 0,
    personalBest: 0
  });
  const [kazaPrayers, setKazaPrayers] = useState<Array<{
    id: string;
    prayer_name: string;
    date: string;
    completed: boolean;
    completed_date?: string;
    prayer_time: string;
  }>>([]);
  const [showKazaModal, setShowKazaModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Set default prayers immediately
      setPrayers(defaultPrayers);
      // Load data in background
      loadAllData();
      // Test database connection
      testDatabaseConnection();
    }
  }, [user]);

  const testDatabaseConnection = async () => {
    if (!user) return;

    console.log('Testing database connection...');
    
    // Test if we can read from missed_prayers table
    const { data, error } = await supabase
      .from('missed_prayers')
      .select('count')
      .eq('user_id', user.id)
      .limit(1);
    
    console.log('Database connection test:', { data, error });
  };

  const clearTodaysPrayers = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Clearing all prayers for today:', today);
    
    try {
      // Clear regular prayers
      const { error: regularError } = await supabase
        .from('prayer_records')
        .delete()
      .eq('user_id', user.id)
      .eq('date', today);

      console.log('Clear regular prayers result:', { error: regularError });
      
      // Clear kaza prayers
      const { error: kazaError } = await supabase
        .from('missed_prayers')
        .delete()
        .eq('user_id', user.id)
        .eq('missed_date', today);
      
      console.log('Clear kaza prayers result:', { error: kazaError });
      
      // Reload data
      await loadAllData();
      
    } catch (error) {
      console.error('Error clearing prayers:', error);
    }
  };

  const loadAllData = async () => {
    if (!user) return;
    
    try {
      // Load all data in parallel for better performance
      const [
        todaysPrayersResult,
        weeklyStatsResult,
        streakResult,
        kazaPrayersResult
      ] = await Promise.all([
        loadTodaysPrayers(),
        loadWeeklyStats(),
        loadStreakData(),
        loadKazaPrayers()
      ]);

      // Combine default prayers with today's data
      if (todaysPrayersResult) {
        const updatedPrayers = defaultPrayers.map(prayer => {
          const record = todaysPrayersResult.find(r => r.prayer_name === prayer.name);
        return {
          ...prayer,
          completed: !!record,
          type: record?.prayer_type || null
        };
      });
      setPrayers(updatedPrayers);
      }

      // Check for missed prayers after everything is loaded
      await checkForMissedPrayers();
    } catch (error) {
      console.error('Error loading prayer data:', error);
    }
  };

  const startEditPrayer = (prayerName: string, currentTime: string) => {
    setEditingPrayer(prayerName);
    setEditTime(currentTime);
  };

  const savePrayerTime = (prayerName: string) => {
    setPrayers(prev => prev.map(prayer => 
      prayer.name === prayerName 
        ? { ...prayer, time: editTime }
        : prayer
    ));
    setEditingPrayer(null);
    setEditTime('');
  };

  const cancelEdit = () => {
    setEditingPrayer(null);
    setEditTime('');
  };

  const loadTodaysPrayers = async () => {
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];
    
    console.log('Loading today\'s prayers for date:', today);
    
    // Get regular prayers from prayer_records
    const { data: regularPrayers, error: regularError } = await supabase
      .from('prayer_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    console.log('Regular prayers loaded:', regularPrayers, 'Error:', regularError);

    // Get kaza prayers from missed_prayers (show both completed and incomplete in daily prayers)
    const { data: kazaPrayers, error: kazaError } = await supabase
      .from('missed_prayers')
      .select('*')
      .eq('user_id', user.id)
      .eq('missed_date', today); // Show all kaza prayers in daily display

    console.log('Kaza prayers loaded:', kazaPrayers, 'Error:', kazaError);

    // Combine both types of prayers
    const allPrayers = [
      ...(regularPrayers || []),
      ...(kazaPrayers || []).map(kaza => ({
        ...kaza,
        prayer_type: 'kaza',
        date: kaza.missed_date,
        time: kaza.completed_time || kaza.prayer_time,
        completed: kaza.is_completed // Use the actual completion status
      }))
    ];

    console.log('Combined prayers for today:', allPrayers);
    return allPrayers;
  };

  const loadWeeklyStats = async () => {
    if (!user) return;

    // Get the start of the current week (Sunday)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get the end of the current week (Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('prayer_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr);

    if (data) {
      // Only count regular prayers (jamat/individual), exclude kaza prayers
      const regularPrayers = data.filter(record => record.prayer_type !== 'kaza');
      const totalPrayers = regularPrayers.length;
      const totalPossible = 35; // 5 prayers × 7 days
      const withJamat = regularPrayers.filter(record => record.prayer_type === 'jamat').length;
      const consistency = Math.round((totalPrayers / totalPossible) * 100);

      setWeeklyStats({
        totalPrayers,
        totalPossible,
        withJamat,
        consistency,
        bestStreak: 0, // Will be calculated separately
        personalBest: 0 // Will be calculated separately
      });
    }
  };

  const loadStreakData = async () => {
    if (!user) return;

    // Calculate current streak
    const today = new Date();
    let currentStreak = 0;
    let day = new Date(today);

    while (true) {
      const dateStr = day.toISOString().split('T')[0];
      const { data } = await supabase
        .from('prayer_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      if (data && data.length >= 5) { // At least 5 prayers completed
        currentStreak++;
        day.setDate(day.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);

    // Calculate monthly progress
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { data: monthlyData } = await supabase
      .from('prayer_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthStartStr);

    if (monthlyData) {
      const daysInMonth = new Date().getDate();
      const totalPossible = daysInMonth * 5;
      const monthlyProgress = Math.round((monthlyData.length / totalPossible) * 100);
      setMonthlyProgress(monthlyProgress);
    }
  };

  const loadKazaPrayers = async () => {
    if (!user) return;

    // Get missed prayers from the last 30 days from the missed_prayers table
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    console.log('Loading kaza prayers from:', startDate, 'to:', today);

    // Fetch missed prayers from the database (show all - both completed and incomplete)
    const { data: missedPrayersData, error } = await supabase
      .from('missed_prayers')
      .select('*')
      .eq('user_id', user.id)
      .gte('missed_date', startDate)
      .lte('missed_date', today)
      .order('missed_date', { ascending: false });

    console.log('Missed prayers data:', missedPrayersData, 'Error:', error);

    if (missedPrayersData) {
      const kazaPrayersList = missedPrayersData.map(prayer => ({
        id: prayer.id,
        prayer_name: prayer.prayer_name,
        date: prayer.missed_date,
        completed: prayer.is_completed,
        completed_date: prayer.completed_date,
        prayer_time: prayer.prayer_time
      }));

      console.log('Processed kaza prayers list:', kazaPrayersList);
      setKazaPrayers(kazaPrayersList);
    } else {
      setKazaPrayers([]);
    }
  };

  const checkForMissedPrayers = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Use local prayer times instead of database function
    for (const prayer of prayers) {
      if (currentTime > prayer.time) {
        // Check if this prayer was completed today
        const { data: completedPrayer } = await supabase
          .from('prayer_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('prayer_name', prayer.name)
          .eq('date', today)
          .single();

        // If not completed, check if it's already in missed_prayers
        if (!completedPrayer) {
          const { data: existingMissed } = await supabase
            .from('missed_prayers')
            .select('*')
            .eq('user_id', user.id)
            .eq('prayer_name', prayer.name)
            .eq('missed_date', today)
            .single();

          // If not already recorded as missed, add it
          if (!existingMissed) {
            await supabase
              .from('missed_prayers')
              .insert({
                user_id: user.id,
                prayer_name: prayer.name,
                missed_date: today,
                prayer_time: prayer.time
              });
          }
        }
      }
    }
  };

  const logPrayer = async (prayerName: string, type: 'jamat' | 'individual' | 'kaza') => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    console.log('Logging prayer:', { prayerName, type, today, now });

    try {
      if (type === 'kaza') {
        // For kaza prayers, add to missed_prayers table as incomplete
        const { data, error } = await supabase
          .from('missed_prayers')
          .upsert({
            user_id: user.id,
            prayer_name: prayerName,
            missed_date: today,
            prayer_time: prayers.find(p => p.name === prayerName)?.time || '00:00',
            is_completed: false, // Mark as incomplete so it shows in kaza list
            completed_date: null,
            completed_time: null
          }, {
            onConflict: 'user_id,prayer_name,missed_date'
          })
          .select();

        console.log('Kaza prayer insert result:', { data, error });

        if (error) {
          console.error('Error adding kaza prayer:', error);
          return;
        }

        // Update local state to show as completed in daily prayers
        setPrayers(prev => prev.map(prayer => 
          prayer.name === prayerName 
            ? { ...prayer, completed: true, type } // Show as completed in main prayer list
            : prayer
        ));
        setShowPrayerModal(null);
        // Refresh kaza prayers list
        await loadKazaPrayers();
        
      } else {
        // For regular prayers (jamat/individual), add to prayer_records table
        const { data, error } = await supabase
      .from('prayer_records')
      .upsert({
        user_id: user.id,
        prayer_name: prayerName,
        prayer_type: type,
        date: today,
        time: now
          }, {
            onConflict: 'user_id,prayer_name,date'
          })
          .select();

        console.log('Regular prayer insert result:', { data, error });

        if (error) {
          console.error('Error adding regular prayer:', error);
          return;
        }

      setPrayers(prev => prev.map(prayer => 
        prayer.name === prayerName 
          ? { ...prayer, completed: true, type }
          : prayer
      ));
      setShowPrayerModal(null);
        // Refresh statistics efficiently
        await Promise.all([
          loadWeeklyStats(),
          loadStreakData(),
          loadKazaPrayers()
        ]);
      }
    } catch (error) {
      console.error('Unexpected error logging prayer:', error);
    }
  };

  const removePrayer = async (prayerName: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const prayer = prayers.find(p => p.name === prayerName);
    
    console.log('Removing prayer:', { prayerName, type: prayer?.type, today });
    
    try {
      if (prayer?.type === 'kaza') {
        // For kaza prayers, delete from missed_prayers table
        const { data, error } = await supabase
          .from('missed_prayers')
          .delete()
          .eq('user_id', user.id)
          .eq('prayer_name', prayerName)
          .eq('missed_date', today);

        console.log('Kaza prayer delete result:', { data, error });

        if (error) {
          console.error('Error deleting kaza prayer:', error);
          return;
        }

        // Update local state
        setPrayers(prev => prev.map(p => 
          p.name === prayerName 
            ? { ...p, completed: false, type: null }
            : p
        ));
        
        // Refresh kaza prayers list
        await loadKazaPrayers();
        
      } else {
        // For regular prayers, delete from prayer_records table
        const { data, error } = await supabase
      .from('prayer_records')
      .delete()
      .eq('user_id', user.id)
      .eq('prayer_name', prayerName)
      .eq('date', today);

        console.log('Regular prayer delete result:', { data, error });

        if (error) {
          console.error('Error deleting regular prayer:', error);
          return;
        }

        // Update local state
        setPrayers(prev => prev.map(p => 
          p.name === prayerName 
            ? { ...p, completed: false, type: null }
            : p
        ));
        
        // Refresh statistics efficiently
        await Promise.all([
          loadWeeklyStats(),
          loadStreakData(),
          loadKazaPrayers()
        ]);
      }
    } catch (error) {
      console.error('Unexpected error removing prayer:', error);
    }
  };

  const completedPrayers = prayers.filter(prayer => prayer.completed && prayer.type !== 'kaza').length;
  const progressPercentage = (completedPrayers / prayers.length) * 100;

  const getPrayerTypeIcon = (type: string | null) => {
    switch (type) {
      case 'jamat':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'individual':
        return <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'kaza':
        return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  const getPrayerTypeColor = (type: string | null) => {
    switch (type) {
      case 'jamat':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'individual':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'kaza':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const completeKazaPrayer = async (kazaPrayer: any) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    // Update the missed_prayers table to mark as completed
    const { data, error } = await supabase
      .from('missed_prayers')
      .update({
        is_completed: true,
        completed_date: today,
        completed_time: now,
        updated_at: new Date().toISOString()
      })
      .eq('id', kazaPrayer.id)
      .select();

    if (!error && data) {
      // Update local state
      setKazaPrayers(prev => prev.map(prayer => 
        prayer.id === kazaPrayer.id 
          ? { ...prayer, completed: true, completed_date: today }
          : prayer
      ));
      
      // Refresh statistics efficiently
      await Promise.all([
        loadWeeklyStats(),
        loadStreakData(),
        loadKazaPrayers()
      ]);
    }
  };

  const removeKazaPrayer = async (kazaPrayer: any) => {
    if (!user) return;

    // Update the missed_prayers table to mark as not completed
    const { error } = await supabase
      .from('missed_prayers')
      .update({
        is_completed: false,
        completed_date: null,
        completed_time: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', kazaPrayer.id);

    if (!error) {
      // Update local state
      setKazaPrayers(prev => prev.map(prayer => 
        prayer.id === kazaPrayer.id 
          ? { ...prayer, completed: false, completed_date: undefined }
          : prayer
      ));
      
      // Refresh statistics efficiently
      await Promise.all([
        loadWeeklyStats(),
        loadStreakData(),
        loadKazaPrayers()
      ]);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Prayer Tracker</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={clearTodaysPrayers}
              className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            >
              Clear Today
            </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
            </div>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Progress</h2>
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span className="font-medium">{completedPrayers}/5</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-emerald-100 text-sm mb-2">
            <span>Daily prayers completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-emerald-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-emerald-100 text-sm">Day Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{monthlyProgress}%</div>
            <div className="text-emerald-100 text-sm">Monthly Progress</div>
          </div>
        </div>
      </div>

      {/* Prayer Times */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Daily Prayers</h3>
        <div className="space-y-4">
          {prayers.map((prayer) => {
            const Icon = prayer.icon;
            return (
              <div 
                key={prayer.name} 
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  prayer.completed 
                    ? getPrayerTypeColor(prayer.type)
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    prayer.completed ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-800 dark:text-white">{prayer.name}</h4>
                      {prayer.type && getPrayerTypeIcon(prayer.type)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                            {editingPrayer === prayer.name ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md px-2 py-1 text-sm"
                                />
                                <button onClick={() => savePrayerTime(prayer.name)} className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 flex items-center justify-center transition-colors">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={cancelEdit} className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                      <span>{prayer.time}</span>
                                <button 
                                  onClick={() => startEditPrayer(prayer.name, prayer.time)}
                                  className="w-4 h-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                      {prayer.type && (
                        <span className="capitalize">
                          • {prayer.type === 'jamat' ? 'With Jamat' : prayer.type === 'individual' ? 'Individual' : 'Kaza/Missed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {prayer.completed ? (
                    <button
                      onClick={() => removePrayer(prayer.name)}
                      className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPrayerModal(prayer.name)}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-center transition-colors"
                    >
                      <Check className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prayer Type Modal */}
      {showPrayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Log {showPrayerModal} Prayer
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => logPrayer(showPrayerModal, 'jamat')}
                className="w-full flex items-center space-x-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-800 dark:text-white">With Jamat</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Prayed in congregation</div>
                </div>
              </button>
              <button
                onClick={() => logPrayer(showPrayerModal, 'individual')}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-800 dark:text-white">Individual</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Prayed alone</div>
                </div>
              </button>
              <button
                onClick={() => logPrayer(showPrayerModal, 'kaza')}
                className="w-full flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
              >
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div className="text-left">
                      <div className="font-medium text-gray-800 dark:text-white">Mark as Missed</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Add to kaza list for later completion</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowPrayerModal(null)}
              className="w-full mt-4 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total prayers</span>
                  <span className="font-medium text-gray-800 dark:text-white">{weeklyStats.totalPrayers}/{weeklyStats.totalPossible}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">With Jamat</span>
                  <span className="font-medium text-gray-800 dark:text-white">{weeklyStats.withJamat}/{weeklyStats.totalPossible}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Consistency</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{weeklyStats.consistency}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Best Streak</h3>
          <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{streak}</div>
            <p className="text-gray-500 dark:text-gray-400">Days of consistent prayers</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Current streak</p>
              </div>
            </div>
          </div>

          {/* Kaza Prayers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Kaza Prayers (Last 30 Days)</h3>
              <button
                onClick={() => setShowKazaModal(!showKazaModal)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showKazaModal ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>Missed prayers</span>
                <span>{kazaPrayers.filter(p => !p.completed).length} remaining</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(kazaPrayers.filter(p => p.completed).length / Math.max(kazaPrayers.length, 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {kazaPrayers.filter(p => p.completed).length} of {kazaPrayers.length} completed
              </p>
            </div>

            {showKazaModal && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {kazaPrayers.length > 0 ? (
                  kazaPrayers.map((kazaPrayer) => (
                    <div 
                      key={kazaPrayer.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        kazaPrayer.completed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          kazaPrayer.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-orange-500 text-white'
                        }`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {kazaPrayer.prayer_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Missed on {new Date(kazaPrayer.date).toLocaleDateString()}
                            {kazaPrayer.completed && (
                              <span className="ml-2 text-green-600 dark:text-green-400">
                                • Completed on {new Date(kazaPrayer.completed_date!).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {kazaPrayer.completed ? (
                          <button
                            onClick={() => removeKazaPrayer(kazaPrayer)}
                            className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                            title="Mark as incomplete"
                          >
                            ×
                          </button>
                        ) : (
                          <button
                            onClick={() => completeKazaPrayer(kazaPrayer)}
                            className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 flex items-center justify-center transition-colors"
                            title="Mark as completed"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p>No missed prayers in the last 30 days</p>
                    <p className="text-sm mt-1">Great job keeping up with your prayers!</p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </>
  );
};