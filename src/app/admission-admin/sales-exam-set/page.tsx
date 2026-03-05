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
import SearchableSelect from '@/components/SearchableSelect';
import {
  getExamConfigSelect,
  getExamSessionSelect,
  addExamConfig,
  getExamConfigTable,
  deleteExamConfig,
  type ExamConfig,
  type SelectOption,
} from '@/services/auth';

export default function SalesExamSetPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.MANAGE_EXAM_CONFIG);

  // 状态管理
  const [examSessions, setExamSessions] = useState<ExamConfig[]>([]);
  const [examTypeOptions, setExamTypeOptions] = useState<SelectOption[]>([]);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ExamConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 权限检查页面
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限管理考试设置</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [tableResult, selectResult, sessionSelectResult] = await Promise.all([
        getExamConfigTable(),
        getExamConfigSelect(),
        getExamSessionSelect(),
      ]);
      if (tableResult.code === 200 && tableResult.data) {
        setExamSessions(tableResult.data.rows);
      }
      if (selectResult.code === 200 && selectResult.data) {
        const examTypeOptions = Object.entries(selectResult.data.exam_type || {}).map(([id, name]) => ({
          id: parseInt(id),
          name: name as string,
        }));
        setExamTypeOptions(examTypeOptions);
      }
      // 考试地点：优先用 exam_config_select 的 campus_info，否则用 get_exam_session_select 的
      // campus_info 可能是 Array<[campus_id, campus_name]> 或 Record<campus_id, name>，需正确解析出 campus_id
      const parseCampusInfo = (raw: unknown): SelectOption[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) {
          return raw
            .map((item): SelectOption | null => {
              if (Array.isArray(item)) return { id: Number(item[0]), name: String(item[1] ?? '') };
              if (item && typeof item === 'object' && 'id' in item)
                return { id: Number((item as { id: number }).id), name: String((item as { name?: string }).name ?? '') };
              return null;
            })
            .filter((o): o is SelectOption => o != null && !Number.isNaN(o.id));
        }
        const toStr = (v: unknown): string =>
          typeof v === 'string' ? v : (v && typeof v === 'object' && 'name' in v ? String((v as { name: unknown }).name) : String(v ?? ''));
        return Object.entries(raw as Record<string, unknown>).map(([k, v]) => ({
          id: parseInt(k, 10),
          name: toStr(v),
        })).filter((o) => !Number.isNaN(o.id));
      };
      let campusOpts: SelectOption[] = [];
      if (selectResult.code === 200 && selectResult.data?.campus_info) {
        campusOpts = parseCampusInfo(selectResult.data.campus_info);
      }
      if (campusOpts.length === 0 && sessionSelectResult.code === 200 && sessionSelectResult.data?.campus_info) {
        campusOpts = parseCampusInfo(sessionSelectResult.data.campus_info);
      }
      setCampusOptions(campusOpts);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 生成时间选项（每30分钟一个，从00:00到23:30）
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // 安全渲染：若值为 {id, name} 对象则取 name
  const renderCell = (val: unknown) => {
    if (val == null || val === '') return '-';
    if (typeof val === 'object' && 'name' in (val as object) && typeof (val as { name: unknown }).name === 'string') {
      return (val as { name: string }).name;
    }
    return String(val);
  };

  // 打开添加模态框
  const handleAdd = () => {
    setFormData({ price: 500 }); // 默认费用500
    setFormErrors({});
    setShowAddModal(true);
  };

  // 打开删除确认模态框
  const handleDeleteClick = (config: ExamConfig) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (submitting) return; // 防止重复提交

    // 校验必填项，在对应 input/select 下提示
    const errors: Record<string, string> = {};
    if (!formData.exam_desc?.trim()) errors.exam_desc = '请填写考试说明';
    if (!formData.start_day) errors.start_day = '请选择缴费开始日期';
    if (!formData.end_day) errors.end_day = '请选择缴费结束日期';
    if (!formData.exam_date) errors.exam_date = '请选择考试日期';
    if (!formData.exam_time) errors.exam_time = '请选择考试时间';
    if (formData.exam_type === undefined || formData.exam_type === '') errors.exam_type = '请选择考试类型';
    const campusIds = Array.isArray(formData.campus_id) ? formData.campus_id : (formData.campus_id != null && formData.campus_id !== '' ? [formData.campus_id] : []);
    if (campusIds.length === 0) errors.campus_id = '请选择考试地点';
    if (formData.price === undefined || formData.price === '' || Number(formData.price) < 0) errors.price = '请填写考试费用';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    
    try {
      setSubmitting(true);
      
      // 合并考试日期和时间
      const examDate = formData.exam_date || '';
      const examTime = formData.exam_time || '';
      // time 输入框返回的是 HH:MM 格式，需要转换为 HH:MM:SS
      const examTimeWithSeconds = examTime ? `${examTime}:00` : '00:00:00';
      const examDateTime = examDate && examTime ? `${examDate} ${examTimeWithSeconds}` : '';
      
      const rawCampus = Array.isArray(formData.campus_id) ? formData.campus_id : (formData.campus_id != null && formData.campus_id !== '' ? [formData.campus_id] : []);
      const campusIds = rawCampus.map((v) => (typeof v === 'object' && v && 'id' in v ? (v as { id: number }).id : Number(v))).filter((n) => !Number.isNaN(n));
      const submitData = {
        exam_desc: formData.exam_desc || '',
        start_day: formData.start_day || '',
        end_day: formData.end_day || '',
        exam_time: examDateTime,
        price: formData.price ? parseInt(formData.price) : 0,
        exam_type: formData.exam_type ? parseInt(formData.exam_type) : 0,
        campus_id: campusIds.map((id) => String(id)).join(','), // 校区id用逗号隔开的字符串
      };
      
      const result = await addExamConfig(submitData);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddModal(false);
        setFormData({ price: 500 });
        loadData();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedConfig) return;
    
    try {
      const result = await deleteExamConfig(selectedConfig.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedConfig(null);
        loadData();
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Exam Set</h1>
          <p className="mt-2 text-sm text-gray-600">管理考试场次设置</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增考试场次
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Start Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay End Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {examSessions.map((session) => (
                    <tr key={session.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.record_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.exam_desc)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.campus_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.start_day)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.end_day)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.exam_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.exam_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCell(session.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteClick(session)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                          title="删除"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {examSessions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 添加模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增考试场次</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 考试说明 - 占满一行 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试说明 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.exam_desc || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, exam_desc: e.target.value });
                        if (formErrors.exam_desc) setFormErrors((prev) => ({ ...prev, exam_desc: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.exam_desc ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="请输入考试说明"
                    />
                    {formErrors.exam_desc && <p className="mt-1 text-sm text-red-500">{formErrors.exam_desc}</p>}
                  </div>
                  
                  {/* 缴费开始日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      缴费开始日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_day || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, start_day: e.target.value });
                        if (formErrors.start_day) setFormErrors((prev) => ({ ...prev, start_day: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.start_day ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.start_day && <p className="mt-1 text-sm text-red-500">{formErrors.start_day}</p>}
                  </div>
                  
                  {/* 缴费结束日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      缴费结束日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_day || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, end_day: e.target.value });
                        if (formErrors.end_day) setFormErrors((prev) => ({ ...prev, end_day: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.end_day ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.end_day && <p className="mt-1 text-sm text-red-500">{formErrors.end_day}</p>}
                  </div>
                  
                  {/* 考试日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.exam_date || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, exam_date: e.target.value });
                        if (formErrors.exam_date) setFormErrors((prev) => ({ ...prev, exam_date: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.exam_date ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.exam_date && <p className="mt-1 text-sm text-red-500">{formErrors.exam_date}</p>}
                  </div>
                  
                  {/* 考试时分秒 - 下拉菜单 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试时分秒 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.exam_time || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, exam_time: e.target.value });
                        if (formErrors.exam_time) setFormErrors((prev) => ({ ...prev, exam_time: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.exam_time ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">请选择时间</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {formErrors.exam_time && <p className="mt-1 text-sm text-red-500">{formErrors.exam_time}</p>}
                  </div>
                  
                  {/* 考试类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.exam_type || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, exam_type: e.target.value });
                        if (formErrors.exam_type) setFormErrors((prev) => ({ ...prev, exam_type: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.exam_type ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">请选择考试类型</option>
                      {examTypeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {renderCell(option.name)}
                        </option>
                      ))}
                    </select>
                    {formErrors.exam_type && <p className="mt-1 text-sm text-red-500">{formErrors.exam_type}</p>}
                  </div>
                  
                  {/* 考试地点（下拉多选，提交为逗号分隔的校区id字符串） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试地点 <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={campusOptions}
                      value={Array.isArray(formData.campus_id) ? formData.campus_id : (formData.campus_id != null && formData.campus_id !== '' ? [formData.campus_id] : [])}
                      onValueChange={(val) => {
                        setFormData({ ...formData, campus_id: val as number[] });
                        if (formErrors.campus_id) setFormErrors((prev) => ({ ...prev, campus_id: '' }));
                      }}
                      placeholder="请选择考试地点"
                      searchPlaceholder="搜索校区..."
                      multiple
                      clearable
                      maxDisplayCount={0}
                      className={`w-full min-w-0 ${formErrors.campus_id ? '!border-red-500' : ''}`}
                    />
                    {formErrors.campus_id && <p className="mt-1 text-sm text-red-500">{formErrors.campus_id}</p>}
                  </div>
                  
                  {/* 考试费用 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      考试费用 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price ?? 500}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                        setFormData({ ...formData, price: value });
                        if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="请输入考试费用"
                      min="0"
                    />
                    {formErrors.price && <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ price: 500 });
                    setFormErrors({});
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '确认'}
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
                      确定要删除考试场次 "{selectedConfig.exam_desc || selectedConfig.record_id}" 吗？此操作不可撤销。
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
      </div>
    </div>
  );
}

