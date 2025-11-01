'use client';

import {
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  CpuChipIcon,
  PlayIcon,
  CheckIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  startSmartSchedule,
  commitSchedule,
  getSelfSignupClassSelect,
  type ScheduleResult,
} from '@/services/auth';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// 课表事件类型
interface ScheduleEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    classId: number;
    color?: string;
    teacherName?: string;
    students?: string[];
  };
}

export default function AISchedulePage() {
  const router = useRouter();
  const { hasPermission, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [campusList, setCampusList] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'time' | 'teachers' | 'students' | 'classes'>('time');
  
  // 弹窗堆叠管理
  type ModalItem = 
    | { type: 'teacher'; payload: any }
    | { type: 'student'; payload: any }
    | { type: 'class'; payload: any };
  const [modalStack, setModalStack] = useState<ModalItem[]>([]);
  const [showAllStudents, setShowAllStudents] = useState<Record<number, boolean>>({});

  // 权限检查
  const canView = hasPermission(PERMISSIONS.EDIT_CLASSES) || hasPermission(PERMISSIONS.SALES_ADMIN);
  const coreFlag =
    typeof user === 'object' && user !== null && 'core_user' in user
      ? (user as { core_user?: number | boolean | string }).core_user
      : undefined;
  const isCoreUser = coreFlag === true || coreFlag === '1' || Number(coreFlag) === 1;

  // 加载校区列表
  useEffect(() => {
    const loadCampusList = async () => {
      try {
        const response = await getSelfSignupClassSelect();
        if (response.code === 200 && response.data) {
          // response.data 是一个对象，包含 campus_info 数组
          const campusInfo = response.data.campus_info || [];
          const campusArray = campusInfo.map((item: any) => ({
            id: item.id,
            name: item.name,
          }));
          setCampusList(campusArray);
          if (campusArray && campusArray.length) {
            setSelectedCampusId(campusArray[0].id);
            setScheduleResult(null);
            setStatusMessage('');
          }
        }
      } catch (error) {
        console.error('加载校区列表失败:', error);
      }
    };

    loadCampusList();
  }, []);

  // 当 selectedCampusId 改变时自动刷新状态
  useEffect(() => {
    if (selectedCampusId) {
      handleRefreshStatus();
    }
  }, [selectedCampusId]);

  // 开始排课
  const handleStartSchedule = async () => {
    if (!selectedCampusId) {
      alert('请先选择校区');
      return;
    }

    setExecuting(true);
    setStatusMessage('正在启动排课程序...');
    setScheduleResult(null);

    try {
      const response = await startSmartSchedule(selectedCampusId);
      
      if (response.code === 200 && response.data) {
        setStatusMessage('排课完成！');
        setScheduleResult(response.data);
      } else {
        // 检查是否是正在运行的消息
        const message = response.message || '排课失败';
        setStatusMessage(message);
        
        if (message.includes('running') || message.includes('wait')) {
          // 程序正在后台运行，提示用户刷新
          alert('排课程序正在后台运行，请稍后点击"刷新状态"按钮查看结果');
        } else {
          alert(message);
        }
      }
    } catch (error) {
      console.error('排课失败:', error);
      setStatusMessage('排课失败');
      alert('排课失败');
    } finally {
      setExecuting(false);
    }
  };

  // 根据 teacher_id 查找完整的老师数据
  const getTeacherData = (teacherId: number) => {
    if (!scheduleResult?.result?.teacher_return_list) {
      return { teacher_id: teacherId, class_num: 0, lesson_num: 0, busy_degree: 'N/A' };
    }
    const teacherData = scheduleResult.result.teacher_return_list.find(
      (t: any) => t.teacher_id === teacherId
    );
    return teacherData || { teacher_id: teacherId, class_num: 0, lesson_num: 0, busy_degree: 'N/A' };
  };

  // 打开弹窗
  const openModal = (type: 'teacher' | 'student' | 'class', payload: any) => {
    setModalStack(prev => [...prev, { type, payload }]);
  };

  // 打开老师弹窗（自动查找完整数据）
  const openTeacherModal = (teacherId: number) => {
    const teacherData = getTeacherData(teacherId);
    openModal('teacher', teacherData);
  };

  // 关闭当前弹窗
  const closeModal = () => {
    setModalStack(prev => prev.slice(0, -1));
  };

  // 时间段索引映射表：[Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const timeSlotMap: Record<string, number[]> = {
    '9:00-10:30':  [0, 5, 10, 15, 20, 30, 31],
    '10:30-12:00': [1, 6, 11, 16, 21, 32, 33],
    '13:30-15:00': [2, 7, 12, 17, 22, 34, 35],
    '15:00-16:30': [3, 8, 13, 18, 23, 36, 37],
    '16:30-18:00': [4, 9, 14, 19, 24, 38, 39],
    'Night':       [25, 26, 27, 28, 29, -1, -1]
  };

  // 刷新排课状态
  const handleRefreshStatus = async () => {
    if (!selectedCampusId) return;

    setLoading(true);
    setStatusMessage('正在检查排课状态...');

    try {
      const response = await startSmartSchedule(selectedCampusId);
      
      if (response.code === 200 && response.data) {
        setStatusMessage('排课结果已加载');
        setScheduleResult(response.data);
      } else {
        const message = response.message || '暂无排课结果';
        setStatusMessage(message);
        
        if (message.includes('running') || message.includes('wait')) {
          alert('排课程序仍在运行中，请稍后再试');
        }
      }
    } catch (error) {
      console.error('刷新状态失败:', error);
      setStatusMessage('刷新失败');
    } finally {
      setLoading(false);
    }
  };

  if (!canView || !isCoreUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">
            只有 Core User 才能访问 AI 排课执行页面
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI 排课执行</h1>
                <p className="text-sm text-gray-500 mt-1">启动智能排课并查看结果</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedCampusId || ''}
                onChange={(e) => {
                  setSelectedCampusId(Number(e.target.value));
                  setScheduleResult(null);
                  setStatusMessage('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                disabled={executing}
              >
                <option value="">选择校区</option>
                {campusList.map(campus => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRefreshStatus}
                disabled={!selectedCampusId || loading || executing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新状态
              </button>

              <button
                onClick={handleStartSchedule}
                disabled={!selectedCampusId || loading || executing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <PlayIcon className="h-4 w-4" />
                {executing ? '排课中...' : '开始排课'}
              </button>
              {/* <button
                onClick={handleCommitSchedule}
                disabled={!scheduleResult || loading || executing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                提交结果
              </button> */}
            </div>
          </div>

          {/* 状态消息 */}
          {statusMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              statusMessage.includes('完成') || statusMessage.includes('已加载')
                ? 'bg-green-50 text-green-800'
                : statusMessage.includes('失败') || statusMessage.includes('错误')
                ? 'bg-red-50 text-red-800'
                : 'bg-blue-50 text-blue-800'
            }`}>
              <p className="text-sm font-medium">{statusMessage}</p>
            </div>
          )}
        </div>

        {/* 排课结果展示 */}
        {!selectedCampusId ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CpuChipIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">请先选择校区，然后点击"开始排课"</p>
          </div>
        ) : scheduleResult ? (
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 p-6 pb-0">排课结果预览</h2>
            
            {/* 概览统计 */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Classes</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {scheduleResult.result?.schedule_classes_data?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Lessons</p>
                  <p className="text-2xl font-bold text-green-900">
                    {scheduleResult.result?.schedule_lessons_data?.length || 0}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Teachers</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {scheduleResult.result?.teacher_info?.length || 0}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium">Students</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {scheduleResult.result?.students_data?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tab 导航 */}
            <div className="px-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('time')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'time'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  时间汇总
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'teachers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  教师统计
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'students'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  学生统计
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'classes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  课程统计
                </button>
              </nav>
            </div>

            {/* Tab 内容 */}
            <div className="p-6">
              {activeTab === 'time' && (
                <div className="overflow-x-auto max-h-128 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间段</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">教师课时</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生课时</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scheduleResult.result?.return_time_count?.map((item: any, index: number) => (
                        <tr key={index} className={item.illegal ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.time}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.teacher_hours}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.student_hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'teachers' && (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">教师</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lessons</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">课时</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">忙碌度</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scheduleResult.result?.teacher_return_list?.map((teacher: any, index: number) => {
                        const teacherName = scheduleResult.result.teacher_info?.find((t: any) => t.id === teacher.teacher_id)?.name || `Teacher #${teacher.teacher_id}`;
                        return (
                          <tr key={index} className={teacher.illegal ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => openModal('teacher', teacher)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {teacherName}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.class_num}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.lesson_num}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.lesson_hours}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.busy_degree}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">导师</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lessons</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">忙碌度</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">毕业日期</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scheduleResult.result?.student_return_list?.map((student: any, index: number) => {
                        const studentName = scheduleResult.result.student_info?.find((s: any) => s.id === student.student_id)?.name || `Student #${student.student_id}`;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => openModal('student', student)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {studentName}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => openTeacherModal(student.mentor_id)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {student.mentor_name}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.lesson_num}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.lesson_hours}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.busy_degree}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.graduation_date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'classes' && (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">教师</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生数量</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scheduleResult.result?.schedule_classes_data?.map((classItem: any, index: number) => {
                        const teacherName = scheduleResult.result.teacher_info?.find((t: any) => t.id === classItem.teacher_id)?.name || 'Unknown';
                        const campusName = scheduleResult.result.campus_info?.find((c: any) => c.id === classItem.campus_id)?.name || 'Unknown';
                        const studentCount = scheduleResult.result.schedule_class_students_data?.filter((s: any) => s.class_id === classItem.id)?.length || 0;
                        const topicName = classItem.topic_name || classItem[1] || 'Unknown Topic';
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => openModal('class', classItem)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {topicName}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => openTeacherModal(classItem.teacher_id)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {teacherName}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{studentCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">暂无排课结果</p>
            <p className="text-sm text-gray-400 mt-2">点击"开始排课"按钮启动智能排课</p>
          </div>
        )}

        {/* 弹窗堆叠渲染 - 只渲染最后一个 */}
        {modalStack.length > 0 && (() => {
          const modal = modalStack[modalStack.length - 1];
          const zIndex = 50 + modalStack.length - 1;
          
          if (modal.type === 'teacher') {
            const teacher = modal.payload;
            return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex }}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {scheduleResult?.result?.teacher_info?.find((t: any) => t.id === teacher.teacher_id)?.name || `Teacher #${teacher.teacher_id}`} 的课表
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* 老师信息 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">老师信息</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Classes:</span>
                      <span className="ml-2 font-medium">{teacher.class_num}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lessons:</span>
                      <span className="ml-2 font-medium">{teacher.lesson_num}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Busy Degree:</span>
                      <span className="ml-2 font-medium">{teacher.busy_degree}</span>
                    </div>
                  </div>
                </div>

                {/* 一周课表 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">一周课表</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">时间</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周一</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周二</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周三</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周四</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周五</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周六</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周日</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {Object.entries(timeSlotMap).map(([timeLabel, indices]) => (
                          <tr key={timeLabel}>
                            <td className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-600 bg-gray-50">
                              {timeLabel}
                            </td>
                            {indices.map((slotIndex, dayIndex) => {
                              if (slotIndex === -1) {
                                return (
                                  <td key={dayIndex} className="px-4 py-2 border border-gray-200 text-xs text-center bg-white text-gray-400">
                                    -
                                  </td>
                                );
                              }
                              const teacherClassData = scheduleResult?.result?.teacher_class?.[teacher.teacher_id] || {};
                              const hasClass = Object.values(teacherClassData).some((classData: any) =>
                                classData.time_slots && classData.time_slots.includes(slotIndex)
                              );

                              // 判断是否为晚上或周末时间
                              const isNightOrWeekend = timeLabel === 'Night' || dayIndex >= 5; // 周六、周日
                              const baseClass = isNightOrWeekend ? 'bg-red-100' : 'bg-white';

                              return (
                                <td
                                  key={dayIndex}
                                  className={`px-4 py-2 border border-gray-200 text-xs text-center ${baseClass} ${
                                    hasClass ? 'text-blue-800 font-medium' : 'text-gray-400'
                                  }`}
                                >
                                  {hasClass ? '●' : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
            );
          } else if (modal.type === 'student') {
            const student = modal.payload;
            return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex }}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {scheduleResult?.result?.student_info?.find((s: any) => s.id === student.student_id)?.name || `Student #${student.student_id}`} 的课表
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* 学生信息 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">学生信息</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Classes:</span>
                      <span className="ml-2 font-medium">{student.lesson_num}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lessons:</span>
                      <span className="ml-2 font-medium">{student.lesson_hours}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Busy Degree:</span>
                      <span className="ml-2 font-medium">{student.busy_degree}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mentor:</span>
                      <button
                        onClick={() => openTeacherModal(student.mentor_id)}
                        className="ml-2 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {student.mentor_name}
                      </button>
                    </div>
                    <div>
                      <span className="text-gray-600">Graduation Date:</span>
                      <span className="ml-2 font-medium">{student.graduation_date}</span>
                    </div>
                  </div>
                </div>

                {/* 一周课表 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">一周课表</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">时间</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周一</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周二</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周三</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周四</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周五</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周六</th>
                          <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周日</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {Object.entries(timeSlotMap).map(([timeLabel, indices]) => (
                          <tr key={timeLabel}>
                            <td className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-600 bg-gray-50">
                              {timeLabel}
                            </td>
                            {indices.map((slotIndex, dayIndex) => {
                              if (slotIndex === -1) {
                                return (
                                  <td key={dayIndex} className="px-4 py-2 border border-gray-200 text-xs text-center bg-white text-gray-400">
                                    -
                                  </td>
                                );
                              }
                              const studentClassData = scheduleResult?.result?.student_class?.[student.student_id] || [];
                              const hasClass = studentClassData.some((classData: any) =>
                                classData.time_slots && Array.isArray(classData.time_slots) && classData.time_slots.includes(slotIndex)
                              );

                              // 判断是否为晚上或周末时间
                              const isNightOrWeekend = timeLabel === 'Night' || dayIndex >= 5; // 周六、周日
                              const baseClass = isNightOrWeekend ? 'bg-red-100' : 'bg-white';

                              return (
                                <td
                                  key={dayIndex}
                                  className={`px-4 py-2 border border-gray-200 text-xs text-center ${baseClass} ${
                                    hasClass ? 'text-blue-800 font-medium' : 'text-gray-400'
                                  }`}
                                >
                                  {hasClass ? '●' : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
            );
          } else if (modal.type === 'class') {
            const classData = modal.payload;
            const teacherName = scheduleResult?.result?.teacher_info?.find((t: any) => t.id === classData.teacher_id)?.name || 'Unknown';
            const topicName = classData.topic_name || classData[1] || 'Unknown Topic';
            const classStudents = scheduleResult?.result?.schedule_class_students_data?.filter((s: any) => s.class_id === classData.id) || [];
            const isExpanded = showAllStudents[classData.id] || false;
            const displayStudents = isExpanded ? classStudents : classStudents.slice(0, 5);
            
            // 从 class_color 或 teacher_class 获取 time_slots
            const timeSlots = 
              scheduleResult?.result?.class_color?.[classData.id] || 
              scheduleResult?.result?.teacher_class?.[classData.teacher_id]?.[classData.id]?.time_slots || 
              [];
            
            // 合并到 classData 中以便使用
            const classDataWithTimeSlots = {
              ...classData,
              time_slots: timeSlots
            };
            
            return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex }}>
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      课程详情: {topicName}
                    </h3>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* 课程基本信息 */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">基本信息</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Topic:</span>
                          <span className="ml-2 font-medium">{topicName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Teacher:</span>
                          <button
                            onClick={() => openTeacherModal(classData.teacher_id)}
                            className="ml-2 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {teacherName}
                          </button>
                        </div>
                        <div>
                          <span className="text-gray-600">Students:</span>
                          <span className="ml-2 font-medium">{classStudents.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* 学生列表 */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">学生列表</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {classStudents.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {displayStudents.map((classStudent: any, idx: number) => {
                                const studentInfo = scheduleResult?.result?.student_info?.find((s: any) => s.id === classStudent.student_id);
                                const studentName = studentInfo?.name || `Student #${classStudent.student_id}`;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const studentData = scheduleResult?.result?.student_return_list?.find((s: any) => s.student_id === classStudent.student_id);
                                      if (studentData) {
                                        openModal('student', studentData);
                                      }
                                    }}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
                                  >
                                    {studentName}
                                  </button>
                                );
                              })}
                            </div>
                            {classStudents.length > 5 && (
                              <button
                                onClick={() => setShowAllStudents(prev => ({
                                  ...prev,
                                  [classData.id]: !isExpanded
                                }))}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {isExpanded ? '收起' : `显示更多 (${classStudents.length - 5})`}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">暂无学生</p>
                        )}
                      </div>
                    </div>

                    {/* 课程排课表 */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">课程排课表</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">时间</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周一</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周二</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周三</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周四</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周五</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周六</th>
                              <th className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-500 uppercase">周日</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {Object.entries(timeSlotMap).map(([timeLabel, indices]) => (
                              <tr key={timeLabel}>
                                <td className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-600 bg-gray-50">
                                  {timeLabel}
                                </td>
                                {indices.map((slotIndex, dayIndex) => {
                                  if (slotIndex === -1) {
                                    return (
                                      <td key={dayIndex} className="px-4 py-2 border border-gray-200 text-xs text-center bg-white text-gray-400">
                                        -
                                      </td>
                                    );
                                    }
                                    
                                    // 检查该课程是否在此时间段有课
                                    const hasClass = timeSlots && Array.isArray(timeSlots) && timeSlots.includes(slotIndex);
                                  
                                  // 判断是否为晚上或周末时间
                                  const isNightOrWeekend = timeLabel === 'Night' || dayIndex >= 5;
                                  const baseClass = isNightOrWeekend ? 'bg-red-100' : 'bg-white';

                                  return (
                                    <td
                                      key={dayIndex}
                                      className={`px-4 py-2 border border-gray-200 text-xs text-center ${baseClass} ${
                                        hasClass ? 'text-blue-800 font-medium' : 'text-gray-400'
                                      }`}
                                    >
                                      {hasClass ? '●' : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

