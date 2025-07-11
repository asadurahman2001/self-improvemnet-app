import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  User, Settings, Calendar, Award, TrendingUp, BookOpen, Heart, Target, 
  Trash2, RotateCcw, AlertTriangle, Save, X, Moon, Clock, MapPin, 
  GraduationCap, Mail, Phone, Globe, Edit, CheckCircle, Download, Upload
} from 'lucide-react';

interface UserStats {
  totalStudyHours: number;
  totalPrayersCompleted: number;
  totalQuranPages: number;
  streakDays: number;
  achievementsUnlocked: number;
  attendanceRate: number;
  totalSleepHours: number;
  averageSleepQuality: number;
  totalHabitsCompleted: number;
  totalExams: number;
  memberSince: string;
  lastActive: string;
}

interface RecentActivity {
  id: string;
  type: 'study' | 'prayer' | 'quran' | 'habit' | 'attendance' | 'sleep' | 'achievement';
  description: string;
  time: string;
  value?: string;
}

export const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    totalStudyHours: 0,
    totalPrayersCompleted: 0,
    totalQuranPages: 0,
    streakDays: 0,
    achievementsUnlocked: 0,
    attendanceRate: 0,
    totalSleepHours: 0,
    averageSleepQuality: 0,
    totalHabitsCompleted: 0,
    totalExams: 0,
    memberSince: '',
    lastActive: ''
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    joinDate: '2024-01-01',
    university: '',
    major: '',
    year: '1st',
    location: '',
    timezone: 'UTC+2',
    dailyStudyGoal: 6,
    sleepGoal: 8,
    weeklyQuranGoal: 14,
    phone: '',
    website: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserStats();
      loadRecentActivities();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfileData({
        name: data.full_name || '',
        email: data.email || '',
        joinDate: data.created_at?.split('T')[0] || '2024-01-01',
        university: data.university || '',
        major: data.major || '',
        year: data.year || 'Senior',
        location: data.location || '',
        timezone: data.timezone || 'UTC+2',
        dailyStudyGoal: data.daily_study_goal || 6,
        sleepGoal: data.sleep_goal || 8,
        weeklyQuranGoal: data.weekly_quran_goal || 14,
        phone: data.phone || '',
        website: data.website || '',
        bio: data.bio || ''
      });
    }
  };

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

      // Load exams
      const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id);

      // Calculate statistics
      const totalStudyHours = studySessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
      const totalPrayersCompleted = prayerRecords?.length || 0;
      const totalQuranPages = quranSessions?.reduce((sum, session) => sum + (session.pages_read || 0), 0) || 0;
      const totalSleepHours = sleepRecords?.reduce((sum, record) => sum + (record.duration || 0), 0) || 0;
      const averageSleepQuality = sleepRecords?.length > 0 
        ? sleepRecords.reduce((sum, record) => sum + (record.quality || 0), 0) / sleepRecords.length 
        : 0;
      const totalHabitsCompleted = habitRecords?.length || 0;
      const totalExams = exams?.length || 0;

      // Calculate attendance rate
      const presentRecords = attendanceRecords?.filter(record => record.status === 'present').length || 0;
      const totalAttendance = attendanceRecords?.length || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentRecords / totalAttendance) * 100) : 0;

      // Calculate streak (simplified - could be enhanced)
      const streakDays = Math.min(30, Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)));

      // Calculate achievements (simplified - should integrate with achievements component)
      const achievementsUnlocked = Math.min(8, Math.floor(totalStudyHours / 10) + Math.floor(totalPrayersCompleted / 10));

      setUserStats({
        totalStudyHours: Math.round(totalStudyHours * 10) / 10,
        totalPrayersCompleted,
        totalQuranPages,
        streakDays,
        achievementsUnlocked,
        attendanceRate,
        totalSleepHours: Math.round(totalSleepHours * 10) / 10,
        averageSleepQuality: Math.round(averageSleepQuality * 10) / 10,
        totalHabitsCompleted,
        totalExams,
        memberSince: profileData.joinDate,
        lastActive: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    if (!user) return;

    try {
      const activities: RecentActivity[] = [];

      // Get recent study sessions
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      studySessions?.forEach(session => {
        activities.push({
          id: session.id,
          type: 'study',
          description: `Studied ${session.subject} for ${session.duration}h`,
          time: new Date(session.created_at).toLocaleDateString(),
          value: `${session.duration}h`
        });
      });

      // Get recent prayer records
      const { data: prayerRecords } = await supabase
        .from('prayer_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      prayerRecords?.forEach(prayer => {
        activities.push({
          id: prayer.id,
          type: 'prayer',
          description: `Completed ${prayer.prayer_name}`,
          time: new Date(prayer.created_at).toLocaleDateString(),
          value: prayer.prayer_name
        });
      });

      // Get recent Quran sessions
      const { data: quranSessions } = await supabase
        .from('quran_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      quranSessions?.forEach(session => {
        activities.push({
          id: session.id,
          type: 'quran',
          description: `Read ${session.pages_read} pages of Quran`,
          time: new Date(session.created_at).toLocaleDateString(),
          value: `${session.pages_read} pages`
        });
      });

      // Sort by time and take the most recent 10
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.name,
          email: profileData.email,
          university: profileData.university,
          major: profileData.major,
          year: profileData.year,
          location: profileData.location,
          timezone: profileData.timezone,
          daily_study_goal: profileData.dailyStudyGoal,
          sleep_goal: profileData.sleepGoal,
          weekly_quran_goal: profileData.weeklyQuranGoal,
          phone: profileData.phone,
          website: profileData.website,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        setShowEditModal(false);
        await loadProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!user || confirmText !== 'RESET') return;
    
    setLoading(true);
    try {
      // Reset all user data but keep profile
      await Promise.all([
        supabase.from('study_sessions').delete().eq('user_id', user.id),
        supabase.from('prayer_records').delete().eq('user_id', user.id),
        supabase.from('quran_sessions').delete().eq('user_id', user.id),
        supabase.from('habit_records').delete().eq('user_id', user.id),
        supabase.from('class_schedules').delete().eq('user_id', user.id),
        supabase.from('attendance_records').delete().eq('user_id', user.id),
        supabase.from('sleep_records').delete().eq('user_id', user.id),
        supabase.from('exams').delete().eq('user_id', user.id),
      ]);
      
      setShowResetModal(false);
      setConfirmText('');
      await loadUserStats();
      await loadRecentActivities();
      alert('All data has been reset successfully!');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Error resetting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== 'DELETE FOREVER') return;
    
    setLoading(true);
    try {
      // Delete all user data first
      await Promise.all([
        supabase.from('study_sessions').delete().eq('user_id', user.id),
        supabase.from('prayer_records').delete().eq('user_id', user.id),
        supabase.from('quran_sessions').delete().eq('user_id', user.id),
        supabase.from('habit_records').delete().eq('user_id', user.id),
        supabase.from('class_schedules').delete().eq('user_id', user.id),
        supabase.from('attendance_records').delete().eq('user_id', user.id),
        supabase.from('sleep_records').delete().eq('user_id', user.id),
        supabase.from('exams').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('user_id', user.id),
      ]);
      
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;

    try {
      const data = {
        profile: profileData,
        stats: userStats,
        activities: recentActivities,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'study':
        return <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'prayer':
        return <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'quran':
        return <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'habit':
        return <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'attendance':
        return <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Profile</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportUserData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button 
            onClick={() => setShowEditModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-inner">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profileData.name}</h2>
            <p className="text-blue-100">{profileData.email}</p>
            <p className="text-blue-100">{profileData.major} • {profileData.year}</p>
            <p className="text-blue-100">{profileData.university}</p>
            {profileData.bio && (
              <p className="text-blue-100 mt-2 italic">"{profileData.bio}"</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Member since</div>
            <div className="font-medium">{new Date(profileData.joinDate).toLocaleDateString()}</div>
            <div className="text-sm text-blue-100 mt-2">Last active</div>
            <div className="font-medium">{userStats.lastActive}</div>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Study Progress</h3>
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total hours</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.totalStudyHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Daily goal</span>
              <span className="font-medium text-gray-800 dark:text-white">{profileData.dailyStudyGoal}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Current streak</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.streakDays} days</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Spiritual Progress</h3>
            <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Prayers completed</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.totalPrayersCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Quran pages read</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.totalQuranPages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Weekly Quran goal</span>
              <span className="font-medium text-gray-800 dark:text-white">{profileData.weeklyQuranGoal} pages</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Health & Habits</h3>
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Sleep hours</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.totalSleepHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Sleep quality</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.averageSleepQuality}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Habits completed</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.totalHabitsCompleted}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Achievements</h3>
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Unlocked</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.achievementsUnlocked}/8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Attendance rate</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.attendanceRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total exams</span>
              <span className="font-medium text-gray-800 dark:text-white">{userStats.totalExams}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <div className="font-medium text-gray-800 dark:text-white">Reset All Data</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Clear all tracking data but keep your account</div>
              </div>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Reset Data
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="font-medium text-gray-800 dark:text-white">Delete Account</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Permanently delete your account and all data</div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{activity.description}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</div>
                </div>
              </div>
              {activity.value && (
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {activity.value}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No recent activity</p>
              <p className="text-sm mt-1">Start using the app to see your activity here</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Profile</h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University</label>
                <input
                  type="text"
                  value={profileData.university}
                  onChange={(e) => setProfileData({...profileData, university: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Major</label>
                <input
                  type="text"
                  value={profileData.major}
                  onChange={(e) => setProfileData({...profileData, major: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                <select
                  value={profileData.year}
                  onChange={(e) => setProfileData({...profileData, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Study Goal (hours)</label>
                <input
                  type="number"
                  value={profileData.dailyStudyGoal}
                  onChange={(e) => setProfileData({...profileData, dailyStudyGoal: Number(e.target.value)})}
                  min="1"
                  max="24"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sleep Goal (hours)</label>
                <input
                  type="number"
                  value={profileData.sleepGoal}
                  onChange={(e) => setProfileData({...profileData, sleepGoal: Number(e.target.value)})}
                  min="6"
                  max="12"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weekly Quran Goal (pages)</label>
                <input
                  type="number"
                  value={profileData.weeklyQuranGoal}
                  onChange={(e) => setProfileData({...profileData, weeklyQuranGoal: Number(e.target.value)})}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={saveProfile}
                disabled={saving || !profileData.name || !profileData.email}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Reset All Data</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete all your tracking data including study sessions, prayers, habits, and more. Your account will remain active.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type "RESET" to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Type RESET"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmText('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={confirmText !== 'RESET' || loading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Delete Account</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type "DELETE FOREVER" to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Type DELETE FOREVER"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE FOREVER' || loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};