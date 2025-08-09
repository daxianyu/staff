'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStudentList, 
  getActiveStudentList,
  getDisabledStudentList,
  getAllStudentList,
  addStudent, 
  editStudent, 
  deleteStudent, 
  disableStudentAccount,
  enableStudentAccount,
  getAllCampus,
  type Student,
  type StudentFormData,
  type Campus,
  type StaffInfoTuple,
  type StudentInfo
} from '@/services/auth';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import DropdownPortal from '@/components/DropdownPortal';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentsPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'active' | 'all'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: -1, // -1: Not set, 0: Female, 1: Male
    personal_id: '',
    birthday: '',
    graduation_date: '',
    email: '',
    mentor_id: '',
    campus_id: 0,
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    personal_id?: string;
  }>({});

  // 校区列表状态
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [campusLoading, setCampusLoading] = useState(false);

  // 导师列表状态
  const [mentorList, setMentorList] = useState<any[]>([]);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const buttonRefsDesktop = useRef<Map<number, HTMLButtonElement>>(new Map());
  const buttonRefsMobile = useRef<Map<number, HTMLButtonElement>>(new Map());

  const getTriggerElement = (studentId: number): HTMLButtonElement | null => {
    const desktopEl = buttonRefsDesktop.current.get(studentId) || null;
    const mobileEl = buttonRefsMobile.current.get(studentId) || null;
    if (typeof window !== 'undefined') {
      const isSmUp = window.matchMedia('(min-width: 640px)').matches; // Tailwind sm 640px
      return isSmUp ? (desktopEl || mobileEl) : (mobileEl || desktopEl);
    }
    return desktopEl || mobileEl;
  };

  // 分页相关 state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const canView =
    hasPermission(PERMISSIONS.VIEW_STUDENTS) ||
    hasPermission(PERMISSIONS.FINANCE) ||
    hasPermission(PERMISSIONS.SALES_PERSON) ||
    hasPermission(PERMISSIONS.EDIT_STUDENTS);
  const canViewStudentDetails = canView;
  const canEditStudents = hasPermission(PERMISSIONS.EDIT_STUDENTS);
  const canDeleteStudents = hasPermission(PERMISSIONS.DELETE_STUDENTS);
  const canAddStudents = hasPermission(PERMISSIONS.ADD_STUDENTS);
  const hasAnyActionPermission = canViewStudentDetails || canEditStudents || canDeleteStudents;

  // 验证函数
  const validateEmail = (email: string): string | null => {
    if (!email) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return null;
  };

  const validatePersonalId = (id: string): string | null => {
    if (!id) return null;
    // 身份证号验证 - 18位数字，最后一位可能是X
    const idRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[1-2]\d|3[0-1])\d{3}[\dXx]$/;
    if (!idRegex.test(id)) {
      return '身份证号格式不正确，请输入18位有效身份证号';
    }
    return null;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的验证错误
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 实时验证
    if (field === 'email') {
      const error = validateEmail(value as string);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    } else if (field === 'personal_id') {
      const error = validatePersonalId(value as string);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const loadStudentList = async () => {
    try {
      setLoading(true);
      
      // 使用正确的API接口
      const response = await getStudentList({ disabled: studentStatusFilter === 'all' ? 1 : 0 });
      
      if (response.code === 200) {
        // 新的数据结构，学生信息在 response.data.list_info 中
        const studentData: StudentInfo[] = (response.data as any)?.list_info || [];
        const staffData: StaffInfoTuple[] = (response.data as any)?.staff_info || [];
        
        // 转换数据结构以匹配我们的接口
        const convertedData: Student[] = studentData.map((student: StudentInfo) => ({
          student_id: student.student_id,
          name: student.student_name,
          campus: student.campus_name,
          mentor_name: student.mentor_name,
          mentor_id: student.mentor_id,
          class_info: student.class_info || {},
          disabled: student.disabled,
          grade: '', // JSON中没有grade字段，使用默认值
          email: '', // JSON中没有email字段，使用默认值
          phone: '', // JSON中没有phone字段，使用默认值
          parent_phone: '', // JSON中没有parent_phone字段，使用默认值
          status: 1 // 默认为在读状态
        }));
        
        setStudentList(convertedData);

        // 从staff_info中提取导师列表并排序
        // staff_info格式: [[staff_id, staff_name], ...]
        const mentorData = staffData.map((staff: StaffInfoTuple) => ({
          id: staff[0].toString(), // staff_id
          name: staff[1]          // staff_name
        })).sort((a, b) => a.name.localeCompare(b.name));
        console.log(mentorData)
        setMentorList(mentorData);
      } else {
        console.error('获取学生列表失败:', response.message);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampusList = async () => {
    try {
      setCampusLoading(true);
      
      // 使用真实的校区列表API
      const response = await getAllCampus();
      
      if (response.status === 200) {
        setCampusList(response.data);
      } else {
        console.error('获取校区列表失败:', response.message);
        setCampusList([]);
      }
    } catch (error) {
      console.error('获取校区列表失败:', error);
      setCampusList([]);
    } finally {
      setCampusLoading(false);
    }
  };



  const handleAddStudent = () => {
    setFormData({
      first_name: '',
      last_name: '',
      gender: -1,
      personal_id: '',
      birthday: '',
      graduation_date: '',
      email: '',
      mentor_id: '',
      campus_id: 0,
    });
    setValidationErrors({});
    setShowAddModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleViewCourses = (student: Student) => {
    setSelectedStudent(student);
    setShowCourseModal(true);
  };

  const toggleRowExpansion = (studentId: number) => {
    // 与 staff 页面一致：一次仅展开一个下拉菜单
    const isOpen = expandedRows.has(studentId);
    const newExpandedRows = new Set<number>();
    if (!isOpen) newExpandedRows.add(studentId);
    setExpandedRows(newExpandedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证所有字段
    const emailError = validateEmail(formData.email);
    const personalIdError = validatePersonalId(formData.personal_id);
    
    const errors = {
      email: emailError || undefined,
      personal_id: personalIdError || undefined,
    };
    
    setValidationErrors(errors);
    
    // 如果有错误，不提交
    if (Object.values(errors).some(error => error)) {
      return;
    }
    
    try {
      // 准备API请求数据
      const requestData = {
        birthday: formData.birthday,
        campus_id: formData.campus_id,
        email: formData.email,
        first_name: formData.first_name,
        gender: formData.gender,
        graduation_date: formData.graduation_date,
        last_name: formData.last_name,
        mentor_id: formData.mentor_id,
        personal_id: formData.personal_id,
      };

      console.log('添加学生请求数据:', requestData);
      
      // 调用auth.ts中的addStudent函数
      const result = await addStudent(requestData);
      
      if (result.code === 200 && result.data) {
        // 成功创建学生，显示密码
        setGeneratedPassword(String(result.data));
      setShowAddModal(false);
        setShowPasswordModal(true);
      loadStudentList();
      } else {
        console.error('添加学生失败:', result.message || '未知错误');
        alert('添加学生失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('添加学生失败:', error);
      alert('添加学生失败，请稍后重试');
    }
  };

  const confirmDelete = async () => {
    if (!selectedStudent || deleteLoading) return;
    
    try {
      setDeleteLoading(true);
      console.log('删除学生:', selectedStudent.student_id);
      
      // 调用删除API
      const result = await deleteStudent(selectedStudent.student_id);
      
      if (result.code === 200) {
        console.log('删除学生成功');
        setShowDeleteModal(false);
        
        // 重新加载学生列表
        await loadStudentList();
        
        // 显示成功提示（可以后续替换为更好的toast组件）
        alert(`学生 ${selectedStudent.name} 删除成功`);
      } else {
        console.error('删除学生失败:', result.message);
        alert('删除学生失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('删除学生异常:', error);
      alert('删除学生失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEnableStudent = async (studentId: number) => {
    try {
      setStatusLoading(studentId);
      const res = await enableStudentAccount(studentId);
      if (res.code === 200) {
        await loadStudentList();
      } else {
        alert(res.message || '启用失败');
      }
    } catch (e) {
      console.error(e);
      alert('启用失败');
    } finally {
      setStatusLoading(null);
    }
  };

  const handleDisableStudent = async (studentId: number) => {
    try {
      setStatusLoading(studentId);
      const res = await disableStudentAccount(studentId);
      if (res.code === 200) {
        await loadStudentList();
      } else {
        alert(res.message || '禁用失败');
      }
    } catch (e) {
      console.error(e);
      alert('禁用失败');
    } finally {
      setStatusLoading(null);
    }
  };

  useEffect(() => {
    loadStudentList(); // 这个函数现在也会加载导师列表
    loadCampusList();
  }, []);

  useEffect(() => {
    // 切换学生状态过滤时，重新加载
    setCurrentPage(1);
    loadStudentList();
  }, [studentStatusFilter]);

  const filteredStudents = studentList.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toString().includes(searchTerm) ||
    (student.class_info && Object.values(student.class_info).some(className => 
      className.toLowerCase().includes(searchTerm.toLowerCase())
    )) ||
    (student.mentor_name && student.mentor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    student.campus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页逻辑
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view the student management page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 touch-pan-x touch-pan-y">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, student ID, classes, mentor, or campus..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* 学生状态过滤器（参考 staff 页面） */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">学生状态:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setStudentStatusFilter('active');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      studentStatusFilter === 'active'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    在读学生
                  </button>
                  <button
                    onClick={() => {
                      setStudentStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      studentStatusFilter === 'all'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    过期学生
                  </button>
                </div>
              </div>
            </div>
            
            {(canEditStudents || canAddStudents) && (
              <button
                onClick={handleAddStudent}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Student
              </button>
            )}
          </div>
        </div>

        {/* 学生列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* 桌面端表格视图 */}
              <div className="hidden sm:block overflow-x-auto relative">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campus
                    </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 truncate">{student.name}</div>
                        </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate">{student.student_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {student.class_info && Object.keys(student.class_info).length > 0 ? (
                              <button
                                onClick={() => handleViewCourses(student)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                                title="查看课程详情"
                              >
                                查看课程
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">无课程</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate">{student.mentor_name || '未分配'}</div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate">{student.campus}</div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          {/* 学生信息 - 最常见的操作 */}
                          {canViewStudentDetails && (
                            <Link href={`/students/user?userId=${student.student_id}`} legacyBehavior>
                              <a
                                className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 touch-manipulation"
                                title="Student Info"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </a>
                            </Link>
                          )}

                          {/* Student Schedule 快捷入口 */}
                          {canViewStudentDetails && (
                            <Link href={`/students/schedule?studentId=${student.student_id}`} legacyBehavior>
                              <a
                                className="flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 touch-manipulation"
                                title="Student Schedule"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </a>
                            </Link>
                          )}

                          {/* Lesson Table 入口 */}
                          {canViewStudentDetails && (
                            <Link href={`/lesson-table?record_id=${student.student_id}`} legacyBehavior>
                              <a
                                className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                                title="Lesson Table"
                              >
                                <TableCellsIcon className="h-4 w-4" />
                              </a>
                            </Link>
                          )}

                          {/* 更多操作下拉菜单 - 只有有权限时才显示 */}
                          {hasAnyActionPermission && (
                            <button
                              ref={(el) => {
                                if (el) {
                                  buttonRefsDesktop.current.set(student.student_id, el);
                                } else {
                                  buttonRefsDesktop.current.delete(student.student_id);
                                }
                              }}
                              onClick={() => toggleRowExpansion(student.student_id)}
                              className="action-toggle flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                              title="More Actions"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                          )}

                          {/* 如果没有权限，显示占位符 */}
                          {!hasAnyActionPermission && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片视图 */}
              <div className="sm:hidden space-y-4 p-4">
                {currentStudents.map((student) => (
                  <div key={student.student_id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                      <div className="flex items-center space-x-2">
                        {/* 学生信息按钮 */}
                        {canViewStudentDetails && (
                          <Link href={`/students/user?userId=${student.student_id}`} legacyBehavior>
                            <a
                              className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 touch-manipulation"
                              title="Student Info"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </a>
                          </Link>
                        )}

                        {/* Student Schedule 快捷入口（移动） */}
                        {canViewStudentDetails && (
                          <Link href={`/students/schedule?studentId=${student.student_id}`} legacyBehavior>
                            <a
                              className="flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 touch-manipulation"
                              title="Student Schedule"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </a>
                          </Link>
                        )}

                        {/* Lesson Table 快捷入口（移动） */}
                        {canViewStudentDetails && (
                          <Link href={`/lesson-table?record_id=${student.student_id}`} legacyBehavior>
                            <a
                              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                              title="Lesson Table"
                            >
                              <TableCellsIcon className="h-4 w-4" />
                            </a>
                          </Link>
                        )}

                        {/* 更多操作按钮 */}
                        {hasAnyActionPermission && (
                          <button
                            ref={(el) => {
                              if (el) {
                                buttonRefsMobile.current.set(student.student_id, el);
                              } else {
                                buttonRefsMobile.current.delete(student.student_id);
                              }
                            }}
                            onClick={() => toggleRowExpansion(student.student_id)}
                            className="action-toggle flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                            title="More Actions"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Student ID:</span>
                        <span className="text-gray-900 font-medium">{student.student_id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Classes:</span>
                        <div className="flex items-center gap-2">
                          {student.class_info && Object.keys(student.class_info).length > 0 ? (
                            <button
                              onClick={() => handleViewCourses(student)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                              title="查看课程详情"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              查看课程
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">无课程</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mentor:</span>
                        <span className="text-gray-900 font-medium">{student.mentor_name || '未分配'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Campus:</span>
                        <span className="text-gray-900 font-medium">{student.campus}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                  
                  {/* Portal下拉菜单 - 渲染在表格外部，避免被裁剪 */}
                  {currentStudents.map((student) => (
                    <DropdownPortal
                      key={`dropdown-${student.student_id}`}
                      isOpen={hasAnyActionPermission && expandedRows.has(student.student_id)}
                      onClose={() => setExpandedRows(new Set())}
                      triggerElement={getTriggerElement(student.student_id)}
                      className="w-48 sm:w-52 md:w-48 min-w-0 max-sm:w-44"
                    >
                      {/* Enable / Disable 按钮（互斥显示），样式参考 staff list */}
                      {canEditStudents && (
                        <>
                          {student.disabled === 1 ? (
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowEnableModal(true);
                                setExpandedRows(new Set());
                              }}
                              className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center gap-3 transition-colors touch-manipulation"
                              disabled={statusLoading === student.student_id}
                            >
                              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              Enable Account
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowDisableModal(true);
                                setExpandedRows(new Set());
                              }}
                              className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 flex items-center gap-3 transition-colors touch-manipulation"
                              disabled={statusLoading === student.student_id}
                            >
                              <LockClosedIcon className="h-4 w-4 text-yellow-500" />
                              Disable Account
                            </button>
                          )}
                        </>
                      )}

                      {/* Student edit - 需要 edit_students 权限 */}
                      {canViewStudentDetails && (
                        <Link
                          href={`/students/schedule?studentId=${student.student_id}`}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Schedule
                        </Link>
                      )}
                      {/* Student edit - 需要 edit_students 权限 */}
                      {canEditStudents && (
                        <Link
                          href={`/students/edit?id=${student.student_id}`}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Student Edit
                        </Link>
                      )}

                      {/* 分隔线 - 只有当有管理权限时才显示 */}
                      {(canViewStudentDetails && (canEditStudents || canDeleteStudents)) && (
                        <div className="border-t border-gray-200 my-2"></div>
                      )}

                      {/* Delete account - 需要 delete_students 权限 */}
                      {canDeleteStudents && (
                        <button
                          onClick={() => {
                            handleDeleteStudent(student);
                            setExpandedRows(new Set());
                          }}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                          Delete Account
                        </button>
                      )}
                    </DropdownPortal>
                  ))}

              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Student Data</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No matching students found' : 'No students have been added yet'}
                  </p>
                </div>
              )}

              {/* 分页按钮区域 */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      显示第 {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} 条，共 {filteredStudents.length} 条
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        上一页
                      </Button>
                      <div className="flex gap-1">
                        {/* 生成页码数组 */}
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 7; // 最多显示7个页码
                          
                          if (totalPages <= maxVisiblePages) {
                            // 如果总页数不多，显示所有页码
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // 如果总页数很多，智能显示
                            const startPage = Math.max(1, currentPage - 2);
                            const endPage = Math.min(totalPages, currentPage + 2);
                            
                            // 总是显示第一页
                            if (startPage > 1) {
                              pages.push(1);
                              if (startPage > 2) {
                                pages.push('...');
                              }
                            }
                            
                            // 显示当前页附近的页码
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(i);
                            }
                            
                            // 总是显示最后一页
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push('...');
                              }
                              pages.push(totalPages);
                            }
                          }
                          
                          return pages.map((page, index) => (
                          <Button
                              key={index}
                            size="sm"
                              variant={page === currentPage ? 'primary' : 'outline'}
                              onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                            className="w-8 h-8 p-0"
                              disabled={page === '...'}
                          >
                            {page}
                          </Button>
                          ));
                        })()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 添加模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => {
              setShowAddModal(false);
              setValidationErrors({});
            }}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setValidationErrors({});
                  }}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Student
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={-1}>Not set</option>
                      <option value={0}>Female</option>
                      <option value={1}>Male</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      身份证号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personal_id}
                      onChange={(e) => handleInputChange('personal_id', e.target.value.toUpperCase())}
                      placeholder="请输入18位身份证号码"
                      maxLength={18}
                      pattern="[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[1-2]\d|3[0-1])\d{3}[\dXx]"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                        validationErrors.personal_id 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.personal_id && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.personal_id}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Birthday <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                      required
                        value={formData.birthday}
                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.graduation_date}
                        onChange={(e) => handleInputChange('graduation_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="例如: student@example.com"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                        validationErrors.email 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentor <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.mentor_id}
                      onChange={(e) => handleInputChange('mentor_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Loading mentors...' : 'Select a mentor'}</option>
                      {mentorList.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campus <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.campus_id}
                      onChange={(e) => handleInputChange('campus_id', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={campusLoading}
                    >
                      <option value={0}>{campusLoading ? 'Loading campuses...' : 'Select a campus'}</option>
                      {campusList.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}{campus.code ? ` - ${campus.code}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={() => setShowDeleteModal(false)}
              aria-hidden="true"
            ></div>
            
            {/* 居中对齐的技巧 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-3">
                    确认删除学生
                  </h3>
                  <div className="mt-2">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-1">⚠️ 危险操作警告</h4>
                          <p className="text-sm text-red-700">
                            此操作将永久删除学生数据，无法恢复。
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">待删除学生信息：</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">姓名：</span>{selectedStudent.name}</p>
                          <p><span className="font-medium">学号：</span>{selectedStudent.student_id}</p>
                          <p><span className="font-medium">校区：</span>{selectedStudent.campus}</p>
                          {selectedStudent.mentor_name && (
                            <p><span className="font-medium">导师：</span>{selectedStudent.mentor_name}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm text-yellow-800">
                              删除学生将同时删除其关联的课程记录、成绩信息等所有数据。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors sm:w-auto sm:text-sm ${
                    deleteLoading 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      删除中...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      确认删除
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors sm:mt-0 sm:w-auto sm:text-sm ${
                    deleteLoading 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 启用账户确认模态框 */}
      {showEnableModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={() => setShowEnableModal(false)}
              aria-hidden="true"
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">确认启用账户</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    确认启用学生 <span className="font-medium">{selectedStudent.name}</span> 的账户？
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
                <button
                  onClick={async () => {
                    await handleEnableStudent(selectedStudent.student_id);
                    setShowEnableModal(false);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors sm:w-auto sm:text-sm"
                >
                  确认启用
                </button>
                <button
                  onClick={() => setShowEnableModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors sm:mt-0 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 禁用账户确认模态框 */}
      {showDisableModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={() => setShowDisableModal(false)}
              aria-hidden="true"
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <LockClosedIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">确认禁用账户</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    确认禁用学生 <span className="font-medium">{selectedStudent.name}</span> 的账户？该学生将无法登录，且当前班级关联会被清空。
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
                <button
                  onClick={async () => {
                    await handleDisableStudent(selectedStudent.student_id);
                    setShowDisableModal(false);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors sm:w-auto sm:text-sm"
                >
                  确认禁用
                </button>
                <button
                  onClick={() => setShowDisableModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors sm:mt-0 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 课程详情模态框 */}
      {showCourseModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              onClick={() => setShowCourseModal(false)}
              aria-hidden="true"
            ></div>

            {/* 居中对齐的技巧 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* 模态框头部 */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedStudent.name} 的课程详情
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">关闭</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* 滚动内容区域 */}
                <div className="max-h-96 overflow-y-auto">
                  {selectedStudent.class_info && Object.keys(selectedStudent.class_info).length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">课程列表</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedStudent.class_info).map(([classId, className], index) => (
                            <div key={classId} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{className}</p>
                                  <p className="text-xs text-gray-500">课程ID: {classId}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  进行中
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">暂无课程</h4>
                      <p className="text-gray-500">该学生目前没有注册任何课程</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 模态框底部 */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 密码显示模态框 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowPasswordModal(false)} aria-hidden="true"></div>
            
            {/* 居中对齐的技巧 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      学生添加成功
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        学生账户已成功创建，请妥善保管以下密码：
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-mono font-bold text-gray-900">{generatedPassword}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPassword);
                              // 可以添加一个提示复制成功的状态
                            }}
                            className="ml-3 flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                            title="复制密码"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ 请立即复制并妥善保管密码，关闭窗口后将无法再次查看
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  我已复制
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  复制密码
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
