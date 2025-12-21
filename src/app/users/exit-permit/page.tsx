'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getStaffOutTable,
  updateDoorFlag,
  deleteOutRecord,
  batchAddOutRecord,
  updateStudentOutInfo,
  openDoor,
  getStaffOutSelect,
  type ExitPermitItem,
  type ExitPermitResponse
} from '@/services/auth';
import {
  PlusIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

export default function ExitPermitPage() {
  const { user, hasPermission } = useAuth();
  const [allRows, setAllRows] = useState<ExitPermitItem[]>([]);
  const [data, setData] = useState<ExitPermitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExitPermitItem | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    student_ids: [] as number[],
  });

  // 学生选项
  const [allStudents, setAllStudents] = useState<Array<{ id: number, name: string }>>([]);
  const [liveStudents, setLiveStudents] = useState<Array<{ id: number, name: string }>>([]);
  const [outStudents, setOutStudents] = useState<Array<{ id: number, name: string }>>([]);
  const [studentListType, setStudentListType] = useState<'all' | 'live' | 'out'>('live');
  const [studentOptions, setStudentOptions] = useState<Array<{ id: number, name: string }>>([]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const canView = hasPermission(PERMISSIONS.VIEW_EXIT_PERMIT);
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXIT_PERMIT);

  useEffect(() => {
    if (canView) {
      loadData();
      loadStudentOptions();
    }
  }, [canView]);

  // 学生筛选选项（用于表格筛选）
  const studentFilterOptions = useMemo(() => {
    const base = [{ id: '', name: '全部学生' }];
    const opts = (allStudents || []).map(s => ({ id: String(s.id), name: s.name }));
    return base.concat(opts);
  }, [allStudents]);

  // 加载学生选择数据
  const loadStudentOptions = async () => {
    try {
      const result = await getStaffOutSelect();
      if (result.code === 200 && result.data) {
        setAllStudents(result.data.all_students || []);
        setLiveStudents(result.data.live_students || []);
        setOutStudents(result.data.out_student || []);
        
        // 默认使用住宿学生列表
        setStudentOptions(result.data.live_students || []);
      } else {
        console.error('加载学生数据失败:', result.message);
      }
    } catch (error) {
      console.error('加载学生数据失败:', error);
    }
  };

  const applyFiltersAndPaginate = (
    rows: ExitPermitItem[],
    page: number,
    size: number
  ) => {
    const filtered = selectedStudentId
      ? rows.filter(r => String(r.student_id) === selectedStudentId)
      : rows;

    const total = filtered.length;
    const pages = Math.ceil(total / size);
    const safeTotalPages = pages > 0 ? pages : 1;
    const safePage = Math.min(Math.max(1, page), safeTotalPages);

    setTotalItems(total);
    setTotalPages(pages);
    setCurrentPage(safePage);

    const startIndex = (safePage - 1) * size;
    const endIndex = startIndex + size;
    setData(filtered.slice(startIndex, endIndex));
  };

  const loadData = async (page?: number, newPageSize?: number) => {
    setLoading(true);
    try {
      const result = await getStaffOutTable();
      if (result.code === 200) {
        const rows = result.data?.rows || [];
        setAllRows(rows);
        applyFiltersAndPaginate(rows, page || currentPage, newPageSize || pageSize);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !canEdit) return;

    try {
      const result = await deleteOutRecord(selectedRecord.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedRecord(null);
        loadData(currentPage, pageSize);
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleBatchAdd = async () => {
    if (!canEdit) return;

    try {
      const result = await batchAddOutRecord({
        ...formData,
        student_ids: formData.student_ids.join(',')
      });
      if (result.code === 200) {
        alert('批量添加成功');
        setShowAddModal(false);
        setFormData({ start_time: '', end_time: '', student_ids: [] });
        loadData(1, pageSize); // 添加成功后回到第一页
      } else {
        alert(result.message || '批量添加失败');
      }
    } catch (error) {
      console.error('批量添加失败:', error);
      alert('批量添加失败');
    }
  };

  const handleStatusChange = async (record: ExitPermitItem, status: number) => {
    if (!canEdit) return;

    try {
      const result = await updateStudentOutInfo({
        record_id: record.record_id,
        status: status
      });

      if (result.code === 200) {
        alert('状态更新成功');
        loadData(currentPage, pageSize);
      } else {
        alert(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      alert('状态更新失败');
    }
  };

  // 分页处理函数
  const handlePageChange = async (page: number) => {
    applyFiltersAndPaginate(allRows, page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    applyFiltersAndPaginate(allRows, 1, newPageSize);
  };

  // 表格学生筛选：切换后自动回到第一页
  useEffect(() => {
    applyFiltersAndPaginate(allRows, 1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  // 处理学生列表类型变化
  const handleStudentListTypeChange = (type: 'all' | 'live' | 'out') => {
    setStudentListType(type);
    setFormData(prev => ({ ...prev, student_ids: [] })); // 清空已选择的学生
    
    switch (type) {
      case 'all':
        setStudentOptions(allStudents);
        break;
      case 'live':
        setStudentOptions(liveStudents);
        break;
      case 'out':
        setStudentOptions(outStudents);
        break;
    }
  };

  // 全选当前列表的所有学生
  const handleSelectAll = () => {
    const allIds = studentOptions.map(student => student.id);
    setFormData(prev => ({ ...prev, student_ids: allIds }));
  };

  // 取消全选
  const handleDeselectAll = () => {
    setFormData(prev => ({ ...prev, student_ids: [] }));
  };


  // 直接开门处理函数
  const handleDirectOpenDoor = async () => {
    if (!canEdit) return;

    try {
      const result = await openDoor({
        record_id: -2, // 使用-2表示直接开门（走读生模式）
        open_door_status: 1
      });

      if (result.code === 200) {
        alert(result.data || '门即将打开，外出注意安全!');
      } else {
        alert(result.message || '开门失败');
      }
    } catch (error) {
      console.error('开门失败:', error);
      alert('开门失败');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800'; // 审批中
      case 1: return 'bg-green-100 text-green-800'; // 通过
      case 2: return 'bg-red-100 text-red-800'; // 拒绝
      case 3: return 'bg-blue-100 text-blue-800'; // 已开门
      case 4: return 'bg-orange-100 text-orange-800'; // 导师撤回
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return '审批中';
      case 1: return '通过';
      case 2: return '拒绝';
      case 3: return '已开门';
      case 4: return '导师撤回';
      default: return '未知';
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exit Permit</h1>
              <p className="text-gray-600 mt-1">外出申请管理</p>
            </div>
            {canEdit && (
              <button
                onClick={handleDirectOpenDoor}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <KeyIcon className="h-4 w-4" />
                开门
              </button>
            )}
          </div>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="w-full sm:w-[260px]">
              <SearchableSelect<string>
                options={studentFilterOptions}
                value={selectedStudentId}
                onValueChange={(v) => setSelectedStudentId(String(v))}
                placeholder="筛选学生"
                searchPlaceholder="搜索学生姓名..."
                className="w-full"
                disabled={loading}
              />
            </div>

            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center"
              >
                <PlusIcon className="h-4 w-4" />
                批量添加
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
            <div className="w-full overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      序号
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生名称
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      外出原因
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      当前状态
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      外出开始时间
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      外出结束时间
                    </th>
                    <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新时间
                    </th>
                    {canEdit && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={item.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-4 text-sm text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate max-w-[120px]" title={item.student_name}>
                        {item.student_name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate max-w-[150px]" title={item.note || '-'}>
                        {item.note || '-'}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status_name}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate max-w-[140px]" title={item.start_time}>
                        {item.start_time}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate max-w-[140px]" title={item.end_time}>
                        {item.end_time}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-4 text-sm text-gray-500 truncate max-w-[140px]" title={item.create_time}>
                        {item.create_time}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-4 text-sm text-gray-500 truncate max-w-[140px]" title={item.update_time || '-'}>
                        {item.update_time || '-'}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* 只有审批中状态才显示通过/拒绝按钮 */}
                            {item.status === 0 && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(item, 1)}
                                  className="text-green-600 hover:text-green-900 text-xs px-3 py-2 rounded-md min-h-[32px] min-w-[44px] flex items-center justify-center"
                                >
                                  通过
                                </button>
                                <button
                                  onClick={() => handleStatusChange(item, 2)}
                                  className="text-red-600 hover:text-red-900 text-xs px-3 py-2 rounded-md min-h-[32px] min-w-[44px] flex items-center justify-center"
                                >
                                  拒绝
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedRecord(item);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 text-xs px-3 py-2 rounded-md min-h-[32px] min-w-[44px] flex items-center justify-center"
                            >
                              删除
                            </button>
                            {/* 只有通过状态才显示撤回按钮 */}
                            {item.status === 1 && (
                              <button
                                onClick={() => handleStatusChange(item, 4)}
                                className="text-orange-600 hover:text-orange-900 text-xs px-3 py-2 rounded-md min-h-[32px] min-w-[44px] flex items-center justify-center"
                              >
                                撤回
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条记录
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[60px]"
                  >
                    上一页
                  </button>

                  {/* 页码按钮 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-medium border rounded ${currentPage === pageNum
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {totalPages > 7 && currentPage < totalPages - 3 && (
                      <>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="w-10 h-10 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[60px]"
                  >
                    下一页
                  </button>
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[40px]"
                >
                  <option value={50}>50条/页</option>
                  <option value={100}>100条/页</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 批量添加模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">批量添加外出申请</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 -m-2"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* 时间选择 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                  </div>
                </div>

                {/* 学生列表类型选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    学生列表类型
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="student_list_type"
                        value="all"
                        checked={studentListType === 'all'}
                        onChange={(e) => handleStudentListTypeChange(e.target.value as 'all' | 'live' | 'out')}
                        className="mr-3 h-4 w-4"
                      />
                      <span className="text-sm">全部学生 ({allStudents.length} 人)</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="student_list_type"
                        value="live"
                        checked={studentListType === 'live'}
                        onChange={(e) => handleStudentListTypeChange(e.target.value as 'all' | 'live' | 'out')}
                        className="mr-3 h-4 w-4"
                      />
                      <span className="text-sm">住宿学生 ({liveStudents.length} 人)</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="student_list_type"
                        value="out"
                        checked={studentListType === 'out'}
                        onChange={(e) => handleStudentListTypeChange(e.target.value as 'all' | 'live' | 'out')}
                        className="mr-3 h-4 w-4"
                      />
                      <span className="text-sm">外出学生 ({outStudents.length} 人)</span>
                    </label>
                  </div>
                </div>

                {/* 学生选择 */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      选择学生 ({studentOptions.length} 人可选)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={studentOptions.length === 0}
                        className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={formData.student_ids.length === 0}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                      >
                        取消全选
                      </button>
                    </div>
                  </div>
                  <SearchableSelect
                    options={studentOptions}
                    value={formData.student_ids}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, student_ids: value as number[] }))}
                    placeholder="请选择学生..."
                    searchPlaceholder="搜索学生姓名..."
                    multiple={true}
                    className="w-full"
                  />
                  {formData.student_ids.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      已选择 {formData.student_ids.length} 名学生
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 min-h-[44px]"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchAdd}
                  disabled={!formData.start_time || !formData.end_time || formData.student_ids.length === 0}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      删除外出申请
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要删除学生 <strong>{selectedRecord.student_name}</strong> 的外出申请吗？此操作无法撤销。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm min-h-[44px]"
                >
                  删除
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedRecord(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm min-h-[44px]"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}