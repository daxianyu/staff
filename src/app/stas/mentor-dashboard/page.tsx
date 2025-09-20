'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getMentorList } from '@/services/auth';
import { UsersIcon, ExclamationTriangleIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface MentorData {
  div_ids: string[];
  name_dict: Record<string, string[]>;
  value_dict: Record<string, { name: string; type: string; data: number[] }>;
  campus_value: Record<string, string>;
  all_names: Record<string, string[]>;
}

export default function MentorDashboardPage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [selectedMentor, setSelectedMentor] = useState<string>('');

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_MENTOR_DASHBOARD) || hasPermission('sales_person') || hasPermission('finance');

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
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getMentorList();
      if (response.code === 200) {
        setData(response.data as MentorData);
        const mentorData = response.data as MentorData;
        if (mentorData?.div_ids && mentorData.div_ids.length > 0) {
          setSelectedCampus(mentorData.div_ids[0]);
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
    loadData();
  }, []);

  // 获取当前校区的导师数据
  const getCurrentCampusData = () => {
    if (!data || !selectedCampus) return { mentors: [], chartData: null };
    
    const mentors = data.name_dict[selectedCampus] || [];
    const chartData = data.value_dict[selectedCampus] || null;
    
    return { mentors, chartData };
  };

  // 获取选中导师的团队成员
  const getMentorTeamMembers = () => {
    if (!data || !selectedCampus || !selectedMentor) return [];
    
    const key = selectedCampus + selectedMentor;
    return data.all_names[key] || [];
  };

  const { mentors, chartData } = getCurrentCampusData();
  const teamMembers = getMentorTeamMembers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">导师管理和团队统计分析</p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 校区选择 */}
            {data?.div_ids && data.div_ids.length > 0 && (
              <div className="flex items-center gap-4">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">校区:</span>
                <select
                  value={selectedCampus}
                  onChange={(e) => {
                    setSelectedCampus(e.target.value);
                    setSelectedMentor(''); // 重置导师选择
                  }}
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

            {/* 导师选择 */}
            {mentors.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">导师:</span>
                <select
                  value={selectedMentor}
                  onChange={(e) => setSelectedMentor(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">选择导师</option>
                  {mentors.map((mentor, index) => (
                    <option key={`${mentor}-${index}`} value={mentor}>
                      {mentor}
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
                <div className="text-sm font-medium text-orange-600">团队成员总数</div>
                <div className="text-2xl font-bold text-orange-900">
                  {chartData?.data?.reduce((sum, count) => sum + count, 0) || 0}人
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-600">选中导师</div>
                <div className="text-lg font-bold text-purple-900 truncate">
                  {selectedMentor || '未选择'}
                </div>
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
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">Mentor Info</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedCampus ? data?.campus_value[selectedCampus] : '选择校区查看数据'}
                </div>
              </div>
            </div>

            {/* 水平柱状图 */}
            <div className="p-6">
              {mentors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无导师数据
                </div>
              ) : (
                <div className="space-y-4">
                  {mentors.map((mentor, index) => {
                    // 从API数据获取每个导师的团队成员数量
                    const mentorCount = chartData?.data?.[index] || 0;
                    const maxValue = Math.max(...(chartData?.data || [0]), 1);
                    
                    return (
                      <div 
                        key={`${mentor}-${index}`} 
                        className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedMentor === mentor ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedMentor(mentor)}
                      >
                        {/* 导师名称 */}
                        <div className="w-32 text-sm font-medium text-gray-900 text-right">
                          {mentor}
                        </div>
                        
                        {/* 柱状图容器 */}
                        <div className="flex-1 relative">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                            {/* 导师团队成员数量 - 蓝色 */}
                            {mentorCount > 0 && (
                              <div 
                                className="bg-blue-500 flex items-center justify-end pr-2"
                                style={{ width: `${(mentorCount / maxValue) * 100}%` }}
                              >
                                <span className="text-xs font-medium text-white">{mentorCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 总数 */}
                        <div className="w-16 text-sm font-medium text-gray-900 text-center">
                          {mentorCount}
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
                  const maxValue = Math.max(...(chartData?.data || [0]), 1);
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

        {/* 团队成员详情 */}
        {selectedMentor && (
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
                {selectedMentor} 的团队成员
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                共 {teamMembers.length} 名团队成员
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {teamMembers.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  该导师暂无团队成员
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {teamMembers.map((member, index) => (
                    <div key={`${member}-${index}`} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {member.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{member}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
