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

  // ... [rest of the code remains exactly the same until the last closing brace]

  return (
    <div className="space-y-6">
      {/* ... [rest of the JSX remains exactly the same] */}
    </div>
  );
};