'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStudentInfo,
  type StudentInfo
} from '@/services/auth';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function StudentUserPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canViewStudents = hasPermission(PERMISSIONS.VIEW_STUDENTS);

  const loadStudentInfo = async () => {
    if (!userId) {
      setError('Student ID is required');
      return;
    }

    try {
      setLoading(true);
      const response = await getStudentInfo(userId);
      
      if (response.code === 200 && response.data) {
        setStudentInfo(response.data);
      } else {
        setError(response.message || 'Failed to load student information');
      }
    } catch (error) {
      console.error('加载学生信息失败:', error);
      setError('Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentInfo();
  }, [userId]);

  if (!canViewStudents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view student information</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <Link href="/students" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h1>
          <p className="text-gray-600">The requested student information could not be found</p>
          <Link href="/students" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和返回按钮 */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/students" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Students
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Student Information</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 学生基本信息卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {studentInfo.student_name}
                    </h3>
                    <p className="text-gray-600">Student ID: {userId}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Grade</p>
                      <p className="text-sm text-gray-600">{studentInfo.student_data?.grade || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{studentInfo.student_data?.phone_0 || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{studentInfo.student_data?.email || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Campus</p>
                      <p className="text-sm text-gray-600">{studentInfo.student_data?.campus_name || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status</p>
                      <p className="text-sm text-gray-600">
                        {studentInfo.student_data?.active === 1 ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 学生详细信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 学习统计 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Learning Statistics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {studentInfo.total_info?.total_lesson_count || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Lessons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {studentInfo.total_info?.total_lesson_hours || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {studentInfo.total_info?.lesson_this_week || 0}
                    </p>
                    <p className="text-sm text-gray-600">This Week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {studentInfo.total_info?.lesson_this_month || 0}
                    </p>
                    <p className="text-sm text-gray-600">This Month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 科目列表 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Enrolled Subjects</h2>
              </div>
              <div className="p-6">
                {studentInfo.subjects && studentInfo.subjects.length > 0 ? (
                  <div className="space-y-4">
                    {studentInfo.subjects.map((subject) => (
                      <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{subject.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                              <span>Teacher: {subject.teacher_name}</span>
                              <span>Students: {subject.student_count}</span>
                              <span>Rating: {subject.rating}/5</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Class {subject.class_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No subjects enrolled yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* 导师信息 */}
            {studentInfo.mentor_info && studentInfo.mentor_info.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Mentor Information</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {studentInfo.mentor_info.map((mentor, index) => (
                      <div key={index} className="flex items-center">
                        <UserCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{mentor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
