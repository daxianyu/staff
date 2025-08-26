'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getExamEditInfo,
  editExam,
  type EditExamParams,
} from '@/services/auth';
import {
  ArrowLeftIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function EditExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);
  const examId = Number(searchParams.get('id')) || 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<EditExamParams>({
    record_id: 0,
    exam_name: '',
    base_price: 0,
    exam_location: '',
    exam_topic: '',
    exam_topic_id: 0,
    exam_code: '',
    period: 0,
    exam_type: 0,
    exam_time: 0,
    exam_time_2: 0,
    exam_time_3: 0,
    alipay_account: 0,
  });

  useEffect(() => {
    if (!canEdit || !examId) return;
    const fetchData = async () => {
      setLoading(true);
      const resp = await getExamEditInfo(examId);
      if (resp.code === 200 && resp.data) {
        const ed = resp.data.exam_data;
        setForm({
          record_id: ed.id,
          exam_name: ed.name || '',
          base_price: ed.base_price || 0,
          exam_location: ed.location || '',
          exam_topic: ed.topic || '',
          exam_topic_id: ed.topic_id || 0,
          exam_code: ed.code || '',
          period: ed.period || 0,
          exam_type: ed.type || 0,
          exam_time: ed.time || 0,
          exam_time_2: ed.time_2 || 0,
          exam_time_3: ed.time_3 || 0,
          alipay_account: ed.alipay_account || 0,
        });
      } else {
        setError(resp.message || 'Failed to load exam');
      }
      setLoading(false);
    };
    fetchData();
  }, [canEdit, examId]);

  const handleSave = async () => {
    setSaving(true);
    const resp = await editExam(form);
    setSaving(false);
    if (resp.code === 200) {
      router.push('/exam');
    } else {
      setError(resp.message || 'Failed to save exam');
    }
  };

  if (!canEdit) {
    return (
      <div className="p-6">
        <p className="text-gray-600">You don't have permission to edit exams</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/exam')}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="p-2 bg-blue-100 rounded-lg">
          <PencilIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-xl font-semibold">Edit Exam</h1>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                placeholder="Enter exam name"
                value={form.exam_name}
                onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
              />
              <ClipboardDocumentListIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                placeholder="0.00"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
              />
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                placeholder="Exam location"
                value={form.exam_location}
                onChange={(e) => setForm({ ...form, exam_location: e.target.value })}
              />
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                placeholder="Exam topic"
                value={form.exam_topic}
                onChange={(e) => setForm({ ...form, exam_topic: e.target.value })}
              />
              <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Unique exam code"
              value={form.exam_code}
              onChange={(e) => setForm({ ...form, exam_code: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
            >
              <option value={0}>Summer</option>
              <option value={1}>Winter</option>
              <option value={2}>Spring</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.exam_type}
              onChange={(e) => setForm({ ...form, exam_type: Number(e.target.value) })}
            >
              <option value={0}>Type 0</option>
              <option value={1}>Type 1</option>
              <option value={2}>Type 2</option>
              <option value={3}>Type 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time 1</label>
            <div className="relative">
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                value={form.exam_time ? new Date(Number(form.exam_time) * 1000).toISOString().slice(0,16) : ''}
                onChange={(e) => {
                  const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
                  setForm({ ...form, exam_time: timestamp });
                }}
              />
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time 2</label>
            <div className="relative">
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                value={form.exam_time_2 ? new Date(Number(form.exam_time_2) * 1000).toISOString().slice(0,16) : ''}
                onChange={(e) => {
                  const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
                  setForm({ ...form, exam_time_2: timestamp });
                }}
              />
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time 3</label>
            <div className="relative">
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                value={form.exam_time_3 ? new Date(Number(form.exam_time_3) * 1000).toISOString().slice(0,16) : ''}
                onChange={(e) => {
                  const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
                  setForm({ ...form, exam_time_3: timestamp });
                }}
              />
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alipay Account</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Alipay Account"
            value={form.alipay_account}
            onChange={(e) => setForm({ ...form, alipay_account: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={() => router.push('/exam')}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

