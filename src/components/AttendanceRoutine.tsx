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
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState('Saturday');
  const [activeTab, setActiveTab] = useState<'routine' | 'attendance'>('routine');
  
  // Modal states
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  
  // Form states
  const [classForm, setClassForm] = useState({
    subject: '',
    time: '',
    endTime: '',
    location: '',
    instructor: '',
    day: 'Saturday',
    color: '#3B82F6'
  });
  
  const [attendanceForm, setAttendanceForm] = useState({
    subject: '',
    date: '',
    status: 'present' as 'present' | 'absent' | 'late',
    notes: ''
  });

  // Class days: Saturday to Wednesday (Islamic week)
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];

  useEffect(() => {
    if (user) {
      loadSchedule();
      loadAttendanceData();
    }
  }, [user]);

  // Get today's day to set as default
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (days.includes(today)) {
      setSelectedDay(today);
    }
  }, []);

  const loadSchedule = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('time');

    if (data) {
      setSchedule(data);
    }
  };

  const loadAttendanceData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (data) {
      setAttendanceRecords(data);
    }
  };

  const addClass = async () => {
    if (!user || !classForm.subject || !classForm.time || !classForm.endTime) return;

    const { error } = await supabase
      .from('class_schedules')
      .insert({
        user_id: user.id,
        subject: classForm.subject,
        time: classForm.time,
        end_time: classForm.endTime,
        location: classForm.location,
        instructor: classForm.instructor,
        day: classForm.day,
        color: classForm.color
      });

    if (!error) {
      setShowAddClassModal(false);
      setClassForm({
        subject: '',
        time: '',
        endTime: '',
        location: '',
        instructor: '',
        day: 'Saturday',
        color: '#3B82F6'
      });
      await loadSchedule();
    }
  };

  const updateClass = async () => {
    if (!user || !selectedClass || !classForm.subject || !classForm.time || !classForm.endTime) return;

    const { error } = await supabase
      .from('class_schedules')
      .update({
        subject: classForm.subject,
        time: classForm.time,
        end_time: classForm.endTime,
        location: classForm.location,
        instructor: classForm.instructor,
        day: classForm.day,
        color: classForm.color
      })
      .eq('id', selectedClass.id)
      .eq('user_id', user.id);

    if (!error) {
      setShowEditClassModal(false);
      setSelectedClass(null);
      setClassForm({
        subject: '',
        time: '',
        endTime: '',
        location: '',
        instructor: '',
        day: 'Saturday',
        color: '#3B82F6'
      });
      await loadSchedule();
    }
  };

  const deleteClass = async (classId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('class_schedules')
      .delete()
      .eq('id', classId)
      .eq('user_id', user.id);

    if (!error) {
      await loadSchedule();
    }
  const quickMarkAttendance = async (subject: string, status: 'present' | 'absent' | 'late' | 'cancelled') => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('attendance_records')
      .upsert({
        user_id: user.id,
        subject: subject,
        date: today,
        status: status,
        notes: status === 'cancelled' ? 'Class cancelled' : null
      }, {
        onConflict: 'user_id,subject,date'
      });
  };
    if (!error) {
      await loadAttendanceData();
    }
  };

  const markAttendance = async () => {
    if (!user || !attendanceForm.subject || !attendanceForm.date) return;

    const { error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: user.id,
        subject: attendanceForm.subject,
        date: attendanceForm.date,
        status: attendanceForm.status,
        notes: attendanceForm.notes || null
      });

    if (!error) {
      setShowMarkAttendanceModal(false);
      setAttendanceForm({
        subject: '',
        date: '',
        status: 'present',
        notes: ''
      });
      await loadAttendanceData();
    }
  };

  const openEditClassModal = (cls: ClassSchedule) => {
    setSelectedClass(cls);
    setClassForm({
      subject: cls.subject,
      time: cls.time,
      endTime: cls.endTime,
      location: cls.location,
      instructor: cls.instructor,
      day: cls.day,
      color: cls.color
    });
    setShowEditClassModal(true);
  };

  const getClassesForDay = (day: string) => {
    return schedule.filter(cls => cls.day === day).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getCurrentClass = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
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
    
    if (!days.includes(currentDay)) {
      const nextClassDay = days.find(day => {
        const dayIndex = days.indexOf(day);
        const currentDayIndex = days.indexOf(currentDay);
        return dayIndex > currentDayIndex;
      });
      
      if (nextClassDay) {
        const nextDayClasses = getClassesForDay(nextClassDay);
        return nextDayClasses[0];
      }
      
      const saturdayClasses = getClassesForDay('Saturday');
      return saturdayClasses[0];
    }
    
    return schedule.find(cls => 
      cls.day === currentDay && 
      cls.time > currentTime
    );
  };

  const getAttendanceStats = () => {
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const cancelledCount = attendanceRecords.filter(r => r.status === 'cancelled').length;
    
    // Don't count cancelled classes in percentage calculation
    const validClasses = totalClasses - cancelledCount;

    return {
      total: totalClasses,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      cancelled: cancelledCount,
      percentage: validClasses > 0 ? Math.round((presentCount / validClasses) * 100) : 0
    };
  };

  const getSubjectStats = (subject: string) => {
    const subjectRecords = attendanceRecords.filter(r => r.subject === subject);
    const presentCount = subjectRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const cancelledCount = subjectRecords.filter(r => r.status === 'cancelled').length;
    const totalCount = subjectRecords.length - cancelledCount; // Don't count cancelled classes
    
    return {
      total: subjectRecords.length,
      validTotal: totalCount,
      present: presentCount,
      percentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Class Management</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'routine'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Routine
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            Attendance
          </button>
        </div>
      </div>

      {/* Routine Tab */}
      {activeTab === 'routine' && (
        <>
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
        <div className="space-y-4">
            )}
            <div key={cls.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">

          {/* Weekly Schedule */}
                  className="w-3 h-12 rounded-full"
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Weekly Schedule</h3>
              <button
                  <div className="font-semibold text-lg text-gray-800 dark:text-white">{cls.subject}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{cls.instructor}</div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{cls.time} - {cls.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{cls.location}</span>
                    </div>
                <Plus className="w-4 h-4" />
                </div>
              </div>
              
              {/* Quick Attendance Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Mark:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => quickMarkAttendance(cls.subject, 'present')}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => quickMarkAttendance(cls.subject, 'absent')}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => quickMarkAttendance(cls.subject, 'late')}
                      className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                    >
                      Late
                    </button>
                    <button
                      onClick={() => quickMarkAttendance(cls.subject, 'cancelled')}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelled
                    </button>
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
                <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cls.color }}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">{cls.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cls.time} - {cls.endTime} • {cls.location}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cls.instructor}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditClassModal(cls)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteClass(cls.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {getClassesForDay(selectedDay).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>No classes scheduled for {selectedDay}</p>
                  <p className="text-sm mt-1">Add your first class to get started!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <>
          {/* Overall Stats */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Overall Attendance</h2>
              <button
                onClick={() => setShowMarkAttendanceModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-blue-100 text-sm">Total Classes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.present}</div>
                <div className="text-blue-100 text-sm">Present</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.absent}</div>
                <div className="text-blue-100 text-sm">Absent</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.late}</div>
                <div className="text-blue-100 text-sm">Late</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold">{stats.percentage}%</div>
              <div className="text-blue-100 text-sm">Attendance Rate</div>
            </div>
          </div>

          {/* Subject-wise Attendance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Subject-wise Attendance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(subject => {
                const subjectStats = getSubjectStats(subject);
                return (
                  <div key={subject} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 dark:text-white">{subject}</h4>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {subjectStats.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${subjectStats.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {subjectStats.present}/{subjectStats.total} classes
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Attendance</h3>
            <div className="space-y-3">
              {attendanceRecords.slice(0, 10).map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">{record.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{record.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {attendanceRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>No attendance records yet</p>
                  <p className="text-sm mt-1">Mark your first attendance to get started!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add New Class</h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={classForm.subject}
                  onChange={(e) => setClassForm({...classForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={classForm.time}
                    onChange={(e) => setClassForm({...classForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={classForm.endTime}
                    onChange={(e) => setClassForm({...classForm, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={classForm.location}
                  onChange={(e) => setClassForm({...classForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Room 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructor (Optional)</label>
                <input
                  type="text"
                  value={classForm.instructor}
                  onChange={(e) => setClassForm({...classForm, instructor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day</label>
                <select
                  value={classForm.day}
                  onChange={(e) => setClassForm({...classForm, day: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addClass}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Class
              </button>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Class</h3>
              <button onClick={() => setShowEditClassModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={classForm.subject}
                  onChange={(e) => setClassForm({...classForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={classForm.time}
                    onChange={(e) => setClassForm({...classForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={classForm.endTime}
                    onChange={(e) => setClassForm({...classForm, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={classForm.location}
                  onChange={(e) => setClassForm({...classForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Room 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructor (Optional)</label>
                <input
                  type="text"
                  value={classForm.instructor}
                  onChange={(e) => setClassForm({...classForm, instructor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day</label>
                <select
                  value={classForm.day}
                  onChange={(e) => setClassForm({...classForm, day: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={updateClass}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Update Class
              </button>
              <button
                onClick={() => setShowEditClassModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mark Attendance</h3>
              <button onClick={() => setShowMarkAttendanceModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={attendanceForm.subject}
                  onChange={(e) => setAttendanceForm({...attendanceForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="cancelled">Class Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={markAttendance}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => setShowMarkAttendanceModal(false)}
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