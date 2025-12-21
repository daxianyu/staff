'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import SearchableSelect from '@/components/SearchableSelect';
import {
  addGraduationWishesRecord,
  deleteGraduationWishesRecord,
  getGraduationSelect,
  getGraduationTable,
  type GraduationSelectResponse,
  type GraduationWishesRecordItem,
} from '@/services/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ConfirmState =
  | null
  | {
      title: string;
      message: string;
      confirmText: string;
      confirmButtonClass: string;
      onConfirm: () => Promise<void> | void;
    };

export default function GraduationWishesSendPage() {
  const { hasPermission } = useAuth();

  const canView = hasPermission(PERMISSIONS.VIEW_GRADUATION_WISHES);
  const canEdit = hasPermission(PERMISSIONS.EDIT_GRADUATION_WISHES);

  const [selectData, setSelectData] = useState<GraduationSelectResponse | null>(null);
  const [rows, setRows] = useState<GraduationWishesRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSelect, setLoadingSelect] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  // 0 表示“全部学生”
  const [filterStudentId, setFilterStudentId] = useState<number>(0);

  // 前端分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 添加记录模态框
  const [showAddModal, setShowAddModal] = useState(false);
  // 0 表示“未选择”
  const [formStudentId, setFormStudentId] = useState<number>(0);
  const [formTeacherIds, setFormTeacherIds] = useState<number[]>([]);

  // 二次确认（删除）
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  useEffect(() => {
    if (!canView) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStudentId, pageSize]);

  const loadAll = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      setLoadingSelect(true);
      const [selectRes, tableRes] = await Promise.all([getGraduationSelect(), getGraduationTable()]);

      if (selectRes.code === 200) {
        setSelectData(selectRes.data || { students: [], staff: [] });
      } else {
        setSelectData({ students: [], staff: [] });
        setErrorMsg(selectRes.message || '获取下拉选项失败');
      }

      if (tableRes.code === 200) {
        setRows(tableRes.data?.rows || []);
      } else {
        setRows([]);
        setErrorMsg(prev => prev || tableRes.message || '获取表格失败');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setLoadingSelect(false);
    }
  };

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows
      .filter(r => (filterStudentId === 0 ? true : r.student_id === filterStudentId))
      .filter(r => {
        if (!term) return true;
        return (
          r.student_name?.toLowerCase().includes(term) ||
          r.teacher_name?.toLowerCase().includes(term) ||
          r.wishes?.toLowerCase().includes(term)
        );
      });
  }, [rows, filterStudentId, searchTerm]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const resetAddForm = () => {
    setFormStudentId(0);
    setFormTeacherIds([]);
  };

  const openAdd = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const submitAdd = async () => {
    if (!canEdit) return;
    if (!formStudentId) {
      alert('请选择学生');
      return;
    }
    if (formTeacherIds.length === 0) {
      alert('请选择至少1位老师');
      return;
    }

    try {
      const res = await addGraduationWishesRecord({
        student_id: formStudentId,
        teacher_ids: formTeacherIds,
      });
      if (res.code === 200) {
        alert('发送成功（已创建毕业祝福记录）');
        setShowAddModal(false);
        await loadAll();
      } else {
        alert(res.message || '发送失败');
      }
    } catch (e) {
      console.error(e);
      alert('发送失败');
    }
  };

  const askDelete = (item: GraduationWishesRecordItem) => {
    if (!canEdit) return;
    setConfirmState({
      title: '确认删除',
      message: `确定要删除这条记录吗？（学生：${item.student_name}，老师：${item.teacher_name}）`,
      confirmText: '删除',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          const res = await deleteGraduationWishesRecord({ record_id: item.record_id });
          if (res.code === 200) {
            alert('删除成功');
            await loadAll();
          } else {
            alert(res.message || '删除失败');
          }
        } catch (e) {
          console.error(e);
          alert('删除失败');
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Graduation Wishes Details</h1>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-xl">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索学生/老师/祝福内容..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 h-10 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="min-w-[220px]">
                <SearchableSelect<number>
                  options={[
                    { id: 0, name: '全部学生' },
                    ...(selectData?.students || []),
                  ]}
                  value={filterStudentId}
                  onValueChange={(v) => setFilterStudentId(v as number)}
                  placeholder="筛选学生（可搜索）"
                  searchPlaceholder="搜索学生姓名..."
                  className="w-full h-10"
                  disabled={loadingSelect}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => void loadAll()}
                className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                刷新
              </button>
              <button
                onClick={openAdd}
                disabled={!canEdit || loadingSelect}
                className="h-10 inline-flex items-center gap-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                发送/分配
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      老师名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      责任导师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      wishes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发起时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新时间
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRows.map(item => (
                    <tr key={item.record_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.record_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.is_mentor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={item.wishes}>
                          {item.wishes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.create_time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.update_time}</td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.delete_flag === 1 ? (
                            <button
                              onClick={() => askDelete(item)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                              删除
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRows.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分页 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              显示第{' '}
              <span className="font-medium">
                {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{' '}
              - <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> 条，共{' '}
              <span className="font-medium">{totalItems}</span> 条记录
            </div>

            <div className="flex items-center gap-3 justify-end">
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {[50, 100, 200].map(s => (
                  <option key={s} value={s}>
                    {s}/页
                  </option>
                ))}
              </select>

              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <div className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* 添加记录模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">发送/分配毕业祝福填写任务</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
                <div className="text-sm text-gray-600">
                  说明：这里的“发送”是<strong>为学生创建老师填写毕业祝福的记录</strong>，并不会自动生成祝福内容。
                </div>

                {/* 学生选择 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">选择学生</label>
                  <SearchableSelect<number>
                    options={selectData?.students || []}
                    value={formStudentId}
                    onValueChange={(v) => setFormStudentId(v as number)}
                    placeholder="请选择学生..."
                    searchPlaceholder="搜索学生姓名..."
                    className="w-full"
                  />
                </div>

                {/* 老师选择 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-gray-700">选择老师（可多选）</label>
                    <div className="text-sm text-gray-600">已选 {formTeacherIds.length} 人</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTeacherIds([])}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      清空选择
                    </button>
                  </div>

                  <SearchableSelect<number>
                    options={selectData?.staff || []}
                    value={formTeacherIds}
                    onValueChange={(v) => setFormTeacherIds(v as number[])}
                    placeholder="请选择老师..."
                    searchPlaceholder="搜索老师姓名..."
                    multiple={true}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => void submitAdd()}
                  disabled={!canEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  确认发送
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {confirmState && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{confirmState.title}</h3>
                    <div className="mt-2 text-sm text-gray-600">{confirmState.message}</div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmState(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => void confirmState.onConfirm()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${confirmState.confirmButtonClass}`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


