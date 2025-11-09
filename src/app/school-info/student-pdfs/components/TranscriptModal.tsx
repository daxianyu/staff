'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { StudentPdfItem } from '@/services/auth';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPdfItem | null;
  transactionList: string[];
  fixCourse: string[];
  gradeList: string[];
  onConfirm: (params: {
    name_pinyin: string;
    name_hanzi: string;
    gender: string;
    birthday: string;
    duration_from: string;
    graduation_date: string;
    ig_time: string;
    as_time: string;
    al_time: string;
    data: Array<{
      course: string;
      ig_term1: string;
      ig_term2: string;
      as_term1: string;
      as_term2: string;
      al_term1: string;
      al_term2: string;
    }>;
  }) => Promise<void>;
}

export default function TranscriptModal({ 
  isOpen, 
  onClose, 
  student, 
  transactionList, 
  fixCourse, 
  gradeList,
  onConfirm 
}: TranscriptModalProps) {
  const [namePinyin, setNamePinyin] = useState('');
  const [nameHanzi, setNameHanzi] = useState('');
  const [gender, setGender] = useState('Male');
  const [birthday, setBirthday] = useState('');
  const [durationFrom, setDurationFrom] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [igTime, setIgTime] = useState('');
  const [asTime, setAsTime] = useState('');
  const [alTime, setAlTime] = useState('');
  const [data, setData] = useState<Array<{
    course: string;
    ig_term1: string;
    ig_term2: string;
    as_term1: string;
    as_term2: string;
    al_term1: string;
    al_term2: string;
  }>>([]);

  // 格式化日期为 YYYY-MM-DD
  const formatDateForInput = useCallback((timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 当模态框打开时，初始化数据
  useEffect(() => {
    if (isOpen && student) {
      const enName = `${student.pinyin_first_name || ''} ${student.pinyin_last_name || ''}`.trim();
      const chineseName = `${student.last_name || ''}${student.first_name || ''}`;
      setNamePinyin(enName || chineseName);
      setNameHanzi(chineseName);
      setGender(student.gender === 0 ? 'Male' : 'Female');
      setBirthday(formatDateForInput(student.birthday));
      setDurationFrom(formatDateForInput(student.enrolment_date));
      setGraduationDate(formatDateForInput(student.graduation_date));
      setIgTime(student.ig_time || '');
      setAsTime(student.as_time || '');
      setAlTime(student.al_time || '');
      
      // 初始化固定课程
      const initialData = fixCourse.map(course => ({
        course,
        ig_term1: '',
        ig_term2: '',
        as_term1: '',
        as_term2: '',
        al_term1: '',
        al_term2: '',
      }));
      setData(initialData);
    }
  }, [isOpen, student, fixCourse, formatDateForInput]);

  const handleAddCourse = useCallback(() => {
    setData(prev => {
      // 使用函数式更新获取最新的 data
      const selectedCourses = prev.map(d => d.course).filter(c => c);
      const availableCourses = transactionList.filter(
        course => !selectedCourses.includes(course)
      );
      if (availableCourses.length === 0) {
        alert('没有可用的课程了');
        return prev; // 如果没有可用课程，返回原数据
      }
      return [...prev, {
        course: availableCourses[0],
        ig_term1: '',
        ig_term2: '',
        as_term1: '',
        as_term2: '',
        al_term1: '',
        al_term2: '',
      }];
    });
  }, [transactionList]);

  const handleDeleteCourse = useCallback((index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateCourse = useCallback((index: number, field: string, value: string) => {
    setData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!namePinyin || !nameHanzi || !birthday || !durationFrom || !graduationDate) {
      alert('请填写必填项');
      return;
    }
    if (data.length === 0) {
      alert('请至少添加一条成绩数据');
      return;
    }
    
    await onConfirm({
      name_pinyin: namePinyin,
      name_hanzi: nameHanzi,
      gender,
      birthday,
      duration_from: durationFrom,
      graduation_date: graduationDate,
      ig_time: igTime,
      as_time: asTime,
      al_time: alTime,
      data,
    });
  }, [namePinyin, nameHanzi, gender, birthday, durationFrom, graduationDate, igTime, asTime, alTime, data, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">生成 Transcript</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (Pinyin) *
              </label>
              <input
                type="text"
                value={namePinyin}
                onChange={(e) => setNamePinyin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (Hanzi) *
              </label>
              <input
                type="text"
                value={nameHanzi}
                onChange={(e) => setNameHanzi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birthday *
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration from *
              </label>
              <input
                type="date"
                value={durationFrom}
                onChange={(e) => setDurationFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Date *
              </label>
              <input
                type="date"
                value={graduationDate}
                onChange={(e) => setGraduationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IG time
              </label>
              <input
                type="text"
                value={igTime}
                onChange={(e) => setIgTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AS time
              </label>
              <input
                type="text"
                value={asTime}
                onChange={(e) => setAsTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AL time
              </label>
              <input
                type="text"
                value={alTime}
                onChange={(e) => setAlTime(e.target.value)}
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">IG Term 1</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">IG Term 2</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">AS Term 1</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">AS Term 2</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">AL Term 1</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">AL Term 2</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => {
                    const isFixed = fixCourse.includes(item.course);
                    // 计算已选择的课程（排除当前行和空字符串）
                    const selectedCourses = data
                      .map((d, i) => i !== index ? d.course : null)
                      .filter((c): c is string => !!c);
                    // 可用课程：未选择的课程 + 当前行已选择的课程
                    const availableCourses = transactionList.filter(
                      course => !selectedCourses.includes(course) || course === item.course
                    );
                    // 确保当前行的课程在可用列表中（防止显示异常）
                    const finalAvailableCourses = item.course && !availableCourses.includes(item.course)
                      ? [...availableCourses, item.course]
                      : availableCourses;
                    return (
                      <tr key={`transcript-row-${index}`}>
                        <td className="px-3 py-2">
                          <select
                            value={item.course}
                            onChange={(e) => handleUpdateCourse(index, 'course', e.target.value)}
                            disabled={isFixed}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required
                          >
                            {finalAvailableCourses.map(course => (
                              <option key={course} value={course}>{course}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.ig_term1}
                            onChange={(e) => handleUpdateCourse(index, 'ig_term1', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.ig_term2}
                            onChange={(e) => handleUpdateCourse(index, 'ig_term2', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.as_term1}
                            onChange={(e) => handleUpdateCourse(index, 'as_term1', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.as_term2}
                            onChange={(e) => handleUpdateCourse(index, 'as_term2', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.al_term1}
                            onChange={(e) => handleUpdateCourse(index, 'al_term1', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.al_term2}
                            onChange={(e) => handleUpdateCourse(index, 'al_term2', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeList.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {!isFixed && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
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

