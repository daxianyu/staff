'use client';

import { useEffect, useState } from 'react';
import { getTextbookList, type TextbookItem } from '@/services/modules/textbook';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  TagIcon,
  BuildingOfficeIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

export default function TextbookPage() {
  const canView = true;

  const [loading, setLoading] = useState(true);
  const [textbooks, setTextbooks] = useState<TextbookItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 加载教材列表
  const loadTextbooks = async () => {
    setLoading(true);
    try {
      const response = await getTextbookList();
      if (response.code === 200) {
        setTextbooks(response.data || []);
      } else {
        console.error('获取教材列表失败:', response.message);
      }
    } catch (error) {
      console.error('获取教材列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTextbooks();
  }, []);

  // 过滤教材数据
  const filteredTextbooks = textbooks.filter(textbook => {
    return textbook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           textbook.type.toLowerCase().includes(searchTerm.toLowerCase());
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
          <div className="flex items-center gap-4">
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Textbook</h1>
              <p className="text-gray-600">教材管理</p>
            </div>
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
                  placeholder="搜索教材名称或类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              共 {filteredTextbooks.length} 个教材
            </div>
          </div>
        </div>

        {/* 教材列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : filteredTextbooks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      教材信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      价格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      校区
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTextbooks.map((textbook, index) => (
                    <tr key={textbook.id || `textbook-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <BookOpenIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {textbook.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {textbook.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {textbook.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {textbook.price} CNY
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          {textbook.inventory_info.map((inventory) => (
                            <div key={inventory.campus_id}>
                              {inventory.campus_name}
                            </div>
                          ))}
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
              <p className="text-gray-600">暂无教材数据</p>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {filteredTextbooks.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">总计: {filteredTextbooks.length} 个教材</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  总库存: {filteredTextbooks.reduce((sum, book) => sum + book.paid_count, 0)} 本
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  总价值: ${filteredTextbooks.reduce((sum, book) => sum + (book.price * book.paid_count), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
