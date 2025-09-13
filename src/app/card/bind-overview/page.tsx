'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import {
  getCardSelectOptions,
  getCardBindTable,
  bindCard,
  unbindCard,
  getPersonCardList,
  CardSelectOptions,
  CardBindRecord,
  CardDetail,
  BindCardParams,
} from '@/services/auth';

export default function BindOverviewPage() {
  const { hasPermission } = useAuth();
  
  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CARD_BIND);
  const canEdit = hasPermission(PERMISSIONS.EDIT_CARD_BIND);

  // 状态管理
  const [records, setRecords] = useState<CardBindRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 选项数据
  const [selectOptions, setSelectOptions] = useState<CardSelectOptions>({
    staff_list: [],
    student_list: [],
    hik_person_list: [],
  });
  
  // 模态框状态
  const [showBindModal, setShowBindModal] = useState(false);
  const [showUnbindModal, setShowUnbindModal] = useState(false);
  const [showCardListModal, setShowCardListModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CardBindRecord | null>(null);
  const [cardList, setCardList] = useState<CardDetail[]>([]);
  
  // 绑卡表单数据
  const [formData, setFormData] = useState({
    student_id: -1,
    staff_id: -1,
    personId: -1,
  });

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问此页面的权限</p>
        </div>
      </div>
    );
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [optionsResult, recordsResult] = await Promise.all([
        getCardSelectOptions(),
        getCardBindTable(),
      ]);
      
      if (optionsResult.code === 200) {
        console.log('加载的选项数据:', optionsResult.data); // 调试日志
        setSelectOptions(optionsResult.data!);
      }
      
      if (recordsResult.code === 200) {
        setRecords(recordsResult.data!.rows);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤记录
  const filteredRecords = records.filter(record =>
    record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.hik_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.operator_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页计算
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // 搜索时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 处理绑卡
  const handleBind = async () => {
    if (!canEdit) return;
    
    try {
      const params: BindCardParams = {
        student_id: formData.student_id,
        staff_id: formData.staff_id,
        personId: formData.personId,
      };
      
      const result = await bindCard(params);
      if (result.code === 200) {
        setShowBindModal(false);
        resetFormData();
        await loadData();
        alert('绑定成功！');
      } else {
        alert(`绑定失败: ${result.message}`);
      }
    } catch (error) {
      console.error('绑定失败:', error);
      alert('绑定失败');
    }
  };

  // 处理解绑
  const handleUnbind = async () => {
    if (!selectedRecord || !canEdit) return;
    
    try {
      const result = await unbindCard({ record_id: selectedRecord.record_id });
      if (result.code === 200) {
        setShowUnbindModal(false);
        setSelectedRecord(null);
        await loadData();
        alert('解绑成功！');
      } else {
        alert(`解绑失败: ${result.message}`);
      }
    } catch (error) {
      console.error('解绑失败:', error);
      alert('解绑失败');
    }
  };

  // 查看卡列表
  const handleViewCardList = async (record: CardBindRecord) => {
    try {
      const result = await getPersonCardList(record.person_id);
      if (result.code === 200) {
        setCardList(result.data!.rows);
        setSelectedRecord(record);
        setShowCardListModal(true);
      } else {
        alert(`获取卡列表失败: ${result.message}`);
      }
    } catch (error) {
      console.error('获取卡列表失败:', error);
      alert('获取卡列表失败');
    }
  };

  // 处理学生/教师选择的互斥逻辑
  const handleStudentChange = (value: number | number[]) => {
    const studentId = value as number;
    setFormData(prev => ({
      ...prev,
      student_id: studentId,
      staff_id: studentId !== -1 ? -1 : prev.staff_id,
    }));
  };

  const handleStaffChange = (value: number | number[]) => {
    const staffId = value as number;
    setFormData(prev => ({
      ...prev,
      staff_id: staffId,
      student_id: staffId !== -1 ? -1 : prev.student_id,
    }));
  };

  // 重置为学生选择
  const resetToStudent = () => {
    setFormData(prev => ({
      ...prev,
      staff_id: -1,
    }));
  };

  // 重置为教师选择
  const resetToStaff = () => {
    setFormData(prev => ({
      ...prev,
      student_id: -1,
    }));
  };

  // 处理海康用户选择
  const handleHikPersonChange = (value: number | number[]) => {
    const personId = value as number;
    console.log('海康用户选择:', personId); // 调试日志
    setFormData(prev => ({
      ...prev,
      personId: personId,
    }));
  };

  // 重置表单数据
  const resetFormData = () => {
    setFormData({
      student_id: -1,
      staff_id: -1,
      personId: -1,
    });
  };

  // 关闭绑定模态框
  const handleCloseBindModal = () => {
    setShowBindModal(false);
    resetFormData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">卡片绑定管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理学生/教师与海康用户的卡片绑定关系</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索姓名..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {canEdit && (
              <button
                onClick={() => setShowBindModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                新增绑定
              </button>
            )}
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生名字</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">老师名字</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">海康名字</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人员</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record) => (
                    <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.student_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.staff_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.hik_user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.operator_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.in_use === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.in_use_str}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.create_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.update_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewCardList(record)}
                            className="w-8 h-8 text-blue-600 flex items-center justify-center"
                            title="查看卡列表"
                          >
                            查看
                          </button>
                          {canEdit && record.in_use === 1 && (
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowUnbindModal(true);
                              }}
                              className="w-8 h-8 text-red-600 flex items-center justify-center"
                              title="解绑"
                            >
                              解绑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRecords.length === 0 && filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* 分页信息 */}
              <div className="text-sm text-gray-600">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 项，共 {totalItems} 项
              </div>
              
              {/* 分页控件 */}
              <div className="flex items-center gap-4">
                {/* 每页显示数量选择 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">每页显示</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">项</span>
                </div>
                
                {/* 分页按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
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
                        const startPage = Math.max(1, currentPage - 3);
                        const endPage = Math.min(totalPages, currentPage + 3);
                        
                        // 第一页
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className="w-8 h-8 flex items-center justify-center text-sm font-medium border rounded bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="start-ellipsis" className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                                ...
                              </span>
                            );
                          }
                        }
                        
                        // 中间页码
                        for (let i = startPage; i <= endPage; i++) {
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
                        
                        // 最后一页
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                                ...
                              </span>
                            );
                          }
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
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 新增绑定模态框 */}
        {showBindModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">新增绑定</h3>
                <button
                  onClick={handleCloseBindModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* 调试信息 */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  调试: student_id={formData.student_id}, staff_id={formData.staff_id}, personId={formData.personId}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      选择学生
                    </label>
                    {formData.staff_id !== -1 && (
                      <button
                        type="button"
                        onClick={resetToStudent}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        切换到学生
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    options={selectOptions.student_list}
                    value={formData.student_id}
                    onValueChange={handleStudentChange}
                    placeholder="请选择学生"
                    disabled={formData.staff_id !== -1}
                    className="w-full"
                  />
                  {formData.staff_id !== -1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      已选择教师，如需选择学生请点击"切换到学生"
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      选择教师
                    </label>
                    {formData.student_id !== -1 && (
                      <button
                        type="button"
                        onClick={resetToStaff}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        切换到教师
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    options={selectOptions.staff_list}
                    value={formData.staff_id}
                    onValueChange={handleStaffChange}
                    placeholder="请选择教师"
                    disabled={formData.student_id !== -1}
                    className="w-full"
                  />
                  {formData.student_id !== -1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      已选择学生，如需选择教师请点击"切换到教师"
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择海康用户
                  </label>
                  <SearchableSelect
                    options={selectOptions.hik_person_list}
                    value={formData.personId}
                    onValueChange={handleHikPersonChange}
                    placeholder="请选择海康用户"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={handleCloseBindModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBind}
                  disabled={formData.personId === -1 || (formData.student_id === -1 && formData.staff_id === -1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认绑定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 解绑确认模态框 */}
        {showUnbindModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      确认解绑
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        确定要解绑 {selectedRecord.student_name || selectedRecord.staff_name} 
                        与 {selectedRecord.hik_user} 的绑定关系吗？此操作不可撤销。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleUnbind}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  确认解绑
                </button>
                <button
                  onClick={() => setShowUnbindModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 卡列表模态框 */}
        {showCardListModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedRecord.hik_user} 的卡列表
                </h3>
                <button
                  onClick={() => setShowCardListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">卡片ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">卡号</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">持卡人名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">生效日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">失效日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">挂失时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">解除挂失时间</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cardList.map((card) => (
                        <tr key={card.cardId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.cardId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.cardNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.personName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              card.useStatus === '正常' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {card.useStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.startDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.endDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.lossDate || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.unlossDate || '-'}</td>
                        </tr>
                      ))}
                      {cardList.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                            暂无卡片数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
