'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getExamList,
  addNewExam,
  updateExamStatus,
  deleteExam,
  type ExamListItem,
  type AddExamParams,
} from '@/services/auth';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExamPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [disabledExams, setDisabledExams] = useState<ExamListItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddExamParams>({
    exam_name: '',
    exam_location: '',
    exam_topic: '',
    exam_code: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await getExamList();
      if (resp.status === 200) {
        setExams(resp.data.active || []);
        setDisabledExams(resp.data.disabled || []);
      } else {
        setError(resp.message || 'Failed to load exams');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      loadData();
    }
  }, [canEdit]);

  const handleAddExam = async () => {
    setActionLoading(true);
    const resp = await addNewExam(addForm);
    setActionLoading(false);
    if (resp.code === 200) {
      setShowAddModal(false);
      setAddForm({ exam_name: '', exam_location: '', exam_topic: '', exam_code: '' });
      loadData();
    } else {
      setError(resp.message || '添加考试失败');
    }
  };

  const handleToggleStatus = async (exam: ExamListItem, disable: boolean) => {
    setActionLoading(true);
    await updateExamStatus({ record_id: exam.id, status: disable ? 1 : 0 });
    setActionLoading(false);
    loadData();
  };

  const handleDelete = async (exam: ExamListItem) => {
    if (!confirm('确认删除该考试?')) return;
    setActionLoading(true);
    await deleteExam({ record_id: exam.id });
    setActionLoading(false);
    loadData();
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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Exams</h1>
        <Button onClick={() => setShowAddModal(true)} disabled={!canEdit}>
          <PlusIcon className="w-4 h-4 mr-1" /> Add Exam
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        <h2 className="font-semibold mb-2">Active</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Code</th>
              <th className="px-2 py-1 text-left">Price</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id} className="border-b">
                <td className="px-2 py-1">{exam.name}</td>
                <td className="px-2 py-1">{exam.code}</td>
                <td className="px-2 py-1">{exam.price}</td>
                <td className="px-2 py-1 flex space-x-2 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/exam/edit?id=${exam.id}`)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleToggleStatus(exam, true)}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button
                  >
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(exam)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Disabled</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Code</th>
              <th className="px-2 py-1 text-left">Price</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disabledExams.map((exam) => (
              <tr key={exam.id} className="border-b">
                <td className="px-2 py-1">{exam.name}</td>
                <td className="px-2 py-1">{exam.code}</td>
                <td className="px-2 py-1">{exam.price}</td>
                <td className="px-2 py-1 flex space-x-2 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => handleToggleStatus(exam, false)}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(exam)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow w-80 space-y-2">
            <h2 className="text-lg font-semibold">Add Exam</h2>
            <input
              className="w-full border p-1"
              placeholder="Name"
              value={addForm.exam_name}
              onChange={(e) => setAddForm({ ...addForm, exam_name: e.target.value })}
            />
            <input
              className="w-full border p-1"
              placeholder="Location"
              value={addForm.exam_location}
              onChange={(e) => setAddForm({ ...addForm, exam_location: e.target.value })}
            />
            <input
              className="w-full border p-1"
              placeholder="Topic"
              value={addForm.exam_topic}
              onChange={(e) => setAddForm({ ...addForm, exam_topic: e.target.value })}
            />
            <input
              className="w-full border p-1"
              placeholder="Code"
              value={addForm.exam_code}
              onChange={(e) => setAddForm({ ...addForm, exam_code: e.target.value })}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExam} disabled={actionLoading}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

