'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  addLeaveSchool,
  deleteLeaveSchool,
  editLeaveSchool,
  getLeaveSchool,
  getStudentList,
} from '@/services/auth';
import type { LeaveSchoolRecord, StudentInfo } from '@/services/auth';
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

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

const parseDateTextToYmd = (raw: string): string => {
  const text = (raw || '').trim();
  if (!text) return '';
  const m = text.match(/(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/);
  if (!m) return '';
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return '';
  if (mo < 1 || mo > 12) return '';
  if (d < 1 || d > 31) return '';
  const date = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (isNaN(date.getTime())) return '';
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return '';
  const mm = String(mo).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

function PasteableDateInput(props: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const { value, onChange, disabled, className, placeholder } = props;
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const normalized = text.trim() ? parseDateTextToYmd(text) : '';
  const isInvalid = Boolean(text.trim()) && !normalized;

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder || 'YYYY-MM-DD'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const v = text.trim();
            if (!v) {
              onChange('');
              setText('');
              return;
            }
            const ymd = parseDateTextToYmd(v);
            if (ymd) {
              onChange(ymd);
              setText(ymd);
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text');
            if (!pasted) return;
            e.preventDefault();
            const ymd = parseDateTextToYmd(pasted) || pasted.trim();
            setText(ymd);
            const normalizedPaste = parseDateTextToYmd(ymd);
            if (normalizedPaste) onChange(normalizedPaste);
          }}
          className={`${className || ''} pr-12 ${isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
          disabled={disabled}
        />
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
          <CalendarDaysIcon className="h-5 w-5" />
        </div>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              onChange(v);
              setText(v);
            } else {
              onChange('');
              setText('');
            }
          }}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 opacity-0 cursor-pointer"
          aria-label="打开日期选择器"
          tabIndex={disabled ? -1 : 0}
        />
      </div>
      {isInvalid && <p className="text-xs text-red-600">日期格式不正确，请输入 YYYY-MM-DD</p>}
    </div>
  );
}

export default function SuspensionManagementPage() {
  const { user, hasPermission } = useAuth();

  const canView = hasPermission(PERMISSIONS.VIEW_LEAVE_SCHOOL);
  const canEdit = hasPermission(PERMISSIONS.EDIT_LEAVE_SCHOOL);

  const [rows, setRows] = useState<LeaveSchoolRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [activeRow, setActiveRow] = useState<LeaveSchoolRecord | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRow, setDeletingRow] = useState<LeaveSchoolRecord | null>(null);

  // 表单字段（常用字段 + 额外JSON）
  const [formStudentId, setFormStudentId] = useState<number>(0);
  const [formLeaveStartDate, setFormLeaveStartDate] = useState<string>('');
  const [formLeaveEndDate, setFormLeaveEndDate] = useState<string>('');
  const [formLeaveReason, setFormLeaveReason] = useState<string>('');
  const [formRemark, setFormRemark] = useState<string>('');
  // 复学相关字段
  const [formIsReopened, setFormIsReopened] = useState<boolean>(false);
  const [formActualReopenDate, setFormActualReopenDate] = useState<string>('');
  const [formReapplyDate, setFormReapplyDate] = useState<string>('');

  // 学生搜索下拉
  const [studentOptions, setStudentOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRows = useMemo(() => {
    const p = Math.min(Math.max(1, currentPage), totalPages);
    const start = (p - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize, totalPages]);

  // 一次性拉取所有学生列表（用于本地搜索过滤）
  const loadAllStudents = async () => {
    try {
      setLoadingStudents(true);
      // disabled=1：包含停用学生
      const limit = 200;
      const maxPages = 200;
      const maxTotal = 5000; // 安全上限，避免异常导致无限/过大
      const map = new Map<number, string>();

      for (let page = 1; page <= maxPages; page++) {
        const res = await getStudentList({ page, limit, disabled: 1 });
        if (res.code !== 200) break;
        const listInfo = (res.data as any)?.list_info || [];
        if (!Array.isArray(listInfo) || listInfo.length === 0) break;

        for (const s of listInfo as StudentInfo[]) {
          if (typeof s?.student_id !== 'number') continue;
          const label = `${s.student_name} (ID: ${s.student_id})`;
          map.set(s.student_id, label);
          if (map.size >= maxTotal) break;
        }

        if (map.size >= maxTotal) break;
        if (listInfo.length < limit) break;
      }

      const formatted = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      // 按 id 倒序（更接近“新学生在前”，可按需调整）
      formatted.sort((a, b) => b.id - a.id);
      setStudentOptions(formatted);
      setStudentsLoaded(true);
    } catch (e) {
      console.error('加载学生列表失败:', e);
    } finally {
      setLoadingStudents(false);
    }
  };

  const openAdd = () => {
    setModalMode('add');
    setActiveRow(null);
    setFormStudentId(0);
    setFormLeaveStartDate('');
    setFormLeaveEndDate('');
    setFormLeaveReason('');
    setFormRemark('');
    setFormIsReopened(false);
    setFormActualReopenDate('');
    setFormReapplyDate('');
    setError(null);
    setSuccessMessage(null);
    setModalOpen(true);
    // 初次打开加载全量学生列表
    if (!studentsLoaded) loadAllStudents();
  };

  const openEdit = (row: LeaveSchoolRecord) => {
    setModalMode('edit');
    setActiveRow(row);
    const sid = row.student_id ? Number(row.student_id) : 0;
    setFormStudentId(Number.isFinite(sid) ? sid : 0);
    const start = row.leave_start_date || row.start_day || '';
    const end = row.leave_end_date || row.end_day || '';
    setFormLeaveStartDate(start ? String(start).slice(0, 10) : '');
    setFormLeaveEndDate(end ? String(end).slice(0, 10) : '');
    setFormLeaveReason(row.leave_reason ? String(row.leave_reason) : '');
    setFormRemark(row.remark ? String(row.remark) : (row.desc ? String(row.desc) : ''));
    // 复学相关字段
    const isReopened = row.is_reopened === true || row.is_reopened === 1;
    setFormIsReopened(isReopened);
    setFormActualReopenDate(row.actual_reopen_date ? String(row.actual_reopen_date).slice(0, 10) : '');
    setFormReapplyDate(row.reapply_date ? String(row.reapply_date).slice(0, 10) : '');
    setError(null);
    setSuccessMessage(null);
    setModalOpen(true);
    // 确保当前行学生能回显（即使不在当前 options 里）
    if (sid && !studentOptions.some(o => o.id === sid)) {
      const name = row.student_name ? `${row.student_name} (ID: ${sid})` : `ID: ${sid}`;
      setStudentOptions(prev => [{ id: sid, name }, ...prev]);
    }
    if (!studentsLoaded) loadAllStudents();
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

    if (modalMode === 'add') {
      if (!Number.isFinite(formStudentId) || formStudentId <= 0) {
        setError('请选择学生');
        return;
      }
    }

    if (!formLeaveStartDate) {
      setError('请填写 leave_start_date（开始日期）');
      return;
    }
    if (!formLeaveEndDate) {
      setError('请填写 leave_end_date（结束日期）');
      return;
    }
    if (formLeaveEndDate < formLeaveStartDate) {
      setError('leave_end_date 不能早于 leave_start_date');
      return;
    }
    if (!formLeaveReason.trim()) {
      setError('请填写 leave_reason（休复学原因）');
      return;
    }
    if (!formRemark.trim()) {
      setError('请填写 remark（备注）');
      return;
    }

    // 如果勾选了"已复学"，需要验证复学相关日期
    if (formIsReopened) {
      if (!formActualReopenDate) {
        setError('已勾选"已复学"，请填写实际复学时间');
        return;
      }
      if (!formReapplyDate) {
        setError('已勾选"已复学"，请填写复学时间');
        return;
      }
    }

    const basePayload: Record<string, unknown> = {
      leave_start_date: formLeaveStartDate,
      leave_end_date: formLeaveEndDate,
      leave_reason: formLeaveReason.trim(),
      remark: formRemark.trim(),
      is_reopened: formIsReopened ? 1 : 0,
    };

    // 新增时需要 student_id，编辑时不需要
    if (modalMode === 'add') {
      basePayload.student_id = formStudentId;
    }

    // 如果已复学，添加复学相关日期
    if (formIsReopened) {
      basePayload.actual_reopen_date = formActualReopenDate;
      basePayload.reapply_date = formReapplyDate;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (modalMode === 'add') {
        const res = await addLeaveSchool(basePayload as any);
        if (res.code !== 200) {
          setError(res.message || '新增休复学记录失败');
          return;
        }
        setSuccessMessage('新增成功');
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
        setSuccessMessage('保存成功');
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
    setSuccessMessage(null);
    try {
      const res = await deleteLeaveSchool({ record_id: recordId });
      if (res.code !== 200) {
        setError(res.message || '删除休复学记录失败');
        return;
      }
      setShowDeleteModal(false);
      setDeletingRow(null);
      setSuccessMessage('删除成功');
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
            <h1 className="text-3xl font-bold text-gray-900">休复学管理</h1>
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
          {successMessage && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm border border-green-200 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {successMessage}
            </div>
          )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结束日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">是否已复学</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">复学时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实际复学时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">休复学原因</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-10 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const rid = getRowId(row);
                      const start = row.leave_start_date || row.start_day;
                      const end = row.leave_end_date || row.end_day;
                      const isReopened = row.is_reopened === true || row.is_reopened === 1;
                      const reapplyDate = row.reapply_date ? String(row.reapply_date).slice(0, 10) : '-';
                      const actualReopenDate = row.actual_reopen_date ? String(row.actual_reopen_date).slice(0, 10) : '-';
                      const remarkText = row.remark ? safeString(row.remark) : (row.desc ? safeString(row.desc) : '-');
                      return (
                        <tr key={rid ?? idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.student_id ?? '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.student_name ?? '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{start ? String(start).slice(0, 10) : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{end ? String(end).slice(0, 10) : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isReopened ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                已复学
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                未复学
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reapplyDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{actualReopenDate}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-[14rem] truncate" title={safeString(row.leave_reason)}>
                            {row.leave_reason ? safeString(row.leave_reason) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 min-w-[12rem] max-w-[24rem] break-words" title={remarkText}>
                            {remarkText}
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

        {/* 分页 */}
        {!loading && totalItems > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                显示第{' '}
                <span className="font-medium text-gray-900">
                  {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
                </span>
                {' - '}
                <span className="font-medium text-gray-900">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>
                {' 条，共 '}
                <span className="font-medium text-gray-900">{totalItems}</span> 条记录
              </div>
              <div className="flex items-center gap-3 justify-end">
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setPageSize(Number.isFinite(n) && n > 0 ? n : 10);
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={String(n)}>
                      {n} / 页
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <div className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
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
              {modalMode === 'add' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学生 <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={studentOptions}
                      value={formStudentId}
                      onValueChange={(val) => setFormStudentId(Number(val) || 0)}
                      placeholder={loadingStudents ? '加载中...' : '搜索并选择学生'}
                      searchPlaceholder="输入姓名或ID搜索..."
                      disabled={loadingStudents || loading}
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">输入姓名或ID可搜索（包含停用学生）</p>
                  </div>
                </div>
              )}
              {modalMode === 'edit' && activeRow && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">学生</label>
                      <div className="text-sm text-gray-900">
                        {activeRow.student_name ? `${activeRow.student_name} (ID: ${activeRow.student_id ?? '-'})` : `ID: ${activeRow.student_id ?? '-'}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">休学开始日期 <span className="text-red-500">*</span></label>
                  <PasteableDateInput
                    value={formLeaveStartDate}
                    onChange={setFormLeaveStartDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">休学结束日期 <span className="text-red-500">*</span></label>
                  <PasteableDateInput
                    value={formLeaveEndDate}
                    onChange={setFormLeaveEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">休复学原因 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formLeaveReason}
                  onChange={(e) => setFormLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入休复学原因"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注 <span className="text-red-500">*</span></label>
                <textarea
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入备注"
                  disabled={loading}
                />
              </div>

              {/* 复学相关字段 */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="is_reopened"
                    checked={formIsReopened}
                    onChange={(e) => {
                      setFormIsReopened(e.target.checked);
                      if (!e.target.checked) {
                        setFormActualReopenDate('');
                        setFormReapplyDate('');
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="is_reopened" className="ml-2 block text-sm font-medium text-gray-700">
                    是否已复学
                  </label>
                </div>

                {formIsReopened && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        复学时间 <span className="text-red-500">*</span>
                      </label>
                      <PasteableDateInput
                        value={formReapplyDate}
                        onChange={setFormReapplyDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        实际复学时间 <span className="text-red-500">*</span>
                      </label>
                      <PasteableDateInput
                        value={formActualReopenDate}
                        onChange={setFormActualReopenDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
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



