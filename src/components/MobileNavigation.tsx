import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Heart, 
  Book, 
  Target, 
  Calendar, 
  Clock, 
  Moon, 
  Award, 
  User,
  Menu,
  X
} from 'lucide-react';

interface MobileNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'prayer', label: 'Prayer', icon: Heart },
  { id: 'quran', label: 'Quran', icon: Book },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'exam', label: 'Exams', icon: Calendar },
  { id: 'routine', label: 'Classes', icon: Clock },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'achievements', label: 'Awards', icon: Award },
  { id: 'profile', label: 'Profile', icon: User },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}) => {
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Life Tracker</h1>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-40 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 pt-20">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
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
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="grid grid-cols-5 gap-1 p-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};