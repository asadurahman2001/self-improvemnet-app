import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  Heart, 
  Book, 
  Target, 
  Calendar, 
  Clock, 
  UserCheck, 
  Moon,
  TrendingUp,
  Flame,
  Sun
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    studyHoursToday: 0,
    prayersCompleted: 0,
    totalPrayers: 5,
    habitStreak: 0,
    nextExamDays: 0,
    quranReadToday: 0,
    quranDailyGoal: 2
  });
  const [todaysClasses, setTodaysClasses] = useState<Array<{subject: string, time: string, location: string, instructor: string}>>([]);

  // Get today's day for class routine
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isClassDay = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'].includes(today);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    try {
      // Load today's study hours
      const { data: studyData } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', user.id)
        .eq('date', today);

      const studyHoursToday = studyData?.reduce((sum, session) => sum + session.duration, 0) || 0;

      // Load today's prayers
      const { data: prayerData } = await supabase
        .from('prayer_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      const prayersCompleted = prayerData?.length || 0;

      // Load habit streaks
      const { data: habitData } = await supabase
        .from('habits')
        .select('streak')
        .eq('user_id', user.id)
        .eq('type', 'good');

      const habitStreak = habitData && habitData.length > 0 ? Math.max(...habitData.map(h => h.streak)) : 0;

      // Load next exam
      const { data: examData } = await supabase
        .from('exams')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1);

      let nextExamDays = 0;
      if (examData && examData.length > 0) {
        const examDate = new Date(examData[0].date);
        const todayDate = new Date();
        const diffTime = examDate.getTime() - todayDate.getTime();
        nextExamDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Load today's classes
      const { data: classData } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('day', todayDay)
        .order('time');

      // Load today's Quran reading
      const { data: quranData } = await supabase
        .from('quran_readings')
        .select('pages')
        .eq('user_id', user.id)
        .eq('date', today);

      const quranReadToday = quranData?.reduce((sum, reading) => sum + reading.pages, 0) || 0;

      setStats({
        studyHoursToday,
        prayersCompleted,
        totalPrayers: 5,
        habitStreak,
        nextExamDays,
        quranReadToday,
        quranDailyGoal: 2
      });

      setTodaysClasses(classData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Welcome back, {user?.user_metadata?.full_name || 'User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Let's make today productive and meaningful
          </p>
        </div>
        <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Study Hours Today</p>
              <p className="text-2xl font-bold">{stats.studyHoursToday}h</p>
            </div>
            <BookOpen className="w-8 h-8 text-emerald-200" />
          </div>
          <div className="mt-4">
            <div className="bg-emerald-400 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: `${Math.min((stats.studyHoursToday / 6) * 100, 100)}%` }}></div>
            </div>
            <p className="text-xs text-emerald-100 mt-1">{Math.round((stats.studyHoursToday / 6) * 100)}% of daily goal</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100">Prayers Completed</p>
              <p className="text-2xl font-bold">{stats.prayersCompleted}/{stats.totalPrayers}</p>
            </div>
            <Heart className="w-8 h-8 text-teal-200" />
          </div>
          <div className="mt-4">
            <div className="bg-teal-400 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: `${(stats.prayersCompleted / stats.totalPrayers) * 100}%` }}></div>
            </div>
            <p className="text-xs text-teal-100 mt-1">{stats.prayersCompleted === 5 ? 'All completed!' : 'Keep going!'}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">Habit Streak</p>
              <p className="text-2xl font-bold">{stats.habitStreak}</p>
            </div>
            <Flame className="w-8 h-8 text-amber-200" />
          </div>
          <div className="mt-4">
            <p className="text-xs text-amber-100">Days consistent</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100">Exam in</p>
              <p className="text-2xl font-bold">{stats.nextExamDays || 'None'}</p>
            </div>
            <Calendar className="w-8 h-8 text-rose-200" />
          </div>
          <div className="mt-4">
            <p className="text-xs text-rose-100">{stats.nextExamDays > 0 ? 'Days remaining' : 'No upcoming exams'}</p>
          </div>
        </div>
      </div>

      {/* Today's Class Routine */}
      {isClassDay && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Classes</h3>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{today}</span>
            </div>
          </div>
          <div className="space-y-3">
            {todaysClasses.length > 0 ? todaysClasses.map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">{cls.subject}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{cls.instructor} • {cls.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-white">{cls.time}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No classes scheduled for today</p>
                <p className="text-sm mt-1">Add your class schedule to see it here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Today's Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Study Session</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min((stats.studyHoursToday / 6) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round((stats.studyHoursToday / 6) * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Daily Prayers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${(stats.prayersCompleted / stats.totalPrayers) * 100}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round((stats.prayersCompleted / stats.totalPrayers) * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                    <Book className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Quran Reading</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${Math.min((stats.quranReadToday / stats.quranDailyGoal) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round((stats.quranReadToday / stats.quranDailyGoal) * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Sleep Goal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full w-0"></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('study')}
                className="w-full bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-3 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 hover:shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Study Session</span>
              </button>
              <button 
                onClick={() => setActiveTab('prayer')}
                className="w-full bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-400 py-3 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 hover:shadow-sm"
              >
                <Heart className="w-4 h-4" />
                <span>Log Prayer</span>
              </button>
              <button 
                onClick={() => setActiveTab('habits')}
                className="w-full bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 py-3 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 hover:shadow-sm"
              >
                <Target className="w-4 h-4" />
                <span>Update Habits</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('achievements')}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Getting Started</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Welcome to Life Tracker!</p>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('achievements')}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">First Steps</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Start tracking to unlock achievements</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};