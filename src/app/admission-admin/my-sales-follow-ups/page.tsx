'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EnvelopeIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getAllSales,
  getSalesInfo,
  sendEntranceAdmission,
  sendEntranceReject,
  addSalesToStudent,
  type SalesRecord,
} from '@/services/auth';

export default function MySalesFollowUpsPage() {
  const { hasPermission, user } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_SALES_INFO) || 
                  hasPermission(PERMISSIONS.VIEW_CONTRACTS_INFO);

  // 状态管理
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 模态框状态
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSales, setSelectedSales] = useState<SalesRecord | null>(null);
  const [salesInfo, setSalesInfo] = useState<any>(null);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看我的Sales跟进</p>
        </div>
      </div>
    );
  }

  // 加载数据 - 一次性获取所有数据，然后过滤出当前用户负责的
  const loadData = async () => {
    setLoading(true);
    try {
      // 获取所有sales，然后在前端过滤出当前用户负责的
      const result = await getAllSales();
      if (result.code === 200 && result.data) {
        // 过滤出当前用户负责的sales
        const filteredSales = result.data.rows.filter(item => 
          item.assigned_staff === user?.id
        );
        setSales(filteredSales);
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
    if (user) {
      loadData();
    }
  }, [user]);

  // 前端搜索过滤
  const filteredSales = useMemo(() => {
    let filtered = sales;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.student_name || '').toLowerCase().includes(term) ||
        (item.sales_id?.toString() || '').includes(term) ||
        (item.phone || '').includes(term) ||
        (item.email || '').toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [sales, searchTerm]);

  // 打开详情模态框
  const handleViewInfo = async (item: SalesRecord) => {
    setSelectedSales(item);
    setLoading(true);
    try {
      const result = await getSalesInfo(item.sales_id);
      if (result.code === 200 && result.data) {
        setSalesInfo(result.data);
        setShowInfoModal(true);
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

  // 发送录取通知
  const handleSendAdmission = async (item: SalesRecord) => {
    if (!confirm('确定要发送录取通知邮件吗？')) return;
    
    try {
      const result = await sendEntranceAdmission(item.sales_id);
      if (result.code === 200) {
        alert('发送成功');
      } else {
        alert('发送失败: ' + result.message);
      }
    } catch (error) {
      console.error('发送失败:', error);
      alert('发送失败');
    }
  };

  // 发送拒信
  const handleSendReject = async (item: SalesRecord) => {
    if (!confirm('确定要发送拒信邮件吗？')) return;
    
    try {
      const result = await sendEntranceReject(item.sales_id);
      if (result.code === 200) {
        alert('发送成功');
      } else {
        alert('发送失败: ' + result.message);
      }
    } catch (error) {
      console.error('发送失败:', error);
      alert('发送失败');
    }
  };

  // 添加到学生
  const handleAddToStudent = async (item: SalesRecord) => {
    if (!confirm('确定要将此记录添加到学生列表吗？')) return;
    
    try {
      const result = await addSalesToStudent(item.sales_id);
      if (result.code === 200) {
        alert('添加成功');
        loadData();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Sales Follow Ups</h1>
          <p className="mt-2 text-sm text-gray-600">查看我负责的Sales跟进记录</p>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 w-full sm:w-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索姓名、销售ID、电话或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              共 {filteredSales.length} 条记录
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销售ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">招生老师</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电话</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">渠道</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((item) => (
                    <tr key={item.sales_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sales_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.status_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sales_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.channel_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.create_time || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInfo(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="查看详情"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleSendAdmission(item)}
                            className="text-green-600 hover:text-green-900"
                            title="发送录取通知"
                          >
                            <EnvelopeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleSendReject(item)}
                            className="text-orange-600 hover:text-orange-900"
                            title="发送拒信"
                          >
                            <EnvelopeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleAddToStudent(item)}
                            className="text-purple-600 hover:text-purple-900"
                            title="添加到学生"
                          >
                            <UserPlusIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? '未找到匹配的记录' : '暂无数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 详情模态框 */}
        {showInfoModal && salesInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Sales详情</h3>
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    setSalesInfo(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {salesInfo.info && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
                      <div className="text-sm text-gray-900">{salesInfo.info.student_name || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                      <div className="text-sm text-gray-900">{salesInfo.info.email || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                      <div className="text-sm text-gray-900">{salesInfo.info.phone || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">当前学校</label>
                      <div className="text-sm text-gray-900">{salesInfo.info.current_school || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                      <div className="text-sm text-gray-900">{salesInfo.info.grade || '-'}</div>
                    </div>
                  </>
                )}
                {salesInfo.student_repeat_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">重复信息</label>
                    <div className="text-sm text-gray-900">{salesInfo.student_repeat_info}</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    setSalesInfo(null);
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