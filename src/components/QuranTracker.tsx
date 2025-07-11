import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Book, BookOpen, Check, Target, TrendingUp, X, Plus, Bookmark, Calendar, Clock } from 'lucide-react';

export const QuranTracker: React.FC = () => {
  const { user } = useAuth();
  const [dailyGoal, setDailyGoal] = useState(2); // pages per day
  const [todayRead, setTodayRead] = useState(0);
  const [currentSurah, setCurrentSurah] = useState('');
  const [currentVerse, setCurrentVerse] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentReadings, setRecentReadings] = useState<Array<{id: string, date: string, pages: number, surah: string, verses: string}>>([]);
  const [bookmarks, setBookmarks] = useState<Array<{id: string, surah: string, verse: string, page: string, notes: string, created_at: string}>>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalPages: 0,
    totalSessions: 0,
    averagePerDay: 0,
    consistency: 0
  });

  // Modal states
  const [showLogModal, setShowLogModal] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Form states
  const [logForm, setLogForm] = useState({
    pages: 1,
    surah: '',
    verses: '',
    notes: ''
  });
  
  const [bookmarkForm, setBookmarkForm] = useState({
    surah: '',
    verse: '',
    page: '',
    notes: ''
  });

  React.useEffect(() => {
    if (user) {
      loadQuranData();
      loadStreakData();
      loadBookmarks();
      loadUserSettings(); // Load daily goal from settings
    }
  }, [user]);

  const loadQuranData = async () => {
    if (!user) return;

    // Load today's reading
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData } = await supabase
      .from('quran_readings')
      .select('pages')
      .eq('user_id', user.id)
      .eq('date', today);

    if (todayData) {
      const totalToday = todayData.reduce((sum, reading) => sum + reading.pages, 0);
      setTodayRead(totalToday);
    }

    // Load recent readings
    const { data: recentData } = await supabase
      .from('quran_readings')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (recentData) {
      setRecentReadings(recentData);
      if (recentData.length > 0) {
        setCurrentSurah(recentData[0].surah);
        // Calculate current page based on total pages read
        const totalPages = recentData.reduce((sum, reading) => sum + reading.pages, 0);
        setCurrentPage(totalPages);
      }
    }

    // Load monthly stats
    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: monthlyData } = await supabase
      .from('quran_readings')
      .select('pages, date')
      .eq('user_id', user.id)
      .gte('date', monthStart.toISOString().split('T')[0]);

    if (monthlyData) {
      const totalPages = monthlyData.reduce((sum, reading) => sum + reading.pages, 0);
      const totalSessions = monthlyData.length;
      const daysInMonth = new Date().getDate();
      const averagePerDay = totalPages / daysInMonth;
      
      setMonthlyStats({
        totalPages,
        totalSessions,
        averagePerDay: Math.round(averagePerDay * 10) / 10,
        consistency: Math.round((totalSessions / daysInMonth) * 100)
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
        .from('quran_readings')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      if (data && data.length > 0) {
        currentStreak++;
        day.setDate(day.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const loadBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('quran_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBookmarks(data);
    }
  };

  const logReadingSession = async () => {
    if (!user || logForm.pages <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    const { error } = await supabase
      .from('quran_readings')
      .insert({
        user_id: user.id,
        pages: logForm.pages,
        surah: logForm.surah,
        verses: logForm.verses,
        date: today,
        notes: logForm.notes
      });

    if (!error) {
      setShowLogModal(false);
      setLogForm({ pages: 1, surah: '', verses: '', notes: '' });
      await loadQuranData();
      await loadStreakData();
    }
  };

  const setBookmark = async () => {
    if (!user || !bookmarkForm.surah) return;

    const { error } = await supabase
      .from('quran_bookmarks')
      .upsert({
        user_id: user.id,
        surah: bookmarkForm.surah,
        verse: bookmarkForm.verse,
        page: bookmarkForm.page,
        notes: bookmarkForm.notes,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,surah'
      });

    if (!error) {
      setShowBookmarkModal(false);
      setBookmarkForm({ surah: '', verse: '', page: '', notes: '' });
      await loadBookmarks();
    }
  };

  const deleteReading = async (readingId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('quran_readings')
      .delete()
      .eq('id', readingId)
      .eq('user_id', user.id);

    if (!error) {
      await loadQuranData();
      await loadStreakData();
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('quran_bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', user.id);

    if (!error) {
      await loadBookmarks();
    }
  };

  const updateDailyGoal = async (newGoal: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        quran_daily_goal: newGoal
      }, {
        onConflict: 'user_id'
      });

    if (!error) {
      setDailyGoal(newGoal);
      setShowGoalModal(false);
    }
  };

  const loadUserSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('quran_daily_goal')
      .eq('user_id', user.id)
      .single();

    if (data && data.quran_daily_goal) {
      setDailyGoal(data.quran_daily_goal);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Quran Tracker</h1>
        <button 
          onClick={() => setShowLogModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Log Reading</span>
        </button>
      </div>

      {/* Current Progress */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Reading</h2>
          <button 
            onClick={() => setShowGoalModal(true)}
            className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors"
          >
            Set Goal
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-emerald-100 text-sm mb-2">
            <span>Daily goal progress</span>
            <span>{Math.round((todayRead / dailyGoal) * 100)}%</span>
          </div>
          <div className="w-full bg-emerald-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min((todayRead / dailyGoal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-emerald-100 text-sm">Day Streak</div>
          </div>
          <div>
            <div className="text-lg font-bold">{currentSurah || 'Not started'}</div>
            <div className="text-emerald-100 text-sm">Current Surah</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{currentPage}</div>
            <div className="text-emerald-100 text-sm">Pages Read</div>
          </div>
        </div>
      </div>

      {/* Reading Goal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reading Goal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Pages Goal
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">pages per day</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Complete Quran in
            </label>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {Math.ceil((604 - (monthlyStats.totalPages * 2)) / dailyGoal)} days
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">At current pace</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round((monthlyStats.totalPages / 604) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((monthlyStats.totalPages / 604) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {monthlyStats.totalPages} of 604 pages completed
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowLogModal(true)}
            className="p-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
          >
            <div className="text-emerald-600 dark:text-emerald-400 font-medium">Log Reading Session</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Record pages read</div>
          </button>
          <button 
            onClick={() => setShowBookmarkModal(true)}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
          >
            <div className="text-blue-600 dark:text-blue-400 font-medium">Set Bookmark</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Save current position</div>
          </button>
          <button 
            onClick={() => setShowProgressModal(true)}
            className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
          >
            <div className="text-purple-600 dark:text-purple-400 font-medium">View Progress</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Detailed analytics</div>
          </button>
        </div>
      </div>

      {/* Recent Readings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Readings</h3>
        <div className="space-y-3">
          {recentReadings.map((reading, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                  <Book className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{reading.surah}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Verses {reading.verses}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-white">{reading.pages} pages</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{reading.date}</div>
                </div>
                <button
                  onClick={() => deleteReading(reading.id)}
                  className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                  title="Delete reading"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {recentReadings.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Book className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No readings recorded yet</p>
              <p className="text-sm mt-1">Start your Quran reading journey today!</p>
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Bookmarks</h3>
        <div className="space-y-3">
          {bookmarks.map((bookmark, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{bookmark.surah}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Verses {bookmark.verse}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{bookmark.page ? `Page ${bookmark.page}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
              <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-white">{bookmark.notes}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{bookmark.created_at}</div>
                </div>
                <button
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                  title="Delete bookmark"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {bookmarks.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bookmark className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No bookmarks saved yet</p>
              <p className="text-sm mt-1">Bookmark your favorite verses!</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Monthly Statistics</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>This month</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{monthlyStats.totalPages}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Pages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyStats.totalSessions}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Reading Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyStats.averagePerDay}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Pages/Day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{monthlyStats.consistency}%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Consistency</div>
          </div>
        </div>
      </div>

      {/* Log Reading Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Log Reading Session</h3>
              <button onClick={() => setShowLogModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pages Read</label>
                <input
                  type="number"
                  value={logForm.pages}
                  onChange={(e) => setLogForm({...logForm, pages: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Surah</label>
                <input
                  type="text"
                  value={logForm.surah}
                  onChange={(e) => setLogForm({...logForm, surah: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Al-Fatiha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verses</label>
                <input
                  type="text"
                  value={logForm.verses}
                  onChange={(e) => setLogForm({...logForm, verses: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., 1-7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={logForm.notes}
                  onChange={(e) => setLogForm({...logForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Any reflections or notes..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={logReadingSession}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Log Session
              </button>
              <button
                onClick={() => setShowLogModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Bookmark Modal */}
      {showBookmarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Set Bookmark</h3>
              <button onClick={() => setShowBookmarkModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Surah</label>
                <input
                  type="text"
                  value={bookmarkForm.surah}
                  onChange={(e) => setBookmarkForm({...bookmarkForm, surah: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Al-Baqarah"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verse</label>
                <input
                  type="text"
                  value={bookmarkForm.verse}
                  onChange={(e) => setBookmarkForm({...bookmarkForm, verse: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., 255"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page (Optional)</label>
                <input
                  type="text"
                  value={bookmarkForm.page}
                  onChange={(e) => setBookmarkForm({...bookmarkForm, page: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., 42"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={bookmarkForm.notes}
                  onChange={(e) => setBookmarkForm({...bookmarkForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Why this bookmark is important..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={setBookmark}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Set Bookmark
              </button>
              <button
                onClick={() => setShowBookmarkModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Detailed Progress</h3>
              <button onClick={() => setShowProgressModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{monthlyStats.totalPages}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Pages</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyStats.totalSessions}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Sessions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyStats.averagePerDay}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Avg/Day</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{monthlyStats.consistency}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Consistency</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Quran Completion Progress</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-emerald-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((monthlyStats.totalPages / 604) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {monthlyStats.totalPages} of 604 pages completed ({Math.round((monthlyStats.totalPages / 604) * 100)}%)
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowProgressModal(false)}
                className="w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Set Daily Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Pages Goal</label>
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  min="1"
                  max="50"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Recommended: 1-5 pages per day for consistent progress
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <div className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>At this pace:</strong> You'll complete the Quran in approximately{' '}
                  <span className="font-bold">{Math.ceil(604 / dailyGoal)} days</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => updateDailyGoal(dailyGoal)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Goal
              </button>
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};