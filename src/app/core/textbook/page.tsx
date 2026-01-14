'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getTextbookList,
  getTextbookPurchases,
  markTextbookAsReceived,
  deleteTextbookPurchase,
  type TextbookItem,
  type TextbookPurchase
} from '@/services/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  CheckIcon,
  TrashIcon,
  ChevronRightIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const TEXTBOOK_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: '待付款', color: 'text-gray-500 bg-gray-100' },
  1: { label: '已付款', color: 'text-blue-500 bg-blue-100' },
  2: { label: '已取消', color: 'text-red-500 bg-red-100' },
  3: { label: '已领取', color: 'text-green-500 bg-green-100' },
};

export default function TextbookPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.EDIT_BOOKS);
  const canOperate = hasPermission(PERMISSIONS.EDIT_TEXTBOOK_PURCHASE);

  const [textbooks, setTextbooks] = useState<TextbookItem[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<TextbookItem | null>(null);
  const [purchases, setPurchases] = useState<TextbookPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 加载教材列表
  useEffect(() => {
    if (canView) {
      loadTextbooks();
    }
  }, [canView]);

  const loadTextbooks = async () => {
    try {
      setListLoading(true);
      const response = await getTextbookList();
      if (response.code === 200 && response.data) {
        setTextbooks(response.data);
      }
    } catch (error) {
      console.error('加载教材列表失败:', error);
    } finally {
      setListLoading(false);
    }
  };

  // 加载购买记录
  const loadPurchases = async (textbookId: number) => {
    try {
      setLoading(true);
      const response = await getTextbookPurchases(textbookId);
      if (response.code === 200 && response.data) {
        // 只显示 0, 1, 3 的记录
        setPurchases(response.data.filter(p => [0, 1, 3].includes(p.status)));
      }
    } catch (error) {
      console.error('加载购买记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTextbook = (textbook: TextbookItem) => {
    setSelectedTextbook(textbook);
    loadPurchases(textbook.id);
  };

  const handleMarkAsReceived = async (purchase: TextbookPurchase) => {
    if (!confirm(`确定将学生 ${purchase.student_name} 的教材标记为已领取吗？`)) return;

    try {
      setActionLoading(purchase.id);
      const response = await markTextbookAsReceived(purchase.id);
      if (response.code === 200) {
        // 刷新数据
        loadPurchases(purchase.textbook_id);
      } else {
        alert(response.message || '操作失败');
      }
    } catch (error) {
      console.error('标记领取失败:', error);
      alert('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePurchase = async (purchase: TextbookPurchase) => {
    if (!confirm(`确定回滚(删除)学生 ${purchase.student_name} 的购买记录吗？库存将会恢复。`)) return;

    try {
      setActionLoading(purchase.id);
      const response = await deleteTextbookPurchase(purchase.id);
      if (response.code === 200) {
        // 刷新数据
        loadPurchases(purchase.textbook_id);
      } else {
        alert(response.message || '操作失败');
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      alert('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTextbooks = textbooks.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看教材预订管理</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          {selectedTextbook && (
            <button
              onClick={() => setSelectedTextbook(null)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="返回列表"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">教材预订管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              {selectedTextbook ? `查看教材 [${selectedTextbook.name}] 的购买记录` : '选择教材查看购买名单'}
            </p>
          </div>
        </div>

        {!selectedTextbook ? (
          // 教材列表
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="relative max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索教材名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {listLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* PC端列表视图 */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">教材名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已付款人数</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTextbooks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">未找到相关教材</td>
                        </tr>
                      ) : (
                        filteredTextbooks.map((textbook) => (
                          <tr 
                            key={textbook.id} 
                            onClick={() => handleSelectTextbook(textbook)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{textbook.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{textbook.type || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{textbook.price}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{textbook.paid_count} 人</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <ChevronRightIcon className="h-5 w-5 text-gray-400 inline" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 移动端卡片视图 */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {filteredTextbooks.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">未找到相关教材</div>
                  ) : (
                    filteredTextbooks.map((textbook) => (
                      <button
                        key={textbook.id}
                        onClick={() => handleSelectTextbook(textbook)}
                        className="bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition-shadow group flex items-start justify-between"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {textbook.name}
                          </h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500">类型: {textbook.type || '-'}</p>
                            <p className="text-sm text-gray-500">价格: ¥{textbook.price}</p>
                            <p className="text-sm font-medium text-blue-600">已付款: {textbook.paid_count} 人</p>
                          </div>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors mt-1" />
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          // 购买记录表格
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">{selectedTextbook?.name}</span>
              </div>
              <button
                onClick={() => selectedTextbook && loadPurchases(selectedTextbook.id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="刷新"
              >
                <ArrowPathIcon className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto hidden md:block">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">购买时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                          暂无购买记录
                        </td>
                      </tr>
                    ) : (
                      purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {purchase.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${TEXTBOOK_STATUS[purchase.status]?.color}`}>
                              {TEXTBOOK_STATUS[purchase.status]?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.create_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-3">
                              {/* 状态为1(已付款)时，可以标记为已领取 */}
                              {purchase.status === 1 && canOperate && (
                                <button
                                  onClick={() => handleMarkAsReceived(purchase)}
                                  disabled={actionLoading === purchase.id}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                  领取
                                </button>
                              )}
                              {/* 状态为1(已付款)或3(已领取)时，可以回滚 */}
                              {[1, 3].includes(purchase.status) && canOperate && (
                                <button
                                  onClick={() => handleDeletePurchase(purchase)}
                                  disabled={actionLoading === purchase.id}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  回滚
                                </button>
                              )}
                              {!canOperate && (
                                <span className="text-gray-400 italic font-normal">无操作权限</span>
                              )}
                              {![1, 3].includes(purchase.status) && canOperate && (
                                <span className="text-gray-400 font-normal">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* 详情页移动端卡片视图 */}
            <div className="md:hidden">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : purchases.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">暂无购买记录</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{purchase.student_name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${TEXTBOOK_STATUS[purchase.status]?.color}`}>
                          {TEXTBOOK_STATUS[purchase.status]?.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">购买时间: {purchase.create_time}</div>
                      <div className="flex items-center justify-end gap-4">
                        {purchase.status === 1 && canOperate && (
                          <button
                            onClick={() => handleMarkAsReceived(purchase)}
                            disabled={actionLoading === purchase.id}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium flex items-center gap-1 active:bg-green-100 transition-colors"
                          >
                            <CheckIcon className="h-4 w-4" />
                            领取
                          </button>
                        )}
                        {[1, 3].includes(purchase.status) && canOperate && (
                          <button
                            onClick={() => handleDeletePurchase(purchase)}
                            disabled={actionLoading === purchase.id}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-medium flex items-center gap-1 active:bg-red-100 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                            回滚
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
