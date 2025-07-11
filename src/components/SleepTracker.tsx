import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Moon, Sun, Clock, TrendingUp, Plus, Sunrise, Sunset, X, Star, Calendar, Target } from 'lucide-react';

interface SleepRecord {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes?: string;
}

export const SleepTracker: React.FC = () => {
  const { user } = useAuth();
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [showLogModal, setShowLogModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for logging sleep
  const [sleepForm, setSleepForm] = useState({
    date: '',
    bedtime: '',
    wakeTime: '',
    quality: 3,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadSleepData();
    }
  }, [user]);

  const loadSleepData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (data) {
      setSleepRecords(data);
    }
  };

  const logSleep = async () => {
    if (!user || !sleepForm.date || !sleepForm.bedtime || !sleepForm.wakeTime) return;

    setLoading(true);

    // Calculate duration
    const bedtime = new Date(`2000-01-01T${sleepForm.bedtime}`);
    const wakeTime = new Date(`2000-01-01T${sleepForm.wakeTime}`);
    let duration = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60);
    
    // Handle overnight sleep
    if (duration < 0) {
      duration += 24;
    }

    const { error } = await supabase
      .from('sleep_records')
      .insert({
        user_id: user.id,
        date: sleepForm.date,
        bedtime: sleepForm.bedtime,
        wake_time: sleepForm.wakeTime,
        duration: Math.round(duration * 10) / 10,
        quality: sleepForm.quality,
        notes: sleepForm.notes || null
      });

    if (!error) {
      setShowLogModal(false);
      setSleepForm({
        date: '',
        bedtime: '',
        wakeTime: '',
        quality: 3,
        notes: ''
      });
      await loadSleepData();
    }

    setLoading(false);
  };

  const getAverageStats = () => {
    if (sleepRecords.length === 0) {
      return {
        avgDuration: 0,
        avgQuality: 0,
        goalAchieved: 0,
        totalNights: 0,
        bestNight: null,
        worstNight: null
      };
    }

    const totalDuration = sleepRecords.reduce((sum, record) => sum + record.duration, 0);
    const avgDuration = totalDuration / sleepRecords.length;
    const avgQuality = sleepRecords.reduce((sum, record) => sum + record.quality, 0) / sleepRecords.length;
    const goalAchieved = sleepRecords.filter(r => r.duration >= sleepGoal).length;
    
    const bestNight = sleepRecords.reduce((best, current) => 
      current.quality > best.quality ? current : best
    );
    
    const worstNight = sleepRecords.reduce((worst, current) => 
      current.quality < worst.quality ? current : worst
    );
    
    return {
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      goalAchieved,
      totalNights: sleepRecords.length,
      bestNight,
      worstNight
    };
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 4) return 'text-green-600 dark:text-green-400';
    if (quality >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQualityBg = (quality: number) => {
    if (quality >= 4) return 'bg-green-100 dark:bg-green-900/20';
    if (quality >= 3) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getSleepStatus = () => {
    const latestRecord = sleepRecords[0];
    if (!latestRecord) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 22 || currentHour <= 6) {
      return { status: 'sleep', message: 'Sleep time' };
    } else {
      return { status: 'awake', message: 'Awake time' };
    }
  };

  const getSleepTrend = () => {
    if (sleepRecords.length < 2) return 'stable';
    
    const recent = sleepRecords.slice(0, 7);
    const older = sleepRecords.slice(7, 14);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.duration, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  const stats = getAverageStats();
  const sleepStatus = getSleepStatus();
  const sleepTrend = getSleepTrend();

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSleepForm(prev => ({ ...prev, date: today }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sleep Tracker</h1>
        <button 
          onClick={() => setShowLogModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Sleep</span>
        </button>
      </div>

      {/* Sleep Status */}
      {sleepStatus && (
        <div className={`rounded-xl p-6 text-white ${
          sleepStatus.status === 'sleep' 
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
            : 'bg-gradient-to-r from-orange-500 to-yellow-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Status</h2>
            <div className="flex items-center space-x-2">
              {sleepStatus.status === 'sleep' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span className="font-medium">{sleepStatus.message}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{sleepRecords[0]?.duration || 0}h</div>
              <div className="text-indigo-100 text-sm">Last Night</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{sleepGoal}h</div>
              <div className="text-indigo-100 text-sm">Daily Goal</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.avgDuration}h</div>
              <div className="text-indigo-100 text-sm">7-Day Average</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.avgQuality}/5</div>
              <div className="text-indigo-100 text-sm">Avg Quality</div>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Goal & Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sleep Goal & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Sleep Goal (hours)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={sleepGoal}
                onChange={(e) => setSleepGoal(Number(e.target.value))}
                min="6"
                max="12"
                step="0.5"
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">hours per night</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Achievement
            </label>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalNights > 0 ? Math.round((stats.goalAchieved / stats.totalNights) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.goalAchieved} of {stats.totalNights} nights
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sleep Trend
            </label>
            <div className={`text-2xl font-bold ${
              sleepTrend === 'improving' ? 'text-green-600 dark:text-green-400' :
              sleepTrend === 'declining' ? 'text-red-600 dark:text-red-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {sleepTrend.charAt(0).toUpperCase() + sleepTrend.slice(1)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last 7 days vs previous week
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Overview</h3>
        <div className="grid grid-cols-7 gap-2">
          {sleepRecords.slice(0, 7).reverse().map((record, index) => (
            <div key={record.id} className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-800 dark:text-white">{record.duration}h</div>
                <div className="flex justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full mx-0.5 ${
                        i < record.quality ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {sleepRecords.length === 0 && (
            <div className="col-span-7 text-center py-8 text-gray-500 dark:text-gray-400">
              <Moon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No sleep records yet</p>
              <p className="text-sm mt-1">Log your first sleep to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Sleep Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Average Duration</h3>
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{stats.avgDuration}h</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Sleep Quality</h3>
            <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{stats.avgQuality}/5</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Average rating</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Consistency</h3>
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {stats.totalNights > 0 ? Math.round((stats.goalAchieved / stats.totalNights) * 100) : 0}%
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Goal achievement</p>
        </div>
      </div>

      {/* Recent Sleep Records */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Sleep Records</h3>
        <div className="space-y-3">
          {sleepRecords.slice(0, 5).map(record => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getQualityBg(record.quality)}`}>
                  <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{record.date}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {record.bedtime} - {record.wakeTime}
                  </div>
                  {record.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{record.notes}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-800 dark:text-white">{record.duration}h</div>
                <div className="flex justify-end">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full mx-0.5 ${
                        i < record.quality ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {sleepRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Moon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No sleep records yet</p>
              <p className="text-sm mt-1">Log your first sleep to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Sleep Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sleep Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
              <Sunset className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-medium text-gray-800 dark:text-white">Consistent Schedule</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Go to bed and wake up at the same time every day</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-gray-800 dark:text-white">Sleep Environment</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Keep your bedroom cool, dark, and quiet</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <Sunrise className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-gray-800 dark:text-white">Morning Light</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Get sunlight exposure in the morning</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="font-medium text-gray-800 dark:text-white">Pre-Sleep Routine</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Develop a relaxing bedtime routine</div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Sleep Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Log Sleep</h3>
              <button 
                onClick={() => setShowLogModal(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={sleepForm.date}
                  onChange={(e) => setSleepForm({...sleepForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bedtime <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={sleepForm.bedtime}
                    onChange={(e) => setSleepForm({...sleepForm, bedtime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wake Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={sleepForm.wakeTime}
                    onChange={(e) => setSleepForm({...sleepForm, wakeTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sleep Quality
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSleepForm({...sleepForm, quality: rating})}
                      className={`p-2 rounded-lg transition-colors ${
                        sleepForm.quality >= rating 
                          ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20' 
                          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {sleepForm.quality === 1 && 'Very Poor'}
                  {sleepForm.quality === 2 && 'Poor'}
                  {sleepForm.quality === 3 && 'Fair'}
                  {sleepForm.quality === 4 && 'Good'}
                  {sleepForm.quality === 5 && 'Excellent'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={sleepForm.notes}
                  onChange={(e) => setSleepForm({...sleepForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="How did you sleep? Any factors that affected your sleep?"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={logSleep}
                disabled={loading || !sleepForm.date || !sleepForm.bedtime || !sleepForm.wakeTime}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Logging...' : 'Log Sleep'}
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
    </div>
  );
};