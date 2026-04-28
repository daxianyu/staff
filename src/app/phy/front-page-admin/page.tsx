'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  NewspaperIcon,
  InformationCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { uploadImage } from '@/services/modules/frontPage';
import {
  getPhySiteInfo,
  updatePhyCourses,
  deletePhyCourses,
  updatePhyAboutUs,
  deletePhyAboutUs,
  updatePhyCoursesInfo,
  deletePhyCoursesInfo,
  updatePhyNews,
  deletePhyNews,
  type PhySiteInfo,
  type PhyNewsItem,
  type PhyAboutUsItem,
  type PhyCourseItem,
  type PhyCourseInfoItem,
  type PhyTeacherItem,
  type UpdatePhyCoursesParams,
  type UpdatePhyAboutUsParams,
  type UpdatePhyCoursesInfoParams,
  type UpdatePhyNewsParams,
} from '@/services/modules/phyFrontPage';

// 对应 phy-website /aboutus 的 4 个子页面
// type 与后端 aboutus_type 数字键一一对应
const ABOUTUS_SECTIONS = [
  { type: 1, label: '校园概况', desc: '对应 /aboutus/overview' },
  { type: 2, label: '办学理念', desc: '对应 /aboutus/philosophy' },
  { type: 3, label: '办学特色', desc: '对应 /aboutus/feature' },
] as const;

// 对应 phy-website /courses 的 2 个科目类型
const COURSES_INFO_SECTIONS = [
  { type: 'igcse',   label: 'IGCSE',   desc: '对应 /courses/igcse' },
  { type: 'alevel',  label: 'A-Level', desc: '对应 /courses/alevel' },
] as const;

type TabKey = 'news' | 'aboutus' | 'teachers' | 'courses';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'news',     label: '最新动态', icon: <NewspaperIcon className="w-4 h-4" /> },
  { key: 'aboutus',  label: '关于我们', icon: <InformationCircleIcon className="w-4 h-4" /> },
  { key: 'teachers', label: '师资团队', icon: <UserGroupIcon className="w-4 h-4" /> },
  { key: 'courses',  label: '课程设置', icon: <AcademicCapIcon className="w-4 h-4" /> },
];

// ---- 公用：图片上传字段 ----
function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const res = await uploadImage(file);
    setUploading(false);
    if (res.code === 200 && res.data?.url) {
      onChange(res.data.url);
    } else {
      setUploadError(res.message || '上传失败');
    }
    // reset input 以便重复选同一文件
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">封面图</label>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg disabled:opacity-50 transition-colors"
        >
          {uploading ? '上传中…' : '选择图片'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {value ? (
          <span className="text-xs text-gray-400 truncate flex-1 select-none" title={value}>
            {value}
          </span>
        ) : (
          <span className="text-xs text-gray-300 italic">未选择图片</span>
        )}
      </div>
      {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
      {value && (
        <div className="mt-2 relative inline-block">
          <img
            src={value}
            alt="封面预览"
            className="h-24 rounded border border-gray-200 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs leading-none"
            title="移除图片"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ---- 公用：删除确认弹窗 ----
function DeleteConfirmModal({
  label,
  onConfirm,
  onCancel,
  loading,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">确认删除</h3>
            <p className="text-sm text-gray-500 mt-1">确定删除「{label}」？此操作不可撤销。</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            取消
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {loading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 公用：section 容器 ----
function SectionCard({
  title,
  desc,
  onAdd,
  children,
}: {
  title: string;
  desc?: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> 新增
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ========== 最新动态 Tab ==========
// 只读，按 news_type 分组展示
// 最新动态的三个固定分类
const NEWS_SECTIONS = [
  { key: 'news',     label: '校区新闻',  newsType: 0 },
  { key: 'dynamic',  label: '校区动态',  newsType: 1 },
  { key: 'activity', label: '校区活动',  newsType: 2 },
] as const;

type NewsFormData = UpdatePhyNewsParams & { _recordId?: number };

function NewsSectionBlock({
  label,
  newsType,
  items,
  onRefresh,
}: {
  label: string;
  newsType: number;
  items: PhyNewsItem[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  /** 编辑时记录旧记录 id，用于先删后增 */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhyNewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = (): NewsFormData => ({
    news_title: '', news_cover: '', news_desc: '', news_link: '', tag: '', news_type: newsType, show_home_page: 1,
  });
  const [formData, setFormData] = useState<NewsFormData>(emptyForm());

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setError('');
    setShowModal(true);
  };

  const openEdit = (item: PhyNewsItem) => {
    const id = item.id ?? item.record_id ?? null;
    setEditingId(id);
    setFormData({
      news_title:    item.title,
      news_cover:    item.cover_url ?? item.coverUrl ?? '',
      news_desc:     item.news_desc ?? item.summary ?? '',
      news_link:     item.link_url ?? item.link ?? '',
      tag:           item.tag ?? '',
      news_type:     newsType,
      show_home_page: item.show_home_page ?? 1,
    });
    setError('');
    setShowModal(true);
  };

  /** 后端无 UPDATE，编辑时先删旧记录再插入新记录 */
  const handleSave = async () => {
    if (!formData.news_title.trim()) { setError('标题为必填'); return; }
    setSaving(true); setError('');
    if (editingId !== null) {
      const delRes = await deletePhyNews(editingId);
      if (delRes.code !== 200) { setSaving(false); setError(delRes.message || '删除旧记录失败'); return; }
    }
    const { _recordId, ...params } = formData;
    const res = await updatePhyNews({ ...params, news_type: newsType });
    setSaving(false);
    if (res.code === 200) { setShowModal(false); onRefresh(); }
    else setError(res.message || '保存失败');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id ?? deleteTarget.record_id;
    if (!id) return;
    setDeleting(true);
    const res = await deletePhyNews(id);
    setDeleting(false);
    if (res.code === 200) { setDeleteTarget(null); onRefresh(); }
  };

  const field = (key: keyof NewsFormData, fieldLabel: string, placeholder?: string, textarea?: boolean) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{fieldLabel}</label>
      {textarea ? (
        <textarea
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={String(formData[key] ?? '')}
          onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
        />
      ) : (
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={String(formData[key] ?? '')}
          onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <SectionCard title={label} desc={`共 ${items.length} 条`} onAdd={openAdd}>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => {
            const itemId = item.id ?? item.record_id;
            const cover  = item.cover_url ?? item.coverUrl;
            const desc   = item.news_desc ?? item.summary;
            const link   = item.link_url ?? item.link;
            return (
              <div key={itemId ?? idx} className="py-3 flex gap-3 items-start">
                {cover && (
                  <img
                    src={cover}
                    alt={item.title}
                    className="w-16 h-12 object-cover rounded flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-gray-800 truncate">{item.title}</div>
                  {item.tag && <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mr-1">{item.tag}</span>}
                  {desc && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{desc}</div>}
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block mt-0.5">
                      {link}
                    </a>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    onClick={() => openEdit(item)}
                    title="编辑"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    onClick={() => setDeleteTarget(item)}
                    title="删除"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新增 / 编辑 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-base font-semibold text-gray-800">
                {editingId !== null ? `编辑${label}` : `新增${label}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {editingId !== null && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
                  后端不支持直接修改，保存时将先删除旧记录再新增。
                </p>
              )}
              {field('news_title', '标题 *', '请输入标题')}
              <ImageUploadField
                value={formData.news_cover}
                onChange={(url) => setFormData((p) => ({ ...p, news_cover: url }))}
              />
              {field('news_desc', '摘要', '请输入内容摘要', true)}
              {field('news_link', '跳转链接', 'https://')}
              {field('tag', '标签', '如：国际教育')}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">是否展示在首页</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={formData.show_home_page}
                  onChange={(e) => setFormData((p) => ({ ...p, show_home_page: Number(e.target.value) }))}
                >
                  <option value={1}>是</option>
                  <option value={0}>否</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <DeleteConfirmModal
          label={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </SectionCard>
  );
}

function NewsTabWithRefresh({ items, onRefresh }: { items: PhyNewsItem[]; onRefresh: () => void }) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div>
      {NEWS_SECTIONS.map(({ key, label, newsType }) => (
        <NewsSectionBlock
          key={key}
          label={label}
          newsType={newsType}
          items={safeItems.filter((n) => n.news_type === newsType)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

// ========== 关于我们 Tab ==========
// 4 个固定模块，每个模块对应 aboutus 的一个 type

function AboutUsSectionItems({
  sectionType,
  items,
  onRefresh,
}: {
  sectionType: number;
  items: PhyAboutUsItem[];
  typeOptions?: { id: number | string; name: string }[];
  onRefresh: () => void;
}) {
  const sectionItems = items.filter((i) => Number(i.type) === sectionType);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PhyAboutUsItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhyAboutUsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<UpdatePhyAboutUsParams>({
    title: '', desc: '', link: '', href: '', type: sectionType,
  });
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormData({ title: '', desc: '', link: '', href: '', type: sectionType });
    setError('');
    setShowModal(true);
  };

  const openEdit = (item: PhyAboutUsItem) => {
    setEditItem(item);
    setFormData({ title: item.title, desc: item.desc || '', link: item.link || '', href: item.href || '', type: sectionType, record_id: item.record_id });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { setError('标题为必填'); return; }
    setSaving(true); setError('');
    const res = await updatePhyAboutUs(formData);
    setSaving(false);
    if (res.code === 200) { setShowModal(false); onRefresh(); }
    else setError(res.message || '保存失败');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deletePhyAboutUs((deleteTarget.id ?? deleteTarget.record_id)!);
    setDeleting(false);
    if (res.code === 200) { setDeleteTarget(null); onRefresh(); }
  };

  return (
    <>
      {sectionItems.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无数据，点击「新增」添加</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {sectionItems.map((item) => (
            <div key={item.id ?? item.record_id} className="py-3 flex gap-3 items-start">
              {item.link && (
                <img src={item.link} alt={item.title} className="w-16 h-12 object-cover rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.desc}</div>
                {item.href && <div className="text-xs text-blue-500 mt-0.5 truncate">{item.href}</div>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">{editItem ? '编辑' : '新增'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {error && <p className="text-sm text-red-500">{error}</p>}
              {([
                { key: 'title' as const, label: '标题 *' },
                { key: 'desc' as const, label: '描述' },
                { key: 'link' as const, label: '图片链接（link）' },
                { key: 'href' as const, label: '跳转链接（href）' },
              ]).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm text-gray-600 mb-1 block">{label}</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData[key]}
                    onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          label={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

function AboutUsTab({
  items,
  onRefresh,
}: {
  items: PhyAboutUsItem[];
  typeOptions: { id: number | string; name: string }[];
  onRefresh: () => void;
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div>
      {ABOUTUS_SECTIONS.map((sec) => (
        <SectionCard
          key={sec.type}
          title={sec.label}
          desc={sec.desc}
          onAdd={undefined}
        >
          <AboutUsSectionItemsWithAdd
            sectionType={sec.type}
            sectionLabel={sec.label}
            items={safeItems.filter((i) => Number(i.type) === sec.type)}
            onRefresh={onRefresh}
          />
        </SectionCard>
      ))}
    </div>
  );
}

// 带「新增」按钮的 wrapper
function AboutUsSectionItemsWithAdd(props: {
  /** 对应后端 aboutus.type 数字值 */
  sectionType: number;
  sectionLabel: string;
  items: PhyAboutUsItem[];
  onRefresh: () => void;
}) {
  const { sectionType, sectionLabel, items, onRefresh } = props;

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PhyAboutUsItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhyAboutUsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<UpdatePhyAboutUsParams>({
    title: '', desc: '', link: '', href: '', type: sectionType,
  });
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormData({ title: '', desc: '', link: '', href: '', type: sectionType });
    setError('');
    setShowModal(true);
  };
  const openEdit = (item: PhyAboutUsItem) => {
    setEditItem(item);
    setFormData({ title: item.title, desc: item.desc || '', link: item.link || '', href: item.href || '', type: sectionType, record_id: item.record_id });
    setError('');
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!formData.title.trim()) { setError('标题为必填'); return; }
    setSaving(true); setError('');
    const res = await updatePhyAboutUs(formData);
    setSaving(false);
    if (res.code === 200) { setShowModal(false); onRefresh(); }
    else setError(res.message || '保存失败');
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const rid = deleteTarget.id ?? deleteTarget.record_id;
    if (!rid) return;
    setDeleting(true);
    const res = await deletePhyAboutUs(rid);
    setDeleting(false);
    if (res.code === 200) { setDeleteTarget(null); onRefresh(); }
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={openAdd} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> 新增{sectionLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item: PhyAboutUsItem) => (
            <div key={item.id ?? item.record_id} className="py-3 flex gap-3 items-start">
              {item.link && (
                <img src={item.link} alt={item.title} className="w-16 h-12 object-cover rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.desc}</div>
                {item.href && <div className="text-xs text-blue-500 mt-0.5 truncate">{item.href}</div>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">{editItem ? `编辑${sectionLabel}` : `新增${sectionLabel}`}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {error && <p className="text-sm text-red-500">{error}</p>}
              {([
                { key: 'title' as const, label: '标题 *' },
                { key: 'desc' as const, label: '描述' },
                { key: 'link' as const, label: '图片链接（link）' },
                { key: 'href' as const, label: '跳转链接（href）' },
              ]).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm text-gray-600 mb-1 block">{label}</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData[key]}
                    onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          label={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

// ========== 师资团队 Tab ==========
function TeachersTab({ items }: { items: PhyTeacherItem[] }) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <SectionCard title="师资团队" desc="数据由师资管理模块维护，此处只读展示">
      {safeItems.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {safeItems.map((item, idx) => (
            <div key={item.record_id ?? item.id ?? idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              {(item.coverUrl || item.teacher_photo) && (
                <img
                  src={item.coverUrl || item.teacher_photo}
                  alt={item.teacher_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{item.teacher_name ?? item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.teacher_title ?? item.desc}</div>
                {item.teacher_responsible && (
                  <div className="text-xs text-blue-500 mt-0.5 truncate">{item.teacher_responsible}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ========== 课程设置 Tab ==========
// 包含 3 个子模块：首页课程卡片 | IGCSE科目 | A-Level科目

function CoursesCardsSection({
  items,
  onRefresh,
}: {
  items: PhyCourseItem[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PhyCourseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhyCourseItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<UpdatePhyCoursesParams>({ title: '', summary: '', coverUrl: '', buttonText: '', link: '' });
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormData({ title: '', summary: '', coverUrl: '', buttonText: '', link: '' });
    setError('');
    setShowModal(true);
  };
  const openEdit = (item: PhyCourseItem) => {
    setEditItem(item);
    setFormData({ title: item.title, summary: item.summary || '', coverUrl: item.coverUrl || '', buttonText: item.buttonText || '', link: item.link || '', record_id: item.record_id });
    setError('');
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.summary.trim() || !formData.coverUrl.trim() || !formData.buttonText.trim() || !formData.link.trim()) {
      setError('所有字段均为必填');
      return;
    }
    setSaving(true); setError('');
    const res = await updatePhyCourses(formData);
    setSaving(false);
    if (res.code === 200) { setShowModal(false); onRefresh(); }
    else setError(res.message || '保存失败');
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deletePhyCourses(deleteTarget.record_id);
    setDeleting(false);
    if (res.code === 200) { setDeleteTarget(null); onRefresh(); }
  };

  return (
    <SectionCard title="首页课程卡片" desc="对应官网首页「课程设置」区块的大卡片（/courses）" onAdd={openAdd}>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.record_id} className="border border-gray-200 rounded-lg overflow-hidden">
              {item.coverUrl && (
                <img src={item.coverUrl} alt={item.title} className="w-full h-28 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="p-3">
                <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.summary}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5">{item.buttonText}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(item)} className="w-7 h-7 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">{editItem ? '编辑课程卡片' : '新增课程卡片'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {error && <p className="text-sm text-red-500">{error}</p>}
              {([
                { key: 'title' as const,      label: '标题 *' },
                { key: 'summary' as const,    label: '摘要 *' },
                { key: 'coverUrl' as const,   label: '封面图 URL *' },
                { key: 'buttonText' as const, label: '按钮文字 *' },
                { key: 'link' as const,       label: '链接 *' },
              ]).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm text-gray-600 mb-1 block">{label}</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData[key]}
                    onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          label={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </SectionCard>
  );
}

function CoursesInfoSection({
  courseType,
  label,
  desc,
  items,
  onRefresh,
}: {
  courseType: string;
  label: string;
  desc: string;
  items: PhyCourseInfoItem[];
  onRefresh: () => void;
}) {
  const sectionItems = items.filter((i) => i.type === courseType);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PhyCourseInfoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhyCourseInfoItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<UpdatePhyCoursesInfoParams>({ type: courseType, cn_name: '', en_name: '' });
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormData({ type: courseType, cn_name: '', en_name: '' });
    setError('');
    setShowModal(true);
  };
  const openEdit = (item: PhyCourseInfoItem) => {
    setEditItem(item);
    setFormData({ type: item.type, cn_name: item.cn_name, en_name: item.en_name || '', record_id: item.record_id });
    setError('');
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!formData.cn_name.trim()) { setError('中文名称为必填'); return; }
    setSaving(true); setError('');
    const res = await updatePhyCoursesInfo(formData);
    setSaving(false);
    if (res.code === 200) { setShowModal(false); onRefresh(); }
    else setError(res.message || '保存失败');
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deletePhyCoursesInfo(deleteTarget.record_id);
    setDeleting(false);
    if (res.code === 200) { setDeleteTarget(null); onRefresh(); }
  };

  return (
    <SectionCard title={label} desc={desc} onAdd={openAdd}>
      {sectionItems.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {sectionItems.map((item) => (
            <div key={item.record_id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium text-sm text-gray-800">{item.cn_name}</span>
                {item.en_name && <span className="ml-2 text-xs text-gray-400">{item.en_name}</span>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(item)} className="w-7 h-7 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100">
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">{editItem ? `编辑${label}科目` : `新增${label}科目`}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">中文名称 *</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.cn_name}
                  onChange={(e) => setFormData((p) => ({ ...p, cn_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">英文名称</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.en_name}
                  onChange={(e) => setFormData((p) => ({ ...p, en_name: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          label={deleteTarget.cn_name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </SectionCard>
  );
}

function CoursesTab({
  courses,
  coursesInfo,
  onRefresh,
}: {
  courses: PhyCourseItem[];
  coursesInfo: PhyCourseInfoItem[];
  onRefresh: () => void;
}) {
  return (
    <div>
      {/* 首页课程大卡片 */}
      <CoursesCardsSection items={Array.isArray(courses) ? courses : []} onRefresh={onRefresh} />

      {/* IGCSE / A-Level 科目列表 */}
      {COURSES_INFO_SECTIONS.map((sec) => (
        <CoursesInfoSection
          key={sec.type}
          courseType={sec.type}
          label={sec.label}
          desc={sec.desc}
          items={Array.isArray(coursesInfo) ? coursesInfo : []}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

// ========== 主页面 ==========
export default function PhyFrontPageAdmin() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('news');
  const [loading, setLoading] = useState(true);
  const [siteInfo, setSiteInfo] = useState<PhySiteInfo | null>(null);

  const canEdit = hasPermission(PERMISSIONS.EDIT_FRONT_PAGE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getPhySiteInfo();
    setLoading(false);
    if (res.code === 200 && res.data) setSiteInfo(res.data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">权限不足，无法访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">PHY 官网首页管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理浦华曜ONE官网各模块内容</p>
        </div>

        {/* Tab 导航 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'news' && (
              <NewsTabWithRefresh
                items={siteInfo?.news ?? []}
                onRefresh={fetchData}
              />
            )}
            {activeTab === 'aboutus' && (
              <AboutUsTab
                items={siteInfo?.aboutus ?? []}
                typeOptions={siteInfo?.aboutus_type ?? []}
                onRefresh={fetchData}
              />
            )}
            {activeTab === 'teachers' && (
              <TeachersTab items={siteInfo?.teachers ?? []} />
            )}
            {activeTab === 'courses' && (
              <CoursesTab
                courses={siteInfo?.courses ?? []}
                coursesInfo={siteInfo?.courses_info ?? []}
                onRefresh={fetchData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
