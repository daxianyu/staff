'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getClassList, 
  addClass,
  getAllCampus,
  type ClassItem,
  type AddClassParams,
  type ClassListParams,
  type Campus
} from '@/services/auth';
import { 
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function ClassesPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [campusList, setCampusList] = useState<Campus[]>([]);
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

  const [formData, setFormData] = useState<AddClassParams>({
    name: '',
    description: '',
    teacher_id: undefined,
    campus_id: undefined,
    start_date: '',
    end_date: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const canManageClasses = hasPermission(PERMISSIONS.EDIT_CLASSES); // 使用正确的classes权限

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
        // 后端没有返回分页元数据，我们需要根据返回的数据估算
        const currentPageClasses = response.data.list.length;
        setTotalItems(currentPageClasses); // 暂时设为当前页数据量
        setTotalPages(currentPageClasses === pageSize ? Math.max(currentPage + 1, 2) : currentPage); // 估算总页数
        if (page !== undefined) {
          setCurrentPage(page);
        }
      } else {
        setErrorMessage(response.message || 'Failed to load classes');
        setShowError(true);
      }
    } catch (error) {
      console.error('加载班级列表失败:', error);
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

  const handleInputChange = (field: keyof AddClassParams, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
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

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setAddLoading(true);
      const response = await addClass(formData);
      
      if (response.code === 200) {
        setShowSuccess(true);
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          teacher_id: undefined,
          campus_id: undefined,
          start_date: '',
          end_date: '',
        });
        setValidationErrors({});
        await loadClasses(); // Reload the list
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(response.message || 'Failed to add class');
        setShowError(true);
      }
    } catch (error) {
      console.error('添加班级失败:', error);
      setErrorMessage('Failed to add class');
      setShowError(true);
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    loadCampusList();
  }, []);

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
              <option value={0}>All Classes</option>
              <option value={1}>Active Only</option>
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
                      Class Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lessons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {classItem.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {classItem.student_num}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {classItem.subject_num}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {classItem.lesson}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {classItem.settings || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.active === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {classItem.active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          
          {/* Pagination */}
          {classes.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {currentPage} ({classes.length} items on this page)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={classes.length < pageSize}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
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
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Add New Class</h3>
            
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter class name"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter class description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campus
                </label>
                <select
                  value={formData.campus_id || ''}
                  onChange={(e) => handleInputChange('campus_id', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a campus</option>
                  {campusList.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}{campus.code ? ` - ${campus.code}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.end_date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.end_date}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      description: '',
                      teacher_id: undefined,
                      campus_id: undefined,
                      start_date: '',
                      end_date: '',
                    });
                    setValidationErrors({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'Adding...' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
