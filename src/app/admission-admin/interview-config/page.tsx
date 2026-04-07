'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getInterviewSelect,
  getInterviewConfigTable,
  getInterviewTimeSelect,
  getInterviewRoomSelect,
  getInterviewRoom,
  addInterviewConfig,
  deleteInterviewConfig,
  addInterviewTime,
  deleteInterviewTime,
  addInterviewRoom,
  type InterviewConfig,
  type InterviewTimeConfig,
  type InterviewRoomConfig,
  type SelectOption,
  type AddInterviewConfigParams,
} from '@/services/auth';
import SearchableSelect from '@/components/SearchableSelect';

/** 主表行 interviewer_time_list → 时间列表 */
function mapTimeListFromConfig(config: InterviewConfig): InterviewTimeConfig[] {
  const list = config.interviewer_time_list ?? [];
  return [...list]
    .sort((a, b) => a - b)
    .map((time) => ({
      id: time,
      time_slot: String(time),
      record_id: config.record_id,
    }));
}

/** get_interview_time_select 的 interview_time：字符串数组，索引为 key，与 interviewer_time_list 一致 */
function mapInterviewTimeSlotsToOptions(items: string[]): SelectOption[] {
  return items.map((label, index) => ({ id: index, name: label }));
}

function mapRoomListFromConfig(config: InterviewConfig): InterviewRoomConfig[] {
  const list = config.interview_room_list ?? [];
  return list.map((room) => ({
    record_id: 0,
    room_id: room.room_id,
    room_info: room.room_info ?? '',
    create_time: '',
    update_time: '',
  }));
}

/** 根据接口行数据填充 1…N 槽位草稿（用于展开/提交成功后同步） */
function buildRoomDraftFromRows(
  recordId: number,
  n: number,
  rooms: InterviewRoomConfig[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (let slot = 1; slot <= n; slot++) {
    const r = rooms.find((x) => Number(x.room_id) === slot);
    out[`${recordId}-${slot}`] = r?.room_info != null ? String(r.room_info) : '';
  }
  return out;
}

/** 1…N 槽位是否均有非空内容（trim 后），用于控制是否允许保存 */
function roomsAllSlotsFilled(
  recordId: number,
  n: number,
  draft: Record<string, string>,
): boolean {
  if (n < 1) return false;
  for (let slot = 1; slot <= n; slot++) {
    if (!(draft[`${recordId}-${slot}`] ?? '').trim()) return false;
  }
  return true;
}

/** 提交负载：仅包含有内容的 interview_room_k（保存前由页面保证各槽均已填写） */
function buildFullRoomPayload(
  recordId: number,
  n: number,
  draft: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { record_id: recordId };
  for (let slot = 1; slot <= n; slot++) {
    const text = (draft[`${recordId}-${slot}`] ?? '').trim();
    if (text) payload[`interview_room_${slot}`] = text;
  }
  return payload;
}

type ConfigFormState = {
  exam_day: string;
  interview_day: string;
  interviewer_num: string;
  interview_desc: string;
};

const emptyConfigForm = (): ConfigFormState => ({
  exam_day: '',
  interview_day: '',
  interviewer_num: '',
  interview_desc: '',
});

export default function InterviewConfigPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.MANAGE_INTERVIEW_CONFIG);

  // 状态管理
  const [interviewConfigs, setInterviewConfigs] = useState<InterviewConfig[]>([]);
  const [examDayOptions, setExamDayOptions] = useState<string[]>([]);
  const [interviewerNumOptions, setInterviewerNumOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 模态框状态
  const [showAddConfigModal, setShowAddConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<InterviewConfig | null>(null);
  const [configForm, setConfigForm] = useState<ConfigFormState>(emptyConfigForm);
  
  // 时间配置相关状态
  const [timeConfigs, setTimeConfigs] = useState<InterviewTimeConfig[]>([]);
  const [timeConfigLoading, setTimeConfigLoading] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [timeFormData, setTimeFormData] = useState<Record<string, any>>({});
  const [timeSelect, setTimeSelect] = useState<SelectOption[]>([]);

  // 时间配置：行内展开（新增时间仍为弹窗）
  const [expandedTimeRecordId, setExpandedTimeRecordId] = useState<number | null>(null);

  // 会议房间：行内展开；1…N 草稿；删除仅清前端，保存须全部槽位有内容（兼容后端不按空槽删除）
  const [expandedRoomRecordId, setExpandedRoomRecordId] = useState<number | null>(null);
  const [roomExpandInterviewerNum, setRoomExpandInterviewerNum] = useState(0);
  const [roomRowsByRecordId, setRoomRowsByRecordId] = useState<Record<number, InterviewRoomConfig[]>>({});
  const [roomExpandLoading, setRoomExpandLoading] = useState(false);
  const [roomMutationLoading, setRoomMutationLoading] = useState(false);
  const [roomAddDraft, setRoomAddDraft] = useState<Record<string, string>>({});

  // 加载配置列表
  const loadConfigs = async () => {
    try {
      const result = await getInterviewConfigTable();
      if (result.code === 200 && result.data) {
        setInterviewConfigs(result.data.rows);
      }
    } catch (error) {
      console.error('加载面试配置失败:', error);
    }
  };

  // 加载select选项
  const loadSelects = async () => {
    try {
      const result = await getInterviewSelect();
      if (result.code === 200 && result.data) {
        setExamDayOptions(result.data.exam_day || []);
        setInterviewerNumOptions(result.data.interviewer_num || []);
      }
    } catch (error) {
      console.error('加载select选项失败:', error);
    }
  };

  /** 时间列表来自主表行的 interviewer_time_list；展示文案与「添加时间」下拉来自 get_interview_time_select */
  const applyTimeFromConfigRow = (config: InterviewConfig) => {
    setTimeConfigs(mapTimeListFromConfig(config));
  };

  const loadInterviewTimeSlots = async (recordId: number) => {
    const res = await getInterviewTimeSelect(recordId);
    if (res.code === 200 && Array.isArray(res.data?.interview_time)) {
      setTimeSelect(mapInterviewTimeSlotsToOptions(res.data.interview_time));
    } else {
      setTimeSelect([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadConfigs(), loadSelects()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const availableTimeSelectOptions = useMemo(
    () => timeSelect.filter((opt) => !timeConfigs.some((t) => t.id === opt.id)),
    [timeSelect, timeConfigs],
  );

  // 权限检查（须在所有 Hook 之后）
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限管理面试配置</p>
        </div>
      </div>
    );
  }

  // 打开添加配置模态框
  const handleAddConfig = () => {
    setConfigForm(emptyConfigForm());
    setShowAddConfigModal(true);
  };

  /** 变更后拉取表格并同步当前弹窗对应的行（含 interviewer_time_list / interview_room_list） */
  const syncConfigRowFromServer = async (recordId: number): Promise<InterviewConfig | null> => {
    const res = await getInterviewConfigTable();
    if (res.code !== 200 || !res.data) return null;
    setInterviewConfigs(res.data.rows);
    const row = res.data.rows.find((r) => r.record_id === recordId) ?? null;
    if (row) {
      setSelectedConfig((prev) => (prev?.record_id === recordId ? row : prev));
    }
    return row;
  };

  /** 行内展开时间配置：已选列表来自主表行；可选时间段来自 get_interview_time_select */
  const toggleTimeExpand = async (config: InterviewConfig) => {
    const id = config.record_id;
    if (expandedTimeRecordId === id) {
      setExpandedTimeRecordId(null);
      return;
    }
    setExpandedRoomRecordId(null);
    setExpandedTimeRecordId(id);
    setSelectedConfig(config);
    applyTimeFromConfigRow(config);
    setTimeConfigLoading(true);
    try {
      await loadInterviewTimeSlots(id);
    } finally {
      setTimeConfigLoading(false);
    }
  };

  const refreshRoomsForRecord = async (recordId: number) => {
    const roomRes = await getInterviewRoom(recordId);
    if (roomRes.code === 200 && roomRes.data && Array.isArray(roomRes.data.rows)) {
      setRoomRowsByRecordId((prev) => ({
        ...prev,
        [recordId]: roomRes.data!.rows as InterviewRoomConfig[],
      }));
    }
  };

  /** 行内展开会议房间：加载后填充各槽草稿 */
  const toggleRoomExpand = async (config: InterviewConfig) => {
    const id = config.record_id;
    if (expandedRoomRecordId === id) {
      setExpandedRoomRecordId(null);
      return;
    }
    setExpandedTimeRecordId(null);
    setExpandedRoomRecordId(id);
    setRoomExpandInterviewerNum(config.interviewer_num ?? 0);
    setRoomExpandLoading(true);
    try {
      const [selRes, roomRes] = await Promise.all([
        getInterviewRoomSelect(id),
        getInterviewRoom(id),
      ]);
      const n =
        (selRes.code === 200 && selRes.data?.interviewer_num != null
          ? selRes.data.interviewer_num
          : config.interviewer_num) ?? 0;
      setRoomExpandInterviewerNum(n);
      let rows: InterviewRoomConfig[] = [];
      if (roomRes.code === 200 && roomRes.data?.rows?.length) {
        rows = roomRes.data.rows as InterviewRoomConfig[];
      } else {
        rows = mapRoomListFromConfig(config);
      }
      setRoomRowsByRecordId((prev) => ({ ...prev, [id]: rows }));
      setRoomAddDraft((prev) => ({ ...prev, ...buildRoomDraftFromRows(id, n, rows) }));
    } catch (e) {
      console.error('加载会议房间失败:', e);
      setRoomExpandInterviewerNum(config.interviewer_num ?? 0);
      const fallback = mapRoomListFromConfig(config);
      const n0 = config.interviewer_num ?? 0;
      setRoomRowsByRecordId((prev) => ({ ...prev, [id]: fallback }));
      setRoomAddDraft((prev) => ({ ...prev, ...buildRoomDraftFromRows(id, n0, fallback) }));
    } finally {
      setRoomExpandLoading(false);
    }
  };

  /** 提交会议房间：须 1…N 均有内容，避免后端未支持「空槽/省略即删」时误提交 */
  const handleSubmitFullRooms = async (recordId: number, n: number) => {
    if (roomMutationLoading || roomExpandLoading) return;
    if (!recordId || !Number.isFinite(n) || n < 1) {
      alert('数据异常，请刷新页面后重试');
      return;
    }
    const draft = roomAddDraft;
    if (!roomsAllSlotsFilled(recordId, n, draft)) {
      alert('存在未填写的会议房间槽位，请先补全全部槽位内容后再保存。');
      return;
    }
    const payload = buildFullRoomPayload(recordId, n, draft);
    setRoomMutationLoading(true);
    try {
      const result = await addInterviewRoom(payload as Record<string, any>);
      if (result.code === 200) {
        alert('保存成功');
        await refreshRoomsForRecord(recordId);
        const r2 = await getInterviewRoom(recordId);
        if (r2.code === 200 && r2.data?.rows) {
          setRoomAddDraft((prev) => ({
            ...prev,
            ...buildRoomDraftFromRows(recordId, n, r2.data!.rows as InterviewRoomConfig[]),
          }));
        }
        await syncConfigRowFromServer(recordId);
      } else {
        alert('保存失败: ' + result.message);
      }
    } catch (error) {
      console.error('保存会议房间失败:', error);
      alert('保存失败');
    } finally {
      setRoomMutationLoading(false);
    }
  };

  /** 删除某槽：仅清空本页草稿，不请求接口；须补全全部槽位后才能点保存 */
  const handleRemoveRoomSlot = (recordId: number, slot: number) => {
    // if (!confirm('确定清空该槽位？仅在本页生效；保存前须补全全部会议房间内容。')) return;
    const key = `${recordId}-${slot}`;
    setRoomAddDraft((prev) => ({ ...prev, [key]: '' }));
  };

  // 打开添加时间模态框（下拉选项已在展开该行时间配置时由 get_interview_time_select 加载）
  const handleAddTime = (config: InterviewConfig) => {
    setSelectedConfig(config);
    setTimeFormData({ record_id: config.record_id, time_slots: [] as number[] });
    setShowAddTimeModal(true);
  };

  // 打开删除确认模态框
  const handleDeleteClick = (config: InterviewConfig) => {
    setSelectedConfig(config);
    setExpandedTimeRecordId(null);
    setExpandedRoomRecordId(null);
    setShowDeleteModal(true);
  };

  // 提交配置
  const handleSubmitConfig = async () => {
    const examDay = configForm.exam_day.trim();
    const interviewerNum = Number(configForm.interviewer_num);
    if (examDayOptions.length === 0) {
      alert('暂无可选考试日期，无法新增');
      return;
    }
    if (interviewerNumOptions.length === 0) {
      alert('暂无可选面试官人数，无法新增');
      return;
    }
    if (!examDay || !examDayOptions.includes(examDay)) {
      alert('请从列表中选择考试日期');
      return;
    }
    if (!configForm.interview_day.trim()) {
      alert('请选择面试日期');
      return;
    }
    if (!configForm.interview_desc.trim()) {
      alert('请填写面试名称');
      return;
    }
    if (!Number.isFinite(interviewerNum) || !interviewerNumOptions.includes(interviewerNum)) {
      alert('请从列表中选择面试官人数');
      return;
    }
    const body: AddInterviewConfigParams = {
      interviewer_num: interviewerNum,
      exam_day: examDay,
      interview_desc: configForm.interview_desc.trim(),
      interview_day: configForm.interview_day.trim(),
    };
    try {
      const result = await addInterviewConfig(body);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddConfigModal(false);
        setConfigForm(emptyConfigForm());
        loadConfigs();
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };

  // 提交时间配置（后端 add_interview_time 使用 interview_time 逗号分隔多个 time_slot）
  const handleSubmitTime = async () => {
    if (timeConfigLoading) return;
    const rid = timeFormData.record_id;
    if (rid == null || !Number.isFinite(Number(rid))) {
      alert('缺少配置记录，请关闭弹窗后重新点击「添加时间」');
      return;
    }
    const slots = timeFormData.time_slots as number[] | undefined;
    if (!Array.isArray(slots) || slots.length === 0) {
      alert('请至少选择一个时间');
      return;
    }
    const invalid = slots.some((s) => !Number.isFinite(Number(s)));
    if (invalid) {
      alert('时间选择无效，请重新选择');
      return;
    }
    const payload = {
      record_id: Number(rid),
      interview_time: slots.map((s) => Number(s)).join(','),
    };
    console.log('[interview-config] addInterviewTime submit', payload);
    try {
      setTimeConfigLoading(true);
      const result = await addInterviewTime(payload);
      if (result.code === 200) {
        alert('添加成功');
        setShowAddTimeModal(false);
        setTimeFormData({});
        const row = await syncConfigRowFromServer(Number(rid));
        if (row && expandedTimeRecordId === Number(rid)) {
          applyTimeFromConfigRow(row);
        }
      } else {
        alert('添加失败: ' + result.message);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    } finally {
      setTimeConfigLoading(false);
    }
  };

  // 删除时间配置
  const handleDeleteTime = async (recordId: number, timeSlot: number) => {
    if (!confirm('确定要删除这个时间配置吗？')) return;
    try {
      setTimeConfigLoading(true);
      const result = await deleteInterviewTime(recordId, timeSlot);
      if (result.code === 200) {
        alert('删除成功');
        const row = await syncConfigRowFromServer(recordId);
        if (row && expandedTimeRecordId === recordId) {
          applyTimeFromConfigRow(row);
        }
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    } finally {
      setTimeConfigLoading(false);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedConfig) return;
    
    try {
      const result = await deleteInterviewConfig(selectedConfig.record_id);
      if (result.code === 200) {
        alert('删除成功');
        setShowDeleteModal(false);
        setSelectedConfig(null);
        loadConfigs();
      } else {
        alert('删除失败: ' + result.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">面试配置</h1>
          <p className="mt-2 text-sm text-gray-600">管理面试配置信息</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={handleAddConfig}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增面试配置
            </button>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/90 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="sticky left-0 z-[1] bg-gray-50 px-4 py-3.5 text-left text-xs font-semibold sm:px-6">
                      序号
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold whitespace-nowrap sm:px-6">
                      考试日期
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold whitespace-nowrap sm:px-6">
                      面试官数量
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold whitespace-nowrap sm:px-6">
                      面试日期
                    </th>
                    <th scope="col" className="min-w-[12rem] max-w-md px-4 py-3.5 text-left text-xs font-semibold sm:px-6">
                      面试说明
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold whitespace-nowrap sm:px-6">
                      创建时间
                    </th>
                    <th scope="col" className="sticky right-0 z-[1] bg-gray-50 px-4 py-3.5 text-right text-xs font-semibold shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] sm:px-6">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {interviewConfigs.map((config, index) => (
                    <Fragment key={config.record_id}>
                      <tr className="group transition-colors hover:bg-gray-50/80">
                        <td className="sticky left-0 z-[1] bg-white px-4 py-3.5 text-gray-500 tabular-nums group-hover:bg-gray-50/80 sm:px-6">
                          {index + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-900 sm:px-6">
                          {config.ref_day || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-900 tabular-nums sm:px-6">
                          {config.interviewer_num ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-900 sm:px-6">
                          {config.interview_day || '—'}
                        </td>
                        <td
                          className="max-w-xs px-4 py-3.5 text-gray-900 sm:max-w-md sm:px-6"
                          title={config.interview_desc || undefined}
                        >
                          <span className="line-clamp-2 break-words">{config.interview_desc || '—'}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 sm:px-6">
                          {config.create_time || '—'}
                        </td>
                        <td className="sticky right-0 z-[1] bg-white px-4 py-3 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] group-hover:bg-gray-50/80 sm:px-6">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleTimeExpand(config)}
                              className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/15 transition hover:bg-blue-100 sm:text-sm"
                            >
                              {expandedTimeRecordId === config.record_id ? '收起时间' : '时间配置'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleRoomExpand(config)}
                              className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/15 transition hover:bg-emerald-100 sm:text-sm"
                            >
                              {expandedRoomRecordId === config.record_id ? '收起会议' : '会议房间'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(config)}
                              className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/15 transition hover:bg-red-100 sm:text-sm"
                              title="删除"
                            >
                              <TrashIcon className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">删除</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedTimeRecordId === config.record_id && (
                        <tr className="bg-gray-50/90">
                          <td colSpan={7} className="px-4 py-4 sm:px-6">
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-sm text-gray-600">
                                  时间配置
                                  <span className="ml-2 font-medium text-gray-900">
                                    {config.interview_desc?.trim() || '—'}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddTime(config)}
                                  disabled={timeConfigLoading}
                                  className="inline-flex shrink-0 items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <PlusIcon className="mr-1 h-4 w-4" />
                                  添加时间
                                </button>
                              </div>
                              {timeConfigLoading && expandedTimeRecordId === config.record_id ? (
                                <div className="flex justify-center py-8">
                                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                                </div>
                              ) : timeConfigs.length === 0 ? (
                                <p className="py-8 text-center text-sm text-gray-400">暂无时间配置</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                  {timeConfigs.map((time) => (
                                    <div
                                      key={time.id}
                                      className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm tabular-nums text-gray-900 shadow-sm transition hover:border-blue-300 hover:bg-white hover:shadow"
                                    >
                                      <span className="min-w-0 truncate">
                                        {timeSelect.find((o) => o.id === time.id)?.name ?? time.time_slot}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={timeConfigLoading}
                                        onClick={() => handleDeleteTime(config.record_id, time.id)}
                                        className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition group-hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                                        title="删除"
                                      >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedRoomRecordId === config.record_id && (
                        <tr className="bg-gray-50/90">
                          <td colSpan={7} className="px-4 py-4 sm:px-6">
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="mb-3 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:items-baseline sm:justify-between">
                                <span>
                                  会议房间（面试官人数{' '}
                                  <span className="font-semibold text-gray-900">{roomExpandInterviewerNum || '—'}</span>）
                                </span>
                                <span className="text-xs text-gray-500">
                                  「删除」仅清空本页该槽文字，不会立刻保存；须 1…N 槽位均填写完整后才能提交（兼容当前后端不按空槽删除）。
                                </span>
                              </div>
                              {roomExpandLoading && expandedRoomRecordId === config.record_id ? (
                                <div className="flex justify-center py-8">
                                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                                </div>
                              ) : roomExpandInterviewerNum < 1 ? (
                                <p className="py-6 text-center text-sm text-gray-500">无法获取面试官人数，请刷新后重试。</p>
                              ) : (
                                <div className="space-y-3">
                                  {Array.from({ length: roomExpandInterviewerNum }, (_, idx) => idx + 1).map((slot) => {
                                    const draftKey = `${config.record_id}-${slot}`;
                                    return (
                                      <div
                                        key={slot}
                                        className="rounded-md border border-gray-100 bg-gray-50/50 p-3 sm:p-4"
                                      >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                          <span className="text-sm font-medium text-gray-900">
                                            面试房间号 {slot}
                                            <span className="ml-2 font-mono text-xs font-normal text-gray-500">
                                              interview_room_{slot}
                                            </span>
                                          </span>
                                          <button
                                            type="button"
                                            disabled={roomMutationLoading || roomExpandLoading}
                                            onClick={() => handleRemoveRoomSlot(config.record_id, slot)}
                                            className="inline-flex shrink-0 items-center rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/15 hover:bg-red-100 disabled:opacity-50"
                                          >
                                            删除
                                          </button>
                                        </div>
                                        <textarea
                                          value={roomAddDraft[draftKey] ?? ''}
                                          onChange={(e) =>
                                            setRoomAddDraft((prev) => ({
                                              ...prev,
                                              [draftKey]: e.target.value,
                                            }))
                                          }
                                          rows={3}
                                          disabled={roomMutationLoading}
                                          placeholder="粘贴腾讯会议链接、会议号或说明（各槽均须填写后才能保存）"
                                          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                                        />
                                      </div>
                                    );
                                  })}
                                  <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-start sm:justify-between">
                                    <p className="text-xs text-gray-500">
                                      编辑后点击「提交会议房间」保存；若有槽位为空则无法保存，请先补全（含清空后需重新填写）。
                                    </p>
                                    <button
                                      type="button"
                                      disabled={
                                        roomMutationLoading ||
                                        roomExpandLoading ||
                                        !roomsAllSlotsFilled(
                                          config.record_id,
                                          roomExpandInterviewerNum,
                                          roomAddDraft,
                                        )
                                      }
                                      onClick={() =>
                                        handleSubmitFullRooms(config.record_id, roomExpandInterviewerNum)
                                      }
                                      className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      提交会议房间
                                    </button>
                                  </div>
                                  {(roomRowsByRecordId[config.record_id] ?? []).filter((r) => {
                                    const rid = Number(r.room_id);
                                    return (
                                      !Number.isFinite(rid) ||
                                      rid < 1 ||
                                      rid > roomExpandInterviewerNum
                                    );
                                  }).length > 0 && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3">
                                      <p className="mb-2 text-xs font-medium text-amber-900">
                                        以下房间不在当前面试官人数槽位内（仅展示）：
                                      </p>
                                      <ul className="space-y-2">
                                        {(roomRowsByRecordId[config.record_id] ?? [])
                                          .filter((r) => {
                                            const rid = Number(r.room_id);
                                            return (
                                              !Number.isFinite(rid) ||
                                              rid < 1 ||
                                              rid > roomExpandInterviewerNum
                                            );
                                          })
                                          .map((room) => (
                                            <li
                                              key={`extra-${room.room_id}`}
                                              className="rounded border border-amber-100 bg-white p-2"
                                            >
                                              <div className="min-w-0 text-sm">
                                                <span className="font-mono text-xs text-gray-500">
                                                  room_id {room.room_id}
                                                </span>
                                                <p className="mt-1 whitespace-pre-wrap break-words text-gray-800">
                                                  {room.room_info || '—'}
                                                </p>
                                              </div>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {interviewConfigs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 添加配置模态框 */}
        {showAddConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">新增面试配置</h3>
                <button
                  onClick={() => {
                    setShowAddConfigModal(false);
                    setConfigForm(emptyConfigForm());
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">考试日期</label>
                  {examDayOptions.length === 0 ? (
                    <p className="text-sm text-amber-600">暂无可选考试日期，请刷新页面或联系管理员。</p>
                  ) : (
                    <select
                      value={configForm.exam_day}
                      onChange={(e) => setConfigForm({ ...configForm, exam_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择考试日期</option>
                      {examDayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">面试日期（yyyy-mm-dd）</label>
                  <input
                    type="date"
                    value={configForm.interview_day}
                    onChange={(e) => setConfigForm({ ...configForm, interview_day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">面试官人数</label>
                  {interviewerNumOptions.length === 0 ? (
                    <p className="text-sm text-amber-600">暂无可选人数，请刷新页面或联系管理员。</p>
                  ) : (
                    <select
                      value={configForm.interviewer_num}
                      onChange={(e) => setConfigForm({ ...configForm, interviewer_num: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择面试官人数</option>
                      {interviewerNumOptions.map((n) => (
                        <option key={n} value={String(n)}>
                          {n}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">面试名称</label>
                  <input
                    type="text"
                    value={configForm.interview_desc}
                    onChange={(e) => setConfigForm({ ...configForm, interview_desc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入面试名称"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddConfigModal(false);
                    setConfigForm(emptyConfigForm());
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitConfig}
                  disabled={examDayOptions.length === 0 || interviewerNumOptions.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加时间配置模态框（由行内「添加时间」打开） */}
        {showAddTimeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">添加面试时间</h3>
                <button
                  onClick={() => {
                    setShowAddTimeModal(false);
                    setTimeFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时间（可多选）</label>
                  <SearchableSelect<number>
                    multiple
                    maxDisplayCount={0}
                    options={availableTimeSelectOptions}
                    value={Array.isArray(timeFormData.time_slots) ? timeFormData.time_slots : []}
                    onValueChange={(v) => {
                      setTimeFormData({
                        ...timeFormData,
                        time_slots: Array.isArray(v) ? v : [],
                      });
                    }}
                    placeholder={availableTimeSelectOptions.length === 0 ? '暂无可选时间段' : '请选择时间段'}
                    searchPlaceholder="搜索时间段…"
                    className="w-full min-w-0"
                    clearable
                    disabled={availableTimeSelectOptions.length === 0}
                    strictTimeLabelSearch
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowAddTimeModal(false);
                    setTimeFormData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitTime}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      确定要删除面试配置（Record ID: {selectedConfig.record_id}）吗？此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConfig(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

