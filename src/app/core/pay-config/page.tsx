'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  KeyIcon,
  UserGroupIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import {
  getPayConfigList,
  getPayAccountList,
  updatePayAccount,
  getPasscodeInfo,
  updatePasscode,
  getMultiAccount,
  addMultiAccount,
  deleteMultiAccount,
  getStudentFixedAccount,
  addStudentFixedAccount,
  deleteStudentFixedAccount,
  PayConfigRecord,
  PayAccountOption,
  PayTypeOption,
  MultiAccountRecord,
  StudentFixedAccountRecord
} from '@/services/modules/pay_config';
import { getStudentList, StudentInfo } from '@/services/modules/academics';

// 标签页定义
const TABS = [
  { id: 'account', name: '账户配置', icon: CreditCardIcon },
  { id: 'passcode', name: 'Passcode配置', icon: KeyIcon },
  { id: 'multi', name: '多账户配置', icon: UserGroupIcon },
  { id: 'fixed', name: '学生固定账户', icon: UserIcon },
];

export default function PayConfigPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_PAY_CONFIG);
  const [activeTab, setActiveTab] = useState('account');

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看支付配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <WrenchScrewdriverIcon className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">支付配置管理</h1>
              <p className="text-sm text-gray-500">管理支付账户、Passcode、多账户设置及学生固定账户</p>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    <Icon className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'account' && <AccountConfigTab />}
          {activeTab === 'passcode' && <PasscodeTab />}
          {activeTab === 'multi' && <MultiAccountTab />}
          {activeTab === 'fixed' && <StudentFixedAccountTab />}
        </div>
      </div>
    </div>
  );
}

// 1. 账户配置标签页
function AccountConfigTab() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PayConfigRecord[]>([]);
  const [payAccounts, setPayAccounts] = useState<PayAccountOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, optionsRes] = await Promise.all([
        getPayConfigList(),
        getPayAccountList()
      ]);

      if (listRes.code === 200 && listRes.data) {
        setRecords(listRes.data.rows);
      }
      if (optionsRes.code === 200 && optionsRes.data) {
        setPayAccounts(optionsRes.data.pay_account);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record: PayConfigRecord) => {
    setEditingId(record.record_id);
    setEditValue(record.account);
  };

  const handleSave = async (recordId: number) => {
    if (editValue === null) return;
    try {
      const result = await updatePayAccount({ record_id: recordId, new_account: editValue });
      if (result.code === 200) {
        setEditingId(null);
        fetchData(); // 刷新列表
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(null);
  };

  if (loading && records.length === 0) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">账户列表配置</h2>
        <button onClick={fetchData} className="text-sm text-blue-600 hover:text-blue-800">刷新</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前账户</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.record_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.record_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.pay_desc}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === record.record_id ? (
                    <SearchableSelect
                      options={payAccounts.map(opt => ({ id: opt.id, name: opt.value }))}
                      value={editValue || 0}
                      onValueChange={(val) => setEditValue(val as number)}
                      placeholder="请选择账户"
                      className="w-full"
                    />
                  ) : (
                    record.account_name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === record.record_id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleSave(record.record_id)} className="text-green-600 hover:text-green-900"><CheckIcon className="h-5 w-5" /></button>
                      <button onClick={handleCancel} className="text-red-600 hover:text-red-900"><XMarkIcon className="h-5 w-5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto">
                      <PencilIcon className="h-4 w-4" /> 编辑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. Passcode配置标签页
function PasscodeTab() {
  const [loading, setLoading] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const fetchPasscode = async () => {
    setLoading(true);
    try {
      const result = await getPasscodeInfo();
      if (result.code === 200) {
        setPasscode(result.data || '');
      }
    } catch (error) {
      console.error('加载Passcode失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasscode();
  }, []);

  const handleEdit = () => {
    setEditValue(passcode);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      alert('Passcode不能为空');
      return;
    }
    try {
      const result = await updatePasscode({ new_passcode: editValue });
      if (result.code === 200) {
        setPasscode(editValue);
        setIsEditing(false);
        alert('更新成功');
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Passcode 设置</h2>
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">当前 Passcode</label>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          ) : (
            <div className="text-lg font-mono bg-white px-3 py-2 rounded border border-gray-300">
              {loading ? '加载中...' : (passcode || '未设置')}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                保存
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              修改
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. 多账户配置标签页
function MultiAccountTab() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MultiAccountRecord[]>([]);
  const [payAccounts, setPayAccounts] = useState<PayAccountOption[]>([]);
  const [payTypes, setPayTypes] = useState<PayTypeOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, optionsRes] = await Promise.all([
        getMultiAccount(),
        getPayAccountList()
      ]);

      if (listRes.code === 200 && listRes.data) {
        setRecords(listRes.data.rows);
      }
      if (optionsRes.code === 200 && optionsRes.data) {
        setPayAccounts(optionsRes.data.pay_account);
        setPayTypes(optionsRes.data.pay_type);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (recordId: number) => {
    if (!confirm('确定要删除这条多账户配置吗？')) return;
    try {
      const result = await deleteMultiAccount(recordId);
      if (result.code === 200) {
        fetchData();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">多账户配置列表</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          新增配置
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户1 (金额)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户2 (金额)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户3 (金额)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.record_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.account_pay_type_desc}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.account_1_name} <span className="text-gray-900 font-medium">({record.account_1_amount})</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.account_2_name} <span className="text-gray-900 font-medium">({record.account_2_amount})</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.account_3 !== -1 ? (
                    <>
                      {record.account_3_name} <span className="text-gray-900 font-medium">({record.account_3_amount})</span>
                    </>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.create_time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(record.record_id)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddMultiAccountModal
          payAccounts={payAccounts}
          payTypes={payTypes}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

import BaseModal from '../tools/components/BaseModal';

function AddMultiAccountModal({
  payAccounts,
  payTypes,
  onClose,
  onSuccess
}: {
  payAccounts: PayAccountOption[],
  payTypes: PayTypeOption[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    account_pay_type: 0,
    account_1: 0,
    account_1_amount: '',
    account_2: 0,
    account_2_amount: '',
    account_3: 0,
    account_3_amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_pay_type || !formData.account_1 || !formData.account_2) {
      alert('请填写必要信息（类型、账户1、账户2）');
      return;
    }

    try {
      const result = await addMultiAccount({
        account_pay_type: formData.account_pay_type,
        account_1: formData.account_1,
        account_2: formData.account_2,
        account_3: formData.account_3 || -1,
        account_1_amount: Number(formData.account_1_amount),
        account_2_amount: Number(formData.account_2_amount),
        account_3_amount: formData.account_3_amount ? Number(formData.account_3_amount) : 0,
      });

      if (result.code === 200) {
        onSuccess();
      } else {
        alert(result.message || '添加失败');
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    }
  };

  const payTypeOptions = payTypes.map(t => ({ id: t.id, name: t.value }));
  const accountOptions = payAccounts.map(a => ({ id: a.id, name: a.value }));

  return (
    <BaseModal isOpen={true} onClose={onClose} title="新增多账户配置">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">支付类型</label>
          <SearchableSelect
            options={payTypeOptions}
            value={formData.account_pay_type}
            onValueChange={(val) => setFormData({ ...formData, account_pay_type: val as number })}
            placeholder="请选择支付类型"
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账户 1</label>
            <SearchableSelect
              options={accountOptions}
              value={formData.account_1}
              onValueChange={(val) => setFormData({ ...formData, account_1: val as number })}
              placeholder="请选择账户"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 1</label>
            <input
              type="number"
              value={formData.account_1_amount}
              onChange={(e) => setFormData({ ...formData, account_1_amount: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账户 2</label>
            <SearchableSelect
              options={accountOptions}
              value={formData.account_2}
              onValueChange={(val) => setFormData({ ...formData, account_2: val as number })}
              placeholder="请选择账户"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 2</label>
            <input
              type="number"
              value={formData.account_2_amount}
              onChange={(e) => setFormData({ ...formData, account_2_amount: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账户 3 (选填)</label>
            <SearchableSelect
              options={accountOptions}
              value={formData.account_3}
              onValueChange={(val) => setFormData({ ...formData, account_3: val as number })}
              placeholder="请选择账户"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 3</label>
            <input
              type="number"
              value={formData.account_3_amount}
              onChange={(e) => setFormData({ ...formData, account_3_amount: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 4. 学生固定账户标签页
function StudentFixedAccountTab() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<StudentFixedAccountRecord[]>([]);
  const [payAccounts, setPayAccounts] = useState<PayAccountOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, optionsRes] = await Promise.all([
        getStudentFixedAccount(),
        getPayAccountList()
      ]);

      if (listRes.code === 200 && listRes.data) {
        setRecords(listRes.data.rows);
      }
      if (optionsRes.code === 200 && optionsRes.data) {
        setPayAccounts(optionsRes.data.pay_account);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (recordId: number) => {
    if (!confirm('确定要删除这条固定账户设置吗？')) return;
    try {
      const result = await deleteStudentFixedAccount(recordId);
      if (result.code === 200) {
        fetchData();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">学生固定支付账户列表</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          新增设置
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">固定账户</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.record_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.student_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.pay_account}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(record.record_id)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddStudentFixedAccountModal
          payAccounts={payAccounts}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

import SearchableSelect from '@/components/SearchableSelect';

function AddStudentFixedAccountModal({
  payAccounts,
  onClose,
  onSuccess
}: {
  payAccounts: PayAccountOption[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [payType, setPayType] = useState<number | null>(null);
  const [studentOptions, setStudentOptions] = useState<Array<{ id: number, name: string }>>([]);

  // 初始加载学生列表
  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (value: string) => {
    try {
      const result = await getStudentList({ name: value, limit: 20 });
      if (result.code === 200 && result.data && typeof result.data === 'object' && 'list_info' in result.data) {
        const listInfo = (result.data as { list_info: StudentInfo[] }).list_info;
        if (Array.isArray(listInfo)) {
          setStudentOptions(listInfo.map((s: StudentInfo) => ({
            id: s.student_id,
            name: s.student_name
          })));
        }
      }
    } catch (error) {
      console.error('搜索学生失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || payType === null) {
      alert('请选择学生和账户');
      return;
    }

    try {
      const result = await addStudentFixedAccount({
        student_id: studentId,
        pay_type: payType,
      });

      if (result.code === 200) {
        onSuccess();
      } else {
        alert(result.message || '添加失败');
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    }
  };

  const accountOptions = payAccounts.map(a => ({ id: a.id, name: a.value }));

  return (
    <BaseModal isOpen={true} onClose={onClose} title="新增学生固定账户">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">学生</label>
          <SearchableSelect
            options={studentOptions}
            value={studentId || 0}
            onValueChange={(val) => setStudentId(val as number)}
            onSearch={handleSearch}
            placeholder="搜索并选择学生..."
            searchPlaceholder="输入姓名搜索..."
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">固定账户</label>
          <SearchableSelect
            options={accountOptions}
            value={payType || 0}
            onValueChange={(val) => setPayType(val as number)}
            placeholder="请选择账户"
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
