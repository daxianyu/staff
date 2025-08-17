'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getClassList, 
  addClass,
  getAllCampus,
  updateClassStatus,
  deleteClass,
  getAddClassSelectData,
  addNewClass,
  type ClassItem,
  type AddClassParams,
  type ClassListParams,
  type Campus,
  type UpdateClassStatusParams,
  type DeleteClassParams,
  type NewClassParams,
  type AddClassStudentInfo,
  type AddClassSelectData
} from '@/services/auth';
import { 
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  CalendarDaysIcon,
  NoSymbolIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function ClassesPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [studentsList, setStudentsList] = useState<AddClassStudentInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 分页和搜索状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisabled, setShowDisabled] = useState(0);
  
  // 下拉菜单和确认弹框状态
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'disable' | 'enable' | 'delete' | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState<AddClassParams>({
    name: '',
    description: '',
    teacher_id: undefined,
    campus_id: undefined,
    start_date: '',
    end_date: '',
  });

  // 新的Class表单数据
  const [newClassData, setNewClassData] = useState<{
    class_name: string;
    campus_id?: number;
    selectedStudents: number[];
  }>({
    class_name: '',
    campus_id: undefined,
    selectedStudents: [],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const canManageClasses = hasPermission(PERMISSIONS.EDIT_CLASSES); // 使用正确的classes权限
  const canDeleteClasses = hasPermission(PERMISSIONS.DELETE_CLASSES); // 删除权限

  const loadClasses = async (page?: number, search?: string, showDisable?: number, newPageSize?: number) => {
    try {
      setLoading(true);
      const params: ClassListParams = {
        page: page !== undefined ? page : currentPage, // 后端页码从1开始
        page_size: newPageSize !== undefined ? newPageSize : pageSize,
        search: search !== undefined ? search : searchQuery,
        show_disable: showDisable !== undefined ? showDisable : showDisabled,
      };
      
      const response = await getClassList(params);
      if (response.status === 200) {
        setClasses(response.data.list);
        setTotalItems(response.data.total);
        setTotalPages(Math.ceil(response.data.total / (newPageSize !== undefined ? newPageSize : pageSize)));
        if (page !== undefined) {
          setCurrentPage(page);
        }
      } else {
        setErrorMessage(response.message || 'Failed to load classes');
        setShowError(true);
      }
    } catch (error) {
      console.error('加载Class列表失败:', error);
      setErrorMessage('Failed to load classes');
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

  const loadAddClassData = async () => {
    try {
      const response = await getAddClassSelectData();
      if (response.code === 200 && response.data) {
        setStudentsList(response.data.student_info || []);
        setCampusList(response.data.campus_info || []);
      }
    } catch (error) {
      console.error('获取添加Class数据失败:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Class name is required';
    }
    
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = 'End date must be after start date';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateNewClassForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!newClassData.class_name?.trim()) {
      errors.class_name = 'Class名称必填';
    }
    
    if (!newClassData.campus_id) {
      errors.campus_id = '请选择校区';
    }

    if (newClassData.selectedStudents.length === 0) {
      errors.students = '请至少选择一个学生';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof AddClassParams, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNewClassInputChange = (field: string, value: string | number | number[]) => {
    setNewClassData(prev => ({ 
      ...prev, 
      [field]: field === 'campus_id' && value === '' ? undefined : value 
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStudentSelection = (studentId: number, checked: boolean) => {
    setNewClassData(prev => ({
      ...prev,
      selectedStudents: checked 
        ? [...prev.selectedStudents, studentId]
        : prev.selectedStudents.filter(id => id !== studentId)
    }));
    
    // Clear validation error
    if (validationErrors.students) {
      setValidationErrors(prev => ({ ...prev, students: '' }));
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    await loadClasses(1, query, showDisabled);
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await loadClasses(page, searchQuery, showDisabled);
  };

  const handleShowDisabledChange = async (value: number) => {
    setShowDisabled(value);
    setCurrentPage(1);
    await loadClasses(1, searchQuery, value);
  };

  // 处理操作确认
  const handleConfirmAction = (action: 'disable' | 'enable' | 'delete', classItem: ClassItem) => {
    setSelectedClass(classItem);
    setConfirmAction(action);
    setShowConfirmModal(true);
    setOpenDropdown(null);
  };

  // 执行Class状态更新
  const handleUpdateStatus = async () => {
    if (!selectedClass || !confirmAction) return;

    try {
      setActionLoading(true);
      const params: UpdateClassStatusParams = {
        record_id: selectedClass.id,
        status: confirmAction === 'enable' ? 1 : 0
      };

      const response = await updateClassStatus(params);
      
      if (response.code === 200) {
        setShowSuccess(true);
        setShowConfirmModal(false);
        await loadClasses(); // 重新加载列表
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(response.message || `${confirmAction === 'enable' ? '启用' : '禁用'}Class失败`);
        setShowError(true);
      }
    } catch (error) {
      console.error('更新Class状态失败:', error);
      setErrorMessage(`${confirmAction === 'enable' ? '启用' : '禁用'}Class失败`);
      setShowError(true);
    } finally {
      setActionLoading(false);
    }
  };

  // 执行Class删除
  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      setActionLoading(true);
      const params: DeleteClassParams = {
        record_id: selectedClass.id
      };

      const response = await deleteClass(params);
      
      if (response.code === 200) {
        setShowSuccess(true);
        setShowConfirmModal(false);
        await loadClasses(); // 重新加载列表
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(response.message || '删除Class失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('删除Class失败:', error);
      setErrorMessage('删除Class失败');
      setShowError(true);
    } finally {
      setActionLoading(false);
    }
  };

  // 执行确认操作
  const executeConfirmAction = async () => {
    if (confirmAction === 'delete') {
      await handleDeleteClass();
    } else if (confirmAction === 'disable' || confirmAction === 'enable') {
      await handleUpdateStatus();
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNewClassForm()) {
      return;
    }

    try {
      setAddLoading(true);
      const params: NewClassParams = {
        class_name: newClassData.class_name,
        campus_id: newClassData.campus_id!,
        students: newClassData.selectedStudents.join(',') // 将学生ID数组转为逗号分隔的字符串
      };

      const response = await addNewClass(params);
      
      if (response.code === 200) {
        setShowSuccess(true);
        setShowAddModal(false);
        setNewClassData({
          class_name: '',
          campus_id: undefined,
          selectedStudents: [],
        });
        setValidationErrors({});
        await loadClasses(); // Reload the list
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(response.message || '添加Class失败');
        setShowError(true);
      }
    } catch (error) {
      console.error('添加Class失败:', error);
      setErrorMessage('添加Class失败');
      setShowError(true);
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    loadCampusList();
  }, []);

  // 当打开添加弹框时加载数据
  useEffect(() => {
    if (showAddModal) {
      loadAddClassData();
    }
  }, [showAddModal]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // 处理下拉菜单位置
  useEffect(() => {
    if (openDropdown !== null) {
      // 延迟执行，确保DOM元素已经渲染
      const timer = setTimeout(() => {
        const dropdownElement = document.querySelector(`[data-dropdown-id="${openDropdown}"]`) as HTMLElement;
        const triggerButton = document.querySelector(`[data-dropdown-trigger="${openDropdown}"]`) as HTMLElement;
        
        if (dropdownElement && triggerButton) {
          const buttonRect = triggerButton.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // 计算菜单位置
          let left = buttonRect.right - 192; // 192px = w-48 (12rem)
          let top = buttonRect.bottom + 4; // 4px margin
          
          // 确保不超出右边界
          if (left + 192 > viewportWidth) {
            left = viewportWidth - 192 - 8; // 8px padding from edge
          }
          
          // 检查下方空间
          const spaceBelow = viewportHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;
          
          // 如果下方空间不足，向上显示
          if (spaceBelow < 200 && spaceAbove > 200) {
            top = buttonRect.top - 4; // 向上偏移
            dropdownElement.style.bottom = 'auto';
            dropdownElement.style.top = `${top}px`;
          } else {
            dropdownElement.style.top = `${top}px`;
            dropdownElement.style.bottom = 'auto';
          }
          
          dropdownElement.style.left = `${left}px`;
          dropdownElement.style.right = 'auto';
        }
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [openDropdown]);

  if (!canManageClasses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage classes</p>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
              <p className="text-gray-600 mt-2">Manage your classes and schedules</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Class
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Search Button */}
            <button
              onClick={() => handleSearch(searchQuery)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Search
            </button>

            {/* Show Disabled Filter */}
            <select
              value={showDisabled}
              onChange={(e) => handleShowDisabledChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Active</option>
              <option value={1}>Disable</option>
            </select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => {
                const newPageSize = Number(e.target.value);
                setPageSize(newPageSize);
                setCurrentPage(1);
                loadClasses(1, searchQuery, showDisabled, newPageSize);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Class added successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
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

        {/* Classes List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Classes</h2>
              <p className="text-sm text-gray-500">
                Showing {classes.length} of {totalItems} results
              </p>
            </div>
          </div>
          
          {classes.length === 0 && !loading ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No classes found for your search' : 'No classes found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Get started by creating your first class.'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Class
                </button>
              )}
            </div>
          ) : classes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Lessons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Campus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-32 sm:w-48 lg:w-56 xl:w-64 text-sm font-medium text-gray-900 truncate" title={classItem.name}>
                          {classItem.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {classItem.id}
                        </div>
                      </td>
                      
                      {/* Subjects */}
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900 font-medium">
                          {classItem.subject_num}
                        </div>
                        <div className="text-xs text-gray-500">subjects</div>
                      </td>
                      
                      {/* Students */}
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900 font-medium">
                          {classItem.student_num}
                        </div>
                        <div className="text-xs text-gray-500">students</div>
                      </td>
                      
                      {/* Lessons */}
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900 font-medium">
                          {classItem.lesson}
                        </div>
                        <div className="text-xs text-gray-500">progress</div>
                      </td>
                      
                      {/* Campus */}
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          Campus {classItem.campus_name || '-'}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.active === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {classItem.active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* 主要操作按钮：Info 和 Edit */}
                          <button 
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                            onClick={() => router.push(`/class/view?id=${classItem.id}`)}
                            title="View Class Details"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                          </button>
                          <span className="text-gray-300">|</span>
                          <button 
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center"
                            onClick={() => router.push(`/class/edit?id=${classItem.id}`)}
                            title="Edit Class"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                          </button>
                          
                          {/* 下拉菜单按钮 */}
                          <div className="relative">
                            <button
                              className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100"
                              data-dropdown-trigger={classItem.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === classItem.id ? null : classItem.id);
                              }}
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </button>
                            
                            {/* 下拉菜单 */}
                            {openDropdown === classItem.id && (
                              <div 
                                className="fixed w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50" 
                                data-dropdown-id={classItem.id}
                                style={{
                                  left: 'auto',
                                  right: 'auto',
                                  top: 'auto',
                                  bottom: 'auto'
                                }}
                              >
                                <div className="py-1">
                                  {/* Schedule */}
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={() => {
                                      /* TODO: Implement schedule functionality */
                                      setOpenDropdown(null);
                                    }}
                                  >
                                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                                    Schedule
                                  </button>
                                  
                                  {/* Disable/Enable */}
                                  {canManageClasses && (
                                    <button
                                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                                        classItem.active === 1 
                                          ? 'text-orange-600' 
                                          : 'text-green-600'
                                      }`}
                                      onClick={() => handleConfirmAction(
                                        classItem.active === 1 ? 'disable' : 'enable', 
                                        classItem
                                      )}
                                    >
                                      {classItem.active === 1 ? (
                                        <>
                                          <NoSymbolIcon className="h-4 w-4 mr-2" />
                                          Disable
                                        </>
                                      ) : (
                                        <>
                                          <CheckIcon className="h-4 w-4 mr-2" />
                                          Enable
                                        </>
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Delete */}
                                  {canDeleteClasses && (
                                    <>
                                      <div className="border-t border-gray-100"></div>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                        onClick={() => handleConfirmAction('delete', classItem)}
                                      >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          
          {/* Pagination - 参考 students 页面的实现 */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  显示第 {((currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
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
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                          disabled={page === '...'}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                            page === currentPage
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : page === '...'
                              ? 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Add New Class</h3>
            
            <form onSubmit={handleAddClass} className="space-y-6">
              {/* Class名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClassData.class_name}
                  onChange={(e) => handleNewClassInputChange('class_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.class_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="输入Class名称"
                />
                {validationErrors.class_name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.class_name}</p>
                )}
              </div>

              {/* 校区选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  校区 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newClassData.campus_id || ''}
                  onChange={(e) => handleNewClassInputChange('campus_id', e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.campus_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">请选择校区</option>
                  {campusList.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}{campus.code ? ` - ${campus.code}` : ''}
                    </option>
                  ))}
                </select>
                {validationErrors.campus_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.campus_id}</p>
                )}
              </div>

              {/* 学生选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择学生 <span className="text-red-500">*</span>
                  {newClassData.selectedStudents.length > 0 && (
                    <span className="ml-2 text-sm text-blue-600">
                      已选择 {newClassData.selectedStudents.length} 名学生
                    </span>
                  )}
                </label>
                
                <div className={`border rounded-md max-h-60 overflow-y-auto ${
                  validationErrors.students ? 'border-red-300' : 'border-gray-300'
                }`}>
                  {studentsList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      加载学生列表中...
                    </div>
                  ) : (
                    <div className="p-2">
                      {studentsList.map((student) => (
                        <label key={student.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newClassData.selectedStudents.includes(student.id)}
                            onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {student.id}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {validationErrors.students && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.students}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewClassData({
                      class_name: '',
                      campus_id: undefined,
                      selectedStudents: [],
                    });
                    setValidationErrors({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? '添加中...' : '添加Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 确认操作弹框 */}
      {showConfirmModal && selectedClass && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                confirmAction === 'delete' 
                  ? 'bg-red-100' 
                  : confirmAction === 'disable' 
                    ? 'bg-orange-100' 
                    : 'bg-green-100'
              }`}>
                {confirmAction === 'delete' ? (
                  <TrashIcon className="h-5 w-5 text-red-600" />
                ) : confirmAction === 'disable' ? (
                  <NoSymbolIcon className="h-5 w-5 text-orange-600" />
                ) : (
                  <CheckIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {confirmAction === 'delete' 
                  ? '确认删除Class' 
                  : confirmAction === 'disable' 
                    ? '确认禁用Class' 
                    : '确认启用Class'
                }
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {confirmAction === 'delete' 
                  ? '您确定要删除以下Class吗？此操作不可恢复。' 
                  : confirmAction === 'disable' 
                    ? '您确定要禁用以下Class吗？' 
                    : '您确定要启用以下Class吗？'
                }
              </p>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="font-medium text-gray-900">{selectedClass.name}</p>
                <p className="text-sm text-gray-500">ID: {selectedClass.id}</p>
                <p className="text-sm text-gray-500">
                  当前状态: {selectedClass.active === 1 ? '启用' : '禁用'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedClass(null);
                  setConfirmAction(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : confirmAction === 'disable' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading ? '处理中...' : (
                  confirmAction === 'delete' 
                    ? '确认删除' 
                    : confirmAction === 'disable' 
                      ? '确认禁用' 
                      : '确认启用'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
