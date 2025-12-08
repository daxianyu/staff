'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getStaffTextbookList,
  addTextbook,
  deleteTextbook,
  getTextbookEditInfo,
  editTextbook,
  getAllCampus,
  Textbook,
  TextbookFormData,
  TextbookEditInfo,
  Campus
} from '@/services/auth';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function TextbookPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [filteredTextbooks, setFilteredTextbooks] = useState<Textbook[]>([]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTextbook, setEditingTextbook] = useState<Textbook | null>(null);
  const [deletingTextbook, setDeletingTextbook] = useState<Textbook | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<TextbookFormData>({
    name: '',
    type: '',
    price: 0,
    inventory_info: {}
  });

  // 校区信息
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [campusInfo, setCampusInfo] = useState<{[key: string]: string}>({});

  // 权限检查
  const canView = hasPermission('edit_books');
  const canEdit = hasPermission('edit_books');
  const canDelete = hasPermission('edit_books');
  const canAdd = hasPermission('edit_books');

  // 加载校区信息
  const loadCampusInfo = async () => {
    try {
      const result = await getAllCampus();
      if (result.status === 200 && result.data) {
        setCampusList(result.data);
        // 转换为对象格式用于编辑时显示
        const campusObj: {[key: string]: string} = {};
        result.data.forEach(campus => {
          campusObj[campus.id.toString()] = campus.name;
        });
        setCampusInfo(campusObj);
      }
    } catch (error) {
      console.error('加载校区信息失败:', error);
    }
  };

  // 加载教材数据
  const loadTextbooks = async () => {
    setLoading(true);
    try {
      const result = await getStaffTextbookList();
      if (result.code === 200 && result.data) {
        setTextbooks(result.data);
        setCurrentPage(1);
        filterTextbooks(searchTerm, 1, pageSize, result.data);
      }
    } catch (error) {
      console.error('加载教材数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤和分页
  const filterTextbooks = (searchValue?: string, page?: number, size?: number, dataSource?: Textbook[]) => {
    const currentSearchTerm = searchValue !== undefined ? searchValue : searchTerm;
    const currentPageNum = page !== undefined ? page : currentPage;
    const currentPageSize = size !== undefined ? size : pageSize;
    const source = dataSource || textbooks;

    let filtered = source;

    if (currentSearchTerm) {
      filtered = filtered.filter(textbook =>
        textbook.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        textbook.type.toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }

    // 更新分页信息
    const total = filtered.length;
    const pages = Math.ceil(total / currentPageSize);
    setTotalItems(total);
    setTotalPages(pages);

    // 分页
    const startIndex = (currentPageNum - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    setFilteredTextbooks(paginatedItems);
  };

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    filterTextbooks(searchTerm, page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    filterTextbooks(searchTerm, 1, newPageSize);
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    filterTextbooks(value, 1, pageSize);
  };

  // 打开新增模态框
  const handleAddModal = () => {
    const initialInventory: { [campusId: number]: number } = {};
    campusList.forEach(campus => {
      initialInventory[campus.id] = 0;
    });

    setFormData({
      name: '',
      type: '',
      price: 0,
      inventory_info: initialInventory
    });
    setShowAddModal(true);
  };

  // 打开编辑模态框
  const handleEditModal = async (textbook: Textbook) => {
    try {
      const result = await getTextbookEditInfo(textbook.textbook_id);
      if (result.code === 200 && result.data) {
        const editInfo = result.data;
        setCampusInfo(editInfo.campus_info);
        setFormData({
          name: editInfo.name,
          type: editInfo.type,
          price: editInfo.price,
          inventory_info: Object.fromEntries(
            Object.entries(editInfo.inventory_info).map(([key, value]) => [parseInt(key), value])
          )
        });
        setEditingTextbook(textbook);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('获取编辑信息失败:', error);
    }
  };

  // 打开删除模态框
  const handleDeleteModal = (textbook: Textbook) => {
    setDeletingTextbook(textbook);
    setShowDeleteModal(true);
  };

  // 处理新增教材
  const handleAddTextbook = async () => {
    try {
      const result = await addTextbook(formData);
      if (result.code === 200) {
        setShowAddModal(false);
        await loadTextbooks();
      }
    } catch (error) {
      console.error('新增教材失败:', error);
    }
  };

  // 处理编辑教材
  const handleEditTextbook = async () => {
    if (!editingTextbook) return;

    try {
      const result = await editTextbook(editingTextbook.textbook_id, formData);
      if (result.code === 200) {
        setShowEditModal(false);
        setEditingTextbook(null);
        await loadTextbooks();
      }
    } catch (error) {
      console.error('编辑教材失败:', error);
    }
  };

  // 处理删除教材
  const handleDeleteTextbook = async () => {
    if (!deletingTextbook) return;

    try {
      const result = await deleteTextbook(deletingTextbook.textbook_id);
      if (result.code === 200) {
        setShowDeleteModal(false);
        setDeletingTextbook(null);
        await loadTextbooks();
      }
    } catch (error) {
      console.error('删除教材失败:', error);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    if (canView) {
      loadCampusInfo();
      loadTextbooks();
    }
  }, [canView]);

  // 当textbooks数据更新时，重新过滤
  useEffect(() => {
    if (textbooks.length > 0) {
      filterTextbooks(searchTerm, currentPage, pageSize);
    }
  }, [textbooks, searchTerm, currentPage, pageSize]);

  // 权限检查失败显示
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有访问教材管理页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">教材管理</h1>
          <p className="mt-2 text-gray-600">管理学校教材信息，包括添加、编辑、删除和购买功能</p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索教材名称或类型..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {canAdd && (
              <button
                onClick={handleAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                新增教材
              </button>
            )}
          </div>
        </div>

        {/* 教材列表 */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Board
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTextbooks.map((textbook) => (
                    <tr key={textbook.textbook_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{textbook.name}</div>
                          <div className="text-sm text-gray-500">{textbook.type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {textbook.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{textbook.price}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {textbook.inventory_info.map((inventory) => (
                            <div key={inventory.campus_id}>
                              <span>{inventory.campus_name}:</span>
                              <span className={inventory.inventory > 0 ? 'text-green-600' : 'text-red-600'}>
                                {inventory.inventory}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEditModal(textbook)}
                              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteModal(textbook)}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  显示 {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50 条/页</option>
                  <option value={100}>100 条/页</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  上一页
                </button>

                {/* 页码按钮 */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 7;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    // 第一页
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="w-8 h-8 flex items-center justify-center text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="start-ellipsis" className="px-2 text-gray-400">...</span>
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
                            i === currentPage
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
                          <span key="end-ellipsis" className="px-2 text-gray-400">...</span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="w-8 h-8 flex items-center justify-center text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  下一页
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新增教材模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">新增教材</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教材名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教材类型
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    价格
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* 校区库存信息 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    校区库存
                  </label>
                  <div className="space-y-2">
                    {campusList.map((campus) => (
                      <div key={campus.id} className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 w-20">{campus.name}:</label>
                        <input
                          type="number"
                          value={formData.inventory_info[campus.id] || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            inventory_info: {
                              ...formData.inventory_info,
                              [campus.id]: parseInt(e.target.value) || 0
                            }
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddTextbook}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  新增
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑教材模态框 */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">编辑教材</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教材名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教材类型
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    价格
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* 校区库存信息 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    校区库存
                  </label>
                  <div className="space-y-2">
                    {Object.entries(campusInfo).map(([campusId, campusName]) => (
                      <div key={campusId} className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 w-20">{campusName}:</label>
                        <input
                          type="number"
                          value={formData.inventory_info[parseInt(campusId)] || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            inventory_info: {
                              ...formData.inventory_info,
                              [parseInt(campusId)]: parseInt(e.target.value) || 0
                            }
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleEditTextbook}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && deletingTextbook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-red-600">确认删除</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium">确认删除教材？</p>
                    <p className="text-gray-600 text-sm mt-1">
                      您即将删除教材 <strong>{deletingTextbook.name}</strong>。此操作无法撤销。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteTextbook}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
