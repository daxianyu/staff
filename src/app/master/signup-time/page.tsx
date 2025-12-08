'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { ExclamationTriangleIcon, PlusIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface SignupRecord {
  record_id: number;
  campus_name: string;
  start_day: string;
  end_day: string;
}

interface SignupResponse {
  rows: SignupRecord[];
  total: number;
}

interface Campus {
  id: number;
  name: string;
  code: string;
}

export default function SignupTimePage() {
  const { hasPermission } = useAuth();
  const [signupRecords, setSignupRecords] = useState<SignupRecord[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // 新增模态框状态
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [formData, setFormData] = useState({
    campus_id: '',
    start_day: '',
    end_day: '',
  });

  // 删除确认模态框状态
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SignupRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canView = hasPermission(PERMISSIONS.VIEW_SET_SIGNUP_TIME);
  const canEdit = hasPermission(PERMISSIONS.EDIT_SET_SIGNUP_TIME);

  // 加载选课时间数据
  const loadSignupRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/signup/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 0 && data.data) {
        setSignupRecords(data.data.rows || []);
      } else {
        console.error('加载选课时间数据失败:', data.message);
      }
    } catch (error) {
      console.error('加载选课时间数据时出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载校区数据
  const loadCampuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/campus/get_all_campus', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 0 && data.data) {
        setCampuses(data.data || []);
      } else {
        console.error('加载校区数据失败:', data.message);
      }
    } catch (error) {
      console.error('加载校区数据时出错:', error);
    }
  };

  useEffect(() => {
    if (canView) {
      loadSignupRecords();
      loadCampuses();
    }
  }, [canView]);

  // 搜索过滤
  const filteredRecords = signupRecords.filter(record =>
    record.campus_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

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

  // 打开新增模态框
  const handleAdd = () => {
    setFormData({
      campus_id: '',
      start_day: '',
      end_day: '',
    });
    setAddModalOpen(true);
  };

  // 提交新增
  const handleSubmitAdd = async () => {
    if (!formData.campus_id || !formData.start_day || !formData.end_day) {
      alert('请填写所有必填字段');
      return;
    }

    if (new Date(formData.start_day) >= new Date(formData.end_day)) {
      alert('结束日期必须晚于开始日期');
      return;
    }

    try {
      setAddLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/signup/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campus_id: parseInt(formData.campus_id),
          start_day: formData.start_day,
          end_day: formData.end_day,
        }),
      });

      const data = await response.json();
      
      if (data.status === 0) {
        alert('添加成功');
        setAddModalOpen(false);
        loadSignupRecords();
      } else {
        alert(`添加失败: ${data.message}`);
      }
    } catch (error) {
      console.error('添加选课时间时出错:', error);
      alert('添加失败，请稍后重试');
    } finally {
      setAddLoading(false);
    }
  };

  // 打开删除确认模态框
  const handleDelete = (record: SignupRecord) => {
    setSelectedRecord(record);
    setDeleteModalOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/signup/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record_id: selectedRecord.record_id,
        }),
      });

      const data = await response.json();
      
      if (data.status === 0) {
        alert('删除成功');
        setDeleteModalOpen(false);
        setSelectedRecord(null);
        loadSignupRecords();
      } else {
        alert(`删除失败: ${data.message}`);
      }
    } catch (error) {
      console.error('删除选课时间时出错:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 权限检查
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有查看选课时间设置的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">选课时间设置</h1>
          <p className="text-gray-600">管理各校区的选课时间段</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                placeholder="搜索校区..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {canEdit && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                添加选课时间
              </button>
            )}
          </div>
        </div>

        {/* 选课时间列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        校区
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        开始日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        结束日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        持续天数
                      </th>
                      {canEdit && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedRecords.map((record) => {
                      const startDate = new Date(record.start_day);
                      const endDate = new Date(record.end_day);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                      return (
                        <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">
                                {record.campus_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.start_day}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.end_day}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {diffDays} 天
                            </span>
                          </td>
                          {canEdit && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDelete(record)}
                                className="inline-flex items-center w-8 h-8 rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 justify-center"
                                title="删除"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 空状态 */}
              {paginatedRecords.length === 0 && (
                <div className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">暂无选课时间记录</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={50}>50条/页</option>
                  <option value={100}>100条/页</option>
                </select>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  {/* 页码按钮 */}
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i < 5 ? i + 1 : (i === 5 ? '...' : totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = i < 2 ? (i === 0 ? 1 : '...') : totalPages - (6 - i);
                    } else {
                      if (i === 0) pageNum = 1;
                      else if (i === 1) pageNum = '...';
                      else if (i === 5) pageNum = '...';
                      else if (i === 6) pageNum = totalPages;
                      else pageNum = currentPage + (i - 3);
                    }
                    
                    if (pageNum === '...') {
                      return (
                        <span key={i} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNum as number)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增选课时间模态框 */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">添加选课时间</h3>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    校区 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.campus_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, campus_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择校区</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    开始日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_day: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    结束日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_day: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitAdd}
                  disabled={addLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? '添加中...' : '确认添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    确认删除
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除校区 "{selectedRecord.campus_name}" 的选课时间段吗？
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      时间段：{selectedRecord.start_day} 至 {selectedRecord.end_day}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      此操作无法撤销。
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? '删除中...' : '确认删除'}
                </button>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedRecord(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
