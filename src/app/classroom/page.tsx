'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { 
  getClassroomList,
  addClassroom,
  updateClassroom,
  deleteClassroom,
  type Classroom,
  type AddClassroomParams,
  type UpdateClassroomParams,
  type DeleteClassroomParams,
  type ClassroomListResponse
} from '@/services/auth';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';


export default function ClassroomPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CLASSROOMS);
  const canEdit = hasPermission(PERMISSIONS.EDIT_CLASSROOMS);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CLASSROOMS);
  
  // 状态管理
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [campusInfo, setCampusInfo] = useState<Array<{ id: number; name: string }>>([]);
  const [staffInfo, setStaffInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<AddClassroomParams>({
    room_name: '',
    campus_id: 0,
    size: 1,
    flag: 1,
    owner: -1
  });

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    if (canView) {
      loadClassroomList();
    }
  }, [canView]);

  // 加载教室列表
  const loadClassroomList = async () => {
    try {
      setLoading(true);
      const response = await getClassroomList();
      
      if (response.status === 200 && response.data) {
        setClassrooms(response.data.room_list);
        setCampusInfo(response.data.campus_info);
        setStaffInfo(response.data.staff_info);
      } else {
        console.error('获取教室列表失败:', response.message);
      }
    } catch (error) {
      console.error('加载教室列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入
  const handleInputChange = (field: keyof AddClassroomParams, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  // 打开新增模态框
  const handleAddClassroom = () => {
    setFormData({
      room_name: '',
      campus_id: 0,
      size: 1,
      flag: 1,
      owner: -1
    });
    setShowAddModal(true);
  };

  // 打开编辑模态框
  const handleEditClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setFormData({
      room_name: classroom.name,
      campus_id: classroom.campus_id,
      size: classroom.size,
      flag: classroom.flag,
      owner: classroom.owner
    });
    setShowEditModal(true);
  };

  // 打开删除确认模态框
  const handleDeleteClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setShowDeleteModal(true);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查必填字段
    if (!formData.room_name || formData.campus_id === 0) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      let response;
      
      if (showAddModal) {
        response = await addClassroom(formData);
        if (response.code === 200) {
          console.log('添加教室成功');
          setShowAddModal(false);
          loadClassroomList();
        } else {
          console.error('添加教室失败:', response.message);
          alert('添加教室失败: ' + response.message);
        }
      } else if (showEditModal && selectedClassroom) {
        const updateParams: UpdateClassroomParams = {
          room_id: selectedClassroom.id,
          ...formData
        };
        response = await updateClassroom(updateParams);
        if (response.code === 200) {
          console.log('更新教室成功');
          setShowEditModal(false);
          loadClassroomList();
        } else {
          console.error('更新教室失败:', response.message);
          alert('更新教室失败: ' + response.message);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
    }
  };

  // 确认删除
  const confirmDelete = async () => {
    if (selectedClassroom) {
      try {
        const response = await deleteClassroom({ record_id: selectedClassroom.id });
        if (response.code === 200) {
          console.log('删除教室成功');
          setShowDeleteModal(false);
          loadClassroomList();
        } else {
          console.error('删除教室失败:', response.message);
          alert('删除教室失败: ' + response.message);
        }
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
      }
    }
  };



  // 过滤教室列表
  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页逻辑
  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClassrooms = filteredClassrooms.slice(startIndex, endIndex);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h1>
          <p className="text-gray-600">您没有权限访问教室管理页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">教室管理</h1>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索教室名称、校区或负责人..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {canEdit && (
              <button
                onClick={handleAddClassroom}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                新增教室
              </button>
            )}
          </div>
        </div>

        {/* 教室列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      是否参与排课
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentClassrooms.map((classroom) => (
                    <tr key={classroom.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{classroom.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{classroom.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{classroom.campus_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          classroom.flag === 1 
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200' 
                        }`}>
                          {classroom.flag === 1 ? '否' : '是'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{classroom.owner_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* 查看课表按钮 */}
                          <button
                            onClick={() => router.push(`/classroom/schedule?room_id=${classroom.id}`)}
                            className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-full transition-colors"
                            title="查看课表"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          
                          {canEdit && (
                            <button
                              onClick={() => handleEditClassroom(classroom)}
                              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                              title="编辑教室"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteClassroom(classroom)}
                              className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                              title="删除教室"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {!canEdit && !canDelete && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  

                </tbody>
              </table>
              
              {/* 空状态 */}
              {filteredClassrooms.length === 0 && (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无教室数据</h3>
                  <p className="text-gray-500">
                    {searchTerm ? '没有找到匹配的教室' : '还没有添加任何教室'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                显示第 {startIndex + 1}-{Math.min(endIndex, filteredClassrooms.length)} 条，共 {filteredClassrooms.length} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑模态框 */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
            }}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {showAddModal ? '新增教室' : '编辑教室'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      教室名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.room_name}
                      onChange={(e) => handleInputChange('room_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入教室名称"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      校区 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.campus_id}
                      onChange={(e) => handleInputChange('campus_id', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>请选择校区</option>
                      {campusInfo.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      容量 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入教室容量"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      负责人
                    </label>
                    <SearchableSelect
                      options={[
                        { id: -1, name: '不选择' },
                        ...Object.entries(staffInfo).map(([id, name]) => ({
                          id: Number(id),
                          name,
                        })),
                      ]}
                      value={formData.owner}
                      onValueChange={(value) => handleInputChange('owner', value as number)}
                      placeholder="不选择"
                      searchPlaceholder="搜索负责人..."
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <select
                      value={formData.flag}
                      onChange={(e) => handleInputChange('flag', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>参与AI排课</option>
                      <option value={1}>不参与AI排课</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      确认
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedClassroom && (
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
                    确认删除
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除教室 <span className="font-medium">{selectedClassroom.name}</span> 吗？
                      此操作无法撤销。
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  删除
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
