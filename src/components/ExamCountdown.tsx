import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Plus, BookOpen, Target, X, Edit, Trash2 } from 'lucide-react';

interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  type: 'class_test' | 'final' | 'quiz' | 'assignment';
  studyHours: number;
  targetHours: number;
  notes?: string;
}

export const ExamCountdown: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);
  
  // Form states
  const [examForm, setExamForm] = useState({
    subject: '',
    date: '',
    time: '',
    location: '',
    type: 'class_test' as 'class_test' | 'final' | 'quiz' | 'assignment',
    targetHours: 10,
    notes: ''
  });
  
  const [studyForm, setStudyForm] = useState({
    hours: 1,
    notes: ''
  });

  React.useEffect(() => {
    if (user) {
      loadExams();
    }
  }, [user]);

  const loadExams = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (data) {
      setExams(data);
    }
  };

  const addExam = async () => {
    if (!user || !examForm.subject || !examForm.date || isAddingExam) {
      console.log('Validation failed or already adding:', { 
        user: !!user, 
        subject: examForm.subject, 
        date: examForm.date, 
        isAdding: isAddingExam 
      });
      return;
    }

    setIsAddingExam(true);

    try {
      const examData = {
        user_id: user.id,
        subject: examForm.subject,
        date: examForm.date,
        time: examForm.time || null,
        location: examForm.location || null,
        type: examForm.type,
        target_hours: examForm.targetHours,
        study_hours: 0
      };

      // Only add notes if it's not empty
      if (examForm.notes && examForm.notes.trim()) {
        (examData as any).notes = examForm.notes.trim();
      }

      console.log('Adding exam:', examData);

      const { data, error } = await supabase
        .from('exams')
        .insert(examData)
        .select();

      if (error) {
        console.error('Error adding exam:', error);
        alert('Failed to add exam: ' + error.message);
        return;
      }

      console.log('Exam added successfully:', data);
      setShowAddModal(false);
      setExamForm({
        subject: '',
        date: '',
        time: '',
        location: '',
        type: 'class_test',
        targetHours: 10,
        notes: ''
      });
      await loadExams();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred while adding the exam.');
    } finally {
      setIsAddingExam(false);
    }
  };

  const updateExam = async () => {
    if (!user || !selectedExam || !examForm.subject || !examForm.date || isUpdatingExam) return;

    setIsUpdatingExam(true);

    try {
      const examData = {
        subject: examForm.subject,
        date: examForm.date,
        time: examForm.time || null,
        location: examForm.location || null,
        type: examForm.type,
        target_hours: examForm.targetHours
      };

      // Only add notes if it's not empty
      if (examForm.notes && examForm.notes.trim()) {
        (examData as any).notes = examForm.notes.trim();
      }

      const { error } = await supabase
        .from('exams')
        .update(examData)
        .eq('id', selectedExam.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating exam:', error);
        alert('Failed to update exam: ' + error.message);
        return;
      }

      setShowEditModal(false);
      setSelectedExam(null);
      setExamForm({
        subject: '',
        date: '',
        time: '',
        location: '',
        type: 'class_test',
        targetHours: 10,
        notes: ''
      });
      await loadExams();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred while updating the exam.');
    } finally {
      setIsUpdatingExam(false);
    }
  };

  const deleteExam = async (examId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId)
      .eq('user_id', user.id);

    if (!error) {
      await loadExams();
    }
  };

  const logStudySession = async () => {
    if (!user || !selectedExam || studyForm.hours <= 0) return;

    const newStudyHours = selectedExam.studyHours + studyForm.hours;

    const { error } = await supabase
      .from('exams')
      .update({
        study_hours: newStudyHours
      })
      .eq('id', selectedExam.id)
      .eq('user_id', user.id);

    if (!error) {
      setShowStudyModal(false);
      setSelectedExam(null);
      setStudyForm({ hours: 1, notes: '' });
      await loadExams();
    }
  };

  const openEditModal = (exam: Exam) => {
    setSelectedExam(exam);
    setExamForm({
      subject: exam.subject,
      date: exam.date,
      time: exam.time,
      location: exam.location,
      type: exam.type,
      targetHours: exam.targetHours,
      notes: exam.notes || ''
    });
    setShowEditModal(true);
  };

  const openStudyModal = (exam: Exam) => {
    setSelectedExam(exam);
    setShowStudyModal(true);
  };

  const calculateDaysLeft = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'final': return 'bg-red-100 text-red-800';
      case 'class_test': return 'bg-orange-100 text-orange-800';
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExamTypeDisplay = (type: string) => {
    switch (type) {
      case 'final': return 'Final';
      case 'class_test': return 'Class Test';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Assignment';
      default: return type;
    }
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 3) return 'text-red-600 dark:text-red-400';
    if (daysLeft <= 7) return 'text-orange-600 dark:text-orange-400';
    if (daysLeft <= 14) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const nextExam = exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const nextExamDays = nextExam ? calculateDaysLeft(nextExam.date) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Exam Countdown</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {/* Next Exam Highlight */}
      {nextExam && (
        <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Next Exam</h2>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">{nextExam.subject}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{nextExamDays}</div>
              <div className="text-red-100 text-sm">Days Left</div>
            </div>
            <div>
              <div className="text-xl font-bold">{nextExam.studyHours}h</div>
              <div className="text-red-100 text-sm">Hours Studied</div>
            </div>
            <div>
              <div className="text-xl font-bold">{Math.round((nextExam.studyHours / nextExam.targetHours) * 100)}%</div>
              <div className="text-red-100 text-sm">Progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Exam List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Upcoming Exams</h3>
        <div className="space-y-4">
          {exams.map((exam) => {
            const daysLeft = calculateDaysLeft(exam.date);
            const progressPercentage = (exam.studyHours / exam.targetHours) * 100;
            
            return (
              <div key={exam.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{exam.subject}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{exam.time} • {exam.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getUrgencyColor(daysLeft)}`}>
                      {daysLeft}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">days left</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getExamTypeColor(exam.type)}`}>
                    {getExamTypeDisplay(exam.type)}
                  </span>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {exam.date} • {exam.time}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Study Progress</span>
                    <span>{exam.studyHours.toFixed(1)}h / {exam.targetHours}h</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progressPercentage >= 100 ? 'bg-green-500' : 
                        progressPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{Math.round(progressPercentage)}% complete</span>
                  <span>{Math.max(0, exam.targetHours - exam.studyHours).toFixed(1)}h remaining</span>
                </div>

                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => openStudyModal(exam)}
                    className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    Log Study
                  </button>
                  <button
                    onClick={() => openEditModal(exam)}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {exams.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No exams scheduled yet</p>
              <p className="text-sm mt-1">Add your first exam to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Study Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recommended Study Schedule</h3>
        <div className="space-y-3">
          {exams.slice(0, 3).map((exam) => {
            const daysLeft = calculateDaysLeft(exam.date);
            const hoursNeeded = exam.targetHours - exam.studyHours;
            const hoursPerDay = daysLeft > 0 ? Math.ceil(hoursNeeded / daysLeft) : 0;
            
            return (
              <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">{exam.subject}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {hoursNeeded > 0 ? `${hoursNeeded}h remaining` : 'Study complete!'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {hoursPerDay > 0 ? `${hoursPerDay.toFixed(1)}h/day` : 'Complete!'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {daysLeft} days left
                  </div>
                </div>
              </div>
            );
          })}
          {exams.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No study schedule available</p>
            </div>
          )}
        </div>
      </div>

      {/* Exam Statistics */}
      {exams.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Exam Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{exams.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Exams</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {exams.filter(exam => calculateDaysLeft(exam.date) <= 7).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(exams.reduce((sum, exam) => sum + (exam.studyHours / exam.targetHours) * 100, 0) / exams.length)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {exams.reduce((sum, exam) => sum + exam.studyHours, 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Hours Studied</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add New Exam</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
                  value={examForm.subject}
                  onChange={(e) => setExamForm({...examForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={examForm.date}
                    onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time (Optional)</label>
                  <input
                    type="time"
                    value={examForm.time}
                    onChange={(e) => setExamForm({...examForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={examForm.location}
                  onChange={(e) => setExamForm({...examForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Room 101"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({...examForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="class_test">Class Test</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Hours</label>
                  <input
                    type="number"
                    value={examForm.targetHours}
                    onChange={(e) => setExamForm({...examForm, targetHours: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={examForm.notes}
                  onChange={(e) => setExamForm({...examForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addExam}
                disabled={isAddingExam}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  isAddingExam 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAddingExam ? 'Adding...' : 'Add Exam'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAddingExam}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  isAddingExam 
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Exam</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
                  value={examForm.subject}
                  onChange={(e) => setExamForm({...examForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={examForm.date}
                    onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time (Optional)</label>
                  <input
                    type="time"
                    value={examForm.time}
                    onChange={(e) => setExamForm({...examForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={examForm.location}
                  onChange={(e) => setExamForm({...examForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="e.g., Room 101"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({...examForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="class_test">Class Test</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Hours</label>
                  <input
                    type="number"
                    value={examForm.targetHours}
                    onChange={(e) => setExamForm({...examForm, targetHours: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={examForm.notes}
                  onChange={(e) => setExamForm({...examForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={updateExam}
                disabled={isUpdatingExam}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isUpdatingExam ? 'Updating...' : 'Update Exam'}
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

      {/* Log Study Session Modal */}
      {showStudyModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Log Study Session</h3>
              <button onClick={() => setShowStudyModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{selectedExam.subject}</strong>
                <br />
                Current progress: {selectedExam.studyHours}h / {selectedExam.targetHours}h
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hours Studied</label>
                <input
                  type="number"
                  value={studyForm.hours}
                  onChange={(e) => setStudyForm({...studyForm, hours: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  min="0.5"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={studyForm.notes}
                  onChange={(e) => setStudyForm({...studyForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={3}
                  placeholder="What did you study today?"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={logStudySession}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Log Session
              </button>
              <button
                onClick={() => setShowStudyModal(false)}
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