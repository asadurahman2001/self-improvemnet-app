import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Award, Trophy, Star, Medal, Crown, Target, Flame, TrendingUp, 
  BookOpen, Heart, Book, Clock, UserCheck, Moon, Zap, Calendar,
  CheckCircle, Lock, Sparkles, Gift, Crown as CrownIcon
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'study' | 'prayer' | 'quran' | 'habits' | 'attendance' | 'sleep' | 'general';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  secret?: boolean;
}

export const Achievements: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSecret, setShowSecret] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'prayer', label: 'Prayer', icon: Heart },
    { id: 'quran', label: 'Quran', icon: Book },
    { id: 'habits', label: 'Habits', icon: Target },
    { id: 'attendance', label: 'Classes', icon: UserCheck },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'general', label: 'General', icon: Award }
  ];

  useEffect(() => {
    if (user) {
      loadUserStats();
      initializeAchievements();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Load study sessions
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id);

      // Load prayer records
      const { data: prayerRecords } = await supabase
        .from('prayer_records')
        .select('*')
        .eq('user_id', user.id);

      // Load Quran sessions
      const { data: quranSessions } = await supabase
        .from('quran_sessions')
        .select('*')
        .eq('user_id', user.id);

      // Load attendance records
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', user.id);

      // Load sleep records
      const { data: sleepRecords } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('user_id', user.id);

      // Load habit records
      const { data: habitRecords } = await supabase
        .from('habit_records')
        .select('*')
        .eq('user_id', user.id);

      setUserStats({
        studySessions: studySessions || [],
        prayerRecords: prayerRecords || [],
        quranSessions: quranSessions || [],
        attendanceRecords: attendanceRecords || [],
        sleepRecords: sleepRecords || [],
        habitRecords: habitRecords || []
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAchievements = () => {
    const baseAchievements: Achievement[] = [
      // Study Achievements
      {
        id: 'study_1',
        title: 'First Steps',
        description: 'Complete your first study session',
        icon: BookOpen,
        category: 'study',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'common',
        points: 10
      },
      {
        id: 'study_2',
        title: 'Study Enthusiast',
        description: 'Study for 10 hours total',
        icon: BookOpen,
        category: 'study',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        rarity: 'common',
        points: 25
      },
      {
        id: 'study_3',
        title: 'Study Marathon',
        description: 'Study for 50 hours total',
        icon: Trophy,
        category: 'study',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        rarity: 'epic',
        points: 100
      },
      {
        id: 'study_4',
        title: 'Focus Master',
        description: 'Complete 5 study sessions of 2+ hours each',
        icon: Target,
        category: 'study',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        rarity: 'rare',
        points: 75
      },
      {
        id: 'study_5',
        title: 'Study Legend',
        description: 'Study for 100 hours total',
        icon: Crown,
        category: 'study',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
        rarity: 'legendary',
        points: 250
      },

      // Prayer Achievements
      {
        id: 'prayer_1',
        title: 'Prayer Beginner',
        description: 'Log your first prayer',
        icon: Heart,
        category: 'prayer',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'common',
        points: 10
      },
      {
        id: 'prayer_2',
        title: 'Prayer Warrior',
        description: 'Complete all 5 daily prayers for 7 consecutive days',
        icon: Medal,
        category: 'prayer',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
        rarity: 'rare',
        points: 75
      },
      {
        id: 'prayer_3',
        title: 'Prayer Master',
        description: 'Complete all 5 daily prayers for 30 consecutive days',
        icon: Crown,
        category: 'prayer',
        unlocked: false,
        progress: 0,
        maxProgress: 30,
        rarity: 'legendary',
        points: 300
      },

      // Quran Achievements
      {
        id: 'quran_1',
        title: 'Quran Reader',
        description: 'Complete your first Quran reading session',
        icon: Book,
        category: 'quran',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'common',
        points: 10
      },
      {
        id: 'quran_2',
        title: 'Quran Scholar',
        description: 'Read Quran for 7 consecutive days',
        icon: Star,
        category: 'quran',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
        rarity: 'rare',
        points: 50
      },
      {
        id: 'quran_3',
        title: 'Quran Master',
        description: 'Read Quran for 21 consecutive days',
        icon: Crown,
        category: 'quran',
        unlocked: false,
        progress: 0,
        maxProgress: 21,
        rarity: 'epic',
        points: 150
      },

      // Attendance Achievements
      {
        id: 'attendance_1',
        title: 'Class Attender',
        description: 'Mark your first attendance',
        icon: UserCheck,
        category: 'attendance',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'common',
        points: 10
      },
      {
        id: 'attendance_2',
        title: 'Perfect Week',
        description: 'Attend all classes for a week',
        icon: Calendar,
        category: 'attendance',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        rarity: 'rare',
        points: 50
      },
      {
        id: 'attendance_3',
        title: 'Perfect Attendance',
        description: 'Attend all classes for a month',
        icon: Crown,
        category: 'attendance',
        unlocked: false,
        progress: 0,
        maxProgress: 20,
        rarity: 'legendary',
        points: 200
      },

      // Sleep Achievements
      {
        id: 'sleep_1',
        title: 'Sleep Tracker',
        description: 'Log your first sleep record',
        icon: Moon,
        category: 'sleep',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'common',
        points: 10
      },
      {
        id: 'sleep_2',
        title: 'Sleep Champion',
        description: 'Meet sleep goal for 7 consecutive days',
        icon: Award,
        category: 'sleep',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
        rarity: 'rare',
        points: 75
      },
      {
        id: 'sleep_3',
        title: 'Early Bird',
        description: 'Wake up before 6 AM for 10 days',
        icon: TrendingUp,
        category: 'sleep',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        rarity: 'epic',
        points: 100
      },

      // General achievements
      {
        id: 'general_1',
        title: 'App Explorer',
        description: 'Use all 6 main features of the app',
        icon: Zap,
        category: 'general',
        unlocked: false,
        progress: 0,
        maxProgress: 6,
        rarity: 'common',
        points: 25
      },
      {
        id: 'general_2',
        title: 'Consistency King',
        description: 'Use the app for 30 consecutive days',
        icon: CrownIcon,
        category: 'general',
        unlocked: false,
        progress: 0,
        maxProgress: 30,
        rarity: 'legendary',
        points: 500
      },
      {
        id: 'general_3',
        title: 'Secret Discoverer',
        description: 'Find this hidden achievement',
        icon: Sparkles,
        category: 'general',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'epic',
        points: 100,
        secret: true
      }
    ];

    setAchievements(baseAchievements);
  };

  const calculateProgress = () => {
    if (!userStats || Object.keys(userStats).length === 0) return;

    const updatedAchievements = achievements.map(achievement => {
      let progress = 0;
      let unlocked = false;

      switch (achievement.id) {
        // Study achievements
        case 'study_1':
          progress = userStats.studySessions.length > 0 ? 1 : 0;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'study_2':
          progress = Math.floor(userStats.studySessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0));
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'study_3':
          progress = Math.floor(userStats.studySessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0));
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'study_4':
          progress = userStats.studySessions.filter((session: any) => (session.duration || 0) >= 2).length;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'study_5':
          progress = Math.floor(userStats.studySessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0));
          unlocked = progress >= achievement.maxProgress;
          break;

        // Prayer achievements
        case 'prayer_1':
          progress = userStats.prayerRecords.length > 0 ? 1 : 0;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'prayer_2':
          progress = calculateConsecutiveDays(userStats.prayerRecords, 5);
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'prayer_3':
          progress = calculateConsecutiveDays(userStats.prayerRecords, 5);
          unlocked = progress >= achievement.maxProgress;
          break;

        // Quran achievements
        case 'quran_1':
          progress = userStats.quranSessions.length > 0 ? 1 : 0;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'quran_2':
          progress = calculateConsecutiveDays(userStats.quranSessions, 1);
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'quran_3':
          progress = calculateConsecutiveDays(userStats.quranSessions, 1);
          unlocked = progress >= achievement.maxProgress;
          break;

        // Attendance achievements
        case 'attendance_1':
          progress = userStats.attendanceRecords.length > 0 ? 1 : 0;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'attendance_2':
          progress = calculateConsecutiveDays(userStats.attendanceRecords, 1);
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'attendance_3':
          progress = calculateConsecutiveDays(userStats.attendanceRecords, 1);
          unlocked = progress >= achievement.maxProgress;
          break;

        // Sleep achievements
        case 'sleep_1':
          progress = userStats.sleepRecords.length > 0 ? 1 : 0;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'sleep_2':
          progress = calculateConsecutiveDays(userStats.sleepRecords, 1);
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'sleep_3':
          progress = userStats.sleepRecords.filter((record: any) => {
            const wakeTime = new Date(`2000-01-01T${record.wake_time}`);
            return wakeTime.getHours() < 6;
          }).length;
          unlocked = progress >= achievement.maxProgress;
          break;

        // General achievements
        case 'general_1':
          const featuresUsed = [
            userStats.studySessions.length > 0,
            userStats.prayerRecords.length > 0,
            userStats.quranSessions.length > 0,
            userStats.habitRecords.length > 0,
            userStats.attendanceRecords.length > 0,
            userStats.sleepRecords.length > 0
          ].filter(Boolean).length;
          progress = featuresUsed;
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'general_2':
          progress = calculateAppUsageDays();
          unlocked = progress >= achievement.maxProgress;
          break;
        case 'general_3':
          progress = showSecret ? 1 : 0;
          unlocked = progress >= achievement.maxProgress;
          break;
      }

      return {
        ...achievement,
        progress: Math.min(progress, achievement.maxProgress),
        unlocked,
        unlockedDate: unlocked && !achievement.unlockedDate ? new Date().toISOString().split('T')[0] : achievement.unlockedDate
      };
    });

    setAchievements(updatedAchievements);
  };

  const calculateConsecutiveDays = (records: any[], minCount: number) => {
    if (records.length === 0) return 0;

    const dates = [...new Set(records.map((r: any) => r.date))].sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: string | null = null;

    for (const date of dates) {
      const recordCount = records.filter((r: any) => r.date === date).length;
      if (recordCount >= minCount) {
        if (!lastDate || isConsecutiveDay(lastDate, date)) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastDate = date;
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  };

  const isConsecutiveDay = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  const calculateAppUsageDays = () => {
    // This would need to be implemented based on actual app usage tracking
    // For now, we'll use a simple calculation based on when the user first used the app
    return Math.min(30, Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    calculateProgress();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700';
      case 'rare':
        return 'from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700';
      case 'epic':
        return 'from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700';
      case 'legendary':
        return 'from-yellow-400 to-orange-600 dark:from-yellow-500 dark:to-orange-700';
      default:
        return 'from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'prayer':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'quran':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'habits':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'attendance':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'sleep':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'general':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements.filter(a => !a.secret || showSecret)
    : achievements.filter(a => a.category === selectedCategory && (!a.secret || showSecret));

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalAchievements = achievements.filter(a => !a.secret || showSecret).length;
  const completionRate = Math.round((unlockedAchievements.length / totalAchievements) * 100);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Achievements</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading achievements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Achievements</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {unlockedAchievements.length} / {totalAchievements} unlocked
          </div>
          <button
            onClick={() => setShowSecret(!showSecret)}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showSecret ? 'Hide' : 'Show'} Secret
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Achievement Progress</h2>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span className="font-medium">{completionRate}%</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-yellow-100 text-sm mb-2">
            <span>Overall completion</span>
            <span>{unlockedAchievements.length}/{totalAchievements}</span>
          </div>
          <div className="w-full bg-yellow-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{achievements.filter(a => a.unlocked && a.rarity === 'legendary').length}</div>
            <div className="text-yellow-100 text-sm">Legendary</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{achievements.filter(a => a.unlocked && a.rarity === 'epic').length}</div>
            <div className="text-yellow-100 text-sm">Epic</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{achievements.filter(a => a.unlocked && a.rarity === 'rare').length}</div>
            <div className="text-yellow-100 text-sm">Rare</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{achievements.filter(a => a.unlocked && a.rarity === 'common').length}</div>
            <div className="text-yellow-100 text-sm">Common</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-2xl font-bold">{totalPoints}</div>
          <div className="text-yellow-100 text-sm">Total Points</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  selectedCategory === category.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recently Unlocked</h3>
          <div className="space-y-3">
            {unlockedAchievements
              .filter(a => a.unlockedDate)
              .sort((a, b) => new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime())
              .slice(0, 3)
              .map(achievement => {
                const Icon = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">{achievement.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{achievement.points} points</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Unlocked</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{achievement.unlockedDate}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* All Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">All Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => {
            const Icon = achievement.icon;
            const progressPercentage = achievement.maxProgress ? (achievement.progress / achievement.maxProgress) * 100 : 0;
            
            return (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700' 
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                } ${achievement.secret && !showSecret ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center ${
                    !achievement.unlocked ? 'opacity-50' : ''
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {achievement.secret && (
                      <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className={`font-medium ${achievement.unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-sm ${achievement.unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {achievement.description}
                  </p>
                </div>

                {!achievement.unlocked && achievement.maxProgress && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{achievement.points} pts</span>
                    {achievement.unlocked && (
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Unlocked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};