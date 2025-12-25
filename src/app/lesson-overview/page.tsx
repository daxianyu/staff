'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getLessonOverview, LessonOverviewData, SubjectData, LessonData, getStaffInfo, StaffInfo } from '@/services/auth';
import { TableActionLink } from '@/components/TableActionLink';

// 时间工具函数
const formatTimestamp = (timestamp: number): { date: string; time: string } => {
  const date = new Date(timestamp * 1000);
  return {
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  };
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

const getSubjectName = (className: string): string => {
  if (className.includes('IG Physics') || className.includes('IG物理')) {
    return 'CIE IG Physics';
  } else if (className.includes('AS Physics') || className.includes('Physics-AS')) {
    return 'CIE Physics-AS';
  } else if (className.includes('Maths') || className.includes('数学')) {
    return 'Edexcel Maths';
  } else if (className.includes('IPC') || className.includes('物理竞赛')) {
    return 'Physics Competition';
  }
  return 'Other';
};

// 月份转换工具函数
const getMonthDisplayName = (monthId: string): string => {
  try {
    const monthNum = parseInt(monthId);
    const baseDate = new Date(1970, 0, 1);
    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthNum, 1);
    return targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  } catch {
    return `Month ${monthId}`;
  }
};

// API数据类型已从 services/auth.ts 导入

export default function LessonOverviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [data, setData] = useState<LessonOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新增：教师信息
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  // 从查询参数获取 userId 和 monthId
  const userId = searchParams.get('userId') || '';
  const monthId = searchParams.get('monthId') || '';

  // 权限检查
  const canViewLessonOverview = hasPermission(PERMISSIONS.VIEW_LESSON_OVERVIEW);

  useEffect(() => {
    const fetchData = async () => {
      if (!canViewLessonOverview) {
        setError('无权限访问课程概览');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getLessonOverview(userId, monthId);
        if (response.code === 200 && response.data) {
          setData(response.data as LessonOverviewData);
        } else {
          setError(response.message || '获取课程概览数据失败');
        }
      } catch (err) {
        setError('获取数据失败');
        console.error('Error fetching lesson overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, monthId, canViewLessonOverview]);

  // 新增：获取教师姓名
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setStaffLoading(true);
        const res = await getStaffInfo(userId);
        if (res.code === 200 && res.data) {
          setStaffInfo(res.data);
        } else {
          setStaffError(res.message || '获取教师信息失败');
        }
      } catch (e) {
        setStaffError('获取教师信息失败');
      } finally {
        setStaffLoading(false);
      }
    };
    if (userId) fetchStaff();
  }, [userId]);

  // 生成课程详情表格数据
  const generateLessonTableData = () => {
    if (!data) return [];
    
    const tableData: any[] = [];
    
    Object.entries(data.subjects).forEach(([subjectId, subject]) => {
      subject.lessons.forEach(lesson => {
        const timeInfo = formatTimestamp(lesson.start_time);
        const endTimeInfo = formatTimestamp(lesson.end_time);
        const duration = lesson.end_time - lesson.start_time;
        
        tableData.push({
          campus: subject.campus_name,
          date: timeInfo.date,
          time: `${timeInfo.time} - ${endTimeInfo.time}`,
          className: subject.class_name,
          classId: subject.class_id,
          lessonDetails: `Duration: ${formatDuration(duration)}`,
          feedbackGiven: lesson.feedback_given === 1 ? 'Yes' : 'No'
        });
      });
    });
    
    return tableData;
  };

  // 生成按科目统计数据
  const generateSubjectStats = () => {
    if (!data) return [];
    
    const subjectStats: { [key: string]: number } = {};
    
    Object.entries(data.subjects).forEach(([subjectId, subject]) => {
      const subjectName = getSubjectName(subject.class_name);
      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + subject.total_lesson_length;
    });
    
    return Object.entries(subjectStats).map(([subject, totalTime]) => ({
      subject,
      totalTime: formatDuration(totalTime)
    }));
  };

  // 生成按校区统计数据
  const generateCampusStats = () => {
    if (!data) return [];
    
    return Object.entries(data.campus_lessons).map(([campusId, totalTime]) => ({
      campus: data.campus_info[campusId] || `Campus ${campusId}`,
      totalTime: formatDuration(totalTime)
    }));
  };

  if (!canViewLessonOverview) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">您没有权限访问课程概览页面</p>
          </div>
        </div>
    );
  }

  const handleMonthChange = (increment: number) => {
    const currentMonthId = parseInt(monthId, 10);
    if (!isNaN(currentMonthId) && userId) {
      const newMonthId = currentMonthId + increment;
      // 用查询参数跳转
      router.push(`/lesson-overview?userId=${userId}&monthId=${newMonthId}`);
    }
  };

  const lessonTableData = generateLessonTableData();
  const subjectStats = generateSubjectStats();
  const campusStats = generateCampusStats();

  // 计算总课时
  const calculateTotalDuration = () => {
    if (!data) return 0;
    
    let totalSeconds = 0;
    Object.values(data.subjects).forEach(subject => {
      subject.lessons.forEach(lesson => {
        totalSeconds += (lesson.end_time - lesson.start_time);
      });
    });
    
    return totalSeconds;
  };

  const totalLessonDuration = calculateTotalDuration();

  return (
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lesson Overview</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">{getMonthDisplayName(monthId)}</span>
                {/* 教师姓名链接 */}
                {staffLoading ? (
                  <span className="text-gray-400 text-sm">教师信息加载中...</span>
                ) : staffError ? (
                  <span className="text-red-500 text-sm">{staffError}</span>
                ) : staffInfo ? (
                  <Link
                    href={`/staff/user?userId=${userId}`}
                    className="text-blue-600 hover:underline ml-2 text-gray-700 text-sm"
                  >
                    {staffInfo.staff_name}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <button
                onClick={() => handleMonthChange(-1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                &lt; Previous Month
              </button>
              <button
                onClick={() => handleMonthChange(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next Month &gt;
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">错误</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 第一个表格：课程详情 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lesson Details</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback Given</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lessonTableData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.campus}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.time}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={row.className}>{row.className}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.lessonDetails}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.feedbackGiven === '已给反馈' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {row.feedbackGiven}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <TableActionLink href={`/class/edit?id=${row.classId || 'unknown'}`} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition">编辑</TableActionLink>
                            <TableActionLink href={`/class/view?id=${row.classId || 'unknown'}`} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition">查看</TableActionLink>
                            <TableActionLink href={`/class/schedule?id=${row.classId || 'unknown'}`} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition">排课</TableActionLink>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {lessonTableData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          暂无课程数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Total
                      </td>
                      <td colSpan={3}></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatDuration(totalLessonDuration)}
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 第二个表格：按科目统计课时 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Teaching Hours per Subject</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lesson Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjectStats.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalTime}</td>
                      </tr>
                    ))}
                    {subjectStats.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                          暂无统计数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 第三个表格：按校区统计课时 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Teaching Hours per Campus</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lesson Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campusStats.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.campus}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalTime}</td>
                      </tr>
                    ))}
                    {campusStats.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                          暂无统计数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
  );
} 
