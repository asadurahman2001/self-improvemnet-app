import React, { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineStorage } from '../hooks/useOfflineStorage';
import { supabase } from '../lib/supabase';
import { BookOpen, Play, Pause, Plus, Clock, TrendingUp, X } from 'lucide-react';

export const StudyTracker: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, saveOfflineData, getOfflineData, addToPendingSync } = useOfflineStorage();
  const [isStudying, setIsStudying] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('');
  const [dailyGoal, setDailyGoal] = useState(6);
  const [todayStudied, setTodayStudied] = useState(0);
  const [subjects, setSubjects] = useState<Array<{name: string, hours: number, color: string}>>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{day: string, hours: number}>>([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadStudyData();
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isStudying) {
      timer = setInterval(() => {
        setCurrentSession(prev => prev + 1);
      }, 1000); // Update every second
      setSessionTimer(timer);
    } else {
      if (sessionTimer) {
        clearInterval(sessionTimer);
        setSessionTimer(null);
      }
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isStudying]);

  const loadStudyData = async () => {
    if (!user) return;

    // Load today's study hours
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData } = await supabase
      .from('study_sessions')
      .select('duration')
      .eq('user_id', user.id)
      .eq('date', today);

    if (todayData) {
      const totalToday = todayData.reduce((sum, session) => sum + session.duration, 0);
      setTodayStudied(Math.round(totalToday * 10) / 10);
    }

    // Load weekly data
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: weeklyData } = await supabase
      .from('study_sessions')
      .select('date, duration')
      .eq('user_id', user.id)
      .gte('date', weekStart.toISOString().split('T')[0]);

    if (weeklyData) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyStats = days.map(day => ({
        day,
        hours: Math.round(weeklyData
          .filter(session => new Date(session.date).getDay() === days.indexOf(day))
          .reduce((sum, session) => sum + session.duration, 0) * 10) / 10
      }));
      setWeeklyData(weeklyStats);
    }

    // Load subject breakdown
    const { data: subjectData } = await supabase
      .from('study_sessions')
      .select('subject, duration')
      .eq('user_id', user.id)
      .gte('date', weekStart.toISOString().split('T')[0]);

    if (subjectData) {
      const subjectMap = new Map();
      subjectData.forEach(session => {
        const current = subjectMap.get(session.subject) || 0;
        subjectMap.set(session.subject, current + session.duration);
      });

      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
      const subjectArray = Array.from(subjectMap.entries()).map(([name, hours], index) => ({
        name,
        hours: Math.round(Number(hours) * 10) / 10,
        color: colors[index % colors.length]
      }));
      setSubjects(subjectArray);
    }
  };

  const startStudySession = () => {
    if (!currentSubject.trim()) {
      alert('Please select or enter a subject first');
      return;
    }
    setIsStudying(true);
    setSessionStartTime(Date.now());
  };

  const pauseStudySession = () => {
    setIsStudying(false);
    setSessionStartTime(null);
  };

  const endStudySession = async () => {
    if (!user) return;

    if (currentSession === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const durationHours = currentSession / 3600; // Convert seconds to hours

    const sessionData = {
      user_id: user.id,
      subject: currentSubject,
      duration: durationHours,
      date: today,
      notes: `${Math.floor(currentSession / 3600)}h ${Math.floor((currentSession % 3600) / 60)}m session`
    };

    if (isOnline) {
      const { error } = await supabase
        .from('study_sessions')
        .insert(sessionData);
      
      if (!error) {
        setCurrentSession(0);
        setIsStudying(false);
        setCurrentSubject('');
        setSessionStartTime(null);
        loadStudyData(); // Refresh data
      }
    } else {
      // Save offline and add to pending sync
      addToPendingSync({
        table: 'study_sessions',
        operation: 'insert',
        data: sessionData
      });
      
      // Update local state
      setCurrentSession(0);
      setIsStudying(false);
      setCurrentSubject('');
      setSessionStartTime(null);
      
      // Update offline data
      const offlineStudySessions = getOfflineData('study_sessions') || [];
      offlineStudySessions.push({ ...sessionData, id: Date.now().toString() });
      saveOfflineData('study_sessions', offlineStudySessions);
      
      loadStudyData(); // Refresh data
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.find(s => s.name === newSubject)) {
      setSubjects(prev => [...prev, {
        name: newSubject,
        hours: 0,
        color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'][prev.length % 5]
      }]);
      setNewSubject('');
      setShowAddSubject(false);
    }
  };

  // Get the current elapsed time
  const getElapsedTime = () => {
    return currentSession;
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Study Tracker</h1>
        <button 
          onClick={() => setShowAddSubject(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Current Session */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Current Session</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{isStudying ? 'Active' : 'Paused'}</span>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject
          </label>
          <select
            value={currentSubject}
            onChange={(e) => setCurrentSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            disabled={isStudying}
          >
            <option value="">Select a subject</option>
            {subjects.map(subject => (
              <option key={subject.name} value={subject.name}>{subject.name}</option>
            ))}
          </select>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-gray-800 dark:text-white mb-2">
            {Math.floor(getElapsedTime() / 3600)}:{(Math.floor((getElapsedTime() % 3600) / 60)).toString().padStart(2, '0')}:{(getElapsedTime() % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {currentSubject || 'Select a subject to start'}
          </p>
          {isStudying && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              Session in progress...
            </p>
          )}
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          {!isStudying ? (
            <button
              onClick={startStudySession}
              disabled={!currentSubject}
              className="px-8 py-3 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Start</span>
            </button>
          ) : (
            <>
              <button
                onClick={pauseStudySession}
                className="px-8 py-3 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium flex items-center space-x-2 transition-colors"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
              <button
                onClick={endStudySession}
                className="px-8 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors"
              >
                End Session
              </button>
            </>
          )}
          <button 
            onClick={() => {
              setCurrentSession(0);
              setIsStudying(false);
              setSessionStartTime(null);
            }}
            className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayStudied.toFixed(1)}h</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Total</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dailyGoal}h</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Daily Goal</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round((todayStudied / dailyGoal) * 100)}%</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
          </div>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Daily Progress</h3>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Progress towards daily goal</span>
            <span>{todayStudied.toFixed(1)}/{dailyGoal.toFixed(1)} hours</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((todayStudied / dailyGoal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Subject Breakdown</h3>
        <div className="space-y-4">
          {subjects.length > 0 ? subjects.map((subject) => (
            <div key={subject.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${subject.color}`}></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{subject.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800 dark:text-white">{subject.hours.toFixed(1)}h</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">this week</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No subjects added yet</p>
              <p className="text-sm mt-1">Add subjects to track your study progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Weekly Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>{weeklyData.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}h total</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map((day) => (
            <div key={day.day} className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day.day}</div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-800 dark:text-white">{day.hours.toFixed(1)}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Subject</h3>
              <button
                onClick={() => setShowAddSubject(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Mathematics, Physics, etc."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddSubject(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSubject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};