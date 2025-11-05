'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  getClassHourPromotionRecordList,
  ClassHourPromotionRecord,
} from '@/services/auth';
import { ExcelExporter, convertObjectsToSheetData } from '@/components/ExcelExporter';

export default function FeePromotionPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_FEE_PROMOTION);

  // 状态管理
  const [records, setRecords] = useState<ClassHourPromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [queryDate, setQueryDate] = useState<string>('');

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看课时费晋升管理</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const params: { query_date?: string } = {};
      if (queryDate) {
        params.query_date = queryDate;
      }
      
      const result = await getClassHourPromotionRecordList(params);
      if (result.code === 200 && result.data) {
        // 确保 data 是数组
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setRecords(dataArray);
      } else {
        console.error('获取课时费晋升记录失败:', result.message);
        setRecords([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤记录（按名字搜索）
  const filteredRecords = Array.isArray(records) 
    ? records.filter(record =>
        record.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // 处理搜索变化
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // 处理日期变化
  const handleDateChange = (value: string) => {
    setQueryDate(value);
  };

  // 处理查询
  const handleQuery = () => {
    loadData();
  };

  // 处理重置
  const handleReset = () => {
    setQueryDate('');
    setSearchTerm('');
    loadData();
  };

  // 准备导出数据
  const getExportData = () => {
    const headers = [
      '姓名',
      '所在校区',
      '当前职级',
      '基础职级',
      '历史课时',
      '初始课时',
      '实际课时',
      '累计课时',
      '晋升需要达到课时',
      '是否达到晋升',
      '待晋升后职级',
      '原因',
    ];

    const sheetData = convertObjectsToSheetData(
      filteredRecords,
      [
        'staff_name',
        'campus_name',
        'current_level',
        'base_position',
        'history_hours',
        'origin_hours',
        'real_hours',
        'cumulative_hours',
        'promotion_hours',
        'flag_name',
        'next_level',
        'fall_info',
      ],
      '课时费晋升记录'
    );

    // 手动映射数据，确保顺序和格式正确
    sheetData.data = filteredRecords.map(record => [
      record.staff_name || '',
      record.campus_name || '',
      record.current_level || '',
      record.base_position || '',
      record.history_hours || 0,
      record.origin_hours || 0,
      record.real_hours || 0,
      record.cumulative_hours || 0,
      record.promotion_hours || 0,
      record.flag_name || '',
      record.next_level || '',
      record.fall_info || '',
    ]);

    sheetData.headers = headers;

    return {
      filename: `课时费晋升记录_${queryDate || '全部'}`,
      sheets: [sheetData],
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">课时费晋升Overview</h1>
          <p className="mt-2 text-sm text-gray-600">查看导师课时费晋升记录</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 名字搜索 */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索姓名..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 日期选择 */}
              <div className="flex-1 max-w-md">
                <input
                  type="date"
                  value={queryDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <ExcelExporter
                config={getExportData()}
                disabled={filteredRecords.length === 0 || loading}
              >
                导出Excel
              </ExcelExporter>
              <button
                onClick={handleQuery}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                查询
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 记录数统计 */}
          {!loading && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                共 {filteredRecords.length} 条记录
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在校区</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前职级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基础职级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">历史课时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">初始课时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实际课时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累计课时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">晋升需要达到课时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">是否达到晋升</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">待晋升后职级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr key={`${record.staff_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.staff_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.campus_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.current_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.base_position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.history_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.origin_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.real_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.cumulative_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.promotion_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.flag === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.flag_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.next_level}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.fall_info || '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 底部踢脚线 */}
          {!loading && (
            <div className="h-[2px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"></div>
          )}
        </div>
      </div>
    </div>
  );
}
