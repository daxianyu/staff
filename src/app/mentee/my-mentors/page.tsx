'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  EyeIcon,
  AcademicCapIcon,
  CalendarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import {
  getMyMentorStudents,
  type MyMentorStudents,
} from '@/services/auth';
import { openUrlWithFallback } from '@/utils/openUrlWithFallback';

export default function MyMentorsPage() {
  const { hasPermission } = useAuth();
  const [mentorStudents, setMentorStudents] = useState<MyMentorStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_MY_MENTORS);

  // 如果没有查看权限，显示无权限页面
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

  useEffect(() => {
    loadMentorStudents();
  }, []);

  const loadMentorStudents = async () => {
    try {
      setLoading(true);
      const response = await getMyMentorStudents();
      if (response.code === 200) {
        setMentorStudents(response.data || []);
      } else {
        console.error('Failed to load mentor students:', response.message);
      }
    } catch (error) {
      console.error('Error loading mentor students:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤 - 按导师名称或学生名称搜索
  const filteredMentorStudents = mentorStudents.filter((mentor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.mentor_name.toLowerCase().includes(searchLower) ||
      mentor.students.some(student => 
        student.student_name.toLowerCase().includes(searchLower)
      )
    );
  });

  // 分页
  const totalItems = filteredMentorStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMentorStudents = filteredMentorStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 搜索重置
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Mentors</h1>
          <p className="mt-2 text-sm text-gray-600">
            View students under your mentors
          </p>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors or students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 导师和学生列表 */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paginatedMentorStudents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12">
              <div className="text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'No mentors found' : 'No mentors available'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.'
                    : 'You don\'t have any mentors assigned to you.'
                  }
                </p>
              </div>
            </div>
          ) : (
            paginatedMentorStudents.map((mentor) => (
              <div key={mentor.mentor_id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* 导师信息头部 */}
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {mentor.mentor_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mentor.students.length} student{mentor.students.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 学生列表 */}
                {mentor.students.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <AcademicCapIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No students assigned to this mentor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gender
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrolment Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Graduation Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year Fee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mentor.students.map((student) => (
                          <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <AcademicCapIcon className="h-4 w-4 text-green-600" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.student_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {student.student_id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.gender === '男' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-pink-100 text-pink-800'
                              }`}>
                                {student.gender}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {formatDate(student.enrolment_date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {formatDate(student.graduation_date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <BanknotesIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {student.year_fee || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => {
                                  openUrlWithFallback(`/mentee/student-detail?id=${student.student_id}`);
                                }}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center"
                                title="View Student Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 分页组件 */}
        {totalItems > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
              </div>
              
              <div className="flex items-center gap-4">
                {/* 每页显示数量选择器 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">每页显示:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* 分页按钮组 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  {/* 页码按钮 */}
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else {
                      if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                    }
                    
                    if (page === currentPage) {
                      return (
                        <button
                          key={page}
                          className="w-8 h-8 flex items-center justify-center text-sm font-medium bg-blue-600 border-blue-600 text-white rounded"
                        >
                          {page}
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 flex items-center justify-center text-sm font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50 border rounded"
                        >
                          {page}
                        </button>
                      );
                    }
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
