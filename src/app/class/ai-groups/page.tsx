'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  PlayIcon,
  CheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { buildFileUrl } from '@/config/env';
import {
  getScheduleSettings,
  updateScheduleSettings,
  getGroupList,
  addSingleGroup,
  addBatchGroup,
  deleteGroups,
  editGroup,
  getBusyInfo,
  addBusy,
  deleteBusy,
  startSmartSchedule,
  commitSchedule,
  getSelfSignupClassSelect,
  getAllExams,
  getRoomList,
  downloadSelfSignupClassTemplate,
  type ScheduleSettings,
  type Group,
  type BusyInfo,
  type ScheduleResult,
  type AddBusyRequest,
} from '@/services/auth';
import { convertObjectsToSheetData, type SheetData } from '@/components/ExcelExporter';
import SearchableSelect from '@/components/SearchableSelect';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// 格式化时间戳
const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
};

// 课表事件类型
interface ScheduleEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: Record<string, unknown>;
}

export default function AIGroupsPage() {
  const router = useRouter();
  const { hasPermission, user } = useAuth();
  const [loading, setLoading] = useState(false);
  type TabKey = 'group-info' | 'teacher-busy' | 'student-busy';

  // 权限检查
  const canView = hasPermission(PERMISSIONS.EDIT_CLASSES) || hasPermission(PERMISSIONS.SALES_ADMIN);
  const coreFlag =
    typeof user === 'object' && user !== null && 'core_user' in user
      ? (user as { core_user?: number | boolean | string }).core_user
      : undefined;
  const isCoreUser = coreFlag === true || coreFlag === '1' || Number(coreFlag) === 1;

  // 校区相关
  const [campusList, setCampusList] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);

  // 排课设置
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Group管理
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [teacherInfoMap, setTeacherInfoMap] = useState<Record<number, string>>({});
  const [studentInfoMap, setStudentInfoMap] = useState<Record<number, string>>({});
  const [timeslots, setTimeslots] = useState<string[]>([]);
  
  // 选项数据
  const [examOptions, setExamOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [roomOptions, setRoomOptions] = useState<Array<{ id: number; name: string; campus_id: number }>>([]);
  const [topicOptions, setTopicOptions] = useState<Array<{ id: string; name: string }>>([]);
  
  // 创建 topic 和 exam 的映射表
  const topicMap = useMemo(() => {
    const map: Record<string, string> = {};
    topicOptions.forEach(topic => {
      map[topic.id] = topic.name;
    });
    return map;
  }, [topicOptions]);

  const examMap = useMemo(() => {
    const map: Record<number, string> = {};
    examOptions.forEach(exam => {
      map[exam.id] = exam.name;
    });
    return map;
  }, [examOptions]);

  const [activeTab, setActiveTab] = useState<TabKey>('group-info');
  const tabItems: Array<{ id: TabKey; label: string }> = [
    { id: 'group-info', label: 'Group Info' },
    { id: 'teacher-busy', label: 'Teacher Busy' },
    { id: 'student-busy', label: 'Student Busy' },
  ];

  // Busy信息
  const [teacherBusyList, setTeacherBusyList] = useState<BusyInfo[]>([]);
  const [studentBusyList, setStudentBusyList] = useState<BusyInfo[]>([]);
  const [showTeacherBusyModal, setShowTeacherBusyModal] = useState(false);
  const [showStudentBusyModal, setShowStudentBusyModal] = useState(false);

  // 排课结果
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');

  // 加载校区列表
  const loadCampusList = useCallback(async () => {
    try {
      const response = await getSelfSignupClassSelect();
      if (response.code === 200 && response.data) {
        setCampusList(response.data.campus_info);
        if (response.data.campus_info.length > 0) {
          setSelectedCampusId(response.data.campus_info[0].id);
        }
      }
    } catch (error) {
      console.error('加载校区列表失败:', error);
    }
  }, []);

  // 初始化校区列表和Topic选项
  useEffect(() => {
    if (canView) {
      loadCampusList();
      
      // 从user的token_info中获取topics
      if (user && typeof user === 'object' && 'topics' in user) {
        const topics = (user as any).topics;
        if (topics && typeof topics === 'object') {
          const topicList = Object.entries(topics).map(([id, name]) => ({
            id: String(id),
            name: String(name)
          }));
          setTopicOptions(topicList);
        }
      }
    }
  }, [canView, loadCampusList, user]);

  // 加载校区数据
  const loadCampusData = useCallback(async () => {
    if (!selectedCampusId) return;

    setLoading(true);
    try {
      // 加载排课设置
      const settingsRes = await getScheduleSettings(selectedCampusId);
      if (settingsRes.code === 200 && settingsRes.data) {
        setSettings(settingsRes.data);
      }

      // 加载group列表
      const groupsRes = await getGroupList(selectedCampusId);
      if (groupsRes.code === 200 && groupsRes.data) {
        // 后端返回的是 GroupListResponse 结构
        const {
          group_info = [],
          teacher_info = {},
          student_info = {},
          timeslots: slotLabels = [],
        } = groupsRes.data;
        setGroups(group_info);
        setTeacherInfoMap(teacher_info || {});
        setStudentInfoMap(student_info || {});
        setTimeslots(slotLabels || []);
      }

      // 加载busy信息
      const busyRes = await getBusyInfo(selectedCampusId);
      if (busyRes.code === 200 && busyRes.data) {
        setTeacherBusyList(busyRes.data.teacher_busy || []);
        setStudentBusyList(busyRes.data.student_busy || []);
      }

      // 加载Exam选项
      const examsRes = await getAllExams();
      if (examsRes.code === 200 && examsRes.data) {
        setExamOptions(examsRes.data.map(exam => ({ id: exam.id, name: exam.name })));
      }

      // 加载Room选项
      const roomsRes = await getRoomList();
      if (roomsRes.code === 200 && roomsRes.data?.room_list) {
        // 只显示当前校区的教室
        const campusRooms = roomsRes.data.room_list.filter(room => room.campus_id === selectedCampusId);
        setRoomOptions(campusRooms);
      }
    } catch (error) {
      console.error('加载校区数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCampusId]);

  useEffect(() => {
    if (selectedCampusId) {
      loadCampusData();
    }
  }, [selectedCampusId, loadCampusData]);

  // 搜索过滤
  const filteredGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    if (!searchTerm.trim()) return groups;

    const term = searchTerm.toLowerCase();
    return groups.filter(group => {
      // 搜索原始字段值
      const fieldMatch = Object.values(group).some(value =>
        String(value).toLowerCase().includes(term)
      );
      
      // 搜索显示的名称
      const topicName = (group.topic_name || (group.topic_id ? topicMap[String(group.topic_id)] : '') || '').toLowerCase();
      const examName = (group.exam_name || (group.exam_id ? examMap[group.exam_id] : '') || '').toLowerCase();
      
      // 搜索教师名称
      let teacherNames = '';
      if (group.teacher) {
        const teacherIds = Array.isArray(group.teacher) ? group.teacher : [group.teacher];
        teacherNames = teacherIds.map(id => teacherInfoMap[id] || '').join(' ').toLowerCase();
      }
      
      // 搜索学生名称
      let studentNames = '';
      if (group.students) {
        const studentIds = Array.isArray(group.students) ? group.students : [group.students];
        studentNames = studentIds.map(id => studentInfoMap[id] || '').join(' ').toLowerCase();
      }
      
      return fieldMatch || 
             topicName.includes(term) || 
             examName.includes(term) || 
             teacherNames.includes(term) || 
             studentNames.includes(term);
    });
  }, [groups, searchTerm, topicMap, examMap, teacherInfoMap, studentInfoMap]);

  // Excel导出数据
  const exportData: SheetData = useMemo(() => {
    if (filteredGroups.length === 0) {
      return { name: 'Groups', headers: [], data: [] };
    }

    const allKeys = new Set<string>();
    filteredGroups.forEach(group => {
      Object.keys(group).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    return convertObjectsToSheetData(
      filteredGroups as unknown as Record<string, unknown>[],
      headers,
      'Groups'
    );
  }, [filteredGroups]);

  // 处理Excel上传
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCampusId) return;

    try {
      // 直接上传文件，不进行前端解析
      const response = await addBatchGroup(selectedCampusId, file);
      if (response.code === 200) {
        alert('批量上传成功');
        await loadCampusData();
      } else {
        alert(response.message || '批量上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败');
    }

    // 重置input
    event.target.value = '';
  };

  const handleDeleteGroup = useCallback(async (groupId?: number) => {
    if (!groupId) return;
    const confirmed = window.confirm('确认删除这条记录？');
    if (!confirmed) return;

    const response = await deleteGroups(String(groupId));
    if (response.code === 200) {
      alert('删除成功');
      await loadCampusData();
    } else {
      alert(response.message || '删除失败');
    }
  }, [loadCampusData]);

  const handleDeleteAllGroups = useCallback(async () => {
    const confirmed = window.confirm('确认删除所有记录？');
    if (!confirmed) return;

    const response = await deleteGroups(undefined, true);
    if (response.code === 200) {
      alert('删除成功');
      await loadCampusData();
    } else {
      alert(response.message || '删除失败');
    }
  }, [loadCampusData]);

  const handleDeleteBusyEntry = useCallback(async (recordIds: string, isTeacher: boolean) => {
    const confirmed = window.confirm('确认删除该人员的所有busy时间段？');
    if (!confirmed) return;

    const response = await deleteBusy(recordIds, isTeacher ? 1 : 0);
    if (response.code === 200) {
      alert('删除成功');
      await loadCampusData();
    } else {
      alert(response.message || '删除失败');
    }
  }, [loadCampusData]);

  // 下载基础数据模板
  const handleDownloadTemplate = useCallback(async () => {
    try {
      setLoading(true);
      await downloadSelfSignupClassTemplate();
      // 函数内部已经处理了下载，无需额外操作
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 开始排课
  const handleStartSchedule = async () => {
    if (!selectedCampusId) return;

    setIsScheduling(true);
    setScheduleMessage('正在排课中...');

    try {
      const response = await startSmartSchedule(selectedCampusId);
      if (response.code === 200 && response.data) {
        // 检查是否返回了message（正在运行或刚开始）
        if (response.data.message) {
          setScheduleMessage(response.data.message);
          // 如果有result数据，说明排课已完成
          if (response.data.result && Object.keys(response.data.result).length > 0) {
            setScheduleResult(response.data);
          }
        } else {
          setScheduleResult(response.data);
          setScheduleMessage('排课完成');
        }
      } else {
        setScheduleMessage(response.message || '排课失败');
      }
    } catch (error) {
      console.error('排课失败:', error);
      setScheduleMessage('排课失败');
    } finally {
      setIsScheduling(false);
    }
  };

  // 提交排课结果
  const handleCommitSchedule = async () => {
    if (!selectedCampusId) return;

    const confirmed = window.confirm('确认提交排课结果？');
    if (!confirmed) return;

    try {
      const response = await commitSchedule(selectedCampusId);
      if (response.code === 200) {
        alert('提交成功');
      } else {
        alert(response.message || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };

  // 转换排课结果为课表事件
  const scheduleEvents = useMemo((): ScheduleEvent[] => {
    if (!scheduleResult?.result?.schedule_lessons_data) return [];

    // 这里需要根据实际返回的数据结构转换为课表事件
    // 目前只是示例结构，实际需要根据schedule_lessons_data的具体字段调整
    return [];
  }, [scheduleResult]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问AI排课页面的权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 页面标题和校区选择 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Schedule</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedCampusId || ''}
                onChange={(e) => setSelectedCampusId(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">选择校区</option>
                {campusList.map(campus => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleDownloadTemplate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="下载包含科目、考试、校区信息的基础数据模板"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                基础数据下载
              </button>

              {isCoreUser && (
                <button
                  onClick={() => router.push('/class/ai-schedule')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title="跳转到 AI 排课执行页面"
                >
                  <PlayIcon className="h-4 w-4" />
                  开始排课
                </button>
              )}
            </div>
          </div>
        </div>

        {!selectedCampusId ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">请先选择校区</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : (
          <>
            {/* 排课设置区域 */}
            <SettingsSection
              settings={settings}
              onEdit={() => setShowSettingsModal(true)}
            />

             {/* Tab管理区域 */}
             <div className="bg-white rounded-lg shadow">
               <div className="border-b border-gray-200 px-6">
                 <div className="flex flex-wrap gap-6 py-4">
                   {tabItems.map((tab) => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`relative px-2 pb-3 text-sm font-medium transition-colors ${
                         activeTab === tab.id 
                           ? 'text-purple-600' 
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
                     >
                       {tab.label}
                       {activeTab === tab.id && (
                         <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-purple-600 rounded-full" />
                       )}
                     </button>
                   ))}
                 </div>
               </div>

              <div className="p-6">
                {activeTab === 'group-info' && (
                  <GroupInfoTab
                    groups={filteredGroups}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdd={() => setShowAddGroupModal(true)}
                    onEdit={(group) => {
                      setEditingGroup(group);
                      setShowEditGroupModal(true);
                    }}
                    onExcelUpload={handleExcelUpload}
                    exportData={exportData}
                    onDeleteSingle={handleDeleteGroup}
                    onDeleteAll={handleDeleteAllGroups}
                    teacherInfoMap={teacherInfoMap}
                    studentInfoMap={studentInfoMap}
                    timeslots={timeslots}
                    topicMap={topicMap}
                    examMap={examMap}
                  />
                )}

                {activeTab === 'teacher-busy' && (
                  <BusyTab
                    title="Teacher Busy"
                    description="维护老师的忙碌时间段"
                    list={teacherBusyList}
                    personLabel="教师"
                    teacherInfoMap={teacherInfoMap}
                    studentInfoMap={studentInfoMap}
                    timeslots={timeslots}
                    onAdd={() => setShowTeacherBusyModal(true)}
                    onDelete={(recordIds) => handleDeleteBusyEntry(recordIds, true)}
                  />
                )}

                {activeTab === 'student-busy' && (
                  <BusyTab
                    title="Student Busy"
                    description="维护学生的忙碌时间段"
                    list={studentBusyList}
                    personLabel="学生"
                    teacherInfoMap={teacherInfoMap}
                    studentInfoMap={studentInfoMap}
                    timeslots={timeslots}
                    onAdd={() => setShowStudentBusyModal(true)}
                    onDelete={(recordIds) => handleDeleteBusyEntry(recordIds, false)}
                  />
                )}
              </div>
            </div>

            {/* 排课执行区域
            {isCoreUser && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">排课执行</h2>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    onClick={handleStartSchedule}
                    disabled={isScheduling}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <PlayIcon className="h-5 w-5" />
                    {isScheduling ? '排课中...' : '开始排课'}
                  </button>

                  {scheduleMessage && (
                    <p className={`text-sm ${scheduleMessage.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>
                      {scheduleMessage}
                    </p>
                  )}
                </div>
              </div>
            )}

            {scheduleResult && (
              <ScheduleResultSection
                events={scheduleEvents}
                onCommit={isCoreUser ? handleCommitSchedule : undefined}
              />
            )} */}
          </>
        )}
      </div>

      {/* 模态框 */}
      {showSettingsModal && selectedCampusId && (
        <SettingsModal
          campusId={selectedCampusId}
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={async (newSettings) => {
            const response = await updateScheduleSettings(selectedCampusId, newSettings);
            if (response.code === 200) {
              alert('保存成功');
              await loadCampusData();
              setShowSettingsModal(false);
            } else {
              alert(response.message || '保存失败');
            }
          }}
        />
      )}

      {showAddGroupModal && selectedCampusId && (
        <GroupModal
          campusId={selectedCampusId}
          timeslots={timeslots}
          teacherInfoMap={teacherInfoMap}
          studentInfoMap={studentInfoMap}
          topicOptions={topicOptions}
          examOptions={examOptions}
          roomOptions={roomOptions}
          onClose={() => setShowAddGroupModal(false)}
          onSave={async (groupData) => {
            const response = await addSingleGroup(groupData);
            if (response.code === 200) {
              alert('添加成功');
              await loadCampusData();
              setShowAddGroupModal(false);
            } else {
              alert(response.message || '添加失败');
            }
          }}
        />
      )}

      {showEditGroupModal && editingGroup && (
        <GroupModal
          campusId={editingGroup.campus_id}
          group={editingGroup}
          timeslots={timeslots}
          teacherInfoMap={teacherInfoMap}
          studentInfoMap={studentInfoMap}
          topicOptions={topicOptions}
          examOptions={examOptions}
          roomOptions={roomOptions}
          onClose={() => {
            setShowEditGroupModal(false);
            setEditingGroup(null);
          }}
          onSave={async (groupData) => {
            const response = await editGroup(groupData);
            if (response.code === 200) {
              alert('编辑成功');
              await loadCampusData();
              setShowEditGroupModal(false);
              setEditingGroup(null);
            } else {
              alert(response.message || '编辑失败');
            }
          }}
        />
      )}

      {showTeacherBusyModal && selectedCampusId && (
        <BusyModal
          campusId={selectedCampusId}
          mode="teacher"
          timeslots={timeslots}
          teacherInfoMap={teacherInfoMap}
          studentInfoMap={studentInfoMap}
          onClose={() => setShowTeacherBusyModal(false)}
          onSave={async (busyData) => {
            const response = await addBusy(busyData);
            if (response.code === 200) {
              alert('添加成功');
              await loadCampusData();
              setShowTeacherBusyModal(false);
            } else {
              alert(response.message || '添加失败');
            }
          }}
        />
      )}

      {showStudentBusyModal && selectedCampusId && (
        <BusyModal
          campusId={selectedCampusId}
          mode="student"
          timeslots={timeslots}
          teacherInfoMap={teacherInfoMap}
          studentInfoMap={studentInfoMap}
          onClose={() => setShowStudentBusyModal(false)}
          onSave={async (busyData) => {
            const response = await addBusy(busyData);
            if (response.code === 200) {
              alert('添加成功');
              await loadCampusData();
              setShowStudentBusyModal(false);
            } else {
              alert(response.message || '添加失败');
            }
          }}
        />
      )}
    </div>
  );
}

// ==================== 子组件 ====================

// 排课设置区域
function SettingsSection({
  settings,
  onEdit,
}: {
  settings: ScheduleSettings | null;
  onEdit: () => void;
}) {
  // 将秒值时间戳转换为日期字符串
  const formatStartDate = (startTimestamp: string) => {
    const date = new Date(Number(startTimestamp) * 1000);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Cog6ToothIcon className="h-5 w-5" />
          排课设置
        </h2>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PencilIcon className="h-4 w-4" />
          编辑
        </button>
      </div>

      {settings ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Start (First Week)</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {formatStartDate(settings.start)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Weeks</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{settings.weeks} 周</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Prefix</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {settings.prefix ?? '未设置'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">暂无配置信息</p>
      )}
    </div>
  );
}

// Group Info Tab with virtualization
function GroupInfoTab({
  groups,
  searchTerm,
  onSearchChange,
  onAdd,
  onEdit,
  onExcelUpload,
  exportData,
  onDeleteSingle,
  onDeleteAll,
  teacherInfoMap,
  studentInfoMap,
  timeslots,
  topicMap,
  examMap,
}: {
  groups: Group[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAdd: () => void;
  onEdit: (group: Group) => void;
  onExcelUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  exportData: SheetData;
  onDeleteSingle: (groupId?: number) => void;
  onDeleteAll: () => void;
  teacherInfoMap: Record<number, string>;
  studentInfoMap: Record<number, string>;
  timeslots: string[];
  topicMap: Record<string, string>;
  examMap: Record<number, string>;
}) {
  const gridTemplate =
    'minmax(160px, 1.1fr) 110px 150px 130px 180px 200px 110px 200px 110px 160px 130px 130px 160px 140px';

  const normalizeIds = (value?: number[] | number | string): number[] => {
    if (Array.isArray(value)) return value.map(Number).filter((v) => !Number.isNaN(v));
    if (typeof value === 'number') return Number.isNaN(value) ? [] : [value];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((v) => !Number.isNaN(v));
    }
    return [];
  };

  const formatPeople = (ids?: number[] | number | string, dictionary?: Record<number, string>) => {
    const normalized = normalizeIds(ids);
    if (normalized.length === 0) return '-';
    return normalized
      .map((id) => dictionary?.[id] || `#${id}`)
      .join('、');
  };

  const formatFixedTime = (value?: number[] | number | string) => {
    const normalized = normalizeIds(value);
    if (normalized.length === 0) return '-';
    return normalized
      .map((id) => timeslots[id] || ``)
      .join('、');
  };

  const formatSubmitTime = (group: Group) => {
    const primary = group.create_time;
    if (!primary) return '-';
    const numeric = Number(primary);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return formatTime(numeric);
    }
    return primary;
  };

  const renderRow = (group: Group, index: number) => {
    const teacherNames = formatPeople(group.teacher, teacherInfoMap);
    const studentNames = formatPeople(group.students, studentInfoMap);
    const teacherCount = normalizeIds(group.teacher).length;
    const studentCount = normalizeIds(group.students).length;
    
    // 获取 Topic 和 Exam 的名称
    const topicName = group.topic_name || (group.topic_id ? topicMap[String(group.topic_id)] : null) || '-';
    const examName = group.exam_name || (group.exam_id ? examMap[group.exam_id] : null) || '-';
    
    // 背景色类名
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

    return (
      <div
        key={group.id || index}
        style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
        className="text-sm border-b border-gray-100"
      >
        <div className={`px-4 py-3 text-gray-900 ${bgClass}`}>{topicName}</div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{group.week_lessons || '-'}</div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{examName}</div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{group.max_students ?? '-'}</div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{group.class_type ?? '-'}</div>
        <div className={`px-4 py-3 text-gray-700 truncate ${bgClass}`} title={teacherNames}>
          {teacherNames}
        </div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{teacherCount}</div>
        <div className={`px-4 py-3 text-gray-700 truncate ${bgClass}`} title={studentNames}>
          {studentNames}
        </div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{studentCount}</div>
        <div className={`px-4 py-3 text-gray-700 truncate ${bgClass}`} title={formatFixedTime(group.fix_time)}>
          {formatFixedTime(group.fix_time)}
        </div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{group.double_lesson ? '是' : '否'}</div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>
          {group.fix_room && group.fix_room !== -1 ? group.fix_room : '-'}
        </div>
        <div className={`px-4 py-3 text-gray-700 ${bgClass}`}>{formatSubmitTime(group)}</div>
        <div className={`px-4 py-3 ${bgClass}`}>
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(group)}
              className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
            >
              <PencilIcon className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={() => onDeleteSingle(group.id)}
              className="text-red-600 hover:text-red-800 text-sm inline-flex items-center gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1 min-w-[240px] relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索 Topic / Exam / Teacher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4" />
            新增 Group
          </button>

          <a
            href={buildFileUrl('/static/template/blank-group.xlsx')}
            download="blank-group.xlsx"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            下载模版
          </a>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
            <ArrowUpTrayIcon className="h-4 w-4" />
            批量上传
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onExcelUpload}
              className="hidden"
            />
          </label>

          {/* <button
            onClick={onDeleteAll}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <TrashIcon className="h-4 w-4" />
            全部删除
          </button> */}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">暂无 Group 数据</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              {/* 表头 */}
              <div
                className="sticky top-0 z-10 grid text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {[
                  'Topic Name',
                  'Week Lessons',
                  'Exam Name',
                  'Max Students',
                  'Assigning Name',
                  '老师',
                  '老师人数',
                  '学生',
                  '学生人数',
                  'Fixed Time',
                  '三小时课程',
                  'Fixed Room',
                  '提交时间',
                  '操作',
                ].map((header) => (
                  <div key={header} className="px-4 py-3 bg-gray-50">
                    {header}
                  </div>
                ))}
              </div>
              
              {/* 数据行 */}
              <div>
                {groups.map((group, index) => renderRow(group, index))}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        共 {groups.length} 条记录
      </p>
    </div>
  );
}

function BusyTab({
  title,
  description,
  list,
  personLabel,
  teacherInfoMap,
  studentInfoMap,
  timeslots,
  onAdd,
  onDelete,
}: {
  title: string;
  description: string;
  list: BusyInfo[];
  personLabel: '教师' | '学生';
  teacherInfoMap: Record<number, string>;
  studentInfoMap: Record<number, string>;
  timeslots: string[];
  onAdd: () => void;
  onDelete: (recordIds: string) => void;
}) {
  // 根据 ID 获取名称
  const getPersonName = (busy: BusyInfo) => {
    if (personLabel === '教师' && busy.teacher_id) {
      return teacherInfoMap[busy.teacher_id] || `教师 #${busy.teacher_id}`;
    } else if (personLabel === '学生' && busy.student_id) {
      return studentInfoMap[busy.student_id] || `学生 #${busy.student_id}`;
    }
    return '未知';
  };

  // 根据 time_id 获取时间槽名称
  const getTimeSlotName = (timeId: number) => {
    return timeslots[timeId] || `时间槽 #${timeId}`;
  };

  // 合并同一个人的多个 busy time
  const groupedList = useMemo(() => {
    const grouped = new Map<number, { personId: number; personName: string; busyItems: BusyInfo[] }>();
    
    list.forEach((busy) => {
      const personId = personLabel === '教师' ? busy.teacher_id : busy.student_id;
      if (!personId) return;
      
      if (!grouped.has(personId)) {
        grouped.set(personId, {
          personId,
          personName: getPersonName(busy),
          busyItems: [],
        });
      }
      grouped.get(personId)!.busyItems.push(busy);
    });
    
    return Array.from(grouped.values());
  }, [list, personLabel, teacherInfoMap, studentInfoMap]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <PlusIcon className="h-4 w-4" />
          新增
        </button>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
          暂无 {title} 数据
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {personLabel}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Busy Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedList.map((group) => (
                <tr key={group.personId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {group.personName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {group.busyItems.map((busy) => (
                        <span
                          key={busy.id}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {getTimeSlotName(busy.time_id)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => {
                        const recordIds = group.busyItems.map(b => b.id).join(',');
                        onDelete(recordIds);
                      }}
                      className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 排课结果区域
function ScheduleResultSection({
  events,
  onCommit,
}: {
  events: ScheduleEvent[];
  onCommit?: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">排课结果</h2>
        {onCommit && (
          <button
            onClick={onCommit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CheckIcon className="h-5 w-5" />
            提交排课结果
          </button>
        )}
      </div>

      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['week', 'day']}
          defaultView="week"
        />
      </div>
    </div>
  );
}

// ==================== 模态框组件 ====================


function SettingsModal({
  campusId,
  settings,
  onClose,
  onSave,
}: {
  campusId: number;
  settings: ScheduleSettings | null;
  onClose: () => void;
  onSave: (settings: any) => void;
}) {
  // 将秒值时间戳转换为日期字符串（YYYY-MM-DD格式）
  const timestampToDateString = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toISOString().split('T')[0];
  };

  // 将日期字符串转换为秒值时间戳
  const dateStringToTimestamp = (dateString: string) => {
    return String(Math.floor(new Date(dateString).getTime() / 1000));
  };

  const [startDate, setStartDate] = useState(
    settings?.start ? timestampToDateString(settings.start) : ''
  );
  const [weeks, setWeeks] = useState(settings?.weeks || 10);
  const [prefix, setPrefix] = useState(settings?.prefix ?? '');

  const handleSave = () => {
    if (!startDate) {
      alert('请选择开始日期');
      return;
    }

    const updatedSettings: any = {
      campus_id: campusId,
      start: dateStringToTimestamp(startDate),
      weeks: weeks,
      prefix: prefix || undefined,
    };

    onSave(updatedSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">编辑排课设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start (First Week) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              选择第一周的任意一天（将转换为秒值时间戳）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weeks <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              排课周数（1-52周）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// Group模态框
function GroupModal({
  campusId,
  group,
  timeslots,
  teacherInfoMap,
  studentInfoMap,
  topicOptions,
  examOptions,
  roomOptions,
  onClose,
  onSave,
}: {
  campusId: number;
  group?: Group;
  timeslots: string[];
  teacherInfoMap: Record<number, string>;
  studentInfoMap: Record<number, string>;
  topicOptions: Array<{ id: string; name: string }>;
  examOptions: Array<{ id: number; name: string }>;
  roomOptions: Array<{ id: number; name: string; campus_id: number }>;
  onClose: () => void;
  onSave: (group: Group) => void;
}) {
  const [topicId, setTopicId] = useState(group?.topic_id ? String(group.topic_id) : '');
  const [lessons, setLessons] = useState(group?.week_lessons ? String(group.week_lessons) : '');
  const [examId, setExamId] = useState(group?.exam_id ? String(group.exam_id) : '');
  const [fixedTimeSlots, setFixedTimeSlots] = useState(() => {
    const value = group?.fix_time;
    if (!value) return '';
    if (Array.isArray(value)) return value.join(',');
    return String(value);
  });
  const [isTripleLesson, setIsTripleLesson] = useState(Boolean(group?.double_lesson));
  const [fixedRoom, setFixedRoom] = useState(() => {
    if (!group?.fix_room || group.fix_room === -1) return '';
    return String(group.fix_room);
  });
  const [assigningName, setAssigningName] = useState(group?.class_type || '');
  const [maxStudents, setMaxStudents] = useState(group?.max_students ? String(group.max_students) : '');
  
  // 教师和学生改为数组状态（使用 number 类型）
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>(() => {
    if (!group?.teacher) return [];
    if (Array.isArray(group.teacher)) return group.teacher.map(Number);
    return [Number(group.teacher)];
  });
  const [selectedStudents, setSelectedStudents] = useState<number[]>(() => {
    if (!group?.students) return [];
    if (Array.isArray(group.students)) return group.students.map(Number);
    return [Number(group.students)];
  });

  const parseIdInput = (value: string): number[] => {
    if (!value.trim()) return [];
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((id) => !Number.isNaN(id));
  };

  const handleSave = () => {
    if (!topicId || !lessons) {
      alert('请填写 Topic 与 Lessons');
      return;
    }

    const normalizedMax = Number(maxStudents) || 0;

    const payload: Group = {
      ...(group || {}),
      group_id: group?.id,
      campus_id: group?.campus_id ?? campusId,
      topic_id: Number(topicId) || 0,
      week_lessons: Number(lessons) || 0,
      exam_id: examId ? Number(examId) : undefined,
      max_students: normalizedMax,
      prefer_students: group?.prefer_students ?? normalizedMax,
      double_lesson: isTripleLesson ? 1 : 0,
      teacher_ids: selectedTeachers.join(','),
      student_ids: selectedStudents.join(','),
    };

    if (fixedRoom) {
      const parsedRoom = Number(fixedRoom);
      if (!Number.isNaN(parsedRoom)) {
        payload.fix_room = parsedRoom;
      } else {
        delete payload.fix_room;
      }
    } else {
      payload.fix_room = -1;
    }

    if (fixedTimeSlots.trim()) {
      const slots = parseIdInput(fixedTimeSlots);
      if (slots.length === 1) {
        payload.fix_time = slots[0];
      } else {
        payload.fix_time = slots;
      }
    } else {
      delete payload.fix_time;
    }

    // 处理教师和学生选择
    if (selectedTeachers.length > 0) {
      payload.teacher = selectedTeachers.join(',');
    } else {
      delete payload.teacher;
    }

    if (selectedStudents.length > 0) {
      payload.students = selectedStudents.join(',');
    } else {
      delete payload.students;
    }

    if (assigningName.trim()) {
      payload.assign_name = assigningName.trim();
    } else {
      delete payload.assign_name;
    }

    onSave(payload);
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {group ? '编辑 Group' : '新增 Group'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Topic、Lessons、Exam、Fixed 信息、老师与学生等字段都可快速录入
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">请选择 Topic</option>
                {topicOptions.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lessons <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="每周课节数"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam
              </label>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">请选择 Exam</option>
                {examOptions.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Time Slots
              </label>
              <select
                value={fixedTimeSlots}
                onChange={(e) => setFixedTimeSlots(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">请选择时间槽</option>
                {timeslots.map((slot, idx) => (
                  <option key={idx} value={idx}>{slot}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                三小时课程
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTripleLesson(true)}
                  className={`px-3 py-1 rounded-md border ${isTripleLesson ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-gray-200 text-gray-600'}`}
                >
                  是
                </button>
                <button
                  type="button"
                  onClick={() => setIsTripleLesson(false)}
                  className={`px-3 py-1 rounded-md border ${!isTripleLesson ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-gray-200 text-gray-600'}`}
                >
                  否
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fix Room
              </label>
              <select
                value={fixedRoom}
                onChange={(e) => setFixedRoom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">请选择教室</option>
                {roomOptions.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigning Name
              </label>
              <input
                type="text"
                value={assigningName}
                onChange={(e) => setAssigningName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                placeholder="最大人数"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher (多选)
              </label>
              <SearchableSelect
                options={Object.entries(teacherInfoMap).map(([id, name]) => ({
                  id: Number(id),
                  name: name,
                }))}
                value={selectedTeachers}
                onValueChange={(val) => setSelectedTeachers(val as number[])}
                placeholder="请选择教师"
                searchPlaceholder="搜索教师..."
                multiple={true}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Students (多选)
              </label>
              <SearchableSelect
                options={Object.entries(studentInfoMap).map(([id, name]) => ({
                  id: Number(id),
                  name: name,
                }))}
                value={selectedStudents}
                onValueChange={(val) => setSelectedStudents(val as number[])}
                placeholder="请选择学生"
                searchPlaceholder="搜索学生..."
                multiple={true}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// Busy模态框
function BusyModal({
  campusId,
  mode,
  timeslots,
  teacherInfoMap,
  studentInfoMap,
  onClose,
  onSave,
}: {
  campusId: number;
  mode: 'teacher' | 'student';
  timeslots?: string[];
  teacherInfoMap: Record<number, string>;
  studentInfoMap: Record<number, string>;
  onClose: () => void;
  onSave: (busy: AddBusyRequest) => void;
}) {
  const [personId, setPersonId] = useState<number | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);

  const handleSave = () => {
    if (!personId || selectedTimeSlots.length === 0) {
      alert('请填写所有必填字段');
      return;
    }

    const busyData: AddBusyRequest = {
      campus_id: campusId,
      busy_ids: selectedTimeSlots.join(','), // 逗号分隔的time_id，如"1,2,3"
    };

    if (mode === 'teacher') {
      busyData.teacher_id = personId;
    } else {
      busyData.student_id = personId;
    }

    onSave(busyData);
  };

  const title = mode === 'teacher' ? '添加 Teacher Busy' : '添加 Student Busy';
  const personLabel = mode === 'teacher' ? '选择教师' : '选择学生';
  const infoMap = mode === 'teacher' ? teacherInfoMap : studentInfoMap;

  // 生成时间槽选项
  const timeSlotOptions = (timeslots || []).map((slot, idx) => ({
    id: idx,
    name: slot,
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {personLabel}
            </label>
            <SearchableSelect
              options={Object.entries(infoMap).map(([id, name]) => ({
                id: Number(id),
                name: name,
              }))}
              value={personId || 0}
              onValueChange={(val) => setPersonId(val as number)}
              placeholder={`请选择${mode === 'teacher' ? '教师' : '学生'}`}
              searchPlaceholder={`搜索${mode === 'teacher' ? '教师' : '学生'}...`}
              multiple={false}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Slots (多选)
            </label>
            <SearchableSelect
              options={timeSlotOptions}
              value={selectedTimeSlots}
              onValueChange={(val) => setSelectedTimeSlots(val as number[])}
              placeholder="请选择时间槽"
              searchPlaceholder="搜索时间槽..."
              multiple={true}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
