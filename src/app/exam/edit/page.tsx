'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getExamEditInfo,
  editExam,
  addChangePrice,
  updateChangePrice,
  deleteChangePrice,
  getStudentList,
  addExamStudent,
  addExamStudentBatch,
  removeExamStudent,
  type EditExamParams,
  type ChangePriceParams,
  StudentInfo,
} from '@/services/auth';
import {
  PencilIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,

  XMarkIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

export default function EditExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, user } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.EDIT_EXAMS);
  const examId = Number(searchParams.get('id')) || 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'examDetails' | 'priceChanges' | 'studentList' | 'outsideStudents'>('examDetails');
  const [form, setForm] = useState<EditExamParams>({
    record_id: examId,
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
  });

  // 价格变动数据
  const [priceChanges, setPriceChanges] = useState<{ id?: number, date: string, price: string, time?: number }[]>([]);

  // 学生报名数据
  const [studentList, setStudentList] = useState<any[]>([]);
  const [outsideStudents, setOutsideStudents] = useState<any[]>([]);

  // 添加学生报名相关状态

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentIds, setNewStudentIds] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 科目选择相关状态
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

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
        });

        // 处理价格变动数据
        if (resp.data.price_data) {
          const formattedPriceChanges = resp.data.price_data.map((item: any) => ({
            id: item.id,
            date: item.time ? new Date(item.time * 1000).toISOString().slice(0, 10) : '',
            price: item.price !== undefined ? String(item.price) : '',
            time: item.time || 0
          }));
          setPriceChanges(formattedPriceChanges);
        }

        // 处理内部学生数据
        if (resp.data.inner_student_data) {
          setStudentList(resp.data.inner_student_data);
        }

        // 处理外部学生数据
        if (resp.data.outer_student_data) {
          setOutsideStudents(resp.data.outer_student_data);
        }
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

  // 价格变动管理函数
  const addPriceChange = () => {
    setPriceChanges([...priceChanges, { date: '', price: '' }]);
  };

  const updatePriceChangeLocal = (index: number, field: 'date' | 'price', value: string) => {
    const updated = [...priceChanges];
    if (field === 'price') {
      updated[index] = { ...updated[index], price: value };
    } else {
      updated[index] = { ...updated[index], date: value };
    }
    setPriceChanges(updated);
  };

  // 保存单个价格变动项
  const savePriceChange = async (index: number) => {
    const change = priceChanges[index];
    const priceValue = Number(change.price);
    if (!change.date || !change.price || priceValue <= 0) {
      setError('请填写完整的价格变动信息');
      return;
    }

    try {
      const timestamp = Math.floor(new Date(change.date).getTime() / 1000);
      if (change.id) {
        // 更新现有价格变动
        const resp = await updateChangePrice({
          record_id: change.id,
          change_price: priceValue,
          change_time: timestamp
        });
        if (resp.code === 200) {
          // 更新本地状态
          const updated = [...priceChanges];
          updated[index] = { ...updated[index], time: timestamp };
          setPriceChanges(updated);
        } else {
          setError(resp.message || '更新价格变动失败');
        }
      } else {
        // 添加新的价格变动
        const resp = await addChangePrice({
          exam_id: examId,
          change_price: priceValue,
          change_time: timestamp
        });
        if (resp.code === 200) {
          // 重新获取数据以获取新的ID
          const dataResp = await getExamEditInfo(examId);
          if (dataResp.code === 200 && dataResp.data?.price_data) {
            const formattedPriceChanges = dataResp.data.price_data.map((item: any) => ({
              id: item.id,
              date: item.time ? new Date(item.time * 1000).toISOString().slice(0, 10) : '',
              price: item.price !== undefined ? String(item.price) : '',
              time: item.time || 0
            }));
            setPriceChanges(formattedPriceChanges);
          }
        } else {
          setError(resp.message || '添加价格变动失败');
        }
      }
    } catch (error) {
      setError('保存价格变动失败');
    }
  };

  // 取消新增的价格变动项
  const cancelPriceChange = (index: number) => {
    setPriceChanges(priceChanges.filter((_, i) => i !== index));
  };

  // 删除价格变动项，删除已保存项时需要确认
  const removePriceChange = async (index: number) => {
    const change = priceChanges[index];
    if (change.id) {
      if (!window.confirm('确定要删除该价格规则吗？')) return;
      try {
        const resp = await deleteChangePrice({ record_id: change.id });
        if (resp.code === 200) {
          setPriceChanges(priceChanges.filter((_, i) => i !== index));
        } else {
          setError(resp.message || '删除价格变动失败');
        }
      } catch (error) {
        setError('删除价格变动失败');
      }
    } else {
      // 未保存的项直接移除
      setPriceChanges(priceChanges.filter((_, i) => i !== index));
    }
  };

  // Tab 切换函数
  const handleTabChange = (tab: 'examDetails' | 'priceChanges' | 'studentList' | 'outsideStudents') => {
    setActiveTab(tab);
    setError('');
  };

  // 重置表单函数
  const handleReset = () => {
    setForm({
      record_id: examId,
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
    });

    setPriceChanges([]);
    setActiveTab('examDetails');
    setError('');
  };

  // 学生管理函数


  const handleRemoveStudent = async (studentId: string) => {
    if (form.base_price !== 0) {
      setError('只有价格为0时才能删除学生报名');
      return;
    }

    const confirmed = window.confirm('确定要删除该学生的报名吗？此操作不可撤销。');
    if (!confirmed) return;

    try {
      const resp = await removeExamStudent({
        exam_id: examId,
        student_ids: studentId
      });

      if (resp.code === 200) {
        // Refresh list
        const refreshResp = await getExamEditInfo(examId);
        if (refreshResp.code === 200 && refreshResp.data) {
          setStudentList(refreshResp.data.inner_student_data || []);
        }
      } else {
        setError(resp.message || '删除学生失败');
      }
    } catch (error) {
      setError('删除学生失败');
    }
  };

  const handleRemoveOutsideStudent = async (index: number) => {
    const student = outsideStudents[index];
    const confirmed = window.confirm(`确定要删除学生 "${student.name}" 吗？此操作不可撤销。`);

    if (!confirmed) {
      return;
    }

    try {
      // 这里应该调用后端API删除外部学生
      // const response = await removeOutsideStudent(examId, outsideStudents[index].id);
      // 临时模拟删除
      setOutsideStudents(outsideStudents.filter((_, i) => i !== index));
    } catch (error) {
      setError('删除外部学生失败');
    }
  };

  const handleDownloadStudentCSV = () => {
    const csvContent = [
      ['Name', 'Campus', 'Sign up date', 'Price', 'Paid'].join(','),
      ...studentList.map(student => [
        student.student_name || student.name,
        student.campus || '-',
        new Date(student.signup_time * 1000).toLocaleDateString('zh-CN'),
        student.price || form.base_price || 0,
        student.paid ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam_students_${examId}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();

    // 清理资源
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    link.href = url;
    link.download = `exam_students_${examId}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();

    // 清理资源
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // 批量上传学生
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    // Simple validation
    const isValidExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isValidExcel) {
      alert('请上传Excel文件 (.xlsx 或 .xls)');
      return;
    }

    setIsUploading(true);
    try {
      const resp = await addExamStudentBatch(examId, file);
      if (resp.code === 200) {
        // Refresh data
        const refreshResp = await getExamEditInfo(examId);
        if (refreshResp.code === 200 && refreshResp.data) {
          setStudentList(refreshResp.data.inner_student_data || []);
          setOutsideStudents(refreshResp.data.outer_student_data || []);
        }
        alert('批量添加成功');
      } else {
        alert(resp.message || '批量添加失败');
      }
    } catch (err) {
      console.error(err);
      alert('批量添加出错');
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  // 添加单个/多个学生
  const handleAddStudent = async () => {
    if (newStudentIds.length === 0) return;

    try {
      const resp = await addExamStudent({
        exam_id: examId,
        student_ids: newStudentIds.join(',')
      });

      if (resp.code === 200) {
        setShowAddStudentModal(false);
        setNewStudentIds([]);
        // Refresh list
        const refreshResp = await getExamEditInfo(examId);
        if (refreshResp.code === 200 && refreshResp.data) {
          setStudentList(refreshResp.data.inner_student_data || []);
        }
      } else {
        setError(resp.message || '添加学生失败');
      }
    } catch (err) {
      console.error(err);
      setError('添加学生出错');
    }
  };


  // 加载可选学生列表
  const loadAvailableStudents = async () => {
    try {
      const response = await getStudentList({ disabled: 0 });

      if (response.code === 200) {
        const listInfo = (response.data as any)?.list_info || [];
        const formattedList = listInfo.map((student: StudentInfo) => ({
          id: student.student_id,
          name: `${student.student_name} (ID: ${student.student_id})`
        }));
        setAvailableStudents(formattedList);
      } else {
        setAvailableStudents([]);
        console.error('获取学生列表失败:', response?.message || '未知错误');
      }
    } catch (error) {
      setAvailableStudents([]);
      console.error('加载学生列表失败:', error);
    }
  };

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit exams</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <PencilIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">编辑考试</h1>
                <p className="text-gray-600 mt-1">修改考试信息和设置</p>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab 导航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('examDetails')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'examDetails'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <PencilIcon className="h-4 w-4" />
                考试详情
              </button>
              <button
                onClick={() => handleTabChange('priceChanges')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'priceChanges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <CurrencyDollarIcon className="h-4 w-4" />
                价格变动
              </button>
              <button
                onClick={() => handleTabChange('studentList')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'studentList'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <UsersIcon className="h-4 w-4" />
                学生报名
              </button>
              <button
                onClick={() => handleTabChange('outsideStudents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'outsideStudents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                外部学生
              </button>
            </nav>
          </div>
        </div>

        {/* Tab 内容 */}
        {activeTab === 'examDetails' && (
          <>
            {/* 主要信息卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
                <p className="text-sm text-gray-600 mt-1">考试的基本设置和信息</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      考试名称 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                        placeholder="请输入考试名称"
                        value={form.exam_name}
                        onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                      />
                      <ClipboardDocumentListIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      基础价格 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                        placeholder="0.00"
                        value={form.base_price}
                        onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                      />
                      <CurrencyDollarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      考试地点 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                        placeholder="请输入考试地点"
                        value={form.exam_location}
                        onChange={(e) => setForm({ ...form, exam_location: e.target.value })}
                      />
                      <MapPinIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      考试科目 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                        placeholder="请输入或选择考试科目"
                        value={form.exam_topic}
                        onChange={(e) => {
                          setForm({ ...form, exam_topic: e.target.value });
                          setShowTopicDropdown(true);
                        }}
                        onFocus={() => setShowTopicDropdown(true)}
                        onBlur={() => {
                          // 延迟关闭以允许点击下拉选项
                          setTimeout(() => setShowTopicDropdown(false), 200);
                        }}
                      />
                      <TagIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                      {/* 科目下拉列表 */}
                      {showTopicDropdown && user?.topics && Object.keys(user.topics).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {Object.entries(user.topics)
                            .filter(([id, name]) =>
                              name.toLowerCase().includes(form.exam_topic.toLowerCase()) ||
                              id.includes(form.exam_topic)
                            )
                            .map(([id, name]) => (
                              <div
                                key={id}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setForm({
                                    ...form,
                                    exam_topic: name,
                                    exam_topic_id: Number(id)
                                  });
                                  setShowTopicDropdown(false);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-900">{name}</span>
                                </div>
                              </div>
                            ))}
                          {Object.entries(user.topics)
                            .filter(([id, name]) =>
                              name.toLowerCase().includes(form.exam_topic.toLowerCase()) ||
                              id.includes(form.exam_topic)
                            ).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                未找到匹配的科目
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      考试代码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="请输入唯一考试代码"
                      value={form.exam_code}
                      onChange={(e) => setForm({ ...form, exam_code: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">考试期间</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      value={form.period}
                      onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
                    >
                      <option value={0}>Summer</option>
                      <option value={1}>Winter</option>
                      <option value={2}>Spring</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 高级设置卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">高级设置</h2>
                <p className="text-sm text-gray-600 mt-1">考试类型、时间和支付设置</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">考试类型</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      value={form.exam_type}
                      onChange={(e) => setForm({ ...form, exam_type: Number(e.target.value) })}
                    >
                      <option value={0}>Edexcel</option>
                      <option value={1}>CIE</option>
                      <option value={2}>AQA</option>
                      <option value={4}>PHY</option>
                      <option value={3}>其他</option>
                    </select>
                  </div>


                </div>

                {/* 考试日期设置 */}
                <div className="mt-8">
                  <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    考试日期设置
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">exam 1</label>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                          value={form.exam_time ? new Date(Number(form.exam_time) * 1000).toISOString().slice(0, 10) : ''}
                          onChange={(e) => {
                            const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
                            console.log(timestamp)
                            setForm({ ...form, exam_time: timestamp });
                          }}
                        />
                        <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">exam 2</label>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                          value={form.exam_time_2 ? new Date(Number(form.exam_time_2) * 1000).toISOString().slice(0, 10) : ''}
                          onChange={(e) => {
                            const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
                            setForm({ ...form, exam_time_2: timestamp });
                          }}
                        />
                        <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">exam 3</label>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 bg-gray-50 focus:bg-white transition-colors"
                          value={form.exam_time_3 ? new Date(Number(form.exam_time_3) * 1000).toISOString().slice(0, 10) : ''}
                          onChange={(e) => {
                            const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0;
                            setForm({ ...form, exam_time_3: timestamp });
                          }}
                        />
                        <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}

        {/* 价格变动 Tab */}
        {activeTab === 'priceChanges' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">价格变动设置</h2>
                <p className="text-sm text-gray-600 mt-1">设置不同日期的价格变化规则</p>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <button
                    onClick={addPriceChange}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    添加价格规则
                  </button>
                </div>

                <div className="space-y-4">
                  {priceChanges.map((change, index) => (
                    <div key={index} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">生效日期</label>
                        {change.id ? (
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            value={change.date}
                            disabled
                          />
                        ) : (
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={change.date}
                            onChange={(e) => updatePriceChangeLocal(index, 'date', e.target.value)}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                        <div className="relative">
                          {change.id ? (
                            <>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg pl-8 bg-gray-100 cursor-not-allowed"
                                value={change.price}
                                disabled
                              />
                              <CurrencyDollarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                                placeholder="0.00"
                                value={change.price}
                                onChange={(e) => updatePriceChangeLocal(index, 'price', e.target.value)}
                              />
                              <CurrencyDollarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {change.id ? (
                          <button
                            onClick={() => removePriceChange(index)}
                            className="inline-flex items-center justify-center w-10 h-10 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => savePriceChange(index)}
                              className="inline-flex items-center px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              确定
                            </button>
                            <button
                              onClick={() => cancelPriceChange(index)}
                              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              取消
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {priceChanges.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium">暂无价格规则</p>
                      <p className="text-sm">点击"添加价格规则"按钮来设置价格变动</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 学生报名列表 Tab */}
        {activeTab === 'studentList' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">学生报名列表</h2>
                <p className="text-sm text-gray-600 mt-1">已报名的学生信息管理</p>
              </div>

              <div className="p-6">
                {/* 顶部操作栏 */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex gap-3">
                    {form.base_price === 0 && (
                      <button
                        onClick={() => {
                          setShowAddStudentModal(true);
                          loadAvailableStudents();
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        添加学生
                      </button>
                    )}
                    {form.base_price === 0 && (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleBatchUpload}
                          className="hidden"
                          id="batch-upload-input"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="batch-upload-input"
                          className={`inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                          )}
                          批量上传学生
                        </label>
                      </div>
                    )}
                    <button
                      onClick={handleDownloadStudentCSV}
                      disabled={studentList.length === 0}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      下载CSV
                    </button>
                  </div>
                  {form.base_price !== 0 && (
                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                      价格不为0时无法添加/删除学生
                    </div>
                  )}
                </div>

                {studentList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campus</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sign up date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {studentList.map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {student.student_name}
                              {student.withdrawal ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                                  退考
                                </span>
                              ) : ''}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.campus || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {new Date(student.signup_time * 1000).toLocaleDateString('zh-CN')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              ¥{student.price || form.base_price || 0}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {student.paid ? '已支付' : '未支付'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-medium">
                              {form.base_price === 0 && (
                                <button
                                  onClick={() => handleRemoveStudent(String(student.student_id))}
                                  className="text-red-600 hover:text-red-800"
                                  title="删除"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学生报名</h3>
                    <p className="text-gray-500">当有学生报名时，将会显示在这里</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 外部学生 Tab */}
        {activeTab === 'outsideStudents' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">外部学生报名</h2>
                <p className="text-sm text-gray-600 mt-1">外部渠道报名的学生信息</p>
              </div>

              <div className="p-6">
                {outsideStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birthday</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous CAIE center number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous CAIE candidate number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous Edexcel candidate number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sign up date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current school</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {outsideStudents.map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-gray-900">{student.name || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.email || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.birthday || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.gender || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.previous_caie_center || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.previous_caie_candidate || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.previous_edexcel_candidate || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {new Date(student.signup_time * 1000).toLocaleDateString('zh-CN')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">¥{student.price || form.base_price || 0}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{student.current_school || '-'}</td>
                            <td className="px-4 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleRemoveOutsideStudent(index)}
                                  className="text-red-600 hover:text-red-800 ml-3"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无外部学生报名</h3>
                    <p className="text-gray-500">当有外部学生报名时，将会显示在这里</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 添加学生模态框 */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowAddStudentModal(false)}></div>
              <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowAddStudentModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <PlusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      添加学生报名
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* 学生选择 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        选择学生 <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={availableStudents.map(student => ({
                          id: String(student.id),
                          name: `${student.name}`
                        }))}
                        value={newStudentIds}
                        onValueChange={(value) => setNewStudentIds(value as string[])}
                        placeholder="请选择学生"
                        searchPlaceholder="输入学生ID或姓名搜索"
                        className="w-full"
                        multiple={true}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentModal(false);
                        setShowAddStudentModal(false);
                        setNewStudentIds([]);
                        setSearchStudentTerm('');
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddStudent}
                      disabled={newStudentIds.length === 0}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                      添加学生
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮卡片 - 只在考试详情tab显示 */}
        {activeTab === 'examDetails' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重置
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    保存更改
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
