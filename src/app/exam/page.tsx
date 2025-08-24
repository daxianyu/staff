'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getExamList,
  addNewExam,
  updateExamStatus,
  deleteExam,
  type ExamListItem,
  type AddExamParams,
} from '@/services/auth';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExamPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [disabledExams, setDisabledExams] = useState<ExamListItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddExamParams>({
    exam_name: '',
    exam_location: '',
    exam_topic: '',
    exam_code: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    action: () => {},
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await getExamList();
      if (resp.status === 200) {
        setExams(resp.data.active || []);
        setDisabledExams(resp.data.disabled || []);
      } else {
        setError(resp.message || 'Failed to load exams');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      loadData();
    }
  }, [canEdit]);

  // 关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddExam = async () => {
    setActionLoading(true);
    const resp = await addNewExam(addForm);
    setActionLoading(false);
    if (resp.code === 200) {
      setShowAddModal(false);
      setAddForm({ exam_name: '', exam_location: '', exam_topic: '', exam_code: '' });
      loadData();
    } else {
      setError(resp.message || '添加考试失败');
    }
  };

  const handleToggleStatus = async (exam: ExamListItem, disable: boolean) => {
    setActionLoading(true);
    await updateExamStatus({ record_id: exam.id, status: disable ? 1 : 0 });
    setActionLoading(false);
    loadData();
  };

  const handleDelete = async (exam: ExamListItem) => {
    setActionLoading(true);
    await deleteExam({ record_id: exam.id });
    setActionLoading(false);
    loadData();
  };

  // 显示确认对话框
  const showConfirmDialog = (title: string, message: string, action: () => void) => {
    setConfirmAction({
      show: true,
      title,
      message,
      action,
    });
  };

  // 处理禁用/启用确认
  const handleStatusChangeConfirm = (exam: ExamListItem, disable: boolean) => {
    const action = disable ? '禁用' : '启用';
    showConfirmDialog(
      `${action}考试`,
      `确定要${action}考试 "${exam.name}" 吗？`,
      () => handleToggleStatus(exam, disable)
    );
  };

  // 处理删除确认
  const handleDeleteConfirm = (exam: ExamListItem) => {
    showConfirmDialog(
      '删除考试',
      `确定要删除考试 "${exam.name}" 吗？此操作不可撤销！`,
      () => handleDelete(exam)
    );
  };

  // 过滤考试列表
  const filteredExams = exams.filter(exam =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisabledExams = disabledExams.filter(exam =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view the exam management page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
              <p className="text-gray-600 mt-1">Manage and organize your examination schedules</p>
            </div>
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, location, or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 状态过滤器 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Exam Status:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      statusFilter === 'all'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    All Exams
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      statusFilter === 'active'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('disabled')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      statusFilter === 'disabled'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Disabled
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Exam
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Active Exams */}
        {(statusFilter === 'all' || statusFilter === 'active') && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-green-100 rounded">
                  <EyeIcon className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Active Exams</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {filteredExams.length} exams
                </span>
              </div>
            </div>

            {filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Exams</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No matching active exams found' : 'No exams are currently active'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location & Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                              <div className="text-sm text-gray-500">Code: {exam.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{exam.location}</div>
                          <div className="text-sm text-gray-500">{exam.topic}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{exam.price}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/exam/edit?id=${exam.id}`)}
                              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              title="Edit Exam"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            
                            {/* 更多操作下拉菜单 */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === exam.id ? null : exam.id);
                                }}
                                className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                title="More Actions"
                              >
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </button>
                              
                              {openDropdown === exam.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        handleStatusChangeConfirm(exam, true);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                                    >
                                      <XMarkIcon className="w-4 h-4 mr-2" />
                                      Disable Exam
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        handleDeleteConfirm(exam);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      <TrashIcon className="w-4 h-4 mr-2" />
                                      Delete Exam
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Disabled Exams */}
        {(statusFilter === 'all' || statusFilter === 'disabled') && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-red-100 rounded">
                  <XMarkIcon className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Disabled Exams</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {filteredDisabledExams.length} exams
                </span>
              </div>
            </div>

            {filteredDisabledExams.length === 0 ? (
              <div className="text-center py-12">
                <XMarkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Disabled Exams</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No matching disabled exams found' : 'No exams are currently disabled'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location & Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDisabledExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 transition-colors opacity-75">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                              <div className="text-sm text-gray-500">Code: {exam.code}</div>
                              <div className="text-xs text-red-600 mt-1">Disabled</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{exam.location}</div>
                          <div className="text-sm text-gray-500">{exam.topic}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{exam.price}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/exam/edit?id=${exam.id}`)}
                              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              title="Edit Exam"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            
                            {/* 更多操作下拉菜单 */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === exam.id ? null : exam.id);
                                }}
                                className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                title="More Actions"
                              >
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </button>
                              
                              {openDropdown === exam.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        handleStatusChangeConfirm(exam, false);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    >
                                      <CheckIcon className="w-4 h-4 mr-2" />
                                      Enable Exam
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        handleDeleteConfirm(exam);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      <TrashIcon className="w-4 h-4 mr-2" />
                                      Delete Exam
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Exam Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowAddModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <PlusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Exam
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter exam name"
                        value={addForm.exam_name}
                        onChange={(e) => setAddForm({ ...addForm, exam_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Exam location"
                          value={addForm.exam_location}
                          onChange={(e) => setAddForm({ ...addForm, exam_location: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Topic <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Exam topic"
                          value={addForm.exam_topic}
                          onChange={(e) => setAddForm({ ...addForm, exam_topic: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Unique exam code"
                        value={addForm.exam_code}
                        onChange={(e) => setAddForm({ ...addForm, exam_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddExam}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create Exam'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 确认操作对话框 */}
        {confirmAction.show && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setConfirmAction({ ...confirmAction, show: false })}></div>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {confirmAction.title}
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600">{confirmAction.message}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmAction({ ...confirmAction, show: false })}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirmAction.action();
                      setConfirmAction({ ...confirmAction, show: false });
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Confirm'
                    )}
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

