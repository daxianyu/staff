'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CogIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import {
  getOperationList,
  getStaffOperation,
  addStaffOperation,
  deleteStaffOperation,
  getActiveStaffList,
  type OperationRight,
  type StaffOperationRecord,
  type AddStaffOperationParams,
} from '@/services/auth';

export default function OperationConfigPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_OPERATION_CONFIG);

  // 状态管理
  const [operationRights, setOperationRights] = useState<OperationRight[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<StaffOperationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffListLoading, setStaffListLoading] = useState(false);

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StaffOperationRecord | null>(null);

  // 员工搜索和选择
  const [availableStaffList, setAvailableStaffList] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (canView) {
      loadOperationList();
    }
  }, [canView]);

  // 当选择的操作权限改变时，加载对应的人员列表
  useEffect(() => {
    if (selectedOperation !== null) {
      loadStaffList();
    } else {
      setStaffList([]);
    }
  }, [selectedOperation]);

  // 当模态框打开时，加载员工列表
  useEffect(() => {
    if (showAddModal && availableStaffList.length === 0) {
      loadAvailableStaff();
    }
  }, [showAddModal]);

  // 加载操作权限列表
  const loadOperationList = async () => {
    setLoading(true);
    try {
      const response = await getOperationList();
      if (response.code === 200 && Array.isArray(response.data)) {
        setOperationRights(response.data);
        // 默认选择第一个
        if (response.data.length > 0 && selectedOperation === null) {
          setSelectedOperation(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('加载操作权限列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载某个操作权限下的人员列表
  const loadStaffList = async () => {
    if (selectedOperation === null) return;
    setStaffListLoading(true);
    try {
      const response = await getStaffOperation(selectedOperation);
      if (response.code === 200 && response.data) {
        setStaffList(response.data.rows || []);
      }
    } catch (error) {
      console.error('加载人员列表失败:', error);
    } finally {
      setStaffListLoading(false);
    }
  };

  // 加载员工列表（用于添加）
  const loadAvailableStaff = async (search?: string) => {
    try {
      const response = await getActiveStaffList({ name: search || '', limit: 100 });
      if (response.code === 200 && Array.isArray(response.data)) {
        setAvailableStaffList(
          response.data.map((item: any) => ({
            id: item.staff_id || item.id,
            name: item.name || item.name_search_cache || '',
          }))
        );
      }
    } catch (error) {
      console.error('加载员工列表失败:', error);
    }
  };

  // 处理添加人员
  const handleAdd = async () => {
    if (!selectedOperation || selectedStaffIds.length === 0) {
      alert('请选择要添加的员工');
      return;
    }
    const response = await addStaffOperation({
      staff_ids: selectedStaffIds.join(','),
      conf_type: selectedOperation,
    });
    if (response.code === 200) {
      setShowAddModal(false);
      setSelectedStaffIds([]);
      await loadStaffList();
      alert('添加成功');
    } else {
      alert(response.message || '添加失败');
    }
  };

  // 处理删除人员
  const handleDelete = async () => {
    if (!selectedRecord) return;
    const response = await deleteStaffOperation({ record_id: selectedRecord.id });
    if (response.code === 200) {
      setShowDeleteModal(false);
      setSelectedRecord(null);
      await loadStaffList();
      alert('删除成功');
    } else {
      alert(response.message || '删除失败');
    }
  };

  // 切换员工选择状态
  const toggleStaffSelection = (staffId: number) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  // 分页计算
  const totalPages = Math.ceil(staffList.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStaffList = staffList.slice(startIndex, endIndex);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看操作配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">操作配置管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理操作权限配置和人员分配</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：操作权限列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-medium text-gray-900">操作权限列表</h2>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : operationRights.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">暂无操作权限</div>
                ) : (
                  <div className="space-y-2">
                    {operationRights.map((operation) => (
                      <button
                        key={operation.id}
                        onClick={() => {
                          setSelectedOperation(operation.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          selectedOperation === operation.id
                            ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                            : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{operation.right_desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：人员列表 */}
          <div className="lg:col-span-2">
            {selectedOperation === null ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">请选择一个操作权限查看人员列表</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {operationRights.find((op) => op.id === selectedOperation)?.right_desc || '人员列表'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">共 {staffList.length} 人</p>
                  </div>
                  <button
                    onClick={async () => {
                      setSelectedStaffIds([]);
                      await loadAvailableStaff();
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    添加人员
                  </button>
                </div>

                <div className="p-6">
                  {staffListLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : paginatedStaffList.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">暂无人员</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                员工姓名
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                添加时间
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedStaffList.map((staff) => (
                              <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {staff.staff_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {staff.create_time}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(staff);
                                      setShowDeleteModal(true);
                                    }}
                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                    title="删除"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 分页 */}
                      {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 mt-4">
                          <div className="mb-2 sm:mb-0 text-sm text-gray-700">
                            显示第 {startIndex + 1} - {Math.min(endIndex, staffList.length)} 条，共{' '}
                            {staffList.length} 条记录
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
          </div>
        </div>

        {/* 添加人员模态框 */}
        {showAddModal && selectedOperation !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">添加人员</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedStaffIds([]);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择员工</label>
                  <SearchableSelect
                    options={availableStaffList
                      .filter((staff) => !staffList.some((s) => s.teacher_id === staff.id))
                      .map((staff) => ({
                        id: staff.id,
                        name: staff.name,
                      }))}
                    value={selectedStaffIds}
                    onValueChange={(value) => setSelectedStaffIds(value as number[])}
                    placeholder="请选择员工..."
                    searchPlaceholder="搜索员工..."
                    multiple={true}
                    className="w-full"
                  />
                </div>
                {selectedStaffIds.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      已选择 {selectedStaffIds.length} 人
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedStaffIds([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={selectedStaffIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认添加 ({selectedStaffIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">删除人员</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要从该操作权限中移除 "{selectedRecord.staff_name}" 吗？此操作不可恢复。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
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
