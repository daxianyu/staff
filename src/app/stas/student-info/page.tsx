'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getAllStudents, type AllStudentRow } from '@/services/auth';
import { ExcelExporter } from '@/components/ExcelExporter';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

/**
 * 与 phy handler get_all_students 返回字段对齐：裸 id / 原始 gender 与带 _name 的展示列重复，不在表中重复展示。
 */
const HIDDEN_COLUMN_KEYS_LOWER = new Set([
  'gender',
  'mentor_id',
  'campus_id',
  'assigned_staff',
]);

/** 优先列顺序（其余字段按字母表排在后面，避免纯字典序把 id、姓名打散） */
const COLUMN_ORDER: string[] = [
  'id',
  'student_name',
  'gender_name',
  'campus_name',
  'mentor_name',
  'email',
  'active',
  'inner_student',
  'year_fee',
  'birthday',
  'enrolment_date',
  'graduation_date',
  'day_student',
  'student_long_id',
  'leave_flag',
  'paid_flag',
  'stop_reason',
  'suspend_reason',
  'suspend_comment',
  'assigned_staff_name',
];

/** 表头中文说明（未知列仍显示后端字段名） */
const COLUMN_LABEL_ZH: Record<string, string> = {
  id: '学生ID',
  student_name: '姓名',
  gender_name: '性别',
  campus_name: '校区',
  mentor_name: '导师',
  email: '邮箱',
  active: '账号状态',
  inner_student: '学生类型',
  year_fee: '学年费用',
  birthday: '生日',
  enrolment_date: '入学日期',
  graduation_date: '毕业日期',
  day_student: '住校/走读',
  student_long_id: '长学号',
  leave_flag: '休复学',
  paid_flag: '本学年缴费',
  stop_reason: '停用原因',
  suspend_reason: '暂缓原因',
  suspend_comment: '暂缓备注',
  assigned_staff_name: '招生负责人',
};

function collectColumnKeys(rows: AllStudentRow[]): string[] {
  const canonicalByLower = new Map<string, string>();
  for (const row of rows) {
    for (const k of Object.keys(row || {})) {
      const low = k.toLowerCase();
      if (HIDDEN_COLUMN_KEYS_LOWER.has(low)) continue;
      if (!canonicalByLower.has(low)) canonicalByLower.set(low, k);
    }
  }

  const ordered: string[] = [];
  const usedLower = new Set<string>();
  for (const pref of COLUMN_ORDER) {
    const low = pref.toLowerCase();
    const actual = canonicalByLower.get(low);
    if (actual !== undefined) {
      ordered.push(actual);
      usedLower.add(low);
    }
  }

  const rest: string[] = [];
  canonicalByLower.forEach((actual, low) => {
    if (!usedLower.has(low)) rest.push(actual);
  });
  rest.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return [...ordered, ...rest];
}

function headerLabel(columnKey: string): string {
  const low = columnKey.toLowerCase();
  for (const [k, zh] of Object.entries(COLUMN_LABEL_ZH)) {
    if (k.toLowerCase() === low) return zh;
  }
  return columnKey;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** 与后端 utils.enums.GENDER_DICT 一致：0 男、1 女；2 未设置 */
function formatGenderDisplay(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return formatCell(v);
  const s = String(v).trim();
  if (s === '男' || s === '女') return s;
  const lower = s.toLowerCase();
  if (lower === 'm' || lower === 'male') return '男';
  if (lower === 'f' || lower === 'female') return '女';
  if (s === '0' || s === '1' || s === '2') {
    if (s === '0') return '男';
    if (s === '1') return '女';
    return '未知';
  }
  const n = Number(s);
  if (Number.isFinite(n)) {
    if (n === 0) return '男';
    if (n === 1) return '女';
    if (n === 2) return '未知';
  }
  return s;
}

function formatPaidFlagDisplay(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  const s = String(v).trim();
  if (s === '1' || s === 'true') return '已缴';
  if (s === '0' || s === 'false') return '未缴';
  const n = Number(s);
  if (n === 1) return '已缴';
  if (n === 0) return '未缴';
  return s;
}

function formatDisplayCell(columnKey: string, v: unknown): string {
  const low = columnKey.toLowerCase();
  if (low === 'gender') return formatGenderDisplay(v);
  if (low === 'paid_flag') return formatPaidFlagDisplay(v);
  return formatCell(v);
}

export default function StudentInfoPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_STUDENT_INFO);

  const [items, setItems] = useState<AllStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await getAllStudents();
      if (res.code === 200 && res.data) {
        setItems(res.data);
      } else {
        setItems([]);
        setErrorMessage(res.message || '加载失败');
      }
    } catch (e) {
      setItems([]);
      setErrorMessage(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const columnKeys = useMemo(() => collectColumnKeys(items), [items]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      columnKeys.some((k) => formatDisplayCell(k, row[k]).toLowerCase().includes(q))
    );
  }, [items, columnKeys, searchTerm]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const excelConfig = useMemo(() => {
    if (!columnKeys.length) {
      return {
        filename: 'student_info',
        sheets: [{ name: 'Students', headers: ['说明'], data: [['无可用列']] }],
      };
    }
    const headers = columnKeys.map((k) => headerLabel(k));
    const data = filteredItems.map((row) =>
      columnKeys.map((k) => formatDisplayCell(k, row[k]))
    );
    return {
      filename: 'student_info',
      sheets: [{ name: 'Students', headers, data }],
    };
  }, [columnKeys, filteredItems]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Info</h1>
          <p className="text-gray-600 mt-1">全体学生信息（需 operation_right 含 27 或 core）</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <ExcelExporter
                config={excelConfig}
                disabled={loading || items.length === 0}
                className="text-sm font-medium"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                导出 Excel（当前筛选）
              </ExcelExporter>
              <button
                type="button"
                onClick={() => loadData()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                刷新
              </button>
            </div>
          </div>
          {errorMessage ? (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          ) : null}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columnKeys.map((k) => (
                      <th
                        key={k}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap"
                        title={k}
                      >
                        {headerLabel(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(1, columnKeys.length)}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {columnKeys.map((k) => (
                          <td key={k} className="px-3 py-2 text-gray-800 max-w-xs truncate">
                            {formatDisplayCell(k, row[k])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && totalItems > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-600">
                显示第 {totalItems === 0 ? 0 : startIndex + 1} -{' '}
                {Math.min(startIndex + pageSize, totalItems)} 条，共 {totalItems} 条
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {[50, 20, 10, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} 条/页
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
