'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStaffCard, 
  getCardRechargeRecord,
  getCardConsumeRecord,
  cardRecharge,
  type StaffCardItem,
  type StaffCardResponse,
  type CardRechargeRecordItem,
  type CardConsumeRecordItem
} from '@/services/auth';
import { 
  CreditCardIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function MyCardPage() {
  const { user, hasPermission } = useAuth();
  const [cards, setCards] = useState<StaffCardItem[]>([]);
  const [rechargeRecords, setRechargeRecords] = useState<CardRechargeRecordItem[]>([]);
  const [consumeRecords, setConsumeRecords] = useState<CardConsumeRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [selectedCard, setSelectedRecord] = useState<StaffCardItem | null>(null);
  const [recordType, setRecordType] = useState<'recharge' | 'consume'>('recharge');
  const [rechargeForm, setRechargeForm] = useState({
    amount: ''
  });

  const canView = hasPermission(PERMISSIONS.VIEW_MY_CARD);
  const canEdit = hasPermission(PERMISSIONS.EDIT_MY_CARD);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getStaffCard();
      if (result.code === 200) {
        setCards(result.data?.rows || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardRecords = async (card: StaffCardItem, type: 'recharge' | 'consume') => {
    try {
      if (type === 'recharge') {
        const result = await getCardRechargeRecord(card.cardId);
        if (result.code === 200) {
          setRechargeRecords(result.data?.rows || []);
        }
      } else {
        const result = await getCardConsumeRecord(card.cardNo);
        if (result.code === 200) {
          setConsumeRecords(result.data?.rows || []);
        }
      }
    } catch (error) {
      console.error('加载记录失败:', error);
    }
  };

  const handleRecharge = async () => {
    if (!selectedCard || !canEdit) return;

    try {
      const result = await cardRecharge({
        card_id: selectedCard.cardId,
        amount: parseInt(rechargeForm.amount)
      });

      if (result.code === 200) {
        alert('充值成功，请完成支付');
        setShowRechargeModal(false);
        setRechargeForm({ amount: '' });
        setSelectedRecord(null);
        // 这里可以跳转到支付页面
        if (result.data) {
          window.open(result.data, '_blank');
        }
      } else {
        alert(result.message || '充值失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      alert('充值失败');
    }
  };

  const showRecords = (card: StaffCardItem, type: 'recharge' | 'consume') => {
    setSelectedRecord(card);
    setRecordType(type);
    setShowRecordsModal(true);
    loadCardRecords(card, type);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-800';
      case 0: return 'bg-red-100 text-red-800';
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
          <h1 className="text-2xl font-bold text-gray-900">My Card</h1>
          <p className="text-gray-600 mt-1">我的餐卡管理</p>
        </div>

        {/* 卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => (
            <div key={card.cardId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{card.personName}</h3>
                    <p className="text-sm text-gray-500">卡号: {card.cardNo}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(card.useStatus)}`}>
                  {card.useStatus === 1 ? '正常' : '挂失'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">总余额:</span>
                  <span className="text-sm font-semibold text-gray-900">{card.totalAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">有效期:</span>
                  <span className="text-sm text-gray-900">{card.startDate} - {card.endDate}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {canEdit && (
                  <button
                    onClick={() => {
                      setSelectedRecord(card);
                      setShowRechargeModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    充值
                  </button>
                )}
                <button
                  onClick={() => showRecords(card, 'recharge')}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  充值记录
                </button>
                <button
                  onClick={() => showRecords(card, 'consume')}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  消费记录
                </button>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && !loading && (
          <div className="text-center py-12">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无餐卡信息</p>
          </div>
        )}

        {/* 充值模态框 */}
        {showRechargeModal && selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">餐卡充值</h3>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeSlashIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      卡号：<strong>{selectedCard.cardNo}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      持卡人：<strong>{selectedCard.personName}</strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      充值金额
                    </label>
                    <input
                      type="number"
                      value={rechargeForm.amount}
                      onChange={(e) => setRechargeForm({ amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入充值金额"
                      min="1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleRecharge}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  确认充值
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 记录查看模态框 */}
        {showRecordsModal && selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {recordType === 'recharge' ? '充值记录' : '消费记录'} - {selectedCard.personName}
                </h3>
                <button
                  onClick={() => setShowRecordsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeSlashIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {recordType === 'recharge' ? (
                  <div className="space-y-4">
                    {rechargeRecords.map((record, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              交易号: {record.trade_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              状态: <span className={record.status ? 'text-green-600' : 'text-yellow-600'}>
                                {record.status_str}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              金额: ¥{record.amount}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {record.create_time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {rechargeRecords.length === 0 && (
                      <p className="text-center text-gray-500 py-8">暂无充值记录</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consumeRecords.map((record, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              商户: {record.merchantName}
                            </p>
                            <p className="text-sm text-gray-600">
                              消费: {record.deduction}
                            </p>
                            <p className="text-sm text-gray-600">
                              余额: {record.balance}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {record.debitTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {consumeRecords.length === 0 && (
                      <p className="text-center text-gray-500 py-8">暂无消费记录</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowRecordsModal(false)}
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
