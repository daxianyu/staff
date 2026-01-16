'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getTextbookEditInfo,
  editTextbook,
  getTextbookPurchases,
  markTextbookAsReceived,
  deleteTextbookPurchase,
  type TextbookEditInfo,
  type TextbookPurchase,
  type TextbookFormData
} from '@/services/auth';
import {
  ArrowLeftIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  BookOpenIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const TEXTBOOK_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: '待付款', color: 'text-gray-500 bg-gray-100' },
  1: { label: '已付款', color: 'text-blue-500 bg-blue-100' },
  2: { label: '已取消', color: 'text-red-500 bg-red-100' },
  3: { label: '已领取', color: 'text-green-500 bg-green-100' },
};

export default function TextbookDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission(PERMISSIONS.EDIT_BOOKS);
  const canOperate = hasPermission(PERMISSIONS.EDIT_TEXTBOOK_PURCHASE);

  const textbookId = searchParams.get('id') ? parseInt(searchParams.get('id')!, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [editInfo, setEditInfo] = useState<TextbookEditInfo | null>(null);
  const [purchases, setPurchases] = useState<TextbookPurchase[]>([]);
  const [formData, setFormData] = useState<TextbookFormData>({
    name: '',
    type: '',
    price: 0,
    inventory_info: {}
  });

  useEffect(() => {
    if (!Number.isNaN(textbookId)) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [textbookId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [infoRes, purchasesRes] = await Promise.all([
        getTextbookEditInfo(textbookId),
        getTextbookPurchases(textbookId)
      ]);

      if (infoRes.code === 200 && infoRes.data) {
        setEditInfo(infoRes.data);
        setFormData({
          name: infoRes.data.name,
          type: infoRes.data.type,
          price: infoRes.data.price,
          inventory_info: Object.fromEntries(
            Object.entries(infoRes.data.inventory_info).map(([k, v]) => [parseInt(k, 10), v])
          )
        });
      }

      if (purchasesRes.code === 200 && purchasesRes.data) {
        setPurchases(purchasesRes.data);
      }
    } catch (error) {
      console.error('加载教材详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const response = await getTextbookPurchases(textbookId);
      if (response.code === 200 && response.data) {
        setPurchases(response.data);
      }
    } catch (error) {
      console.error('加载购买记录失败:', error);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaveLoading(true);
    try {
      const response = await editTextbook(textbookId, formData);
      if (response.code === 200) {
        alert('保存成功');
      } else {
        alert(response.message || '保存失败');
      }
    } catch (error) {
      console.error('保存教材失败:', error);
      alert('保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const getDisplayName = (purchase: TextbookPurchase) => {
    const name = purchase.display_name?.trim();
    return name || `${purchase.first_name || ''}${purchase.last_name || ''}`.trim() || `用户 ${purchase.user_id}`;
  };

  const getStatusLabel = (purchase: TextbookPurchase) => {
    return purchase.state_name || TEXTBOOK_STATUS[purchase.state]?.label || '-';
  };

  const handleMarkAsReceived = async (purchase: TextbookPurchase) => {
    const displayName = getDisplayName(purchase);
    if (!confirm(`确定将 ${displayName} 的教材标记为已领取吗？`)) return;

    setActionLoading(purchase.record_id);
    try {
      const response = await markTextbookAsReceived(purchase.record_id);
      if (response.code === 200) {
        loadPurchases();
      } else {
        alert(response.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePurchase = async (purchase: TextbookPurchase) => {
    const displayName = getDisplayName(purchase);
    if (!confirm(`确定回滚(删除) ${displayName} 的购买记录吗？库存将会恢复。`)) return;

    setActionLoading(purchase.record_id);
    try {
      const response = await deleteTextbookPurchase(purchase.record_id);
      if (response.code === 200) {
        loadPurchases();
      } else {
        alert(response.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (Number.isNaN(textbookId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">缺少教材 ID</h3>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">返回列表</button>
        </div>
      </div>
    );
  }

  if (!editInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">教材不存在</h3>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">返回列表</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">教材详情与预订管理</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 上半部分：编辑表单 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">教材基本信息</h2>
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教材名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教材类型</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">校区库存</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(editInfo.campus_info).map(([campusId, campusName]) => (
                    <div key={campusId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600 min-w-[80px]">{campusName}</span>
                      <input
                        type="number"
                        value={formData.inventory_info[parseInt(campusId, 10)] || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          inventory_info: {
                            ...formData.inventory_info,
                            [parseInt(campusId, 10)]: parseInt(e.target.value, 10) || 0
                          }
                        })}
                        disabled={!canEdit}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {canEdit && (
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {saveLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    保存修改
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* 下半部分：购买记录 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">购买记录</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  共 {purchases.length} 条记录
                </span>
              </div>
              <button
                onClick={loadPurchases}
                disabled={purchasesLoading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="刷新名单"
              >
                <ArrowPathIcon className={`h-5 w-5 text-gray-500 ${purchasesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* PC端表格 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">购买时间</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">暂无购买记录</td>
                    </tr>
                  ) : (
                    purchases.map((purchase) => (
                      <tr key={purchase.record_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getDisplayName(purchase)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${TEXTBOOK_STATUS[purchase.state]?.color || 'text-gray-500 bg-gray-100'}`}>
                            {getStatusLabel(purchase)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.signup_time_str}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-3">
                            {purchase.state === 1 && canOperate && (
                              <button
                                onClick={() => handleMarkAsReceived(purchase)}
                                disabled={actionLoading === purchase.record_id}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckIcon className="h-4 w-4" />
                                领取
                              </button>
                            )}
                            {[1, 3].includes(purchase.state) && canOperate && (
                              <button
                                onClick={() => handleDeletePurchase(purchase)}
                                disabled={actionLoading === purchase.record_id}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                                回滚
                              </button>
                            )}
                            {(!canOperate || ![1, 3].includes(purchase.state)) && (
                              <span className="text-gray-400 font-normal">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片 */}
            <div className="md:hidden divide-y divide-gray-200">
              {purchases.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">暂无购买记录</div>
              ) : (
                purchases.map((purchase) => (
                  <div key={purchase.record_id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{getDisplayName(purchase)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${TEXTBOOK_STATUS[purchase.state]?.color || 'text-gray-500 bg-gray-100'}`}>
                        {getStatusLabel(purchase)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">购买时间: {purchase.signup_time_str}</div>
                    <div className="flex items-center justify-end gap-3">
                      {purchase.state === 1 && canOperate && (
                        <button
                          onClick={() => handleMarkAsReceived(purchase)}
                          disabled={actionLoading === purchase.record_id}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded border border-green-200 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckIcon className="h-4 w-4" />
                          领取
                        </button>
                      )}
                      {[1, 3].includes(purchase.state) && canOperate && (
                        <button
                          onClick={() => handleDeletePurchase(purchase)}
                          disabled={actionLoading === purchase.record_id}
                          className="px-3 py-1 bg-red-50 text-red-700 rounded border border-red-200 text-sm font-medium flex items-center gap-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                          回滚
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
