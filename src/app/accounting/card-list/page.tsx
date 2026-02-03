'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getBindUserList,
  type BindUserAccountInfo
} from '@/services/auth';
import { 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { ExcelExporter } from '@/components/ExcelExporter';

export default function CardListPage() {
  const { hasPermission, user } = useAuth();
  const [cardList, setCardList] = useState<BindUserAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 权限检查：finance 或 core_user 为真
  const isCoreUser = user && (Number((user as any).core_user) === 1 || (user as any).core_user === true);
  const canView = hasPermission(PERMISSIONS.FINANCE) || isCoreUser;

  // 如果没有权限，显示无权限页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">权限不足</h1>
          <p className="mt-2 text-gray-600">您没有查看校园卡账户余额信息的权限</p>
        </div>
      </div>
    );
  }

  // 加载校园卡账户余额数据
  const loadCardData = async () => {
    setLoading(true);
    try {
      const result = await getBindUserList();
      if (result.code === 200 && result.data) {
        // API 返回的数据结构是 { rows: [...] }
        const rows = (result.data as any)?.rows ?? [];
        setCardList(rows as BindUserAccountInfo[]);
      } else {
        console.error('获取校园卡账户余额信息失败:', result.message);
        setCardList([]);
      }
    } catch (error) {
      console.error('加载校园卡账户余额信息失败:', error);
      setCardList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCardData();
  }, []);

  // 搜索过滤
  const filteredCards = cardList.filter(card =>
    card.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalPages = Math.ceil(filteredCards.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 导出配置
  const exportHeaders = ['类型', '账户名', '普通账户金额（元）', '补贴账户金额（元）', '账户总金额（元）'];
  const exportRows = filteredCards.map((card) => [
    card.type,
    card.personName,
    card.genAccount.toFixed(2),
    card.subAccount.toFixed(2),
    card.totalAccount.toFixed(2),
  ]);

  // 分页组件
  const Pagination = () => {
    const maxVisiblePages = 7;
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            显示第 {startIndex + 1} - {Math.min(endIndex, filteredCards.length)} 条，共 {filteredCards.length} 条记录
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              {pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={page === '...'}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                    page === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : page === '...'
                      ? 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Card List</h1>
          <p className="mt-1 text-sm text-gray-600">查看所有校园卡的账户余额信息</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // 搜索时重置到第一页
                }}
                placeholder="搜索账户名或类型..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 导出按钮 */}
            <ExcelExporter
              config={{
                filename: '校园卡账户余额信息',
                sheets: [
                  {
                    name: '账户余额',
                    headers: exportHeaders,
                    data: exportRows,
                  },
                ],
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>导出Excel</span>
            </ExcelExporter>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      账户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      普通账户金额（元）
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      补贴账户金额（元）
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      账户总金额（元）
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCards.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedCards.map((card, index) => (
                      <tr key={`${card.record_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {card.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {card.personName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ¥{card.genAccount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ¥{card.subAccount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ¥{card.totalAccount.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 数据统计 */}
          {!loading && filteredCards.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                共找到 <span className="font-medium text-gray-900">{filteredCards.length}</span> 条记录
              </div>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {!loading && filteredCards.length > 0 && <Pagination />}
      </div>
    </div>
  );
}
