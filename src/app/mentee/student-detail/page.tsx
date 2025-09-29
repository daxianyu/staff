'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  getMenteeStudentInfo,
  getClasses,
  getAssignment,
  getCourseInfo,
  getFeedBack,
  loadStudentRemark,
  loadStudentCashin,
  loadStudentWithdrawal,
  getLanguageExamTable,
  getNormalExamTable,
  studentReportLeave,
  updateComplaint,
  getStudentLessons,
  getExamsInfo,
  addLanguageExam,
  deleteLanguageExam,
  addNormalExam,
  deleteNormalExam,
  getStudentInfoSelect,
  type MenteeStudentInfo,
  type MenteeClassInfo,
  type AssignmentInfo,
  type MenteeCourseInfo,
  type FeedbackInfo,
  type RemarkInfo,
  type CashinInfo,
  type WithdrawalInfo,
  type LanguageExamInfo,
  type NormalExamInfo,
  type StudentLesson,
} from '@/services/auth';

// 请假模态框组件
interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  lessons: StudentLesson[];
  onSuccess: () => void;
}

const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  lessons,
  onSuccess,
}) => {
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [comment, setComment] = useState('');

  // 不再过滤课程，显示所有课程

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLessons.length === 0) {
      alert('请选择要请假的课程');
      return;
    }
    if (!comment.trim()) {
      alert('请输入请假理由');
      return;
    }

    try {
      const result = await studentReportLeave({
        student_id: studentId,
        lesson_ids: selectedLessons.join(','),
        comment: comment.trim(),
      });

      if (result.code === 200) {
        onSuccess();
        onClose();
        setSelectedLessons([]);
        setComment('');
      } else {
        alert('请假提交失败: ' + result.message);
      }
    } catch (error) {
      alert('请假提交失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            学生请假 - {studentName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择要请假的课程
            </label>
            {lessons.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                {lessons
                  .sort((a, b) => a.start_time - b.start_time)
                  .map((lesson) => (
                  <label key={lesson.lesson_id} className={`flex items-center p-3 hover:bg-gray-50 ${!lesson.can_report_leave ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedLessons.includes(lesson.lesson_id)}
                      disabled={!lesson.can_report_leave}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLessons([...selectedLessons, lesson.lesson_id]);
                        } else {
                          setSelectedLessons(selectedLessons.filter(id => id !== lesson.lesson_id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">教师：{lesson.teacher_name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(lesson.start_time * 1000).toLocaleString()} - {new Date(lesson.end_time * 1000).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">{lesson.room_name}</div>
                      {!lesson.can_report_leave && (
                        <div className="text-sm text-red-500 mt-1">不可请假</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 border border-gray-300 rounded-md">
                暂无课程信息
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请假原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入请假原因（必填）"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={selectedLessons.length === 0 || !comment.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              提交请假
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 投诉模态框组件
interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  onSuccess: () => void;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}) => {
  const [complaint, setComplaint] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    try {
      const result = await updateComplaint({
        student_id: studentId,
        complaint: complaint.trim(),
      });

      if (result.code === 200) {
        onSuccess();
        onClose();
        setComplaint('');
      } else {
        alert('投诉提交失败: ' + result.message);
      }
    } catch (error) {
      alert('投诉提交失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            提交投诉 - {studentName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              投诉内容
            </label>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入投诉内容"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              提交投诉
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 添加语言考试模态框组件
interface AddLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  onSuccess: () => void;
}

const AddLanguageModal: React.FC<AddLanguageModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_day: '',
    grade: '',
    score: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exam_name.trim() || !formData.exam_day.trim() || !formData.grade.trim() || !formData.score.trim()) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      const result = await addLanguageExam({
        student_id: studentId,
        exam_name: formData.exam_name.trim(),
        exam_day: formData.exam_day.trim(),
        grade: formData.grade.trim(),
        score: formData.score.trim(),
      });

      if (result.code === 200) {
        onSuccess();
        onClose();
        setFormData({ exam_name: '', exam_day: '', grade: '', score: '' });
      } else {
        alert('添加语言考试成绩失败: ' + result.message);
      }
    } catch (error) {
      alert('添加语言考试成绩失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            添加语言考试成绩 - {studentName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              考试名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入考试名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              考试日期 <span className="text-red-500">*</span>
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
              等级 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入等级"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分数 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入分数"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 添加大考成绩模态框组件
interface AddNormalModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  onSuccess: () => void;
  selectOptions?: any;
}

const AddNormalModal: React.FC<AddNormalModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.normal_exam_center.trim() || !formData.normal_exam_season.trim() || !formData.normal_exam_subject.trim()) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      const result = await addNormalExam({
        student_id: studentId,
        normal_exam_center: formData.normal_exam_center.trim(),
        normal_exam_season: formData.normal_exam_season.trim(),
        normal_exam_subject: formData.normal_exam_subject.trim(),
        normal_exam_grade: formData.normal_exam_grade.trim(),
        normal_qualification: formData.normal_qualification.trim(),
        normal_module: formData.normal_module.trim(),
        normal_ums_pum: formData.normal_ums_pum.trim(),
        normal_exam_room_num: formData.normal_exam_room_num.trim(),
      });

      if (result.code === 200) {
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
        alert('添加大考成绩失败: ' + result.message);
      }
    } catch (error) {
      alert('添加大考成绩失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            添加大考成绩 - {studentName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                考试中心 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.normal_exam_center}
                onChange={(e) => setFormData({ ...formData, normal_exam_center: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择考试中心</option>
                {selectOptions?.normal_exam?.exam_center?.map((center: string) => (
                  <option key={center} value={center}>{center}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                考试学期 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.normal_exam_season}
                onChange={(e) => setFormData({ ...formData, normal_exam_season: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入考试学期"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                科目 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.normal_exam_subject}
                onChange={(e) => setFormData({ ...formData, normal_exam_subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择科目</option>
                {selectOptions?.normal_exam?.exam_subject?.map((subject: string) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                等级
              </label>
              <select
                value={formData.normal_exam_grade}
                onChange={(e) => setFormData({ ...formData, normal_exam_grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择等级</option>
                {selectOptions?.normal_exam?.exam_grade?.map((grade: string) => (
                  <option key={grade} value={grade}>{grade}</option>
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
              >
                <option value="">请选择</option>
                {selectOptions?.normal_exam?.qualification?.map((qual: string) => (
                  <option key={qual} value={qual}>{qual}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模块
              </label>
              <input
                type="text"
                value={formData.normal_module}
                onChange={(e) => setFormData({ ...formData, normal_module: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入模块"
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
                placeholder="请输入UMS/PUM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                考场号
              </label>
              <input
                type="text"
                value={formData.normal_exam_room_num}
                onChange={(e) => setFormData({ ...formData, normal_exam_room_num: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入考场号"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function StudentDetailPage() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_MENTEE);
  const canEdit = hasPermission(PERMISSIONS.EDIT_MENTEE);
  const canViewClasses = hasPermission(PERMISSIONS.EDIT_CLASSES);

  // 状态管理
  const [activeTab, setActiveTab] = useState('basic-info');
  const [examGroupExpanded, setExamGroupExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<MenteeStudentInfo | null>(null);
  const [classes, setClasses] = useState<MenteeClassInfo[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [courseInfo, setCourseInfo] = useState<MenteeCourseInfo | null>(null);
  const [feedback, setFeedback] = useState<FeedbackInfo | null>(null);
  const [remarks, setRemarks] = useState<RemarkInfo | null>(null);
  const [cashin, setCashin] = useState<CashinInfo | null>(null);
  const [withdrawal, setWithdrawal] = useState<WithdrawalInfo | null>(null);
  const [languageExams, setLanguageExams] = useState<LanguageExamInfo | null>(null);
  const [normalExams, setNormalExams] = useState<NormalExamInfo | null>(null);
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [examsInfo, setExamsInfo] = useState<{table_1: any[], table_2: any[]} | null>(null);
  const [selectOptions, setSelectOptions] = useState<any>(null);

  // 模态框状态
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [showAddNormalModal, setShowAddNormalModal] = useState(false);

  // 加载数据
  useEffect(() => {
    if (!studentId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 并行加载所有数据
        const [
          studentInfoResult,
          classesResult,
          assignmentsResult,
          courseInfoResult,
          feedbackResult,
          remarksResult,
          cashinResult,
          withdrawalResult,
          languageExamsResult,
          normalExamsResult,
          lessonsResult,
          examsInfoResult,
          selectOptionsResult,
        ] = await Promise.all([
          getMenteeStudentInfo(studentId),
          getClasses(studentId),
          getAssignment(studentId),
          getCourseInfo(studentId),
          getFeedBack(studentId),
          loadStudentRemark(studentId),
          loadStudentCashin(studentId),
          loadStudentWithdrawal(studentId),
          getLanguageExamTable(studentId),
          getNormalExamTable(studentId),
          getStudentLessons(studentId),
          getExamsInfo(studentId),
          getStudentInfoSelect(),
        ]);

        if (studentInfoResult.code === 200 && studentInfoResult.data) setStudentInfo(studentInfoResult.data);
        if (classesResult.code === 200 && classesResult.data) setClasses(classesResult.data);
        if (assignmentsResult.code === 200 && assignmentsResult.data) setAssignments(assignmentsResult.data);
        if (courseInfoResult.code === 200 && courseInfoResult.data) setCourseInfo(courseInfoResult.data);
        if (feedbackResult.code === 200 && feedbackResult.data) setFeedback(feedbackResult.data);
        if (remarksResult.code === 200 && remarksResult.data) setRemarks(remarksResult.data);
        if (cashinResult.code === 200 && cashinResult.data) setCashin(cashinResult.data);
        if (withdrawalResult.code === 200 && withdrawalResult.data) setWithdrawal(withdrawalResult.data);
        if (languageExamsResult.code === 200 && languageExamsResult.data) setLanguageExams(languageExamsResult.data);
        if (normalExamsResult.code === 200 && normalExamsResult.data) setNormalExams(normalExamsResult.data);
        if (lessonsResult.code === 200 && lessonsResult.data) setLessons(lessonsResult.data);
        if (examsInfoResult.code === 200 && examsInfoResult.data) setExamsInfo(examsInfoResult.data);
        if (selectOptionsResult.code === 200 && selectOptionsResult.data) setSelectOptions(selectOptionsResult.data);

      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限查看此页面</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">学生信息不存在</h2>
          <p className="text-gray-600">无法找到指定的学生信息</p>
        </div>
      </div>
    );
  }

  // 选项卡配置
  const tabs = [
    { id: 'option', label: 'Option', icon: PlusIcon },
    { id: 'classes', label: 'Classes', icon: AcademicCapIcon },
    { id: 'assignment', label: 'Class Assignment', icon: ClipboardDocumentListIcon },
    { id: 'basic-info', label: 'Basic Info', icon: UserIcon },
    { id: 'university', label: 'University Choices', icon: AcademicCapIcon },
    { id: 'feedback', label: 'Feedback', icon: ChatBubbleBottomCenterTextIcon },
    { 
      id: 'exam-info', 
      label: 'Exam Info', 
      icon: DocumentTextIcon,
      children: [
        { id: 'exam-records', label: 'Exam Records' },
        { id: 'student-remark', label: 'Student Remark' },
        { id: 'student-cashin', label: 'Student Cashin' },
        { id: 'student-withdrawal', label: 'Student Withdrawal' },
        { id: 'exam-score', label: 'Exam Score' },
        { id: 'language-score', label: 'Language Score' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {studentInfo.english_name || '学生详情'}
              </h1>
              <p className="text-gray-600 mt-1">
                学生ID: {studentInfo.student_long_id} | 校区: {studentInfo.campus_name}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/students/schedule?studentId=${studentId}`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* 选项卡导航 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <div key={tab.id} className="relative">
                  {tab.children ? (
                    <div>
                      <button
                        onClick={() => setExamGroupExpanded(!examGroupExpanded)}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab.startsWith('exam-') 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon className="h-5 w-5 mr-2" />
                        {tab.label}
                        {examGroupExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 ml-1" />
                        )}
                      </button>
                      
                      {examGroupExpanded && (
                        <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
                          {tab.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => {
                                setActiveTab(child.id);
                                setExamGroupExpanded(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                activeTab === child.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* 选项卡内容 */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'option' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">操作选项</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                  <span>学生请假</span>
                </button>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChatBubbleBottomCenterTextIcon className="h-6 w-6 mr-2 text-red-600" />
                  <span>提交投诉</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生班级</h3>
              {classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((classItem) => (
                    canViewClasses ? (
                      <Link
                        key={classItem.class_id}
                        href={`/class/view?id=${classItem.class_id}`}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-900">{classItem.class_name}</h4>
                      </Link>
                    ) : (
                      <div
                        key={classItem.class_id}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-900">{classItem.class_name}</h4>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无班级信息</p>
              )}
            </div>
          )}

          {activeTab === 'assignment' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生作业</h3>
              {assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">班级</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">科目</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报名时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.exam_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.class_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.note}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.note}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(assignment.signup_time * 1000).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">编辑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">暂无作业信息</p>
              )}
            </div>
          )}

          {activeTab === 'basic-info' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生基本信息</h3>
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">姓名:</span>
                      <span className="text-sm text-gray-900">{studentInfo.english_name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">校区:</span>
                      <span className="text-sm text-gray-900">{studentInfo.campus_name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">性别:</span>
                      <span className="text-sm text-gray-900">{studentInfo.gender_str}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">生日:</span>
                      <span className="text-sm text-gray-900">{studentInfo.birthday}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">入学日期:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(studentInfo.enrolment_date * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">毕业日期:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(studentInfo.graduation_date * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">年费:</span>
                      <span className="text-sm text-gray-900">{studentInfo.year_fee}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">学生ID:</span>
                      <span className="text-sm text-gray-900">{studentInfo.student_long_id}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">国籍:</span>
                      <span className="text-sm text-gray-900">{studentInfo.nationality}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">UCI号码:</span>
                      <span className="text-sm text-gray-900">{studentInfo.exam_0_number}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">CIE中心号:</span>
                      <span className="text-sm text-gray-900">{studentInfo.exam_1_number}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">CIE考生号:</span>
                      <span className="text-sm text-gray-900">{studentInfo.exam_2_number}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">电话:</span>
                      <span className="text-sm text-gray-900">{studentInfo.phone_number}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 text-sm font-medium text-gray-500">地址:</span>
                      <span className="text-sm text-gray-900">{studentInfo.address}</span>
                    </div>
                  </div>
                </div>

                {/* 缺勤统计 */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">缺勤统计</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">近7天缺勤:</span>
                        <span className="text-sm text-gray-900">{studentInfo.week_absence}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">近30天缺勤:</span>
                        <span className="text-sm text-gray-900">{studentInfo.absence_month_details.length}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">近7天迟到:</span>
                        <span className="text-sm text-gray-900">{studentInfo.late_week_details.length}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">近30天迟到:</span>
                        <span className="text-sm text-gray-900">{studentInfo.late_month_details.length}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">近7天未授权缺勤:</span>
                        <span className="text-sm text-gray-900">{studentInfo.unauthorized_week_details.length}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">近30天未授权缺勤:</span>
                        <span className="text-sm text-gray-900">{studentInfo.unauthorized_month_details.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 学校信息 */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">学校信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">当前学校:</span>
                        <span className="text-sm text-gray-900">{studentInfo.current_school}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">当前年级:</span>
                        <span className="text-sm text-gray-900">{studentInfo.current_grade}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">科目相关:</span>
                        <span className="text-sm text-gray-900">{studentInfo.relative_sum}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 家长信息 */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">家长信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">父亲姓名:</span>
                        <span className="text-sm text-gray-900">{studentInfo.fathers_name}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">父亲电话:</span>
                        <span className="text-sm text-gray-900">{studentInfo.fathers_phone_number}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">母亲姓名:</span>
                        <span className="text-sm text-gray-900">{studentInfo.mothers_name}</span>
                      </div>
                      <div className="flex">
                        <span className="w-40 text-sm font-medium text-gray-500">母亲电话:</span>
                        <span className="text-sm text-gray-900">{studentInfo.mothers_phone_number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 考试信息 */}
                {studentInfo.fee_pay && studentInfo.fee_pay.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">考试信息</h4>
                    <div className="space-y-2">
                      {studentInfo.fee_pay.map((exam, index) => (
                        <div key={index} className="text-sm text-gray-900">
                          {exam}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'university' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">大学选择</h3>
              {courseInfo ? (
                <div className="space-y-6">
                  {/* 大学选择列表 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">大学选择信息</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">序号</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">国家</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大学名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">专业</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.from({ length: 15 }, (_, index) => {
                            const num = index + 1;
                            const countryKey = `university_country_${num}` as keyof typeof courseInfo.student_info;
                            const nameKey = `university_name_${num}` as keyof typeof courseInfo.student_info;
                            const courseKey = `university_course_${num}` as keyof typeof courseInfo.student_info;
                            
                            return (
                              <tr key={num} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {num}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    defaultValue={courseInfo.student_info[countryKey] as string || ''}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="国家"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    defaultValue={courseInfo.student_info[nameKey] as string || ''}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="大学名称"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    defaultValue={courseInfo.student_info[courseKey] as string || ''}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="专业"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 确认状态 */}
                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={courseInfo.student_info.university_choice_confirmed === 1}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          大学选择已确认
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 保存按钮 */}
                  <div className="border-t pt-6">
                    <div className="flex space-x-4">
                      <button
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => {
                          // TODO: 实现保存功能
                          console.log('保存大学选择信息');
                        }}
                      >
                        保存
                      </button>
                      <button
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        onClick={() => {
                          // TODO: 实现保存并发送邮件功能
                          console.log('保存并发送邮件');
                        }}
                      >
                        保存并发送邮件
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">暂无大学选择信息</p>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生反馈</h3>
              {feedback && feedback.rows && feedback.rows.length > 0 ? (
                <div className="space-y-4">
                  {feedback.rows.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.topic_name}</h4>
                        <span className="text-sm text-gray-500">{item.time_format}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>教师:</strong> {item.teacher_name}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>反馈内容:</strong>
                        <p className="mt-1">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无反馈信息</p>
              )}
            </div>
          )}

          {activeTab === 'student-remark' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生备注</h3>
              {remarks && remarks.rows && remarks.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导师</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">校区</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试中心</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {remarks.rows.map((remark) => (
                        <tr key={remark.record_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.mentor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.campus_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.season}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.exam_center}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.exam_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.status_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{remark.create_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">暂无备注信息</p>
              )}
            </div>
          )}

          {activeTab === 'student-cashin' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生缴费</h3>
              {cashin && cashin.rows && cashin.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导师</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">科目</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试代码</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">级别</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cashin.rows.map((item) => (
                        <tr key={item.record_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.season}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mentor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.subject_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.exam_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.level}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.note}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.status_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.create_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">暂无缴费信息</p>
              )}
            </div>
          )}

          {activeTab === 'student-withdrawal' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学生退考</h3>
              {withdrawal && withdrawal.rows && withdrawal.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">校区</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导师</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试季</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付宝账号</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">记录提交时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">拒绝/驳回 原因</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawal.rows.map((item) => (
                        <tr key={item.record_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.campus_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mentor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.season}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.status_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.exam_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pay_account}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.account_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.signup_price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.create_time}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reject_reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">暂无退考信息</p>
              )}
            </div>
          )}

          {activeTab === 'exam-score' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">大考成绩</h3>
                <button
                  onClick={() => setShowAddNormalModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加大考成绩
                </button>
              </div>
              {normalExams && normalExams.rows && normalExams.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试中心</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试学期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">科目</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资格</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模块</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UMS/PUM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考场号</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作员</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {normalExams.rows.map((exam) => (
                        <tr key={exam.record_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_center}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_season}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.qualification}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.grade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.module}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.ums_pum}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_room_num}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.staff_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                if (confirm('确定要删除这条大考成绩记录吗？')) {
                                  deleteNormalExam({
                                    student_id: parseInt(studentId || '0'),
                                    record_id: exam.record_id,
                                  }).then(result => {
                                    if (result.code === 200) {
                                      // 重新加载数据
                                      if (studentId) {
                                        getNormalExamTable(studentId).then(result => {
                                          if (result.code === 200 && result.data) {
                                            setNormalExams(result.data);
                                          }
                                        });
                                      }
                                    } else {
                                      alert('删除失败: ' + result.message);
                                    }
                                  });
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">暂无大考成绩信息</p>
              )}
            </div>
          )}

          {activeTab === 'language-score' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">语言考试成绩</h3>
                <button
                  onClick={() => setShowAddLanguageModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加语言考试成绩
                </button>
              </div>
              {languageExams && languageExams.rows && languageExams.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作员</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {languageExams.rows.map((exam) => (
                        <tr key={exam.record_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_day}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.grade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.score}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.staff_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                if (confirm('确定要删除这条语言考试成绩记录吗？')) {
                                  deleteLanguageExam({
                                    student_id: parseInt(studentId || '0'),
                                    record_id: exam.record_id,
                                  }).then(result => {
                                    if (result.code === 200) {
                                      // 重新加载数据
                                      if (studentId) {
                                        getLanguageExamTable(studentId).then(result => {
                                          if (result.code === 200 && result.data) {
                                            setLanguageExams(result.data);
                                          }
                                        });
                                      }
                                    } else {
                                      alert('删除失败: ' + result.message);
                                    }
                                  });
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">暂无语言考试成绩信息</p>
              )}
            </div>
          )}

          {activeTab === 'exam-records' && (
            <div className="p-6">
              {examsInfo ? (
                <div className="space-y-6">
                  {/* 大考记录 */}
                  {examsInfo.table_1 && examsInfo.table_1.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Exam</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam	</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {examsInfo.table_1.map((exam, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.result}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.second}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.grade}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {examsInfo.table_2 && examsInfo.table_2.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4">School Exam</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {examsInfo.table_2.map((exam, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.score}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.result}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.grade}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(!examsInfo.table_1 || examsInfo.table_1.length === 0) && (!examsInfo.table_2 || examsInfo.table_2.length === 0) && (
                    <p className="text-gray-500">暂无考试记录</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No exam records</p>
              )}
            </div>
          )}
        </div>

        {/* 模态框 */}
        <LeaveModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          studentId={parseInt(studentId || '0')}
          studentName={studentInfo.english_name}
          lessons={lessons}
          onSuccess={() => {
            // 重新加载课程数据
            if (studentId) {
              getStudentLessons(studentId).then(result => {
                if (result.code === 200 && result.data) {
                  setLessons(result.data);
                }
              });
            }
          }}
        />

        <ComplaintModal
          isOpen={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
          studentId={parseInt(studentId || '0')}
          studentName={studentInfo.english_name}
          onSuccess={() => {
            // 可以在这里添加成功后的处理逻辑
          }}
        />

        <AddLanguageModal
          isOpen={showAddLanguageModal}
          onClose={() => setShowAddLanguageModal(false)}
          studentId={parseInt(studentId || '0')}
          studentName={studentInfo.english_name}
          onSuccess={() => {
            // 重新加载语言考试成绩数据
            if (studentId) {
              getLanguageExamTable(studentId).then(result => {
                if (result.code === 200 && result.data) {
                  setLanguageExams(result.data);
                }
              });
            }
          }}
        />

        <AddNormalModal
          isOpen={showAddNormalModal}
          onClose={() => setShowAddNormalModal(false)}
          studentId={parseInt(studentId || '0')}
          studentName={studentInfo.english_name}
          selectOptions={selectOptions}
          onSuccess={() => {
            // 重新加载大考成绩数据
            if (studentId) {
              getNormalExamTable(studentId).then(result => {
                if (result.code === 200 && result.data) {
                  setNormalExams(result.data);
                }
              });
            }
          }}
        />
      </div>
    </div>
  );
}
