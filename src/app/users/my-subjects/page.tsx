'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getSubjectOverview, 
  disableSubject,
  type SubjectOverviewItem
} from '@/services/auth';
import { 
  BookOpenIcon, 
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function MySubjectsPage() {
  const { user, hasPermission } = useAuth();
  const [subjects, setSubjects] = useState<SubjectOverviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, string>>({});

  const canView = hasPermission(PERMISSIONS.VIEW_MY_SUBJECTS);
  const canEdit = hasPermission(PERMISSIONS.EDIT_MY_SUBJECTS);

  useEffect(() => {
    if (canView && user?.id) {
      loadData();
    }
  }, [canView, user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const result = await getSubjectOverview(user.id);
      if (result.code === 200) {
        setSubjects(result.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSubjects = async () => {
    if (!canEdit) return;

    try {
      const result = await disableSubject(selectedSubjects);
      if (result.code === 200) {
        alert('科目状态更新成功');
        setShowDisableModal(false);
        setSelectedSubjects({});
        loadData();
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
    }
  };

  const handleSelectSubject = (subjectId: string, checked: boolean) => {
    setSelectedSubjects(prev => ({
      ...prev,
      [subjectId]: checked ? '1' : '0'
    }));
  };

  const selectedCount = Object.values(selectedSubjects).filter(value => value === '1').length;

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
          <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
          <p className="text-gray-600 mt-1">我的科目管理</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">共 {subjects.length} 个科目</span>
              {selectedCount > 0 && (
                <span className="text-sm text-blue-600">已选择 {selectedCount} 个科目</span>
              )}
            </div>
            {canEdit && selectedCount > 0 && (
              <button
                onClick={() => setShowDisableModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                禁用选中科目
              </button>
            )}
          </div>
        </div>

        {/* 科目列表 */}
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
                    {canEdit && (
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelection: Record<string, string> = {};
                            subjects.forEach(subject => {
                              newSelection[subject.id.toString()] = checked ? '1' : '0';
                            });
                            setSelectedSubjects(newSelection);
                          }}
                          checked={selectedCount === subjects.length && subjects.length > 0}
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      科目ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      班级名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedSubjects[subject.id.toString()] === '1'}
                            onChange={(e) => handleSelectSubject(subject.id.toString(), e.target.checked)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
                          {subject.class_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          活跃
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {subjects.length === 0 && (
                <div className="text-center py-12">
                  <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无科目信息</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 禁用确认模态框 */}
        {showDisableModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      确认禁用科目
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要禁用选中的 <strong>{selectedCount}</strong> 个科目吗？禁用后这些科目将不再可用。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDisableSubjects}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  确认禁用
                </button>
                <button
                  onClick={() => setShowDisableModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
