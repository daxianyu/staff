'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  Button, 
  Input, 
  CheckBox, 
  AlertDialog, 
  Switch,
  PermissionGuard 
} from '@/components';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// 模拟数据类型
interface DemoItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  category: string;
  createdAt: string;
  description: string;
}

// 模拟数据
const mockData: DemoItem[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    status: 'active',
    category: '类别A',
    createdAt: '2024-01-15',
    description: '这是一个示例描述'
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    status: 'inactive',
    category: '类别B',
    createdAt: '2024-01-14',
    description: '另一个示例描述'
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    status: 'active',
    category: '类别A',
    createdAt: '2024-01-13',
    description: '第三个示例描述'
  }
];

const categories = ['全部', '类别A', '类别B', '类别C'];
const statusOptions = ['全部', 'active', 'inactive'];

export default function DemoPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<DemoItem[]>(mockData);
  const [filteredItems, setFilteredItems] = useState<DemoItem[]>(mockData);
  
  // 弹窗状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<DemoItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string>('');

  // 筛选条件
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '类别A',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  // 筛选逻辑
  useEffect(() => {
    let filtered = items;

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 类别筛选
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // 状态筛选
    if (selectedStatus !== '全部') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // 高级筛选：只显示活跃用户
    if (showActiveOnly) {
      filtered = filtered.filter(item => item.status === 'active');
    }

    setFilteredItems(filtered);
    setCurrentPage(1); // 筛选后重置到第一页
  }, [items, searchTerm, selectedCategory, selectedStatus, showActiveOnly]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      category: '类别A',
      description: '',
      status: 'active'
    });
  };

  // 创建项目
  const handleCreate = () => {
    const newItem: DemoItem = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setItems([...items, newItem]);
    setCreateDialogOpen(false);
    resetForm();
  };

  // 编辑项目
  const handleEdit = (item: DemoItem) => {
    setCurrentEditItem(item);
    setFormData({
      name: item.name,
      email: item.email,
      category: item.category,
      description: item.description,
      status: item.status
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (currentEditItem) {
      setItems(items.map(item => 
        item.id === currentEditItem.id 
          ? { ...item, ...formData }
          : item
      ));
      setEditDialogOpen(false);
      setCurrentEditItem(null);
      resetForm();
    }
  };

  // 删除项目
  const handleDelete = (id: string) => {
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setItems(items.filter(item => item.id !== deleteItemId));
    setDeleteDialogOpen(false);
    setDeleteItemId('');
  };

  // 清除筛选
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('全部');
    setSelectedStatus('全部');
    setShowActiveOnly(false);
    setShowAdvancedFilters(false);
  };

  return (
    <PermissionGuard permissionCode={PERMISSIONS.VIEW_DEMO}>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题和创建按钮 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Demo页面</h1>
                <p className="text-gray-600 mt-1">基于Radix UI的完整CRUD演示页面</p>
              </div>
              <PermissionGuard permissionCode={PERMISSIONS.CREATE_DEMO}>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  icon={<PlusIcon className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  创建新项目
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {/* 筛选区域 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索姓名、邮箱或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 类别筛选 */}
                <Select.Root value={selectedCategory} onValueChange={setSelectedCategory}>
                  <Select.Trigger className="flex items-center justify-between w-full sm:w-32 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDownIcon className="w-4 h-4" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <Select.Viewport className="p-1">
                        {categories.map((category) => (
                          <Select.Item
                            key={category}
                            value={category}
                            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none rounded"
                          >
                            <Select.ItemText>{category}</Select.ItemText>
                            <Select.ItemIndicator className="ml-auto">
                              <CheckIcon className="w-4 h-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                {/* 状态筛选 */}
                <Select.Root value={selectedStatus} onValueChange={setSelectedStatus}>
                  <Select.Trigger className="flex items-center justify-between w-full sm:w-32 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDownIcon className="w-4 h-4" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <Select.Viewport className="p-1">
                        {statusOptions.map((status) => (
                          <Select.Item
                            key={status}
                            value={status}
                            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none rounded"
                          >
                            <Select.ItemText>{status}</Select.ItemText>
                            <Select.ItemIndicator className="ml-auto">
                              <CheckIcon className="w-4 h-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  icon={<FunnelIcon className="w-4 h-4" />}
                  iconPosition="left"
                >
                  高级筛选
                  {showAdvancedFilters ? 
                    <ChevronUpIcon className="w-4 h-4 ml-1" /> : 
                    <ChevronDownIcon className="w-4 h-4 ml-1" />
                  }
                </Button>
              </div>
            </div>

            {/* 高级筛选 */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Switch
                    checked={showActiveOnly}
                    onCheckedChange={setShowActiveOnly}
                    label="仅显示活跃用户"
                    description="只显示状态为活跃的用户"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    清除筛选
                  </Button>
                </div>
              </div>
            )}

            {/* 筛选结果统计 */}
            <div className="mt-4 text-sm text-gray-600">
              显示 {filteredItems.length} 条结果，共 {items.length} 条数据
            </div>
          </div>

          {/* 列表区域 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 桌面端表格 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类别
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'active' ? '活跃' : '非活跃'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <PermissionGuard permissionCode={PERMISSIONS.EDIT_DEMO}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            icon={<PencilIcon className="w-4 h-4" />}
                          />
                        </PermissionGuard>
                        <PermissionGuard permissionCode={PERMISSIONS.DELETE_DEMO}>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(item.id)}
                            icon={<TrashIcon className="w-4 h-4" />}
                          />
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片 */}
            <div className="lg:hidden">
              {currentItems.map((item) => (
                <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.email}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <PermissionGuard permissionCode={PERMISSIONS.EDIT_DEMO}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          icon={<PencilIcon className="w-4 h-4" />}
                        />
                      </PermissionGuard>
                      <PermissionGuard permissionCode={PERMISSIONS.DELETE_DEMO}>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item.id)}
                          icon={<TrashIcon className="w-4 h-4" />}
                        />
                      </PermissionGuard>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'active' ? '活跃' : '非活跃'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <p className="text-xs text-gray-400">{item.createdAt}</p>
                </div>
              ))}
            </div>

            {/* 空状态 */}
            {currentItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">暂无数据</div>
                <p className="text-sm text-gray-400">
                  {filteredItems.length === 0 && items.length > 0 
                    ? '没有符合筛选条件的数据，试试调整筛选条件' 
                    : '还没有创建任何项目，点击"创建新项目"开始吧'
                  }
                </p>
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  显示第 {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} 条，共 {filteredItems.length} 条
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
      </div>

      {/* 创建/编辑弹窗 */}
      <Dialog.Root 
        open={createDialogOpen || editDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setCurrentEditItem(null);
            resetForm();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {editDialogOpen ? '编辑项目' : '创建新项目'}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm">
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <Input
                  label="姓名"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">类别</label>
                  <Select.Root value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <Select.Value />
                      <Select.Icon>
                        <ChevronDownIcon className="w-4 h-4" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <Select.Viewport className="p-1">
                          {categories.filter(cat => cat !== '全部').map((category) => (
                            <Select.Item
                              key={category}
                              value={category}
                              className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none rounded"
                            >
                              <Select.ItemText>{category}</Select.ItemText>
                              <Select.ItemIndicator className="ml-auto">
                                <CheckIcon className="w-4 h-4" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">描述</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="请输入描述"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <CheckBox
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                  label="状态：活跃"
                  description="勾选表示用户处于活跃状态"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Dialog.Close asChild>
                  <Button variant="outline" className="flex-1">取消</Button>
                </Dialog.Close>
                <Button 
                  onClick={editDialogOpen ? handleUpdate : handleCreate}
                  className="flex-1"
                  disabled={!formData.name || !formData.email}
                >
                  {editDialogOpen ? '更新' : '创建'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除"
        description="确定要删除这个项目吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </PermissionGuard>
  );
} 