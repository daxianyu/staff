'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  getPaymentInfo,
  deletePaymentRecord,
  getPaymentDetail,
  sendInterviewEmail,
  type PaymentInfo,
  type PaymentDetail,
} from '@/services/auth';

export default function PaymentInfoPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_PAYMENT_INFO);
  const canDelete = hasPermission(PERMISSIONS.MANAGE_EXAM_CONFIG); // 需要sales_core或core_user

  // 状态管理
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 模态框状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentInfo | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);

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

  // 加载数据 - 一次性获取所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getPaymentInfo();
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
  };

  useEffect(() => {
    loadData();
  }, []);

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
    setLoading(true);
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
      setLoading(false);
    }
  };

  // 打开删除确认模态框
  const handleDeleteClick = (item: PaymentInfo) => {
    setSelectedPayment(item);
    setShowDeleteModal(true);
  };

  // 发送操作
  const handleSend = async (item: PaymentInfo) => {
    if (!confirm('确定要发送成绩通知吗？')) return;
    
    try {
      const result = await sendInterviewEmail(item.sales_id);
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
                        <button
                          onClick={() => handleSend(item)}
                          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            item.send_status === 1
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          }`}
                          title={item.send_status === 1 ? '已发送' : '发送'}
                        >
                          {item.send_status === 1 ? '已发送' : '发送'}
                        </button>
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
        {showDetailModal && paymentDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
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
              
              <div className="p-6 space-y-4">
                {Object.entries(paymentDetail).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                    <div className="text-sm text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
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
      </div>
    </div>
  );
}