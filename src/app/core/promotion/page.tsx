'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OPERATION_RIGHTS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getMentorPromotionRecord,
  addMentorPromotionRecord,
  deleteMentorPromotionRecord,
  completeMentorPromotion,
  downloadMentorRecommendation,
  getMentorPromotionSelect,
  getTeacherEffectiveClassHours,
  type MentorPromotionRecord,
  type AddMentorPromotionRecordParams,
} from '@/services/auth';

export default function PromotionPage() {
  const { user } = useAuth();
  const isCoreUser = Number((user as any)?.core_user) === 1 || (user as any)?.core_user === true;
  const operationRights = Array.isArray(user?.operation_right) ? user.operation_right : [];
  const mentorLeader = (user as any)?.mentor_leader === true || (user as any)?.mentor_leader === 1;

  // 检查导师晋升编辑权限：core_user 或 operation_right=10
  const canEditMentorPromotion = isCoreUser || operationRights.includes(OPERATION_RIGHTS.MENTOR_PROMOTION);
  // 检查查看导师晋升记录权限：core_user 或 operation_right=10 或 mentor_leader
  const canViewMentorRecord = isCoreUser || operationRights.includes(OPERATION_RIGHTS.MENTOR_PROMOTION) || mentorLeader;

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 导师晋升相关状态
  const [mentorRecords, setMentorRecords] = useState<MentorPromotionRecord[]>([]);
  const [mentorSelectOptions, setMentorSelectOptions] = useState<Record<string, Array<{ value: string | number; label: string }>>>({});
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [mentorFormData, setMentorFormData] = useState<AddMentorPromotionRecordParams & { query_date?: string }>({
    staff_id: 0,
    staff_effect_date: '',
    teacher_effect_date: '',
    level: '',
    staff_next_level: '',
    teacher_cur_level: '',
    teacher_next_level: '',
    promote_1: '',
    promote_2: '',
    promote_3: '',
    promote_4: '',
    teacher_hours: '',
    promote_staff: 0,
    query_date: '',
  });
  const [showDeleteMentorModal, setShowDeleteMentorModal] = useState(false);
  const [deleteMentorRecordId, setDeleteMentorRecordId] = useState<number | null>(null);
  const [downloadingMentorId, setDownloadingMentorId] = useState<number | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 加载数据
  useEffect(() => {
    if (canViewMentorRecord) {
      loadMentorRecords();
      loadMentorSelectOptions();
    }
  }, [canViewMentorRecord]);

  // 自动获取课时
  useEffect(() => {
    const fetchHours = async () => {
      if (mentorFormData.staff_id && mentorFormData.query_date) {
        try {
          const result = await getTeacherEffectiveClassHours(mentorFormData.staff_id, mentorFormData.query_date);
          if (result.code === 200 && result.data) {
            // The API returns a string like "120.5小时" or just a number/string. 
            // Based on previous view of core_record.py: result = str(round(all_time / 3600, 2)) + "小时"
            // We should probably just display what is returned.
            // But wait, the interface says `effective_hours: number`. 
            // Let's check the backend response again. 
            // Backend: return return_json(result) where result is string "XX小时".
            // Frontend interface `TeacherEffectiveClassHoursResponse` has `effective_hours: number`.
            // This is a mismatch. I should treat it as string or any for now to be safe.
            // Actually, let's just use the result directly as string.
            setMentorFormData(prev => ({ ...prev, teacher_hours: String(result.data) }));
          }
        } catch (error) {
          console.error('获取课时失败:', error);
        }
      }
    };

    fetchHours();
  }, [mentorFormData.staff_id, mentorFormData.query_date]);

  const loadMentorSelectOptions = async () => {
    try {
      const result = await getMentorPromotionSelect();
      if (result.code === 200 && result.data) {
        const data = result.data as any;
        const options: Record<string, Array<{ value: string | number; label: string }>> = {};

        // Transform staff_list
        if (Array.isArray(data.staff_list)) {
          options.staff_list = data.staff_list.flatMap((item: any) =>
            Object.entries(item).map(([key, value]) => ({ value: key, label: String(value) }))
          );
        }

        // Transform teacher_level_list and mentor_level_list
        if (Array.isArray(data.teacher_level_list)) {
          options.teacher_level_list = data.teacher_level_list.map((item: string) => ({ value: item, label: item }));
        }
        if (Array.isArray(data.mentor_level_list)) {
          options.mentor_level_list = data.mentor_level_list.map((item: string) => ({ value: item, label: item }));
        }

        // Transform effect_dict
        if (data.effect_dict) {
          options.effect_dict = Object.entries(data.effect_dict).map(([key, value]) => ({ value: key, label: String(value) }));
        }

        setMentorSelectOptions(options);
      }
    } catch (error) {
      console.error('加载select选项失败:', error);
    }
  };

  const loadMentorRecords = async () => {
    setLoading(true);
    try {
      const result = await getMentorPromotionRecord();
      if (result.code === 200 && result.data) {
        setMentorRecords(result.data.rows || []);
      }
    } catch (error) {
      console.error('加载导师晋升记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 权限检查
  if (!canViewMentorRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看导师晋升</p>
        </div>
      </div>
    );
  }

  // 搜索过滤
  const filteredMentorRecords = mentorRecords.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      String(record.staff_name || '').toLowerCase().includes(searchLower) ||
      String(record.staff_id || '').includes(searchLower)
    );
  });

  // 分页计算
  const totalItems = filteredMentorRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredMentorRecords.slice(startIndex, endIndex);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 导师晋升相关操作
  const handleAddMentorRecord = async () => {
    if (!mentorFormData.staff_id) {
      alert('请选择导师');
      return;
    }

    try {
      const result = await addMentorPromotionRecord(mentorFormData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddMentorModal(false);
        setMentorFormData({
          staff_id: 0,
          staff_effect_date: '',
          teacher_effect_date: '',
          level: '',
          staff_next_level: '',
          teacher_cur_level: '',
          teacher_next_level: '',
          promote_1: '',
          promote_2: '',
          promote_3: '',
          promote_4: '',
          teacher_hours: '',
          promote_staff: 0,
          query_date: '',
        });
        loadMentorRecords();
      } else {
        alert(result.message || '添加失败');
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    }
  };

  const handleDeleteMentorRecord = async () => {
    if (!deleteMentorRecordId) return;

    try {
      const result = await deleteMentorPromotionRecord({ record_id: deleteMentorRecordId });
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteMentorModal(false);
        setDeleteMentorRecordId(null);
        loadMentorRecords();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleCompleteMentorPromotion = async (recordId: number) => {
    if (!confirm('确定要完结此晋升记录吗？')) return;

    try {
      const result = await completeMentorPromotion({ record_id: recordId });
      if (result.code === 200) {
        alert('完结成功');
        loadMentorRecords();
      } else {
        alert(result.message || '完结失败');
      }
    } catch (error) {
      console.error('完结失败:', error);
      alert('完结失败');
    }
  };

  const handleDownloadMentorRecommendation = async (recordId: number, type: '1' | '2') => {
    setDownloadingMentorId(recordId);
    try {
      await downloadMentorRecommendation({ record_id: recordId, type });
      // 下载成功提示（如果需要）
    } catch (error) {
      console.error('下载失败:', error);
      alert(error instanceof Error ? error.message : '下载失败');
    } finally {
      setDownloadingMentorId(null);
    }
  };

  // 生成页码按钮
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPages = 7;

    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">导师晋升</h1>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:w-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索教师姓名或ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {canEditMentorPromotion && (
              <button
                onClick={() => setShowAddMentorModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                新增记录
              </button>
            )}
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        导师当前职级
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        导师晋升职级
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        教师当前职级
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        教师晋升职级
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        授课时长(小时)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        导师晋升生效时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        教师晋升生效时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        评价人
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        评价内容
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建人
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                          暂无数据
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((record) => (
                        <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.staff_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.staff_next_level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.teacher_level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.teacher_next_level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.teacher_hours}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.staff_effect_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.teacher_effect_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.promote_staff_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={record.comment}>
                            {record.comment}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.create_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {canEditMentorPromotion && (
                                <>
                                  {record.status === 0 && (
                                    <button
                                      onClick={() => handleCompleteMentorPromotion(record.record_id)}
                                      className="text-green-600 hover:text-green-900 text-xs"
                                    >
                                      完结
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDownloadMentorRecommendation(record.record_id, '1')}
                                    disabled={downloadingMentorId === record.record_id}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-xs"
                                  >
                                    导师推荐表
                                  </button>
                                  <button
                                    onClick={() => handleDownloadMentorRecommendation(record.record_id, '2')}
                                    disabled={downloadingMentorId === record.record_id}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-xs"
                                  >
                                    教师推荐表
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteMentorRecordId(record.record_id);
                                      setShowDeleteMentorModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                  >
                                    删除
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页组件 */}
              {totalPages > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <div className="flex items-center gap-1">
                        {renderPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${page === currentPage
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : page === '...'
                                ? 'bg-white border-transparent text-gray-400 cursor-default'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 新增导师晋升记录模态框 */}
      {showAddMentorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">新增导师晋升记录</h3>
              <button
                onClick={() => {
                  setShowAddMentorModal(false);
                  setMentorFormData({
                    staff_id: 0,
                    staff_effect_date: '',
                    teacher_effect_date: '',
                    level: '',
                    staff_next_level: '',
                    teacher_cur_level: '',
                    teacher_next_level: '',
                    promote_1: '',
                    promote_2: '',
                    promote_3: '',
                    promote_4: '',
                    teacher_hours: '',
                    promote_staff: 0,
                    query_date: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">导师名称</label>
                <select
                  value={mentorFormData.staff_id}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, staff_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>请选择导师</option>
                  {mentorSelectOptions.staff_list?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">导师晋升生效年月</label>
                <select
                  value={mentorFormData.staff_effect_date}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, staff_effect_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {mentorSelectOptions.effect_dict?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">教师晋升生效年月</label>
                <select
                  value={mentorFormData.teacher_effect_date}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, teacher_effect_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {mentorSelectOptions.effect_dict?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">当前职级</label>
                <select
                  value={mentorFormData.level}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {mentorSelectOptions.mentor_level_list?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">晋升职级</label>
                <select
                  value={mentorFormData.staff_next_level}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, staff_next_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {mentorSelectOptions.mentor_level_list?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">当前教师职级</label>
                <select
                  value={mentorFormData.teacher_cur_level}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, teacher_cur_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {mentorSelectOptions.teacher_level_list?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">晋升后教师职级</label>
                <select
                  value={mentorFormData.teacher_next_level}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, teacher_next_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {mentorSelectOptions.teacher_level_list?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择截止时间</label>
                <input
                  type="date"
                  value={mentorFormData.query_date}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, query_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">累计有效课时数</label>
                <input
                  type="text"
                  value={mentorFormData.teacher_hours}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  placeholder="选择导师和截止时间后自动获取"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">近两年考核成绩1</label>
                <input
                  type="text"
                  value={mentorFormData.promote_1}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, promote_1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">近两年考核成绩2</label>
                <input
                  type="text"
                  value={mentorFormData.promote_2}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, promote_2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">近两年考核成绩3</label>
                <input
                  type="text"
                  value={mentorFormData.promote_3}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, promote_3: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">近两年考核成绩4</label>
                <input
                  type="text"
                  value={mentorFormData.promote_4}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, promote_4: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择评价导师名称</label>
                <select
                  value={mentorFormData.promote_staff}
                  onChange={(e) => setMentorFormData({ ...mentorFormData, promote_staff: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>请选择评价导师</option>
                  {mentorSelectOptions.staff_list?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddMentorModal(false);
                  setMentorFormData({
                    staff_id: 0,
                    staff_effect_date: '',
                    teacher_effect_date: '',
                    level: '',
                    staff_next_level: '',
                    teacher_cur_level: '',
                    teacher_next_level: '',
                    promote_1: '',
                    promote_2: '',
                    promote_3: '',
                    promote_4: '',
                    teacher_hours: '',
                    promote_staff: 0,
                    query_date: '',
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleAddMentorRecord}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除导师晋升记录确认模态框 */}
      {showDeleteMentorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">确定要删除此晋升记录吗？此操作不可撤销。</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowDeleteMentorModal(false);
                  setDeleteMentorRecordId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteMentorRecord}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
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
