'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getClassInfo, ClassInfoData, ClassTopic } from '@/services/auth';

export default function ClassEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassInfoData | null>(null);
  const [saving, setSaving] = useState(false);
  
  const classId = searchParams.get('id');

  // 权限检查
  const canEditClasses = hasPermission(PERMISSIONS.EDIT_CLASSES);

  useEffect(() => {
    if (!canEditClasses) {
      setError('无权限编辑课程');
      setLoading(false);
      return;
    }

    if (!classId) {
      setError('缺少课程ID参数');
      setLoading(false);
      return;
    }

    fetchClassData();
  }, [classId, canEditClasses]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const response = await getClassInfo(classId!);
      
      if (response.status === 0 && response.data) {
        setClassData(response.data);
      } else {
        setError(response.message || '获取班级信息失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // TODO: 实现保存逻辑
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('保存成功');
    }, 1000);
  };

  if (!canEditClasses) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">权限不足</h2>
            <p className="text-gray-600">您没有权限编辑课程</p>
          </div>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">出错了</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑课程</h1>
            <p className="text-gray-600 mt-1">课程ID: {classId}</p>
          </div>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {classData && (
            <>
              {/* 科目配置编辑 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">科目配置</h3>
                {classData.class_topics.map((topic, index) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          科目
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue={topic.topic_id}
                        >
                          {Object.entries(classData.topics).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          授课教师
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue={topic.teacher_id}
                        >
                          {Object.entries(classData.staff_list).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          考试
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue={topic.exam_id}
                        >
                          {classData.exam_list.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          描述
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue={topic.description}
                          placeholder="请输入描述"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 学生管理 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">学生管理</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学生姓名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          开始时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          结束时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classData.class_student.map((student) => (
                        <tr key={student.student_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {classData.student_list[student.student_id] || '未知学生'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="date"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              defaultValue={student.start_time > 0 ? new Date(student.start_time * 1000).toISOString().split('T')[0] : ''}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="date"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              defaultValue={student.end_time > 0 ? new Date(student.end_time * 1000).toISOString().split('T')[0] : ''}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button className="text-red-600 hover:text-red-800">移除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 