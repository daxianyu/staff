'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStaffRemarkTable, 
  updateRemarkStatus,
  deleteRemarkRecord,
  type RemarkItem,
  type RemarkResponse 
} from '@/services/auth';
import { 
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// 备注状态常量定义
const REMARK_STATUS = {
  "-1": "已撤回",
  "1": "已提交-待支付",
  "2": "已支付-待处理", 
  "3": "已拒绝",
  "4": "已支付-已处理",
  "5": "已支付-但拒绝"
};

export default function RemarkOverviewPage() {
  const { user, hasPermission } = useAuth();
  const [data, setData] = useState<RemarkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RemarkItem | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    reject_reason: ''
  });
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const canView = hasPermission(PERMISSIONS.VIEW_REMARK_OVERVIEW);
  const canEdit = hasPermission(PERMISSIONS.EDIT_REMARK_OVERVIEW);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async (page?: number, newPageSize?: number) => {
    setLoading(true);
    try {
      const result = await getStaffRemarkTable();
      if (result.code === 200) {
        const allData = result.data?.rows || [];
        const total = result.data?.total || 0;
        
        setTotalItems(total);
        setTotalPages(Math.ceil(total / (newPageSize || pageSize)));
        
        // 前端分页处理
        const startIndex = ((page || currentPage) - 1) * (newPageSize || pageSize);
        const endIndex = startIndex + (newPageSize || pageSize);
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setData(paginatedData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRecord || !canEdit) return;

    try {
      // 通过时设置为状态4（已支付-已处理）
      // 拒绝时设置为状态5（已支付-但拒绝）
      const result = await updateRemarkStatus({
        record_id: selectedRecord.record_id,
        status: parseInt(statusForm.status),
        reject_reason: statusForm.reject_reason
      });

      if (result.code === 200) {
        alert('状态更新成功');
        setShowStatusModal(false);
        setSelectedRecord(null);
        setStatusForm({ status: '', reject_reason: '' });
        loadData();
      } else {
        alert(result.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      alert('状态更新失败');
    }
  };


  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await loadData(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    loadData(1, newPageSize);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          <h1 className="text-2xl font-bold text-gray-900">Remark Overview</h1>
          <p className="text-gray-600 mt-1">备注管理</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">共 {data.length} 条记录</span>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-50 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                      学生
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      校区
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      导师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      考试季
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      考试局
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      服务
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      对应的考试
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      当前状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      考号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      说明
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支付宝账户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支付宝实名姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      拒绝/驳回 原因
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提交时间
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.record_id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 z-10 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 transition-colors">
                        {item.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.campus_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.mentor_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.season}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.exam_center}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.remark_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.exam_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.price ? `¥${item.price}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.exam_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={item.note}>
                          {item.note || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.alipay_account || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.alipay_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={item.reject_reason}>
                          {item.reject_reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.create_time}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* 只有状态为2（已支付-待处理）时才显示操作按钮 */}
                            {item.status === 2 && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRecord(item);
                                    setStatusForm({ status: '4', reject_reason: '' });
                                    setShowStatusModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                >
                                  通过
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRecord(item);
                                    setStatusForm({ status: '5', reject_reason: '' });
                                    setShowStatusModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                >
                                  拒绝
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条记录
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">每页显示</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">条</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                
                <div className="flex items-center gap-1">
                  {(() => {
                    const maxVisiblePages = 7;
                    const pages = [];
                    
                    if (totalPages <= maxVisiblePages) {
                      // 显示所有页码
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                              currentPage === i
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                    } else {
                      // 智能显示页码
                      const startPage = Math.max(1, currentPage - 3);
                      const endPage = Math.min(totalPages, currentPage + 3);
                      
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-400 cursor-not-allowed">
                              ...
                            </span>
                          );
                        }
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                              currentPage === i
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-400 cursor-not-allowed">
                              ...
                            </span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        );
                      }
                    }
                    
                    return pages;
                  })()}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 状态处理模态框 */}
        {showStatusModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {statusForm.status === '4' ? '通过申请' : '拒绝申请'}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      学生：<strong>{selectedRecord.student_name}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      考试：<strong>{selectedRecord.exam_name}</strong>
                    </p>
                  </div>
                  {statusForm.status === '5' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        拒绝原因
                      </label>
                      <textarea
                        value={statusForm.reject_reason}
                        onChange={(e) => setStatusForm({ ...statusForm, reject_reason: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请输入拒绝原因"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${
                    statusForm.status === '4' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {statusForm.status === '4' ? '通过' : '拒绝'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
