'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getNoticeList,
  addNotice,
  editNotice,
  changeNoticeRight,
  uploadNoticeFile,
  getAllCampuses,
  type NoticeItem,
} from '@/services/auth';
import { getApiBaseUrl } from '@/config/env';
import {
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import SimpleMarkdownEditor from '@/components/markdown/SimpleMarkdownEditor';

const getFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

/** 纯 HTML 旧公告：相对路径 img/a 补全为当前 API 域名可访问地址 */
function rewriteRelativeMediaInHtml(html: string, resolve: (path: string) => string): string {
  if (typeof document === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('img[src]').forEach((el) => {
      const src = el.getAttribute('src')?.trim() ?? '';
      if (!src || /^https?:|^data:|^blob:|^\/\//i.test(src)) return;
      el.setAttribute('src', resolve(src));
    });
    doc.querySelectorAll('a[href]').forEach((el) => {
      const href = el.getAttribute('href')?.trim() ?? '';
      if (!href || /^https?:|^mailto:|^#|^\/\//i.test(href)) return;
      el.setAttribute('href', resolve(href));
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/** 明显含 Markdown 时优先 MD 渲染（避免整段被误判成 HTML，图片变成纯文本） */
function preferMarkdownRendering(s: string): boolean {
  if (/!\[[^\]]*\]\([^)]*\)/.test(s)) return true;
  if (/(^|\n)\s*#{1,6}(?:\s|$)/m.test(s)) return true;
  if (/```[\s\S]*?```/.test(s)) return true;
  return false;
}

/** 旧数据可能为 HTML；新公告为 Markdown */
function NoticeContentBody({ content }: { content: string }) {
  const trimmed = (content || '').trim();
  const looksLikeHtml =
    /^<[a-z][\s\S]*>/i.test(trimmed) && /<\/[a-z][\s\S]*>/i.test(trimmed);

  if (looksLikeHtml && !preferMarkdownRendering(trimmed)) {
    const html = rewriteRelativeMediaInHtml(trimmed, getFileUrl);
    return (
      <div
        className="prose prose-sm max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <MarkdownContent content={content} resolveMediaUrl={getFileUrl} />;
}

// 毕业年选项（用于年级选择）
const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

export default function NoticeBoardPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_NOTICE_BOARD);
  const canEdit = hasPermission(PERMISSIONS.EDIT_NOTICE_BOARD);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [campusList, setCampusList] = useState<{ id: number; name: string }[]>([]);

  // 模态框
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rightModalOpen, setRightModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NoticeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<NoticeItem | null>(null);
  const [rightItem, setRightItem] = useState<NoticeItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCampusId, setFormCampusId] = useState<number>(1);
  const [rightVisibleTypes, setRightVisibleTypes] = useState<string[]>(['1', '2']);
  const [rightVisibleYears, setRightVisibleYears] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await getNoticeList();
      if (res.code === 200 && res.data) {
        setItems(res.data.rows || []);
      } else {
        setItems([]);
        setErrorMessage(res.message || '获取公告列表失败');
      }
    } catch (e) {
      console.error('获取公告列表失败:', e);
      setItems([]);
      setErrorMessage(e instanceof Error ? e.message : '获取公告列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCampuses = async () => {
    try {
      const res = await getAllCampuses();
      if (res.code === 200 && res.data) {
        const list = (res.data as any)?.campus_list ?? (Array.isArray(res.data) ? res.data : []);
        setCampusList(list);
        if (list.length > 0 && !formCampusId) setFormCampusId(list[0].id);
      }
    } catch (e) {
      console.error('获取校区列表失败:', e);
    }
  };

  useEffect(() => {
    loadData();
    if (canEdit) loadCampuses();
  }, [canEdit]);

  const filteredItems = items.filter(
    (item) =>
      !searchTerm.trim() ||
      (item.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const openAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormCampusId(campusList[0]?.id ?? 1);
    setModalOpen(true);
  };

  const openEdit = (item: NoticeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCampusId(1);
    setModalOpen(true);
  };

  const openDetail = (item: NoticeItem) => {
    setViewingItem(item);
    setDetailOpen(true);
  };

  const openRightModal = (item: NoticeItem) => {
    setRightItem(item);
    setRightVisibleTypes(['1', '2']);
    setRightVisibleYears([]);
    setRightModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setErrorMessage('请填写标题和内容');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const params = { title: formTitle.trim(), content: formContent, campus_id: formCampusId };
      const res = editingItem
        ? await editNotice({ ...params, record_id: editingItem.id })
        : await addNotice(params);
      if (res.code === 200) {
        setModalOpen(false);
        await loadData();
      } else {
        setErrorMessage(res.message || '操作失败');
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRight = async () => {
    if (!rightItem) return;
    if (rightVisibleTypes.includes('1') && rightVisibleYears.length === 0) {
      setErrorMessage('选择学生时请至少选择一个年级');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const visibleYears = rightVisibleTypes.includes('1')
        ? rightVisibleYears.join(',')
        : '-1';
      const res = await changeNoticeRight({
        record_id: rightItem.id,
        visible_types: rightVisibleTypes.join(','),
        visible_years: visibleYears,
      });
      if (res.code === 200) {
        setRightModalOpen(false);
        await loadData();
      } else {
        setErrorMessage(res.message || '修改权限失败');
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '修改权限失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">权限不足</h1>
          <p className="mt-2 text-gray-600">您没有权限查看公告板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notice Board 公告板</h1>
          <p className="mt-1 text-sm text-gray-600">校方通知与文件发布</p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索公告标题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              {canEdit && (
                <button
                  onClick={openAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增公告
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">暂无公告</div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => openDetail(item)}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{item.title}</span>
                      </div>
                      {item.create_time && (
                        <p className="mt-1 text-sm text-gray-500">{item.create_time}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openDetail(item)}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        查看
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="编辑"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openRightModal(item)}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            权限
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 新增/编辑模态框 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? '编辑公告' : '新增公告'}
              </h3>
              <button
                onClick={() => !submitting && setModalOpen(false)}
                disabled={submitting}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="公告标题"
                />
              </div>
              {canEdit && campusList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">校区</label>
                  <select
                    value={formCampusId}
                    onChange={(e) => setFormCampusId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {campusList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  正文（Markdown）
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  与知识库文章相同：工具栏插入标题/列表/链接等；支持拖拽或粘贴图片、上传附件，自动插入 Markdown。
                </p>
                <SimpleMarkdownEditor
                  value={formContent}
                  onChange={setFormContent}
                  disabled={submitting}
                  minHeightPx={340}
                  previewResolveMediaUrl={getFileUrl}
                  uploadFile={async (file) => {
                    const res = await uploadNoticeFile(file);
                    if (res.code === 200 && res.data?.file_path) {
                      return {
                        ok: true,
                        url: res.data.file_path,
                        name: file.name,
                      };
                    }
                    setErrorMessage(res.message || '上传失败');
                    return { ok: false, url: '', name: file.name };
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 查看详情模态框 */}
      {detailOpen && viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{viewingItem.title}</h3>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <NoticeContentBody content={viewingItem.content} />
              {viewingItem.update_time && (
                <p className="mt-4 text-sm text-gray-500">更新时间：{viewingItem.update_time}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 权限设置模态框 */}
      {rightModalOpen && rightItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">设置可见权限</h3>
              <button
                onClick={() => !submitting && setRightModalOpen(false)}
                disabled={submitting}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">可见对象</label>
                <div className="space-y-2">
                  {[
                    { value: '1', label: '学生' },
                    { value: '2', label: '教师' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rightVisibleTypes.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRightVisibleTypes([...rightVisibleTypes, opt.value]);
                          } else {
                            setRightVisibleTypes(rightVisibleTypes.filter((t) => t !== opt.value));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              {rightVisibleTypes.includes('1') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学生年级（毕业年，可多选）</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {GRADUATION_YEARS.map((year) => (
                      <label key={year} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={rightVisibleYears.includes(String(year))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRightVisibleYears([...rightVisibleYears, String(year)]);
                            } else {
                              setRightVisibleYears(rightVisibleYears.filter((y) => y !== String(year)));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setRightModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleChangeRight}
                disabled={submitting || rightVisibleTypes.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
