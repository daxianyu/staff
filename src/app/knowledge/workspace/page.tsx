'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  addWorkspace,
  deleteWorkspaceRecord,
  editWorkspace,
  getAllWorkspace,
  getWorkspaceSelect,
  type SelectOption,
} from '@/services/auth';

type AnyRecord = Record<string, any>;

function normalizeSelectOptions(raw: any): SelectOption[] {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.list) ? raw.list : [];
  return (arr || [])
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === 'object') {
        if (typeof item.id === 'number' && typeof item.name === 'string') return item as SelectOption;
        if (item.value !== undefined && item.label !== undefined) {
          const id = Number(item.value);
          return Number.isFinite(id) ? ({ id, name: String(item.label) } as SelectOption) : null;
        }
        if (item.workspace_id !== undefined && item.name !== undefined) {
          const id = Number(item.workspace_id);
          return Number.isFinite(id) ? ({ id, name: String(item.name) } as SelectOption) : null;
        }
      }
      return null;
    })
    .filter(Boolean) as SelectOption[];
}

function normalizeWorkspaceRows(raw: any): AnyRecord[] {
  if (Array.isArray(raw)) return raw as AnyRecord[];
  if (Array.isArray(raw?.list)) return raw.list as AnyRecord[];
  if (Array.isArray(raw?.data)) return raw.data as AnyRecord[];
  if (Array.isArray(raw?.rows)) return raw.rows as AnyRecord[];
  return [];
}

export default function WorkspacePage() {
  const { user, hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_WORKSPACE);
  const canEdit = hasPermission(PERMISSIONS.EDIT_WORKSPACE);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [workspaceSelect, setWorkspaceSelect] = useState<SelectOption[]>([]);
  const [rows, setRows] = useState<AnyRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  // 父级必选：0 表示“顶层空间”
  const [newParentId, setNewParentId] = useState<number>(0);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<AnyRecord | null>(null);
  const [editSpaceName, setEditSpaceName] = useState('');
  const [editWeight, setEditWeight] = useState<number | ''>('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRow, setDeletingRow] = useState<AnyRecord | null>(null);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    clearAlerts();
    try {
      const [selResp, listResp] = await Promise.all([getWorkspaceSelect(), getAllWorkspace()]);

      if (selResp.code === 200) {
        setWorkspaceSelect(normalizeSelectOptions(selResp.data));
      } else {
        setWorkspaceSelect([]);
      }

      if (listResp.code === 200) {
        setRows(normalizeWorkspaceRows(listResp.data));
      } else {
        setRows([]);
        setError(listResp.message || '获取 workspace 列表失败');
      }
    } catch (e) {
      console.error(e);
      setError('加载 workspace 失败');
      setRows([]);
      setWorkspaceSelect([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    loadData();
  }, [canView, loadData]);

  const visibleRows = useMemo(() => {
    if (!searchTerm) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, searchTerm]);

  // 固定列（更稳定的展示）
  const tableColumns = useMemo(() => {
    return ['record_id', 'space_name', 'parent_name', 'weight'];
  }, []);

  const columnLabelMap: Record<string, string> = useMemo(() => ({
    record_id: 'ID',
    space_name: 'Workspace',
    parent_name: '父级',
    weight: '权重',
  }), []);

  const handleAdd = async () => {
    if (!canEdit) return;
    const space_name = newSpaceName.trim();
    if (!space_name) {
      setError('请输入 workspace 名称');
      return;
    }
    if (newParentId === undefined || newParentId === null) {
      setError('请选择父级');
      return;
    }
    setLoading(true);
    clearAlerts();
    try {
      const resp = await addWorkspace({
        space_name,
        parent_id: newParentId,
      });
      if (resp.code !== 200) {
        setError(resp.message || '添加失败');
        return;
      }
      setSuccess('添加成功');
      setShowAddModal(false);
      setNewSpaceName('');
      setNewParentId(0);
      await loadData();
    } catch (e) {
      console.error(e);
      setError('添加失败');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (row: AnyRecord) => {
    setEditingRow(row);
    setEditSpaceName(String(row.space_name ?? row.name ?? ''));
    const w = row.weight;
    const nw = Number(w);
    setEditWeight(Number.isFinite(nw) ? nw : '');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!canEdit || !editingRow) return;
    const space_name = editSpaceName.trim();
    if (!space_name) {
      setError('请输入 workspace 名称');
      return;
    }
    setLoading(true);
    clearAlerts();
    try {
      const record_id = Number(editingRow.record_id ?? editingRow.id ?? editingRow.workspace_id);
      const resp = await editWorkspace({
        record_id,
        space_name,
        ...(editWeight !== '' ? { weight: editWeight } : {}),
      });
      if (resp.code !== 200) {
        setError(resp.message || '编辑失败');
        return;
      }
      setSuccess('编辑成功');
      setShowEditModal(false);
      setEditingRow(null);
      await loadData();
    } catch (e) {
      console.error(e);
      setError('编辑失败');
    } finally {
      setLoading(false);
    }
  };

  const openDelete = (row: AnyRecord) => {
    setDeletingRow(row);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!canEdit || !deletingRow) return;
    setLoading(true);
    clearAlerts();
    try {
      const record_id = Number(deletingRow.record_id ?? deletingRow.id ?? deletingRow.workspace_id);
      const resp = await deleteWorkspaceRecord({ record_id });
      if (resp.code !== 200) {
        setError(resp.message || '删除失败');
        return;
      }
      setSuccess('删除成功');
      setShowDeleteModal(false);
      setDeletingRow(null);
      await loadData();
    } catch (e) {
      console.error(e);
      setError('删除失败');
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">你没有访问 Workspace 的权限（需要 operation_right=25 或 core_user）。</p>
          <p className="text-xs text-gray-400 mt-3">当前用户：{user?.name ?? '-'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace Manage</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <PlusCircleIcon className="h-5 w-5" />
            添加 Workspace
          </button>
        </div>

        {(error || success) && (
          <div className={`rounded-lg p-4 mb-6 border ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${error ? 'text-red-500' : 'text-green-600'}`} />
              <div className={`${error ? 'text-red-700' : 'text-green-700'} text-sm`}>
                {error || success}
              </div>
              <button className="ml-auto" onClick={clearAlerts} aria-label="close">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="text-sm text-gray-600">
              共 {rows.length} 条记录
            </div>

            <div className="relative w-full lg:w-1/2 lg:max-w-none lg:ml-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索 workspace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {tableColumns.map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {columnLabelMap[col] ?? col}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={tableColumns.length + 1} className="px-4 py-10 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row, idx) => (
                      <tr key={row.id ?? row.workspace_id ?? idx} className="hover:bg-gray-50 transition-colors">
                        {tableColumns.map(col => (
                          <td key={col} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {(row as any)[col] === undefined || (row as any)[col] === null || (row as any)[col] === '' ? '-' : String((row as any)[col])}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEdit(row)}
                              disabled={!canEdit}
                              className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              title="编辑"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openDelete(row)}
                              disabled={!canEdit}
                              className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                              title="删除"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">添加 Workspace</h3>
              <button onClick={() => setShowAddModal(false)} aria-label="close">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">父级</label>
                <select
                  value={String(newParentId)}
                  onChange={(e) => setNewParentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">顶层空间</option>
                  {workspaceSelect.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">空间名称</label>
                <input
                  value={newSpaceName}
                  placeholder="请输入名称"
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!canEdit || loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">编辑 Workspace</h3>
              <button onClick={() => setShowEditModal(false)} aria-label="close">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  value={editSpaceName}
                  onChange={(e) => setEditSpaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">权重（可选）</label>
                <input
                  type="number"
                  value={editWeight === '' ? '' : String(editWeight)}
                  onChange={(e) => setEditWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                disabled={!canEdit || loading}
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
                    <p className="text-sm text-gray-600">
                      删除后无法恢复。确定要删除该 workspace 吗？
                    </p>
                    <p className="text-xs text-gray-400 mt-2 break-all">
                      record_id: {String(deletingRow?.record_id ?? deletingRow?.id ?? deletingRow?.workspace_id ?? '-')}
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


