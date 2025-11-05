'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  getStudentPdf,
  downloadWishes,
  downloadWishesZip,
  downloadAllGraduationWish,
  genTranscriptReport,
  genPredictReport,
  genAmReport,
  genViewReport,
  type StudentPdfItem,
  type GenTranscriptReportParams,
  type GenPredictReportParams,
} from '@/services/auth';

export default function StudentPdfsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.STUDENT_PDFS);

  // 状态管理
  const [students, setStudents] = useState<StudentPdfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [reportConfig, setReportConfig] = useState<{
    studentId: number | null;
    reportType: 'transcript' | 'predict' | 'am' | 'academic' | 'mock' | null;
  }>({
    studentId: null,
    reportType: null,
  });

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看Student PDFs</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getStudentPdf();
      if (result.code === 200 && result.data) {
        setStudents(result.data.student_list || []);
      } else {
        console.error('获取Student PDF列表失败:', result.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤学生
  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name || ''}${student.last_name || ''}`.toLowerCase();
    const longId = (student.student_long_id || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || longId.includes(search);
  });

  // 切换展开/折叠
  const toggleExpand = (studentId: number) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN');
  };

  // 下载毕业祝福
  const handleDownloadWishes = async (studentId: number) => {
    try {
      await downloadWishes(studentId);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  // 下载毕业祝福Zip
  const handleDownloadWishesZip = async (studentId: number) => {
    try {
      await downloadWishesZip(studentId);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  // 下载所有毕业祝福
  const handleDownloadAllWishes = async () => {
    try {
      await downloadAllGraduationWish();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  // 生成报告
  const handleGenerateReport = async (
    student: StudentPdfItem,
    reportType: 'transcript' | 'predict' | 'am' | 'academic' | 'mock'
  ) => {
    try {
      let result;
      
      if (reportType === 'transcript') {
        // 生成Transcript Report需要更多参数，这里暂时简化
        alert('Transcript Report功能需要更多参数，请稍后实现');
        return;
      } else if (reportType === 'predict') {
        // 生成Predict Report需要更多参数
        alert('Predict Report功能需要更多参数，请稍后实现');
        return;
      } else if (reportType === 'am') {
        // 美本成绩单
        result = await genAmReport({
          student_id: student.id,
        });
      } else if (reportType === 'academic' || reportType === 'mock') {
        // 学术报告或模考报告
        const title = prompt('请输入报告标题（如：2024-2025第一学期期中）:');
        if (!title) return;
        
        const grade = reportType === 'academic' ? prompt('请输入年级（如：AS）:') || '' : '';
        
        result = await genViewReport({
          student_id: student.id,
          title: title,
          grade: grade,
        });
      }

      if (result && result.code === 200 && result.data?.file_path) {
        const fileUrl = `https://www.huayaopudong.com/${result.data.file_path}`;
        window.open(fileUrl, '_blank');
        alert('报告生成成功');
      } else {
        alert(result?.message || '生成报告失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Student PDFs</h1>
          <p className="mt-2 text-sm text-gray-600">管理学生PDF文件和毕业祝福</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="搜索学生姓名或学号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadAllWishes}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                下载所有毕业祝福
              </button>
              <button
                onClick={loadData}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                刷新
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mock Report</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wish Report</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudents.has(student.id);
                    return (
                      <>
                        <tr 
                          key={student.id} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleExpand(student.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(student.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? (
                                <ChevronDownIcon className="h-5 w-5" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.student_long_id || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {`${student.last_name || ''}${student.first_name || ''}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.active === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.active === 1 ? '活跃' : '非活跃'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.report === 1 ? '有' : '无'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.mock_report === 1 ? '有' : '无'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.wish_report === 1 ? '有' : '无'}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-2">
                              {student.wish_report === 1 && (
                                <>
                                  <button
                                    onClick={() => handleDownloadWishes(student.id)}
                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                    title="下载毕业祝福Excel"
                                  >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadWishesZip(student.id)}
                                    className="text-green-600 hover:text-green-900 inline-flex items-center"
                                    title="下载毕业祝福Zip"
                                  >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                {/* 学生详细信息 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">性别:</span>
                                    <span className="ml-2 text-gray-900">{student.gender === 0 ? '男' : '女'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">生日:</span>
                                    <span className="ml-2 text-gray-900">{formatTimestamp(student.birthday)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">入学日期:</span>
                                    <span className="ml-2 text-gray-900">{formatTimestamp(student.enrolment_date)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">毕业日期:</span>
                                    <span className="ml-2 text-gray-900">{formatTimestamp(student.graduation_date)}</span>
                                  </div>
                                </div>

                                {/* 报告生成按钮 */}
                                <div className="border-t border-gray-200 pt-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateReport(student, 'transcript');
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={student.report !== 1}
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      成绩单 (Transcript)
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateReport(student, 'predict');
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={student.report !== 1}
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      预测报告 (Predict)
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateReport(student, 'am');
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      美本成绩单 (AM)
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateReport(student, 'academic');
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={student.report !== 1}
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      学术报告 (Academic)
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateReport(student, 'mock');
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={student.mock_report !== 1}
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      模考报告 (Mock)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
