'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getExamEditInfo,
  editExam,
  addChangePrice,
  updateChangePrice,
  deleteChangePrice,
  deleteInnerSignup,
  deletePublicSignup,
} from '@/services/auth';
import Button from '@/components/Button';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExamEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('id');
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [form, setForm] = useState({
    record_id: 0,
    exam_name: '',
    base_price: 0,
    exam_location: '',
    exam_topic: '',
    exam_topic_id: 0,
    exam_code: '',
    period: 0,
    exam_type: 0,
    exam_time: 0,
    exam_time_2: 0,
    exam_time_3: 0,
    alipay_account: 0,
  });
  const [priceChanges, setPriceChanges] = useState<any[]>([]);
  const [newChange, setNewChange] = useState({ change_price: 0, change_time: 0 });
  const [editingChange, setEditingChange] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (examId && canEdit) {
      loadInfo();
    }
  }, [examId, canEdit]);

  const loadInfo = async () => {
    if (!examId) return;
    setLoading(true);
    const resp = await getExamEditInfo(Number(examId));
    if (resp.code === 200 && resp.data) {
      setInfo(resp.data);
      const ed = resp.data.exam_data;
      setForm({
        record_id: ed.id,
        exam_name: ed.name || '',
        base_price: ed.base_price || 0,
        exam_location: ed.location || '',
        exam_topic: ed.topic || '',
        exam_topic_id: ed.topic_id || 0,
        exam_code: ed.code || '',
        period: ed.period || 0,
        exam_type: ed.type || 0,
        exam_time: ed.time || 0,
        exam_time_2: ed.time_2 || 0,
        exam_time_3: ed.time_3 || 0,
        alipay_account: ed.alipay_account || 0,
      });
      setPriceChanges(resp.data.price_data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const resp = await editExam(form);
      if (resp.code === 200) {
        setSuccessMessage('Exam updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadInfo();
      } else {
        setError(resp.message || 'Failed to update exam');
      }
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleAddChange = async () => {
    const resp = await addChangePrice({ exam_id: form.record_id, ...newChange });
    if (resp.code === 200) {
      setNewChange({ change_price: 0, change_time: 0 });
      loadInfo();
    }
  };

  const handleUpdateChange = async () => {
    if (!editingChange) return;
    const resp = await updateChangePrice({
      record_id: editingChange.id,
      change_price: editingChange.price,
      change_time: editingChange.time,
    });
    if (resp.code === 200) {
      setEditingChange(null);
      loadInfo();
    }
  };

  const handleDeleteChange = async (id: number) => {
    await deleteChangePrice({ record_id: id });
    loadInfo();
  };

  const handleDeleteInner = async (id: number) => {
    await deleteInnerSignup({ record_id: id });
    loadInfo();
  };

  const handleDeletePublic = async (id: number) => {
    await deletePublicSignup({ record_id: id });
    loadInfo();
  };

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit exams</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Exam</h1>
              <p className="text-gray-600 mt-1">Modify exam details and settings</p>
            </div>
          </div>
        </div>

        {/* 错误和成功消息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* 基本信息表单 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            <p className="text-sm text-gray-600 mt-1">Configure the basic exam details</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="Enter exam name"
                    value={form.exam_name}
                    onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                  />
                  <ClipboardDocumentListIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="0.00"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                  />
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="Exam location"
                    value={form.exam_location}
                    onChange={(e) => setForm({ ...form, exam_location: e.target.value })}
                  />
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="Exam topic"
                    value={form.exam_topic}
                    onChange={(e) => setForm({ ...form, exam_topic: e.target.value })}
                  />
                  <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unique exam code"
                  value={form.exam_code}
                  onChange={(e) => setForm({ ...form, exam_code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Period"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 时间设置 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Schedule Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Configure exam timing and type</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type"
                  value={form.exam_type}
                  onChange={(e) => setForm({ ...form, exam_type: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time 1
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="Time"
                    value={form.exam_time}
                    onChange={(e) => setForm({ ...form, exam_time: Number(e.target.value) })}
                  />
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time 2
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="Time 2"
                    value={form.exam_time_2}
                    onChange={(e) => setForm({ ...form, exam_time_2: Number(e.target.value) })}
                  />
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time 3
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                    placeholder="Time 3"
                    value={form.exam_time_3}
                    onChange={(e) => setForm({ ...form, exam_time_3: Number(e.target.value) })}
                  />
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alipay Account
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Alipay Account"
                value={form.alipay_account}
                onChange={(e) => setForm({ ...form, alipay_account: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <DocumentCheckIcon className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* 价格变化管理 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-green-100 rounded">
                <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Price Changes</h2>
                <p className="text-sm text-gray-600 mt-1">Manage dynamic pricing for this exam</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 添加新价格变化 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Price Change</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                      placeholder="New price"
                      value={newChange.change_price}
                      onChange={(e) => setNewChange({ ...newChange, change_price: Number(e.target.value) })}
                    />
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                      placeholder="Time value"
                      value={newChange.change_time}
                      onChange={(e) => setNewChange({ ...newChange, change_time: Number(e.target.value) })}
                    />
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={handleAddChange}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
            </div>

            {/* 价格变化列表 */}
            {priceChanges.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Price Changes</h3>
                <p className="text-gray-500">No dynamic pricing has been set up for this exam</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priceChanges.map((pc) => (
                  <div key={pc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">Price: ${pc.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Time: {pc.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingChange && editingChange.id === pc.id ? (
                          <>
                            <button
                              onClick={handleUpdateChange}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              <PencilIcon className="w-3 h-3 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingChange(null)}
                              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingChange(pc)}
                              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                              title="Edit Price Change"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChange(pc.id)}
                              className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete Price Change"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingChange && editingChange.id === pc.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              New Price
                            </label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={editingChange.price}
                              onChange={(e) => setEditingChange({ ...editingChange, price: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              New Time
                            </label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={editingChange.time}
                              onChange={(e) => setEditingChange({ ...editingChange, time: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 学生管理 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 内学生列表 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <UserGroupIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Inner Students</h2>
                  <p className="text-sm text-gray-600 mt-1">Students from internal system</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {info?.inner_student_data?.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Inner Students</h3>
                  <p className="text-gray-500">No students from internal system are enrolled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {info?.inner_student_data?.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {s.student_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{s.student_name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteInner(s.id)}
                        className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove Student"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 外学生列表 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-green-100 rounded">
                  <UsersIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Public Students</h2>
                  <p className="text-sm text-gray-600 mt-1">Students from public registration</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {info?.outer_student_data?.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Public Students</h3>
                  <p className="text-gray-500">No students from public registration are enrolled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {info?.outer_student_data?.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{s.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeletePublic(s.id)}
                        className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove Student"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

