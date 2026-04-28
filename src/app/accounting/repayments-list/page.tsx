'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getRepaymentsTable,
  confirmStudentPay,
  type RepaymentRow,
} from '@/services/auth';
import { ExcelExporter } from '@/components/ExcelExporter';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/** 解析 unpaid 为年份数组 */
function parseUnpaidYears(unpaid: string | number[] | undefined): number[] {
  if (!unpaid) return [];
  if (Array.isArray(unpaid)) return unpaid.map(Number).filter((n) => !Number.isNaN(n));
  const str = String(unpaid).trim();
  if (!str) return [];
  return str
    .split(/[,，\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

/** 解析 paid 为显示字符串 */
function formatPaid(paid: string | number[] | undefined): string {
  if (!paid) return '-';
  if (Array.isArray(paid)) return paid.join(', ');
  return String(paid);
}

export default function RepaymentsListPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.FINANCE);
  const canEdit = hasPermission(PERMISSIONS.FINANCE);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [items, setItems] = useState<RepaymentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 确认缴费弹窗
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState<RepaymentRow | null>(null);
  const [confirmYear, setConfirmYear] = useState<number | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await getRepaymentsTable();
      if (res.code === 200) {
        const raw = res.data as { rows?: RepaymentRow[]; list?: RepaymentRow[] } | RepaymentRow[] | undefined;
        const rows = Array.isArray(raw) ? raw : (raw?.rows ?? raw?.list ?? []);
        setItems(Array.isArray(rows) ? rows : []);
      } else {
        setItems([]);
        setErrorMessage(res.message || '获取续费学生清单失败');
      }
    } catch (e) {
      console.error('获取续费学生清单失败:', e);
      setItems([]);
      setErrorMessage(e instanceof Error ? e.message : '获取续费学生清单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = items.filter((item) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (item.student_name || '').toLowerCase().includes(term) ||
      (item.campus_name || '').toLowerCase().includes(term) ||
      (item.sales_person || '').toLowerCase().includes(term) ||
      (item.mentor || '').toLowerCase().includes(term) ||
      (item.mentor_leader || '').toLowerCase().includes(term)
    );
  });

  const repaymentsExportHeaders = [
    'Student',
    'Campus',
    'Sales',
    'Mentor',
    'Mentor Leader',
    'Year Fee',
    'Start Time',
    'Graduate Time',
    'Paid',
    'Unpaid',
  ];
  const repaymentsExportRows = filteredItems.map((row) => {
    const unpaidYears = parseUnpaidYears(row.unpaid);
    return [
      row.student_name || '',
      row.campus_name || '',
      row.sales_person || '',
      row.mentor || '',
      row.mentor_leader || '',
      row.year_fee || '',
      row.start_time || '',
      row.graduate_time || '',
      formatPaid(row.paid),
      unpaidYears.length > 0 ? unpaidYears.join(', ') : '-',
    ];
  });

  const openConfirm = (row: RepaymentRow, year: number) => {
    setConfirmRow(row);
    setConfirmYear(year);
    setConfirmOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!confirmRow || confirmYear === null) return;
    setConfirmSubmitting(true);
    try {
      const res = await confirmStudentPay({
        student_id: confirmRow.student_id,
        year: confirmYear,
      });
      if (res.code === 200) {
        setConfirmOpen(false);
        setConfirmRow(null);
        setConfirmYear(null);
        await loadData();
      } else {
        setErrorMessage(res.message || '确认缴费失败');
      }
    } catch (e) {
      console.error('确认缴费失败:', e);
      setErrorMessage(e instanceof Error ? e.message : '确认缴费失败');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Permission Denied</h1>
          <p className="mt-2 text-gray-600">You do not have permission to view the repayment students list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">续费学生清单</h1>
          <p className="mt-1 text-sm text-gray-600">续费学生清单，确认已缴费学年</p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search student, campus, Sales, mentor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <ExcelExporter
                config={{
                  filename: '续费学生清单',
                  sheets: [
                    {
                      name: '续费学生',
                      headers: repaymentsExportHeaders,
                      data: repaymentsExportRows,
                    },
                  ],
                }}
                disabled={loading || filteredItems.length === 0}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                导出 Excel
              </ExcelExporter>
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[110px]">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[85px]">Campus</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[85px]">Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[85px]">Mentor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[95px]">Mentor Leader</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[75px]">Year Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[95px]">Start Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[95px]">Graduate Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[80px]">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[80px]">Unpaid</th>
                    {canEdit && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase min-w-[120px] sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canEdit ? 11 : 10}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No data
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((row) => {
                      const unpaidYears = parseUnpaidYears(row.unpaid);
                      return (
                        <tr key={`${row.student_id}-${row.student_name}`} className="group hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={row.student_name || ''}>{row.student_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={row.campus_name || ''}>{row.campus_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={row.sales_person || ''}>{row.sales_person || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={row.mentor || ''}>{row.mentor || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={row.mentor_leader || ''}>{row.mentor_leader || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.year_fee || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.start_time || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.graduate_time || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={formatPaid(row.paid)}>{formatPaid(row.paid)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={unpaidYears.length > 0 ? unpaidYears.join(', ') : ''}>
                            {unpaidYears.length > 0 ? unpaidYears.join(', ') : '-'}
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                              <div className="flex flex-wrap gap-1 justify-end">
                                {unpaidYears.map((year) => (
                                  <button
                                    key={year}
                                    onClick={() => openConfirm(row, year)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                                  >
                                    <BanknotesIcon className="h-3.5 w-3.5" />
                                    Confirm {year}
                                  </button>
                                ))}
                                {unpaidYears.length === 0 && <span className="text-gray-400 text-xs">-</span>}
                              </div>
                            </td>
                          )}
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

      {/* 确认缴费弹窗 */}
      {confirmOpen && confirmRow && confirmYear !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Payment</h3>
              <button
                onClick={() => !confirmSubmitting && setConfirmOpen(false)}
                disabled={confirmSubmitting}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Confirm student <span className="font-medium text-gray-900">{confirmRow.student_name}</span> has paid{' '}
                <span className="font-medium text-gray-900">{confirmYear}-{confirmYear + 1}</span> academic year?
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={confirmSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPay}
                disabled={confirmSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {confirmSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
