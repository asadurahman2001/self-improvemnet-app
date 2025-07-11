import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Heart, 
  Book, 
  Target, 
  Calendar, 
  Clock, 
  UserCheck, 
  Moon, 
  Award, 
  User,
  LogOut,
  Sun,
  Landmark
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'study', label: 'Study Tracker', icon: BookOpen },
  { id: 'prayer', label: 'Prayer Tracker', icon: Heart },
  { id: 'quran', label: 'Quran Tracker', icon: Book },
  { id: 'habits', label: 'Habit Tracker', icon: Target },
  { id: 'exam', label: 'Exam Countdown', icon: Calendar },
  { id: 'routine', label: 'Classes', icon: Clock },
  { id: 'sleep', label: 'Sleep Tracker', icon: Moon },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { signOut, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-10 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex-1 flex flex-col p-6 min-h-0">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Life Tracker</h1>
        </div>
        
        <nav className={`space-y-2 overflow-y-auto flex-1 min-h-0 sidebar-scrollbar${isDark ? ' dark' : ''}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-r-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
        {/* User Info & Actions */}
      <div className="px-6 pb-6 space-y-4">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};