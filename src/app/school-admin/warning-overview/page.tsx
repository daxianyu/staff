'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  getWarningList,
  getWarningSelect,
  addWarning,
  editWarning,
  deleteWarning,
  type WarningRecord,
  type StudentOption,
  type AddWarningRequest,
  type EditWarningRequest,
} from '@/services/auth';

export default function WarningOverviewPage() {
  const { hasPermission } = useAuth();
  const [warnings, setWarnings] = useState<WarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<WarningRecord | null>(null);
  
  // 选项数据
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [oralWarnOptions, setOralWarnOptions] = useState<Record<string, string>>({});
  const [writeWarnOptions, setWriteWarnOptions] = useState<Record<string, string>>({});
  
  // 表单数据
  const [formData, setFormData] = useState({
    student_id: 0,
    warn_type: 1,
    warn_select: '',
    warn_reason: '',
    warn_time: new Date().toISOString().split('T')[0],
  });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 权限检查
  const canView = true; // 所有staff都可以查看
  const canEdit = hasPermission(PERMISSIONS.EDIT_WARNING_OVERVIEW);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [warningResponse, selectResponse] = await Promise.all([
        getWarningList(),
        getWarningSelect(),
      ]);

      if (warningResponse.code === 200 && warningResponse.data) {
        setWarnings(warningResponse.data.rows);
      }

      if (selectResponse.code === 200 && selectResponse.data) {
        setStudentOptions(selectResponse.data.student_list);
        setOralWarnOptions(selectResponse.data.oral_warn_select);
        setWriteWarnOptions(selectResponse.data.write_warn_select);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 所有staff都可以查看，直接加载数据
    loadData();
  }, []);

  // 过滤数据
  const filteredWarnings = warnings.filter(warning =>
    warning.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warning.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warning.warn_reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalItems = filteredWarnings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedWarnings = filteredWarnings.slice(startIndex, endIndex);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 处理新增
  const handleAdd = () => {
    setFormData({
      student_id: 0,
      warn_type: 1,
      warn_select: '',
      warn_reason: '',
      warn_time: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  // 处理编辑
  const handleEdit = (warning: WarningRecord) => {
    setSelectedWarning(warning);
    setFormData({
      student_id: warning.student_id,
      warn_type: warning.warn_type,
      warn_select: warning.warn_select,
      warn_reason: warning.warn_reason,
      warn_time: warning.warn_time,
    });
    setShowEditModal(true);
  };

  // 处理删除
  const handleDelete = (warning: WarningRecord) => {
    setSelectedWarning(warning);
    setShowDeleteModal(true);
  };

  // 提交新增
  const handleSubmitAdd = async () => {
    if (!formData.student_id || !formData.warn_select || !formData.warn_reason) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await addWarning(formData as AddWarningRequest);
      if (response.code === 200) {
        setShowAddModal(false);
        loadData();
      } else {
        alert(response.message || '新增失败');
      }
    } catch (error) {
      console.error('新增警告失败:', error);
      alert('新增失败');
    }
  };

  // 提交编辑
  const handleSubmitEdit = async () => {
    if (!selectedWarning || !formData.warn_select || !formData.warn_reason) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await editWarning({
        record_id: selectedWarning.record_id,
        ...formData,
      } as EditWarningRequest);
      
      if (response.code === 200) {
        setShowEditModal(false);
        loadData();
      } else {
        alert(response.message || '编辑失败');
      }
    } catch (error) {
      console.error('编辑警告失败:', error);
      alert('编辑失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedWarning) return;

    try {
      const response = await deleteWarning(selectedWarning.record_id);
      if (response.code === 200) {
        setShowDeleteModal(false);
        loadData();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除警告失败:', error);
      alert('删除失败');
    }
  };

  // 处理警告选择变化
  const handleWarnSelectChange = (value: string) => {
    const currentSelections = formData.warn_select ? formData.warn_select.split(',') : [];
    const newSelections = currentSelections.includes(value)
      ? currentSelections.filter(item => item !== value)
      : [...currentSelections, value];
    
    setFormData(prev => ({
      ...prev,
      warn_select: newSelections.join(',')
    }));
  };

  // 移除权限检查，所有staff都可以查看

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">警告管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理学生警告信息</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索学生姓名、校区或警告原因..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {canEdit && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                新增警告
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
                        学生
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        校区
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        警告类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        警告原因
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        其他原因说明
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作人员
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        记录提交时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        更新时间
                      </th>
                      {canEdit && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedWarnings.map((warning) => (
                      <tr key={warning.record_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{warning.student_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{warning.campus_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            warning.warn_type === 1 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {warning.warn_type_str}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {warning.warn_select_str}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {warning.warn_reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {warning.warn_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {warning.operator_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {warning.create_time || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {warning.update_time || '-'}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {warning.can_edit === 1 && (
                                <>
                                  <button
                                    onClick={() => handleEdit(warning)}
                                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(warning)}
                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页组件 */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">每页显示:</label>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
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
                              onClick={() => setCurrentPage(pageNum)}
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
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 新增模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">新增警告</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, student_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>请选择学生</option>
                    {studentOptions.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告类型</label>
                  <select
                    value={formData.warn_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, warn_type: Number(e.target.value), warn_select: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>口头警告</option>
                    <option value={2}>书面警告</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告内容</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(formData.warn_type === 1 ? oralWarnOptions : writeWarnOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.warn_select.split(',').includes(key)}
                          onChange={() => handleWarnSelectChange(key)}
                          className="mr-2"
                        />
                        <span className="text-sm">{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告原因</label>
                  <textarea
                    value={formData.warn_reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, warn_reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入警告原因"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告时间</label>
                  <input
                    type="date"
                    value={formData.warn_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, warn_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitAdd}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑模态框 */}
        {showEditModal && selectedWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">编辑警告</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生</label>
                  <input
                    type="text"
                    value={selectedWarning.student_name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告类型</label>
                  <select
                    value={formData.warn_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, warn_type: Number(e.target.value), warn_select: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>口头警告</option>
                    <option value={2}>书面警告</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告内容</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(formData.warn_type === 1 ? oralWarnOptions : writeWarnOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.warn_select.split(',').includes(key)}
                          onChange={() => handleWarnSelectChange(key)}
                          className="mr-2"
                        />
                        <span className="text-sm">{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告原因</label>
                  <textarea
                    value={formData.warn_reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, warn_reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入警告原因"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">警告时间</label>
                  <input
                    type="date"
                    value={formData.warn_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, warn_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      删除警告
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要删除学生 <span className="font-medium">{selectedWarning.student_name}</span> 的警告记录吗？此操作无法撤销。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleConfirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  删除
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
