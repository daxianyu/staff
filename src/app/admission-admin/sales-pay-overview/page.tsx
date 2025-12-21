'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  getPaymentInfo,
  deletePaymentRecord,
  getPaymentDetail,
  sendInterviewEmail,
  sendRejectEmail,
  changeExamDate,
  changeSalesApply,
  downloadPaymentInfo,
  type PaymentInfo,
  type PaymentDetail,
} from '@/services/auth';
import ChangeExamDateModal from './components/ChangeExamDateModal';
import ChangeApplyModal from './components/ChangeApplyModal';

export default function PaymentInfoPage() {
  const { hasPermission, user } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_PAYMENT_INFO);
  const canDelete = hasPermission(PERMISSIONS.MANAGE_EXAM_CONFIG); // 需要sales_core或core_user
  
  // 检查是否有修改权限（sales_core=1 或 core_user=1）
  const canModify = useMemo(() => {
    if (!user) return false;
    const isSalesCore = Number((user as any).sales_core) === 1 || (user as any).sales_core === true;
    const isCoreUser = Number((user as any).core_user) === 1 || (user as any).core_user === true;
    return isSalesCore || isCoreUser;
  }, [user]);

  // 状态管理
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false); // 详情加载状态
  const [searchTerm, setSearchTerm] = useState('');
  const [startDay, setStartDay] = useState('');
  const [endDay, setEndDay] = useState('');
  const [downloading, setDownloading] = useState(false);
  
  // 模态框状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentInfo | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  
  // 修改模态框状态
  const [showChangeExamDateModal, setShowChangeExamDateModal] = useState(false);
  const [showChangeApplyModal, setShowChangeApplyModal] = useState(false);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看支付信息</p>
        </div>
      </div>
    );
  }

  // 加载数据 - 根据日期范围获取数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { start_day?: string; end_day?: string } = {};
      if (startDay) {
        params.start_day = startDay;
      }
      if (endDay) {
        params.end_day = endDay;
      }
      
      const result = await getPaymentInfo(Object.keys(params).length > 0 ? params : undefined);
      if (result.code === 200 && result.data) {
        setPayments(result.data.rows || []);
      } else {
        console.error('获取支付信息失败:', result.message);
        setPayments([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [startDay, endDay]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 前端搜索过滤
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(item => 
      (item.sales_name || '').toLowerCase().includes(term) ||
      (item.sales_id?.toString() || '').includes(term) ||
      (item.record_id?.toString() || '').includes(term) ||
      (item.campus_name || '').toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  // 打开详情模态框
  const handleViewDetail = async (item: PaymentInfo) => {
    setSelectedPayment(item);
    setDetailLoading(true);
    try {
      const result = await getPaymentDetail(item.record_id);
      if (result.code === 200 && result.data) {
        setPaymentDetail(result.data);
        setShowDetailModal(true);
      } else {
        alert('获取详情失败: ' + result.message);
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      alert('获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 打开修改考试日期模态框
  const handleOpenChangeExamDateModal = () => {
    setShowChangeExamDateModal(true);
  };

  // 确认修改考试日期
  const handleConfirmChangeExamDate = async (params: {
    sales_id: number;
    old_exam_id: number;
    new_exam_id: number;
  }) => {
    try {
      const result = await changeExamDate(params);
      if (result.code === 200) {
        alert('修改成功');
        setShowChangeExamDateModal(false);
        // 重新加载详情
        if (selectedPayment) {
          await handleViewDetail(selectedPayment);
        }
        // 重新加载列表
        await loadData();
      } else {
        alert('修改失败: ' + result.message);
      }
    } catch (error) {
      console.error('修改考试日期失败:', error);
      alert('修改考试日期失败');
    }
  };

  // 打开修改报考信息模态框
  const handleOpenChangeApplyModal = () => {
    setShowChangeApplyModal(true);
  };

  // 确认修改报考信息
  const handleConfirmChangeApply = async (params: {
    sales_id: number;
    pay_id: number;
    campus_id: number;
    study_year: string;
    paper_type: string;
    math_type: string;
  }) => {
    try {
      const result = await changeSalesApply(params);
      if (result.code === 200) {
        alert('修改成功');
        setShowChangeApplyModal(false);
        // 重新加载详情
        if (selectedPayment) {
          await handleViewDetail(selectedPayment);
        }
        // 重新加载列表
        await loadData();
      } else {
        alert('修改失败: ' + result.message);
      }
    } catch (error) {
      console.error('修改报考信息失败:', error);
      alert('修改报考信息失败');
    }
  };

  // 打开删除确认模态框
  const handleDeleteClick = (item: PaymentInfo) => {
    setSelectedPayment(item);
    setShowDeleteModal(true);
  };

  // 发送面试邀请
  const handleSendInterview = async (item: PaymentInfo) => {
    if (!confirm('确定要发送面试邀请吗？')) return;
    
    try {
      const result = await sendInterviewEmail(item.record_id);
      if (result.code === 200) {
        alert('发送成功');
        loadData();
      } else {
        alert('发送失败: ' + result.message);
      }
    } catch (error) {
      console.error('发送失败:', error);
      alert('发送失败');
    }
  };

  // 发送拒信
  const handleSendReject = async (item: PaymentInfo) => {
    if (!confirm('确定要发送拒信吗？')) return;
    
    try {
      const result = await sendRejectEmail(item.record_id);
      if (result.code === 200) {
        alert('发送成功');
        loadData();
      } else {
        alert('发送失败: ' + result.message);
      }
    } catch (error) {
      console.error('发送失败:', error);
      alert('发送失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedPayment) return;
    
    try {
      const result = await deletePaymentRecord(selectedPayment.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedPayment(null);
        loadData();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 下载支付报考信息
  const handleDownload = async () => {
    // 如果用户没输入日期 -> 不传参数，让后端走默认时间范围
    // 如果只输入了一个日期 -> 也不传，避免后端参数不完整
    const shouldSendDateRange = Boolean(startDay && endDay);
    if (shouldSendDateRange && new Date(startDay) > new Date(endDay)) {
      alert('开始日期不能大于结束日期');
      return;
    }

    setDownloading(true);
    try {
      const result = await downloadPaymentInfo(
        shouldSendDateRange
          ? {
              start_day: startDay,
              end_day: endDay,
            }
          : undefined
      );
      
      if (result.code === 200 && result.data) {
        // result.data 是字符串路径，例如：/static/gen_path/payment_info_2025-11-19_2025-11-20_1763638375.csv
        const filePath = typeof result.data === 'string' ? result.data : '';
        
        if (filePath) {
          // 如果是相对路径，需要添加基础URL
          const downloadUrl = filePath.startsWith('http') 
            ? filePath 
            : `https://www.huayaopudong.com${filePath}`;
          
          // 创建临时链接下载文件
          const link = document.createElement('a');
          link.href = downloadUrl;
          // 从文件路径中提取文件名，如果没有则使用默认名称
          const fileName =
            filePath.split('/').pop() ||
            (shouldSendDateRange ? `payment_info_${startDay}_${endDay}.csv` : `payment_info.csv`);
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert('下载成功');
        } else {
          alert('下载失败: 未获取到文件链接');
        }
      } else {
        alert('下载失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sales Pay Overview</h1>
          <p className="mt-2 text-sm text-gray-600">查看招生报名的缴费信息</p>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col gap-4">
            {/* 第一行：搜索框和记录数 */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* 搜索框 */}
              <div className="relative flex-1 w-full sm:w-auto">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索学生姓名、销售ID、记录ID或校区..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                共 {filteredPayments.length} 条记录
              </div>
            </div>
            
            {/* 第二行：日期选择和下载按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">开始日期:</label>
                  <input
                    type="date"
                    value={startDay}
                    onChange={(e) => setStartDay(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">结束日期:</label>
                  <input
                    type="date"
                    value={endDay}
                    onChange={(e) => setEndDay(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    下载中...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    下载支付报考信息
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 - 内部滚动 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Day</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报考校区</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学年</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">试卷类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数学卷</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标化成绩信息</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发送操作</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((item) => (
                    <tr key={item.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.record_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sales_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.price !== undefined ? item.price : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.exam_day || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.campus_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.study_year || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.paper_type || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.math_type || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.standard_score || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.create_time || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {item.send_status === 0 || item.sales_interview === undefined || item.sales_interview === null ? (
                          // 未发送：显示两个按钮
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleSendInterview(item)}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                              title="发送面试邀请"
                            >
                              发送面试邀请
                            </button>
                            <button
                              onClick={() => handleSendReject(item)}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                              title="发送拒信"
                            >
                              发送拒信
                            </button>
                          </div>
                        ) : (
                          // 已发送：显示状态
                          <div className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                            item.sales_interview === 1
                              ? 'text-green-600 bg-green-50'
                              : 'text-orange-600 bg-orange-50'
                          }`}>
                            {item.sales_interview === 1 ? '已发送面试邀请' : '已发送拒信'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(item)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            title="查看详情"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            详情
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                              title="删除"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? '未找到匹配的记录' : '暂无数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedPayment && (
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
                      确定要删除ID为 {selectedPayment.record_id} 的支付记录吗？此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPayment(null);
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

        {/* 详情模态框 */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-900">支付详情</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setPaymentDetail(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {detailLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : paymentDetail ? (
                <div className="p-6 space-y-6">
                  {/* 基本信息 */}
                  {paymentDetail.detail && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">基本信息</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">考试场次描述</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.exam_desc || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">考试类型</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.online || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">合同号(考生ID)</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.sales_id || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">订单号</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.order_num || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">考试费用</label>
                            <div className="text-sm text-gray-900">¥{paymentDetail.detail.price || 0}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">考试时间</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.exam_day || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">订单发起时间</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.book_time || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">最后更新时间</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.update_time || '-'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">订单状态</label>
                            <div className="text-sm text-gray-900">{paymentDetail.detail.status || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 修改功能按钮 */}
                  {canModify && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleOpenChangeExamDateModal}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        修改招生报名的考试日期
                      </button>
                      <button
                        onClick={handleOpenChangeApplyModal}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        修改报考信息
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  暂无详情数据
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setPaymentDetail(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 修改考试日期模态框 */}
        <ChangeExamDateModal
          isOpen={showChangeExamDateModal}
          onClose={() => setShowChangeExamDateModal(false)}
          paymentDetail={paymentDetail}
          onConfirm={handleConfirmChangeExamDate}
        />

        {/* 修改报考信息模态框 */}
        <ChangeApplyModal
          isOpen={showChangeApplyModal}
          onClose={() => setShowChangeApplyModal(false)}
          paymentDetail={paymentDetail}
          payId={selectedPayment?.record_id || 0}
          onConfirm={handleConfirmChangeApply}
        />
      </div>
    </div>
  );
}