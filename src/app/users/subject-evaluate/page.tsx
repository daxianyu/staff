'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getOwnerEvaluate, 
  getOtherEvaluate, 
  changeEvaluate,
  type SubjectEvaluateItem,
  type SubjectEvaluateResponse 
} from '@/services/auth';
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function SubjectEvaluatePage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'owner' | 'other'>('owner');
  const [ownerData, setOwnerData] = useState<SubjectEvaluateItem[]>([]);
  const [otherData, setOtherData] = useState<SubjectEvaluateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SubjectEvaluateItem | null>(null);

  const canView = hasPermission(PERMISSIONS.VIEW_SUBJECT_EVALUATE);
  const canEdit = hasPermission(PERMISSIONS.EDIT_SUBJECT_EVALUATE);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ownerResult, otherResult] = await Promise.all([
        getOwnerEvaluate(),
        getOtherEvaluate()
      ]);

      if (ownerResult.code === 200) {
        setOwnerData(ownerResult.data?.rows || []);
      }
      if (otherResult.code === 200) {
        setOtherData(otherResult.data?.rows || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: SubjectEvaluateItem) => {
    setEditingId(item.evaluate_id);
    setEditContent(item.evaluate || '');
    setEditingItem(item);
    setShowEditModal(true);
  };

  // 计算汉字字符数（中文字符算1个，其他字符也算1个）
  const getCharCount = (text: string): number => {
    return text.length;
  };

  // 获取最大字数限制
  const getMaxCharLimit = (): number => {
    if (!editingItem) return 250;
    const title = editingItem.evaluate_title || '';
    return title.includes('模考') ? 450 : 250;
  };

  const handleSaveEdit = async () => {
    if (!editingId || !canEdit) return;

    const charCount = getCharCount(editContent);
    const maxLimit = getMaxCharLimit();

    if (charCount > maxLimit) {
      alert(`字数不能超过${maxLimit}个字符，当前${charCount}个字符`);
      return;
    }

    try {
      const result = await changeEvaluate({
        record_id: editingId,
        evaluate: editContent
      });

      if (result.code === 200) {
        // 更新本地数据
        const updateData = (items: SubjectEvaluateItem[]) => 
          items.map(item => 
            item.evaluate_id === editingId 
              ? { ...item, evaluate: editContent }
              : item
          );
        
        setOwnerData(updateData);
        setOtherData(updateData);
        
        setShowEditModal(false);
        setEditingId(null);
        setEditContent('');
        setEditingItem(null);
      } else {
        alert(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  const currentData = activeTab === 'owner' ? ownerData : otherData;

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
          <h1 className="text-2xl font-bold text-gray-900">Subject Evaluate</h1>
          <p className="text-gray-600 mt-1">科目评价管理</p>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('owner')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'owner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                需要我填写的 ({ownerData.length})
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'other'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                其他导师评价 ({otherData.length})
              </button>
            </nav>
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
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[150px]">
                      标题
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[120px]">
                      学生姓名
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[150px]">
                      考试名称
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                      等第
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                      得分
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                      总分
                    </th>
                    {activeTab === 'other' && (
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[120px]">
                        老师名称
                      </th>
                    )}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[150px]">
                      Mentor
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[300px]">
                      评价
                    </th>
                    {canEdit && activeTab === 'owner' && (
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((item) => (
                    <tr key={item.evaluate_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[180px] break-words">
                        {item.evaluate_title || '-'}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[100px] break-words">
                        {item.student_name}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[150px] break-words">
                        {item.exam_name}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[80px] break-words">
                        {item.grade || '-'}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[80px] break-words">
                        {item.result || '-'}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[80px] break-words">
                        {item.second || '-'}
                      </td>
                      {activeTab === 'other' && (
                        <td className="px-2 py-4 text-sm text-gray-900 max-w-[120px] break-words">
                          {item.teacher_name || '-'}
                        </td>
                      )}
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[150px] break-words">
                        {item.mentor_str}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 max-w-[300px] break-words">
                        {item.evaluate || '-'}
                      </td>
                      {canEdit && activeTab === 'owner' && (
                        <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            编辑
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {currentData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 编辑模态框 */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">编辑评价</h3>
                  {editingItem?.student_name && (
                    <p className="text-sm text-gray-600 mt-1">学生：{editingItem.student_name}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setEditContent('');
                    setEditingId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      评价内容
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        getCharCount(editContent) > getMaxCharLimit()
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder={
                        editingItem?.evaluate_title?.includes('模考')
                          ? '请输入评价内容...（模考评价字数不能超过450个字符）'
                          : '请输入评价内容...（期中期末评价字数不能超过250个字符）'
                      }
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {editingItem?.evaluate_title?.includes('模考') 
                          ? '模考评价：字数不能超过450个字符'
                          : '期中期末评价：字数不能超过250个字符'}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          getCharCount(editContent) > getMaxCharLimit()
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {getCharCount(editContent)} / {getMaxCharLimit()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setEditContent('');
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
