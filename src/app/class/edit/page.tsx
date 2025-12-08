'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getClassEditInfo,
  editClass,
  addToGroup,
  type ClassEditData,
  type EditClassParams,
  type AddToGroupParams,
  type ClassInfo,
  type ClassSubjectEdit,
  type ClassStudentEdit,
  type Topic,
  type ClassExamInfo,
  type Campus,
  type StudentInfo
} from '@/services/auth';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

export default function ClassEditPage() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState<ClassEditData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 错误详情状态
  const [errorDetail, setErrorDetail] = useState<{
    class_student_dict?: Record<string, number>;
    error_lesson?: Record<string, Array<{
      subject_id: number;
      start_time: number;
      end_time: number;
      class_id: number;
    }>>;
    student_flag?: number;
    teacher_flag?: number;
  } | null>(null);

  // 表单状态
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Array<{
    student_id: number;
    start_time: number;
    end_time: number;
    name?: string;
    isTransfer?: boolean;
  }>>([]);
  const [subjects, setSubjects] = useState<Array<{
    topic_id: number;
    teacher_id: number;
    description: string;
    student_signup: number;
    exam_id: number;
    topic_name?: string;
    teacher_name?: string;
    exam_name?: string;
  }>>([]);

  // Add to Group 状态
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [addToGroupData, setAddToGroupData] = useState({
    week_lessons: 1,
    assign_name: ''
  });

  // 注意：移除了搜索状态，因为每个SearchableSelect都自己管理搜索状态

  const canEditClasses = hasPermission(PERMISSIONS.EDIT_CLASSES);

  const loadEditData = async () => {
    if (!classId) {
      setError('Class ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getClassEditInfo(Number(classId));

      if (response.code === 200 && response.data) {
        setEditData(response.data);
        setClassInfo(response.data.class_info);

        // 初始化学生列表
        const studentsWithNames = response.data.class_student.map(student => {
          const studentInfo = response.data!.student_info.find(s => s.id === student.student_id);
          return {
            ...student,
            name: studentInfo?.name || 'Unknown',
            isTransfer: student.start_time !== -1 && student.end_time !== -1
          };
        });
        setStudents(studentsWithNames);

        // 转换double_time为boolean
        setClassInfo({
          ...response.data.class_info,
          double_time: response.data.class_info.double_time === 1
        } as any);

        // 初始化科目列表
        const subjectsWithNames = response.data.class_subject.map(subject => {
          const topicInfo = response.data!.topics.find(t => t.id === subject.topic_id);
          const teacherInfo = response.data!.staff_info.find(s => s.id === subject.teacher_id);
          const examInfo = response.data!.exam_info.find(e => e.id === subject.exam_id);
          return {
            topic_id: subject.topic_id,
            teacher_id: subject.teacher_id,
            description: subject.description,
            student_signup: subject.student_signup,
            exam_id: subject.exam_id,
            topic_name: topicInfo?.name || 'Unknown Topic',
            teacher_name: teacherInfo?.name || 'Unknown Teacher',
            exam_name: examInfo?.name || ''
          };
        });
        setSubjects(subjectsWithNames);
      } else {
        setError(response.message || 'Failed to load edit data');
      }
    } catch (err) {
      console.error('加载Class编辑数据失败:', err);
      setError(err instanceof Error ? err.message : 'Failed to load edit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEditData();
  }, [classId]);

  // 格式化时间
  const formatDate = (timestamp: number) => {
    if (timestamp === -1) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): number => {
    if (!dateString) return -1;
    return Math.floor(new Date(dateString).getTime() / 1000);
  };

  // 格式化日期时间（用于错误详情显示）
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 学生管理
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);



  const addMultipleStudents = () => {
    if (selectedStudentIds.length === 0) {
      setErrorMessage('请选择要添加的学生');
      setShowError(true);
      return;
    }

    // 过滤掉已经添加的学生
    const existingStudentIds = students.map(s => s.student_id);
    const newStudentIds = selectedStudentIds.filter(id => !existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
      setErrorMessage('选中的学生已经全部添加过了');
      setShowError(true);
      return;
    }

    // 添加新学生
    const newStudents = newStudentIds.map(studentId => {
      const studentInfo = editData?.student_info.find(s => s.id === studentId);
      return {
        student_id: studentId,
        start_time: -1,
        end_time: -1,
        name: studentInfo?.name || 'Unknown',
        isTransfer: false
      };
    });

    setStudents([...students, ...newStudents]);
    setSelectedStudentIds([]);
    setShowAddStudentsModal(false);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, field: string, value: any) => {
    const newStudents = [...students];
    if (field === 'student_id') {
      // 检查学生是否已经存在
      const existingStudentIndex = students.findIndex((s, i) => i !== index && s.student_id === value);
      if (existingStudentIndex !== -1 && value !== 0) {
        setErrorMessage('该学生已经添加过了');
        setShowError(true);
        return;
      }

      const studentInfo = editData?.student_info.find(s => s.id === value);
      newStudents[index] = {
        ...newStudents[index],
        student_id: value,
        name: studentInfo?.name || 'Unknown'
      };
    } else if (field === 'isTransfer') {
      newStudents[index] = {
        ...newStudents[index],
        isTransfer: value,
        start_time: value ? parseDate('') : -1,
        end_time: value ? parseDate('') : -1
      };
    } else if (field === 'start_time' || field === 'end_time') {
      // 更新时间字段
      const updatedStudent = {
        ...newStudents[index],
        [field]: value
      };
      newStudents[index] = updatedStudent;
    } else {
      newStudents[index] = {
        ...newStudents[index],
        [field]: value
      };
    }
    setStudents(newStudents);
  };

  // 科目管理
  const addSubject = () => {
    setSubjects([...subjects, {
      topic_id: 0,
      teacher_id: 0,
      description: '',
      student_signup: 0,
      exam_id: -1,
      topic_name: '',
      teacher_name: '',
      exam_name: ''
    }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: any) => {
    const newSubjects = [...subjects];

    // 更新字段值
    if (field === 'topic_id') {
      const topicInfo = editData?.topics.find(t => t.id === value);
      newSubjects[index] = {
        ...newSubjects[index],
        topic_id: value,
        topic_name: topicInfo?.name || 'Unknown Topic'
      };
    } else if (field === 'teacher_id') {
      const teacherInfo = editData?.staff_info.find(s => s.id === value);
      newSubjects[index] = {
        ...newSubjects[index],
        teacher_id: value,
        teacher_name: teacherInfo?.name || 'Unknown Teacher'
      };
    } else if (field === 'exam_id') {
      const examInfo = editData?.exam_info.find(e => e.id === value);
      newSubjects[index] = {
        ...newSubjects[index],
        exam_id: value,
        exam_name: examInfo?.name || ''
      };
    } else {
      newSubjects[index] = {
        ...newSubjects[index],
        [field]: value
      };
    }

    // 检查科目组合是否重复（topic + teacher）
    if (field === 'topic_id' || field === 'teacher_id') {
      const currentSubject = newSubjects[index];
      if (currentSubject.topic_id && currentSubject.teacher_id) {
        const existingSubjectIndex = newSubjects.findIndex((s, i) =>
          i !== index &&
          s.topic_id === currentSubject.topic_id &&
          s.teacher_id === currentSubject.teacher_id
        );

        if (existingSubjectIndex !== -1) {
          setErrorMessage('该Topic和Teacher的组合已经存在');
          setShowError(true);
          return;
        }
      }
    }

    setSubjects(newSubjects);
  };

  // 保存编辑
  const handleSave = async () => {
    if (!classInfo || !classId) return;

    // 验证必填项
    if (!classInfo.name.trim()) {
      setErrorMessage('Class名称不能为空');
      setShowError(true);
      return;
    }

    // 验证学生
    for (const student of students) {
      if (!student.student_id) {
        setErrorMessage('请选择所有学生');
        setShowError(true);
        return;
      }
    }

    // 验证科目
    for (const subject of subjects) {
      if (!subject.topic_id || !subject.teacher_id) {
        setErrorMessage('科目的Topic和Teacher为必选项');
        setShowError(true);
        return;
      }
    }

    try {
      setSaving(true);
      const params: EditClassParams = {
        record_id: Number(classId),
        campus_id: classInfo.campus_id,
        class_name: classInfo.name,
        double_time: classInfo.double_time ? 1 : 0,
        students: students.map(s => ({
          student_id: s.student_id,
          start_time: s.start_time,
          end_time: s.end_time
        })),
        subjects: subjects.map(s => ({
          topic_id: s.topic_id,
          teacher_id: s.teacher_id,
          description: s.description,
          student_signup: s.student_signup,
          exam_id: s.exam_id === -1 ? -1 : s.exam_id
        }))
      };

      const response = await editClass(params);

      if (response.code === 200) {
        setShowSuccess(true);
        // 重新加载页面数据
        await loadEditData();
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        // 尝试解析错误详情
        let errorData = null;
        try {
          if (typeof response.message === 'string') {
            // 尝试解析JSON字符串
            try {
              errorData = JSON.parse(response.message);
            } catch {
              // 不是JSON，使用原始字符串
              errorData = null;
            }
          } else if (typeof response.message === 'object' && response.message !== null) {
            // 已经是对象
            errorData = response.message;
          }

          // 检查是否包含错误详情字段
          if (errorData && (
            errorData.class_student_dict ||
            errorData.error_lesson ||
            errorData.student_flag !== undefined ||
            errorData.teacher_flag !== undefined
          )) {
            // 包含错误详情，显示详情弹框
            setErrorDetail(errorData);
            setErrorMessage('保存失败，存在冲突课程');
          } else {
            // 普通错误信息
            const message = typeof response.message === 'string'
              ? response.message
              : JSON.stringify(response.message);
            setErrorMessage(message || '保存失败');
            setErrorDetail(null);
          }
        } catch (err) {
          // 解析失败，使用普通错误提示
          console.error('解析错误信息失败:', err);
          setErrorMessage(typeof response.message === 'string'
            ? response.message
            : '保存失败');
          setErrorDetail(null);
        }
        setShowError(true);
      }
    } catch (error) {
      console.error('保存Class失败:', error);
      setErrorMessage('保存失败');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  // Add to Group
  const handleAddToGroup = async () => {
    if (!classId || !addToGroupData.assign_name.trim()) {
      setErrorMessage('请填写Assign Name');
      setShowError(true);
      return;
    }

    try {
      const params: AddToGroupParams = {
        record_id: Number(classId),
        week_lessons: addToGroupData.week_lessons,
        assign_name: addToGroupData.assign_name
      };

      const response = await addToGroup(params);

      if (response.code === 200) {
        setShowSuccess(true);
        setShowAddToGroup(false);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(response.message || 'Add to Group失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('Add to Group失败:', error);
      setErrorMessage('Add to Group失败');
      setShowError(true);
    }
  };

  if (!canEditClasses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit classes</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!editData || !classInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/class/schedule?class_id=${classId}`)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setShowAddToGroup(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Add to Group
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Edit Class</h1>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">操作成功！</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowError(false)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={classInfo.name}
                  onChange={(e) => setClassInfo({ ...classInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="请输入班级名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">校区</label>
                <select
                  value={classInfo.campus_id}
                  onChange={(e) => setClassInfo({ ...classInfo, campus_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  {editData.campus_info.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    checked={Boolean(classInfo.double_time)}
                    onChange={(e) => setClassInfo({ ...classInfo, double_time: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">双倍课时</span>
                </label>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
                学生管理 ({students.length})
              </h2>
              <button
                onClick={() => setShowAddStudentsModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                添加学生
              </button>
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">
                      学生
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      类型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <React.Fragment key={`student-${index}-${student.student_id || 'new'}`}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <SearchableSelect
                            options={editData.student_info}
                            value={student.student_id}
                            onValueChange={(value) => updateStudent(index, 'student_id', value)}
                            placeholder="请选择学生"
                            searchPlaceholder="搜索学生..."
                            className="w-full max-w-xs"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={student.isTransfer}
                              onChange={(e) => updateStudent(index, 'isTransfer', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-900">插班生</span>
                          </label>
                        </td>
                        <td className="px-4 py-4">
                          <div className="inline-flex gap-1">
                            {student.student_id && (
                              <button
                                onClick={() => router.push(`/students/schedule?studentId=${student.student_id}`)}
                                className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                title="查看学生课程安排"
                              >
                                <ClockIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeStudent(index)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="删除学生"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {student.isTransfer && (
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="px-4 py-3">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  开始时间
                                </label>
                                <input
                                  type="date"
                                  value={formatDate(student.start_time)}
                                  onChange={(e) => updateStudent(index, 'start_time', parseDate(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  结束时间
                                </label>
                                <input
                                  type="date"
                                  value={formatDate(student.end_time)}
                                  onChange={(e) => updateStudent(index, 'end_time', parseDate(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-green-600" />
                科目管理 ({subjects.length})
              </h2>
              <button
                onClick={addSubject}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                添加科目
              </button>
            </div>

            <div className="space-y-6">
              {subjects.map((subject, index) => (
                <div key={`subject-${index}-${subject.topic_id || 'new'}-${subject.teacher_id || 'new'}`} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  {/* 主要选择项目 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topic <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={editData.topics}
                        value={subject.topic_id}
                        onValueChange={(value) => updateSubject(index, 'topic_id', value)}
                        placeholder="请选择Topic"
                        searchPlaceholder="搜索Topic..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teacher <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={editData.staff_info}
                        value={subject.teacher_id}
                        onValueChange={(value) => updateSubject(index, 'teacher_id', value)}
                        placeholder="请选择Teacher"
                        searchPlaceholder="搜索Teacher..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                      <SearchableSelect
                        options={[
                          { id: -1, name: '无考试' },
                          ...editData.exam_info
                        ]}
                        value={subject.exam_id}
                        onValueChange={(value) => updateSubject(index, 'exam_id', value)}
                        placeholder="请选择Exam"
                        searchPlaceholder="搜索Exam..."
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* 描述和设置 */}
                  <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-gray-100">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={subject.description}
                        onChange={(e) => updateSubject(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="描述"
                      />
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={subject.student_signup === 1}
                          onChange={(e) => updateSubject(index, 'student_signup', e.target.checked ? 1 : 0)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">学生可报名</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                        <button
                          onClick={() => removeSubject(index)}
                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 transition-colors"
                          title="删除科目"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add to Group Modal */}
        {showAddToGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add to Group</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week Lessons <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addToGroupData.week_lessons}
                    onChange={(e) => setAddToGroupData({ ...addToGroupData, week_lessons: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="一周多少节课"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addToGroupData.assign_name}
                    onChange={(e) => setAddToGroupData({ ...addToGroupData, assign_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="别名或者后缀名字"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddToGroup(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddToGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Students Modal */}
        {showAddStudentsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">批量添加学生</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddStudentsModal(false);
                      setSelectedStudentIds([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={addMultipleStudents}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    确认添加
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择学生 <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={editData.student_info.filter(student =>
                      !students.some(s => s.student_id === student.id)
                    )}
                    value={selectedStudentIds}
                    onValueChange={(value) => setSelectedStudentIds(value as number[])}
                    placeholder="请选择要添加的学生"
                    searchPlaceholder="搜索学生..."
                    className="w-full"
                    multiple={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    已选择 {selectedStudentIds.length} 名学生
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Detail Modal */}
        {errorDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                  保存失败 - 冲突详情
                </h3>
                <button
                  onClick={() => {
                    setErrorDetail(null);
                    setShowError(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 错误类型提示 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 mb-2">检测到以下冲突：</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {errorDetail.teacher_flag === 1 && (
                          <li>• 老师课表存在冲突</li>
                        )}
                        {errorDetail.student_flag === 1 && (
                          <li>• 学生课表存在冲突</li>
                        )}
                        {errorDetail.error_lesson && Object.keys(errorDetail.error_lesson).length > 0 && (
                          <li>• 存在冲突的课程安排</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Class列表 */}
                {errorDetail.class_student_dict && Object.keys(errorDetail.class_student_dict).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">相关Class列表：</h4>
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(errorDetail.class_student_dict).map(([studentId, classId]) => (
                          <button
                            key={`${studentId}-${classId}`}
                            onClick={() => router.push(`/class/edit?id=${classId}`)}
                            className="text-left px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900">Class ID: {classId}</div>
                            <div className="text-xs text-gray-500">Student ID: {studentId}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 冲突课程详情 */}
                {errorDetail.error_lesson && Object.keys(errorDetail.error_lesson).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">冲突课程详情：</h4>
                    <div className="space-y-4">
                      {Object.entries(errorDetail.error_lesson).map(([subjectId, lessons]) => (
                        <div key={subjectId} className="border border-gray-200 rounded-md p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900">
                              Subject ID: {subjectId}
                            </h5>
                            <span className="text-xs text-gray-500">
                              共 {lessons.length} 个冲突课程
                            </span>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {lessons.map((lesson, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <div>
                                      <span className="font-medium">开始时间：</span>
                                      {formatDateTime(lesson.start_time)}
                                    </div>
                                    <div>
                                      <span className="font-medium">结束时间：</span>
                                      {formatDateTime(lesson.end_time)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Class ID：</span>
                                      {lesson.class_id}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => router.push(`/class/edit?id=${lesson.class_id}`)}
                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    查看Class
                                  </button>
                                  <button
                                    onClick={() => router.push(`/class/schedule?class_id=${lesson.class_id}`)}
                                    className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                                  >
                                    查看课表
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setErrorDetail(null);
                      setShowError(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
