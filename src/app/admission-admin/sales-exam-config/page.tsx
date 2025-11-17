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
  getExamSessionSelect,
  getExamSessionTable,
  addExamSession,
  deleteExamSession,
  getExamBaseTable,
  addExamBase,
  deleteExamBase,
  type ExamSession,
  type SelectOption,
  type ExamBaseConfig,
} from '@/services/auth';

export default function ExamConfigPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.MANAGE_EXAM_CONFIG);

  // 状态管理 - 考试场次配置
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [examSettingOptions, setExamSettingOptions] = useState<SelectOption[]>([]);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [studyYearOptions, setStudyYearOptions] = useState<Array<{ id: string | number; name: string }>>([]);
  const [paperTypeOptions, setPaperTypeOptions] = useState<Array<{ id: string | number; name: string }>>([]);
  
  const [loading, setLoading] = useState(true);
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // 二级弹出窗口状态（配置年制和试卷类型）
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configType, setConfigType] = useState<'study_year' | 'paper_type' | null>(null); // 'study_year' 对应年制(0), 'paper_type' 对应试卷类型(1)
  const [baseConfigList, setBaseConfigList] = useState<ExamBaseConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

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
  const loadSessions = async () => {
    try {
      const [sessionResult, selectResult] = await Promise.all([
        getExamSessionTable(),
        getExamSessionSelect(),
      ]);
      if (sessionResult.code === 200 && sessionResult.data) {
        setExamSessions(sessionResult.data.rows);
      }
      if (selectResult.code === 200 && selectResult.data) {
        // 考试场次选项：exam_setting 是 { id: number, exam_desc: string }[]
        const examSettingOpts = (selectResult.data.exam_setting || []).map((item: { id: number; exam_desc: string }) => ({
          id: item.id,
          name: item.exam_desc,
        }));
        setExamSettingOptions(examSettingOpts);
        
        // 校区选项：campus_info 是 Record<number, string>
        const campusOpts = Object.entries(selectResult.data.campus_info || {}).map(([id, name]) => ({
          id: Number(id),
          name: String(name),
        }));
        setCampusOptions(campusOpts);
        
        // 年制选项：study_year 是 Array<{ value: string; name: string }>
        const studyYearOpts = (selectResult.data.study_year || []).map((item: { value: string; name: string }) => ({
          id: item.value,
          name: item.name,
        }));
        setStudyYearOptions(studyYearOpts);
        
        // 试卷类型选项：paper_type 是 Array<{ value: string; name: string }>
        const paperTypeOpts = (selectResult.data.paper_type || []).map((item: { value: string; name: string }) => ({
          id: item.value,
          name: item.name,
        }));
        setPaperTypeOptions(paperTypeOpts);
      }
    } catch (error) {
      console.error('加载考试场次配置失败:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSessions().finally(() => {
      setLoading(false);
    });
  }, []);

  // 提交场次配置
  const handleSubmit = async () => {
    try {
      const result = await addExamSession(formData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddModal(false);
        setFormData({});
        loadSessions();
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
      const result = await deleteExamSession(selectedItem.record_id || selectedItem.id);
      
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedItem(null);
        loadSessions();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 打开配置窗口
  const handleOpenConfigModal = async (type: 'study_year' | 'paper_type') => {
    setConfigType(type);
    setShowConfigModal(true);
    setConfigLoading(true);
    setNewConfigName('');
    
    try {
      const result = await getExamBaseTable();
      if (result.code === 200 && result.data) {
        // 根据类型筛选：年制(type=0) 或 试卷类型(type=1)
        const typeName = type === 'study_year' ? '年制' : '试卷类型';
        const filtered = result.data.rows.filter(item => item.type === typeName);
        setBaseConfigList(filtered);
      }
    } catch (error) {
      console.error('加载配置列表失败:', error);
      alert('加载配置列表失败');
    } finally {
      setConfigLoading(false);
    }
  };

  // 添加新配置
  const handleAddNewConfig = async () => {
    if (!newConfigName.trim()) {
      alert('请输入配置名称');
      return;
    }
    if (!configType) return;
    
    const examType = configType === 'study_year' ? 0 : 1;
    
    try {
      const result = await addExamBase({
        value: newConfigName.trim(),
        exam_type: examType,
      });
      
      if (result.code === 200) {
        alert('添加成功');
        setNewConfigName('');
        // 重新加载配置列表
        const listResult = await getExamBaseTable();
        if (listResult.code === 200 && listResult.data) {
          const typeName = configType === 'study_year' ? '年制' : '试卷类型';
          const filtered = listResult.data.rows.filter(item => item.type === typeName);
          setBaseConfigList(filtered);
        }
        // 重新加载下拉选项数据
        loadSessions();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('添加配置失败:', error);
      alert('添加配置失败');
    }
  };

  // 删除配置项
  const handleDeleteConfig = async (recordId: number) => {
    if (!confirm('确定要删除这个配置项吗？')) return;
    
    try {
      const result = await deleteExamBase(recordId);
      if (result.code === 200) {
        alert('删除成功');
        // 从列表中移除
        setBaseConfigList(prev => prev.filter(item => item.record_id !== recordId));
        // 重新加载下拉选项数据
        loadSessions();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除配置失败:', error);
      alert('删除配置失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sales Exam Config</h1>
          <p className="mt-2 text-sm text-gray-600">管理考试场次配置信息</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={() => setShowAddModal(true)}
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试描述</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">校区</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年制</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">试卷类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {examSessions.map((session) => (
                    <tr key={session.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.record_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.exam_desc || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.campus_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.study_year || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.paper_type || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedItem(session);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {examSessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 添加场次配置模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-900">新增场次配置</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* 考试场次 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    考试场次 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.exam_id || ''}
                    onChange={(e) => setFormData({ ...formData, exam_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择考试场次</option>
                    {examSettingOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 校区 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    校区 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.campus_id || ''}
                    onChange={(e) => setFormData({ ...formData, campus_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择校区</option>
                    {campusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 年制 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      年制 <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenConfigModal('study_year')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      配置
                    </button>
                  </div>
                  <select
                    value={formData.study_year || ''}
                    onChange={(e) => setFormData({ ...formData, study_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择年制</option>
                    {studyYearOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 试卷类型 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      试卷类型 <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenConfigModal('paper_type')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      配置
                    </button>
                  </div>
                  <select
                    value={formData.paper_type || ''}
                    onChange={(e) => setFormData({ ...formData, paper_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择试卷类型</option>
                    {paperTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  取消
                </button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 配置年制和试卷类型的二级弹出窗口 */}
        {showConfigModal && configType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-900">
                  配置{configType === 'study_year' ? '年制' : '试卷类型'}
                </h3>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setConfigType(null);
                    setNewConfigName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* 添加新配置 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                    placeholder={`输入新的${configType === 'study_year' ? '年制' : '试卷类型'}名称`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewConfig();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddNewConfig}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    添加
                  </button>
                </div>
                
                {/* 配置列表 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配置列表
                  </label>
                  {configLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                      {baseConfigList.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          暂无配置项
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {baseConfigList.map((item) => (
                            <div
                              key={item.record_id}
                              className="flex items-center px-4 py-3 hover:bg-gray-50"
                            >
                              <span className="flex-1 text-sm text-gray-900">{item.name}</span>
                              <span className="text-xs text-gray-500 mr-4">{item.create_time}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteConfig(item.record_id)}
                                className="text-red-600 hover:text-red-800"
                                title="删除"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setConfigType(null);
                    setNewConfigName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  关闭
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
                      确定要删除 "{selectedItem.exam_desc || selectedItem.name || selectedItem.record_id}" 吗？此操作不可撤销。
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

