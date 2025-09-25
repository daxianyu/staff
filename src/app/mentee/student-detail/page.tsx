'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  getMenteeStudentInfo,
  getCourseInfo,
  getClasses,
  getAssignment,
  getExamsInfo,
  getFeedBack,
  loadStudentRemark,
  loadStudentCashin,
  loadStudentWithdrawal,
  getLanguageExamTable,
  getNormalExamTable,
  addLanguageExam,
  deleteLanguageRow,
  addNormalExam,
  deleteNormalExamRow,
  updateSingle,
  getStudentInfoSelect,
  type MenteeStudentInfo,
  type MenteeCourseInfo,
  type MenteeClassInfo,
  type AssignmentInfo,
  type MenteeExamInfo,
  type FeedbackInfo,
  type RemarkInfo,
  type CashinInfo,
  type WithdrawalInfo,
  type LanguageExamInfo,
  type NormalExamInfo,
  type StudentInfoSelect,
} from '@/services/auth';

interface LanguageExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
}

const LanguageExamModal: React.FC<LanguageExamModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_day: '',
    grade: '',
    score: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await addLanguageExam({
        student_id: parseInt(studentId),
        ...formData,
      });
      if (response.code === 200) {
        alert('Language exam added successfully');
        onSuccess();
        onClose();
        setFormData({ exam_name: '', exam_day: '', grade: '', score: '' });
      } else {
        alert('Failed to add language exam: ' + response.message);
      }
    } catch (error) {
      console.error('Error adding language exam:', error);
      alert('Failed to add language exam');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Language Exam</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Name
            </label>
            <input
              type="text"
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Day
            </label>
            <input
              type="date"
              value={formData.exam_day}
              onChange={(e) => setFormData({ ...formData, exam_day: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score
            </label>
            <input
              type="text"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NormalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
  selectOptions: StudentInfoSelect | null;
}

const NormalExamModal: React.FC<NormalExamModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onSuccess,
  selectOptions,
}) => {
  const [formData, setFormData] = useState({
    normal_exam_center: '',
    normal_exam_season: '',
    normal_exam_subject: '',
    normal_exam_grade: '',
    normal_qualification: '',
    normal_module: '',
    normal_ums_pum: '',
    normal_exam_room_num: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await addNormalExam({
        student_id: parseInt(studentId),
        ...formData,
      });
      if (response.code === 200) {
        alert('Normal exam added successfully');
        onSuccess();
        onClose();
        setFormData({
          normal_exam_center: '',
          normal_exam_season: '',
          normal_exam_subject: '',
          normal_exam_grade: '',
          normal_qualification: '',
          normal_module: '',
          normal_ums_pum: '',
          normal_exam_room_num: '',
        });
      } else {
        alert('Failed to add normal exam: ' + response.message);
      }
    } catch (error) {
      console.error('Error adding normal exam:', error);
      alert('Failed to add normal exam');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Normal Exam</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Center
              </label>
              <select
                value={formData.normal_exam_center}
                onChange={(e) => setFormData({ ...formData, normal_exam_center: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Exam Center</option>
                {selectOptions?.normal_exam.exam_center.map((center) => (
                  <option key={center} value={center}>{center}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Season
              </label>
              <input
                type="text"
                value={formData.normal_exam_season}
                onChange={(e) => setFormData({ ...formData, normal_exam_season: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={formData.normal_exam_subject}
                onChange={(e) => setFormData({ ...formData, normal_exam_subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {selectOptions?.normal_exam.exam_subject.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification
              </label>
              <select
                value={formData.normal_qualification}
                onChange={(e) => setFormData({ ...formData, normal_qualification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Qualification</option>
                {selectOptions?.normal_exam.qualification.map((qual) => (
                  <option key={qual} value={qual}>{qual}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <select
                value={formData.normal_exam_grade}
                onChange={(e) => setFormData({ ...formData, normal_exam_grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Grade</option>
                {selectOptions?.normal_exam.exam_grade.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <input
                type="text"
                value={formData.normal_module}
                onChange={(e) => setFormData({ ...formData, normal_module: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UMS/PUM
              </label>
              <input
                type="text"
                value={formData.normal_ums_pum}
                onChange={(e) => setFormData({ ...formData, normal_ums_pum: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Room Number
              </label>
              <input
                type="text"
                value={formData.normal_exam_room_num}
                onChange={(e) => setFormData({ ...formData, normal_exam_room_num: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentInfo | null;
  onSuccess: () => void;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (assignment) {
      setNote(assignment.note || '');
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateSingle({
        student_id: assignment.id,
        record_id: assignment.id,
        note: note,
      });
      if (response.code === 200) {
        alert('Note updated successfully');
        onSuccess();
        onClose();
      } else {
        alert('Failed to update note: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Assignment Note</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class: {assignment.class_name}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter note..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Update Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function StudentDetailPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');
  const { hasPermission } = useAuth();

  // 状态管理
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<MenteeStudentInfo | null>(null);
  const [courseInfo, setCourseInfo] = useState<MenteeCourseInfo | null>(null);
  const [classes, setClasses] = useState<MenteeClassInfo[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [examsInfo, setExamsInfo] = useState<MenteeExamInfo | null>(null);
  const [feedback, setFeedback] = useState<FeedbackInfo | null>(null);
  const [remarks, setRemarks] = useState<RemarkInfo | null>(null);
  const [cashin, setCashin] = useState<CashinInfo | null>(null);
  const [withdrawal, setWithdrawal] = useState<WithdrawalInfo | null>(null);
  const [languageExams, setLanguageExams] = useState<LanguageExamInfo | null>(null);
  const [normalExams, setNormalExams] = useState<NormalExamInfo | null>(null);
  const [selectOptions, setSelectOptions] = useState<StudentInfoSelect | null>(null);

  // 模态框状态
  const [showLanguageExamModal, setShowLanguageExamModal] = useState(false);
  const [showNormalExamModal, setShowNormalExamModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentInfo | null>(null);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_STUDENT_DETAILS);
  const canEdit = hasPermission(PERMISSIONS.EDIT_MENTEE);
  const canManageExams = hasPermission(PERMISSIONS.MANAGE_STUDENT_EXAMS);
  const canEditAssignment = hasPermission(PERMISSIONS.EDIT_ASSIGNMENT_REQUEST);

  // 权限检查
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问此页面的权限</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">缺少学生ID</h3>
          <p className="mt-1 text-sm text-gray-500">请提供有效的学生ID参数</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAllData();
    loadSelectOptions();
  }, [studentId]);

  const loadAllData = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      // 加载基本信息（始终加载）
      await loadBasicInfo();
      
      // 根据当前选中的标签加载对应数据
      switch (activeTab) {
        case 'basic':
          await loadBasicInfo();
          break;
        case 'course':
          await loadCourseData();
          break;
        case 'classes':
          await loadClassesData();
          break;
        case 'assignments':
          await loadAssignmentsData();
          break;
        case 'exams':
          await loadExamsData();
          break;
        case 'feedback':
          await loadFeedbackData();
          break;
        case 'records':
          await loadRecordsData();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBasicInfo = async () => {
    if (!studentId) return;
    try {
      const response = await getMenteeStudentInfo(studentId);
      if (response.code === 200) {
        setStudentInfo(response.data);
      }
    } catch (error) {
      console.error('Error loading student info:', error);
    }
  };

  const loadCourseData = async () => {
    if (!studentId) return;
    try {
      const response = await getCourseInfo(studentId);
      if (response.code === 200) {
        setCourseInfo(response.data);
      }
    } catch (error) {
      console.error('Error loading course info:', error);
    }
  };

  const loadClassesData = async () => {
    if (!studentId) return;
    try {
      const response = await getClasses(studentId);
      if (response.code === 200) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadAssignmentsData = async () => {
    if (!studentId) return;
    try {
      const response = await getAssignment(studentId);
      if (response.code === 200) {
        setAssignments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadExamsData = async () => {
    if (!studentId) return;
    try {
      const [examsResponse, languageResponse, normalResponse] = await Promise.all([
        getExamsInfo(studentId),
        getLanguageExamTable(studentId),
        getNormalExamTable(studentId),
      ]);
      
      if (examsResponse.code === 200) {
        setExamsInfo(examsResponse.data);
      }
      if (languageResponse.code === 200) {
        setLanguageExams(languageResponse.data);
      }
      if (normalResponse.code === 200) {
        setNormalExams(normalResponse.data);
      }
    } catch (error) {
      console.error('Error loading exams data:', error);
    }
  };

  const loadFeedbackData = async () => {
    if (!studentId) return;
    try {
      const response = await getFeedBack(studentId);
      if (response.code === 200) {
        setFeedback(response.data);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadRecordsData = async () => {
    if (!studentId) return;
    try {
      const [remarksResponse, cashinResponse, withdrawalResponse] = await Promise.all([
        loadStudentRemark(studentId),
        loadStudentCashin(studentId),
        loadStudentWithdrawal(studentId),
      ]);
      
      if (remarksResponse.code === 200) {
        setRemarks(remarksResponse.data);
      }
      if (cashinResponse.code === 200) {
        setCashin(cashinResponse.data);
      }
      if (withdrawalResponse.code === 200) {
        setWithdrawal(withdrawalResponse.data);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const loadSelectOptions = async () => {
    try {
      const response = await getStudentInfoSelect();
      if (response.code === 200) {
        setSelectOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading select options:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // 当切换标签时重新加载数据
    setTimeout(() => loadAllData(), 0);
  };

  const handleDeleteLanguageExam = async (recordId: number) => {
    if (!studentId || !window.confirm('Are you sure you want to delete this language exam record?')) {
      return;
    }

    try {
      const response = await deleteLanguageRow({
        record_id: recordId,
        student_id: parseInt(studentId),
      });
      if (response.code === 200) {
        alert('Language exam deleted successfully');
        loadExamsData(); // Reload exams data
      } else {
        alert('Failed to delete language exam: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting language exam:', error);
      alert('Failed to delete language exam');
    }
  };

  const handleDeleteNormalExam = async (recordId: number) => {
    if (!studentId || !window.confirm('Are you sure you want to delete this normal exam record?')) {
      return;
    }

    try {
      const response = await deleteNormalExamRow({
        record_id: recordId,
        student_id: parseInt(studentId),
      });
      if (response.code === 200) {
        alert('Normal exam deleted successfully');
        loadExamsData(); // Reload exams data
      } else {
        alert('Failed to delete normal exam: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting normal exam:', error);
      alert('Failed to delete normal exam');
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: UserIcon },
    { id: 'course', name: 'Course Info', icon: AcademicCapIcon },
    { id: 'classes', name: 'Classes', icon: DocumentTextIcon },
    { id: 'assignments', name: 'Assignments', icon: ClipboardDocumentListIcon },
    { id: 'exams', name: 'Exams', icon: ClipboardDocumentListIcon },
    { id: 'feedback', name: 'Feedback', icon: ChatBubbleBottomCenterTextIcon },
    { id: 'records', name: 'Records', icon: DocumentTextIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => window.history.back()}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
            <p className="mt-2 text-sm text-gray-600">
              Student ID: {studentId}
              {studentInfo && ` - ${studentInfo.english_name}`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && studentInfo && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">English Name</label>
                      <div className="text-sm text-gray-900">{studentInfo.english_name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <div className="text-sm text-gray-900">{studentInfo.gender_str}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                      <div className="text-sm text-gray-900">{studentInfo.birthday || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <div className="text-sm text-gray-900">{studentInfo.nationality || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                      <div className="text-sm text-gray-900">{studentInfo.campus_name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="text-sm text-gray-900">{studentInfo.phone_number || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <div className="text-sm text-gray-900">{studentInfo.address || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current School</label>
                      <div className="text-sm text-gray-900">{studentInfo.current_school || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Grade</label>
                      <div className="text-sm text-gray-900">{studentInfo.current_grade || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                      <div className="text-sm text-gray-900">{studentInfo.fathers_name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's Phone</label>
                      <div className="text-sm text-gray-900">{studentInfo.fathers_phone_number || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                      <div className="text-sm text-gray-900">{studentInfo.mothers_name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Phone</label>
                      <div className="text-sm text-gray-900">{studentInfo.mothers_phone_number || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Fee</label>
                      <div className="text-sm text-gray-900">{studentInfo.year_fee || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relative Sum</label>
                      <div className="text-sm text-gray-900">{studentInfo.relative_sum || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Exam Numbers */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Exam Numbers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam 0 Number</label>
                        <div className="text-sm text-gray-900">{studentInfo.exam_0_number || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam 1 Number</label>
                        <div className="text-sm text-gray-900">{studentInfo.exam_1_number || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam 2 Number</label>
                        <div className="text-sm text-gray-900">{studentInfo.exam_2_number || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Attendance Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">This Week</h5>
                        <div className="text-sm text-gray-900">
                          <div>Absences: {studentInfo.week_absence}</div>
                          <div>Late: {studentInfo.late_week_details?.length || 0}</div>
                          <div>Authorized Absences: {studentInfo.absence_week_details?.length || 0}</div>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">This Month</h5>
                        <div className="text-sm text-gray-900">
                          <div>Absences: {studentInfo.month_absence || 0}</div>
                          <div>Late: {studentInfo.late_month_details?.length || 0}</div>
                          <div>Authorized Absences: {studentInfo.absence_month_details?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  {studentInfo.fee_pay && studentInfo.fee_pay.length > 0 && (
                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Paid Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {studentInfo.fee_pay.map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* First Edexcel Info */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">First Edexcel Fee</h4>
                    <div className="text-sm text-gray-900">{studentInfo.first_edexcel_info}</div>
                  </div>
                </div>
              )}

              {/* Course Info Tab */}
              {activeTab === 'course' && courseInfo && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                  
                  {courseInfo.show_warning === 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            University Choice Warning
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            Student's university choice needs attention.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <div className="text-sm text-gray-900">{courseInfo.student_info.first_name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <div className="text-sm text-gray-900">{courseInfo.student_info.last_name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                      <div className="text-sm text-gray-900">{courseInfo.student_info.campus_name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Fee</label>
                      <div className="text-sm text-gray-900">{courseInfo.student_info.year_fee || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enrolment Date</label>
                      <div className="text-sm text-gray-900">
                        {courseInfo.student_info.enrolment_date 
                          ? new Date(courseInfo.student_info.enrolment_date * 1000).toLocaleDateString()
                          : 'N/A'
                        }
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date</label>
                      <div className="text-sm text-gray-900">
                        {courseInfo.student_info.graduation_date 
                          ? new Date(courseInfo.student_info.graduation_date * 1000).toLocaleDateString()
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  {/* University Choices */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">University Choices</h4>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const country = courseInfo.student_info[`university_country_${num}` as keyof typeof courseInfo.student_info] as string;
                        const name = courseInfo.student_info[`university_name_${num}` as keyof typeof courseInfo.student_info] as string;
                        const course = courseInfo.student_info[`university_course_${num}` as keyof typeof courseInfo.student_info] as string;
                        
                        if (!country && !name && !course) return null;
                        
                        return (
                          <div key={num} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Choice {num} - Country</label>
                              <div className="text-sm text-gray-900">{country || 'N/A'}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                              <div className="text-sm text-gray-900">{name || 'N/A'}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                              <div className="text-sm text-gray-900">{course || 'N/A'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exam Results */}
                  {Object.keys(courseInfo.exams).length > 0 && (
                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Exam Results</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Result
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Operator
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(courseInfo.exams).map(([examId, exam]) => (
                              <tr key={examId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.exam_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.result || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.grade || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.operator || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Classes Tab */}
              {activeTab === 'classes' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Classes</h3>
                  
                  {classes.length === 0 ? (
                    <div className="text-center py-12">
                      <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
                      <p className="mt-1 text-sm text-gray-500">This student is not enrolled in any classes.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classes.map((classItem) => (
                        <div key={classItem.class_id} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {classItem.class_name}
                          </h4>
                          <div className="text-sm text-gray-600">
                            Class ID: {classItem.class_id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Class Assignment Requests</h3>
                  </div>
                  
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                      <p className="mt-1 text-sm text-gray-500">This student has no assignment requests.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Class Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exam Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Note
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Signup Time
                            </th>
                            {canEditAssignment && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assignments.map((assignment) => (
                            <tr key={assignment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {assignment.class_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {assignment.exam_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {assignment.note || 'No note'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(assignment.signup_time * 1000).toLocaleDateString()}
                              </td>
                              {canEditAssignment && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setShowEditNoteModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Exams Tab */}
              {activeTab === 'exams' && (
                <div className="space-y-8">
                  {/* Main Exams */}
                  {examsInfo && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
                      
                      {/* Table 1 */}
                      {examsInfo.table_1.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-md font-medium text-gray-900 mb-4">Academic Exams</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Result
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operator
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {examsInfo.table_1.map((exam, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.exam_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.exam_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.result || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.grade || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.operator || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Table 2 */}
                      {examsInfo.table_2.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-md font-medium text-gray-900 mb-4">Other Exams</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Result
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operator
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {examsInfo.table_2.map((exam, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.exam_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.exam_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.result || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.grade || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {exam.operator || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Language Exams */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Language Exams</h3>
                      {canManageExams && (
                        <button
                          onClick={() => setShowLanguageExamModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Language Exam
                        </button>
                      )}
                    </div>
                    
                    {languageExams && languageExams.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam Day
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Staff
                              </th>
                              {canManageExams && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {languageExams.rows.map((exam) => (
                              <tr key={exam.record_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.exam_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.exam_day}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.grade}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.score}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.staff_name}
                                </td>
                                {canManageExams && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => handleDeleteLanguageExam(exam.record_id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No language exams found</h3>
                      </div>
                    )}
                  </div>

                  {/* Normal Exams */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Normal Exams</h3>
                      {canManageExams && (
                        <button
                          onClick={() => setShowNormalExamModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Normal Exam
                        </button>
                      )}
                    </div>
                    
                    {normalExams && normalExams.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam Center
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Season
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subject
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qualification
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Staff
                              </th>
                              {canManageExams && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {normalExams.rows.map((exam) => (
                              <tr key={exam.record_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.exam_center}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.exam_season}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.subject}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.qualification}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.grade}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {exam.staff_name}
                                </td>
                                {canManageExams && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => handleDeleteNormalExam(exam.record_id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No normal exams found</h3>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback Tab */}
              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Feedback</h3>
                  
                  {feedback && feedback.rows.length > 0 ? (
                    <div className="space-y-4">
                      {feedback.rows.map((feedbackItem, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {feedbackItem.teacher_name}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {feedbackItem.topic_name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {feedbackItem.time_format}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-2">
                                {feedbackItem.note}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ChatBubbleBottomCenterTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
                      <p className="mt-1 text-sm text-gray-500">This student has no feedback records.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-8">
                  {/* Remarks */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Remark Records</h3>
                    {remarks && remarks.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Season
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam Center
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Create Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {remarks.rows.map((remark) => (
                              <tr key={remark.record_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {remark.season}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {remark.exam_center}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {remark.exam_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {remark.remark_type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {remark.price}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    remark.status === 1 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {remark.status_name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {remark.create_time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No remark records found</h3>
                      </div>
                    )}
                  </div>

                  {/* Cashin Records */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash-in Records</h3>
                    {cashin && cashin.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Season
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subject
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Level
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Create Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cashin.rows.map((cashinItem) => (
                              <tr key={cashinItem.record_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {cashinItem.season}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {cashinItem.subject_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {cashinItem.exam_code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {cashinItem.level}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    cashinItem.status === 1 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {cashinItem.status_name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {cashinItem.create_time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No cash-in records found</h3>
                      </div>
                    )}
                  </div>

                  {/* Withdrawal Records */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Records</h3>
                    {withdrawal && withdrawal.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Season
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Exam
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Signup Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Account
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Create Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {withdrawal.rows.map((withdrawalItem) => (
                              <tr key={withdrawalItem.record_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {withdrawalItem.season}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {withdrawalItem.exam_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {withdrawalItem.signup_price}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {withdrawalItem.account_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    withdrawalItem.status === 1 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {withdrawalItem.status_name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {withdrawalItem.create_time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No withdrawal records found</h3>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LanguageExamModal
        isOpen={showLanguageExamModal}
        onClose={() => setShowLanguageExamModal(false)}
        studentId={studentId!}
        onSuccess={() => loadExamsData()}
      />

      <NormalExamModal
        isOpen={showNormalExamModal}
        onClose={() => setShowNormalExamModal(false)}
        studentId={studentId!}
        onSuccess={() => loadExamsData()}
        selectOptions={selectOptions}
      />

      <EditNoteModal
        isOpen={showEditNoteModal}
        onClose={() => {
          setShowEditNoteModal(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        onSuccess={() => loadAssignmentsData()}
      />
    </div>
  );
}
