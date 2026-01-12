'use client';

import { useState, useEffect, useMemo, useCallback, memo, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
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
  genCertificateReport,
  getEvaluateSelect,
  type StudentPdfItem,
  type GenTranscriptReportParams,
  type GenPredictReportParams,
  type GenCertificateReportParams,
} from '@/services/auth';
import PredictModal from './components/PredictModal';
import CertificateModal from './components/CertificateModal';
import TranscriptModal from './components/TranscriptModal';
import AmReportModal from './components/AmReportModal';
import { buildFileUrl } from '@/config/env';

export default function StudentPdfsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.STUDENT_PDFS);

  // 状态管理
  const [students, setStudents] = useState<StudentPdfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active'); // 在读/非在读tab
  const [reportConfig, setReportConfig] = useState<{
    studentId: number | null;
    reportType: 'transcript' | 'predict' | 'am' | 'academic' | 'mock' | 'certificate' | null;
  }>({
    studentId: null,
    reportType: null,
  });
  // 学期选项数据
  const [evaluateOptions, setEvaluateOptions] = useState<{
    student_evaluate: Record<number, string[]>;
    mock_evaluate: Record<number, string[]>;
  }>({
    student_evaluate: {},
    mock_evaluate: {},
  });
  // 数据字段
  const [pdfData, setPdfData] = useState<{
    all_course: string[];
    transaction_list: string[];
    grade_select: string[];
    am_grade_list: string[];
    fix_course: string[];
    america_subjects: string[];
    transcript_grade_list: string[];
  }>({
    all_course: [],
    transaction_list: [],
    grade_select: [],
    am_grade_list: [],
    fix_course: [],
    america_subjects: [],
    transcript_grade_list: [],
  });
  // 模态框状态
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  // Expected grades 模态框
  const [showPredictModal, setShowPredictModal] = useState(false);
  const [selectedStudentForPredict, setSelectedStudentForPredict] = useState<StudentPdfItem | null>(null);
  // Certificate 模态框
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedStudentForCertificate, setSelectedStudentForCertificate] = useState<StudentPdfItem | null>(null);
  // Transcript 模态框
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedStudentForTranscript, setSelectedStudentForTranscript] = useState<StudentPdfItem | null>(null);
  // 美本成绩单参数模态框
  const [showAmReportModal, setShowAmReportModal] = useState(false);
  const [selectedStudentForAm, setSelectedStudentForAm] = useState<StudentPdfItem | null>(null);

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
      const [pdfResult, evaluateResult] = await Promise.all([
        getStudentPdf(),
        getEvaluateSelect(),
      ]);

      if (pdfResult.code === 200 && pdfResult.data) {
        setStudents(pdfResult.data.student_list || []);
        // 保存所有数据字段
        setPdfData({
          all_course: pdfResult.data.all_course || [],
          transaction_list: pdfResult.data.transaction_list || [],
          grade_select: pdfResult.data.grade_select || [],
          am_grade_list: pdfResult.data.am_grade_list || [],
          fix_course: pdfResult.data.fix_course || [],
          america_subjects: pdfResult.data.america_subjects || [],
          transcript_grade_list: pdfResult.data.transcript_grade_list || [],
        });
      } else {
        console.error('获取Student PDF列表失败:', pdfResult.message);
        setStudents([]);
      }

      if (evaluateResult.code === 200 && evaluateResult.data) {
        const options = {
          student_evaluate: evaluateResult.data.student_evaluate || {},
          mock_evaluate: evaluateResult.data.mock_evaluate || {},
        };
        console.log('学期选项数据加载完成:', options);
        setEvaluateOptions(options);
      } else {
        console.error('获取学期选项失败:', evaluateResult.message);
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
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 先根据tab过滤（在读/非在读）
      const matchesTab = activeTab === 'active'
        ? student.active === 1
        : student.active !== 1;

      if (!matchesTab) return false;

      // 再根据搜索关键词过滤
      // 移除所有空格以支持模糊匹配（如搜 "Tang Gouzi" 能匹配 "TangGouzi"）
      const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');

      const fullNameOriginal = normalize(`${student.first_name || ''}${student.last_name || ''}`);
      const fullNameReverse = normalize(`${student.last_name || ''}${student.first_name || ''}`);
      const longId = normalize(student.student_long_id || '');
      const search = normalize(searchTerm);

      return fullNameOriginal.includes(search) ||
        fullNameReverse.includes(search) ||
        longId.includes(search);
    });
  }, [students, searchTerm, activeTab]);

  // 切换展开/折叠
  const toggleExpand = useCallback((studentId: number) => {
    setExpandedStudents(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(studentId)) {
        newExpanded.delete(studentId);
      } else {
        newExpanded.add(studentId);
      }
      return newExpanded;
    });
  }, []);

  // 格式化时间戳
  const formatTimestamp = useCallback((timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN');
  }, []);

  // 下载毕业祝福
  const handleDownloadWishes = useCallback(async (studentId: number) => {
    try {
      await downloadWishes(studentId);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  }, []);

  // 下载毕业祝福Zip
  const handleDownloadWishesZip = useCallback(async (studentId: number) => {
    try {
      await downloadWishesZip(studentId);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  }, []);

  // 下载所有学生的毕业祝福（汇总Excel文件 - 使用 down_all_graduation_wish 接口）
  const handleDownloadAllWishes = useCallback(async () => {
    try {
      await downloadAllGraduationWish();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  }, []);


  // 格式化日期为 YYYY-MM-DD
  const formatDateForInput = useCallback((timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 打开 Expected grades 模态框
  const handleOpenPredictModal = useCallback((student: StudentPdfItem) => {
    setSelectedStudentForPredict(student);
    setShowPredictModal(true);
  }, []);

  // 打开 Certificate 模态框
  const handleOpenCertificateModal = useCallback((student: StudentPdfItem) => {
    setSelectedStudentForCertificate(student);
    setShowCertificateModal(true);
  }, []);

  // 打开 Transcript 模态框
  const handleOpenTranscriptModal = useCallback((student: StudentPdfItem) => {
    setSelectedStudentForTranscript(student);
    setShowTranscriptModal(true);
  }, []);

  // 打开报告生成模态框
  const handleOpenReportModal = (
    student: StudentPdfItem,
    reportType: 'transcript' | 'predict' | 'am' | 'academic' | 'mock'
  ) => {
    if (reportType === 'transcript') {
      handleOpenTranscriptModal(student);
      return;
    } else if (reportType === 'predict') {
      handleOpenPredictModal(student);
      return;
    } else if (reportType === 'am') {
      // 美本成绩单需要输入参数
      setSelectedStudentForAm(student);
      setShowAmReportModal(true);
      return;
    } else if (reportType === 'academic' || reportType === 'mock') {
      // 学术报告或模考报告需要选择学期
      console.log('打开模态框:', { studentId: student.id, reportType });
      setReportConfig({
        studentId: student.id,
        reportType: reportType,
      });
      setSelectedTitle('');
      setSelectedGrade('');
      setShowReportModal(true);
    }
  };

  // 处理 Predict 报告生成
  const handlePredictConfirm = useCallback(async (params: {
    graduation_date: string;
    data: Array<{ alevel: string; date: string; course: string; score: string }>;
  }) => {
    if (!selectedStudentForPredict) return;

    try {
      const student = selectedStudentForPredict;
      const enName = `${student.pinyin_first_name || ''} ${student.pinyin_last_name || ''}`.trim();
      const chineseName = `${student.last_name || ''}${student.first_name || ''}`;
      const isMale = student.gender === 0 ? 1 : 0;
      // 格式化毕业日期为 YYYY/MM/DD 格式
      const formatGraduationTime = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      };
      const graduationTime = formatGraduationTime(params.graduation_date);
      // 转换数据格式：从对象数组转为数组数组 [[alevel, date, course, score], ...]
      const values = params.data.map(item => [
        item.alevel,
        item.date,
        item.course,
        item.score,
      ]);

      const result = await genPredictReport({
        student_id: student.id,
        name: enName || chineseName,
        chinese_name: chineseName,
        is_male: isMale,
        birthday: student.birthday || 0,
        duration_from: student.enrolment_date || 0,
        graduation_time: graduationTime,
        values: values,
      });

      if (result && result.code === 200 && result.data?.file_path) {
        const fileUrl = buildFileUrl(result.data.file_path);
        window.open(fileUrl, '_blank');
        alert('报告生成成功');
        setShowPredictModal(false);
        setSelectedStudentForPredict(null);
      } else {
        alert(result?.message || '生成报告失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  }, [selectedStudentForPredict]);

  // 处理 Certificate 报告生成
  const handleCertificateConfirm = useCallback(async (params: {
    name: string;
    id: string;
    gender: string;
    birthday: string;
    studied_from: string;
    graduation_date: string;
  }) => {
    if (!selectedStudentForCertificate) return;

    try {
      const student = selectedStudentForCertificate;
      const birthdayTimestamp = params.birthday ? Math.floor(new Date(params.birthday).getTime() / 1000) : 0;
      const studiedFromTimestamp = params.studied_from ? Math.floor(new Date(params.studied_from).getTime() / 1000) : 0;
      const graduationTimestamp = params.graduation_date ? Math.floor(new Date(params.graduation_date).getTime() / 1000) : 0;

      const result = await genCertificateReport({
        student_id: student.id,
        name: params.name,
        id: params.id,
        gender: params.gender,
        birthday: birthdayTimestamp,
        studied_from: studiedFromTimestamp,
        graduation_date: graduationTimestamp,
      });

      if (result && result.code === 200 && result.data?.file_path) {
        const fileUrl = buildFileUrl(result.data.file_path);
        window.open(fileUrl, '_blank');
        alert('报告生成成功');
        setShowCertificateModal(false);
        setSelectedStudentForCertificate(null);
      } else {
        alert(result?.message || '生成报告失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  }, [selectedStudentForCertificate]);

  // 处理 Transcript 报告生成
  const handleTranscriptConfirm = useCallback(async (params: {
    name_pinyin: string;
    name_hanzi: string;
    gender: string;
    birthday: string;
    duration_from: string;
    graduation_date: string;
    ig_time: string;
    as_time: string;
    al_time: string;
    data: Array<{
      course: string;
      ig_term1: string;
      ig_term2: string;
      as_term1: string;
      as_term2: string;
      al_term1: string;
      al_term2: string;
    }>;
  }) => {
    if (!selectedStudentForTranscript) return;

    try {
      const student = selectedStudentForTranscript;
      const isMale = params.gender === 'Male' ? 1 : 0;
      // 格式化毕业日期为 YYYY/MM/DD 格式
      const formatGraduationTime = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      };
      const graduationTime = formatGraduationTime(params.graduation_date);
      const birthdayTimestamp = params.birthday ? Math.floor(new Date(params.birthday).getTime() / 1000) : 0;
      const durationFromTimestamp = params.duration_from ? Math.floor(new Date(params.duration_from).getTime() / 1000) : 0;

      const result = await genTranscriptReport({
        student_id: student.id,
        name: params.name_pinyin,
        chinese_name: params.name_hanzi,
        is_male: isMale,
        birthday: birthdayTimestamp,
        duration_from: durationFromTimestamp,
        graduation_time: graduationTime,
        ig_time: params.ig_time,
        as_time: params.as_time,
        al_time: params.al_time,
        values: params.data,
      });

      if (result && result.code === 200 && result.data?.file_path) {
        const fileUrl = buildFileUrl(result.data.file_path);
        window.open(fileUrl, '_blank');
        alert('报告生成成功');
        setShowTranscriptModal(false);
        setSelectedStudentForTranscript(null);
      } else {
        alert(result?.message || '生成报告失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  }, [selectedStudentForTranscript]);

  // 处理美本成绩单报告生成
  const handleAmReportConfirm = useCallback(async (params: {
    name: string;
    is_male: string;
    student_number: string;
    grade_10: string;
    grade_11: string;
    grade_12: string;
    data: Array<{
      course: string;
      grade10_s1: string;
      grade10_s2: string;
      grade10_final: string;
      grade11_s1: string;
      grade11_s2: string;
      grade11_final: string;
      grade12_s1: string;
      grade12_s2: string;
      grade12_final: string;
    }>;
  }) => {
    if (!selectedStudentForAm) return;

    try {
      const student = selectedStudentForAm;
      // 转换数据格式为后端需要的格式
      const values = params.data.map(item => ({
        course: item.course,
        ig_term1: item.grade10_s1 || ' ',
        ig_term2: item.grade10_s2 || ' ',
        ig_final: item.grade10_final || ' ',
        as_term1: item.grade11_s1 || ' ',
        as_term2: item.grade11_s2 || ' ',
        as_final: item.grade11_final || ' ',
        al_term1: item.grade12_s1 || ' ',
        al_term2: item.grade12_s2 || ' ',
        al_final: item.grade12_final || ' ',
      }));

      const result = await genAmReport({
        student_id: student.id,
        name: params.name,
        is_male: params.is_male,
        birthday: student.birthday || 0,
        enrolment_time: student.enrolment_date || 0,
        graduation_time: student.graduation_date || 0,
        student_number: params.student_number,
        grade_10: params.grade_10,
        grade_11: params.grade_11,
        grade_12: params.grade_12,
        values: values,
      });

      if (result && result.code === 200 && result.data?.file_path) {
        const fileUrl = buildFileUrl(result.data.file_path);
        window.open(fileUrl, '_blank');
        alert('报告生成成功');
        setShowAmReportModal(false);
        setSelectedStudentForAm(null);
      } else {
        alert(result?.message || '生成报告失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  }, [selectedStudentForAm]);

  // 生成报告（用于学术报告和模考报告）
  const handleGenerateReport = async (
    student: StudentPdfItem,
    reportType: 'academic' | 'mock',
    title: string,
    grade: string
  ) => {
    try {
      if (!title) {
        alert('请选择学期');
        return;
      }

      const result = await genViewReport({
        student_id: student.id,
        title: title,
        grade: grade,
      });

      if (result && result.code === 200 && result.data?.file_path) {
        const fileUrl = buildFileUrl(result.data.file_path);
        window.open(fileUrl, '_blank');
        alert('报告生成成功');
        setShowReportModal(false);
      } else {
        alert(result?.message || '生成报告失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  };

  // 确认生成报告（学术报告和模考报告）
  const handleConfirmGenerate = useCallback(() => {
    if (!reportConfig.studentId || !reportConfig.reportType) return;

    const student = students.find(s => s.id === reportConfig.studentId);
    if (!student) return;

    if (!selectedTitle) {
      alert('请选择学期');
      return;
    }

    if (reportConfig.reportType === 'academic' || reportConfig.reportType === 'mock') {
      handleGenerateReport(
        student,
        reportConfig.reportType,
        selectedTitle,
        selectedGrade
      );
    }
  }, [reportConfig, students, selectedTitle, selectedGrade]);

  // 使用 useMemo 计算当前学生的学期选项
  const currentStudentOptions = useMemo(() => {
    if (!reportConfig.studentId || !reportConfig.reportType) {
      console.log('选项计算: 缺少 studentId 或 reportType', reportConfig);
      return [];
    }

    const studentId = reportConfig.studentId;
    const reportType = reportConfig.reportType;

    // 调试信息
    console.log('计算学期选项:', {
      studentId,
      reportType,
      student_evaluate_keys: Object.keys(evaluateOptions.student_evaluate),
      mock_evaluate_keys: Object.keys(evaluateOptions.mock_evaluate),
      student_evaluate_value: evaluateOptions.student_evaluate[studentId],
      mock_evaluate_value: evaluateOptions.mock_evaluate[studentId],
    });

    if (reportType === 'academic') {
      // 学术报告使用 student_evaluate
      const options = evaluateOptions.student_evaluate[studentId] || [];
      console.log('学术报告选项 (student_evaluate):', options);
      return options;
    } else if (reportType === 'mock') {
      // 模考报告使用 mock_evaluate
      const options = evaluateOptions.mock_evaluate[studentId] || [];
      console.log('模考报告选项 (mock_evaluate):', options);
      return options;
    }

    console.log('选项计算: 未知的 reportType', reportType);
    return [];
  }, [reportConfig.studentId, reportConfig.reportType, evaluateOptions]);

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
              {/* Tab切换 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setActiveTab('active');
                    setSearchTerm(''); // 切换tab时清空搜索
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'active'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  在读学生
                </button>
                <button
                  onClick={() => {
                    setActiveTab('inactive');
                    setSearchTerm(''); // 切换tab时清空搜索
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'inactive'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  非在读学生
                </button>
              </div>

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

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDownloadAllWishes}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                title="下载所有学生的毕业祝福（汇总Excel文件，一个文件包含所有学生）"
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudents.has(student.id);
                    return (
                      <Fragment key={student.id}>
                        <tr
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.active === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {student.active === 1 ? '在读' : '非在读'}
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
                            {/* 操作列暂时留空，个人下载按钮放在展开区域 */}
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

                                {/* 个人毕业祝福下载按钮 */}
                                {student.wish_report === 1 && (
                                  <div className="border-t border-gray-200 pt-4">
                                    <div className="mb-2">
                                      <span className="text-sm font-medium text-gray-700">毕业祝福下载：</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadWishes(student.id);
                                        }}
                                        className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                      >
                                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                        下载Excel
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadWishesZip(student.id);
                                        }}
                                        className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                      >
                                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                        下载Zip
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* 报告生成按钮 */}
                                <div className="border-t border-gray-200 pt-4">
                                  <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">报告生成：</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {/* 预测成绩单报告 - 总是显示 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPredictModal(student);
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      Expected grades
                                    </button>

                                    {/* Certificate - 总是显示 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCertificateModal(student);
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      Certificate
                                    </button>

                                    {/* Transcript 成绩单 - 总是显示 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenTranscriptModal(student);
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      Transcript
                                    </button>

                                    {/* 美本成绩单 (AM) - 总是显示 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenReportModal(student, 'am');
                                      }}
                                      className="inline-flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                      美本成绩单
                                    </button>

                                    {/* 成绩单 - 只在 report === 1 时显示 */}
                                    {student.report === 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReportModal(student, 'academic');
                                        }}
                                        className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                      >
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                        成绩单
                                      </button>
                                    )}

                                    {/* 模考成绩报告 - 只在 mock_report === 1 时显示 */}
                                    {student.mock_report === 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReportModal(student, 'mock');
                                        }}
                                        className="inline-flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                      >
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                        模考成绩报告
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
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

      {/* 报告生成模态框（成绩单/模考成绩报告） */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {reportConfig.reportType === 'academic' ? '生成成绩单' : '生成模考成绩报告'}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择学期
                </label>
                <select
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择学期</option>
                  {currentStudentOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
                {currentStudentOptions.length === 0 && reportConfig.studentId && (
                  <p className="mt-2 text-sm text-gray-500">
                    该学生暂无可用学期选项 (类型: {reportConfig.reportType})
                  </p>
                )}
              </div>

              {reportConfig.reportType === 'academic' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年级（可选）
                  </label>
                  <input
                    type="text"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    placeholder="如：AS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmGenerate}
                disabled={!selectedTitle}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expected grades 模态框 */}
      <PredictModal
        isOpen={showPredictModal}
        onClose={() => {
          setShowPredictModal(false);
          setSelectedStudentForPredict(null);
        }}
        student={selectedStudentForPredict}
        allCourse={pdfData.all_course}
        onConfirm={handlePredictConfirm}
      />

      {/* Certificate 模态框 */}
      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          setSelectedStudentForCertificate(null);
        }}
        student={selectedStudentForCertificate}
        onConfirm={handleCertificateConfirm}
      />

      {/* Transcript 模态框 */}
      <TranscriptModal
        isOpen={showTranscriptModal}
        onClose={() => {
          setShowTranscriptModal(false);
          setSelectedStudentForTranscript(null);
        }}
        student={selectedStudentForTranscript}
        transactionList={pdfData.transaction_list}
        fixCourse={pdfData.fix_course}
        gradeList={pdfData.transcript_grade_list || pdfData.grade_select}
        onConfirm={handleTranscriptConfirm}
      />

      {/* Transcript 模态框 - 旧代码已删除 */}

      {/* 美本成绩单参数模态框 */}
      <AmReportModal
        isOpen={showAmReportModal}
        onClose={() => {
          setShowAmReportModal(false);
          setSelectedStudentForAm(null);
        }}
        student={selectedStudentForAm}
        americaSubjects={pdfData.america_subjects}
        amGradeList={pdfData.am_grade_list}
        onConfirm={handleAmReportConfirm}
      />
    </div>
  );
}
