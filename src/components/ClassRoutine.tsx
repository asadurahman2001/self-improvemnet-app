import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, BookOpen, Plus, Calendar, User } from 'lucide-react';

interface ClassSchedule {
  id: string;
  subject: string;
  time: string;
  endTime: string;
  location: string;
  instructor: string;
  day: string;
  color: string;
}

export const ClassRoutine: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState('Saturday');

  // Class days: Saturday to Wednesday (Islamic week)
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

  useEffect(() => {
    if (user) {
      loadSchedule();
    }
  }, [user]);

  const loadSchedule = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('time');

    if (data) {
      setSchedule(data);
    }
  };

  const getClassesForDay = (day: string) => {
    return schedule.filter(cls => cls.day === day).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getCurrentClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Only show current class if it's a class day
    if (!days.includes(currentDay)) return null;
    
    return schedule.find(cls => 
      cls.day === currentDay && 
      cls.time <= currentTime && 
      cls.endTime >= currentTime
    );
  };

  const getNextClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Only show next class if it's a class day
    if (!days.includes(currentDay)) {
      // Find next class day
      const nextClassDay = days.find(day => {
        const dayIndex = days.indexOf(day);
        const currentDayIndex = days.indexOf(currentDay);
        return dayIndex > currentDayIndex;
      });
      
      if (nextClassDay) {
        const nextDayClasses = getClassesForDay(nextClassDay);
        return nextDayClasses[0];
      }
      
      // If no more classes this week, return first class of Saturday
      const saturdayClasses = getClassesForDay('Saturday');
      return saturdayClasses[0];
    }
    
    return schedule.find(cls => 
      cls.day === currentDay && 
      cls.time > currentTime
    );
  };

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();

  // Get today's day to set as default
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (days.includes(today)) {
      setSelectedDay(today);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Class Routine</h1>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentClass && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Current Class</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{currentClass.subject}</div>
              <div className="flex items-center space-x-2 text-emerald-100">
                <Clock className="w-4 h-4" />
                <span>{currentClass.time} - {currentClass.endTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-100">
                <MapPin className="w-4 h-4" />
                <span>{currentClass.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-100">
                <User className="w-4 h-4" />
                <span>{currentClass.instructor}</span>
              </div>
            </div>
          </div>
        )}

        {nextClass && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Next Class</h2>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Upcoming</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{nextClass.subject}</div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Clock className="w-4 h-4" />
                <span>{nextClass.time} - {nextClass.endTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <MapPin className="w-4 h-4" />
                <span>{nextClass.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <User className="w-4 h-4" />
                <span>{nextClass.instructor}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Weekly Schedule</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Saturday - Wednesday</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDay === day 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Classes for Selected Day */}
        <div className="space-y-3">
          {getClassesForDay(selectedDay).map(cls => (
            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-16 rounded-full ${cls.color}`}></div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">{cls.subject}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{cls.instructor}</div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{cls.time} - {cls.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{cls.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                <div className="font-medium text-gray-800 dark:text-white">1h 30m</div>
              </div>
            </div>
          ))}
          
          {getClassesForDay(selectedDay).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No classes scheduled for {selectedDay}</p>
              <p className="text-sm mt-1">Enjoy your free day!</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{schedule.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Classes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{new Set(schedule.map(cls => cls.subject)).size}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Subjects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{schedule.length * 1.5}h</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Hours</div>
          </div>
        </div>
      </div>

      {/* Class Days Info */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Islamic Academic Week</span>
        </div>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
          Classes run from Saturday to Wednesday. Thursday and Friday are weekend days for rest and worship.
        </p>
      </div>
    </div>
  );
};