'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStaffList, 
  addStaff, 
  editStaff, 
  deleteStaff, 
  disableStaffAccount,
  type Staff,
  type StaffFormData 
} from '@/services/auth';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DropdownPortal from '@/components/DropdownPortal';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function StaffPage() {
  const { hasPermission } = useAuth();
  const now = new Date();
  const monthsSince1970 = (now.getFullYear() - 1970) * 12 + now.getMonth();
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    phone_0: '',
    phone_1: '',
    email: '',
    campus_id: 0
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    phone_0?: string;
    phone_1?: string;
    email?: string;
  }>({});

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // 分页相关 state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每页10条

  // const canView = true; // 临时禁用权限检查用于测试
  const canView = hasPermission(PERMISSIONS.VIEW_STAFF) || hasPermission(PERMISSIONS.FINANCE) || hasPermission(PERMISSIONS.SALES_PERSON);
  // 权限检查 - 按功能分类
  const canViewStaffDetails = hasPermission(PERMISSIONS.VIEW_STAFF); // 查看类功能：Lesson Overview, Staff Info, Staff Schedule, Default Availability
  const canEditStaff = hasPermission(PERMISSIONS.EDIT_STAFF);        // 编辑类功能：Add Staff, Staff Edit, Disable Account
  const canDeleteStaff = hasPermission(PERMISSIONS.DELETE_STAFF);    // 删除功能：Delete Account
  
  // 检查是否有任何操作权限（决定是否显示下拉菜单按钮）
  const hasAnyActionPermission = canViewStaffDetails || canEditStaff || canDeleteStaff;

  // 验证函数
  const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // 空值在可选字段中是允许的
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
    if (!phoneRegex.test(phone)) {
      return 'Invalid phone number format';
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return null;
  };

  // 处理输入变化并验证
  const handleInputChange = (field: keyof StaffFormData, value: string | number) => {
    setFormData({...formData, [field]: value});
    
    // 清除之前的错误
    const newErrors = {...validationErrors};
    
    // 验证特定字段
    if (field === 'phone_0') {
      const error = validatePhone(value as string);
      if (error) {
        newErrors.phone_0 = error;
      } else {
        delete newErrors.phone_0;
      }
    } else if (field === 'phone_1') {
      const error = validatePhone(value as string);
      if (error) {
        newErrors.phone_1 = error;
      } else {
        delete newErrors.phone_1;
      }
    } else if (field === 'email') {
      const error = validateEmail(value as string);
      if (error) {
        newErrors.email = error;
      } else {
        delete newErrors.email;
      }
    }
    
    setValidationErrors(newErrors);
  };

  useEffect(() => {
    if (canView) {
      loadStaffList();
    }
  }, [canView]);



  const loadStaffList = async () => {
    try {
      setLoading(true);
      const response = await getStaffList();
      if (response.code === 200 && response.data) {
        setStaffList(response.data as Staff[]);
      } else {
        console.error('获取员工列表失败:', response.message);
      }
    } catch (error) {
      console.error('加载员工列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone_0: '',
      phone_1: '',
      email: '',
      campus_id: 0
    });
    setValidationErrors({});
    setShowAddModal(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    // 暂时简化编辑功能，因为API返回的数据结构与表单不匹配
    setFormData({
      first_name: '',
      last_name: '',
      phone_0: '',
      phone_1: '',
      email: staff.email || '',
      campus_id: 0
    });
    setShowEditModal(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowDeleteModal(true);
  };

  const handleDisableAccount = async (staffId: number) => {
    try {
      const response = await disableStaffAccount(staffId);
      if (response.code === 200) {
        console.log('禁用账户成功');
        loadStaffList();
      } else {
        console.error('禁用账户失败:', response.message);
      }
    } catch (error) {
      console.error('禁用账户失败:', error);
    }
  };

  const toggleRowExpansion = (staffId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(staffId)) {
      newExpanded.delete(staffId);
    } else {
      // 关闭其他打开的菜单，确保只有一个dropdown打开
      newExpanded.clear();
      newExpanded.add(staffId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查必填字段
    if (!formData.first_name || !formData.last_name || !formData.phone_0 || !formData.email || formData.campus_id === 0) {
      alert('Please fill in all required fields');
      return;
    }

    // 检查验证错误
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) {
      alert('Please fix the validation errors before submitting');
      return;
    }

    // 进行最终验证
    const phone0Error = validatePhone(formData.phone_0);
    const phone1Error = formData.phone_1 ? validatePhone(formData.phone_1) : null;
    const emailError = validateEmail(formData.email);

    if (phone0Error || phone1Error || emailError) {
      setValidationErrors({
        ...(phone0Error && { phone_0: phone0Error }),
        ...(phone1Error && { phone_1: phone1Error }),
        ...(emailError && { email: emailError })
      });
      alert('Please fix the validation errors before submitting');
      return;
    }

    try {
      if (showAddModal) {
        const response = await addStaff(formData);
        if (response.code === 200) {
          console.log('Add staff successful');
          setShowAddModal(false);
          // 重置表单数据
          setFormData({
            first_name: '',
            last_name: '',
            phone_0: '',
            phone_1: '',
            email: '',
            campus_id: 0
          });
          setValidationErrors({});
          loadStaffList();
        } else {
          console.error('Add staff failed:', response.message);
          alert('Failed to add staff: ' + response.message);
        }
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Failed to add staff');
    }
  };

  const confirmDelete = async () => {
    if (selectedStaff) {
      try {
        const response = await deleteStaff(selectedStaff.staff_id);
        if (response.code === 200) {
          console.log('删除员工成功');
          setShowDeleteModal(false);
          loadStaffList();
        } else {
          console.error('删除员工失败:', response.message);
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.campus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页逻辑
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view the staff management page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 touch-pan-x touch-pan-y">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, groups, or campus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {canEditStaff && (
              <button
                onClick={handleAddStaff}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Staff
              </button>
            )}
          </div>
        </div>

        {/* 员工列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto relative">
                              <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">
                      Groups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">
                      Campus
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStaff.map((staff) => (
                    <tr key={staff.staff_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap w-1/4 sm:w-auto">
                        <div className="text-sm font-medium text-gray-900 truncate">{staff.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/4 sm:w-auto">
                        <div className="text-sm text-gray-900 truncate">{staff.group_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/4 sm:w-auto">
                        <div className="text-sm text-gray-900 truncate">{staff.campus}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-16 sm:w-20">
                        <div className="relative inline-block">
                          {/* Dropdown 按钮 - 只有有权限时才显示 */}
                          {hasAnyActionPermission ? (
                            <button
                              ref={(el) => {
                                if (el) {
                                  buttonRefs.current.set(staff.staff_id, el);
                                } else {
                                  buttonRefs.current.delete(staff.staff_id);
                                }
                              }}
                              onClick={() => toggleRowExpansion(staff.staff_id)}
                              className="action-toggle flex items-center justify-center w-8 h-8 sm:w-8 sm:h-8 md:w-8 md:h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
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
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Portal下拉菜单 - 渲染在表格外部，避免被裁剪 */}
                  {currentStaff.map((staff) => (
                    <DropdownPortal
                      key={`dropdown-${staff.staff_id}`}
                      isOpen={hasAnyActionPermission && expandedRows.has(staff.staff_id)}
                      onClose={() => setExpandedRows(new Set())}
                      triggerElement={buttonRefs.current.get(staff.staff_id) || null}
                      className="w-48 sm:w-52 md:w-48 min-w-0 max-sm:w-44"
                    >
                      {/* Lesson overview - 需要 view_staff 权限 */}
                      {canViewStaffDetails && (
                        <Link
                          href={`/lesson-overview?userId=${staff.staff_id}&monthId=${monthsSince1970}`}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Lesson Overview
                        </Link>
                      )}

                      {/* Staff info - 需要 view_staff 权限 */}
                      {canViewStaffDetails && (
                        <Link href={`/staff/user?userId=${staff.staff_id}`} legacyBehavior>
                          <a
                            className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center gap-3 transition-colors touch-manipulation"
                            onClick={() => setExpandedRows(new Set())}
                          >
                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Staff Info
                          </a>
                        </Link>
                      )}

                      {/* Staff edit - 需要 edit_staff 权限 */}
                      {canEditStaff && (
                        <button
                          onClick={() => {
                            setExpandedRows(new Set());
                            // TODO: 实现员工编辑功能
                          }}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Staff Edit
                        </button>
                      )}

                      {/* Staff schedule - 需要 view_staff 权限 */}
                      {canViewStaffDetails && (
                        <Link href={`/schedule?staffId=${staff.staff_id}`} legacyBehavior>
                          <a
                            className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors touch-manipulation"
                            onClick={() => setExpandedRows(new Set())}
                          >
                            <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Staff Schedule
                          </a>
                        </Link>
                      )}

                      {/* Default availability - 需要 view_staff 权限 */}
                      {canViewStaffDetails && (
                        <button
                          onClick={() => {
                            setExpandedRows(new Set());
                            // TODO: 实现默认可用性功能
                          }}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <svg className="h-4 w-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Default Availability
                        </button>
                      )}

                      {/* 分隔线 - 只有当有管理权限时才显示 */}
                      {(canViewStaffDetails && (canEditStaff || canDeleteStaff)) && (
                        <div className="border-t border-gray-200 my-2"></div>
                      )}

                      {/* Disable account - 需要 edit_staff 权限 */}
                      {canEditStaff && (
                        <button
                          onClick={() => {
                            handleDisableAccount(staff.staff_id);
                            setExpandedRows(new Set());
                          }}
                          className="w-full px-4 py-3 sm:py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 flex items-center gap-3 transition-colors touch-manipulation"
                        >
                          <LockClosedIcon className="h-4 w-4 text-yellow-500" />
                          Disable Account
                        </button>
                      )}

                      {/* Delete account - 需要 delete_staff 权限 */}
                      {canDeleteStaff && (
                        <button
                          onClick={() => {
                            handleDeleteStaff(staff);
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
                </tbody>
              </table>
              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Data</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No matching staff members found' : 'No staff members have been added yet'}
                  </p>
                </div>
              )}
              {/* 分页按钮区域 */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      显示第 {startIndex + 1}-{Math.min(endIndex, filteredStaff.length)} 条，共 {filteredStaff.length} 条
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            size="sm"
                            variant={currentPage === page ? 'primary' : 'outline'}
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
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
            </div>
          )}
        </div>
      </div>

      {/* 添加模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => {
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
                  Add Staff
                </h3>
                                 <form onSubmit={handleSubmit} className="space-y-4">
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
                       Phone number 1 <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="tel"
                       required
                       pattern="^[\+]?[0-9\s\-\(\)]{10,20}$"
                       title="Please enter a valid phone number (10-20 digits, may include +, -, (), spaces)"
                       placeholder="e.g., +86 138 0000 0000 or 13800000000"
                       value={formData.phone_0}
                       onChange={(e) => handleInputChange('phone_0', e.target.value)}
                       className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                         validationErrors.phone_0 
                           ? 'border-red-300 focus:ring-red-500' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}
                     />
                     {validationErrors.phone_0 && (
                       <p className="mt-1 text-sm text-red-600">{validationErrors.phone_0}</p>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Phone number 2
                     </label>
                     <input
                       type="tel"
                       pattern="^[\+]?[0-9\s\-\(\)]{10,20}$"
                       title="Please enter a valid phone number (10-20 digits, may include +, -, (), spaces)"
                       placeholder="e.g., +86 138 0000 0000 or 13800000000"
                       value={formData.phone_1}
                       onChange={(e) => handleInputChange('phone_1', e.target.value)}
                       className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                         validationErrors.phone_1 
                           ? 'border-red-300 focus:ring-red-500' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}
                     />
                     {validationErrors.phone_1 && (
                       <p className="mt-1 text-sm text-red-600">{validationErrors.phone_1}</p>
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
                       Campus <span className="text-red-500">*</span>
                     </label>
                     <select
                       required
                       value={formData.campus_id}
                       onChange={(e) => handleInputChange('campus_id', Number(e.target.value))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     >
                       <option value="">Select a campus</option>
                       <option value={1}>浦东华曜-P</option>
                       <option value={2}>Campus 2</option>
                       <option value={3}>Campus 3</option>
                       <option value={4}>Campus 4</option>
                       <option value={5}>Campus 5</option>
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
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Confirm Delete
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete staff member <span className="font-medium">{selectedStaff.name}</span>?
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 