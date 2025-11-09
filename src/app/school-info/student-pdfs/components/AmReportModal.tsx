'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { StudentPdfItem } from '@/services/auth';

interface AmReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPdfItem | null;
  americaSubjects: string[];
  amGradeList: string[];
  onConfirm: (params: {
    name: string;
    is_male: string;
    student_number: string;
    grade_10: string;
    grade_11: string;
    grade_12: string;
    data: Array<{
      course: string;
      grade10_s1: string;
      grade10_s2: string;
      grade10_final: string;
      grade11_s1: string;
      grade11_s2: string;
      grade11_final: string;
      grade12_s1: string;
      grade12_s2: string;
      grade12_final: string;
    }>;
  }) => Promise<void>;
}

export default function AmReportModal({ 
  isOpen, 
  onClose, 
  student, 
  americaSubjects, 
  amGradeList,
  onConfirm 
}: AmReportModalProps) {
  const [name, setName] = useState('');
  const [isMale, setIsMale] = useState('true');
  const [studentNumber, setStudentNumber] = useState('');
  const [grade10, setGrade10] = useState('');
  const [grade11, setGrade11] = useState('');
  const [grade12, setGrade12] = useState('');
  const [data, setData] = useState<Array<{
    course: string;
    grade10_s1: string;
    grade10_s2: string;
    grade10_final: string;
    grade11_s1: string;
    grade11_s2: string;
    grade11_final: string;
    grade12_s1: string;
    grade12_s2: string;
    grade12_final: string;
  }>>([]);

  // 当模态框打开时，初始化数据
  useEffect(() => {
    if (isOpen && student) {
      const enName = `${student.pinyin_first_name || ''} ${student.pinyin_last_name || ''}`.trim();
      setName(enName || `${student.last_name || ''}${student.first_name || ''}`);
      setIsMale(student.gender === 0 ? 'true' : 'false');
      setStudentNumber(student.student_long_id || '');
      setGrade10(student['10_time'] || '');
      setGrade11(student['11_time'] || '');
      setGrade12(student['12_time'] || '');
      setData([]);
    }
  }, [isOpen, student]);

  const handleAddCourse = useCallback(() => {
    const selectedCourses = data.map(d => d.course);
    const availableCourses = americaSubjects.filter(
      course => !selectedCourses.includes(course)
    );
    if (availableCourses.length === 0) {
      alert('没有可用的课程了');
      return;
    }
    setData(prev => [...prev, {
      course: availableCourses[0],
      grade10_s1: '',
      grade10_s2: '',
      grade10_final: '',
      grade11_s1: '',
      grade11_s2: '',
      grade11_final: '',
      grade12_s1: '',
      grade12_s2: '',
      grade12_final: '',
    }]);
  }, [data, americaSubjects]);

  const handleDeleteCourse = useCallback((index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateCourse = useCallback((index: number, field: string, value: string) => {
    setData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!name || !studentNumber) {
      alert('请填写必填项');
      return;
    }
    if (data.length === 0) {
      alert('请至少添加一条成绩数据');
      return;
    }
    
    await onConfirm({
      name,
      is_male: isMale,
      student_number: studentNumber,
      grade_10: grade10,
      grade_11: grade11,
      grade_12: grade12,
      data,
    });
  }, [name, isMale, studentNumber, grade10, grade11, grade12, data, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">生成美本成绩单</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英文姓名 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性别 *
              </label>
              <select
                value={isMale}
                onChange={(e) => setIsMale(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">男</option>
                <option value="false">女</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学号 *
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade 10 学年
              </label>
              <input
                type="text"
                value={grade10}
                onChange={(e) => setGrade10(e.target.value)}
                placeholder="如：2024-2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade 11 学年
              </label>
              <input
                type="text"
                value={grade11}
                onChange={(e) => setGrade11(e.target.value)}
                placeholder="如：2025-2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade 12 学年
              </label>
              <input
                type="text"
                value={grade12}
                onChange={(e) => setGrade12(e.target.value)}
                placeholder="如：2026-2027"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                成绩数据 *
              </label>
              <button
                type="button"
                onClick={handleAddCourse}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                添加课程
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade10 S1</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade10 S2</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade10 Final</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade11 S1</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade11 S2</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade11 Final</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade12 S1</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade12 S2</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade12 Final</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => {
                    const selectedCourses = data.map(d => d.course);
                    const availableCourses = americaSubjects.filter(
                      course => !selectedCourses.includes(course) || course === item.course
                    );
                    return (
                      <tr key={`am-row-${index}`}>
                        <td className="px-3 py-2">
                          <select
                            value={item.course}
                            onChange={(e) => handleUpdateCourse(index, 'course', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {availableCourses.map(course => (
                              <option key={course} value={course}>{course}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade10_s1}
                            onChange={(e) => handleUpdateCourse(index, 'grade10_s1', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade10_s2}
                            onChange={(e) => handleUpdateCourse(index, 'grade10_s2', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade10_final}
                            onChange={(e) => handleUpdateCourse(index, 'grade10_final', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade11_s1}
                            onChange={(e) => handleUpdateCourse(index, 'grade11_s1', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade11_s2}
                            onChange={(e) => handleUpdateCourse(index, 'grade11_s2', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade11_final}
                            onChange={(e) => handleUpdateCourse(index, 'grade11_final', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade12_s1}
                            onChange={(e) => handleUpdateCourse(index, 'grade12_s1', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade12_s2}
                            onChange={(e) => handleUpdateCourse(index, 'grade12_s2', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.grade12_final}
                            onChange={(e) => handleUpdateCourse(index, 'grade12_final', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {amGradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

