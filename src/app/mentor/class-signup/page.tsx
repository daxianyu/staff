'use client';

import { useEffect, useState } from 'react';
import { getStaffClassList, getStudentSignupInfo, type ClassSignupItem } from '@/services/modules/subjects';
import { buildFileUrl } from '@/config/env';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function ClassSignupPage() {
  const canView = true;

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSignupItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [signupInfo, setSignupInfo] = useState<any>(null);

  // 加载课程列表
  const loadClasses = async () => {
    setLoading(true);
    try {
      const [classResponse, signupResponse] = await Promise.all([
        getStaffClassList(),
        getStudentSignupInfo()
      ]);
      
      if (classResponse.code === 200) {
        setClasses(classResponse.data || []);
      } else {
        console.error('获取课程列表失败:', classResponse.message);
      }
      
      if (signupResponse.code === 200) {
        setSignupInfo(signupResponse.data);
      }
    } catch (error) {
      console.error('获取课程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 直接打开文件
  const handleDownload = () => {
    setDownloadLoading(true);
    try {
      // 在新窗口/标签页中打开PDF文件
      window.open(buildFileUrl('/static/course_book/1/book.pdf'), '_blank');
    } catch (error) {
      console.error('打开失败:', error);
      alert('打开失败，请重试');
    } finally {
      setDownloadLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // 过滤课程数据
  const filteredClasses = classes.filter(classItem => {
    return classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 权限检查
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
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Available Classes</h1>
                <p className="text-gray-600">可用课程列表</p>
              </div>
            </div>
            
            {/* 打开按钮, 直接打开PDF文件 */} 
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {downloadLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
              {downloadLoading ? '打开中...' : '查看课程'}
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索课程名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              共 {filteredClasses.length} 个课程
            </div>
          </div>
        </div>

        {/* 课程列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      课程信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      校区
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClasses.map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <BookOpenIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {classItem.class_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {classItem.campus_name || `校区 ${classItem.campus_id}`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无课程数据</p>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {(filteredClasses.length > 0 || signupInfo) && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">可用课程: {filteredClasses.length} 个</span>
              </div>
              {signupInfo && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">已报名: {signupInfo.signed_up_list?.length || 0} 个</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">总课程: {(signupInfo.signed_up_list?.length || 0) + (signupInfo.not_signed_up_list?.length || 0)} 个</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
