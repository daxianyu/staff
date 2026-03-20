'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getStaffFeedback,
  updateStaffFeedback,
  type StaffFeedbackItem,
} from '@/services/auth';
import {
  PencilSquareIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

function getRecordId(item: StaffFeedbackItem): number | null {
  const raw =
    item.record_id ??
    (item as Record<string, unknown>).record_id ??
    (item as Record<string, unknown>).id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** 后端 note 字段在列表里为 feedback_info；更新接口参数名为 info */
function getFeedbackText(item: StaffFeedbackItem): string {
  const v = item.feedback_info ?? item.info;
  return v != null ? String(v) : '';
}

export default function MyFeedbackPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_MY_FEEDBACK);
  const canEdit = hasPermission(PERMISSIONS.EDIT_MY_FEEDBACK);

  const [items, setItems] = useState<StaffFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffFeedbackItem | null>(null);
  const [editInfo, setEditInfo] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await getStaffFeedback();
      if (res.code === 200 && res.data) {
        setItems(res.data);
      } else {
        setItems([]);
        setErrorMessage(res.message || '获取列表失败');
      }
    } catch (e) {
      setItems([]);
      setErrorMessage(e instanceof Error ? e.message : '获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const openEdit = (item: StaffFeedbackItem) => {
    setEditing(item);
    setEditInfo(getFeedbackText(item));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!editing || !canEdit) return;
    const recordId = getRecordId(editing);
    if (recordId === null) {
      alert('缺少记录 ID，无法保存');
      return;
    }
    setSaving(true);
    try {
      const res = await updateStaffFeedback({ record_id: recordId, info: editInfo });
      if (res.code === 200) {
        setItems((prev) =>
          prev.map((row) =>
            getRecordId(row) === recordId
              ? { ...row, feedback_info: editInfo, info: editInfo }
              : row
          )
        );
        setModalOpen(false);
        setEditing(null);
      } else {
        alert(res.message || '保存失败');
      }
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Feedback</h1>
          </div>
          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white bg-gray-50"
            disabled={loading}
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg shadow px-6 py-12 text-center text-gray-500 text-sm">
              暂无 Feedback
            </div>
          ) : (
            items.map((item, idx) => {
              const rid = getRecordId(item);
              const body = getFeedbackText(item);
              return (
                <article
                  key={rid != null ? `fb-${rid}` : `fb-idx-${idx}`}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-900">
                          <UserIcon className="h-4 w-4 shrink-0" />
                          {item.student_name ?? '未知学生'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="inline-flex items-center gap-1 text-sm text-gray-800">
                          <AcademicCapIcon className="h-4 w-4 text-gray-400 shrink-0" />
                          {item.class_name ?? '—'}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="inline-flex items-center gap-1 text-sm text-gray-800">
                          <BookOpenIcon className="h-4 w-4 text-gray-400 shrink-0" />
                          {item.topic_name ?? '—'}
                        </span>
                      </div>
                      {canEdit && rid != null ? (
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                          title="编辑 Feedback"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          编辑
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Feedback 内容
                      </p>
                      <div className="rounded-md bg-gray-50 px-3 py-3 text-sm text-gray-800 whitespace-pre-wrap break-words min-h-[3rem]">
                        {body ? body : <span className="text-gray-400">（尚未填写）</span>}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {modalOpen && editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-medium text-gray-900">编辑 Feedback</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {editing.student_name ?? '学生'} · {editing.class_name ?? ''} · {editing.topic_name ?? ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100 shrink-0"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <textarea
                value={editInfo}
                onChange={(e) => setEditInfo(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
