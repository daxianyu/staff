'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  addLeaveSchool,
  deleteLeaveSchool,
  editLeaveSchool,
  getLeaveSchool,
} from '@/services/auth';
import type { LeaveSchoolRecord } from '@/services/auth';
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ModalMode = 'add' | 'edit';

const getRowId = (row: LeaveSchoolRecord | null | undefined): number | null => {
  if (!row) return null;
  const raw = (row as any).record_id ?? (row as any).id ?? (row as any).leave_school_id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export default function SuspensionManagementPage() {
  const { user, hasPermission } = useAuth();

  const canView = hasPermission(PERMISSIONS.VIEW_LEAVE_SCHOOL);
  const canEdit = hasPermission(PERMISSIONS.EDIT_LEAVE_SCHOOL);

  const [rows, setRows] = useState<LeaveSchoolRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [activeRow, setActiveRow] = useState<LeaveSchoolRecord | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRow, setDeletingRow] = useState<LeaveSchoolRecord | null>(null);

  // 表单字段（常用字段 + 额外JSON）
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formStartDay, setFormStartDay] = useState<string>('');
  const [formEndDay, setFormEndDay] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formExtraJson, setFormExtraJson] = useState<string>('{}');

  const extraJsonResult = useMemo(() => {
    const raw = formExtraJson.trim();
    if (!raw) {
      return { obj: {} as Record<string, unknown>, error: null as string | null };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { obj: parsed as Record<string, unknown>, error: null as string | null };
      }
      return { obj: null as any, error: '额外字段必须是 JSON 对象（{}）' };
    } catch (e) {
      return { obj: null as any, error: e instanceof Error ? e.message : 'JSON 解析失败' };
    }
  }, [formExtraJson]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaveSchool();
      if (res.code !== 200) {
        setError(res.message || '获取休复学记录失败');
        setRows([]);
        return;
      }
      const list = res.data?.rows ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取休复学记录失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => safeString(r).toLowerCase().includes(q));
  }, [rows, searchTerm]);

  const openAdd = () => {
    setModalMode('add');
    setActiveRow(null);
    setFormStudentId('');
    setFormStartDay('');
    setFormEndDay('');
    setFormDesc('');
    setFormExtraJson('{}');
    setModalOpen(true);
  };

  const openEdit = (row: LeaveSchoolRecord) => {
    setModalMode('edit');
    setActiveRow(row);
    setFormStudentId(row.student_id !== undefined ? String(row.student_id) : '');
    setFormStartDay(row.start_day ? String(row.start_day).slice(0, 10) : '');
    setFormEndDay(row.end_day ? String(row.end_day).slice(0, 10) : '');
    setFormDesc(row.desc ? String(row.desc) : '');
    setFormExtraJson('{}');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const openDelete = (row: LeaveSchoolRecord) => {
    setDeletingRow(row);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!canEdit) return;

    const studentIdNum = Number(formStudentId);
    if (!Number.isFinite(studentIdNum) || studentIdNum <= 0) {
      setError('student_id 必须是有效数字');
      return;
    }

    if (extraJsonResult.error || !extraJsonResult.obj) return;

    const basePayload: Record<string, unknown> = {
      student_id: studentIdNum,
      ...(formStartDay ? { start_day: formStartDay } : {}),
      ...(formEndDay ? { end_day: formEndDay } : {}),
      ...(formDesc ? { desc: formDesc } : {}),
      ...extraJsonResult.obj,
    };

    setLoading(true);
    setError(null);
    try {
      if (modalMode === 'add') {
        const res = await addLeaveSchool(basePayload as any);
        if (res.code !== 200) {
          setError(res.message || '新增休复学记录失败');
          return;
        }
      } else {
        const recordId = getRowId(activeRow);
        if (!recordId) {
          setError('未找到 record_id，无法编辑');
          return;
        }
        const res = await editLeaveSchool({ ...(basePayload as any), record_id: recordId });
        if (res.code !== 200) {
          setError(res.message || '编辑休复学记录失败');
          return;
        }
      }

      closeModal();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;

    const recordId = getRowId(deletingRow);
    if (!recordId) {
      setError('未找到 record_id，无法删除');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deleteLeaveSchool({ record_id: recordId });
      if (res.code !== 200) {
        setError(res.message || '删除休复学记录失败');
        return;
      }
      setShowDeleteModal(false);
      setDeletingRow(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">
            你没有访问休复学(suspension)管理的权限（需要 tool_user=真 或 core_user=真）。
          </p>
          <p className="mt-2 text-xs text-gray-400 break-all">
            当前用户：{user?.name ?? '-'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题 */}
        <div className="mb-6">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Suspension Management</h1>
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:max-w-md relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜索（支持任意字段模糊匹配）"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-full sm:w-auto flex gap-3 justify-end">
              <button
                onClick={loadData}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                刷新
              </button>
              <button
                onClick={openAdd}
                disabled={!canEdit || loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                新增记录
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">student_name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">start_day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">end_day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">desc</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => {
                      const rid = getRowId(row);
                      return (
                        <tr key={rid ?? idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.student_name ?? '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.start_day ? String(row.start_day).slice(0, 10) : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.end_day ? String(row.end_day).slice(0, 10) : '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-[18rem] truncate" title={safeString(row.desc)}>
                            {row.desc ? safeString(row.desc) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEdit(row)}
                                disabled={!canEdit}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center disabled:opacity-50"
                                title="编辑"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDelete(row)}
                                disabled={!canEdit}
                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center disabled:opacity-50"
                                title="删除"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === 'add' ? '新增休复学记录' : '编辑休复学记录'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">student_id *</label>
                  <input
                    type="number"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：12345"
                  />
                </div>
                <div className="text-xs text-gray-500 flex items-end">
                  <div className="w-full">
                    record_id: <span className="text-gray-900">{modalMode === 'edit' ? (getRowId(activeRow) ?? '-') : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">start_day</label>
                  <input
                    type="date"
                    value={formStartDay}
                    onChange={(e) => setFormStartDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">end_day</label>
                  <input
                    type="date"
                    value={formEndDay}
                    onChange={(e) => setFormEndDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">desc</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="备注/原因（如果后端字段不同，可填到额外JSON里）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">额外字段（JSON对象）</label>
                <textarea
                  value={formExtraJson}
                  onChange={(e) => setFormExtraJson(e.target.value)}
                  rows={6}
                  className="w-full font-mono text-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder='例如：{"leave_type":1,"reason":"..."}'
                />
                {extraJsonResult.error && (
                  <p className="mt-2 text-sm text-red-600">{extraJsonResult.error}</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!canEdit || loading || !!extraJsonResult.error}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-5">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">确认删除</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">删除后无法恢复。确定要删除该休复学记录吗？</p>
                    <p className="text-xs text-gray-400 mt-2 break-all">
                      record_id: {String(getRowId(deletingRow) ?? '-')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={handleDelete}
                disabled={!canEdit || loading}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                删除
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


