'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getArchivesBaseInfo,
  editArchivesBaseInfo,
  getArchivesPositionInfo,
  editArchivesPositionInfo,
  getArchivesPromotionInfo,
  editArchivesPromotionInfo,
  getArchivesSupervisionInfo,
  editArchivesSupervisionInfo,
  getArchivesInterviewInfo,
  editArchivesInterviewInfo,
  getArchivesComplaintInfo,
  editArchivesComplaintInfo,
  getArchivesRewardInfo,
  editArchivesRewardInfo,
  getArchivesPunishmentInfo,
  editArchivesPunishmentInfo,
  getArchivesAccountingInfo,
  editArchivesAccountingInfo,
  deleteArchivesRecord,
  getEditSelect,
  type ArchivesBaseInfo,
  type ArchivesPositionInfo,
  type ArchivesPromotionInfo,
  type ArchivesSupervisionInfo,
  type ArchivesInterviewInfo,
  type ArchivesComplaintInfo,
  type ArchivesRewardInfo,
  type ArchivesPunishmentInfo,
  type ArchivesAccountingInfo,
  type DeleteArchivesRecordParams,
} from '@/services/auth';
import { getAllCampus } from '@/services/modules/academics';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadArchivesFile } from '@/services/modules/archives';

type TabType = 'base' | 'position' | 'promotion' | 'supervision' | 'interview' | 'complaint' | 'reward' | 'punishment' | 'accounting';

export default function ArchivesDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = Number(searchParams.get('staffId'));
  const { hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_ARCHIVES);
  const canEdit = hasPermission(PERMISSIONS.EDIT_ARCHIVES);

  const [activeTab, setActiveTab] = useState<TabType>('base');
  const [loading, setLoading] = useState(true);
  const [editSelectOptions, setEditSelectOptions] = useState<Record<string, Array<{ value: string | number; label: string }>>>({});
  const [campusOptions, setCampusOptions] = useState<Array<{ value: number; label: string }>>([]);

  // 各标签页的数据
  const [baseInfo, setBaseInfo] = useState<ArchivesBaseInfo | null>(null);
  const [positionInfo, setPositionInfo] = useState<ArchivesPositionInfo | null>(null);
  const [promotionInfo, setPromotionInfo] = useState<ArchivesPromotionInfo | null>(null);
  const [supervisionInfo, setSupervisionInfo] = useState<ArchivesSupervisionInfo | null>(null);
  const [interviewInfo, setInterviewInfo] = useState<ArchivesInterviewInfo | null>(null);
  const [complaintInfo, setComplaintInfo] = useState<ArchivesComplaintInfo | null>(null);
  const [rewardInfo, setRewardInfo] = useState<ArchivesRewardInfo | null>(null);
  const [punishmentInfo, setPunishmentInfo] = useState<ArchivesPunishmentInfo | null>(null);
  const [accountingInfo, setAccountingInfo] = useState<ArchivesAccountingInfo | null>(null);

  // 编辑模态框状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, unknown>>({});
  const [editRecordId, setEditRecordId] = useState<number | null>(null);
  const [editRecordType, setEditRecordType] = useState<string>('');

  // 删除确认模态框
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [deleteRecordType, setDeleteRecordType] = useState<string>('');

  // 初始化时加载编辑选项和校区列表（只调用一次）
  // 先加载编辑选项，再加载校区列表，确保校区数据不会被覆盖
  useEffect(() => {
    if (canView && staffId) {
      const loadData = async () => {
        await loadEditSelect();
        await loadCampusList();
      };
      loadData();
    }
  }, [canView, staffId]);

  const loadCampusList = async () => {
    try {
      const response = await getAllCampus();
      if (response.status === 200 && response.data) {
        const campuses = Array.isArray(response.data)
          ? response.data.map((campus: any) => ({
            value: Number(campus.id ?? campus.value),
            label: campus.name ?? campus.label ?? String(campus),
          }))
          : [];
        setCampusOptions(campuses);
        // 将校区选项添加到 editSelectOptions 中
        setEditSelectOptions(prev => ({
          ...prev,
          campus_id: campuses,
        }));
      }
    } catch (error) {
      console.error('加载校区列表失败:', error);
    }
  };

  // 切换标签页时加载数据
  useEffect(() => {
    if (canView && staffId) {
      loadTabData(activeTab);
    }
  }, [canView, staffId, activeTab]);

  const loadEditSelect = async () => {
    try {
      const response = await getEditSelect();
      if (response.code === 200 && response.data) {
        // 转换选项格式
        const options: Record<string, Array<{ value: string | number; label: string }>> = {};
        const data = response.data as any;

        // base_level: 数组
        if (Array.isArray(data.base_level)) {
          options.base_level = data.base_level.map((item: any) => ({
            value: item,
            label: String(item),
          }));
        }

        // teacher_certification_status: 字典或数组
        if (data.teacher_certification_status) {
          if (Array.isArray(data.teacher_certification_status)) {
            options.teacher_certification_status = data.teacher_certification_status.map((item: any) => ({
              value: item.value ?? item.id ?? item,
              label: item.label ?? item.name ?? String(item),
            }));
          } else if (typeof data.teacher_certification_status === 'object') {
            options.teacher_certification_status = Object.entries(data.teacher_certification_status).map(([k, v]) => ({
              value: k,
              label: String(v),
            }));
          }
        }

        // staff_list: [{"id": k, "name": v}]
        if (Array.isArray(data.staff_list)) {
          options.staff_list = data.staff_list.map((item: any) => ({
            value: item.id ?? item.value,
            label: item.name ?? item.label ?? String(item),
          }));
        }

        // punishment_type: [{"id": k, "name": v}]
        if (Array.isArray(data.punishment_type)) {
          options.punishment_type = data.punishment_type.map((item: any) => ({
            value: item.id ?? item.value,
            label: item.name ?? item.label ?? String(item),
          }));
        }

        // assessment_results: 字典或数组
        if (data.assessment_results) {
          if (Array.isArray(data.assessment_results)) {
            options.assessment_results = data.assessment_results.map((item: any) => ({
              value: item.value ?? item.id ?? item,
              label: item.label ?? item.name ?? String(item),
            }));
          } else if (typeof data.assessment_results === 'object') {
            options.assessment_results = Object.entries(data.assessment_results).map(([k, v]) => ({
              value: k,
              label: String(v),
            }));
          }
        }

        // 使用函数式更新，保留已有的选项（如 campus_id）
        setEditSelectOptions(prev => ({
          ...prev,
          ...options,
        }));
      }
    } catch (error) {
      console.error('加载编辑选项失败:', error);
    }
  };

  const loadTabData = async (tab: TabType) => {
    if (!staffId) return;
    try {
      setLoading(true);
      let response;
      switch (tab) {
        case 'base':
          response = await getArchivesBaseInfo(staffId);
          if (response.code === 200 && response.data) {
            // 基础信息返回 {staff_students: [], teacher_archives_base: {}}
            setBaseInfo(response.data);
          }
          break;
        case 'position':
          response = await getArchivesPositionInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setPositionInfo(response.data);
          }
          break;
        case 'promotion':
          response = await getArchivesPromotionInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setPromotionInfo(response.data);
          }
          break;
        case 'supervision':
          response = await getArchivesSupervisionInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setSupervisionInfo(response.data);
          }
          break;
        case 'interview':
          response = await getArchivesInterviewInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setInterviewInfo(response.data);
          }
          break;
        case 'complaint':
          response = await getArchivesComplaintInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setComplaintInfo(response.data);
          }
          break;
        case 'reward':
          response = await getArchivesRewardInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setRewardInfo(response.data);
          }
          break;
        case 'punishment':
          response = await getArchivesPunishmentInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setPunishmentInfo(response.data);
          }
          break;
        case 'accounting':
          response = await getArchivesAccountingInfo(staffId);
          if (response.code === 200 && response.data) {
            // 返回 {rows: [], total: number}
            setAccountingInfo(response.data);
          }
          break;
      }
    } catch (error) {
      console.error(`加载${tab}数据失败:`, error);
    } finally {
      setLoading(false);
    }
  };

  // 获取每个标签页需要的字段定义
  const getFormFields = (recordType: string): string[] => {
    switch (recordType) {
      case 'base':
        return [
          'teacher_last_name', 'teacher_first_name', 'gender', 'teacher_name_en',
          'graduation_school_name', 'education', 'major', 'id_num', 'phone',
          'leave_day', 'private_mail', 'public_mail', 'address', 'emergency_contact',
          'emergency_contact_phone', 'start_day', 'end_day', 'probation_end_day',
          'bank_name', 'bank_card_num', 'tr_leader', 'principal', 'tc_status', 'teacher_base_position',
          'mentor_leader_id', 'campus_id'
        ];
      case 'position':
        return ['position', 'position_base_hand_info', 'position_level', 'teacher_name', 'teacher_level'];
      case 'promotion':
        return ['promotion_apply_day', 'promotion_implement_day', 'promotion_mentor_level', 'promotion_teacher_level', 'promotion_post_file'];
      case 'supervision':
        return ['supervision_from', 'supervision_to', 'supervision_info', 'supervision_day', 'supervision_end_day', 'supervision_note', 'supervision_post_file'];
      case 'interview':
        return ['subject', 'interview_day', 'interview_user', 'interviewed_user', 'interview_post_file'];
      case 'complaint':
        return ['complaint_reason', 'complaint_day', 'complaint_post_file'];
      case 'reward':
        return ['campus_id', 'department', 'reward_name', 'reward_day', 'subjects', 'reward_post_file'];
      case 'punishment':
        return ['campus_id', 'department', 'punishment_day', 'punishment_type', 'subjects', 'punishment_post_file'];
      case 'accounting':
        return ['accounting_user', 'accounting_start_time', 'accounting_end_time', 'accounting_result'];
      default:
        return [];
    }
  };

  // 获取字段对应的选项key（用于下拉选择）
  const getFieldOptionKey = (field: string, recordType: string): string | null => {
    // 根据字段名和类型返回对应的选项key
    if (field === 'tr_leader' || field === 'principal' || field === 'supervision_from' || field === 'supervision_to' ||
      field === 'interview_user' || field === 'interviewed_user' || field === 'accounting_user') {
      return 'staff_list';
    }
    if (field === 'punishment_type') {
      return 'punishment_type';
    }
    if (field === 'tc_status' || field === 'teacher_certification_status') {
      return 'teacher_certification_status';
    }
    if (field === 'position_level' || field === 'teacher_level' || field === 'promotion_mentor_level' || field === 'promotion_teacher_level') {
      return 'base_level';
    }
    if (field === 'accounting_result') {
      return 'assessment_results';
    }
    if (field === 'campus_id') {
      return 'campus_id';
    }
    if (field === 'mentor_leader_id') {
      return 'staff_list';
    }
    return null;
  };

  const handleEdit = (recordId: number | null, recordType: string, data: Record<string, unknown>) => {
    setEditRecordId(recordId);
    setEditRecordType(recordType);

    // 根据recordType初始化表单字段
    const fields = getFormFields(recordType);
    const initialData: Record<string, unknown> = { staff_id: staffId };

    if (recordId && data) {
      // 编辑模式：使用现有数据，处理字段映射
      fields.forEach(field => {
        // 处理字段映射
        let sourceField = field;
        // 处理字段映射
        if (recordType === 'base') {
          // 基础信息：后端返回teacher_certification_status和base_position，前端表单使用tc_status和teacher_base_position
          if (field === 'tc_status' && data.teacher_certification_status !== undefined) {
            initialData[field] = data.teacher_certification_status ?? '';
            return;
          }
          if (field === 'teacher_base_position' && data.base_position !== undefined) {
            initialData[field] = data.base_position ?? '';
            return;
          }
          // 字段映射：后端返回的字段名 -> 前端表单字段名
          if (field === 'teacher_first_name' && data.first_name !== undefined) {
            initialData[field] = data.first_name ?? '';
            return;
          }
          if (field === 'teacher_last_name' && data.last_name !== undefined) {
            initialData[field] = data.last_name ?? '';
            return;
          }
          if (field === 'gender' && data.genders !== undefined) {
            initialData[field] = data.genders ?? '';
            return;
          }
          if (field === 'phone' && data.phone_0 !== undefined) {
            initialData[field] = data.phone_0 ?? '';
            return;
          }
          if (field === 'private_mail' && data.email !== undefined) {
            initialData[field] = data.email ?? '';
            return;
          }
          if (field === 'public_mail' && data.company_email !== undefined) {
            initialData[field] = data.company_email ?? '';
            return;
          }
        }
        initialData[field] = data[sourceField] ?? '';
      });
    } else {
      // 新增模式：初始化空值
      fields.forEach(field => {
        // 布尔值字段初始化为0
        if (field === 'tr_leader' || field === 'principal') {
          initialData[field] = 0;
        } else {
          initialData[field] = '';
        }
      });
    }

    setEditFormData(initialData);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      // 准备提交数据，处理字段映射
      const submitData = { ...editFormData };

      // 基础信息的字段映射：前端使用tc_status和teacher_base_position，后端需要teacher_certification_status和base_position
      if (editRecordType === 'base') {
        if (submitData.tc_status !== undefined) {
          submitData.teacher_certification_status = submitData.tc_status;
          delete submitData.tc_status;
        }
        if (submitData.teacher_base_position !== undefined) {
          submitData.base_position = submitData.teacher_base_position;
          delete submitData.teacher_base_position;
        }
        // 确保 campus_id 和 mentor_leader_id 是数字类型
        if (submitData.campus_id !== undefined && submitData.campus_id !== '') {
          submitData.campus_id = Number(submitData.campus_id);
        }
        if (submitData.mentor_leader_id !== undefined && submitData.mentor_leader_id !== '') {
          submitData.mentor_leader_id = Number(submitData.mentor_leader_id);
        }
      }

      let response;
      switch (editRecordType) {
        case 'base':
          response = await editArchivesBaseInfo(submitData as ArchivesBaseInfo);
          break;
        case 'position':
          response = await editArchivesPositionInfo(submitData as ArchivesPositionInfo);
          break;
        case 'promotion':
          response = await editArchivesPromotionInfo(submitData as ArchivesPromotionInfo);
          break;
        case 'supervision':
          response = await editArchivesSupervisionInfo(submitData as ArchivesSupervisionInfo);
          break;
        case 'interview':
          response = await editArchivesInterviewInfo(submitData as ArchivesInterviewInfo);
          break;
        case 'complaint':
          response = await editArchivesComplaintInfo(submitData as ArchivesComplaintInfo);
          break;
        case 'reward':
          response = await editArchivesRewardInfo(submitData as ArchivesRewardInfo);
          break;
        case 'punishment':
          response = await editArchivesPunishmentInfo(submitData as ArchivesPunishmentInfo);
          break;
        case 'accounting':
          response = await editArchivesAccountingInfo(submitData as ArchivesAccountingInfo);
          break;
        default:
          return;
      }

      if (response.code === 200) {
        setShowEditModal(false);
        loadTabData(activeTab);
      } else {
        alert(response.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  const handleDelete = (recordId: number, recordType: string) => {
    setDeleteRecordId(recordId);
    setDeleteRecordType(recordType);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteRecordId || !deleteRecordType) return;
    try {
      const params: DeleteArchivesRecordParams = {
        record_id: deleteRecordId,
        record_type: deleteRecordType as DeleteArchivesRecordParams['record_type'],
      };
      const response = await deleteArchivesRecord(params);
      if (response.code === 200) {
        setShowDeleteModal(false);
        loadTabData(activeTab);
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 字段中文名映射
  const fieldLabels: Record<string, string> = {
    teacher_last_name: '姓',
    teacher_first_name: '名',
    gender: '性别',
    teacher_name_en: '英文名',
    graduation_school_name: '毕业学校',
    education: '学历',
    major: '专业',
    id_num: '身份证号',
    phone: '电话',
    leave_day: '离职日期',
    private_mail: '私人邮箱',
    public_mail: '公司邮箱',
    address: '地址',
    emergency_contact: '紧急联系人',
    emergency_contact_phone: '紧急联系人电话',
    start_day: '合同开始日期',
    end_day: '合同结束日期',
    probation_end_day: '试用期结束日期',
    bank_name: '银行名称',
    bank_card_num: '银行卡号',
    tr_leader: '培训负责人',
    principal: '校长',
    tc_status: '教师资格状态',
    teacher_base_position: '基础岗位',
    mentor_leader_id: '导师负责人',
    campus_id: '校区',
    campus_name: '校区名称',
    position: '岗位',
    position_base_hand_info: '手动内容',
    position_level: '岗位级别',
    position_name: '岗位名称',
    position_name_level: '岗位名称级别',
    teacher_name: '教师名称',
    teacher_level: '教师级别',
    promotion_apply_day: '申请日期',
    promotion_implement_day: '实施日期',
    promotion_mentor_level: '导师级别',
    promotion_teacher_level: '教师级别',
    promotion_post_file: '晋升文件',
    supervision_from: '督导来源',
    supervision_from_name: '督导来源',
    supervision_to: '督导对象',
    supervision_to_name: '督导对象',
    supervision_info: '督导信息',
    supervision_day: '督导日期',
    supervision_end_day: '督导结束日期',
    supervision_note: '督导备注',
    supervision_post_file: '督导文件',
    subject: '主题',
    interview_day: '面试日期',
    interview_user: '面试人员',
    staff_name: '员工姓名',
    interviewed_user: '被面试人员',
    interview_post_file: '面试文件',
    complaint_reason: '投诉原因',
    complaint_day: '投诉日期',
    complaint_post_file: '投诉文件',
    department: '部门',
    reward_name: '奖励名称',
    reward_day: '奖励日期',
    subjects: '科目',
    reward_post_file: '奖励文件',
    punishment_day: '惩罚日期',
    punishment_type: '惩罚类型',
    punishment_post_file: '惩罚文件',
    accounting_user: '考核人员',
    accounting_start_time: '考核开始时间',
    accounting_end_time: '考核结束时间',
    accounting_result: '考核结果',
    operator_name: '操作人',
    create_time: '时间',
    file_link: '文件',
  };

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // 文件大小检查（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过10MB');
      return;
    }

    // 映射字段名到API要求的file-name
    const fieldMapping: Record<string, string> = {
      'promotion_post_file': 'promotion_file',
      'supervision_post_file': 'supervision_file',
      'interview_post_file': 'interview_file',
      'complaint_post_file': 'complaint_file',
      'reward_post_file': 'reward_file',
      'punishment_post_file': 'punishment_file',
    };

    const apiFieldName = fieldMapping[field] || field;

    try {
      const res = await uploadArchivesFile(apiFieldName, file);
      if (res.code === 200 && res.data) {
        setEditFormData({ ...editFormData, [field]: res.data });
        alert('上传成功');
      } else {
        alert('上传失败：' + (res.message || '未知错误'));
      }
    } catch (err) {
      console.error('上传出错:', err);
      alert('上传出错，请稍后重试');
    }
  };

  // 渲染表单字段
  const renderFormField = (key: string, value: unknown, recordType: string) => {
    if (key === 'staff_id' || key === 'id' || key === 'record_id') return null; // 跳过ID字段

    const optionKey = getFieldOptionKey(key, recordType);
    const fieldOptions = optionKey ? (editSelectOptions[optionKey] || []) : [];
    const isSelect = fieldOptions.length > 0;
    // 只有 start_day 使用日期选择器，end_day、probation_end_day 和 leave_day 使用文本输入
    // 其他包含 day 或 time 的字段仍然使用日期选择器
    const isDate = (key.includes('day') || key.includes('time')) &&
      key !== 'end_day' &&
      key !== 'probation_end_day' &&
      key !== 'leave_day';
    const isMultiSelect = key === 'interview_user'; // 多选字段
    const isSearchable = key === 'supervision_from' || key === 'supervision_to' || key === 'interview_user'; // 可搜索字段
    const isBoolean = key === 'tr_leader' || key === 'principal'; // 布尔值字段
    const isFile = key.endsWith('_file'); // 文件字段
    const fieldValue = value ?? '';

    return (
      <div key={key} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldLabels[key] || key}
        </label>
        {isBoolean ? (
          <select
            value={String(fieldValue)}
            onChange={(e) => setEditFormData({ ...editFormData, [key]: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">否</option>
            <option value="1">是</option>
          </select>
        ) : key === 'gender' ? (
          <select
            value={String(fieldValue)}
            onChange={(e) => setEditFormData({ ...editFormData, [key]: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            <option value="0">男</option>
            <option value="1">女</option>
          </select>
        ) : isFile ? (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => handleFileChange(e, key)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {fieldValue && (
              <div className="text-sm">
                <span className="text-gray-500 mr-2">当前文件:</span>
                <a
                  href={String(fieldValue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  查看文件
                </a>
              </div>
            )}
          </div>
        ) : isSearchable && isSelect ? (
          <SearchableSelect
            multiple={isMultiSelect}
            options={fieldOptions.map(opt => ({ id: Number(opt.value), name: opt.label }))}
            value={isMultiSelect
              ? String(fieldValue).split(',').filter(v => v).map(Number)
              : (Number(fieldValue) || 0)
            }
            onValueChange={(val) => {
              if (isMultiSelect) {
                const selected = Array.isArray(val) ? val : [val];
                setEditFormData({ ...editFormData, [key]: selected.join(',') });
              } else {
                setEditFormData({ ...editFormData, [key]: val });
              }
            }}
            placeholder={`请选择${fieldLabels[key] || key}`}
            searchPlaceholder="搜索..."
            className="w-full"
          />
        ) : isSelect ? (
          <select
            value={String(fieldValue)}
            onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            {fieldOptions.map((opt) => (
              <option key={opt.value} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : isDate ? (
          <input
            type="date"
            value={String(fieldValue)}
            onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <input
            type="text"
            value={String(fieldValue)}
            onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  // 渲染数据表格（用于列表类型的标签页）
  const renderRecordTable = (
    records: Array<Record<string, unknown>>,
    recordType: string,
    columns: string[]
  ) => {
    if (!records || records.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          暂无记录
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {fieldLabels[col] || col}
                </th>
              ))}
              {canEdit && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => {
              const recordId = (record.record_id || record.id || index) as number;
              return (
                <tr key={recordId} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(col.endsWith('_file') || col === 'file_link') && record[col] ? (
                        <a
                          href={String(record[col])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          查看文件
                        </a>
                      ) : (
                        String(record[col] ?? '-')
                      )}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(recordId, recordType)}
                          className="w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center transition-colors"
                          title="删除"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染标签页内容
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'base':
        if (!baseInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        const teacherArchivesBase = (baseInfo as any).teacher_archives_base || {};
        const staffStudents = (baseInfo as any).staff_students || [];
        return (
          <div className="space-y-6">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // 基础信息需要从 teacher_archives_base 中提取，使用staffId作为recordId表示编辑模式
                    handleEdit(staffId, 'base', teacherArchivesBase);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PencilIcon className="h-4 w-4" />
                  编辑基础信息
                </button>
              </div>
            )}
            {/* 基础信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基础信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFormFields('base').map((field) => {
                  // 字段映射：前端字段名 -> 后端字段名
                  let sourceField = field;
                  if (field === 'teacher_first_name') sourceField = 'first_name';
                  else if (field === 'teacher_last_name') sourceField = 'last_name';
                  else if (field === 'gender') sourceField = 'genders';
                  else if (field === 'phone') sourceField = 'phone_0';
                  else if (field === 'private_mail') sourceField = 'email';
                  else if (field === 'public_mail') sourceField = 'company_email';
                  else if (field === 'tc_status') sourceField = 'teacher_certification_status';
                  else if (field === 'teacher_base_position') sourceField = 'base_position';

                  const value = teacherArchivesBase[sourceField];

                  // 字段中文名映射
                  const fieldLabels: Record<string, string> = {
                    teacher_last_name: '姓',
                    teacher_first_name: '名',
                    gender: '性别',
                    teacher_name_en: '英文名',
                    graduation_school_name: '毕业学校',
                    education: '学历',
                    major: '专业',
                    id_num: '身份证号',
                    phone: '电话',
                    leave_day: '离职日期',
                    private_mail: '私人邮箱',
                    public_mail: '公司邮箱',
                    address: '地址',
                    emergency_contact: '紧急联系人',
                    emergency_contact_phone: '紧急联系人电话',
                    start_day: '开始日期',
                    end_day: '结束日期',
                    probation_end_day: '试用期结束日期',
                    bank_name: '银行名称',
                    bank_card_num: '银行卡号',
                    tr_leader: '培训负责人',
                    principal: '校长',
                    tc_status: '教师资格状态',
                    teacher_base_position: '基础岗位',
                    mentor_leader_id: '导师负责人',
                    campus_id: '校区',
                    campus_name: '校区名称',
                  };
                  const fieldLabel = fieldLabels[field] || field;

                  // 处理选项字段的显示值
                  let displayValue = value;

                  // 布尔值字段（0/1）显示为"是"/"否"
                  if (field === 'tr_leader' || field === 'principal') {
                    displayValue = value === 1 || value === '1' ? '是' : (value === 0 || value === '0' ? '否' : '-');
                  }
                  // 性别字段（0=男，1=女）
                  else if (field === 'gender') {
                    displayValue = value === 1 || value === '1' ? '女' : (value === 0 || value === '0' ? '男' : '-');
                  }
                  // 选项字段从 editSelectOptions 中查找显示文本
                  else if (field === 'mentor_leader_id') {
                    const staffList = editSelectOptions.staff_list || [];
                    const staff = staffList.find((s: any) =>
                      s.value === value ||
                      s.value === Number(value) ||
                      s.value === String(value) ||
                      s.id === value ||
                      s.id === Number(value) ||
                      s.id === String(value)
                    );
                    displayValue = staff ? (staff.label || (staff as any).name || staff.value) : (value ? '无' : '-');
                  } else if (field === 'tc_status') {
                    const options = editSelectOptions.teacher_certification_status || [];
                    // 尝试多种匹配方式：数字、字符串、id字段
                    const option = options.find((o: any) =>
                      o.value === value ||
                      o.value === Number(value) ||
                      o.value === String(value) ||
                      o.id === value ||
                      o.id === Number(value) ||
                      o.id === String(value)
                    );
                    displayValue = option ? (option.label || (option as any).name || option.value) : (value ?? '-');
                  } else if (field === 'campus_id') {
                    const campusList = editSelectOptions.campus_id || [];
                    // 尝试多种匹配方式：数字、字符串、id字段
                    const campus = campusList.find((c: any) =>
                      c.value === value ||
                      c.value === Number(value) ||
                      c.value === String(value) ||
                      c.id === value ||
                      c.id === Number(value) ||
                      c.id === String(value)
                    );
                    displayValue = campus ? (campus.label || (campus as any).name || campus.value) : (value ?? '-');
                  } else {
                    displayValue = value ?? '-';
                  }

                  return (
                    <div key={field} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500">{fieldLabel}</div>
                      <div className="mt-1 text-lg text-gray-900">{String(displayValue)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 学生列表 */}
            {staffStudents.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">所带学生</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入学日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">毕业日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffStudents.map((student: any) => (
                        <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.enrolment_date || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.graduation_date || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.active_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'position':
        if (!positionInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const positionRecords = Array.isArray((positionInfo as any).rows) ? (positionInfo as any).rows : [];
        const positionColumns = positionRecords.length > 0
          ? Object.keys(positionRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['position', 'position_level', 'position_name', 'position_name_level', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'position', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增岗位信息
                </button>
              </div>
            )}
            {renderRecordTable(positionRecords, 'position', positionColumns)}
          </div>
        );

      case 'promotion':
        if (!promotionInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const promotionRecords = Array.isArray((promotionInfo as any).rows) ? (promotionInfo as any).rows : [];
        const promotionColumns = promotionRecords.length > 0
          ? Object.keys(promotionRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['promotion_mentor_level', 'promotion_teacher_level', 'promotion_apply_day', 'promotion_implement_day', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'promotion', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增晋升信息
                </button>
              </div>
            )}
            {renderRecordTable(promotionRecords, 'promotion', promotionColumns)}
          </div>
        );

      case 'supervision':
        if (!supervisionInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const supervisionRecords = Array.isArray((supervisionInfo as any).rows) ? (supervisionInfo as any).rows : [];
        const supervisionColumns = supervisionRecords.length > 0
          ? Object.keys(supervisionRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['supervision_from_name', 'supervision_to_name', 'supervision_info', 'supervision_day', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'supervision', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增督导信息
                </button>
              </div>
            )}
            {renderRecordTable(supervisionRecords, 'supervision', supervisionColumns)}
          </div>
        );

      case 'interview':
        if (!interviewInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const interviewRecords = Array.isArray((interviewInfo as any).rows) ? (interviewInfo as any).rows : [];
        const interviewColumns = interviewRecords.length > 0
          ? Object.keys(interviewRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['subject', 'interview_day', 'staff_name', 'interview_user', 'interviewed_user', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'interview', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增面试记录
                </button>
              </div>
            )}
            {renderRecordTable(interviewRecords, 'interview', interviewColumns)}
          </div>
        );

      case 'complaint':
        if (!complaintInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const complaintRecords = Array.isArray((complaintInfo as any).rows) ? (complaintInfo as any).rows : [];
        const complaintColumns = complaintRecords.length > 0
          ? Object.keys(complaintRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['complaint_reason', 'complaint_day', 'staff_name', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'complaint', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增投诉记录
                </button>
              </div>
            )}
            {renderRecordTable(complaintRecords, 'complaint', complaintColumns)}
          </div>
        );

      case 'reward':
        if (!rewardInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const rewardRecords = Array.isArray((rewardInfo as any).rows) ? (rewardInfo as any).rows : [];
        const rewardColumns = rewardRecords.length > 0
          ? Object.keys(rewardRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['reward_name', 'reward_day', 'campus_name', 'department', 'subjects', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'reward', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增奖励记录
                </button>
              </div>
            )}
            {renderRecordTable(rewardRecords, 'reward', rewardColumns)}
          </div>
        );

      case 'punishment':
        if (!punishmentInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const punishmentRecords = Array.isArray((punishmentInfo as any).rows) ? (punishmentInfo as any).rows : [];
        const punishmentColumns = punishmentRecords.length > 0
          ? Object.keys(punishmentRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['result', 'punishment_day', 'campus_name', 'department', 'subjects', 'operator_name', 'create_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'punishment', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增惩罚记录
                </button>
              </div>
            )}
            {renderRecordTable(punishmentRecords, 'punishment', punishmentColumns)}
          </div>
        );

      case 'accounting':
        if (!accountingInfo) return <div className="text-center py-8 text-gray-500">暂无数据</div>;
        // 后端返回 {rows: [], total: number}
        const accountingRecords = Array.isArray((accountingInfo as any).rows) ? (accountingInfo as any).rows : [];
        const accountingColumns = accountingRecords.length > 0
          ? Object.keys(accountingRecords[0]).filter(k => k !== 'record_id' && k !== 'id' && k !== 'staff_id')
          : ['accounting_user', 'accounting_staff', 'accounting_start_time', 'accounting_end_time', 'accounting_result', 'update_time'];
        return (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleEdit(null, 'accounting', {})}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  新增考核记录
                </button>
              </div>
            )}
            {renderRecordTable(accountingRecords, 'accounting', accountingColumns)}
          </div>
        );

      default:
        return null;
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看档案详情</p>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'base', label: '基础信息' },
    { id: 'position', label: '岗位信息' },
    { id: 'promotion', label: '晋升信息' },
    { id: 'supervision', label: '督导信息' },
    { id: 'interview', label: '面试记录' },
    { id: 'complaint', label: '投诉记录' },
    { id: 'reward', label: '奖励记录' },
    { id: 'punishment', label: '惩罚记录' },
    { id: 'accounting', label: '考核记录' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/core/archives')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          返回列表
        </button>

        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">档案详情</h1>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* 编辑模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900">
                {editRecordId ? '编辑' : '新增'} {tabs.find(t => t.id === editRecordType)?.label || ''}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {Object.keys(editFormData).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无字段可编辑，请等待数据加载
                </div>
              ) : (
                getFormFields(editRecordType).map((field) =>
                  renderFormField(field, editFormData[field], editRecordType)
                )
              )}
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    确定要删除这条记录吗？此操作无法撤销。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

