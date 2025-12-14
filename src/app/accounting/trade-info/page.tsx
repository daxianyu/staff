'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getTradeAccountList,
  getTradeInfoDetail,
  getTradeInfoList,
  refundTradeRecord,
  type TradeAccountOption,
  type TradeInfoDetailData,
  type TradeInfoRow,
} from '@/services/auth';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, subDays } from 'date-fns';
import { ExcelExporter } from '@/components/ExcelExporter';

const formatMoney = (value: unknown) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? '');
  return `¥${num}`;
};

const exportHeaders = [
  'Type',
  'User Name',
  'Amount',
  'Out Trade No',
  'Subject',
  'Account',
  'Refund Status',
  'Refund Amount',
  'Refund Reason',
  'Create Time',
  'Update Time',
];

export default function TradeInfoPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.FINANCE);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [payAccount, setPayAccount] = useState<number>(-1);
  const [accountOptions, setAccountOptions] = useState<TradeAccountOption[]>([]);

  const [rows, setRows] = useState<TradeInfoRow[]>([]);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<TradeInfoDetailData | null>(null);

  // 退款弹窗
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundRow, setRefundRow] = useState<TradeInfoRow | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState('');

  // 如果没有权限，显示无权限页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">权限不足</h1>
          <p className="mt-2 text-gray-600">您没有查看支付记录的权限</p>
        </div>
      </div>
    );
  }

  const loadAccountOptions = async () => {
    try {
      const res = await getTradeAccountList();
      if (res.code === 200) {
        setAccountOptions(res.data?.pay_account ?? []);
      } else {
        console.error('获取支付账户列表失败:', res.message);
      }
    } catch (e) {
      console.error('获取支付账户列表失败:', e);
    }
  };

  const loadList = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await getTradeInfoList({
        start_date: startDate,
        end_date: endDate,
        pay_account: payAccount,
      });
      if (res.code === 200) {
        setRows(res.data?.rows ?? []);
        setCurrentPage(1);
      } else {
        setRows([]);
        setErrorMessage(res.message || '获取支付记录失败');
      }
    } catch (e) {
      console.error('获取支付记录失败:', e);
      setRows([]);
      setErrorMessage(e instanceof Error ? e.message : '获取支付记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountOptions();
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  const openDetail = async (recordId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getTradeInfoDetail(recordId);
      if (res.code === 200 && res.data) {
        setDetailData(res.data);
      } else {
        setErrorMessage(res.message || '获取详情失败');
      }
    } catch (e) {
      console.error('获取详情失败:', e);
      setErrorMessage(e instanceof Error ? e.message : '获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const openRefund = (row: TradeInfoRow) => {
    setRefundRow(row);
    setRefundAmount(String(row.price ?? ''));
    setRefundReason('');
    setRefundError('');
    setRefundOpen(true);
  };

  const submitRefund = async () => {
    if (!refundRow) return;
    setRefundError('');

    const amountNum = Number(refundAmount);
    if (!refundAmount || Number.isNaN(amountNum) || amountNum <= 0) {
      setRefundError('请输入有效的退款金额');
      return;
    }
    if (amountNum > Number(refundRow.price)) {
      setRefundError('退款金额不能大于订单付款金额');
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('请输入退款原因');
      return;
    }

    setRefundSubmitting(true);
    try {
      const res = await refundTradeRecord({
        record_id: refundRow.record_id,
        refund_amount: amountNum,
        refund_reason: refundReason.trim(),
      });
      if (res.code === 200) {
        setRefundOpen(false);
        setRefundRow(null);
        await loadList();
      } else {
        setRefundError(res.message || '退款失败');
      }
    } catch (e) {
      console.error('退款失败:', e);
      setRefundError(e instanceof Error ? e.message : '退款失败');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const Pagination = () => {
    const maxVisiblePages = 7;
    const pages: Array<number | '...'> = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            显示第 {rows.length === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, rows.length)} 条，共 {rows.length} 条记录
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>

              {pages.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  disabled={p === '...'}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                    p === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : p === '...'
                        ? 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trade Info</h1>
          <p className="mt-1 text-sm text-gray-600">查看支付记录、详情及退款操作</p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        {/* 筛选栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">筛选条件</h3>
                  <p className="text-sm text-gray-600">按日期/账户筛选支付记录</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ExcelExporter
                  config={{
                    filename: `Trade_Info_${startDate}_${endDate}`,
                    sheets: [
                      {
                        name: 'Trade Info',
                        headers: exportHeaders,
                        data: rows.map((r) => [
                          r.type_name,
                          r.user_name || '',
                          r.price,
                          r.out_trade_no,
                          r.subject,
                          r.account_name,
                          r.refund_status,
                          r.refund_price,
                          r.refund_reason,
                          r.create_time,
                          r.update_time,
                        ]),
                      },
                    ],
                  }}
                  disabled={loading || rows.length === 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm hover:shadow-md"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span className="font-medium">导出Excel</span>
                </ExcelExporter>

                <button
                  onClick={loadList}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span className="font-medium">刷新</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 开始日期 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">开始日期</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 结束日期 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">结束日期</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 支付账户 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">支付账户</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BanknotesIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={payAccount}
                    onChange={(e) => setPayAccount(Number(e.target.value))}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                  >
                    <option value={-1}>全部账户</option>
                    {accountOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                  setEndDate(format(new Date(), 'yyyy-MM-dd'));
                  setPayAccount(-1);
                  setTimeout(() => loadList(), 50);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                重置
              </button>
              <button
                onClick={loadList}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                查询
              </button>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Out Trade No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      退款状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      退款金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      退款原因
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Create Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Update Time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r) => (
                      <tr key={r.record_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.type_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.user_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMoney(r.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.out_trade_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.account_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.can_refund === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {r.refund_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMoney(r.refund_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={r.refund_reason || ''}>
                          {r.refund_reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.create_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.update_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(r.record_id)}
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                            >
                              <EyeIcon className="h-4 w-4" />
                              详情
                            </button>
                            <button
                              onClick={() => openRefund(r)}
                              disabled={r.can_refund !== 1}
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <BanknotesIcon className="h-4 w-4" />
                              退款
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

          {!loading && rows.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                共找到 <span className="font-medium text-gray-900">{rows.length}</span> 条记录
              </div>
            </div>
          )}
        </div>

        {!loading && rows.length > 0 && <Pagination />}
      </div>

      {/* 详情弹窗 */}
      {detailOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">支付记录详情</h3>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <span className="ml-2 text-gray-600">加载中...</span>
                </div>
              ) : !detailData ? (
                <div className="text-sm text-gray-600">暂无详情</div>
              ) : (
                (() => {
                  const rawTradeDetail = (detailData as any)?.trade_detail ?? (detailData as any)?.tradeDetail;
                  let tradeDetailObj: any = {};
                  if (rawTradeDetail && typeof rawTradeDetail === 'object') {
                    tradeDetailObj = rawTradeDetail;
                  } else if (typeof rawTradeDetail === 'string') {
                    try {
                      tradeDetailObj = JSON.parse(rawTradeDetail);
                    } catch {
                      tradeDetailObj = {};
                    }
                  }

                  const buyerLogonId = tradeDetailObj?.buyer_logon_id ?? '';
                  const buyerUserId = tradeDetailObj?.buyer_user_id ?? '';
                  const sendPayDate = tradeDetailObj?.send_pay_date ?? '';
                  const totalAmount = tradeDetailObj?.total_amount ?? '';
                  const alipayAccountPid =
                    tradeDetailObj?.app_id ??
                    tradeDetailObj?.alipay_account_pid ??
                    (detailData as any)?.alipay_account_pid ??
                    (detailData as any)?.alipay_account ??
                    '';

                  const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));

                  const Row = ({
                    leftLabel,
                    leftValue,
                    rightLabel,
                    rightValue,
                  }: {
                    leftLabel: string;
                    leftValue: unknown;
                    rightLabel?: string;
                    rightValue?: unknown;
                  }) => (
                    <tr className="border-b border-gray-100 last:border-b-0">
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap align-top">{leftLabel}</td>
                      <td className="py-2 pr-6 text-gray-900 break-all align-top">{text(leftValue)}</td>
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap align-top">{rightLabel ?? ''}</td>
                      <td className="py-2 text-gray-900 break-all align-top">{rightLabel ? text(rightValue) : ''}</td>
                    </tr>
                  );

                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <tbody>
                          <Row leftLabel="type name" leftValue={detailData.type_name} rightLabel="trade no" rightValue={detailData.out_trade_no} />
                          <Row leftLabel="subject" leftValue={detailData.subject} rightLabel="price" rightValue={formatMoney(detailData.price)} />
                          <Row leftLabel="user name" leftValue={detailData.user_name} rightLabel="alipay trade no" rightValue={detailData.trade_no} />
                          <Row leftLabel="buyer_logon_id" leftValue={buyerLogonId} rightLabel="buyer_user_id" rightValue={buyerUserId} />
                          <Row leftLabel="send_pay_date" leftValue={sendPayDate} rightLabel="total_amount" rightValue={totalAmount} />
                          <Row leftLabel="create time" leftValue={detailData.create_time} rightLabel="update time" rightValue={detailData.update_time} />
                          <Row leftLabel="alipay account pid" leftValue={alipayAccountPid} />
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setDetailOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退款弹窗（确认） */}
      {refundOpen && refundRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">退款确认</h3>
              <button
                onClick={() => !refundSubmitting && setRefundOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                disabled={refundSubmitting}
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600">
                订单号：<span className="text-gray-900 break-all">{refundRow.out_trade_no}</span>
              </div>
              <div className="text-sm text-gray-600">
                订单金额：<span className="text-gray-900 font-medium">{formatMoney(refundRow.price)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款金额</label>
                <input
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={refundSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款原因</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={refundSubmitting}
                />
              </div>

              {refundError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {refundError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setRefundOpen(false)}
                disabled={refundSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={submitRefund}
                disabled={refundSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refundSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    提交中...
                  </>
                ) : (
                  '确认退款'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

