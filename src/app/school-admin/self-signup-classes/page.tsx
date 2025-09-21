'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  BookOpenIcon,
  PencilIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  getSelfSignupClassList,
  getSelfSignupClassSelect,
  addSelfSignupClass,
  deleteSelfSignupClass,
  uploadSelfSignupClass,
  downloadSelfSignupClassTemplate,
  getSelfSignupClassEditInfo,
  editSelfSignupClass,
  deleteSelfSignupClassStudent,
  type SelfSignupClass,
  type SelectOption,
  type AddSelfSignupClassRequest,
  type EditSelfSignupClassRequest,
  type SelfSignupClassStudent,
  type SelfSignupClassEditInfo,
} from '@/services/auth';

export default function SelfSignupClassesPage() {
  const { hasPermission } = useAuth();
  const [classes, setClasses] = useState<SelfSignupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SelfSignupClass | null>(null);
  const [editInfo, setEditInfo] = useState<SelfSignupClassEditInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'students'>('edit');
  
  // 选项数据
  const [topicOptions, setTopicOptions] = useState<SelectOption[]>([]);
  const [examOptions, setExamOptions] = useState<SelectOption[]>([]);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  
  // 表单数据
  const [formData, setFormData] = useState({
    exam_id: 0,
    topic_id: 0,
    class_name: '',
    disable_time: Math.floor(Date.now() / 1000) + 86400 * 30, // 默认30天后
    campus_id: 0,
  });

  // 上传文件
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_SELF_SIGNUP_CLASSES);
  const canEdit = hasPermission(PERMISSIONS.EDIT_SELF_SIGNUP_CLASSES);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [listResponse, selectResponse] = await Promise.all([
        getSelfSignupClassList(),
        getSelfSignupClassSelect(),
      ]);

      if (listResponse.code === 200 && listResponse.data) {
        setClasses(listResponse.data.list.rows);
      }

      if (selectResponse.code === 200 && selectResponse.data) {
        setTopicOptions(selectResponse.data.topics);
        setExamOptions(selectResponse.data.exams);
        setCampusOptions(selectResponse.data.campus_info);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  // 过滤数据
  const filteredClasses = classes.filter(cls =>
    cls.topic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalItems = filteredClasses.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 处理新增
  const handleAdd = () => {
    setFormData({
      exam_id: 0,
      topic_id: 0,
      class_name: '',
      disable_time: Math.floor(Date.now() / 1000) + 86400 * 30,
      campus_id: 0,
    });
    setShowAddModal(true);
  };

  // 处理编辑/查看学生（统一入口）
  const handleEditOrViewStudents = async (cls: SelfSignupClass, tab: 'edit' | 'students' = 'edit') => {
    setSelectedClass(cls);
    setActiveTab(tab);
    
    try {
      const response = await getSelfSignupClassEditInfo(cls.id);
      if (response.code === 200 && response.data) {
        setEditInfo(response.data);
        
        // 如果是编辑模式，需要设置表单数据
        if (tab === 'edit') {
          setFormData({
            exam_id: response.data?.record.exam_id ? 
              examOptions.find(e => e.id.toString() === response.data?.record.exam_id)?.id || 0 : 0,
            topic_id: response.data?.record.topic_id || 0,
            class_name: response.data?.record.class_name || '',
            disable_time: response.data?.record.disable_time || 0,
            campus_id: response.data?.record.campus_id || 0,
          });
        }
        
        setShowEditModal(true);
      } else {
        alert(response.message || '获取信息失败');
      }
    } catch (error) {
      console.error('获取信息失败:', error);
      alert('获取信息失败');
    }
  };

  // 处理删除
  const handleDelete = (cls: SelfSignupClass) => {
    setSelectedClass(cls);
    setShowDeleteModal(true);
  };

  // 提交新增
  const handleSubmitAdd = async () => {
    if (!formData.exam_id || !formData.topic_id || !formData.class_name || !formData.campus_id) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await addSelfSignupClass(formData as AddSelfSignupClassRequest);
      if (response.code === 200) {
        setShowAddModal(false);
        loadData();
      } else {
        alert(response.message || '新增失败');
      }
    } catch (error) {
      console.error('新增班级失败:', error);
      alert('新增失败');
    }
  };

  // 提交编辑
  const handleSubmitEdit = async () => {
    if (!selectedClass || !formData.exam_id || !formData.topic_id || !formData.class_name || !formData.campus_id) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await editSelfSignupClass({
        record_id: selectedClass.id,
        ...formData,
      } as EditSelfSignupClassRequest);
      
      if (response.code === 200) {
        setShowEditModal(false);
        loadData();
      } else {
        alert(response.message || '编辑失败');
      }
    } catch (error) {
      console.error('编辑班级失败:', error);
      alert('编辑失败');
    }
  };

  // 删除学生
  const handleDeleteStudent = async (student: SelfSignupClassStudent) => {
    if (!selectedClass) return;

    if (!confirm(`确定要删除学生 ${student.student_name} 吗？`)) {
      return;
    }

    try {
      const response = await deleteSelfSignupClassStudent({
        record_id: selectedClass.id,
        student_id: student.id,
      });
      
      if (response.code === 200) {
        // 重新加载学生信息
        const editResponse = await getSelfSignupClassEditInfo(selectedClass.id);
        if (editResponse.code === 200 && editResponse.data) {
          setEditInfo(editResponse.data);
        }
        loadData();
      } else {
        alert(response.message || '删除学生失败');
      }
    } catch (error) {
      console.error('删除学生失败:', error);
      alert('删除学生失败');
    }
  };

  // 切换标签页
  const handleTabChange = (tab: 'edit' | 'students') => {
    setActiveTab(tab);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedClass) return;

    try {
      const response = await deleteSelfSignupClass(selectedClass.id);
      if (response.code === 200) {
        setShowDeleteModal(false);
        loadData();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除班级失败:', error);
      alert('删除失败');
    }
  };

  // 处理文件上传
  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('请选择文件');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadSelfSignupClass(uploadFile);
      if (response.code === 200) {
        setShowUploadModal(false);
        setUploadFile(null);
        loadData();
        alert('批量上传成功');
      } else {
        alert(response.message || '上传失败');
      }
    } catch (error) {
      console.error('批量上传失败:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 下载
  const handleDownloadBaDate = async () => {
    try {
      await downloadSelfSignupClassTemplate();
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败');
    }
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const templateUrl = 'https://www.huayaopudong.com/static/template/self-signup-class-example.xlsx';
      
      // 创建一个临时的a标签来触发下载
      const link = document.createElement('a');
      link.href = templateUrl;
      link.download = 'self-signup-class-example.xlsx';
      link.target = '_blank';
      
      // 添加到DOM中，触发点击，然后移除
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败');
    }
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问自助报名班级页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">自助报名班级管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理学生自助报名的班级信息</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">总班级数</dt>
                  <dd className="text-lg font-medium text-gray-900">{classes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">可用班级</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.filter(cls => cls.is_disable === 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">已禁用班级</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.filter(cls => cls.is_disable === 1).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索科目、考试或班级名称..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  模板下载
                </button>
                <button
                  onClick={handleDownloadBaDate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  基础数据下载
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  上传
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增班级
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Class Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Exam Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Disable Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                        Campus
                      </th>
                      {canEdit && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                          操作
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedClasses.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cls.class_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cls.exam_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cls.topic_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimestamp(cls.disable_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {cls.campus_name}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditOrViewStudents(cls, 'edit')}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                title="编辑班级/查看学生"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cls)}
                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                title="删除班级"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页组件 */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">每页显示:</label>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 新增模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">New class</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
                  <input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入班级名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject name</label>
                  <select
                    value={formData.topic_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>请选择科目</option>
                    {topicOptions.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam name</label>
                  <select
                    value={formData.exam_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, exam_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>请选择考试</option>
                    {examOptions.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <select
                    value={formData.campus_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, campus_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>请选择校区</option>
                    {campusOptions.map(campus => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disable time</label>
                  <input
                    type="date"
                    value={new Date(formData.disable_time * 1000).toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      disable_time: Math.floor(new Date(e.target.value).getTime() / 1000)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitAdd}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 批量上传模态框 */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">批量上传班级</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择Excel文件</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    请上传Excel格式文件，支持.xlsx和.xls格式
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '上传中...' : '确认上传'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑/学生管理模态框 */}
        {showEditModal && selectedClass && editInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedClass.class_name} - {activeTab === 'edit' ? '编辑班级' : '学生管理'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* 标签页导航 */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => handleTabChange('edit')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'edit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <PencilIcon className="h-5 w-5 inline mr-2" />
                    编辑班级
                  </button>
                  <button
                    onClick={() => handleTabChange('students')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'students'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <UserGroupIcon className="h-5 w-5 inline mr-2" />
                    学生管理
                  </button>
                </nav>
              </div>

              {/* 标签页内容 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'edit' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                      <select
                        value={formData.topic_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, topic_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>请选择科目</option>
                        {Object.entries(editInfo.class_topics).map(([id, name]) => (
                          <option key={id} value={Number(id)}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">考试</label>
                      <select
                        value={formData.exam_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, exam_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>请选择考试</option>
                        {editInfo.exams.map(exam => (
                          <option key={exam.id} value={exam.id}>{exam.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">班级名称</label>
                      <input
                        type="text"
                        value={formData.class_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入班级名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">校区</label>
                      <select
                        value={formData.campus_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, campus_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>请选择校区</option>
                        {editInfo.campus_info.map(campus => (
                          <option key={campus.id} value={campus.id}>{campus.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                      <input
                        type="date"
                        value={new Date(formData.disable_time * 1000).toISOString().split('T')[0]}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          disable_time: Math.floor(new Date(e.target.value).getTime() / 1000)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {editInfo.record.class_assignment_request.length === 0 ? (
                      <div className="text-center py-8">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无学生</h3>
                        <p className="mt-1 text-sm text-gray-500">该班级还没有学生报名</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                学生姓名
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                校区
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                导师
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                备注
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {editInfo.record.class_assignment_request.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {student.student_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {student.campus_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.mentor_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.note}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleDeleteStudent(student)}
                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                    title="删除学生"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 底部按钮 */}
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  关闭
                </button>
                {activeTab === 'edit' && (
                  <button
                    onClick={handleSubmitEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    保存修改
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


        {/* 删除确认模态框 */}
        {showDeleteModal && selectedClass && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      删除班级
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要删除班级 <span className="font-medium">{selectedClass.class_name}</span> 吗？此操作无法撤销。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleConfirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  删除
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
