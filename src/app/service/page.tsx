'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import SearchableSelect from '@/components/SearchableSelect';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import {
  getServiceList,
  addService,
  editService,
  deleteService,
  getServiceEditInfo,
  addStudentToService,
  moveStudentToService,
  type ServiceItem,
  type AddServiceParams,
  type EditServiceParams,
  BookedInfo,
} from '@/services/auth';

// 将大列表表格定义在组件外部，保证组件类型稳定，避免父组件重渲染时跟着重绘
type ServiceTableProps = {
  items: ServiceItem[];
  studentsMap: Record<number, string[]>;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (service: ServiceItem) => void;
  onDelete: (service: ServiceItem) => void;
};

const ServiceTable = memo(function ServiceTable({
  items,
  studentsMap,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ServiceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-4/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
            <th className="w-1/8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduate Year</th>
            <th className="w-1/8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
            <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
            <th className="w-1/12 px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((service) => {
            const names = studentsMap[service.id];
            return (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900 truncate">{service.name}</div>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${service.gender === 0
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-pink-50 text-pink-700 border border-pink-200'
                      }`}
                  >
                    {service.gender === 0 ? 'Male' : 'Female'}
                  </span>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {service.size}
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${service.booked === 1
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                    >
                      {service.booked === 1 ? 'Booked' : 'Free'}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className="truncate">{service.locked === 1 ? 'Disabled' : 'Available'}</span>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <span className="truncate">{service.campus_name || '未分配'}</span>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${service.dormitory_type === 1
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                        }`}
                    >
                      {service.dormitory_type === 1 ? '宿舍' : '餐包'}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{service.graduate_year || '未设置'}</div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate">{service.mentor_name || '未分配'}</div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {names ? (
                      <div>
                        <div className="truncate text-xs">{names.join(', ')}</div>
                        <div className="text-xs text-gray-500">{names.length} 人</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">无</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(service)}
                        className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                        title="编辑服务"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(service)}
                        className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                        title="删除服务"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                    {!canEdit && !canDelete && <span className="text-xs text-gray-400">-</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default function ServicePage() {
  const { hasPermission } = useAuth();

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_DORMITORY);
  const canEdit = hasPermission(PERMISSIONS.EDIT_DORMITORY);
  const canDelete = hasPermission(PERMISSIONS.EDIT_DORMITORY);

  // 状态管理
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campusList, setCampusList] = useState<Array<{ id: number; name: string }>>([]);
  const [staffList, setStaffList] = useState<Array<{ id: number; name: string }>>([]);
  const [dormitoryStudents, setDormitoryStudents] = useState<Record<number, string[]>>({});

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 改为5，更容易触发分页

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // 编辑相关状态
  const [editServiceInfo, setEditServiceInfo] = useState<any>(null);
  const [bookedStudents, setBookedStudents] = useState<BookedInfo[]>([]);
  const [allStudents, setAllStudents] = useState<Array<{ id: number; name: string }>>([]);
  const [allDormitories, setAllDormitories] = useState<Array<{ id: number; name: string }>>([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showMoveStudentModal, setShowMoveStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<BookedInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'students'>('edit');

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    gender: 0,
    size: 1,
    price: 0,
    campus: 0,
    mentor_id: -1, // 改为-1，表示未分配
    is_dormitory: 1, // 1=宿舍, 0=餐包
    toilets: 0,
    start_time: Math.floor(Date.now() / 1000),
    end_time: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 一年后
    booked: 0,
    locked: 0,
    graduate_year: new Date().getFullYear(),
  });

  // 权限检查
  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
          <p className="text-gray-600">您没有查看宿舍管理的权限</p>
        </div>
      </div>
    );
  }

  // 获取Service列表
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getServiceList();

      if (response.code === 0) {
        setServices(response.data.all_list);
        setCampusList(response.data.campus_dict);
        setStaffList(response.data.staff_dict);
        setDormitoryStudents(response.data.dormitory_student);
      } else {
        console.error('获取Service列表失败:', response.message);
      }
    } catch (error) {
      console.error('获取Service列表异常:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索过滤
  const filteredServicesList = useMemo(() => {
    if (!searchTerm.trim()) return services;

    const term = searchTerm.toLowerCase();
    return services.filter(service =>
      service.name.toLowerCase().includes(term) ||
      service.campus_name?.toLowerCase().includes(term) ||
      service.mentor_name?.toLowerCase().includes(term)
    );
  }, [services, searchTerm]);

  // 分页计算
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredServicesList.slice(startIndex, endIndex);
  }, [filteredServicesList, currentPage, pageSize]);

  // 总页数计算
  const totalPages = useMemo(() => {
    return Math.ceil(filteredServicesList.length / pageSize);
  }, [filteredServicesList.length, pageSize]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // 更新过滤结果
  useEffect(() => {
    setFilteredServices(filteredServicesList);
    setCurrentPage(1); // 重置到第一页
  }, [filteredServicesList]);

  // 分页处理函数
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 重置到第一页
  }, []);

  // 处理添加Service
  const handleAddService = useCallback(() => {
    setFormData({
      name: '',
      gender: 0,
      size: 1,
      price: 0,
      campus: campusList[0]?.id || 0,
      mentor_id: 0,
      is_dormitory: 1,
      toilets: 0,
      start_time: Math.floor(Date.now() / 1000),
      end_time: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      booked: 0,
      locked: 0,
      graduate_year: new Date().getFullYear(),
    });
    setShowAddModal(true);
  }, [campusList]);

  // 处理编辑Service
  const handleEditService = useCallback(async (service: ServiceItem) => {
    try {
      setSelectedService(service);
      setLoading(true);

      // 获取编辑信息
      const response = await getServiceEditInfo(service.id.toString());
      if (response.code === 0) {
        const { service_info, booked_info, campus_list, staff_list, student_list, all_dormitory } = response.data;

        setEditServiceInfo(service_info);
        setBookedStudents(booked_info || []);
        setAllStudents(student_list || []);
        setAllDormitories(all_dormitory || []);

        setFormData({
          name: service_info.name,
          gender: service_info.gender,
          size: service_info.size,
          price: service_info.price || 0,
          campus: service_info.campus,
          mentor_id: service_info.mentor_id || -1,
          is_dormitory: service_info.dormitory_type || 1,
          toilets: service_info.toilets || 0,
          start_time: service_info.start_time || Math.floor(Date.now() / 1000),
          end_time: service_info.end_time || Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          booked: service_info.booked,
          locked: service_info.locked,
          graduate_year: service_info.graduate_year,
        });

        setShowEditModal(true);
      } else {
        alert(`获取编辑信息失败: ${response.message}`);
      }
    } catch (error) {
      console.error('获取编辑信息异常:', error);
      alert('获取编辑信息异常，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理删除Service
  const handleDeleteService = useCallback((service: ServiceItem) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  }, []);

  // 提交添加表单
  const handleSubmitAdd = useCallback(async () => {
    try {
      const params: AddServiceParams = {
        name: formData.name,
        gender: formData.gender,
        size: formData.size,
        price: formData.price,
        campus: formData.campus,
        mentor_id: formData.mentor_id === -1 ? undefined : formData.mentor_id,
        is_dormitory: formData.is_dormitory,
        start_time: formData.start_time,
        end_time: formData.end_time,
      };

      const response = await addService(params);

      if (response.code === 0) {
        alert('添加成功');
        setShowAddModal(false);
        fetchServices(); // 重新获取列表
      } else {
        alert(`添加失败: ${response.message}`);
      }
    } catch (error) {
      console.error('添加Service异常:', error);
      alert('添加异常，请重试');
    }
  }, [formData, fetchServices]);

  // 提交编辑表单
  const handleSubmitEdit = useCallback(async () => {
    if (!selectedService) return;

    try {
      const params: EditServiceParams = {
        record_id: selectedService.id,
        name: formData.name,
        gender: formData.gender,
        toilets: formData.toilets,
        size: formData.size,
        price: formData.price,
        start_time: formData.start_time,
        end_time: formData.end_time,
        booked: formData.booked,
        campus: formData.campus,
        // 始终传 mentor_id，未分配则为 -1
        mentor_id: (formData.mentor_id ?? -1),
        locked: formData.locked,
        graduate_year: formData.graduate_year,
      };

      const response = await editService(params);

      if (response.code === 0) {
        alert('编辑成功');
        setShowEditModal(false);
        setActiveTab('edit'); // 重置到基本信息标签页
        fetchServices(); // 重新获取列表
      } else {
        alert(`编辑失败: ${response.message}`);
      }
    } catch (error) {
      console.error('编辑Service异常:', error);
      alert('编辑异常，请重试');
    }
  }, [selectedService, formData, fetchServices]);

  // 添加学生到服务
  const handleAddStudent = useCallback(async (studentId: number) => {
    if (!selectedService) return;

    try {
      const response = await addStudentToService({
        student_id: studentId,
        record_id: selectedService.id
      });

      if (response.code === 0) {
        alert('添加学生成功');
        // 重新获取编辑信息
        const editResponse = await getServiceEditInfo(selectedService.id.toString());
        if (editResponse.code === 0) {
          setBookedStudents(editResponse.data.booked_info || []);
        }
        // 关闭添加学生模态框
        setShowAddStudentModal(false);
      } else {
        alert(`添加学生失败: ${response.message}`);
      }
    } catch (error) {
      console.error('添加学生异常:', error);
      alert('添加学生异常，请重试');
    }
  }, [selectedService]);

  // 移动学生到其他服务或移除学生
  const handleMoveStudent = useCallback(async (studentId: number, newDormitoryId: number) => {
    if (!selectedService) return;

    try {
      const response = await moveStudentToService({
        student_id: studentId,
        dormitory_id: selectedService.id,
        new_dormitory: newDormitoryId
      });

      if (response.code === 0) {
        if (newDormitoryId === 0) {
          alert('移除学生成功');
        } else {
          alert('移动学生成功');
        }
        // 重新获取编辑信息
        const editResponse = await getServiceEditInfo(selectedService.id.toString());
        if (editResponse.code === 0) {
          setBookedStudents(editResponse.data.booked_info || []);
        }
      } else {
        if (newDormitoryId === 0) {
          alert(`移除学生失败: ${response.message}`);
        } else {
          alert(`移动学生失败: ${response.message}`);
        }
      }
    } catch (error) {
      console.error('移动/移除学生异常:', error);
      alert('操作异常，请重试');
    }
  }, [selectedService]);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedService) return;

    try {
      const response = await deleteService({ record_id: selectedService.id });

      if (response.code === 0) {
        alert('删除成功');
        setShowDeleteModal(false);
        fetchServices(); // 重新获取列表
      } else {
        alert(`删除失败: ${response.message}`);
      }
    } catch (error) {
      console.error('删除Service异常:', error);
      alert('删除异常，请重试');
    }
  }, [selectedService, fetchServices]);

  // 已移到组件外部定义，保持组件类型稳定

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-gray-900">宿舍服务管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理所有宿舍和服务项目，包括添加、编辑和删除操作
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {canEdit && (
            <button
              type="button"
              onClick={handleAddService}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
              添加服务
            </button>
          )}
        </div>
      </div>

      {/* 搜索和分页控制栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 搜索栏 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                placeholder="搜索宿舍名称、校区或导师..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 分页控制 */}
          <div className="flex items-center gap-4">
            {/* 每页显示数量 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">每页显示:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* 分页信息 */}
            <div className="text-sm text-gray-600">
              显示 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredServicesList.length)} 条，
              共 {filteredServicesList.length} 条记录
            </div>
          </div>
        </div>
      </div>

      {/* 服务列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-2 py-5 sm:px-4 sm:py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到服务</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? '尝试调整搜索条件' : '开始添加第一个宿舍服务'}
              </p>
              {canEdit && !searchTerm && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                    添加服务
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ServiceTable
              items={paginatedServices}
              studentsMap={dormitoryStudents}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
            />
          )}
        </div>
      </div>



      {/* 分页导航 */}
      {filteredServicesList.length > 0 && (
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{currentPage}</span> 页，
                  共 <span className="font-medium">{totalPages}</span> 页
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">上一页</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010 1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* 页码按钮 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // 显示当前页附近的页码和首尾页
                    const shouldShow =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!shouldShow) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* 下一页按钮 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">下一页</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowAddModal(false)}></div>
            <div className="relative bg-white rounded-xl p-8 text-left overflow-hidden shadow-xl transform transition-all w-full max-w-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <PlusIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add New Service
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter service name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of students"
                        value={formData.size}
                        onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 1 }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.gender}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: parseInt(e.target.value) }))}
                      >
                        <option value={0}>Male</option>
                        <option value={1}>Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Campus <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.campus}
                        onChange={(e) => setFormData(prev => ({ ...prev, campus: parseInt(e.target.value) }))}
                      >
                        {campusList.map(campus => (
                          <option key={campus.id} value={campus.id}>
                            {campus.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mentor
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.mentor_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, mentor_id: parseInt(e.target.value) }))}
                      >
                        <option value={-1}>Unassigned</option>
                        {staffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.is_dormitory}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_dormitory: parseInt(e.target.value) }))}
                      >
                        <option value={1}>Dormitory (宿舍)</option>
                        <option value={0}>Meal Package (餐包)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={new Date(formData.start_time * 1000).toISOString().split('T')[0]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          start_time: Math.floor(new Date(e.target.value).getTime() / 1000)
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={new Date(formData.end_time * 1000).toISOString().split('T')[0]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          end_time: Math.floor(new Date(e.target.value).getTime() / 1000)
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAdd}
                    disabled={!formData.name.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => {
              setShowEditModal(false);
              setActiveTab('edit'); // 重置到基本信息标签页
            }}></div>
            <div className="relative bg-white rounded-xl p-10 text-left overflow-hidden shadow-xl transform transition-all w-full max-w-4xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setActiveTab('edit'); // 重置到基本信息标签页
                  }}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <PencilIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    编辑服务: {selectedService.name}
                  </h3>
                </div>

                {/* 标签页切换 */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('edit')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'edit'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      基本信息
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      学生管理 ({bookedStudents.length}/{selectedService.size})
                    </button>
                  </nav>
                </div>

                {/* 基本信息标签页 */}
                {activeTab === 'edit' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        服务名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入服务名称"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          容量 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="学生数量"
                          value={formData.size}
                          onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 1 }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          性别 <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.gender}
                          onChange={(e) => setFormData(prev => ({ ...prev, gender: parseInt(e.target.value) }))}
                        >
                          <option value={0}>男</option>
                          <option value={1}>女</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          价格
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          校区 <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.campus}
                          onChange={(e) => setFormData(prev => ({ ...prev, campus: parseInt(e.target.value) }))}
                        >
                          {campusList.map(campus => (
                            <option key={campus.id} value={campus.id}>
                              {campus.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          导师
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.mentor_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, mentor_id: parseInt(e.target.value) }))}
                        >
                          <option value={-1}>未分配</option>
                          {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          服务类型 <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.is_dormitory}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_dormitory: parseInt(e.target.value) }))}
                        >
                          <option value={1}>宿舍</option>
                          <option value={0}>餐包</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          卫生间数量
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                          value={formData.toilets}
                          onChange={(e) => setFormData(prev => ({ ...prev, toilets: parseInt(e.target.value) || 0 }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          毕业年份
                        </label>
                        <input
                          type="number"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={new Date().getFullYear().toString()}
                          value={formData.graduate_year}
                          onChange={(e) => setFormData(prev => ({ ...prev, graduate_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          预订状态
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.booked}
                          onChange={(e) => setFormData(prev => ({ ...prev, booked: parseInt(e.target.value) }))}
                        >
                          <option value={0}>可用</option>
                          <option value={1}>已预订</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          锁定状态
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.locked}
                          onChange={(e) => setFormData(prev => ({ ...prev, locked: parseInt(e.target.value) }))}
                        >
                          <option value={0}>正常</option>
                          <option value={1}>锁定</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          开始日期
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={new Date(formData.start_time * 1000).toISOString().split('T')[0]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            start_time: Math.floor(new Date(e.target.value).getTime() / 1000)
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          结束日期
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={new Date(formData.end_time * 1000).toISOString().split('T')[0]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            end_time: Math.floor(new Date(e.target.value).getTime() / 1000)
                          }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setActiveTab('edit'); // 重置到基本信息标签页
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSubmitEdit}
                        disabled={!formData.name.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        保存更改
                      </button>
                    </div>
                  </div>
                )}

                {/* 学生管理标签页 */}
                {activeTab === 'students' && (
                  <div className="space-y-4">
                    {/* 当前学生列表 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">当前学生: {bookedStudents.map(student => student.student_name).join(', ')} ({bookedStudents.length}/{selectedService.size})</h4>
                        {bookedStudents.length < selectedService.size && (
                          <button
                            onClick={() => setShowAddStudentModal(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            添加学生
                          </button>
                        )}
                      </div>

                      {bookedStudents.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">暂无学生</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {bookedStudents.map((student) => (
                              <div key={student.student_id} className="flex items-center justify-between bg-white p-2 rounded border">
                                <span className="text-sm text-gray-900">{student.student_name}</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setShowMoveStudentModal(true);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    title="移动学生"
                                  >
                                    移动
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`确认将 ${student.student_name} 从宿舍移除吗？`)) {
                                        handleMoveStudent(student.student_id, -1); // -1表示移除
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    title="移除学生"
                                  >
                                    移除
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 容量信息 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-900">容量信息</span>
                        </div>
                        <span className="text-sm text-blue-700">
                          {bookedStudents.length} / {selectedService.size}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(bookedStudents.length / selectedService.size) * 100}%` }}
                        ></div>
                      </div>
                      <p className="mt-1 text-xs text-blue-600">
                        {selectedService.size - bookedStudents.length} 个空位可用
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加学生模态框 */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowAddStudentModal(false)}></div>
            <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all w-full max-w-md">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <PlusIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    添加学生到 {selectedService?.name}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择学生
                    </label>
                    <SearchableSelect
                      className='w-full'
                      options={allStudents
                        .filter(student => !bookedStudents.some(booked => booked.student_id === student.id))
                        .map(s => ({ id: s.id, name: s.name }))}
                      value={0}
                      onValueChange={(val) => {
                        if (typeof val === 'number' && val > 0) {
                          handleAddStudent(val);
                        }
                      }}
                      placeholder="搜索并选择学生..."
                      searchPlaceholder="输入姓名进行搜索..."
                    />
                    {allStudents.filter(student => !bookedStudents.some(booked => booked.student_id === student.id)).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">没有可添加的学生</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 移动学生模态框 */}
      {showMoveStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowMoveStudentModal(false)}></div>
            <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all w-full max-w-md">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowMoveStudentModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <PencilIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    移动学生: {selectedStudent.student_name}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择目标宿舍
                    </label>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          if (confirm(`确认将 ${selectedStudent.student_name} 从宿舍移除吗？`)) {
                            handleMoveStudent(selectedStudent.student_id, -1);
                            setShowMoveStudentModal(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 border border-red-200 rounded-md transition-colors text-red-700"
                      >
                        🚫 从宿舍移除（不分配新宿舍）
                      </button>
                      <SearchableSelect
                        className='w-full'
                        options={allDormitories
                          .filter(dorm => dorm.id !== selectedService?.id)
                          .map(d => ({ id: d.id, name: d.name }))}
                        value={0}
                        onValueChange={(val) => {
                          if (typeof val === 'number' && val > 0) {
                            const targetName = allDormitories.find(d => d.id === val)?.name || '目标宿舍';
                            if (confirm(`确认将 ${selectedStudent.student_name} 移动到 ${targetName} 吗？`)) {
                              handleMoveStudent(selectedStudent.student_id, val);
                              setShowMoveStudentModal(false);
                            }
                          }
                        }}
                        placeholder="搜索并选择目标宿舍..."
                        searchPlaceholder="输入宿舍名称搜索..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowMoveStudentModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
              <p className="text-sm text-gray-500 mb-4">
                您确定要删除宿舍 <span className="font-medium text-gray-900">"{selectedService.name}"</span> 吗？
              </p>
              <p className="text-sm text-red-600">
                此操作不可撤销，请谨慎操作。
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
