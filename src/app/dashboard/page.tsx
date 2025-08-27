'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getStaffDashboard, 
  updateAttendance,
  updateFeedback,
  cancelLesson,
  type DashboardData,
  type AttendanceListItem,
  type FeedbackListItem,
  type UpdateAttendanceParams,
  type UpdateFeedbackParams,
  type CancelLessonParams
} from '@/services/auth';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

type TabType = 'attendance' | 'feedback';

// 考勤状态枚举
const ATTENDANCE_STATUS = {
  PRESENT: -1,      // 正常出席
  LEAVE: 1,         // 请假
  ABSENT: 0,        // 旷课
  LATE: 4,          // 迟到
};

const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]: '出席',
  [ATTENDANCE_STATUS.LEAVE]: '请假',
  [ATTENDANCE_STATUS.ABSENT]: '旷课',
  [ATTENDANCE_STATUS.LATE]: '迟到',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  
  // 学生考勤状态映射 (lesson_id_student_id -> status)
  const [attendanceStates, setAttendanceStates] = useState<Record<string, number>>({});
  
  // 反馈文本映射 (feedback_id -> text)
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getStaffDashboard();
        
        if (response.code === 200 && response.data) {
          setDashboardData(response.data);
          
          // 初始化考勤状态为默认出席
          const initialStates: Record<string, number> = {};
          response.data.attendance_list.forEach(item => {
            item.students.forEach(student => {
              const key = `${item.start_time}_${student.student_id}`;
              initialStates[key] = ATTENDANCE_STATUS.PRESENT; // 默认出席
            });
          });
          setAttendanceStates(initialStates);
        } else {
          setError(response.message || '获取dashboard数据失败');
        }
      } catch (err) {
        setError('获取dashboard数据失败');
        console.error('Dashboard数据获取错误:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRange = (startTimestamp: number, endTimestamp: number) => {
    const start = new Date(startTimestamp * 1000).toLocaleDateString('zh-CN');
    const end = new Date(endTimestamp * 1000).toLocaleDateString('zh-CN');
    return `${start} - ${end}`;
  };

  // 处理考勤状态变更
  const handleAttendanceChange = (lessonId: number, studentId: number, status: number) => {
    const key = `${lessonId}_${studentId}`;
    setAttendanceStates(prev => ({
      ...prev,
      [key]: status
    }));
  };

  // 提交整个课程的考勤
  const handleSubmitAllAttendance = async (item: AttendanceListItem) => {
    const lessonId = item.students[0]?.lesson_id;
    if (!lessonId) return;
    
    const key = `lesson_${lessonId}`;
    setProcessingItems(prev => new Set([...prev, key]));
    
    try {
      // 构建所有学生的批量考勤数据，包括已请假的学生
      const attendanceInfo = item.students.map(student => {
        const attendanceKey = `${student.lesson_id}_${student.student_id}`;
        const hasComment = student.comment && student.comment.trim() !== '';
        
        // 如果学生已请假，状态设为请假(0)，否则使用界面选择的状态
        const status = hasComment ? ATTENDANCE_STATUS.LEAVE : (attendanceStates[attendanceKey] ?? ATTENDANCE_STATUS.PRESENT);
        
        return {
          student_id: student.student_id,
          present: status
        };
      });
      
      const params: UpdateAttendanceParams = {
        lesson_id: lessonId,
        attendance_info: attendanceInfo
      };
      
      const response = await updateAttendance(params);
      
      if (response.code === 200) {
        // 成功后从列表中移除整个课程
        setDashboardData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attendance_list: prev.attendance_list.filter(listItem => 
              listItem.subject_id !== item.subject_id || listItem.start_time !== item.start_time
            )
          };
        });
        alert(`课程考勤提交成功！已处理 ${item.students.length} 名学生`);
      } else {
        alert(`考勤提交失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('提交课程考勤错误:', error);
      alert('提交课程考勤失败');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // 取消课程
  const handleCancelLesson = async (lessonId: number) => {
    if (!confirm('确定要取消这节课吗？')) return;
    
    const key = `cancel_${lessonId}`;
    setProcessingItems(prev => new Set([...prev, key]));
    
    try {
      const params: CancelLessonParams = {
        record_id: lessonId
      };
      
      const response = await cancelLesson(params);
      
      if (response.code === 200) {
        // 成功后从列表中移除该课程
        setDashboardData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attendance_list: prev.attendance_list.filter(item => 
              !item.students.some(student => student.lesson_id === lessonId)
            )
          };
        });
      } else {
        alert(response.message || '取消课程失败');
      }
    } catch (error) {
      console.error('取消课程错误:', error);
      alert('取消课程失败');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // 提交反馈
  const handleSubmitFeedback = async (item: FeedbackListItem) => {
    const key = `${item.student_id}_${item.subject_id}_${item.time_unit}`;
    const feedbackText = feedbackTexts[key] || '';
    
    if (!feedbackText.trim()) {
      alert('请输入反馈内容');
      return;
    }
    
    setProcessingItems(prev => new Set([...prev, key]));
    
    try {
      const params: UpdateFeedbackParams = {
        student_id: item.student_id,
        subject_id: item.subject_id,
        time_unit: item.time_unit,
        feedback_note: feedbackText
      };
      
      const response = await updateFeedback(params);
      
      if (response.code === 200) {
        // 成功后从列表中移除该项
        setDashboardData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            feed_back_list: prev.feed_back_list.filter(feedbackItem => 
              !(feedbackItem.student_id === item.student_id && 
                feedbackItem.subject_id === item.subject_id &&
                feedbackItem.time_unit === item.time_unit)
            )
          };
        });
        
        // 清除输入的反馈文本
        setFeedbackTexts(prev => {
          const newTexts = { ...prev };
          delete newTexts[key];
          return newTexts;
        });
      } else {
        alert(response.message || '提交反馈失败');
      }
    } catch (error) {
      console.error('提交反馈错误:', error);
      alert('提交反馈失败');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部欢迎区域 */}
      <div className="bg-gradient-to-br from-blue-400 to-indigo-200 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3">
              欢迎回来，{user?.name || '老师'} 👋
            </h1>
            <p className="text-blue-100 text-lg mb-4">
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <UserGroupIcon className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 pt-6 pb-0">
          <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'attendance'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              考勤管理
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === 'attendance' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {dashboardData.attendance_list.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'feedback'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              反馈评价
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === 'feedback' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {dashboardData.feed_back_list.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab 内容 */}
        <div className="p-6">
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {dashboardData.attendance_list.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-500 mb-2">暂无待处理考勤</p>
                  <p className="text-sm text-gray-400">所有考勤都已处理完成</p>
                </div>
              ) : (
                dashboardData.attendance_list.map((item, index) => (
                  <div key={`${item.subject_id}_${index}`} className="bg-gradient-to-r from-white to-blue-50 border border-blue-100 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    {/* 课程头部信息和操作按钮 */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <ChartBarIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-xl">
                              {item.topic_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              📅 {formatTime(item.start_time)} • 学生 {item.students.length} 人
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 右上角操作按钮 */}
                      <div className="flex flex-col sm:flex-row gap-2 ml-4">
                        <button
                          onClick={() => handleSubmitAllAttendance(item)}
                          disabled={processingItems.has(`lesson_${item.students[0]?.lesson_id}`)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center font-medium shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                          {processingItems.has(`lesson_${item.students[0]?.lesson_id}`) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              提交中...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4 mr-2" />
                              提交考勤 ({item.students.length}人)
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            const firstStudent = item.students[0];
                            if (firstStudent) {
                              handleCancelLesson(firstStudent.lesson_id);
                            }
                          }}
                          disabled={processingItems.has(`cancel_${item.students[0]?.lesson_id}`)}
                          className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center font-medium whitespace-nowrap"
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          {processingItems.has(`cancel_${item.students[0]?.lesson_id}`) ? '取消中...' : '取消课程'}
                        </button>
                      </div>
                    </div>
                    
                    {/* 学生列表 */}
                    <div className="grid gap-3">
                      {item.students.map((student) => {
                        const key = `${student.lesson_id}_${student.student_id}`;
                        const currentStatus = attendanceStates[key] ?? ATTENDANCE_STATUS.PRESENT;
                        const hasComment = student.comment && student.comment.trim() !== '';
                        
                        return (
                          <div key={key} className={`bg-white border rounded-lg p-4 transition-all duration-200 ${
                            hasComment 
                              ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300' 
                              : 'border-gray-200 hover:border-blue-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <div className={`rounded-full p-2 mr-4 ${
                                  hasComment 
                                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100' 
                                    : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                                }`}>
                                  <UserGroupIcon className={`h-5 w-5 ${
                                    hasComment ? 'text-yellow-600' : 'text-blue-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-lg">{student.student_name}</h4>
                                  <p className="text-sm text-gray-500">学生 #{student.student_id}</p>
                                  {hasComment && (
                                    <div className="mt-2 p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                                      <p className="text-xs text-yellow-600 font-medium mb-1">请假说明：{student.comment}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-start sm:items-center">
                                {hasComment ? (
                                  /* 已请假状态 - 只显示，不可修改 */
                                  <>
                                    <span className="text-sm text-gray-500 mb-2">状态</span>
                                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                      已请假
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">不可修改</p>
                                  </>
                                ) : (
                                  /* 正常状态 - 按钮组选择 */
                                  <>
                                    <span className="text-sm text-gray-500 mb-2">考勤状态</span>
                                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                      {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label], index) => {
                                        const isSelected = currentStatus === parseInt(value);
                                        return (
                                          <button
                                            key={value}
                                            type="button"
                                            onClick={() => handleAttendanceChange(
                                              student.lesson_id, 
                                              student.student_id, 
                                              parseInt(value)
                                            )}
                                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                              isSelected 
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                            } ${
                                              index === 0 ? '' : 'border-l border-gray-300'
                                            }`}
                                          >
                                            {label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {dashboardData.feed_back_list.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-500 mb-2">暂无待反馈评价</p>
                  <p className="text-sm text-gray-400">所有反馈都已完成</p>
                </div>
              ) : (
                dashboardData.feed_back_list.map((item, index) => {
                  const key = `${item.student_id}_${item.subject_id}_${item.time_unit}`;
                  const isProcessing = processingItems.has(key);
                  
                  return (
                    <div key={key} className="bg-gradient-to-r from-white to-green-50 border border-green-100 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-green-100 rounded-full p-2 mr-3">
                              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-xl">{item.topic_name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                📋 学生 {item.student_name}(#{item.student_id})
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {/* <p className="text-xs text-gray-500">评价周期</p> */}
                            <p className="text-md text-gray-500 mt-1">
                              {formatDateRange(item.time_unit_start, item.time_unit_end)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📝 反馈评价
                          </label>
                          <textarea
                            value={feedbackTexts[key] || ''}
                            onChange={(e) => setFeedbackTexts(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            placeholder="请详细描述学生在此周期内的学习表现、进步情况、需要改进的地方等..."
                            disabled={isProcessing}
                            className="w-full border border-gray-300 rounded-lg p-4 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
                            rows={4}
                          />
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-gray-500">
                              {feedbackTexts[key]?.length || 0} 字符
                            </p>
                            <button
                              onClick={() => handleSubmitFeedback(item)}
                              disabled={isProcessing || !feedbackTexts[key]?.trim()}
                              className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center font-medium shadow-sm hover:shadow-md"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  提交中...
                                </>
                              ) : (
                                <>
                                  <CheckIcon className="h-4 w-4 mr-2" />
                                  提交反馈
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}