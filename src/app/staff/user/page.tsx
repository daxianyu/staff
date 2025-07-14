'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStaffInfo, StaffInfo } from '@/services/auth';

export default function StaffInfoPage() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get('userId');
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback'>('overview');

  useEffect(() => {
    if (staffId) {
      fetchStaffInfo(staffId as string);
    }
  }, [staffId]);

  const fetchStaffInfo = async (id: string) => {
    try {
      setLoading(true);
      const response = await getStaffInfo(id);
      if (response.code === 200 && response.data) {
        setStaffInfo(response.data);
      } else {
        setError(response.message || 'Failed to fetch staff info');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // 格式化课时（秒转小时）
  const formatHours = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  // 格式化时间戳
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取评分星级
  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push('☆');
    }
    return stars.join('');
  };

  // 计算有效评论数量
  const getValidCommentsCount = () => {
    if (!staffInfo) return 0;
    let count = 0;
    Object.values(staffInfo.subject_teacher_feedback_comment).forEach(comments => {
      count += comments.filter(comment => comment.comment && comment.comment.trim()).length;
    });
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">出错了</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!staffInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">暂无数据</h2>
          <p className="text-gray-600">未找到该员工的信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-4">
        {/* 员工信息卡片 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold">
              {staffInfo.staff_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{staffInfo.staff_name}</h1>
              <p className="text-blue-200 mt-1">教师信息总览</p>
            </div>
          </div>
        </div>

        {/* 选项卡 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 统计总览
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 反馈记录
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">总课程数</p>
                    <p className="text-2xl font-bold text-gray-900">{staffInfo.total_info.total_lesson_count}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">总课时</p>
                    <p className="text-2xl font-bold text-gray-900">{formatHours(staffInfo.total_info.total_lesson_hours)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">平均评分</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-gray-900 mr-2">{staffInfo.total_info.average_rating}</p>
                      <span className="text-yellow-500">{getRatingStars(staffInfo.total_info.average_rating)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">辅导学生</p>
                    <p className="text-2xl font-bold text-gray-900">{staffInfo.mentee_student_list.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 本周本月统计 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 本周课程</h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{staffInfo.total_info.lesson_this_week}</p>
                  <p className="text-gray-600 mt-2">节课程</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 本月课程</h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">{staffInfo.total_info.lesson_this_month}</p>
                  <p className="text-gray-600 mt-2">节课程</p>
                </div>
              </div>
            </div>

            {/* 辅导学生列表 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                辅导学生名单
              </h3>
              {staffInfo.mentee_student_list.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {staffInfo.mentee_student_list.map((student, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-semibold">{student.charAt(0)}</span>
                      </div>
                      <p className="font-medium text-gray-800">{student}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>暂无辅导学生</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* 反馈统计 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">💬 反馈统计</h3>
                <div className="text-sm text-gray-600">
                  有效评论: <span className="font-semibold text-blue-600">{getValidCommentsCount()}</span> 条
                </div>
              </div>
            </div>

            {/* 反馈列表 */}
            {Object.keys(staffInfo.subject_teacher_feedback_comment).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(staffInfo.subject_teacher_feedback_comment).map(([subjectId, comments]) => (
                  <div key={subjectId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800">课程 ID: {subjectId}</h4>
                      <p className="text-sm text-gray-600 mt-1">共 {comments.length} 条记录</p>
                    </div>
                    <div className="p-6">
                      {comments.some(comment => comment.comment && comment.comment.trim()) ? (
                        <div className="space-y-4">
                          {comments
                            .filter(comment => comment.comment && comment.comment.trim())
                            .map((comment, index) => (
                              <div key={index} className="border-l-4 border-blue-300 bg-blue-50 p-4 rounded-r-lg">
                                <p className="text-gray-800 mb-2">{comment.comment}</p>
                                <div className="flex items-center text-xs text-gray-500 space-x-4">
                                  <span>📅 {formatTime(comment.time)}</span>
                                  {comment.understandable === 1 && <span className="text-green-600">✅ 易理解</span>}
                                  {comment.prepared === 1 && <span className="text-blue-600">📚 准备充分</span>}
                                  {comment.late === 1 && <span className="text-red-600">⏰ 迟到</span>}
                                  {comment.used_mobile === 1 && <span className="text-orange-600">📱 使用手机</span>}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p>该课程暂无有效反馈</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无反馈记录</h3>
                <p className="text-gray-500">该教师还没有收到任何课程反馈</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
