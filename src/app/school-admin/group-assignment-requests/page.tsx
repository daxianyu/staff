'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
  useRef,
  useDeferredValue,
  type UIEvent,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import {
  getGroupAssignmentList,
  deleteGroupAssignmentRequests,
  clearAllRequests,
  type GroupAssignmentRequest,
} from '@/services/auth';
import { ExcelExporter, convertObjectsToSheetData } from '@/components/ExcelExporter';

// 格式化时间戳为本地时间字符串
const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
};

// 格式化数字为字符串，处理null/undefined
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toLocaleString('zh-CN');
  return String(value);
};

const ROW_HEIGHT = 64;
const OVERSCAN_COUNT = 8;
const COLUMN_COUNT = 9;
const DEFAULT_VIEWPORT_HEIGHT = 600;

export default function GroupAssignmentRequestsPage() {
  const { hasPermission, user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<GroupAssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  // 模态框状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationFrame = useRef<number | undefined>(undefined);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);


  // 权限检查
  const canView = hasPermission(PERMISSIONS.EDIT_CLASSES) || hasPermission(PERMISSIONS.SALES_ADMIN);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // 切换单个行的选中状态
  const toggleRowSelection = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // 切换全选状态
  const toggleAllSelection = useCallback((checked: boolean, requests: GroupAssignmentRequest[]) => {
    startTransition(() => {
      if (checked) {
        setSelectedIds(new Set(requests.map(r => r.id)));
      } else {
        setSelectedIds(new Set());
      }
    });
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getGroupAssignmentList();

      if (response.code === 200 && response.data) {
        // 后端直接返回数组格式：{ status: 0, message: "", data: [...] }
        setRequests(response.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView, loadData]);

  // 搜索过滤数据
  const filteredRequests = useMemo(() => {
    if (!deferredSearchTerm.trim()) return requests;

    const term = deferredSearchTerm.toLowerCase();
    return requests.filter(request =>
      // 学生姓名搜索
      (request.first_name && request.first_name.toLowerCase().includes(term)) ||
      (request.last_name && request.last_name.toLowerCase().includes(term)) ||
      // 学生ID搜索
      String(request.student_id).includes(term) ||
      // 校区搜索
      (request.campus_name && request.campus_name.toLowerCase().includes(term)) ||
      (request.campus_id && String(request.campus_id).includes(term)) ||
      // 导师搜索
      (request.mentor_name && request.mentor_name.toLowerCase().includes(term)) ||
      (request.mentor_id && String(request.mentor_id).includes(term)) ||
      // 考试搜索
      (request.exam_name && request.exam_name.toLowerCase().includes(term)) ||
      (request.exam_id && String(request.exam_id).includes(term)) ||
      // 班级搜索
      (request.class_name && request.class_name.toLowerCase().includes(term)) ||
      // 科目搜索
      (user?.topics?.[String(request.topic_id)] && user.topics[String(request.topic_id)].toLowerCase().includes(term)) ||
      (request.topic_id && String(request.topic_id).includes(term)) ||
      // 备注搜索
      (request.note && request.note.toLowerCase().includes(term))
    );
  }, [requests, deferredSearchTerm, user]);

  const { visibleRequests, startIndex, topPaddingHeight, bottomPaddingHeight } = useMemo(() => {
    if (filteredRequests.length === 0) {
      return {
        visibleRequests: [] as GroupAssignmentRequest[],
        startIndex: 0,
        topPaddingHeight: 0,
        bottomPaddingHeight: 0,
      };
    }

    const safeViewportHeight = Math.max(viewportHeight, ROW_HEIGHT);
    const totalRows = filteredRequests.length;
    const totalHeight = totalRows * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_COUNT);
    const endIndex = Math.min(
      totalRows,
      Math.ceil((scrollTop + safeViewportHeight) / ROW_HEIGHT) + OVERSCAN_COUNT
    );

    const topPaddingHeight = startIndex * ROW_HEIGHT;
    const bottomPaddingHeight = Math.max(0, totalHeight - endIndex * ROW_HEIGHT);

    const visibleRequests = filteredRequests.slice(startIndex, endIndex);

    return { visibleRequests, startIndex, topPaddingHeight, bottomPaddingHeight };
  }, [filteredRequests, scrollTop, viewportHeight]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const currentTop = event.currentTarget.scrollTop;

    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current);
    }

    scrollAnimationFrame.current = requestAnimationFrame(() => {
      scrollAnimationFrame.current = undefined;
      setScrollTop(currentTop);
    });
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      const node = scrollContainerRef.current;
      if (node) {
        setViewportHeight(node.clientHeight || DEFAULT_VIEWPORT_HEIGHT);
      }
    };

    updateHeight();

    const node = scrollContainerRef.current;
    if (!node) return;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    setScrollTop(0);
    const node = scrollContainerRef.current;
    if (node) {
      node.scrollTop = 0;
    }
  }, [filteredRequests]);

  const selectedCountInFiltered = useMemo(() => {
    if (filteredRequests.length === 0) return 0;
    let count = 0;
    for (const request of filteredRequests) {
      if (selectedIds.has(request.id)) {
        count += 1;
      }
    }
    return count;
  }, [filteredRequests, selectedIds]);

  const allFilteredSelected =
    filteredRequests.length > 0 && selectedCountInFiltered === filteredRequests.length;

  // Excel导出数据准备
  const exportData = useMemo(() => {
    const headers = ['Student name', 'Campus', 'Mentor', 'Exam', 'Class', 'Subject', 'Signup time', 'Note'];

    const rows = filteredRequests.map(request => [
      `${request.last_name}${request.first_name}`,
      request.campus_name || request.campus_id || '-',
      request.mentor_name || '-',
      request.exam_name || 'NONE',
      request.class_name || '-',
      user?.topics?.[String(request.topic_id)] || request.topic_id || '-',
      formatTime(request.signup_time),
      request.note || '',
    ]);
    return convertObjectsToSheetData(rows, headers, 'Group Assignment Requests');
  }, [filteredRequests, user]);

  // 删除选中的请求
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    try {
      const response = await deleteGroupAssignmentRequests(Array.from(selectedIds).join(','));

      if (response.code === 200) {
        await loadData(); // 重新加载数据
        setSelectedIds(new Set());
        setShowDeleteModal(false);
        alert('删除成功');
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  }, [selectedIds, loadData]);

  // 清空所有请求
  const handleDeleteAll = useCallback(async () => {
    try {
      const response = await clearAllRequests();

      if (response.code === 200) {
        await loadData(); // 重新加载数据
        setSelectedIds(new Set());
        setShowDeleteAllModal(false);
        alert('清空成功');
      } else {
        alert(response.message || '清空失败');
      }
    } catch (error) {
      console.error('清空失败:', error);
      alert('清空失败，请重试');
    }
  }, [loadData]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问分组申请页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-900">Group Assignment Requests</h1>
              </div>
              <p className="mt-2 text-sm text-gray-600">学生选课申请管理</p>
            </div>
            <button
              onClick={() => router.push('/school-admin/ai-groups')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CpuChipIcon className="h-5 w-5" />
              AI排课
            </button>
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {/* Excel导出 */}
              <ExcelExporter
                config={{
                  filename: 'group_assignment_requests',
                  sheets: [exportData]
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Excel导出
              </ExcelExporter>

              {/* 删除选中 */}
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={selectedIds.size === 0 || isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4" />
                删除选中 ({selectedIds.size})
                {isPending && <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>}
              </button>

              {/* 清空全部 */}
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
              >
                <TrashIcon className="h-4 w-4" />
                清空全部
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]"
              >
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="w-6 px-1 py-3 text-center max-w-0">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => toggleAllSelection(e.target.checked, filteredRequests)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Student name
                      </th>
                      <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Campus
                      </th>
                      <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Mentor
                      </th>
                      <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Exam
                      </th>
                      <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Class
                      </th>
                      <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Subject
                      </th>
                      <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Signup time
                      </th>
                      <th className="w-40 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-0">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topPaddingHeight > 0 && (
                      <tr style={{ height: topPaddingHeight }}>
                        <td colSpan={COLUMN_COUNT} className="p-0" />
                      </tr>
                    )}

                    {visibleRequests.map((request, index) => {
                      const actualIndex = startIndex + index;
                      const isSelected = selectedIds.has(request.id);
                      const studentName =
                        `${request.last_name ?? ''}${request.first_name ?? ''}`.trim() || '-';
                      const topicLabel = user?.topics?.[String(request.topic_id)] ?? request.topic_id;
                      return (
                        <tr
                          key={request.id}
                          className={`${
                            actualIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-gray-50 transition-colors`}
                        >
                          <td className="w-6 px-1 py-4 text-center max-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleRowSelection(request.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td
                            className="w-28 px-2 py-4 text-sm text-gray-900 truncate max-w-0"
                            title={studentName}
                          >
                            {studentName}
                          </td>
                          <td
                            className="w-20 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatValue(request.campus_name || request.campus_id)}
                          >
                            {formatValue(request.campus_name || request.campus_id)}
                          </td>
                          <td
                            className="w-20 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatValue(request.mentor_name)}
                          >
                            {formatValue(request.mentor_name)}
                          </td>
                          <td
                            className="w-28 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatValue(request.exam_name || 'NONE')}
                          >
                            {formatValue(request.exam_name || 'NONE')}
                          </td>
                          <td
                            className="w-20 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatValue(request.class_name)}
                          >
                            {formatValue(request.class_name)}
                          </td>
                          <td
                            className="w-28 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatValue(topicLabel)}
                          >
                            {formatValue(topicLabel)}
                          </td>
                          <td
                            className="w-32 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatTime(request.signup_time)}
                          >
                            {formatTime(request.signup_time)}
                          </td>
                          <td
                            className="w-40 px-2 py-4 text-sm text-gray-500 truncate max-w-0"
                            title={formatValue(request.note)}
                          >
                            {formatValue(request.note)}
                          </td>
                        </tr>
                      );
                    })}

                    {bottomPaddingHeight > 0 && (
                      <tr style={{ height: bottomPaddingHeight }}>
                        <td colSpan={COLUMN_COUNT} className="p-0" />
                      </tr>
                    )}

                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={COLUMN_COUNT} className="px-4 py-6 text-center text-sm text-gray-500">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 记录统计 */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    共 {filteredRequests.length} 条记录
                    {searchTerm.trim() && `（搜索结果）`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">确认删除选中的 {selectedIds.size} 条记录？</h4>
                  <p className="mt-1 text-sm text-gray-500">此操作不可撤销，删除后数据将无法恢复。</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 清空全部确认模态框 */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">确认清空</h3>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">确认清空所有记录？</h4>
                  <p className="mt-1 text-sm text-gray-500">此操作不可撤销，将删除所有选课申请记录。</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
