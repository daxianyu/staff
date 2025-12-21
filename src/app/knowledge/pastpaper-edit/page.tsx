'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  deletePastpaper,
  editPastpaperSubject,
  getAllPastpaperSelect,
  getPastpaperTable,
  type PastpaperAllSelectData,
  type PastpaperTableRow,
} from '@/services/auth';

type AnyRecord = Record<string, any>;

function normalizeTableRows(raw: any): AnyRecord[] {
  if (Array.isArray(raw)) return raw as AnyRecord[];
  if (Array.isArray(raw?.list)) return raw.list as AnyRecord[];
  if (Array.isArray(raw?.data)) return raw.data as AnyRecord[];
  if (Array.isArray(raw?.table)) return raw.table as AnyRecord[];
  if (Array.isArray(raw?.rows)) return raw.rows as AnyRecord[];
  return [];
}

export default function PastpaperEditPage() {
  const { user, hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_PASTPAPER_EDIT);
  const canEdit = hasPermission(PERMISSIONS.EDIT_PASTPAPER_EDIT);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectData, setSelectData] = useState<PastpaperAllSelectData | null>(null);
  const [rows, setRows] = useState<PastpaperTableRow[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  // 批量选择/删除
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // 查询参数
  const [qRoot, setQRoot] = useState('');
  const [qSecond, setQSecond] = useState<string>('-1');
  const [qSubject, setQSubject] = useState<string>('-1');
  const [qYear, setQYear] = useState<string>('-1');
  const [qSeason, setQSeason] = useState<string>('-1');

  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editingRow, setEditingRow] = useState<AnyRecord | null>(null);
  const [editSubjectText, setEditSubjectText] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRow, setDeletingRow] = useState<AnyRecord | null>(null);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  const loadSelects = useCallback(async () => {
    setLoading(true);
    clearAlerts();
    try {
      const resp = await getAllPastpaperSelect();
      if (resp.code !== 200 || !resp.data) {
        setError(resp.message || '加载下拉选项失败');
        setSelectData(null);
        return;
      }
      setSelectData(resp.data);
    } catch (e) {
      console.error(e);
      setError('加载下拉选项失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTable = useCallback(async (params: { root: string; second: string; subject: string; year: string; season: string }) => {
    setLoading(true);
    clearAlerts();
    try {
      const resp = await getPastpaperTable({
        root: params.root,
        second: params.second,
        subject: params.subject,
        year: params.year,
        season: params.season,
      });
      if (resp.code !== 200) {
        setError(resp.message || '加载表格失败');
        setRows([]);
        return;
      }
      setRows((resp.data?.rows ?? []) as PastpaperTableRow[]);
    } catch (e) {
      console.error(e);
      setError('加载表格失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    loadSelects();
  }, [canView, loadSelects]);

  const visibleRows = useMemo(() => {
    if (!searchTerm) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, searchTerm]);

  // 过滤变化/数据刷新后，清空选择，避免误删
  useEffect(() => {
    setSelectedIds([]);
  }, [qRoot, qSecond, qSubject, qYear, qSeason, searchTerm, rows.length]);

  const tableColumns = useMemo(() => {
    // 固定列（按需求）
    return ['root', 'second', 'subject', 'year', 'season', 'level', 'file_name'];
  }, []);

  const columnLabelMap: Record<string, string> = useMemo(() => ({
    root: '根目录',
    second: '二级目录',
    subject: 'Subject',
    year: 'year',
    season: 'season',
    level: 'level',
    file_name: 'file_name',
  }), []);

  const rootOptions = useMemo(() => Object.keys(selectData?.cascade_info ?? {}), [selectData]);

  const qSecondOptions = useMemo(() => {
    if (!selectData || !qRoot) return [];
    return Object.keys(selectData.cascade_info[qRoot] ?? {});
  }, [selectData, qRoot]);
  const qSubjectOptions = useMemo(() => {
    if (!selectData || !qRoot || qSecond === '-1') return [];
    return selectData.cascade_info[qRoot]?.[qSecond] ?? [];
  }, [selectData, qRoot, qSecond]);

  // 条件变化后自动查询（root 为空时不查）
  useEffect(() => {
    if (!canView) return;
    if (!qRoot) {
      setRows([]);
      return;
    }
    loadTable({ root: qRoot, second: qSecond, subject: qSubject, year: qYear, season: qSeason });
  }, [canView, qRoot, qSecond, qSubject, qYear, qSeason, loadTable]);

  const openEditSubject = (row: AnyRecord) => {
    setEditingRow(row);
    setEditSubjectText(String(row.subject ?? ''));
    setShowEditSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    if (!canEdit || !editingRow) return;
    const subjectText = editSubjectText.trim();
    if (!subjectText) {
      setError('请输入新的 subject');
      return;
    }
    setLoading(true);
    clearAlerts();
    try {
      const recordId = Number(editingRow.record_id ?? editingRow.id);
      const resp = await editPastpaperSubject({ record_id: recordId, subject_new: subjectText });
      if (resp.code !== 200) {
        setError(resp.message || '保存失败');
        return;
      }
      setSuccess('保存成功');
      setShowEditSubjectModal(false);
      setEditingRow(null);
      if (qRoot) {
        await loadTable({ root: qRoot, second: qSecond, subject: qSubject, year: qYear, season: qSeason });
      }
    } catch (e) {
      console.error(e);
      setError('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const openDelete = (row: AnyRecord) => {
    setDeletingRow(row);
    setShowDeleteModal(true);
  };

  const visibleRecordIds = useMemo(() => {
    return visibleRows
      .map(r => Number((r as any).record_id ?? (r as any).id))
      .filter(n => Number.isFinite(n));
  }, [visibleRows]);

  const allVisibleSelected = useMemo(() => {
    if (visibleRecordIds.length === 0) return false;
    return visibleRecordIds.every(id => selectedIds.includes(id));
  }, [visibleRecordIds, selectedIds]);

  const someVisibleSelected = useMemo(() => {
    if (visibleRecordIds.length === 0) return false;
    return visibleRecordIds.some(id => selectedIds.includes(id));
  }, [visibleRecordIds, selectedIds]);

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleRecordIds.includes(id)));
      return;
    }
    setSelectedIds(prev => Array.from(new Set([...prev, ...visibleRecordIds])));
  };

  const toggleRowSelected = (recordId: number) => {
    setSelectedIds(prev => (prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]));
  };

  const handleBatchDelete = async () => {
    if (!canEdit) return;
    if (selectedIds.length === 0) return;
    setLoading(true);
    clearAlerts();
    try {
      const resp = await deletePastpaper({ record_ids: selectedIds });
      if (resp.code !== 200) {
        setError(resp.message || '批量删除失败');
        return;
      }
      setSuccess('批量删除成功');
      setShowBatchDeleteModal(false);
      setSelectedIds([]);
      // 删除后表格会因现有条件自动查询；这里也可主动触发一次以更快刷新
      if (qRoot) {
        await loadTable({ root: qRoot, second: qSecond, subject: qSubject, year: qYear, season: qSeason });
      }
    } catch (e) {
      console.error(e);
      setError('批量删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit || !deletingRow) return;
    setLoading(true);
    clearAlerts();
    try {
      const recordId = Number(deletingRow.record_id ?? deletingRow.id);
      const resp = await deletePastpaper({ record_ids: [recordId] });
      if (resp.code !== 200) {
        setError(resp.message || '删除失败');
        return;
      }
      setSuccess('删除成功');
      setShowDeleteModal(false);
      setDeletingRow(null);
      if (qRoot) {
        await loadTable({ root: qRoot, second: qSecond, subject: qSubject, year: qYear, season: qSeason });
      }
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
          <p className="text-gray-600">你没有访问 Pastpaper Edit 的权限（需要 subject_leader 或 core_user）。</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Library Edit</h1>
          </div>
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">根目录</label>
                <select
                  value={qRoot}
                  onChange={(e) => {
                    setQRoot(e.target.value);
                    // root 改变：清空后续所有条件
                    setQSecond('-1');
                    setQSubject('-1');
                    setQYear('-1');
                    setQSeason('-1');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择...</option>
                  {rootOptions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">二级目录</label>
                <select
                  value={qSecond}
                  onChange={(e) => {
                    setQSecond(e.target.value);
                    // second 改变：清空后续所有条件
                    setQSubject('-1');
                    setQYear('-1');
                    setQSeason('-1');
                  }}
                  disabled={!qRoot}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="-1">全部</option>
                  {qSecondOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">subject</label>
                <select
                  value={qSubject}
                  onChange={(e) => {
                    setQSubject(e.target.value);
                    // subject 改变：清空后续所有条件
                    setQYear('-1');
                    setQSeason('-1');
                  }}
                  disabled={!qRoot || qSecond === '-1'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="-1">全部</option>
                  {qSubjectOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">year</label>
                <select
                  value={qYear}
                  onChange={(e) => {
                    setQYear(e.target.value);
                    // year 改变：清空后续所有条件
                    setQSeason('-1');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="-1">全部</option>
                  {(selectData?.year_list ?? []).map(y => (
                    <option key={String(y)} value={String(y)}>{String(y)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">season</label>
                <select
                  value={qSeason}
                  onChange={(e) => setQSeason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="-1">全部</option>
                  {(selectData?.season_list ?? []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="hidden sm:block text-sm text-gray-500">
                条件变化后自动查询
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:ml-auto w-full sm:w-auto">
                <button
                  onClick={() => setShowBatchDeleteModal(true)}
                  disabled={!canEdit || selectedIds.length === 0 || loading}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  批量删除（已选 {selectedIds.length}）
                </button>
              <div className="relative w-full sm:w-1/2 sm:max-w-none sm:ml-auto">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索表格..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              </div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (!el) return;
                          el.indeterminate = !allVisibleSelected && someVisibleSelected;
                        }}
                        onChange={toggleSelectAllVisible}
                      />
                    </th>
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
                      <td colSpan={tableColumns.length + 2} className="px-4 py-10 text-center text-sm text-gray-500">
                        {qRoot ? '暂无数据' : '请先选择条件'}
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row, idx) => (
                      <tr key={(row as any).record_id ?? (row as any).id ?? idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {(() => {
                            const rid = Number((row as any).record_id ?? (row as any).id);
                            if (!Number.isFinite(rid)) return null;
                            return (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(rid)}
                                onChange={() => toggleRowSelected(rid)}
                              />
                            );
                          })()}
                        </td>
                        {tableColumns.map(col => (
                          <td key={col} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {(() => {
                              const v = (row as any)[col];
                              return v === undefined || v === null || v === '' ? '-' : String(v);
                            })()}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditSubject(row)}
                              disabled={!canEdit}
                              className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              title="编辑 subject"
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

      {/* 编辑 Subject Modal */}
      {showEditSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">编辑 Subject</h3>
              <button onClick={() => setShowEditSubjectModal(false)} aria-label="close">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="text-sm text-gray-600">
                record_id：<span className="font-medium text-gray-900">{String((editingRow as any)?.record_id ?? (editingRow as any)?.id ?? '-')}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">subject_new</label>
                <input
                  value={editSubjectText}
                  onChange={(e) => setEditSubjectText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Math / English..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEditSubjectModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveSubject}
                disabled={!canEdit || loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 Modal */}
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
                      删除后无法恢复。确定要删除这条记录吗？
                    </p>
                    <p className="text-xs text-gray-400 mt-2 break-all">
                      id: {String(deletingRow?.id ?? deletingRow?.record_id ?? '-')}
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

      {/* 批量删除确认 Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-5">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">确认批量删除</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      将删除选中的 <span className="font-semibold">{selectedIds.length}</span> 条记录，删除后无法恢复。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={handleBatchDelete}
                disabled={!canEdit || loading || selectedIds.length === 0}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                删除
              </button>
              <button
                onClick={() => setShowBatchDeleteModal(false)}
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


