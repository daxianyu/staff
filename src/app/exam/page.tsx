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
  getAuthHeader,
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
  CurrencyDollarIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

export default function ExamPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);

  // 考试期间和类型常量
  const EXAM_PERIODS_DICT = {
    0: "Summer",
    1: "Winter",
    2: "Spring",
  };

  const EXAM_TYPES = {
    0: "Edexcel",
    1: "CIE",
    2: "AQA",
    4: "PHY",
    3: "OTHER",
  };

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
  const [filterPeriod, setFilterPeriod] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<number | ''>('');
  const [showDisabled, setShowDisabled] = useState(false);
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
    action: () => { },
  });

  // Tab状态管理
  const [activeTab, setActiveTab] = useState<'exams' | 'firstFee'>('exams');

  // 首次费用报名数据
  const [innerFirstFee, setInnerFirstFee] = useState<any[]>([]);
  const [outsideFirstFee, setOutsideFirstFee] = useState<any[]>([]);
  const [canDownload, setCanDownload] = useState<number>(0);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 每页显示10条记录
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await getExamList();
      if (resp.status === 200) {
        setExams(resp.data.active || []);
        setDisabledExams(resp.data.disabled || []);
        setInnerFirstFee(resp.data.inner_first_fee || []);
        setOutsideFirstFee(resp.data.outside_first_fee || []);
        setCanDownload(resp.data.can_download || 0);
        // 计算总记录数
        setTotalRecords((resp.data.inner_first_fee || []).length + (resp.data.outside_first_fee || []).length);
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.exam-action-dropdown')) {
        setOpenDropdown(null);
      }
    };
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

  const handleEdit = (id: number) => {
    router.push(`/exam/edit?id=${id}`);
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

  // 处理下载报名信息
  const handleDownload = async (examType: string) => {
    try {
      const response = await fetch(`/api/exam/download_exam_signup_info/${examType}`, {
        method: 'GET',
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 0 && data.data?.file_url) {
          // 创建下载链接
          const link = document.createElement('a');
          link.href = data.data.file_url;
          link.download = `exam_signup_${examType}_${Date.now()}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          setError(data.message || '下载失败');
        }
      } else {
        setError('下载请求失败');
      }
    } catch (error) {
      console.error('下载异常:', error);
      setError('下载失败，请重试');
    }
  };

  // 分页相关计算函数
  const getPaginatedData = () => {
    const allData = [
      ...innerFirstFee.map(item => ({ ...item, type: 'inner' })),
      ...outsideFirstFee.map(item => ({ ...item, type: 'outside' }))
    ];

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: allData.slice(startIndex, endIndex),
      total: allData.length,
      totalPages: Math.ceil(allData.length / pageSize)
    };
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Tab切换处理
  const handleTabChange = (tab: 'exams' | 'firstFee') => {
    setActiveTab(tab);
    if (tab === 'firstFee') {
      setCurrentPage(1); // 切换到首次费用tab时重置页码
    }
  };

  // 过滤考试列表
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriod = filterPeriod === '' || exam.period === filterPeriod;
    const matchesType = filterType === '' || exam.type === filterType;

    return matchesSearch && matchesPeriod && matchesType;
  });

  const filteredDisabledExams = disabledExams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriod = filterPeriod === '' || exam.period === filterPeriod;
    const matchesType = filterType === '' || exam.type === filterType;

    return matchesSearch && matchesPeriod && matchesType;
  });

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

        {/* Tab导航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('exams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'exams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  考试管理
                </div>
              </button>
              <button
                onClick={() => handleTabChange('firstFee')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'firstFee'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5" />
                  首次费用报名记录
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {totalRecords}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab内容 */}
        {activeTab === 'exams' && (
          <>
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

                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Periods</option>
                    <option value={0}>Summer</option>
                    <option value={1}>Winter</option>
                    <option value={2}>Spring</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value === '' ? '' : Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value={0}>Edexcel</option>
                    <option value={1}>CIE</option>
                    <option value={2}>AQA</option>
                    <option value={4}>PHY</option>
                    <option value={3}>OTHER</option>
                  </select>

                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={showDisabled}
                      onChange={(e) => setShowDisabled(e.target.checked)}
                    />
                    <span className="ml-2">Show disabled</span>
                  </label>
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

            {/* Active Exams */}
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
                <div className="w-full">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Exam</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Code</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Subject</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Period</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Time</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Location</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Price</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.name}</td>
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.code}</td>
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">{EXAM_TYPES[exam.type as keyof typeof EXAM_TYPES] ?? '-'}</td>
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.topic ?? '-'}</td>
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">{EXAM_PERIODS_DICT[exam.period as keyof typeof EXAM_PERIODS_DICT] ?? '-'}</td>
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">
                            {exam.time ? new Date(Number(exam.time) * 1000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.location}</td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="text-green-600 mr-1">¥</span>
                              <span>{exam.price}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(exam.id)}
                                className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                title="Edit Exam"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <div className="relative exam-action-dropdown">
                                <button
                                  onClick={() => setOpenDropdown(openDropdown === exam.id ? null : exam.id)}
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

            {/* Disabled Exams */}
            {showDisabled && (
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
                    <table className="w-full divide-y divide-gray-200 table-fixed">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Exam</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Code</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Type</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Subject</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Period</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Time</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Location</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Price</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Alipay Account</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDisabledExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-gray-50 transition-colors opacity-75">
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.name}</td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.code}</td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.type ?? '-'}</td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.topic ?? '-'}</td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{['Summer', 'Winter', 'Spring'][exam.period ?? 0]}</td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">
                              {exam.time ? new Date(Number(exam.time) * 1000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.location}</td>
                            <td className="px-3 py-4 text-sm text-gray-900">
                              <div className="flex items-center">
                                <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
                                <span>{exam.price}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 break-words">{exam.alipay_account ?? '-'}</td>
                            <td className="px-3 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleEdit(exam.id)}
                                  className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                  title="Edit Exam"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <div className="relative exam-action-dropdown">
                                  <button
                                    onClick={() => setOpenDropdown(openDropdown === exam.id ? null : exam.id)}
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

            </>
          )}

        {/* 首次费用报名记录Tab内容 */}
        {activeTab === 'firstFee' && (
          <>
            {/* 首次费用报名信息 */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">首次费用报名记录</h2>
                  </div>

                  {/* 下载按钮 */}
                  {canDownload === 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload('0')}
                        className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <TagIcon className="h-4 w-4 mr-1" />
                        下载Edexcel
                      </button>
                      <button
                        onClick={() => handleDownload('1')}
                        className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <TagIcon className="h-4 w-4 mr-1" />
                        下载CIE
                      </button>
                      <button
                        onClick={() => handleDownload('2')}
                        className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <TagIcon className="h-4 w-4 mr-1" />
                        下载AQA
                      </button>
                      <button
                        onClick={() => handleDownload('3')}
                        className="flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <TagIcon className="h-4 w-4 mr-1" />
                        下载其他
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* 分页信息和分页控件 */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    显示第 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, totalRecords)} 条，共 {totalRecords} 条记录
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-gray-700">
                      第 {currentPage} 页 / 共 {Math.ceil(totalRecords / pageSize)} 页
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(totalRecords / pageSize)}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>

                {/* 分页数据表格 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">学生ID/来源</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">学生姓名</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">报名时间</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData().data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.type === 'inner'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}>
                              {item.type === 'inner' ? '内部' : '外部'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item.type === 'inner' ? item[0] : item[0]}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item[1]}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {new Date(Number(item[2]) * 1000).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {totalRecords === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium">暂无首次费用报名记录</p>
                      <p className="text-sm">当有新的首次费用报名时，将会显示在这里</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 错误提示 - 在所有tab外部显示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Add Exam Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowAddModal(false)}></div>
              <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
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

