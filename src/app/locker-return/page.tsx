'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getReturnLockerList,
  updateReturnLockerStatus,
  type ReturnLockerRecord,
  type ReturnLockerListResponse,
  type UpdateReturnLockerStatusParams
} from '@/services/auth';
import { PERMISSIONS } from '@/types/auth';
import {
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { ExcelExporter } from '@/components/ExcelExporter';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const RETURN_LOCKER_STATUS: Record<number, string> = {
  0: '申请中',
  1: '已处理',
  2: '拒绝',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/50" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LockerReturnManagementPage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<ReturnLockerRecord[]>([]);
  const [returnLockerStatus, setReturnLockerStatus] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReturnLockerRecord | null>(null);
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const getStatusLabel = (status: number, fallback?: string) =>
    returnLockerStatus[status] ?? RETURN_LOCKER_STATUS[status] ?? fallback ?? '未知状态';

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_RETURN_LOCKER);
  const canApprove = hasPermission(PERMISSIONS.APPROVE_RETURN_LOCKER);

  // 加载数据
  const loadData = useCallback(async (page?: number, search?: string) => {
    try {
      setLoading(true);
      const result = await getReturnLockerList();
      if (result.code === 200 && result.data) {
        let allRecords = result.data.list;
        setReturnLockerStatus(result.data.return_locker_status);

        // 前端搜索过滤
        if (search && search.trim()) {
          allRecords = allRecords.filter(record =>
            record.student_name.toLowerCase().includes(search.toLowerCase()) ||
            record.locker_name.toLowerCase().includes(search.toLowerCase()) ||
            record.campus_name.toLowerCase().includes(search.toLowerCase())
          );
        }

        // 更新总记录数
        setTotalItems(allRecords.length);
        setTotalPages(Math.ceil(allRecords.length / pageSize));

        // 分页处理
        const currentPageNum = page || currentPage;
        const startIndex = (currentPageNum - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRecords = allRecords.slice(startIndex, endIndex);

        setRecords(paginatedRecords);

        // 更新当前页码
        if (page) {
          setCurrentPage(page);
        }
      } else {
        console.error('获取退柜记录失败:', result.message);
        alert('获取退柜记录失败: ' + result.message);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView, loadData]);

  // 分页处理函数
  const handlePageChange = async (page: number) => {
    await loadData(page, searchTerm);
  };

  const handlePageSizeChange = async (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    // 重新计算总页数并加载数据
    setTimeout(() => {
      loadData(1, searchTerm);
    }, 0);
  };

  // 搜索处理函数
  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
    await loadData(1, search);
  };

  // 处理审批操作
  const handleApprove = async (record: ReturnLockerRecord, action: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setApproveAction(action);
    setIsApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedRecord) return;

    try {
      const params: UpdateReturnLockerStatusParams = {
        record_id: selectedRecord.id,
        status: approveAction === 'approve' ? 1 : 2, // 1: 完成, 2: 拒绝
      };

      const result = await updateReturnLockerStatus(params);
      if (result.code === 200) {
        alert(approveAction === 'approve' ? '审批完成' : '已拒绝退柜申请');
        setIsApproveModalOpen(false);
        setSelectedRecord(null);
        loadData(); // 重新加载数据
      } else {
        alert('操作失败: ' + result.message);
      }
    } catch (error) {
      console.error('审批操作失败:', error);
      alert('审批操作失败');
    }
  };

  // 导出Excel数据
  const exportToExcel = () => {
    // 这里先返回一个基本的配置，实际的导出逻辑会在ExcelExporter组件中处理
    return {
      filename: 'locker_return_records',
      sheets: [{
        name: '退柜记录',
        headers: [
          '记录ID',
          '学生姓名',
          '储物柜名称',
          '校区',
          '支付宝账号',
          '支付宝姓名',
          '状态',
          '申请时间'
        ],
        data: records.map(record => [
          record.id,
          record.student_name,
          record.locker_name,
          record.campus_name,
          record.alipay_account,
          record.alipay_name,
          getStatusLabel(record.status, record.status_name),
          record.create_time
        ])
      }]
    };
  };

  // 如果没有查看权限
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">权限不足</h3>
          <p className="text-gray-500">您没有权限访问退柜管理页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">退柜管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理学生的储物柜退柜申请</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="搜索学生姓名、储物柜或校区..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <ExcelExporter
                config={exportToExcel()}
                disabled={records.length === 0}
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                导出Excel
              </ExcelExporter>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      储物柜信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      退款信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm ? '未找到匹配的记录' : '暂无退柜申请记录'}
                      </td>
                    </tr>
                  ) : (
                    records.map((record: ReturnLockerRecord) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {record.student_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.locker_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.campus_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {record.alipay_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.alipay_account}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const statusLabel = getStatusLabel(record.status, record.status_name);
                            const badgeClass = record.status === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : record.status === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800';
                            return (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                                {statusLabel}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.create_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {record.status === 0 && canApprove && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(record, 'approve')}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                完成
                              </button>
                              <button
                                onClick={() => handleApprove(record, 'reject')}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                拒绝
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页组件 */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  显示第 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={50}>每页 50 条</option>
                    <option value={100}>每页 100 条</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <div className="flex gap-1">
                    {/* 生成页码数组 */}
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 7; // 最多显示7个页码

                      if (totalPages <= maxVisiblePages) {
                        // 如果总页数不多，显示所有页码
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // 如果总页数很多，智能显示
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);

                        // 总是显示第一页
                        if (startPage > 1) {
                          pages.push(1);
                          if (startPage > 2) {
                            pages.push('...');
                          }
                        }

                        // 显示当前页附近的页码
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }

                        // 总是显示最后一页
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push('...');
                          }
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                          disabled={page === '...'}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                            page === currentPage
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : page === '...'
                              ? 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 审批确认模态框 */}
        <Modal
          isOpen={isApproveModalOpen}
          onClose={() => {
            setIsApproveModalOpen(false);
            setSelectedRecord(null);
          }}
          title={approveAction === 'approve' ? '确认完成退柜' : '确认拒绝退柜'}
        >
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              {approveAction === 'approve' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-sm font-medium text-gray-900">
                {approveAction === 'approve' ? '完成退柜申请' : '拒绝退柜申请'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {selectedRecord && (
                    <>
                      确认对学生 <span className="font-medium">{selectedRecord.student_name}</span> 的退柜申请
                      {approveAction === 'approve' ? '标记为已完成' : '进行拒绝'}？
                      <br />
                      储物柜: {selectedRecord.locker_name} ({selectedRecord.campus_name})
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                approveAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              onClick={confirmApprove}
            >
              {approveAction === 'approve' ? '确认完成' : '确认拒绝'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => {
                setIsApproveModalOpen(false);
                setSelectedRecord(null);
              }}
            >
              取消
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
