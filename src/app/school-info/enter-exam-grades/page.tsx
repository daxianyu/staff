'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { openUrlWithFallback } from '@/utils/openUrlWithFallback';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  getEnterExamGrades,
  getEnterGrades,
  getExamAllEvaluate,
  getExamTemplate,
  batchAddStudentExam,
  updateStudentExamGrade,
  addExamTeacherEvaluate,
  deleteSubjectEvaluate,
  type ExamGradeItem,
  type EnterGradesData,
  type ExamStudent,
  type ExamEvaluateItem,
} from '@/services/auth';

export default function EnterExamGradesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.ENTER_GRADES);

  const examId = searchParams.get('examId') ? Number(searchParams.get('examId')) : null;

  // 列表状态
  const [examList, setExamList] = useState<ExamGradeItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 详情状态
  const [detailLoading, setDetailLoading] = useState(true);
  const [examData, setExamData] = useState<EnterGradesData | null>(null);
  const [evaluateList, setEvaluateList] = useState<ExamEvaluateItem[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'evaluates'>('students');
  
  // 学生成绩编辑状态
  const [studentEdits, setStudentEdits] = useState<Record<number, { result: string; second: string; grade: string }>>({});
  const [saving, setSaving] = useState(false);
  
  // 邀请老师模态框
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStudentId, setInviteStudentId] = useState<number | null>(null);
  const [inviteTeacherId, setInviteTeacherId] = useState<number>(0);
  const [inviteSchoolYear, setInviteSchoolYear] = useState('');
  const [inviteSemester, setInviteSemester] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  
  // 删除确认模态框
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvaluateId, setDeleteEvaluateId] = useState<number | null>(null);
  
  // 批量上传文件
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // 成功/错误提示
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Grade 选项
  const gradeOptions = ['A*', 'A', 'B', 'C', 'D', 'E', 'U', 'X No result', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const filteredExamList = examList.filter((exam) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (exam.name || '').toLowerCase().includes(keyword);
  });

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看Enter Exam Grades</p>
        </div>
      </div>
    );
  }

  // 加载列表数据
  const loadListData = async () => {
    setListLoading(true);
    try {
      const result = await getEnterExamGrades();
      if (result.code === 200 && result.data) {
        setExamList(result.data.rows || []);
      } else {
        console.error('获取Enter Exam Grades失败:', result.message);
        setExamList([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setExamList([]);
    } finally {
      setListLoading(false);
    }
  };

  // 加载详情数据
  const loadDetailData = async () => {
    if (!examId) return;
    
    setDetailLoading(true);
    try {
      const [gradesResult, evaluateResult] = await Promise.all([
        getEnterGrades(examId),
        getExamAllEvaluate(examId),
      ]);

      if (gradesResult.code === 200 && gradesResult.data) {
        setExamData(gradesResult.data);
        // 初始化编辑状态
        const edits: Record<number, { result: string; second: string; grade: string }> = {};
        gradesResult.data.exam_students.forEach((student) => {
          const [result = '', second = ''] = student.result ? student.result.split('/') : ['', student.second || ''];
          edits[student.record_id] = {
            result,
            second: second || student.second || '',
            grade: student.grade || '',
          };
        });
        setStudentEdits(edits);
      } else {
        console.error('获取Enter Grades失败:', gradesResult.message);
        setErrorMessage(gradesResult.message || '获取数据失败');
        setShowError(true);
      }

      if (evaluateResult.code === 200 && evaluateResult.data) {
        setEvaluateList(evaluateResult.data.rows || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setErrorMessage('加载数据失败');
      setShowError(true);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const examIdParam = searchParams.get('examId') ? Number(searchParams.get('examId')) : null;
    if (examIdParam) {
      // 加载详情数据
      const loadDetail = async () => {
        setDetailLoading(true);
        try {
          const [gradesResult, evaluateResult] = await Promise.all([
            getEnterGrades(examIdParam),
            getExamAllEvaluate(examIdParam),
          ]);

          if (gradesResult.code === 200 && gradesResult.data) {
            setExamData(gradesResult.data);
            // 初始化编辑状态
            const edits: Record<number, { result: string; second: string; grade: string }> = {};
            gradesResult.data.exam_students.forEach((student) => {
              const [result = '', second = ''] = student.result ? student.result.split('/') : ['', student.second || ''];
              edits[student.record_id] = {
                result,
                second: second || student.second || '',
                grade: student.grade || '',
              };
            });
            setStudentEdits(edits);
          } else {
            console.error('获取Enter Grades失败:', gradesResult.message);
            setErrorMessage(gradesResult.message || '获取数据失败');
            setShowError(true);
          }

          if (evaluateResult.code === 200 && evaluateResult.data) {
            setEvaluateList(evaluateResult.data.rows || []);
          }
        } catch (error) {
          console.error('加载数据失败:', error);
          setErrorMessage('加载数据失败');
          setShowError(true);
        } finally {
          setDetailLoading(false);
        }
      };
      loadDetail();
    } else {
      loadListData();
    }
  }, [searchParams]);

  // 查看详情（跳转到详情页）
  const handleViewDetails = (examId: number) => {
    openUrlWithFallback(`/school-info/enter-exam-grades?examId=${examId}`);
  };

  // 返回列表
  const handleBackToList = () => {
    router.push('/school-info/enter-exam-grades');
  };

  // 更新学生成绩编辑
  const handleStudentEdit = (recordId: number, field: 'result' | 'second' | 'grade', value: string) => {
    setStudentEdits((prev) => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [field]: value,
      },
    }));
  };

  // 保存所有成绩
  const handleSaveGrades = async () => {
    if (!examData || !examId) return;
    
    setSaving(true);
    try {
      const updateData = examData.exam_students.map((student) => {
        const edit = studentEdits[student.record_id];
        return {
          record_id: student.record_id,
          result: edit?.result || '',
          second: edit?.second || '',
          grade: edit?.grade || '',
        };
      });

      const result = await updateStudentExamGrade({ data: updateData });
      if (result.code === 200) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        loadDetailData();
      } else {
        setErrorMessage(result.message || '保存失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('保存成绩失败:', error);
      setErrorMessage('保存成绩失败');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  // 打开邀请老师模态框
  const handleOpenInviteModal = (studentId: number) => {
    if (!examData) return;
    
    // 检查是否有可邀请的老师
    if (!examData.teacher_query_list || examData.teacher_query_list.length === 0) {
      setErrorMessage('没有可邀请的老师');
      setShowError(true);
      return;
    }
    
    setInviteStudentId(studentId);
    setInviteTeacherId(examData.teacher_query_list[0]?.id || 0);
    setInviteSchoolYear(examData.school_year_list[examData.semester_default] || examData.school_year_list[0] || '');
    setInviteSemester(examData.semester_list[examData.semester_default] || examData.semester_list[0] || '');
    setShowInviteModal(true);
  };

  // 保存邀请
  const handleSaveInvite = async () => {
    if (!inviteStudentId || !inviteTeacherId || !inviteSchoolYear || !inviteSemester || !examId) {
      setErrorMessage('请填写完整信息');
      setShowError(true);
      return;
    }

    setInviteSaving(true);
    try {
      const evaluateTitle = `${inviteSchoolYear}${inviteSemester}`;
      const result = await addExamTeacherEvaluate({
        exam_id: examId,
        student_id: inviteStudentId,
        teacher_id: inviteTeacherId,
        evaluate_title: evaluateTitle,
      });

      if (result.code === 200) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowInviteModal(false);
        loadDetailData();
      } else {
        setErrorMessage(result.message || '邀请失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('邀请失败:', error);
      setErrorMessage('邀请失败');
      setShowError(true);
    } finally {
      setInviteSaving(false);
    }
  };

  // 删除评语
  const handleDeleteEvaluate = async () => {
    if (!deleteEvaluateId) return;

    try {
      const result = await deleteSubjectEvaluate({ record_id: deleteEvaluateId });
      if (result.code === 200) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowDeleteModal(false);
        loadDetailData();
      } else {
        setErrorMessage(result.message || '删除失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('删除失败:', error);
      setErrorMessage('删除失败');
      setShowError(true);
    }
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    if (!examId) return;
    
    try {
      const result = await getExamTemplate(examId);
      if (result.code === 200 && result.data?.file_path) {
        // 拼接完整的文件URL
        const fileUrl = `https://www.huayaopudong.com/${result.data.file_path}`;
        openUrlWithFallback(fileUrl);
      } else {
        setErrorMessage(result.message || '下载模板失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('下载模板失败:', error);
      setErrorMessage('下载模板失败');
      setShowError(true);
    }
  };

  // 上传文件
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!examId) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await batchAddStudentExam(examId, file);
      if (result.code === 200) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        loadDetailData();
      } else {
        setErrorMessage(result.message || '上传失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('上传失败:', error);
      setErrorMessage('上传失败');
      setShowError(true);
    } finally {
      setUploadingFile(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  // 格式化时间
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN');
  };

  // 如果选择了examId，显示详情页
  if (examId) {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>
      );
    }

    if (!examData) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
            <p className="mt-1 text-sm text-gray-500">无法获取考试信息</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 成功/错误提示 */}
          {showSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 mr-2" />
                操作成功
              </div>
            </div>
          )}
          {showError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  {errorMessage}
                </div>
                <button onClick={() => setShowError(false)}>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* 页面头部 */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToList}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  返回
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{examData.exam_info.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    考试时间: {formatTimestamp(examData.exam_info.time)}
                    {examData.exam_info.time_2 && `, ${formatTimestamp(examData.exam_info.time_2)}`}
                    {examData.exam_info.time_3 && `, ${formatTimestamp(examData.exam_info.time_3)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    地点: {examData.exam_info.location} | 科目: {examData.exam_info.topic}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  下载模板
                </button>
                <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                  <PaperClipIcon className="h-5 w-5 mr-2" />
                  {uploadingFile ? '上传中...' : '批量上传'}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 标签页 */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'students'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  学生成绩 ({examData.exam_students.length})
                </button>
                <button
                  onClick={() => setActiveTab('evaluates')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'evaluates'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  评语列表 ({evaluateList.length})
                </button>
              </nav>
            </div>

            {/* 学生成绩标签页 */}
            {activeTab === 'students' && (
              <div className="p-6">
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={handleSaveGrades}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2" />
                        保存所有成绩
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学生姓名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          报名时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          分数
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          总分
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          等第
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          已邀请老师
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {examData.exam_students.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            暂无学生
                          </td>
                        </tr>
                      ) : (
                        examData.exam_students.map((student) => {
                          const edit = studentEdits[student.record_id] || { result: '', second: '', grade: '' };
                          return (
                            <tr key={student.record_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.student_name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.signup_time}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={edit.result}
                                  onChange={(e) => handleStudentEdit(student.record_id, 'result', e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                  placeholder="分数"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={edit.second}
                                  onChange={(e) => handleStudentEdit(student.record_id, 'second', e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                  placeholder="总分"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <select
                                  value={edit.grade}
                                  onChange={(e) => handleStudentEdit(student.record_id, 'grade', e.target.value)}
                                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">请选择</option>
                                  {gradeOptions.map((grade) => (
                                    <option key={grade} value={grade}>
                                      {grade}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.teacher_invite.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {student.teacher_invite.map((teacher) => (
                                      <span
                                        key={teacher.id}
                                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                      >
                                        {teacher.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">无</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleOpenInviteModal(student.student_id)}
                                  disabled={!examData.teacher_query_list || examData.teacher_query_list.length === 0}
                                  className="inline-flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={!examData.teacher_query_list || examData.teacher_query_list.length === 0 ? '没有可邀请的老师' : '邀请老师'}
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  邀请老师
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 评语列表标签页 */}
            {activeTab === 'evaluates' && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学生姓名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          老师姓名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          评语标题
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          评语内容
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          是否导师
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {evaluateList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            暂无评语
                          </td>
                        </tr>
                      ) : (
                        evaluateList.map((item) => (
                          <tr key={item.record_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.student_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.teacher_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.evaluate_title}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.evaluate || <span className="text-gray-400">暂无</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.is_mentor}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  setDeleteEvaluateId(item.record_id);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                删除
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 邀请老师模态框 */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">邀请老师添加评语</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择老师</label>
                  <select
                    value={inviteTeacherId}
                    onChange={(e) => setInviteTeacherId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {examData.teacher_query_list.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学年</label>
                  <select
                    value={inviteSchoolYear}
                    onChange={(e) => setInviteSchoolYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {examData.school_year_list.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学期</label>
                  <select
                    value={inviteSemester}
                    onChange={(e) => setInviteSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {examData.semester_list.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveInvite}
                  disabled={inviteSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                  <p className="mt-2 text-sm text-gray-500">确定要删除这条评语吗？此操作不可恢复。</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteEvaluate}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 显示列表页
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="mt-2 text-sm text-gray-600">查看和管理考试成绩</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索考试名称..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="清空搜索"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-600 flex items-center">
                显示 {filteredExamList.length} 条
                {searchTerm.trim() ? `（共 ${examList.length} 条）` : ''}
              </div>
            </div>
            
            <button
              onClick={loadListData}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              刷新
            </button>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {listLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExamList.map((exam) => (
                    <tr key={exam.exam_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {exam.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.type_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.period_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(exam.exam_id)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <EyeIcon className="h-5 w-5 mr-1" />
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExamList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm.trim() ? '未找到匹配的考试' : '暂无数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

