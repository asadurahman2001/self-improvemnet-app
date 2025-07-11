import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useDataPreloader } from './hooks/useDataPreloader';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MobileNavigation } from './components/MobileNavigation';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { StudyTracker } from './components/StudyTracker';
import { PrayerTracker } from './components/PrayerTracker';
import { QuranTracker } from './components/QuranTracker';
import { HabitTracker } from './components/HabitTracker';
import { ExamCountdown } from './components/ExamCountdown';
import { AttendanceRoutine } from './components/AttendanceRoutine';
import { SleepTracker } from './components/SleepTracker';
import { Achievements } from './components/Achievements';
import { Profile } from './components/Profile';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { preloadedData, refreshData } = useDataPreloader();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} preloadedData={preloadedData} />;
      case 'study':
        return <StudyTracker preloadedData={preloadedData} refreshData={refreshData} />;
      case 'prayer':
        return <PrayerTracker preloadedData={preloadedData} refreshData={refreshData} />;
      case 'quran':
        return <QuranTracker preloadedData={preloadedData} refreshData={refreshData} />;
      case 'habits':
        return <HabitTracker preloadedData={preloadedData} refreshData={refreshData} />;
      case 'exam':
        return <ExamCountdown preloadedData={preloadedData} refreshData={refreshData} />;
      case 'routine':
      case 'attendance':
        return <AttendanceRoutine preloadedData={preloadedData} refreshData={refreshData} />;
      case 'sleep':
        return <SleepTracker preloadedData={preloadedData} refreshData={refreshData} />;
      case 'achievements':
        return <Achievements preloadedData={preloadedData} />;
      case 'profile':
        return <Profile preloadedData={preloadedData} refreshData={refreshData} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} preloadedData={preloadedData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-900 dark:to-emerald-900 relative">
      <OfflineIndicator />
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-6 pt-20 lg:pt-6 pb-20 lg:pb-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;