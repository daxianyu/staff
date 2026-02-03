'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  getAllSales,
  addSalesRecord,
  deleteSalesRecord,
  checkContractStatus,
  getSalesInfo,
  type SalesRecord,
} from '@/services/auth';
import { buildFileUrl } from '@/config/env';
import { openUrlWithFallback } from '@/utils/openUrlWithFallback';
import { getSiteConfig, type SiteConfig } from '@/services/modules/tools';

export default function AdmissionManagePage() {
  const { hasPermission, user } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_ADMISSION_MANAGE) || 
                  hasPermission(PERMISSIONS.VIEW_SALES_INFO) || 
                  hasPermission(PERMISSIONS.VIEW_CONTRACTS_INFO);
  const canEdit = hasPermission(PERMISSIONS.EDIT_ADMISSION_MANAGE);
  const canDelete = hasPermission(PERMISSIONS.EDIT_ADMISSION_MANAGE);
  const canAdd = hasPermission(PERMISSIONS.EDIT_ADMISSION_MANAGE) || hasPermission(PERMISSIONS.SALES_PERSON);

  // 状态管理
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSales, setSelectedSales] = useState<SalesRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // 合同检查状态 - 使用 Map 存储每个记录的检查状态
  const [checkingContracts, setCheckingContracts] = useState<Map<number, 'service' | 'consult' | null>>(new Map());
  
  // 网站配置
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看招生管理</p>
        </div>
      </div>
    );
  }

  // 加载数据 - 一次性获取所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllSales();
      if (result.code === 200 && result.data) {
        setSales(result.data.rows || []);
      } else {
        console.error('获取sales记录失败:', result.message);
        setSales([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadSiteConfig();
  }, []);

  // 加载网站配置
  const loadSiteConfig = async () => {
    try {
      const result = await getSiteConfig();
      if (result.code === 200 && result.data) {
        setSiteConfig(result.data);
      }
    } catch (error) {
      console.error('加载网站配置失败:', error);
    }
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 格式化日期
  const formatDate = (timestamp: number | string | undefined): string => {
    if (!timestamp) return '-';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  // 前端搜索过滤 - 使用防抖搜索词
  const filteredSales = useMemo(() => {
    if (!debouncedSearchTerm) return sales;
    const term = debouncedSearchTerm.toLowerCase();
    return sales.filter(item => 
      (item.student_name || '').toLowerCase().includes(term) ||
      (item.sales_id?.toString() || '').includes(term) ||
      (item.phone || '').includes(term) ||
      (item.email || '').toLowerCase().includes(term) ||
      (item.sales_name || '').toLowerCase().includes(term) ||
      (item.channel_name || '').toLowerCase().includes(term) ||
      (item.status_name || '').toLowerCase().includes(term)
    );
  }, [sales, debouncedSearchTerm]);

  // 分页数据
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, currentPage, pageSize]);

  // 总页数
  const totalPages = useMemo(() => {
    return Math.ceil(filteredSales.length / pageSize);
  }, [filteredSales.length, pageSize]);

  // 页码切换
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 打开添加模态框
  const handleAdd = () => {
    if (!canAdd) {
      alert('您没有权限新增记录');
      return;
    }
    setFormData({});
    setShowAddModal(true);
  };

  // 在新标签页打开编辑页面
  const handleEdit = (item: SalesRecord) => {
    openUrlWithFallback(`/admission-admin/sales/edit?id=${item.sales_id}`);
  };

  // 打开删除确认模态框
  const handleDeleteClick = (item: SalesRecord) => {
    setSelectedSales(item);
    setShowDeleteModal(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!canAdd) {
      alert('您没有权限新增记录');
      return;
    }
    try {
        if (!formData.student_name) {
          alert('请输入学生姓名');
          return;
        }
        const result = await addSalesRecord({ student_name: formData.student_name });
        if (result.code === 200) {
          alert('创建成功');
          setShowAddModal(false);
          setFormData({});
          loadData();
        } else {
          alert('操作失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('操作失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedSales) return;
    
    try {
      const result = await deleteSalesRecord(selectedSales.sales_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedSales(null);
        loadData();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 检查是否可以删除（sales_admin 或 assigned_staff = user_id）
  const canDeleteRecord = (item: SalesRecord): boolean => {
    if (canDelete) return true;
    if (user && item.assigned_staff === user.id) return true;
    return false;
  };

  // 检查服务协议状态（刷新）
  const handleCheckServiceContract = async (item: SalesRecord) => {
    if (!item.service_tail || !item.sales_id) return;

    setCheckingContracts(prev => new Map(prev).set(item.sales_id, 'service'));
    try {
      const result = await checkContractStatus(item.service_tail);
      // status=0 (code=200) 且有 data，直接赋值并更新状态为 2
      if (result.code === 200 && result.data) {
        const downloadUrl = result.data.startsWith('http') 
          ? result.data 
          : buildFileUrl(result.data);
        
        // 更新列表中的数据：赋值下载地址，状态改为 2
        setSales(prev => prev.map(s => {
          if (s.sales_id === item.sales_id) {
            return {
              ...s,
              signing_request_state: 2,
              service_file: downloadUrl,
            };
          }
          return s;
        }));
      } else {
        // status=1 (code=400)，更新状态为 1
        setSales(prev => prev.map(s => {
          if (s.sales_id === item.sales_id) {
            return {
              ...s,
              signing_request_state: 1,
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('检查服务协议状态失败:', err);
      alert('检查合同状态失败');
    } finally {
      setCheckingContracts(prev => {
        const newMap = new Map(prev);
        newMap.delete(item.sales_id);
        return newMap;
      });
    }
  };

  // 检查咨询协议状态（刷新）
  const handleCheckConsultContract = async (item: SalesRecord) => {
    if (!item.consult_tail || !item.sales_id) return;

    setCheckingContracts(prev => new Map(prev).set(item.sales_id, 'consult'));
    try {
      const result = await checkContractStatus(item.consult_tail);
      // status=0 (code=200) 且有 data，直接赋值并更新状态为 2
      if (result.code === 200 && result.data) {
        const downloadUrl = result.data.startsWith('http') 
          ? result.data 
          : buildFileUrl(result.data);
        
        // 更新列表中的数据：赋值下载地址，状态改为 2
        setSales(prev => prev.map(s => {
          if (s.sales_id === item.sales_id) {
            return {
              ...s,
              signing_request_state_2: 2,
              consult_file: downloadUrl,
            };
          }
          return s;
        }));
      } else {
        // status=1 (code=400)，更新状态为 1
        setSales(prev => prev.map(s => {
          if (s.sales_id === item.sales_id) {
            return {
              ...s,
              signing_request_state_2: 1,
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('检查咨询协议状态失败:', err);
      alert('检查合同状态失败');
    } finally {
      setCheckingContracts(prev => {
        const newMap = new Map(prev);
        newMap.delete(item.sales_id);
        return newMap;
      });
    }
  };

  // 下载服务协议
  const handleDownloadServiceContract = (item: SalesRecord) => {
    if (!item.service_file) {
      alert('服务协议文件不存在');
      return;
    }
    window.open(item.service_file, '_blank');
  };

  // 下载咨询协议
  const handleDownloadConsultContract = (item: SalesRecord) => {
    if (!item.consult_file) {
      alert('咨询协议文件不存在');
      return;
    }
    window.open(item.consult_file, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">招生管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理招生报名记录</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 w-full sm:w-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索姓名、邮箱、电话、销售人员、渠道..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-2 items-center">
              <div className="text-sm text-gray-600">
                共 {filteredSales.length} 条记录
                {filteredSales.length > pageSize && (
                  <span className="ml-2">
                    （第 {currentPage} / {totalPages} 页）
                  </span>
                )}
              </div>
              {canAdd && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  新增
                </button>
              )}
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of registration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales person</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">Operation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSales.map((item, index) => {
                    const globalIndex = (currentPage - 1) * pageSize + index;
                    return (
                      <tr key={item.sales_id || item.id || `sales-${globalIndex}`} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {globalIndex + 1}
                        </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.registration_time || item.create_time)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.email || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.phone || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sales_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.status_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.channel_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white group-hover:bg-gray-50">
                        <div className="flex items-center gap-2 justify-end">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                              title="编辑"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              编辑
                            </button>
                          )}
                          {canDeleteRecord(item) && (
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                              title="删除"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              删除
                            </button>
                          )}
                          {/* 服务协议按钮 */}
                          {item.signing_request_state === 1 && (
                            <button
                              onClick={() => handleCheckServiceContract(item)}
                              disabled={checkingContracts.get(item.sales_id) === 'service'}
                              className="inline-flex items-center justify-center w-8 h-8 text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="服务协议"
                            >
                              {checkingContracts.get(item.sales_id) === 'service' ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowPathIcon className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {item.signing_request_state === 2 && item.service_file && (
                            <button
                              onClick={() => handleDownloadServiceContract(item)}
                              className="inline-flex items-center justify-center w-8 h-8 text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                              title="下载服务协议"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                          )}
                          {/* 咨询协议按钮 - 根据配置决定是否显示 */}
                          {!siteConfig?.sales_simplified_mode && (
                            <>
                              {item.signing_request_state_2 === 1 && (
                                <button
                                  onClick={() => handleCheckConsultContract(item)}
                                  disabled={checkingContracts.get(item.sales_id) === 'consult'}
                                  className="inline-flex items-center justify-center w-8 h-8 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="咨询协议"
                                >
                                  {checkingContracts.get(item.sales_id) === 'consult' ? (
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ArrowPathIcon className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              {item.signing_request_state_2 === 2 && item.consult_file && (
                                <button
                                  onClick={() => handleDownloadConsultContract(item)}
                                  className="inline-flex items-center justify-center w-8 h-8 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="下载咨询协议"
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                  {paginatedSales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        {debouncedSearchTerm ? '未找到匹配的记录' : '暂无数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredSales.length)} 条，共 {filteredSales.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                {/* 每页显示数量选择器 */}
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50 条/页</option>
                  <option value={100}>100 条/页</option>
                  <option value={200}>200 条/页</option>
                </select>
                
                {/* 分页按钮 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  {/* 页码按钮 */}
                  {(() => {
                    const pages: (number | string)[] = [];
                    const maxPages = 7;
                    
                    if (totalPages <= maxPages) {
                      // 如果总页数小于等于7，显示所有页码
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // 如果总页数大于7，显示智能分页
                      if (currentPage <= 4) {
                        // 当前页在前面
                        for (let i = 1; i <= 5; i++) {
                          pages.push(i);
                        }
                        pages.push('...');
                        pages.push(totalPages);
                      } else if (currentPage >= totalPages - 3) {
                        // 当前页在后面
                        pages.push(1);
                        pages.push('...');
                        for (let i = totalPages - 4; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // 当前页在中间
                        pages.push(1);
                        pages.push('...');
                        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                          pages.push(i);
                        }
                        pages.push('...');
                        pages.push(totalPages);
                      }
                    }
                    
                    return pages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                            ...
                          </span>
                        );
                      }
                      
                      const pageNum = page as number;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    末页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 添加模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增Sales记录</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
                  <input
                    type="text"
                    value={formData.student_name || ''}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedSales && (
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
                      确定要删除合同ID为 {selectedSales.sales_id} 的记录吗？此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSales(null);
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

      </div>
    </div>
  );
}

