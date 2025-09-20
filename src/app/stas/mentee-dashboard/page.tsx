'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getMenteeList } from '@/services/auth';
import { UserGroupIcon, ExclamationTriangleIcon, ChartBarIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface MenteeData {
  div_ids: string[];
  name_dict: Record<string, string[]>;
  value_dict: Record<string, any[]>;
  campus_value: Record<string, string>;
  drill_down_data: Record<string, any>;
  graduation_year: Record<string, Record<string, number>>;
  container_year: Record<string, string[]>;
  student_graduation_year: Record<string, Record<string, string[]>>;
}

export default function MenteeDashboardPage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<MenteeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState(0); // 0: 按数量排序, 1: 按导师组排序
  const [selectedCampus, setSelectedCampus] = useState<string>('');

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_MENTEE_DASHBOARD) || hasPermission('sales_person') || hasPermission('finance');

  // 如果没有权限，显示无权限页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问此页面的权限</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async (type: number = 0) => {
    try {
      setLoading(true);
      const response = await getMenteeList(type);
      if (response.code === 200) {
        setData(response.data as MenteeData);
        const menteeData = response.data as MenteeData;
        if (menteeData?.div_ids && menteeData.div_ids.length > 0) {
          setSelectedCampus(menteeData.div_ids[0]);
        }
      } else {
        console.error('加载数据失败:', response.message);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(sortType);
  }, [sortType]);

  // 切换排序类型
  const handleSortTypeChange = (type: number) => {
    setSortType(type);
  };

  // 获取当前校区的导师和学生数据
  const getCurrentCampusData = () => {
    if (!data || !selectedCampus) return { mentors: [], drillDownData: [], valueData: [] };
    
    const mentors = data.name_dict[selectedCampus] || [];
    const drillDownData = data.drill_down_data[selectedCampus] || [];
    const valueData = data.value_dict[selectedCampus] || [];
    
    return { mentors, drillDownData, valueData };
  };

  const { mentors, drillDownData, valueData } = getCurrentCampusData();

  // 获取毕业年份数据
  const getGraduationYearData = () => {
    if (!valueData || valueData.length === 0) return { year2027: 0, year2028: 0 };
    
    let year2027 = 0;
    let year2028 = 0;
    
    valueData.forEach((yearData: any) => {
      if (yearData.name === '2027') {
        year2027 = yearData.data.reduce((sum: number, val: any) => sum + (val || 0), 0);
      } else if (yearData.name === '2028') {
        year2028 = yearData.data.reduce((sum: number, val: any) => sum + (val || 0), 0);
      }
    });
    
    return { year2027, year2028 };
  };

  const { year2027, year2028 } = getGraduationYearData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mentee Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">导师和学员关系统计分析</p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 排序方式选择 */}
            <div className="flex items-center gap-4">
              <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">排序方式:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSortTypeChange(0)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    sortType === 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  按数量排序
                </button>
                <button
                  onClick={() => handleSortTypeChange(1)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    sortType === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  按导师组排序
                </button>
              </div>
            </div>

            {/* 校区选择 */}
            {data?.div_ids && data.div_ids.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">校区:</span>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {data.div_ids.map((campusId) => (
                    <option key={campusId} value={campusId}>
                      {data.campus_value[campusId] || campusId}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 汇总信息 */}
        {data && (
          <div className="mt-6 mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">汇总信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">总校区数</div>
                <div className="text-2xl font-bold text-blue-900">{data.div_ids.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-600">当前校区导师数</div>
                <div className="text-2xl font-bold text-green-900">{mentors.length}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-600">2027届学员</div>
                <div className="text-2xl font-bold text-orange-900">{year2027}人</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-600">2028届学员</div>
                <div className="text-2xl font-bold text-purple-900">{year2028}人</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* 图例 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <span className="text-sm text-gray-600">2027届: {year2027}人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">2028届: {year2028}人</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedCampus ? data?.campus_value[selectedCampus] : '选择校区查看数据'}
                </div>
              </div>
            </div>

            {/* 水平堆叠柱状图 */}
            <div className="p-6">
              {mentors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无导师数据
                </div>
              ) : (
                <div className="space-y-4">
                  {mentors.map((mentor, index) => {
                    // 从API数据获取每个导师的毕业年份数据
                    let mentorYear2027 = 0;
                    let mentorYear2028 = 0;
                    
                    if (valueData && valueData.length > 0) {
                      valueData.forEach((yearData: any) => {
                        if (yearData.name === '2027' && yearData.data[index] !== undefined) {
                          mentorYear2027 = yearData.data[index] || 0;
                        } else if (yearData.name === '2028' && yearData.data[index] !== undefined) {
                          mentorYear2028 = yearData.data[index] || 0;
                        }
                      });
                    }
                    
                    const total = mentorYear2027 + mentorYear2028;
                    const maxValue = Math.max(...mentors.map((_, idx) => {
                      let max = 0;
                      if (valueData && valueData.length > 0) {
                        valueData.forEach((yearData: any) => {
                          if (yearData.data[idx] !== undefined) {
                            max += yearData.data[idx] || 0;
                          }
                        });
                      }
                      return max;
                    }), 1); // 防止除零
                    
                    return (
                      <div key={`${mentor}-${index}`} className="flex items-center gap-4">
                        {/* 导师名称 */}
                        <div className="w-32 text-sm font-medium text-gray-900 text-right">
                          {mentor}
                        </div>
                        
                        {/* 柱状图容器 */}
                        <div className="flex-1 relative">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                            {/* 2027届 - 绿色 */}
                            {mentorYear2027 > 0 && (
                              <div 
                                className="bg-green-400 flex items-center justify-end pr-2"
                                style={{ width: `${(mentorYear2027 / maxValue) * 100}%` }}
                              >
                                <span className="text-xs font-medium text-white">{mentorYear2027}</span>
                              </div>
                            )}
                            
                            {/* 2028届 - 蓝色 */}
                            {mentorYear2028 > 0 && (
                              <div 
                                className="bg-blue-500 flex items-center justify-end pr-2"
                                style={{ width: `${(mentorYear2028 / maxValue) * 100}%` }}
                              >
                                <span className="text-xs font-medium text-white">{mentorYear2028}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 总数 */}
                        <div className="w-16 text-sm font-medium text-gray-900 text-center">
                          {total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* X轴刻度 */}
            <div className="px-6 pb-4">
              <div className="flex justify-between text-xs text-gray-500">
                {(() => {
                  const maxValue = Math.max(...mentors.map((_, idx) => {
                    let max = 0;
                    if (valueData && valueData.length > 0) {
                      valueData.forEach((yearData: any) => {
                        if (yearData.data[idx] !== undefined) {
                          max += yearData.data[idx] || 0;
                        }
                      });
                    }
                    return max;
                  }), 1);
                  
                  const step = Math.ceil(maxValue / 5);
                  const ticks = [0, step, step * 2, step * 3, step * 4, step * 5];
                  
                  return ticks.map((tick, index) => (
                    <span key={index}>{tick}</span>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
