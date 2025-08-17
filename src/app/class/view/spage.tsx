'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getClassView,
  type ClassViewData,
  type ClassSubject,
  type StudentClass,
  type SubjectLesson
} from '@/services/auth';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  HomeIcon,
  ClockIcon,
  BookOpenIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function ClassViewPage() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classData, setClassData] = useState<ClassViewData | null>(null);

  const canViewClasses = hasPermission(PERMISSIONS.VIEW_CLASSES);

  const loadClassData = async () => {
    if (!classId) {
      setError('Class ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getClassView(Number(classId));
      
      if (response.code === 200 && response.data) {
        setClassData(response.data);
      } else {
        setError(response.message || 'Failed to load class data');
      }
    } catch (err) {
      console.error('加载Class详情失败:', err);
      setError(err instanceof Error ? err.message : 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [classId]);

  // 格式化时间
  const formatDateTime = (timestamp: number) => {
    if (timestamp === -1) return '未设置';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === -1) return '未设置';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN');
  };

  if (!canViewClasses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view class details</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading class details...</p>
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
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Data</h1>
          <p className="text-gray-600">No class data found</p>
        </div>
      </div>
    );
  }

  const className = classData.subjects[0]?.class_name || 'Unknown Class';
  const studentsArray = Object.values(classData.students_classes);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mt-4 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{className}</h1>
            </div>
            <button
              onClick={() => router.push(`/class/edit?id=${classId}`)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Class
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{classData.subjects.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-2xl font-bold text-gray-900">{studentsArray.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(classData.subject_lesson).reduce((total, lessons) => total + lessons.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Students ({studentsArray.length})
            </h2>
          </div>
          <div className="p-6">
            {studentsArray.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无学生</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex flex-wrap gap-2">
                  {studentsArray.map((student) => (
                    <span
                      key={student.student_id}
                      className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium"
                    >
                      {student.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subjects Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Subjects ({classData.subjects.length})
            </h2>
          </div>
          <div className="p-6">
            {classData.subjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subjects configured</p>
            ) : (
              <div className="space-y-6">
                {classData.subjects.map((subject) => (
                  <div key={subject.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject.topic_name}</h3>
                      
                      {/* Subject Info Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Teacher</label>
                          <p className="text-sm text-gray-900">{subject.teacher_name}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Exam</label>
                          <p className="text-sm text-gray-900">{subject.exam_name || '无考试'}</p>
                        </div>
                        
                        {subject.description && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Description</label>
                            <p className="text-sm text-gray-900">{subject.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Exams */}
                    {subject.student_exam && subject.student_exam.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Student Exams:</h4>
                        <div className="flex flex-wrap gap-2">
                          {subject.student_exam.map((exam, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {exam}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lessons */}
                    {classData.subject_lesson[subject.id] && classData.subject_lesson[subject.id].length > 0 ? (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          Lessons ({classData.subject_lesson[subject.id].length})
                        </h4>
                        <div className="space-y-2">
                          {classData.subject_lesson[subject.id]
                            .sort((a, b) => a.start_time - b.start_time)
                            .map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                              <div className="flex items-center space-x-4">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDateTime(lesson.start_time)} - {formatDateTime(lesson.end_time)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <HomeIcon className="h-4 w-4 mr-1" />
                                教室：{lesson.room_name || 'No room assigned'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center py-4">暂无课程安排</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}