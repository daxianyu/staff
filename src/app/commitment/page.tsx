'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getCommitmentStudentCount, 
  getCommitmentList, 
  uploadCommitmentFile, 
  addCommitmentRecord,
  CommitmentStudent,
  CommitmentFile,
  CommitmentListResponse,
  NewCommitmentParams
} from '@/services/auth';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

export default function CommitmentPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'files'>('students');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 学生相关状态
  const [students, setStudents] = useState<CommitmentStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<CommitmentStudent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  
  // 承诺书文件相关状态
  const [commitmentFiles, setCommitmentFiles] = useState<CommitmentFile[]>([]);
  const [typeDesc, setTypeDesc] = useState<{[key: string]: string}>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<NewCommitmentParams>({
    file_path: '',
    file_type: 1,
    file_desc: ''
  });

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_COMMITMENT);
  const canEdit = hasPermission(PERMISSIONS.EDIT_COMMITMENT);

  // 加载学生数据
  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await getCommitmentStudentCount();
      if (result.code === 200 && result.data) {
        setStudents(result.data);
        setFilteredStudents(result.data);
      }
    } catch (error) {
      console.error('加载学生数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载承诺书文件数据
  const loadCommitmentFiles = async () => {
    setLoading(true);
    try {
      const result = await getCommitmentList();
      if (result.code === 200 && result.data) {
        setCommitmentFiles(result.data.list);
        setTypeDesc(result.data.type_desc);
      }
    } catch (error) {
      console.error('加载承诺书文件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索和过滤学生
  const filterStudents = (statusFilterValue?: 'all' | 'completed' | 'incomplete', searchValue?: string) => {
    const currentStatusFilter = statusFilterValue !== undefined ? statusFilterValue : statusFilter;
    const currentSearchTerm = searchValue !== undefined ? searchValue : searchTerm;

    let filtered = students;

    // 按完成状态过滤
    if (currentStatusFilter === 'completed') {
      filtered = filtered.filter(student => student.done === 1);
    } else if (currentStatusFilter === 'incomplete') {
      filtered = filtered.filter(student => student.done === 0);
    }

    // 按搜索词过滤
    if (currentSearchTerm.trim()) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // 重置到第一页
  };

  // 搜索学生
  const handleSearchStudents = (term: string) => {
    setSearchTerm(term);
    filterStudents(undefined, term);
  };

  // 状态过滤处理
  const handleStatusFilter = (status: 'all' | 'completed' | 'incomplete') => {
    setStatusFilter(status);
    filterStudents(status);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 计算分页数据
  const getPaginatedStudents = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredStudents.slice(startIndex, endIndex);
  };

  // 计算总页数
  const calculateTotalPages = () => {
    return Math.ceil(filteredStudents.length / pageSize);
  };

  // 文件上传处理
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 选择文件后直接上传
      await handleUploadFile(file);
    }
  };

  // 上传承诺书文件
  const handleUploadFile = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;
    
    setUploading(true);
    try {
      const result = await uploadCommitmentFile(fileToUpload);
      if (result.code === 200 && result.data) {
        // 确保获取到正确的文件路径
        const filePath = result.data.file_path;
        console.log('文件上传成功，路径:', filePath);
        setFormData(prev => ({ ...prev, file_path: filePath }));
      } else {
        console.error('上传失败:', result);
        alert(`上传失败: ${result.message}`);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 添加承诺书记录
  const handleAddCommitment = async () => {
    if (!formData.file_path) {
      alert('请先上传文件');
      return;
    }
    
    setLoading(true);
    try {
      console.log('提交承诺书数据:', formData);
      const result = await addCommitmentRecord(formData);
      console.log('添加承诺书结果:', result);
      
      if (result.code === 200) {
        alert('添加成功！');
        setShowAddModal(false);
        setFormData({ file_path: '', file_type: 1, file_desc: '' });
        setSelectedFile(null);
        loadCommitmentFiles();
      } else {
        alert(`添加失败: ${result.message}`);
      }
    } catch (error) {
      console.error('添加承诺书失败:', error);
      alert('添加承诺书失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      if (activeTab === 'students') {
        loadStudents();
      } else {
        loadCommitmentFiles();
      }
    }
  }, [canView, activeTab]);

  // 当学生数据变化时重新过滤
  useEffect(() => {
    if (students.length > 0) {
      filterStudents();
    }
  }, [students]);

  // 更新总页数
  useEffect(() => {
    setTotalPages(calculateTotalPages());
  }, [filteredStudents, pageSize]);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问承诺书管理页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">承诺书管理</h1>
          <p className="mt-2 text-gray-600">管理学生承诺书完成情况和承诺书文件</p>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                学生列表
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                承诺书列表
              </button>
            </nav>
          </div>
        </div>

        {/* 学生列表标签页 */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow">
            {/* 搜索和过滤栏 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col gap-4">
                {/* 第一行：搜索框和统计信息 */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索学生姓名..."
                      value={searchTerm}
                      onChange={(e) => handleSearchStudents(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      共 {filteredStudents.length} 名学生
                      {statusFilter !== 'all' && (
                        <span className="ml-2 text-xs text-gray-500">
                          (全部 {students.length} 名)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">每页显示:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 第二行：状态过滤 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">完成状态:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusFilter('all')}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          statusFilter === 'all'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        全部
                      </button>
                      <button
                        onClick={() => handleStatusFilter('completed')}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          statusFilter === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                        已完成
                      </button>
                      <button
                        onClick={() => handleStatusFilter('incomplete')}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          statusFilter === 'incomplete'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <XCircleIcon className="h-4 w-4 inline mr-1" />
                        未完成
                      </button>
                    </div>
                  </div>

                  {/* 清除过滤条件 */}
                  {(statusFilter !== 'all' || searchTerm.trim()) && (
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchTerm('');
                        filterStudents('all', '');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      清除过滤
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 学生表格 */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <DocumentIcon className="h-12 w-12 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到学生</h3>
                  <p className="text-sm text-gray-500">
                    {statusFilter !== 'all' || searchTerm.trim()
                      ? '请尝试调整搜索条件或过滤条件'
                      : '暂无学生数据'
                    }
                  </p>
                  {(statusFilter !== 'all' || searchTerm.trim()) && (
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchTerm('');
                        filterStudents('all', '');
                      }}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                    >
                      清除所有过滤条件
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        学生ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        学生姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        完成状态
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        未读列表
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedStudents().map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.done === 1 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              已完成
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              未完成
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.unread_list.join(';')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 分页组件 */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)} 条，
                    共 {filteredStudents.length} 条记录
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* 上一页按钮 */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>

                    {/* 页码按钮 */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 7;
                        
                        if (totalPages <= maxVisiblePages) {
                          // 显示所有页码
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                  currentPage === i
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                        } else {
                          // 智能显示页码
                          if (currentPage <= 4) {
                            // 显示前几页
                            for (let i = 1; i <= 5; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => handlePageChange(i)}
                                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                    currentPage === i
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            pages.push(
                              <span key="ellipsis1" className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-400 cursor-not-allowed">
                                ...
                              </span>
                            );
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => handlePageChange(totalPages)}
                                className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                {totalPages}
                              </button>
                            );
                          } else if (currentPage >= totalPages - 3) {
                            // 显示后几页
                            pages.push(
                              <button
                                key={1}
                                onClick={() => handlePageChange(1)}
                                className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                1
                              </button>
                            );
                            pages.push(
                              <span key="ellipsis1" className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-400 cursor-not-allowed">
                                ...
                              </span>
                            );
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => handlePageChange(i)}
                                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                    currentPage === i
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                          } else {
                            // 显示中间页
                            pages.push(
                              <button
                                key={1}
                                onClick={() => handlePageChange(1)}
                                className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                1
                              </button>
                            );
                            pages.push(
                              <span key="ellipsis1" className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-400 cursor-not-allowed">
                                ...
                              </span>
                            );
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => handlePageChange(i)}
                                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                                    currentPage === i
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            pages.push(
                              <span key="ellipsis2" className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-400 cursor-not-allowed">
                                ...
                              </span>
                            );
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => handlePageChange(totalPages)}
                                className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                {totalPages}
                              </button>
                            );
                          }
                        }
                        
                        return pages;
                      })()}
                    </div>

                    {/* 下一页按钮 */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 承诺书列表标签页 */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-lg shadow">
            {/* 操作栏 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">承诺书文件列表</h3>
                {canEdit && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    添加承诺书
                  </button>
                )}
              </div>
            </div>

            {/* 承诺书文件表格 */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        文件类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        文件描述
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        文件路径
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commitmentFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {file.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeDesc[file.file_type] || `类型${file.file_type}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {file.file_desc}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => window.open("/" + file.file_path, '_blank')}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="点击查看文件"
                          >
                            <DocumentIcon className="h-6 w-6" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 添加承诺书模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">添加承诺书</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* 文件上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择文件
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{selectedFile.name}</span>
                        {uploading && (
                          <div className="inline-flex items-center px-3 py-1 text-blue-600 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                            上传中...
                          </div>
                        )}
                      </div>
                      {formData.file_path && (
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => window.open(formData.file_path, '_blank')}
                            className="text-green-600 hover:text-green-700 transition-colors"
                            title="点击查看文件"
                          >
                            <DocumentIcon className="h-8 w-8" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 文件类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文件类型
                  </label>
                  <select
                    value={formData.file_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_type: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(typeDesc).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 文件描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文件描述
                  </label>
                  <input
                    type="text"
                    value={formData.file_desc}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_desc: e.target.value }))}
                    placeholder="请输入文件描述..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCommitment}
                  disabled={loading || !formData.file_path}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '添加中...' : '添加'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
