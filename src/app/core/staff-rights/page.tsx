'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import {
  getRightsList,
  getRightsColumnComment,
  getGroupRightInfo,
  addRightsGroup,
  deleteRightsGroup,
  editRightsGroup,
  getSingleRight,
  updateSingleRight,
  deleteSingleRight,
  getStaffList,
  type GroupRight,
  type RightsColumnComment,
  type SingleRight,
  type OperationRight,
} from '@/services/auth';

export default function StaffRightsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_STAFF_RIGHTS);

  // 权限组管理状态
  const [groups, setGroups] = useState<GroupRight[]>([]);
  const [columnComments, setColumnComments] = useState<RightsColumnComment>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 权限组模态框状态
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupRight | null>(null);
  const [groupFormData, setGroupFormData] = useState<Record<string, any>>({});
  const [groupName, setGroupName] = useState('');

  // 单个权限点管理状态
  const [activeTab, setActiveTab] = useState<'groups' | 'single'>('groups');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [allStaffList, setAllStaffList] = useState<Array<{ id: number; name: string }>>([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [singleRights, setSingleRights] = useState<SingleRight[]>([]);
  const [availableRights, setAvailableRights] = useState<string[]>([]);

  // 根据搜索词过滤员工列表
  const staffList = staffSearchTerm
    ? allStaffList.filter((staff) =>
        staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        staff.id.toString().includes(staffSearchTerm)
      )
    : allStaffList;

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  // 切换到单个权限点标签页时加载员工列表和权限字段说明
  useEffect(() => {
    if (activeTab === 'single') {
      if (allStaffList.length === 0) {
        loadStaffList();
      }
      if (availableRights.length === 0 && Object.keys(columnComments).length === 0) {
        loadColumnComments();
      }
    }
  }, [activeTab]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGroups(),
        loadColumnComments(),
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载权限组列表
  const loadGroups = async () => {
    const response = await getRightsList();
    if (response.code === 200 && Array.isArray(response.data)) {
      setGroups(response.data);
    }
  };

  // 加载字段说明
  const loadColumnComments = async () => {
    const response = await getRightsColumnComment();
    if (response.code === 200 && response.data) {
      setColumnComments(response.data);
      // 提取可用的权限字段（排除id和name）
      const rights = Object.keys(response.data).filter(
        (key) => key !== 'id' && key !== 'name'
      );
      setAvailableRights(rights);
    }
  };

  // 加载员工列表（获取全部）
  const loadStaffList = async () => {
    const response = await getStaffList();
    if (response.code === 200 && Array.isArray(response.data)) {
      setAllStaffList(response.data.map((item: any) => ({
        id: item.staff_id || item.id,
        name: item.name || item.name_search_cache || '',
      })));
    }
  };

  // 加载单个员工的权限点
  const loadSingleRights = async (staffId: number) => {
    const response = await getSingleRight(staffId);
    if (response.code === 200 && Array.isArray(response.data)) {
      setSingleRights(response.data);
    }
  };

  // 搜索过滤
  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalPages = Math.ceil(filteredGroups.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  // 处理新增权限组
  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      alert('请输入权限组名称');
      return;
    }
    const response = await addRightsGroup({ name: groupName.trim() });
    if (response.code === 200) {
      setGroupName('');
      setShowAddGroupModal(false);
      await loadGroups();
      alert('新增成功');
    } else {
      alert(response.message || '新增失败');
    }
  };

  // 处理编辑权限组
  const handleEditGroup = async () => {
    if (!selectedGroup) return;
    const editParams = {
      record_id: selectedGroup.id,
      name: groupName,
      ...groupFormData,
    };
    const response = await editRightsGroup(editParams);
    if (response.code === 200) {
      setShowEditGroupModal(false);
      setSelectedGroup(null);
      setGroupFormData({});
      await loadGroups();
      alert('编辑成功');
    } else {
      alert(response.message || '编辑失败');
    }
  };

  // 处理删除权限组
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const response = await deleteRightsGroup({ record_id: selectedGroup.id });
    if (response.code === 200) {
      setShowDeleteGroupModal(false);
      setSelectedGroup(null);
      await loadGroups();
      alert('删除成功');
    } else {
      alert(response.message || '删除失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = async (group: GroupRight) => {
    setSelectedGroup(group);
    const response = await getGroupRightInfo(group.id);
    if (response.code === 200 && response.data) {
      const data = response.data;
      const formData: Record<string, any> = {};
      // 复制所有权限字段到表单数据
      Object.keys(data).forEach((key) => {
        if (key !== 'id' && key !== 'name') {
          formData[key] = data[key] || 0;
        }
      });
      setGroupFormData(formData);
      setGroupName(data.name || '');
      setShowEditGroupModal(true);
    }
  };


  // 选择员工
  const handleSelectStaff = async (staffId: number) => {
    setSelectedStaffId(staffId);
    setStaffSearchTerm(''); // 选择后清空搜索词
    await loadSingleRights(staffId);
  };

  // 清除选择的员工
  const handleClearStaff = () => {
    setSelectedStaffId(null);
    setStaffSearchTerm('');
    setSingleRights([]);
  };

  // 切换权限点（添加或删除）
  const handleToggleRight = async (rightDesc: string) => {
    if (!selectedStaffId) return;
    
    const hasRight = singleRights.some((r) => r.right_desc === rightDesc);
    
    try {
      if (hasRight) {
        // 删除权限
        const response = await deleteSingleRight({
          staff_id: selectedStaffId,
          right_desc: rightDesc,
        });
        if (response.code === 200) {
          await loadSingleRights(selectedStaffId);
        } else {
          alert(response.message || '删除失败');
        }
      } else {
        // 添加权限
        const response = await updateSingleRight({
          staff_id: selectedStaffId,
          right_desc: rightDesc,
        });
        if (response.code === 200) {
          await loadSingleRights(selectedStaffId);
        } else {
          alert(response.message || '添加失败');
        }
      }
    } catch (error) {
      console.error('切换权限失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看员工权限管理</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">员工权限管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理权限组和单个员工的权限配置</p>
        </div>

        {/* 标签页切换 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'groups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <WrenchScrewdriverIcon className="inline-block h-5 w-5 mr-2" />
              权限组管理
            </button>
            <button
              onClick={() => setActiveTab('single')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="inline-block h-5 w-5 mr-2" />
              单个权限点管理
            </button>
          </nav>
        </div>

        {/* 权限组管理 */}
        {activeTab === 'groups' && (
          <div>
            {/* 搜索和操作栏 */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full sm:w-auto">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索权限组..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setGroupName('');
                    setShowAddGroupModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  新增权限组
                </button>
              </div>
            </div>

            {/* 权限组列表 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : paginatedGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无数据</div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          权限组名称
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedGroups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {group.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {group.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(group)}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                title="编辑"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200">
                      <div className="mb-2 sm:mb-0 text-sm text-gray-700">
                        显示第 {startIndex + 1} - {Math.min(endIndex, filteredGroups.length)} 条，共{' '}
                        {filteredGroups.length} 条记录
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={10}>10 条/页</option>
                          <option value={20}>20 条/页</option>
                          <option value={50}>50 条/页</option>
                        </select>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}

        {/* 单个权限点管理 */}
        {activeTab === 'single' && (
          <div>
            {/* 员工选择 */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              {selectedStaffId ? (
                // 已选择员工 - 显示员工信息卡片
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    已选择员工
                  </label>
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {allStaffList.find((s) => s.id === selectedStaffId)?.name || '未知员工'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearStaff}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="重新选择员工"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      重新选择
                    </button>
                  </div>
                </div>
              ) : (
                // 未选择员工 - 显示搜索框
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择员工
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索员工姓名或ID..."
                      value={staffSearchTerm}
                      onChange={(e) => {
                        setStaffSearchTerm(e.target.value);
                      }}
                      onFocus={() => {
                        if (allStaffList.length === 0) {
                          loadStaffList();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {staffSearchTerm && staffList.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-sm">
                      {staffList.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => handleSelectStaff(staff.id)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-900">{staff.name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {staffSearchTerm && staffList.length === 0 && (
                    <div className="mt-2 text-center py-4 text-sm text-gray-500">
                      未找到匹配的员工
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 权限点列表 */}
            {selectedStaffId && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    员工权限点列表
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    点击开关即可添加或删除权限
                  </p>
                </div>
                <div className="p-6">
                  {availableRights.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">暂无权限点</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableRights.map((rightDesc) => {
                        const hasRight = singleRights.some((r) => r.right_desc === rightDesc);
                        return (
                          <div
                            key={rightDesc}
                            className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {columnComments[rightDesc] || rightDesc}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">{rightDesc}</div>
                            </div>
                            {/* 开关组件 */}
                            <button
                              onClick={() => handleToggleRight(rightDesc)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                hasRight ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                              role="switch"
                              aria-checked={hasRight}
                              aria-label={`切换权限: ${columnComments[rightDesc] || rightDesc}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  hasRight ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 新增权限组模态框 */}
        {showAddGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">新增权限组</h3>
                <button
                  onClick={() => setShowAddGroupModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    权限组名称
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入权限组名称"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddGroupModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAddGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑权限组模态框 */}
        {showEditGroupModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">编辑权限组</h3>
                <button
                  onClick={() => {
                    setShowEditGroupModal(false);
                    setSelectedGroup(null);
                    setGroupFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    权限组名称
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {availableRights.map((right) => (
                    <div key={right} className="flex items-center">
                      <input
                        type="checkbox"
                        id={right}
                        checked={groupFormData[right] === 1}
                        onChange={(e) => {
                          setGroupFormData({
                            ...groupFormData,
                            [right]: e.target.checked ? 1 : 0,
                          });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={right} className="ml-2 text-sm text-gray-700">
                        {columnComments[right] || right}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditGroupModal(false);
                    setSelectedGroup(null);
                    setGroupFormData({});
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleEditGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除权限组确认模态框 */}
        {showDeleteGroupModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">删除权限组</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除权限组 "{selectedGroup.name}" 吗？此操作不可恢复。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDeleteGroupModal(false);
                    setSelectedGroup(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
