'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStudentEditInfo, 
  updateStudentInfo,
  getAllCampus,
  type StudentEditInfo,
  type StudentEditFormData,
  type Campus
} from '@/services/auth';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function StudentEditPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentEditInfo | null>(null);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<StudentEditFormData>({
    campus_id: 0,
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    parent_phone: '',
    record_id: 0,
    grade: ''
  });

  const [validationErrors, setValidationErrors] = useState<{
    phone?: string;
    parent_phone?: string;
    email?: string;
  }>({});

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

  const handleInputChange = (field: keyof StudentEditFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的验证错误
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 实时验证
    if (field === 'phone' || field === 'parent_phone') {
      const error = validatePhone(value as string);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    } else if (field === 'email') {
      const error = validateEmail(value as string);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
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
        const info = response.data as StudentEditInfo;
        setStudentInfo(info);
        
        // 设置表单数据
        setFormData({
          campus_id: info.student_info.campus_id,
          email: info.student_info.email,
          first_name: info.student_info.first_name,
          last_name: info.student_info.last_name,
          phone: info.student_info.phone_0 || '',
          parent_phone: info.student_info.phone_1 || '',
          record_id: info.student_info.id,
          grade: info.student_info.grade || ''
        });
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
    const phoneError = validatePhone(formData.phone);
    const parentPhoneError = validatePhone(formData.parent_phone);
    const emailError = validateEmail(formData.email);
    
    const errors = {
      phone: phoneError || undefined,
      parent_phone: parentPhoneError || undefined,
      email: emailError || undefined,
    };
    
    setValidationErrors(errors);
    
    // 如果有错误，不提交
    if (Object.values(errors).some(error => error)) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await updateStudentInfo(formData);
      
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和返回按钮 */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/students" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Students
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Student</h1>
          {studentInfo && (
            <p className="text-gray-600 mt-2">
              Editing: {studentInfo.student_info.first_name} {studentInfo.student_info.last_name}
            </p>
          )}
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
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="^[\+]?[0-9\s\-\(\)]{10,20}$"
                    title="Please enter a valid phone number (10-20 digits, may include +, -, (), spaces)"
                    placeholder="e.g., +86 138 0000 0000 or 13800000000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.phone 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent phone number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="^[\+]?[0-9\s\-\(\)]{10,20}$"
                    title="Please enter a valid phone number (10-20 digits, may include +, -, (), spaces)"
                    placeholder="e.g., +86 138 0000 0000 or 13800000000"
                    value={formData.parent_phone}
                    onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.parent_phone 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.parent_phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.parent_phone}</p>
                  )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    placeholder="e.g., Grade 10, Year 11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                  >
                    <option value="">Select a campus</option>
                    {campusList.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}{campus.code ? `-${campus.code}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 操作按钮 */}
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
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
