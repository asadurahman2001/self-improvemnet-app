import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCheck, Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  subject: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export const AttendanceTracker: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];

  React.useEffect(() => {
    if (user) {
      loadAttendanceData();
    }
  }, [user]);

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

  const getAttendanceStats = () => {
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

    return {
      total: totalClasses,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      percentage: totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0
    };
  };

  const getSubjectStats = (subject: string) => {
    const subjectRecords = attendanceRecords.filter(r => r.subject === subject);
    const presentCount = subjectRecords.filter(r => r.status === 'present').length;
    const totalCount = subjectRecords.length;
    
    return {
      total: totalCount,
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
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Tracker</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <UserCheck className="w-4 h-4" />
          <span>Mark Attendance</span>
        </button>
      </div>

      {/* Overall Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overall Attendance</h2>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">{stats.percentage}%</span>
          </div>
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
      </div>

      {/* Subject-wise Attendance */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject-wise Attendance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => {
            const subjectStats = getSubjectStats(subject);
            return (
              <div key={subject} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{subject}</h4>
                  <span className="text-sm font-medium text-gray-600">
                    {subjectStats.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subjectStats.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {subjectStats.present}/{subjectStats.total} classes
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance</h3>
        <div className="space-y-3">
          {attendanceRecords.slice(0, 10).map(record => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.status)}
                <div>
                  <div className="font-medium text-gray-800">{record.subject}</div>
                  <div className="text-sm text-gray-500">{record.date}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">This Month</h3>
        <div className="grid grid-cols-7 gap-2">
          {/* Calendar headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const hasRecord = attendanceRecords.some(r => 
              new Date(r.date).getDate() === day
            );
            
            return (
              <div 
                key={day}
                className={`text-center p-2 rounded-lg ${
                  hasRecord 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Goals */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Goals</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-800">Monthly Goal</div>
                <div className="text-sm text-gray-500">Maintain 85% attendance</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{stats.percentage}%</div>
              <div className="text-sm text-gray-500">
                {stats.percentage >= 85 ? 'Goal achieved!' : 'Keep going!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};