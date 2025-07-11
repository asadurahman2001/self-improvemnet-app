import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Target, TrendingUp, X, Check, Flame, Calendar, AlertTriangle } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  type: 'good' | 'bad';
  streak: number;
  completedToday: boolean;
  color: string;
  category: 'health' | 'spiritual' | 'productivity' | 'learning';
  badHabitFreeFor?: number; // Days free from bad habit
  lastCompleted?: string;
}

export const HabitTracker: React.FC = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    type: 'good' as 'good' | 'bad',
    category: 'health' as 'health' | 'spiritual' | 'productivity' | 'learning'
  });

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const habitsWithStatus = data.map(habit => ({
        ...habit,
        completedToday: isCompletedToday(habit.last_completed),
        badHabitFreeFor: habit.type === 'bad' ? calculateDaysFree(habit.last_completed) : undefined,
        color: getHabitColor(habit.category)
      }));
      setHabits(habitsWithStatus);
    }
  };

  const isCompletedToday = (lastCompleted: string | null) => {
    if (!lastCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastCompleted === today;
  };

  const calculateDaysFree = (lastCompleted: string | null) => {
    if (!lastCompleted) return 0;
    const lastDate = new Date(lastCompleted);
    const today = new Date();
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getHabitColor = (category: string) => {
    switch (category) {
      case 'health': return 'bg-blue-500';
      case 'spiritual': return 'bg-emerald-500';
      case 'productivity': return 'bg-purple-500';
      case 'learning': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleHabit = async (habitId: string, habitType: 'good' | 'bad') => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    let newStreak = habit.streak;
    let newLastCompleted = today;

    if (habitType === 'good') {
      if (!habit.completedToday) {
        newStreak = habit.streak + 1;
      } else {
        // Unchecking - decrease streak
        newStreak = Math.max(0, habit.streak - 1);
        newLastCompleted = habit.lastCompleted || '';
      }
    } else {
      // For bad habits, marking as completed means they did the bad habit
      if (!habit.completedToday) {
        newStreak = 0; // Reset streak when bad habit is done
      }
    }

    const { error } = await supabase
      .from('habits')
      .update({
        streak: newStreak,
        last_completed: newLastCompleted
      })
      .eq('id', habitId);

    if (!error) {
      setHabits(prev => prev.map(h => 
        h.id === habitId 
          ? { 
              ...h, 
              completedToday: !h.completedToday,
              streak: newStreak,
              lastCompleted: newLastCompleted,
              badHabitFreeFor: habitType === 'bad' ? calculateDaysFree(newLastCompleted) : h.badHabitFreeFor
            }
          : h
      ));
    }
  };

  const addHabit = async () => {
    if (!user || !newHabit.name.trim()) return;

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: newHabit.name,
        type: newHabit.type,
        category: newHabit.category,
        streak: 0,
        last_completed: null
      })
      .select()
      .single();

    if (data && !error) {
      setHabits(prev => [...prev, {
        ...data,
        completedToday: false,
        color: getHabitColor(data.category),
        badHabitFreeFor: newHabit.type === 'bad' ? 0 : undefined
      }]);
      setNewHabit({ name: '', type: 'good', category: 'health' });
      setShowAddHabit(false);
    }
  };

  const goodHabits = habits.filter(h => h.type === 'good');
  const badHabits = habits.filter(h => h.type === 'bad');
  const completedGoodHabits = goodHabits.filter(h => h.completedToday).length;
  const totalGoodHabits = goodHabits.length;
  const progressPercentage = totalGoodHabits > 0 ? (completedGoodHabits / totalGoodHabits) * 100 : 0;

  const categoryColors = {
    health: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    spiritual: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300',
    productivity: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
    learning: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Habit Tracker</h1>
        <button 
          onClick={() => setShowAddHabit(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Daily Progress */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Progress</h2>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span className="font-medium">{completedGoodHabits}/{totalGoodHabits}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-emerald-100 text-sm mb-2">
            <span>Good habits completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-emerald-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{goodHabits.length > 0 ? Math.max(...goodHabits.map(h => h.streak)) : 0}</div>
            <div className="text-emerald-100 text-sm">Best Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{habits.filter(h => h.streak > 0).length}</div>
            <div className="text-emerald-100 text-sm">Active Habits</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{badHabits.length}</div>
            <div className="text-emerald-100 text-sm">Bad Habits</div>
          </div>
        </div>
      </div>

      {/* Good Habits */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Good Habits</h3>
        <div className="space-y-3">
          {goodHabits.map((habit) => (
            <div 
              key={habit.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                habit.completedToday 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  habit.completedToday ? 'bg-emerald-500 text-white' : `${habit.color} text-white`
                }`}>
                  {habit.completedToday ? <Check className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-800 dark:text-white">{habit.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[habit.category]}`}>
                      {habit.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Flame className="w-4 h-4" />
                    <span>{habit.streak} day streak</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => toggleHabit(habit.id, 'good')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  habit.completedToday 
                    ? 'bg-emerald-500 text-white' 
                    : 'border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                }`}
              >
                {habit.completedToday && <Check className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bad Habits */}
      {badHabits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Bad Habits to Overcome</h3>
          <div className="space-y-3">
            {badHabits.map((habit) => (
              <div 
                key={habit.id}
                className="flex items-center justify-between p-4 rounded-lg border-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-800 dark:text-white">{habit.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[habit.category]}`}>
                        {habit.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{habit.badHabitFreeFor || 0} days free from this habit</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleHabit(habit.id, 'bad')}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Did it today
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add New Habit</h3>
              <button
                onClick={() => setShowAddHabit(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Meditate for 10 minutes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Habit Type
                </label>
                <select 
                  value={newHabit.type}
                  onChange={(e) => setNewHabit({...newHabit, type: e.target.value as 'good' | 'bad'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="good">Good Habit (to build)</option>
                  <option value="bad">Bad Habit (to overcome)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select 
                  value={newHabit.category}
                  onChange={(e) => setNewHabit({...newHabit, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="health">Health</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="productivity">Productivity</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={addHabit}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};