'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getExamEditInfo,
  editExam,
  addChangePrice,
  updateChangePrice,
  deleteChangePrice,
  deleteInnerSignup,
  deletePublicSignup,
} from '@/services/auth';
import Button from '@/components/Button';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExamEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('id');
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [form, setForm] = useState({
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
  const [priceChanges, setPriceChanges] = useState<any[]>([]);
  const [newChange, setNewChange] = useState({ change_price: 0, change_time: 0 });
  const [editingChange, setEditingChange] = useState<any | null>(null);

  useEffect(() => {
    if (examId && canEdit) {
      loadInfo();
    }
  }, [examId, canEdit]);

  const loadInfo = async () => {
    if (!examId) return;
    setLoading(true);
    const resp = await getExamEditInfo(Number(examId));
    if (resp.code === 200 && resp.data) {
      setInfo(resp.data);
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
      setPriceChanges(resp.data.price_data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const resp = await editExam(form);
    if (resp.code === 200) {
      loadInfo();
    }
  };

  const handleAddChange = async () => {
    const resp = await addChangePrice({ exam_id: form.record_id, ...newChange });
    if (resp.code === 200) {
      setNewChange({ change_price: 0, change_time: 0 });
      loadInfo();
    }
  };

  const handleUpdateChange = async () => {
    if (!editingChange) return;
    const resp = await updateChangePrice({
      record_id: editingChange.id,
      change_price: editingChange.price,
      change_time: editingChange.time,
    });
    if (resp.code === 200) {
      setEditingChange(null);
      loadInfo();
    }
  };

  const handleDeleteChange = async (id: number) => {
    await deleteChangePrice({ record_id: id });
    loadInfo();
  };

  const handleDeleteInner = async (id: number) => {
    await deleteInnerSignup({ record_id: id });
    loadInfo();
  };

  const handleDeletePublic = async (id: number) => {
    await deletePublicSignup({ record_id: id });
    loadInfo();
  };

  if (!canEdit) {
    return <div className="p-4">Permission denied</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold mb-2">Edit Exam</h1>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border p-1"
          placeholder="Name"
          value={form.exam_name}
          onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
        />
        <input
          className="border p-1"
          placeholder="Base Price"
          type="number"
          value={form.base_price}
          onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
        />
        <input
          className="border p-1"
          placeholder="Location"
          value={form.exam_location}
          onChange={(e) => setForm({ ...form, exam_location: e.target.value })}
        />
        <input
          className="border p-1"
          placeholder="Topic"
          value={form.exam_topic}
          onChange={(e) => setForm({ ...form, exam_topic: e.target.value })}
        />
        <input
          className="border p-1"
          placeholder="Code"
          value={form.exam_code}
          onChange={(e) => setForm({ ...form, exam_code: e.target.value })}
        />
        <input
          className="border p-1"
          placeholder="Period"
          type="number"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
        />
        <input
          className="border p-1"
          placeholder="Type"
          type="number"
          value={form.exam_type}
          onChange={(e) => setForm({ ...form, exam_type: Number(e.target.value) })}
        />
        <input
          className="border p-1"
          placeholder="Time"
          type="number"
          value={form.exam_time}
          onChange={(e) => setForm({ ...form, exam_time: Number(e.target.value) })}
        />
        <input
          className="border p-1"
          placeholder="Time 2"
          type="number"
          value={form.exam_time_2}
          onChange={(e) => setForm({ ...form, exam_time_2: Number(e.target.value) })}
        />
        <input
          className="border p-1"
          placeholder="Time 3"
          type="number"
          value={form.exam_time_3}
          onChange={(e) => setForm({ ...form, exam_time_3: Number(e.target.value) })}
        />
        <input
          className="border p-1"
          placeholder="Alipay Account"
          type="number"
          value={form.alipay_account}
          onChange={(e) => setForm({ ...form, alipay_account: Number(e.target.value) })}
        />
      </div>
      <div>
        <Button onClick={handleSave}>Save</Button>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold mb-2">Price Changes</h2>
        <ul className="space-y-2">
          {priceChanges.map((pc) => (
            <li key={pc.id} className="flex items-center space-x-2">
              {editingChange && editingChange.id === pc.id ? (
                <>
                  <input
                    className="border p-1 w-24"
                    type="number"
                    value={editingChange.price}
                    onChange={(e) => setEditingChange({ ...editingChange, price: Number(e.target.value) })}
                  />
                  <input
                    className="border p-1 w-40"
                    type="number"
                    value={editingChange.time}
                    onChange={(e) => setEditingChange({ ...editingChange, time: Number(e.target.value) })}
                  />
                  <Button variant="secondary" onClick={handleUpdateChange}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span>{pc.price}</span>
                  <span>{pc.time}</span>
                  <Button variant="secondary" onClick={() => setEditingChange(pc)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => handleDeleteChange(pc.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex items-center space-x-2 mt-2">
          <input
            className="border p-1 w-24"
            type="number"
            placeholder="Price"
            value={newChange.change_price}
            onChange={(e) => setNewChange({ ...newChange, change_price: Number(e.target.value) })}
          />
          <input
            className="border p-1 w-40"
            type="number"
            placeholder="Time"
            value={newChange.change_time}
            onChange={(e) => setNewChange({ ...newChange, change_time: Number(e.target.value) })}
          />
          <Button variant="secondary" onClick={handleAddChange}>
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold mb-2">Inner Students</h2>
        <ul className="space-y-1">
          {info?.inner_student_data?.map((s: any) => (
            <li key={s.id} className="flex justify-between">
              <span>{s.student_name}</span>
              <Button variant="secondary" onClick={() => handleDeleteInner(s.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold mb-2">Public Students</h2>
        <ul className="space-y-1">
          {info?.outer_student_data?.map((s: any) => (
            <li key={s.id} className="flex justify-between">
              <span>{s.name}</span>
              <Button variant="secondary" onClick={() => handleDeletePublic(s.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

