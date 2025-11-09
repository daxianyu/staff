'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [hoveredMentor, setHoveredMentor] = useState<{ index: number; name: string; year: string } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 获取所有年份列表
  const getYearList = () => {
    if (!valueData || valueData.length === 0) return [];
    return valueData.map((yearData: any) => yearData.name).sort();
  };

  // 获取毕业年份数据（动态）
  const getGraduationYearData = () => {
    if (!valueData || valueData.length === 0) return {};
    
    const yearDataMap: Record<string, number> = {};
    
    valueData.forEach((yearData: any) => {
      const year = yearData.name;
      yearDataMap[year] = yearData.data.reduce((sum: number, val: any) => sum + (val || 0), 0);
    });
    
    return yearDataMap;
  };

  const yearList = getYearList();
  const yearDataMap = getGraduationYearData();

  // 年份颜色映射（支持多个年份）
  const getYearColor = (year: string, index: number) => {
    const colors = [
      { bg: 'bg-green-400', hover: 'hover:bg-green-500', text: 'text-green-600', bgLight: 'bg-green-50', textDark: 'text-green-900' },
      { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50', textDark: 'text-blue-900' },
      { bg: 'bg-orange-400', hover: 'hover:bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50', textDark: 'text-orange-900' },
      { bg: 'bg-purple-400', hover: 'hover:bg-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50', textDark: 'text-purple-900' },
      { bg: 'bg-pink-400', hover: 'hover:bg-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50', textDark: 'text-pink-900' },
      { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-yellow-600', bgLight: 'bg-yellow-50', textDark: 'text-yellow-900' },
    ];
    return colors[index % colors.length];
  };

  // 获取导师的学生列表
  const getMentorStudents = (mentorName: string, year: string) => {
    if (!data) return [];

    const students: string[] = [];

    // 从 student_graduation_year 获取学生数据
    if (data.student_graduation_year && data.student_graduation_year[mentorName]) {
      const mentorData = data.student_graduation_year[mentorName];

      if (mentorData[year] && Array.isArray(mentorData[year])) {
        students.push(...mentorData[year]);
      }
    }

    return students;
  };

  // 处理鼠标悬停
  const handleMentorHover = (event: React.MouseEvent, mentorName: string, mentorIndex: number, year: string) => {
    // 清除离开定时器
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left, // 放在柱状图左侧（头部）
      y: rect.bottom + 10 // 在柱状图下方
    });
    // 立即更新悬浮状态，确保快速切换时正确显示
    setHoveredMentor({ index: mentorIndex, name: mentorName, year });
  };

  // 处理鼠标离开
  const handleMentorLeave = () => {
    // 清除之前的定时器
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    // 延迟隐藏，给用户一点时间移动到其他柱状图或弹出框
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredMentor(null);
    }, 200);
  };

  // 处理弹出框鼠标进入
  const handleTooltipEnter = () => {
    // 清除离开定时器，保持弹出框显示
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">总校区数</div>
                <div className="text-2xl font-bold text-blue-900">{data.div_ids.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-600">当前校区导师数</div>
                <div className="text-2xl font-bold text-green-900">{mentors.length}</div>
              </div>
              {yearList.map((year, index) => {
                const color = getYearColor(year, index);
                return (
                  <div key={year} className={`${color.bgLight} rounded-lg p-4`}>
                    <div className={`text-sm font-medium ${color.text}`}>{year}届学员</div>
                    <div className={`text-2xl font-bold ${color.textDark}`}>{yearDataMap[year] || 0}人</div>
                  </div>
                );
              })}
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
                <div className="flex items-center gap-4 flex-wrap">
                  {yearList.map((year, index) => {
                    const color = getYearColor(year, index);
                    return (
                      <div key={year} className="flex items-center gap-2">
                        <div className={`w-4 h-4 ${color.bg} rounded`}></div>
                        <span className="text-sm text-gray-600">{year}届: {yearDataMap[year] || 0}人</span>
                      </div>
                    );
                  })}
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
                  {mentors.map((mentor, mentorIndex) => {
                    // 从API数据获取每个导师的毕业年份数据（动态）
                    const mentorYearData: Record<string, number> = {};
                    
                    if (valueData && valueData.length > 0) {
                      valueData.forEach((yearData: any) => {
                        const year = yearData.name;
                        if (yearData.data[mentorIndex] !== undefined) {
                          mentorYearData[year] = yearData.data[mentorIndex] || 0;
                        }
                      });
                    }
                    
                    const total = Object.values(mentorYearData).reduce((sum, val) => sum + val, 0);
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
                      <div
                        key={`${mentor}-${mentorIndex}`}
                        className="flex items-center gap-4"
                      >
                        {/* 导师名称 */}
                        <div className="w-32 text-sm font-medium text-gray-900 text-right">
                          {mentor}
                        </div>
                        
                        {/* 柱状图容器 */}
                        <div className="flex-1 relative">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                            {yearList.map((year, yearIndex) => {
                              const yearValue = mentorYearData[year] || 0;
                              if (yearValue <= 0) return null;
                              
                              const color = getYearColor(year, yearIndex);
                              return (
                                <div
                                  key={year}
                                  className={`${color.bg} ${color.hover} flex items-center justify-end pr-2 cursor-pointer transition-colors relative group`}
                                  style={{ width: `${(yearValue / maxValue) * 100}%` }}
                                  onMouseEnter={(e) => handleMentorHover(e, mentor, mentorIndex, year)}
                                  onMouseLeave={handleMentorLeave}
                                >
                                  <span className="text-xs font-medium text-white">{yearValue}</span>
                                </div>
                              );
                            })}
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

        {/* 学生列表悬浮框 */}
        {hoveredMentor && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-md"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              maxHeight: '320px',
              overflowY: 'auto'
            }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleMentorLeave}
          >
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const yearIndex = yearList.indexOf(hoveredMentor.year);
                  const color = getYearColor(hoveredMentor.year, yearIndex >= 0 ? yearIndex : 0);
                  return (
                    <>
                      <div className={`w-3 h-3 rounded ${color.bg}`}></div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {hoveredMentor.name} - {hoveredMentor.year}届学生
                      </h4>
                    </>
                  );
                })()}
              </div>
            </div>

            {(() => {
              const students = getMentorStudents(hoveredMentor.name, hoveredMentor.year);

              if (students.length === 0) {
                return (
                  <p className="text-sm text-gray-500 text-center py-2">暂无学生</p>
                );
              }

              return (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    {hoveredMentor.year}届 ({students.length}人)
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {/* 将学生分成多列显示，每行最多4个名字 */}
                    {Array.from({ length: Math.ceil(students.length / 4) }, (_, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-4 gap-3 mb-1">
                        {students.slice(rowIndex * 4, (rowIndex + 1) * 4).map((student, idx) => (
                          <div key={`${hoveredMentor.year}-${rowIndex * 4 + idx}`} className="text-sm text-gray-700 text-left px-2 py-1 bg-gray-50 rounded border border-gray-200 truncate">
                            {student}
                          </div>
                        ))}
                        {/* 填充空白单元格以保持网格对齐 */}
                        {Array.from({ length: Math.max(0, 4 - students.slice(rowIndex * 4, (rowIndex + 1) * 4).length) }, (_, fillIdx) => (
                          <div key={`fill-${rowIndex}-${fillIdx}`} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
