'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStudentEditInfo, 
  updateStudentInfoV2,
  resetStudentPassword,
  resetStudentId,
  updateStudentExamResult,
  getAllCampus,
  type StudentEditInfo,
  type Campus,
  type StudentUpdatePayload
} from '@/services/auth';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// 将后端返回的多种日期表现统一为 yyyy-MM-dd 供 input[type=date]
function toDateInput(input: any): string {
  if (!input && input !== 0) return '';
  try {
    if (typeof input === 'number') {
      const ms = input > 1e12 ? input : input * 1000;
      const d = new Date(ms);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    if (typeof input === 'string') {
      if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
        const [dd, mm, yyyy] = input.split('-');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
  } catch {}
  return '';
}

function toDateSeconds(input: string): number | null {
  if (!input) return null;
  // input expected yyyy-MM-dd
  const d = new Date(input + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

function toDateString(input: string): string {
  if (!input) return '';
  // 返回 yyyy-MM-dd 格式
  return input;
}

// 本地表单类型，覆盖/扩展后端字段
type StudentAllForm = {
  record_id: number;
  campus_id: number;
  email: string;
  first_name: string;
  last_name: string;
  pinyin_first_name: string;
  pinyin_last_name: string;
  birthday: string;
  sales_pay_date: string;
  enrolment_date: string;
  graduation_date: string;
  year_fee: string;
  gender: number;
  personal_id: string;
  day_student: number;
  active: number;
  accounting_enabled: number;
  mentor_id: number;
  assigned_staff: number;
  english_name: string;
  nationality: string;
  phone_number: string;
  address: string;
  current_school: string;
  current_grade: string;
  hometown: string;
  fathers_name: string;
  fathers_phone_number: string;
  fathers_email: string;
  fathers_occupation: string;
  fathers_employer: string;
  mothers_name: string;
  mothers_phone_number: string;
  mothers_email: string;
  mothers_occupation: string;
  mothers_employer: string;
  personal_statement: string;
  special_note: string;
  year_fee_repayment_time_1: string;
  year_fee_repayment_time_2: string;
  year_fee_repayment_time_3: string;
  exam_0_number: string; // UCI number
  exam_1_number: string; // CIE Center Number
  exam_2_number: string; // CIE Candidate number
  // 新增：与后端完整字段对齐
  graduation_date_for_id: number;
  stop_reason: number;
  suspend_reason: string | '';
  suspend_comment: string | '';
  graduate_university: string | '';
  grade: number;
};

export default function StudentEditPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentEditInfo | null>(null);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetLoading, setResetLoading] = useState<'pwd' | 'sid' | null>(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [examLoadingRow, setExamLoadingRow] = useState<number | null>(null);
  const [examEdits, setExamEdits] = useState<Record<number, string>>({});
  const [gradeEdits, setGradeEdits] = useState<Record<number, string>>({});
  const [secondEdits, setSecondEdits] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'exam'>('profile');
  
  // Grade 选项
  const gradeOptions = ["A*", "A", "B", "C", "D", "E", "U", "X No result", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const [showResetPwdConfirm, setShowResetPwdConfirm] = useState(false);
  const [showResetIdConfirm, setShowResetIdConfirm] = useState(false);

  const [formData, setFormData] = useState<StudentAllForm>({
    record_id: 0,
    campus_id: 0,
    email: '',
    first_name: '',
    last_name: '',
    pinyin_first_name: '',
    pinyin_last_name: '',
    birthday: '',
    sales_pay_date: '',
    enrolment_date: '',
    graduation_date: '',
    year_fee: '',
    gender: -1,
    personal_id: '',
    day_student: 0,
    active: 1,
    accounting_enabled: 0,
    mentor_id: 0,
    assigned_staff: 0,
    english_name: '',
    nationality: '',
    phone_number: '',
    address: '',
    current_school: '',
    current_grade: '',
    hometown: '',
    fathers_name: '',
    fathers_phone_number: '',
    fathers_email: '',
    fathers_occupation: '',
    fathers_employer: '',
    mothers_name: '',
    mothers_phone_number: '',
    mothers_email: '',
    mothers_occupation: '',
    mothers_employer: '',
    personal_statement: '',
    special_note: '',
    year_fee_repayment_time_1: '',
    year_fee_repayment_time_2: '',
    year_fee_repayment_time_3: '',
    exam_0_number: '',
    exam_1_number: '',
    exam_2_number: '',
    graduation_date_for_id: new Date().getFullYear(),
    stop_reason: 0,
    suspend_reason: '',
    suspend_comment: '',
    graduate_university: '',
    grade: 0,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  const canEditStudents = hasPermission(PERMISSIONS.EDIT_STUDENTS);

  // 验证函数
  const validatePhone = (phone: string): string | null => {
    if (!phone) return null;
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
    if (!phoneRegex.test(phone)) {
      return 'Invalid phone number format';
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return null;
  };

  const handleInputChange = (field: keyof StudentAllForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的验证错误
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 实时验证
    if (field === 'phone_number' || field === 'fathers_phone_number' || field === 'mothers_phone_number') {
      const error = validatePhone(value as string);
      if (error) setValidationErrors(prev => ({ ...prev, [field]: error }));
    } else if (field === 'email' || field === 'fathers_email' || field === 'mothers_email') {
      const error = validateEmail(value as string);
      if (error) setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const loadStudentInfo = async () => {
    if (!studentId) {
      setErrorMessage('Student ID is required');
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      const response = await getStudentEditInfo(Number(studentId));
      
      if (response.code === 200 && response.data) {
        const info = response.data as any;
        setStudentInfo(info);
        // staff 下拉（mentor / sales owner）
        const staffArr: Array<[number, string]> = info.staff_list || [];
        setStaffOptions(staffArr.map(([id, name]) => ({ id, name })));
        
        // 设置表单数据
        const s = info.student_data || {};
        setFormData(prev => ({
          ...prev,
          record_id: s.id,
          campus_id: s.campus_id,
          email: s.email || '',
          first_name: s.first_name || '',
          last_name: s.last_name || '',
          pinyin_first_name: s.pinyin_first_name || '',
          pinyin_last_name: s.pinyin_last_name || '',
          birthday: toDateInput(s.birthday),
          sales_pay_date: toDateInput(s.sales_pay_date),
          enrolment_date: toDateInput(s.enrolment_date),
          graduation_date: toDateInput(s.graduation_date),
          year_fee: s.year_fee ? String(s.year_fee) : '',
          gender: typeof s.gender === 'number' ? s.gender : -1,
          personal_id: s.personal_id || '',
          day_student: s.day_student ?? 0,
          active: s.active ?? 1,
          accounting_enabled: s.accounting_enabled ?? 0,
          mentor_id: s.mentor_id ?? 0,
          assigned_staff: s.assigned_staff ?? 0,
          english_name: s.english_name || '',
          nationality: s.nationality || '',
          phone_number: s.phone_number || s.phone_0 || '',
          address: s.address || '',
          current_school: s.current_school || '',
          current_grade: String(s.current_grade ?? s.grade ?? ''),
          hometown: s.hometown || '',
          fathers_name: s.fathers_name || '',
          fathers_phone_number: s.fathers_phone_number || '',
          fathers_email: s.fathers_email || '',
          fathers_occupation: s.fathers_occupation || '',
          fathers_employer: s.fathers_employer || '',
          mothers_name: s.mothers_name || '',
          mothers_phone_number: s.mothers_phone_number || s.phone_1 || '',
          mothers_email: s.mothers_email || '',
          mothers_occupation: s.mothers_occupation || '',
          mothers_employer: s.mothers_employer || '',
          personal_statement: s.personal_statement || '',
          special_note: s.special_note || '',
          year_fee_repayment_time_1: toDateInput(s.year_fee_repayment_time_1),
          year_fee_repayment_time_2: toDateInput(s.year_fee_repayment_time_2),
          year_fee_repayment_time_3: toDateInput(s.year_fee_repayment_time_3),
          exam_0_number: s.exam_0_number || '',
          exam_1_number: s.exam_1_number || '',
          exam_2_number: s.exam_2_number || '',
          graduation_date_for_id: s.graduation_date_for_id || (new Date().getFullYear()),
          stop_reason: s.stop_reason ?? 0,
          suspend_reason: s.suspend_reason ?? '',
          suspend_comment: s.suspend_comment ?? '',
          graduate_university: s.graduate_university ?? '',
          grade: typeof s.grade === 'number' ? s.grade : 0,
        }));

        // 初始化考试编辑缓存
        const exams = (info.exam_data || []) as Array<{ id: number; result: number | string }>;
        const initEdits: Record<number, string> = {};
        exams.forEach((e) => { initEdits[e.id] = String(e.result || ''); });
        setExamEdits(initEdits);
      } else {
        setErrorMessage(response.message || 'Failed to load student information');
        setShowError(true);
      }
    } catch (error) {
      console.error('加载学生信息失败:', error);
      setErrorMessage('Failed to load student information');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadCampusList = async () => {
    try {
      const response = await getAllCampus();
      if (response.status === 200) {
        setCampusList(response.data || []);
      }
    } catch (error) {
      console.error('获取校区列表失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证所有字段
    const phoneError = formData.phone_number ? validatePhone(formData.phone_number) : null;
    const parentPhoneError = formData.mothers_phone_number ? validatePhone(formData.mothers_phone_number) : null;
    const emailError = validateEmail(formData.email);
    
    const errors: Record<string, string | undefined> = {};
    const effectiveRecordId = Number(formData.record_id || (studentId ? Number(studentId) : 0));
    if (phoneError) errors.phone_number = phoneError;
    if (parentPhoneError) errors.mothers_phone_number = parentPhoneError;
    if (emailError) errors.email = emailError;
    if (!formData.first_name?.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name?.trim()) errors.last_name = 'Last name is required';
    if (!formData.email?.trim()) errors.email = errors.email || 'Email is required';
    if (!formData.campus_id || Number(formData.campus_id) <= 0) errors.campus_id = 'Campus is required';
    if (!effectiveRecordId || effectiveRecordId <= 0) errors.record_id = 'Invalid student id';
    
    setValidationErrors(errors);
    
    // 如果有错误，不提交
    if (Object.values(errors).some(error => error)) {
      return;
    }
    
    try {
      setSaving(true);
      const normalizedAssignedStaff = Math.max(0, Number(formData.assigned_staff ?? 0));
      const normalizedMentorId = Math.max(0, Number(formData.mentor_id ?? 0));
      const normalizedGrade = Math.max(0, Number(formData.grade || 0));
      const normalizedYearFee = Math.max(0, Number(formData.year_fee || 0));
      const normalizedCurrentGrade = String(formData.current_grade ?? '');
      const payload: StudentUpdatePayload = {
        // 根据最新Swagger规范构建payload
        active: String(formData.active ?? 1),
        address: formData.address || '',
        assigned_staff: normalizedAssignedStaff,
        birthday: toDateSeconds(formData.birthday) ?? 0,
        campus_id: formData.campus_id,
        cie_flag: Number((studentInfo as any)?.student_data?.cie_flag ?? 0),
        current_grade: normalizedCurrentGrade,
        current_school: formData.current_school || '',
        day_student: Number(formData.day_student ?? 0),
        email: formData.email,
        english_name: formData.english_name || '',
        enrolment_date: toDateSeconds(formData.enrolment_date) ?? 0,
        exam_0_number: formData.exam_0_number || '',
        exam_1_number: formData.exam_1_number || '',
        exam_2_number: formData.exam_2_number || '',
        fathers_email: formData.fathers_email || '',
        fathers_employer: formData.fathers_employer || '',
        fathers_name: formData.fathers_name || '',
        fathers_occupation: formData.fathers_occupation || '',
        fathers_phone_number: formData.fathers_phone_number || '',
        first_name: formData.first_name,
        gender: Number(formData.gender ?? 0),
        grade: normalizedGrade,
        graduation_date: toDateSeconds(formData.graduation_date) ?? 0,
        hometown: formData.hometown || '',
        last_name: formData.last_name,
        mentor_id: normalizedMentorId,
        mothers_email: formData.mothers_email || '',
        mothers_employer: formData.mothers_employer || '',
        mothers_name: formData.mothers_name || '',
        mothers_occupation: formData.mothers_occupation || '',
        mothers_phone_number: formData.mothers_phone_number || '',
        nationality: formData.nationality || '',
        personal_id: formData.personal_id || '',
        personal_statement: formData.personal_statement || '',
        phone_number: formData.phone_number || '',
        pinyin_first_name: formData.pinyin_first_name || '',
        pinyin_last_name: formData.pinyin_last_name || '',
        record_id: effectiveRecordId,
        sales_pay_date: toDateSeconds(formData.sales_pay_date) ?? 0,
        special_note: formData.special_note || '',
        year_fee: String(normalizedYearFee),
        year_fee_repayment_time_1: toDateSeconds(formData.year_fee_repayment_time_1) ?? 0,
        year_fee_repayment_time_2: toDateSeconds(formData.year_fee_repayment_time_2) ?? 0,
        year_fee_repayment_time_3: toDateSeconds(formData.year_fee_repayment_time_3) ?? 0,
      };
      
      const response = await updateStudentInfoV2(payload);
      
      if (response.code === 200) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/students');
        }, 2000);
      } else {
        setErrorMessage(response.message || 'Failed to update student information');
        setShowError(true);
      }
    } catch (error) {
      console.error('更新学生信息失败:', error);
      setErrorMessage('Failed to update student information');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!formData.record_id) return;
    try {
      setResetLoading('pwd');
      const res = await resetStudentPassword(formData.record_id);
      if (res.code === 200) {
        const pass = (res.data as any)?.new_pass || '';
        setNewPassword(String(pass));
        setShowPwdModal(true);
      } else {
        setErrorMessage(res.message || 'Reset password failed');
        setShowError(true);
      }
    } catch (e) {
      setErrorMessage('Reset password failed');
      setShowError(true);
    } finally {
      setResetLoading(null);
    }
  };

  const onResetStudentId = async () => {
    if (!formData.record_id) return;
    try {
      setResetLoading('sid');
      const res = await resetStudentId(formData.record_id);
      if (res.code === 200) {
        setShowSuccess(true);
        // 3秒后自动隐藏成功提示
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        // 可选：重新加载信息（如果需要看到更新）
        await loadStudentInfo();
      } else {
        setErrorMessage(res.message || 'Reset student id failed');
        setShowError(true);
      }
    } catch (e) {
      setErrorMessage('Reset student id failed');
      setShowError(true);
    } finally {
      setResetLoading(null);
    }
  };

  const saveExamResult = async (examRecordId: number) => {
    if (!studentId) return;
    try {
      setExamLoadingRow(examRecordId);
      const result = examEdits[examRecordId] ? Number(examEdits[examRecordId]) : "";
      const grade = gradeEdits[examRecordId] || "";
      const second = secondEdits[examRecordId] || "";
      const resp = await updateStudentExamResult({ 
        record_id: examRecordId, 
        student_id: Number(studentId),
        result,     // 分数
        grade,      // 等第
        second      // 总分
      });
      if (resp.code !== 200) {
        setErrorMessage(resp.message || 'Update exam result failed');
        setShowError(true);
      } else {
        setShowSuccess(true);
        // 3秒后自动隐藏成功提示
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (e) {
      setErrorMessage('Update exam result failed');
      setShowError(true);
    } finally {
      setExamLoadingRow(null);
    }
  };

  useEffect(() => {
    loadStudentInfo();
    loadCampusList();
  }, [studentId]);

  if (!canEditStudents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit student information</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Student</h1>
              {studentInfo && (
                <p className="text-gray-600 mt-2">
                  {studentInfo.student_data.last_name}{studentInfo.student_data.first_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowResetIdConfirm(true)}
                disabled={resetLoading === 'sid' || saving}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${resetLoading === 'sid' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {resetLoading === 'sid' ? 'Resetting ID...' : 'Reset Student ID'}
              </button>
              <button
                type="button"
                onClick={() => setShowResetPwdConfirm(true)}
                disabled={resetLoading === 'pwd' || saving}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${resetLoading === 'pwd' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {resetLoading === 'pwd' ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>

        {/* 成功提示 */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Student information updated successfully!
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="inline-flex text-green-400 hover:text-green-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {showError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowError(false)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑表单 */}
        {studentInfo && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Student Information</h2>
              
              {/* Tab 导航 */}
              <div className="mt-4">
                <nav className="flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    个人资料
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('exam')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'exam'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    考试信息
                  </button>
                </nav>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 个人资料 Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID 只读 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    value={(studentInfo as any)?.student_data?.student_long_id || studentInfo?.student_data?.id || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Given name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.first_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.last_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pinyin given name</label>
                  <input
                    type="text"
                    value={formData.pinyin_first_name}
                    onChange={(e) => handleInputChange('pinyin_first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pinyin family name</label>
                  <input
                    type="text"
                    value={formData.pinyin_last_name}
                    onChange={(e) => handleInputChange('pinyin_last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Pay Date</label>
                  <input
                    type="date"
                    value={formData.sales_pay_date}
                    onChange={(e) => handleInputChange('sales_pay_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrolment date</label>
                  <input
                    type="date"
                    value={formData.enrolment_date}
                    onChange={(e) => handleInputChange('enrolment_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation date</label>
                  <input
                    type="date"
                    value={formData.graduation_date}
                    onChange={(e) => handleInputChange('graduation_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year fee</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.year_fee}
                    onChange={(e) => handleInputChange('year_fee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Male</option>
                    <option value={1}>Female</option>
                    <option value={-1}>Not set</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    title="Please enter a valid email address (e.g., user@example.com)"
                    placeholder="e.g., user@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal ID</label>
                  <input
                    type="text"
                    value={formData.personal_id}
                    onChange={(e) => handleInputChange('personal_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 学籍状态 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Student</label>
                  <select
                    value={formData.day_student}
                    onChange={(e) => handleInputChange('day_student', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <select
                    value={formData.active}
                    onChange={(e) => handleInputChange('active', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accounting enabled</label>
                  <select
                    value={formData.accounting_enabled}
                    onChange={(e) => handleInputChange('accounting_enabled', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Enabled</option>
                    <option value={0}>Disabled</option>
                  </select>
                </div>
              </div>

              {/* 校区和负责人 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campus <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.campus_id}
                    onChange={(e) => handleInputChange('campus_id', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.campus_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select a campus</option>
                    {campusList.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}{campus.code ? `-${campus.code}` : ''}
                      </option>
                    ))}
                  </select>
                  {validationErrors.campus_id && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.campus_id}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                  <select
                    value={formData.mentor_id}
                    onChange={(e) => handleInputChange('mentor_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>请选择导师</option>
                    {staffOptions.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Owner</label>
                  <select
                    value={formData.assigned_staff}
                    onChange={(e) => handleInputChange('assigned_staff', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>请选择 Sales Owner</option>
                    {staffOptions.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 考试编号 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UCI number</label>
                  <input 
                    type="text" 
                    value={formData.exam_0_number} 
                    onChange={(e)=>handleInputChange('exam_0_number', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CIE Center Number</label>
                  <input 
                    type="text" 
                    value={formData.exam_1_number} 
                    onChange={(e)=>handleInputChange('exam_1_number', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CIE Candidate number</label>
                  <input 
                    type="text" 
                    value={formData.exam_2_number} 
                    onChange={(e)=>handleInputChange('exam_2_number', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              {/* 联系与个人信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English name</label>
                  <input
                    type="text"
                    value={formData.english_name}
                    onChange={(e) => handleInputChange('english_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    pattern="^[\+]?[- 0-9()]{10,20}$"
                    title="Please enter a valid phone number (10-20 digits)"
                    placeholder="e.g., +86 138 0000 0000 or 13800000000"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.phone_number 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone_number}</p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current School</label>
                  <input
                    type="text"
                    value={formData.current_school}
                    onChange={(e) => handleInputChange('current_school', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Grade</label>
                  <input
                    type="text"
                    value={formData.current_grade}
                    onChange={(e) => handleInputChange('current_grade', e.target.value)}
                    placeholder="e.g., Grade 10, Year 11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
                  <input 
                    type="text" 
                    value={formData.hometown} 
                    onChange={(e)=>handleInputChange('hometown', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              {/* 家庭信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                  <input 
                    type="text" 
                    value={formData.fathers_name} 
                    onChange={(e)=>handleInputChange('fathers_name', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.fathers_phone_number} 
                    onChange={(e)=>handleInputChange('fathers_phone_number', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Email</label>
                  <input 
                    type="email" 
                    value={formData.fathers_email} 
                    onChange={(e)=>handleInputChange('fathers_email', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Occupation</label>
                  <input 
                    type="text" 
                    value={formData.fathers_occupation} 
                    onChange={(e)=>handleInputChange('fathers_occupation', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Employer</label>
                  <input 
                    type="text" 
                    value={formData.fathers_employer} 
                    onChange={(e)=>handleInputChange('fathers_employer', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                  <input 
                    type="text" 
                    value={formData.mothers_name} 
                    onChange={(e)=>handleInputChange('mothers_name', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.mothers_phone_number} 
                    onChange={(e)=>handleInputChange('mothers_phone_number', e.target.value)} 
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.mothers_phone_number 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.mothers_phone_number && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.mothers_phone_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Email</label>
                  <input 
                    type="email" 
                    value={formData.mothers_email} 
                    onChange={(e)=>handleInputChange('mothers_email', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Occupation</label>
                  <input 
                    type="text" 
                    value={formData.mothers_occupation} 
                    onChange={(e)=>handleInputChange('mothers_occupation', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Employer</label>
                  <input 
                    type="text" 
                    value={formData.mothers_employer} 
                    onChange={(e)=>handleInputChange('mothers_employer', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              {/* 备注与陈述 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal Statement</label>
                  <textarea
                    value={formData.personal_statement}
                    onChange={(e)=>handleInputChange('personal_statement', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Note</label>
                  <textarea
                    value={formData.special_note}
                    onChange={(e)=>handleInputChange('special_note', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 学费提醒日期 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year fee reminder time 1</label>
                  <input 
                    type="date" 
                    value={formData.year_fee_repayment_time_1} 
                    onChange={(e)=>handleInputChange('year_fee_repayment_time_1', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year fee reminder time 2</label>
                  <input 
                    type="date" 
                    value={formData.year_fee_repayment_time_2} 
                    onChange={(e)=>handleInputChange('year_fee_repayment_time_2', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year fee reminder time 3</label>
                  <input 
                    type="date" 
                    value={formData.year_fee_repayment_time_3} 
                    onChange={(e)=>handleInputChange('year_fee_repayment_time_3', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              {/* 个人资料操作按钮 */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Link
                  href="/students"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
                </div>
              )}

              {/* 考试信息 Tab */}
              {activeTab === 'exam' && (
                <div className="space-y-6">
                  {/* 考试成绩编辑 */}
                  {Array.isArray((studentInfo as any)?.exam_data) && (studentInfo as any).exam_data.length > 0 ? (
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-4">Exam Results</h3>
                      <div className="space-y-6">
                        {/* 校内考试（exam_type 3, 4） */}
                        <div className="border-b border-gray-200 pb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">校内考试</h4>
                          <div className="space-y-2">
                            {(studentInfo as any).exam_data
                              .filter((exam: any) => exam.exam_type === 3 || exam.exam_type === 4)
                              .map((exam: any) => (
                                <div key={exam.id} className="flex items-center gap-2">
                                  <div className="flex-1 text-sm text-gray-700">
                                    {exam.exam_name || 'Exam'}
                                  </div>
                                  <input
                                    type="number"
                                    value={examEdits[exam.id] ?? exam.result ?? ''}
                                    onChange={(e) => setExamEdits(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="分数"
                                  />
                                  <span className="text-gray-400 text-sm">/</span>
                                  <input
                                    type="text"
                                    value={secondEdits[exam.id] ?? exam.second ?? ''}
                                    onChange={(e) => setSecondEdits(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="总分"
                                  />
                                  <select
                                    value={gradeEdits[exam.id] ?? exam.grade ?? ''}
                                    onChange={(e) => setGradeEdits(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  >
                                    <option value="">请选择等第</option>
                                    {gradeOptions.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => saveExamResult(exam.id)}
                                    disabled={examLoadingRow === exam.id}
                                    className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${examLoadingRow === exam.id ? 'bg-blue-200 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                  >
                                    {examLoadingRow === exam.id ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              ))}
                            {(studentInfo as any).exam_data.filter((exam: any) => exam.exam_type === 3 || exam.exam_type === 4).length === 0 && (
                              <p className="text-sm text-gray-500 py-2">暂无校内考试</p>
                            )}
                          </div>
                        </div>

                        {/* 大考（exam_type 0, 1, 2） */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">大考 (Major Exams)</h4>
                          <div className="space-y-2">
                            {(studentInfo as any).exam_data
                              .filter((exam: any) => exam.exam_type === 0 || exam.exam_type === 1 || exam.exam_type === 2)
                              .map((exam: any) => (
                                <div key={exam.id} className="flex items-center gap-2">
                                  <div className="flex-1 text-sm text-gray-700">
                                    {exam.exam_name || 'Exam'}
                                  </div>
                                  <input
                                    type="number"
                                    value={examEdits[exam.id] ?? exam.result ?? ''}
                                    onChange={(e) => setExamEdits(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="分数"
                                  />
                                  <span className="text-gray-400 text-sm">/</span>
                                  <input
                                    type="text"
                                    value={secondEdits[exam.id] ?? exam.second ?? ''}
                                    onChange={(e) => setSecondEdits(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="总分"
                                  />
                                  <select
                                    value={gradeEdits[exam.id] ?? exam.grade ?? ''}
                                    onChange={(e) => setGradeEdits(prev => ({ ...prev, [exam.id]: e.target.value }))}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  >
                                    <option value="">请选择等第</option>
                                    {gradeOptions.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => saveExamResult(exam.id)}
                                    disabled={examLoadingRow === exam.id}
                                    className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${examLoadingRow === exam.id ? 'bg-blue-200 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                  >
                                    {examLoadingRow === exam.id ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              ))}
                            {(studentInfo as any).exam_data.filter((exam: any) => exam.exam_type === 0 || exam.exam_type === 1 || exam.exam_type === 2).length === 0 && (
                              <p className="text-sm text-gray-500 py-2">暂无大考</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No exam records found for this student.</p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* 密码重置模态框 */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">New Password</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">The new password for this student is:</p>
              <div className="p-3 bg-gray-100 rounded border font-mono text-sm">
                {newPassword}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowPwdModal(false);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码确认对话框 */}
      {showResetPwdConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to reset the password for{' '}
              <span className="font-medium">
                {studentInfo?.student_data?.last_name}{studentInfo?.student_data?.first_name}
              </span>
              ? This will generate a new random password and the student will need to use it to log in.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetPwdConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetPwdConfirm(false);
                  onResetPassword();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重置学生ID确认对话框 */}
      {showResetIdConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Reset Student ID</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to reset the student ID for{' '}
              <span className="font-medium">
                {studentInfo?.student_data?.last_name}{studentInfo?.student_data?.first_name}
              </span>
              ? This will generate a new student ID and may affect existing records.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetIdConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetIdConfirm(false);
                  onResetStudentId();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Reset Student ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
