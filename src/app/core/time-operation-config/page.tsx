'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  getTimeConfigSelect,
  addTimeConfig,
  deleteTimeConfig,
  getTimeConfigTable,
  type TimeConfigSelectResponse,
  type TimeConfigRecord,
  type AddTimeConfigParams,
} from '@/services/auth';

export default function TimeOperationConfigPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_TIME_OPERATION_CONFIG);

  // 状态管理
  const [allConfigs, setAllConfigs] = useState<TimeConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeSelect, setTypeSelect] = useState<Record<number, string>>({});
  const [campusList, setCampusList] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null); // 当前选择的类型

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<TimeConfigRecord | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<AddTimeConfigParams>({
    type: 0,
    start_time: '',
    end_time: '',
    campus_id: 0,
  });

  // 根据选择的类型过滤配置列表
  const configs = selectedType !== null
    ? allConfigs.filter((config) => {
        // 从type_name反推type值，匹配当前选择的类型
        return config.type_name === typeSelect[selectedType];
      })
    : allConfigs;

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadConfigs(), loadSelectOptions()]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载配置列表
  const loadConfigs = async () => {
    const response = await getTimeConfigTable();
    if (response.code === 200 && response.data) {
      setAllConfigs(response.data.rows || []);
    }
  };

  // 加载下拉选项
  const loadSelectOptions = async () => {
    const response = await getTimeConfigSelect();
    if (response.code === 200 && response.data) {
      const typeSelectData = response.data.type_select || {};
      setTypeSelect(typeSelectData);
      setCampusList(response.data.campus_list || []);
      // 默认选择第一个类型
      const typeKeys = Object.keys(typeSelectData);
      if (typeKeys.length > 0 && selectedType === null) {
        const firstType = Number(typeKeys[0]);
        setSelectedType(firstType);
        // 同时设置表单默认类型
        setFormData((prev) => ({ ...prev, type: firstType }));
      }
    }
  };

  // 处理添加配置
  const handleAdd = async () => {
    if (!formData.start_time || !formData.end_time || !formData.campus_id) {
      alert('请填写完整信息');
      return;
    }
    const response = await addTimeConfig(formData);
    if (response.code === 200) {
      setShowAddModal(false);
      setFormData({
        type: selectedType !== null ? selectedType : 0,
        start_time: '',
        end_time: '',
        campus_id: 0,
      });
      await loadConfigs();
      alert('添加成功');
    } else {
      alert(response.message || '添加失败');
    }
  };

  // 处理删除配置
  const handleDelete = async () => {
    if (!selectedConfig) return;
    const response = await deleteTimeConfig({ record_id: selectedConfig.record_id });
    if (response.code === 200) {
      setShowDeleteModal(false);
      setSelectedConfig(null);
      await loadConfigs();
      alert('删除成功');
    } else {
      alert(response.message || '删除失败');
    }
  };

  // 将input[type="datetime-local"]的值转换为API需要的格式
  const formatDateTimeForAPI = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    // 将 "2025-06-30T12:10" 转换为 "2025-06-30 12:10:00"
    return dateTimeLocal.replace('T', ' ') + ':00';
  };

  // 分页计算
  const totalPages = Math.ceil(configs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedConfigs = configs.slice(startIndex, endIndex);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看时间操作配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">时间操作配置</h1>
          <p className="mt-1 text-sm text-gray-500">管理时间相关的操作配置</p>
        </div>

        {/* 类型选择器 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">配置类型：</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeSelect).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedType(Number(key));
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === Number(key)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedType(null);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setFormData({
                  type: selectedType !== null ? selectedType : 0,
                  start_time: '',
                  end_time: '',
                  campus_id: 0,
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              新增配置
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <span>
              共 {configs.length} 条配置
              {selectedType !== null && ` (${typeSelect[selectedType]})`}
            </span>
          </div>
        </div>

        {/* 配置列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paginatedConfigs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无配置</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        校区
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        开始时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        结束时间
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedConfigs.map((config) => (
                      <tr key={config.record_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {config.type_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {config.campus_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {config.start_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {config.end_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedConfig(config);
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
                <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200">
                  <div className="mb-2 sm:mb-0 text-sm text-gray-700">
                    显示第 {startIndex + 1} - {Math.min(endIndex, configs.length)} 条，共{' '}
                    {configs.length} 条记录
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
                      <option value={50}>50 条/页</option>
                      <option value={100}>100 条/页</option>
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

        {/* 新增配置模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">新增时间配置</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>请选择类型</option>
                    {Object.entries(typeSelect).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    校区 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.campus_id}
                    onChange={(e) =>
                      setFormData({ ...formData, campus_id: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>请选择校区</option>
                    {campusList.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time ? formData.start_time.replace(' ', 'T').slice(0, 16) : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_time: formatDateTimeForAPI(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time ? formData.end_time.replace(' ', 'T').slice(0, 16) : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end_time: formatDateTimeForAPI(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">删除时间配置</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除 "{selectedConfig.type_name}" 的时间配置吗？此操作不可恢复。
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      校区: {selectedConfig.campus_name} | 时间: {selectedConfig.start_time} -{' '}
                      {selectedConfig.end_time}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConfig(null);
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
