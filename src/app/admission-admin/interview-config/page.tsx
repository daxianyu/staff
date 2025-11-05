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
  getInterviewSelect,
  getInterviewConfigTable,
  addInterviewConfig,
  deleteInterviewConfig,
  getInterviewTimeSelect,
  addInterviewTime,
  deleteInterviewTime,
  getInterviewRoomSelect,
  addInterviewRoom,
  getInterviewRoom,
  type InterviewConfig,
  type InterviewTimeConfig,
  type InterviewRoomConfig,
  type SelectOption,
} from '@/services/auth';

export default function InterviewConfigPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.MANAGE_INTERVIEW_CONFIG);

  // 状态管理
  const [interviewConfigs, setInterviewConfigs] = useState<InterviewConfig[]>([]);
  const [interviewSelect, setInterviewSelect] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 模态框状态
  const [showAddConfigModal, setShowAddConfigModal] = useState(false);
  const [showTimeConfigModal, setShowTimeConfigModal] = useState(false);
  const [showRoomConfigModal, setShowRoomConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<InterviewConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // 时间配置相关状态
  const [timeConfigs, setTimeConfigs] = useState<InterviewTimeConfig[]>([]);
  const [timeConfigLoading, setTimeConfigLoading] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [timeFormData, setTimeFormData] = useState<Record<string, any>>({});
  const [timeSelect, setTimeSelect] = useState<SelectOption[]>([]);
  const [selectedTimeId, setSelectedTimeId] = useState<number | null>(null);
  
  // 房间配置相关状态
  const [roomConfigs, setRoomConfigs] = useState<InterviewRoomConfig[]>([]);
  const [roomConfigLoading, setRoomConfigLoading] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [roomFormData, setRoomFormData] = useState<Record<string, any>>({});
  const [roomSelect, setRoomSelect] = useState<SelectOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // 权限检查页面
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限管理面试配置</p>
        </div>
      </div>
    );
  }

  // 加载配置列表
  const loadConfigs = async () => {
    try {
      const result = await getInterviewConfigTable();
      if (result.code === 200 && result.data) {
        setInterviewConfigs(result.data.rows);
      }
    } catch (error) {
      console.error('加载面试配置失败:', error);
    }
  };

  // 加载select选项
  const loadSelects = async () => {
    try {
      const result = await getInterviewSelect();
      if (result.code === 200 && result.data) {
        // result.data 现在是 { exam_day: string[], interviewer_num: number[] }
        // 转换为 SelectOption[] 格式，用于表单下拉框
        const examDayOptions = (result.data.exam_day || []).map((day, index) => ({
          id: index,
          name: day,
        }));
        setInterviewSelect(examDayOptions);
      }
    } catch (error) {
      console.error('加载select选项失败:', error);
    }
  };

  // 加载时间select选项
  const loadTimeSelect = async (recordId: number) => {
    try {
      const result = await getInterviewTimeSelect(recordId);
      if (result.code === 200 && result.data) {
        // result.data 现在是对象，包含 ref_day, interview_desc, interviewer_num, interview_day, interview_time
        // interview_time 是 number[]，转换为 SelectOption[]
        const timeOptions = (result.data.interview_time || []).map((time) => ({
          id: time,
          name: String(time),
        }));
        setTimeSelect(timeOptions);
      }
    } catch (error) {
      console.error('加载时间select选项失败:', error);
    }
  };

  // 加载房间select选项
  const loadRoomSelect = async (recordId: number) => {
    try {
      const result = await getInterviewRoomSelect(recordId);
      if (result.code === 200 && result.data) {
        // result.data 现在是对象，包含 ref_day, interview_desc, interviewer_num, interview_day, interview_room
        // interview_room 是 Array<{ room_id: number; room_info: string }>，转换为 SelectOption[]
        const roomOptions = (result.data.interview_room || []).map((room) => ({
          id: room.room_id,
          name: room.room_info || `房间 ${room.room_id}`,
        }));
        setRoomSelect(roomOptions);
      }
    } catch (error) {
      console.error('加载房间select选项失败:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadConfigs(), loadSelects()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // 打开添加配置模态框
  const handleAddConfig = () => {
    setFormData({});
    setShowAddConfigModal(true);
  };

  // 加载时间配置列表
  const loadTimeConfigs = async (recordId: number) => {
    setTimeConfigLoading(true);
    try {
      const result = await getInterviewTimeSelect(recordId);
      if (result.code === 200 && result.data) {
        // interview_time 是 number[]，转换为 InterviewTimeConfig[]
        const times = (result.data.interview_time || []).map((time, index) => ({
          id: index + 1,
          time_slot: String(time),
          record_id: recordId,
        }));
        setTimeConfigs(times);
        // 同时更新 timeSelect 用于添加表单
        const timeOptions = (result.data.interview_time || []).map((time) => ({
          id: time,
          name: String(time),
        }));
        setTimeSelect(timeOptions);
      }
    } catch (error) {
      console.error('加载时间配置失败:', error);
    } finally {
      setTimeConfigLoading(false);
    }
  };

  // 加载房间配置列表
  const loadRoomConfigs = async (recordId: number) => {
    setRoomConfigLoading(true);
    try {
      const result = await getInterviewRoom(recordId);
      if (result.code === 200 && result.data) {
        setRoomConfigs(result.data.rows || []);
      }
      // 同时加载房间选择选项
      const selectResult = await getInterviewRoomSelect(recordId);
      if (selectResult.code === 200 && selectResult.data) {
        const roomOptions = (selectResult.data.interview_room || []).map((room) => ({
          id: room.room_id,
          name: room.room_info || `房间 ${room.room_id}`,
        }));
        setRoomSelect(roomOptions);
      }
    } catch (error) {
      console.error('加载房间配置失败:', error);
    } finally {
      setRoomConfigLoading(false);
    }
  };

  // 打开时间配置弹出框
  const handleOpenTimeConfig = async (config: InterviewConfig) => {
    setSelectedConfig(config);
    setShowTimeConfigModal(true);
    await loadTimeConfigs(config.record_id);
  };

  // 打开会议配置弹出框
  const handleOpenRoomConfig = async (config: InterviewConfig) => {
    setSelectedConfig(config);
    setShowRoomConfigModal(true);
    await loadRoomConfigs(config.record_id);
  };

  // 打开添加时间模态框
  const handleAddTime = async () => {
    if (!selectedConfig) return;
    setTimeFormData({ record_id: selectedConfig.record_id });
    await loadTimeSelect(selectedConfig.record_id);
    setShowAddTimeModal(true);
  };

  // 打开添加房间模态框
  const handleAddRoom = async () => {
    if (!selectedConfig) return;
    setRoomFormData({ record_id: selectedConfig.record_id });
    await loadRoomSelect(selectedConfig.record_id);
    setShowAddRoomModal(true);
  };

  // 打开删除确认模态框
  const handleDeleteClick = (config: InterviewConfig) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  // 提交配置
  const handleSubmitConfig = async () => {
    try {
      const result = await addInterviewConfig(formData);
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

  // 提交时间配置
  const handleSubmitTime = async () => {
    try {
      const result = await addInterviewTime(timeFormData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddTimeModal(false);
        setTimeFormData({});
        if (selectedConfig) {
          await loadTimeConfigs(selectedConfig.record_id);
        }
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };

  // 提交房间配置
  const handleSubmitRoom = async () => {
    try {
      const result = await addInterviewRoom(roomFormData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddRoomModal(false);
        setRoomFormData({});
        if (selectedConfig) {
          await loadRoomConfigs(selectedConfig.record_id);
        }
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };

  // 删除时间配置
  const handleDeleteTime = async (timeId: number) => {
    if (!confirm('确定要删除这个时间配置吗？')) return;
    try {
      const result = await deleteInterviewTime(timeId);
      if (result.code === 200) {
        alert('删除成功');
        if (selectedConfig) {
          await loadTimeConfigs(selectedConfig.record_id);
        }
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedConfig) return;
    
    try {
      const result = await deleteInterviewConfig(selectedConfig.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedConfig(null);
        loadConfigs();
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
          <h1 className="text-2xl font-bold text-gray-900">面试配置</h1>
          <p className="mt-2 text-sm text-gray-600">管理面试配置信息</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={handleAddConfig}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增面试配置
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考试日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面试官数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面试日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面试说明</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviewConfigs.map((config, index) => (
                    <tr key={config.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.ref_day || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.interviewer_num || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.interview_day || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.interview_desc || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.create_time || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenTimeConfig(config)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            时间配置
                          </button>
                          <button
                            onClick={() => handleOpenRoomConfig(config)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                          >
                            会议配置
                          </button>
                          <button
                            onClick={() => handleDeleteClick(config)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                            title="删除"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {interviewConfigs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 添加配置模态框 */}
        {showAddConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增面试配置</h3>
                <button
                  onClick={() => {
                    setShowAddConfigModal(false);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Record ID</label>
                  <select
                    value={formData.record_id || ''}
                    onChange={(e) => setFormData({ ...formData, record_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择</option>
                    {interviewSelect.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddConfigModal(false);
                    setFormData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitConfig}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加时间配置模态框 */}
        {showAddTimeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">添加面试时间</h3>
                <button
                  onClick={() => {
                    setShowAddTimeModal(false);
                    setTimeFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时间</label>
                  <select
                    value={timeFormData.time_slot || ''}
                    onChange={(e) => setTimeFormData({ ...timeFormData, time_slot: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择时间</option>
                    {timeSelect.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddTimeModal(false);
                    setTimeFormData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitTime}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加房间配置模态框 */}
        {showAddRoomModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">添加面试房间</h3>
                <button
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">房间</label>
                  <select
                    value={roomFormData.room_id || ''}
                    onChange={(e) => setRoomFormData({ ...roomFormData, room_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择房间</option>
                    {roomSelect.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomFormData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRoom}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                  <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除面试配置（Record ID: {selectedConfig.record_id}）吗？此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConfig(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 时间配置弹出框 */}
        {showTimeConfigModal && selectedConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">时间配置（Record ID: {selectedConfig.record_id}）</h3>
                <button
                  onClick={() => {
                    setShowTimeConfigModal(false);
                    setSelectedConfig(null);
                    setTimeConfigs([]);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h4 className="text-md font-medium text-gray-900">时间列表</h4>
                  <button
                    onClick={handleAddTime}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    添加时间
                  </button>
                </div>
                
                {timeConfigLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timeConfigs.map((time) => (
                          <tr key={time.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{time.time_slot}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleDeleteTime(time.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {timeConfigs.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-4 text-center text-sm text-gray-500">
                              暂无时间配置
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 会议配置弹出框 */}
        {showRoomConfigModal && selectedConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">会议配置（Record ID: {selectedConfig.record_id}）</h3>
                <button
                  onClick={() => {
                    setShowRoomConfigModal(false);
                    setSelectedConfig(null);
                    setRoomConfigs([]);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h4 className="text-md font-medium text-gray-900">房间列表</h4>
                  <button
                    onClick={handleAddRoom}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    添加房间
                  </button>
                </div>
                
                {roomConfigLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">房间ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">房间信息</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roomConfigs.map((room) => (
                          <tr key={room.room_id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{room.room_id}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{room.room_info || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{room.create_time || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => {
                                  if (confirm('确定要删除这个房间配置吗？')) {
                                    // TODO: 实现删除房间的API调用
                                    alert('删除功能待实现');
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {roomConfigs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                              暂无房间配置
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

