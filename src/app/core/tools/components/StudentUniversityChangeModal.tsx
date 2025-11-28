'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { studentUniversityChange } from '@/services/modules/tools';
import { getStudentList, type StudentInfo } from '@/services/auth';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

interface StudentUniversityChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentUniversityChangeModal({ isOpen, onClose }: StudentUniversityChangeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student list state
  const [studentList, setStudentList] = useState<{ id: number; name: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [formData, setFormData] = useState({
    student_id: 0,
    university_status: 0,
  });

  // Load student list when modal opens
  useEffect(() => {
    if (isOpen && studentList.length === 0) {
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      // Get all students (including disabled ones if needed, or just active)
      // Here we fetch active students by default (disabled=0)
      const response = await getStudentList({ disabled: 0 });

      if (response.code === 200) {
        const listInfo = (response.data as any)?.list_info || [];
        const formattedList = listInfo.map((student: StudentInfo) => ({
          id: student.student_id,
          name: `${student.student_name} (ID: ${student.student_id})`
        }));
        setStudentList(formattedList);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || formData.university_status === 0) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await studentUniversityChange({
        student_id: formData.student_id,
        university_status: formData.university_status,
      });

      if (response.code === 200) {
        setMessage({ type: 'success', text: '修改成功' });
        setTimeout(() => {
          onClose();
          setFormData({
            student_id: 0,
            university_status: 0,
          });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || '修改失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '修改失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="修改学生大学确认状态">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学生 <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={studentList}
            value={formData.student_id}
            onValueChange={(val) => setFormData({ ...formData, student_id: Number(val) })}
            placeholder={loadingStudents ? "加载中..." : "搜索并选择学生"}
            searchPlaceholder="输入姓名或ID搜索..."
            disabled={loadingStudents}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            大学确认状态 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.university_status}
            onChange={(e) => setFormData({ ...formData, university_status: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value={0}>请选择状态</option>
            <option value={1}>已确认</option>
            <option value={0}>未确认</option>
          </select>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? '修改中...' : '确认修改'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

