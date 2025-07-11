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

interface AchievementsProps {
  preloadedData: any;
}

export const Achievements: React.FC<AchievementsProps> = ({ preloadedData }) => {
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

  const calculateUserStats = () => {
    if (!preloadedData) return;

    const {
      studySessions = [],
      prayerRecords = [],
      quranSessions = [],
      habitRecords = [],
      attendanceRecords = [],
      sleepRecords = []
    } = preloadedData;

    // Calculate statistics from preloaded data
    const totalStudyHours = studySessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
    const totalPrayersCompleted = prayerRecords.length;
    const totalQuranPages = quranSessions.reduce((sum: number, session: any) => sum + (session.pages_read || 0), 0);
    const totalHabitsCompleted = habitRecords.length;
    const totalSleepHours = sleepRecords.reduce((sum: number, record: any) => sum + (record.duration || 0), 0);
    
    // Calculate attendance rate
    const presentRecords = attendanceRecords.filter((record: any) => record.status === 'present').length;
    const totalAttendance = attendanceRecords.filter((record: any) => record.status !== 'cancelled').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentRecords / totalAttendance) * 100) : 0;

    // Calculate streak (simplified)
    const streakDays = Math.min(30, Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)));

    setUserStats({
      totalStudyHours,
      totalPrayersCompleted,
      totalQuranPages,
      totalHabitsCompleted,
      totalSleepHours,
      attendanceRate,
      streakDays
    });
  };

  // ... [rest of the code remains exactly the same until the last closing brace]

  return (
    <div className="space-y-6">
      {/* ... [rest of the JSX remains exactly the same] */}
    </div>
  );
};