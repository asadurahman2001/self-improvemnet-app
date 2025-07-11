import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  UserCheck, Calendar, TrendingUp, CheckCircle, XCircle, Clock, 
  MapPin, BookOpen, Plus, User, X, Edit, Trash2, Bell
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  subject: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'cancelled';
  notes?: string;
}

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

export const AttendanceRoutine: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [newClass, setNewClass] = useState({
    subject: '',
    time: '',
    endTime: '',
    location: '',
    instructor: '',
    day: 'Monday',
    color: '#3B82F6'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [attendanceResponse, scheduleResponse] = await Promise.all([
        supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', user?.id)
          .order('date', { ascending: false }),
        supabase
          .from('class_schedules')
          .select('*')
          .eq('user_id', user?.id)
          .order('day', { ascending: true })
      ]);

      if (attendanceResponse.data) setAttendanceRecords(attendanceResponse.data);
      if (scheduleResponse.data) setClassSchedule(scheduleResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewClass = async () => {
    if (!user || !newClass.subject || !newClass.time) return;

    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .insert([{ ...newClass, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setClassSchedule([...classSchedule, data]);
        setNewClass({
          subject: '',
          time: '',
          endTime: '',
          location: '',
          instructor: '',
          day: 'Monday',
          color: '#3B82F6'
        });
        setShowAddClass(false);
      }
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  const markAttendance = async (status: 'present' | 'absent' | 'late' | 'cancelled') => {
    if (!user || !selectedClass) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if attendance already exists for today
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('subject', selectedClass.subject)
        .eq('date', today)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('attendance_records')
          .update({ status })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance_records')
          .insert([{
            user_id: user.id,
            subject: selectedClass.subject,
            date: today,
            status
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setAttendanceRecords([data, ...attendanceRecords]);
        }
      }

      fetchData(); // Refresh data
      setShowMarkAttendance(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const deleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', classId);

      if (error) throw error;
      setClassSchedule(classSchedule.filter(cls => cls.id !== classId));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const getAttendanceStats = (subject: string) => {
    const subjectRecords = attendanceRecords.filter(record => record.subject === subject);
    const totalClasses = subjectRecords.filter(record => record.status !== 'cancelled').length;
    const presentClasses = subjectRecords.filter(record => record.status === 'present').length;
    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    return { totalClasses, presentClasses, percentage };
  };

  const getCurrentClass = () => {
    const now = new Date();
    const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Adjust for Sunday = 0
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return classSchedule.find(cls => {
      if (cls.day !== currentDay) return false;
      const [startHour, startMin] = cls.time.split(':').map(Number);
      const [endHour, endMin] = cls.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      return currentTime >= startTime && currentTime <= endTime;
    });
  };

  const getNextClass = () => {
    const now = new Date();
    const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Find next class today
    const todayClasses = classSchedule
      .filter(cls => cls.day === currentDay)
      .filter(cls => {
        const [startHour, startMin] = cls.time.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        return startTime > currentTime;
      })
      .sort((a, b) => {
        const aTime = a.time.split(':').map(Number);
        const bTime = b.time.split(':').map(Number);
        return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
      });

    if (todayClasses.length > 0) return todayClasses[0];

    // Find next class in upcoming days
    const currentDayIndex = days.indexOf(currentDay);
    for (let i = 1; i < 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      const nextDayClasses = classSchedule
        .filter(cls => cls.day === nextDay)
        .sort((a, b) => {
          const aTime = a.time.split(':').map(Number);
          const bTime = b.time.split(':').map(Number);
          return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
        });
      
      if (nextDayClasses.length > 0) return nextDayClasses[0];
    }

    return null;
  };

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Class Alert */}
      {currentClass && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Current Class</h3>
                <p className="text-emerald-100">{currentClass.subject}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedClass(currentClass);
                setShowMarkAttendance(true);
              }}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Mark Attendance
            </button>
          </div>
          <div className="mt-4 flex items-center space-x-6 text-sm text-emerald-100">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{currentClass.time} - {currentClass.endTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{currentClass.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{currentClass.instructor}</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Class */}
      {nextClass && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Next Class</h3>
              <p className="text-blue-100">{nextClass.subject}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-6 text-sm text-blue-100">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{nextClass.day}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{nextClass.time} - {nextClass.endTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{nextClass.location}</span>
            </div>
          </div>
        </div>
      )}

      {/* Class Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
            <Calendar className="w-6 h-6" />
            <span>Class Schedule</span>
          </h2>
          <button
            onClick={() => setShowAddClass(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>

        {classSchedule.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No classes scheduled yet</p>
            <p className="text-sm">Add your first class to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {days.map(day => {
              const dayClasses = classSchedule.filter(cls => cls.day === day);
              if (dayClasses.length === 0) return null;

              return (
                <div key={day} className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                    {day}
                  </h3>
                  <div className="grid gap-3">
                    {dayClasses
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(cls => {
                        const stats = getAttendanceStats(cls.subject);
                        return (
                          <div key={cls.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-12 rounded-full"
                                  style={{ backgroundColor: cls.color }}
                                ></div>
                                <div>
                                  <div className="font-semibold text-lg text-gray-800 dark:text-white">
                                    {cls.subject}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                    {cls.time} - {cls.endTime}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{cls.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>{cls.instructor}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {/* Quick Attendance Buttons */}
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => {
                                      setSelectedClass(cls);
                                      markAttendance('present');
                                    }}
                                    className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                                    title="Mark Present"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedClass(cls);
                                      markAttendance('absent');
                                    }}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                                    title="Mark Absent"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedClass(cls);
                                      markAttendance('late');
                                    }}
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg transition-colors"
                                    title="Mark Late"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedClass(cls);
                                      markAttendance('cancelled');
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                                    title="Mark Cancelled"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => deleteClass(cls.id)}
                                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Attendance Stats */}
                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Attendance: </span>
                                    <span className={`font-semibold ${
                                      stats.percentage >= 75 ? 'text-green-600' : 
                                      stats.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {stats.percentage}%
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {stats.presentClasses}/{stats.totalClasses} classes
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className={`w-4 h-4 ${
                                    stats.percentage >= 75 ? 'text-green-600' : 
                                    stats.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add New Class</h3>
              <button
                onClick={() => setShowAddClass(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter subject name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newClass.time}
                    onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day
                </label>
                <select
                  value={newClass.day}
                  onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newClass.location}
                  onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Room number or location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instructor
                </label>
                <input
                  type="text"
                  value={newClass.instructor}
                  onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Instructor name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewClass({ ...newClass, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newClass.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddClass(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addNewClass}
                disabled={!newClass.subject || !newClass.time}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkAttendance && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mark Attendance</h3>
              <button
                onClick={() => {
                  setShowMarkAttendance(false);
                  setSelectedClass(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                Subject: <span className="font-semibold">{selectedClass.subject}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Date: <span className="font-semibold">{new Date().toLocaleDateString()}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => markAttendance('present')}
                className="flex items-center justify-center space-x-2 p-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Present</span>
              </button>
              <button
                onClick={() => markAttendance('absent')}
                className="flex items-center justify-center space-x-2 p-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>Absent</span>
              </button>
              <button
                onClick={() => markAttendance('late')}
                className="flex items-center justify-center space-x-2 p-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span>Late</span>
              </button>
              <button
                onClick={() => markAttendance('cancelled')}
                className="flex items-center justify-center space-x-2 p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Cancelled</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};