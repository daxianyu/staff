'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getExamConfigSelect,
  getExamConfigTable,
  addExamConfig,
  deleteExamConfig,
  getExamBaseSelect,
  getExamBaseTable,
  addExamBase,
  deleteExamBase,
  type ExamConfig,
  type ExamBaseConfig,
  type SelectOption,
} from '@/services/auth';

export default function ExamConfigPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.MANAGE_EXAM_CONFIG);

  // 状态管理 - 考试配置
  const [examConfigs, setExamConfigs] = useState<ExamConfig[]>([]);
  const [examSelect, setExamSelect] = useState<SelectOption[]>([]);
  
  // 状态管理 - 考试基础配置
  const [examBases, setExamBases] = useState<ExamBaseConfig[]>([]);
  const [baseSelect, setBaseSelect] = useState<SelectOption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'base'>('config');
  
  // 模态框状态
  const [showAddConfigModal, setShowAddConfigModal] = useState(false);
  const [showAddBaseModal, setShowAddBaseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'config' | 'base'>('config');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [baseFormData, setBaseFormData] = useState<Record<string, any>>({});

  // 权限检查页面
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限管理考试配置</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadConfigs = async () => {
    try {
      const [configResult, selectResult] = await Promise.all([
        getExamConfigTable(),
        getExamConfigSelect(),
      ]);
      if (configResult.code === 200 && configResult.data) {
        setExamConfigs(configResult.data.rows);
      }
      if (selectResult.code === 200 && selectResult.data) {
        // exam_type 是 Record<number, string>，转换为 SelectOption[]
        const examTypeOptions = Object.entries(selectResult.data.exam_type || {}).map(([value, name]) => ({
          id: Number(value),
          name: String(name),
        }));
        setExamSelect(examTypeOptions);
      }
    } catch (error) {
      console.error('加载考试配置失败:', error);
    }
  };


  const loadBases = async () => {
    try {
      const [baseResult, selectResult] = await Promise.all([
        getExamBaseTable(),
        getExamBaseSelect(),
      ]);
      if (baseResult.code === 200 && baseResult.data) {
        setExamBases(baseResult.data.rows);
      }
      if (selectResult.code === 200 && selectResult.data) {
        // sales_exam_select 是 Record<number, string>，转换为 SelectOption[]
        const baseSelectOptions = Object.entries(selectResult.data.sales_exam_select || {}).map(([value, name]) => ({
          id: Number(value),
          name: String(name),
        }));
        setBaseSelect(baseSelectOptions);
      }
    } catch (error) {
      console.error('加载考试基础配置失败:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadConfigs(), loadBases()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // 提交配置
  const handleSubmitConfig = async () => {
    try {
      const result = await addExamConfig(formData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddConfigModal(false);
        setFormData({});
        loadConfigs();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };


  // 提交基础配置
  const handleSubmitBase = async () => {
    try {
      const result = await addExamBase(baseFormData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddBaseModal(false);
        setBaseFormData({});
        loadBases();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      let result;
      if (deleteType === 'config') {
        result = await deleteExamConfig(selectedItem.record_id || selectedItem.id);
      } else {
        result = await deleteExamBase(selectedItem.record_id || selectedItem.id);
      }
      
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedItem(null);
        if (deleteType === 'config') loadConfigs();
        else loadBases();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sales Exam Config</h1>
          <p className="mt-2 text-sm text-gray-600">管理考试配置信息</p>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                考试配置
              </button>
              <button
                onClick={() => setActiveTab('base')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'base'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                基础配置
              </button>
            </nav>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={() => {
                if (activeTab === 'config') setShowAddConfigModal(true);
                else setShowAddBaseModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增
            </button>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'config' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试描述</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结束日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examConfigs.map((config) => (
                      <tr key={config.record_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.record_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.exam_desc || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.exam_time || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.start_day || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.end_day || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.price || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.exam_type || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setDeleteType('config');
                              setSelectedItem(config);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {examConfigs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'base' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examBases.map((base) => (
                      <tr key={base.record_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{base.record_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{base.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{base.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{base.create_time || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setDeleteType('base');
                              setSelectedItem(base);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {examBases.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 添加配置模态框 */}
        {showAddConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增考试配置</h3>
                <button onClick={() => setShowAddConfigModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button onClick={() => setShowAddConfigModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  取消
                </button>
                <button onClick={handleSubmitConfig} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加基础配置模态框 */}
        {showAddBaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增基础配置</h3>
                <button onClick={() => setShowAddBaseModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={baseFormData.name || ''}
                    onChange={(e) => setBaseFormData({ ...baseFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button onClick={() => setShowAddBaseModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  取消
                </button>
                <button onClick={handleSubmitBase} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除 "{selectedItem.name || selectedItem.id}" 吗？此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button onClick={() => { setShowDeleteModal(false); setSelectedItem(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  取消
                </button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
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

