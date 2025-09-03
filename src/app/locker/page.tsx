'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getLockerList, 
  addLocker, 
  updateLocker, 
  deleteLocker, 
  unbindLocker,
  getLockerEditInfo,
  getAllCampus,
  type Locker,
  type AddLockerParams,
  type UpdateLockerParams,
  type Campus
} from '@/services/auth';
import { PERMISSIONS } from '@/types/auth';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  LinkSlashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

interface LockerEditData {
  locker_detail: Locker & {
    campus_name: string;
    student_name: string;
    status_name: string;
  };
  student_list: Array<{ id: number; name: string }>;
  campus_list: Array<{ id: number; name: string }>;
  locker_status: Array<{ id: number; name: string }>;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/50" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LockerManagementPage() {
  const { hasPermission } = useAuth();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<number | null>(null);
  const [editData, setEditData] = useState<LockerEditData | null>(null);

  // 添加表单状态
  const [addForm, setAddForm] = useState<AddLockerParams>({
    locker_name: '',
    location: '',
    campus_id: 0,
  });

  // 编辑表单状态
  const [editForm, setEditForm] = useState<UpdateLockerParams>({
    record_id: 0,
    locker_name: '',
    location: '',
    campus_id: 0,
    status: 0,
    student_id: -1,
  });

  // 权限检查
  if (!hasPermission(PERMISSIONS.VIEW_LOCKER)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">无权限访问</h1>
          <p className="text-gray-600">您没有访问Locker管理页面的权限</p>
        </div>
      </div>
    );
  }

  // 获取Locker列表
  const fetchLockers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLockerList();
      if (response.status === 200) {
        setLockers(response.data);
      } else {
        console.error('获取Locker列表失败:', response.message);
      }
    } catch (error) {
      console.error('获取Locker列表异常:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取校区列表
  const fetchCampuses = useCallback(async () => {
    try {
      const response = await getAllCampus();
      if (response.status === 200) {
        setCampusList(response.data || []);
      }
    } catch (error) {
      console.error('获取校区列表失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchLockers();
    fetchCampuses();
  }, [fetchLockers, fetchCampuses]);

  // 过滤和分页
  const filteredLockers = lockers.filter(locker => 
    locker.locker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.campus_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLockers.length / pageSize) || 1;
  const paginatedLockers = filteredLockers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 搜索变更时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // 处理添加
  const handleAdd = async () => {
    if (!addForm.locker_name.trim() || !addForm.location.trim() || !addForm.campus_id || addForm.campus_id === 0) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await addLocker(addForm);
      if (response.code === 200) {
        alert('添加成功');
        setIsAddModalOpen(false);
        setAddForm({ locker_name: '', location: '', campus_id: 0 });
        fetchLockers();
      } else {
        alert(`添加失败: ${response.message}`);
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = async (lockerId: number) => {
    try {
      const response = await getLockerEditInfo(lockerId);
      if (response.code === 200) {
        const data = response.data as LockerEditData;
        setEditData(data);
        setEditForm({
          record_id: lockerId,
          locker_name: data.locker_detail.locker_name,
          location: data.locker_detail.location,
          campus_id: data.locker_detail.campus_id,
          status: data.locker_detail.status,
          student_id: data.locker_detail.student_id,
        });
        setIsEditModalOpen(true);
      } else {
        alert(`获取编辑信息失败: ${response.message}`);
      }
    } catch (error) {
      console.error('获取编辑信息失败:', error);
      alert('获取编辑信息失败');
    }
  };

  // 处理编辑
  const handleEdit = async () => {
    if (!editForm.locker_name.trim() || !editForm.location.trim() || !editForm.campus_id || editForm.campus_id === 0) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await updateLocker(editForm);
      if (response.code === 200) {
        alert('更新成功');
        setIsEditModalOpen(false);
        setEditData(null);
        fetchLockers();
      } else {
        alert(`更新失败: ${response.message}`);
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
    }
  };

  // 处理删除
  const handleDelete = async (lockerId: number, lockerName: string) => {
    if (!confirm(`确定要删除Locker "${lockerName}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await deleteLocker({ record_id: lockerId });
      if (response.code === 200) {
        alert('删除成功');
        fetchLockers();
      } else {
        alert(`删除失败: ${response.message}`);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 处理解绑
  const handleUnbind = async (lockerId: number, lockerName: string) => {
    if (!confirm(`确定要解绑Locker "${lockerName}" 吗？`)) {
      return;
    }

    try {
      const response = await unbindLocker({ record_id: lockerId });
      if (response.code === 200) {
        alert('解绑成功');
        fetchLockers();
      } else {
        alert(`解绑失败: ${response.message}`);
      }
    } catch (error) {
      console.error('解绑失败:', error);
      alert('解绑失败');
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-green-100 text-green-800'; // 未占用
      case 1: return 'bg-blue-100 text-blue-800';   // 已占用
      case 2: return 'bg-yellow-100 text-yellow-800'; // 申请中
      case 3: return 'bg-red-100 text-red-800';     // 已禁用
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return '未占用';
      case 1: return '已占用';
      case 2: return '申请中';
      case 3: return '已禁用';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Locker管理</h1>
          <p className="mt-2 text-gray-600">管理学校储物柜信息</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索Locker名称、位置、校区或学生..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">每页显示:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="hidden md:block text-sm text-gray-600">
                显示 {(currentPage - 1) * pageSize + (filteredLockers.length ? 1 : 0)} - {Math.min(currentPage * pageSize, filteredLockers.length)} 条，共 {filteredLockers.length} 条
              </div>
            
              {hasPermission(PERMISSIONS.EDIT_LOCKER) && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  添加Locker
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Locker列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredLockers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无数据</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Locker Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated Time
                      </th>
                      {hasPermission(PERMISSIONS.EDIT_LOCKER) && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLockers.map((locker) => (
                      <tr key={locker.locker_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {locker.locker_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {locker.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {locker.campus_name || '未知校区'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {locker.student_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(locker.status)}`}>
                            {getStatusText(locker.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {locker.update_time ? new Date(locker.update_time).toLocaleString() : '-'}
                        </td>
                        {hasPermission(PERMISSIONS.EDIT_LOCKER) && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(locker.locker_id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="编辑"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              {locker.status === 1 && (
                                <button
                                  onClick={() => handleUnbind(locker.locker_id, locker.locker_name)}
                                  className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                  title="解绑"
                                >
                                  <LinkSlashIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(locker.locker_id, locker.locker_name)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="删除"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      显示第 {((currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, filteredLockers.length)} 条，共 {filteredLockers.length} 条
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      <div className="flex gap-1">
                        {/* 生成页码数组 */}
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 7; // 最多显示7个页码
                          
                          if (totalPages <= maxVisiblePages) {
                            // 如果总页数不多，显示所有页码
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // 如果总页数很多，智能显示
                            const startPage = Math.max(1, currentPage - 2);
                            const endPage = Math.min(totalPages, currentPage + 2);
                            
                            // 总是显示第一页
                            if (startPage > 1) {
                              pages.push(1);
                              if (startPage > 2) {
                                pages.push('...');
                              }
                            }
                            
                            // 显示当前页附近的页码
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(i);
                            }
                            
                            // 总是显示最后一页
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push('...');
                              }
                              pages.push(totalPages);
                            }
                          }
                          
                          return pages.map((page, index) => (
                            <button
                              key={index}
                              onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                              disabled={page === '...'}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                page === currentPage
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : page === '...'
                                  ? 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ));
                        })()}
                      </div>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* 添加Locker模态框 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="添加Locker"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locker名称 *
            </label>
            <input
              type="text"
              value={addForm.locker_name}
              onChange={(e) => setAddForm(prev => ({ ...prev, locker_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入Locker名称"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              位置 *
            </label>
            <input
              type="text"
              value={addForm.location}
              onChange={(e) => setAddForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入位置"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              校区 *
            </label>
            <select
              value={addForm.campus_id}
              onChange={(e) => setAddForm(prev => ({ ...prev, campus_id: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>请选择校区</option>
              {campusList.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </Modal>

      {/* 编辑Locker模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑Locker"
      >
        {editData && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locker名称 *
              </label>
              <input
                type="text"
                value={editForm.locker_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, locker_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入Locker名称"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                位置 *
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入位置"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                校区 *
              </label>
              <select
                value={editForm.campus_id}
                onChange={(e) => setEditForm(prev => ({ ...prev, campus_id: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {editData.campus_list.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {editData.locker_status.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                占用学生
              </label>
              <SearchableSelect
                options={[
                  { id: -1, name: '未分配' },
                  ...editData.student_list
                ]}
                value={editForm.student_id || -1}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, student_id: value as number }))}
                placeholder="请选择学生"
                searchPlaceholder="搜索学生..."
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
