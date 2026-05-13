'use client';

/**
 * 学生预估分（导师 Tab / 导师组长 Tab）
 *
 * - 列表仍来自 get_signup_estimated_score 的 mentor_result、mentor_leader_result（后端裁剪）。
 * - 操作与 phy 接口一致：
 *   - 导师：update_estimated_score_note（直属 mentor；预估分尚未写入时方可改备注/出分年月）
 *   - 学科组长：仅当导师已填写备注与出分年月后才可录入预估分/考试等第（后端同步校验）；可 delete_estimated_score_record
 * - 前端用 token 的 subject_leader 与「字符串权限 EDIT_ESTIMATED_SCORE_NOTE」控制按钮展示，最终以接口报错为准。
 */

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  getEstimatedScoreSelect,
  getSignupEstimatedScore,
  updateEstimatedScoreGrade,
  updateEstimatedScoreNote,
  updateEstimatedExamScore,
  deleteEstimatedScoreRecord,
  type SignupEstimatedListData,
  type SignupEstimatedScoreRow,
} from '@/services/auth';
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MinusSmallIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type EstimatedTab = 'mentor' | 'leader';

const DEFAULT_PAGE_SIZE = 50;

/** 表体列数：导师 6；组长 10（列顺序见 SignupBucketTable 表头注释） */
const BUCKET_TABLE_COL_SPAN_LEADER = 10;
const BUCKET_TABLE_COL_SPAN_MENTOR = 7;

/** 与 remark-overview / interview-config 一致的 sticky 样式 */
const STICKY_COL1_TH =
  'sticky left-0 z-[1] w-24 min-w-[6rem] max-w-[6rem] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 shadow-[2px_0_4px_rgba(0,0,0,0.1)]';
const STICKY_COL1_TD =
  'sticky left-0 z-[1] w-24 min-w-[6rem] max-w-[6rem] px-3 py-4 whitespace-nowrap text-sm text-gray-900 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50/80 transition-colors truncate';
const STICKY_COL2_TH =
  'sticky left-24 z-[1] min-w-[12rem] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 shadow-[2px_0_4px_rgba(0,0,0,0.1)]';
const STICKY_COL2_TD =
  'sticky left-24 z-[1] min-w-[12rem] max-w-[16rem] px-6 py-4 text-sm text-gray-900 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50/80 transition-colors truncate';
const STICKY_ACTION_TH =
  'sticky right-0 z-[1] min-w-[8rem] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]';
const STICKY_ACTION_TD =
  'sticky right-0 z-[1] min-w-[8rem] px-6 py-4 text-right align-middle bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] group-hover:bg-gray-50/80 transition-colors';

const ICON_BTN =
  'w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
const ICON_BTN_BLUE = `${ICON_BTN} text-blue-600 hover:bg-blue-50`;
const ICON_BTN_RED = `${ICON_BTN} text-red-600 hover:bg-red-50`;
const ICON_BTN_MUTED = `${ICON_BTN} text-gray-400 cursor-default`;

const MID_TH = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
const MID_TD = 'px-6 py-4 text-sm transition-colors group-hover:bg-gray-50/80';

function takeExamYes(v: SignupEstimatedScoreRow['take_exam']): boolean {
  return v === true || v === 1;
}

function takeExamCell(v: SignupEstimatedScoreRow['take_exam']): string {
  if (v === undefined || v === null) return '—';
  return takeExamYes(v) ? '是' : '否';
}

/** 与 update_estimated_score_note 后端条件一致：已有预估分时不可再改备注 */
function isEstimatedScoreFilled(r: SignupEstimatedScoreRow): boolean {
  return !!(r.estimated_score != null && String(r.estimated_score).trim() !== '');
}

/** 学科组长录入出分前：须已有非空备注 + 有效出分年月（与后端 _estimated_score_mentor_note_ready 一致） */
function isMentorNoteReadyForLeaderScores(r: SignupEstimatedScoreRow): boolean {
  const noteOk = r.note != null && String(r.note).trim() !== '';
  if (!noteOk) return false;
  const dy = r.date_year;
  const dm = r.date_month;
  if (dy == null || dm == null || dy === '' || dm === '') return false;
  const dyS = String(dy).trim();
  const dmS = String(dm).trim();
  if (!dyS || !dmS) return false;
  const monthNum = parseInt(dmS, 10);
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return false;
  return true;
}

/**
 * 仅按接口字段拆桶。兼容旧版顶层 rows → 并入导师桶。
 */
function splitSignupBuckets(data: SignupEstimatedListData | undefined): {
  mentor: SignupEstimatedScoreRow[];
  leader: SignupEstimatedScoreRow[];
} {
  if (!data) return { mentor: [], leader: [] };
  const leaderRaw = data.mentor_leader_result?.rows;
  const leader = Array.isArray(leaderRaw) ? leaderRaw : [];
  let mentorRaw = data.mentor_result?.rows;
  let mentor = Array.isArray(mentorRaw) ? mentorRaw : [];
  if (mentor.length === 0 && Array.isArray(data.rows) && data.rows.length > 0) {
    mentor = data.rows;
  }
  return { mentor, leader };
}

/** `type="month"` 的 value，格式 YYYY-MM；空字符串表示未选 */
function toMonthInputValue(year: number, month: number): string {
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return '';
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parseMonthInputValue(v: string): { y: string; m: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!match) return null;
  const monthNum = parseInt(match[2], 10);
  if (monthNum < 1 || monthNum > 12) return null;
  return { y: match[1], m: String(monthNum) };
}

function filterRows(
  rows: SignupEstimatedScoreRow[],
  subjectFilter: string,
  searchTerm: string
): SignupEstimatedScoreRow[] {
  let list = rows;
  if (subjectFilter) {
    list = list.filter((r) => (r.subject_name || '') === subjectFilter);
  }
  const t = searchTerm.trim().toLowerCase();
  if (!t) return list;
  return list.filter(
    (r) =>
      (r.student_name || '').toLowerCase().includes(t) ||
      (r.subject_name || '').toLowerCase().includes(t)
  );
}

function buildPageNumbers(totalPages: number, pageSafe: number): (number | 'dots')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const cur = pageSafe;
  const pages: (number | 'dots')[] = [1];
  if (cur > 3) pages.push('dots');
  for (let i = Math.max(2, cur - 1); i <= Math.min(totalPages - 1, cur + 1); i++) {
    if (!pages.includes(i)) pages.push(i);
  }
  if (cur < totalPages - 2) pages.push('dots');
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

function readSubjectLeader(user: unknown): boolean {
  const u = user as { subject_leader?: boolean | number } | null;
  return u?.subject_leader === true || u?.subject_leader === 1;
}

function readMentorLeader(user: unknown): boolean {
  const u = user as { mentor_leader?: boolean | number } | null;
  return u?.mentor_leader === true || u?.mentor_leader === 1;
}

function canDeleteRecord(r: SignupEstimatedScoreRow): boolean {
  return r.can_delete === true || r.can_delete === 1;
}

type SignupBucketTableProps = {
  mode: 'mentor' | 'leader';
  paginated: SignupEstimatedScoreRow[];
  rowKeyPrefix: string;
  rawBucketLength: number;
  canEditNote: boolean;
  isSubjectLeader: boolean;
  readMentorLeader: boolean;
  onOpenNote: (r: SignupEstimatedScoreRow) => void;
  onOpenLeaderScores: (r: SignupEstimatedScoreRow) => void;
  onRequestDelete: (r: SignupEstimatedScoreRow) => void;
};

function SignupBucketTable({
  mode,
  paginated,
  rowKeyPrefix,
  rawBucketLength,
  canEditNote,
  isSubjectLeader,
  readMentorLeader,
  onOpenNote,
  onOpenLeaderScores,
  onRequestDelete,
}: SignupBucketTableProps) {
  const emptyColSpan = mode === 'mentor' ? BUCKET_TABLE_COL_SPAN_MENTOR : BUCKET_TABLE_COL_SPAN_LEADER;

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {/* 列顺序：主体 → 预估分（核心）→ 考试/等第（组长）→ 出分年月与备注（导师侧信息）→ 时间戳（组长）→ 操作 */}
          <th scope="col" className={STICKY_COL1_TH}>
            学生
          </th>
          <th scope="col" className={STICKY_COL2_TH}>
            科目
          </th>
          {mode === 'mentor' && (
            <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
              参加预估分考试
            </th>
          )}
          <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
           预估分
          </th>
          {mode === 'leader' && (
            <>
              <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
                考试
              </th>
              <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
                考试等第
              </th>
            </>
          )}
          <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
            出分年月
          </th>
          <th scope="col" className={`${MID_TH} min-w-[140px]`}>
            备注
          </th>
          {mode === 'leader' && (
            <>
              <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
                创建
              </th>
              <th scope="col" className={`${MID_TH} whitespace-nowrap`}>
                更新
              </th>
            </>
          )}
          <th scope="col" className={STICKY_ACTION_TH}>
            操作
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {paginated.length === 0 ? (
          <tr>
            <td colSpan={emptyColSpan} className="px-6 py-8 text-center text-sm text-gray-500">
              {rawBucketLength > 0 ? '无匹配记录' : '暂无数据'}
            </td>
          </tr>
        ) : (
          paginated.map((r) => (
            <tr key={`${rowKeyPrefix}-${r.record_id}`} className="group transition-colors hover:bg-gray-50/80">
              <td className={STICKY_COL1_TD} title={r.student_name}>
                {r.student_name}
              </td>
              <td className={STICKY_COL2_TD} title={r.subject_name}>
                {r.subject_name}
              </td>
              {mode === 'mentor' && (
                <td className={`${MID_TD} text-gray-900 whitespace-nowrap`}>{takeExamCell(r.take_exam)}</td>
              )}
              <td className={`${MID_TD} text-gray-900`}>{r.estimated_score || '—'}</td>
              {mode === 'leader' && (
                <>
                  <td className={`${MID_TD} text-gray-900`}>{takeExamCell(r.take_exam)}</td>
                  <td className={`${MID_TD} text-gray-900`}>{r.exam_score || '—'}</td>
                </>
              )}
              <td className={`${MID_TD} whitespace-nowrap text-gray-900`}>
                {r.date_year != null && r.date_year !== '' ? `${r.date_year}-${r.date_month}` : '—'}
              </td>
              <td className={`${MID_TD} text-gray-700 max-w-xs truncate`} title={r.note || ''}>
                {r.note || '—'}
              </td>
              {mode === 'leader' && (
                <>
                  <td className={`${MID_TD} whitespace-nowrap text-xs text-gray-600`}>{r.create_time || '—'}</td>
                  <td className={`${MID_TD} whitespace-nowrap text-xs text-gray-600`}>{r.update_time || '—'}</td>
                </>
              )}
              <td className={STICKY_ACTION_TD}>
                {mode === 'mentor' ? (
                  <div className="flex flex-row flex-wrap items-center justify-end gap-1">
                    {canEditNote && !isEstimatedScoreFilled(r) ? (
                      <button
                        type="button"
                        onClick={() => onOpenNote(r)}
                        className={ICON_BTN_BLUE}
                        title="填写备注"
                        aria-label="填写备注"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      </button>
                    ) : canEditNote && isEstimatedScoreFilled(r) ? (
                      <span
                        className={ICON_BTN_MUTED}
                        title="预估分 已定"
                        aria-label="预估分 已定"
                        role="img"
                      >
                        <LockClosedIcon className="h-4 w-4" />
                      </span>
                    ) : (
                      <span
                        className={ICON_BTN_MUTED}
                        title="无可用操作"
                        aria-label="无可用操作"
                        role="img"
                      >
                        <MinusSmallIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-row flex-wrap items-center justify-end gap-1">
                    {readMentorLeader || (canEditNote && !isEstimatedScoreFilled(r)) ? (
                      <button
                        type="button"
                        onClick={() => onOpenNote(r)}
                        className={ICON_BTN_BLUE}
                        title="填写备注"
                        aria-label="填写备注"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    {isSubjectLeader ? (
                      <>
                        {isMentorNoteReadyForLeaderScores(r) && canDeleteRecord(r) ? (
                          <button
                            type="button"
                            onClick={() => onOpenLeaderScores(r)}
                            className={ICON_BTN_BLUE}
                            title="录入预估分与考试等第"
                            aria-label="录入预估分与考试等第"
                          >
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                          </button>
                        ) : isMentorNoteReadyForLeaderScores(r) && !canDeleteRecord(r) ? (
                          <span
                            className={ICON_BTN_MUTED}
                            title="当前不可录入或修改分数"
                            aria-label="当前不可录入或修改分数"
                            role="img"
                          >
                            <LockClosedIcon className="h-4 w-4" />
                          </span>
                        ) : (
                          <span
                            className={ICON_BTN_MUTED}
                            title="请先由导师填写备注与出分年月"
                            aria-label="请先由导师填写备注与出分年月"
                            role="img"
                          >
                            <LockClosedIcon className="h-4 w-4" />
                          </span>
                        )}
                        {canDeleteRecord(r) ? (
                          <button
                            type="button"
                            onClick={() => onRequestDelete(r)}
                            className={ICON_BTN_RED}
                            title="删除"
                            aria-label="删除"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                      </>
                    ) : !isSubjectLeader &&
                      !(readMentorLeader || (canEditNote && !isEstimatedScoreFilled(r))) ? (
                      <span
                        className={ICON_BTN_MUTED}
                        title="学科组长可操作：导师备注就绪后可录入成绩；可删除"
                        aria-label="学科组长可操作：导师备注就绪后可录入成绩；可删除"
                        role="img"
                      >
                        <InformationCircleIcon className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function EstimatedScoreMentorPage() {
  const { hasPermission, user } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_ESTIMATED_SCORE);
  const canEditNote = hasPermission(PERMISSIONS.EDIT_ESTIMATED_SCORE_NOTE);
  const isSubjectLeader = readSubjectLeader(user);
  const isMentorLeaderUser = readMentorLeader(user);

  const [mentorRows, setMentorRows] = useState<SignupEstimatedScoreRow[]>([]);
  const [leaderRows, setLeaderRows] = useState<SignupEstimatedScoreRow[]>([]);
  const [subjectListFromApi, setSubjectListFromApi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [mentorPage, setMentorPage] = useState(1);
  const [leaderPage, setLeaderPage] = useState(1);
  const [activeTab, setActiveTab] = useState<EstimatedTab>('mentor');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  const [leaderScoreModal, setLeaderScoreModal] = useState<SignupEstimatedScoreRow | null>(null);
  const [gradePick, setGradePick] = useState('');
  const [examPick, setExamPick] = useState('');

  const [noteModal, setNoteModal] = useState<SignupEstimatedScoreRow | null>(null);
  const [noteText, setNoteText] = useState('');
  /** 出分年月：与 `<input type="month" />` 一致，格式 YYYY-MM */
  const [noteYearMonth, setNoteYearMonth] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<SignupEstimatedScoreRow | null>(null);

  const noteMonthInputMin = useMemo(
    () => `${new Date().getFullYear() - 4}-01`,
    []
  );
  const noteMonthInputMax = useMemo(
    () => `${new Date().getFullYear() + 6}-12`,
    []
  );

  const openNoteModal = (r: SignupEstimatedScoreRow) => {
    setNoteText(r.note ? String(r.note) : '');
    const yRaw = r.date_year != null && r.date_year !== '' ? Number(r.date_year) : NaN;
    const mRaw = r.date_month != null && r.date_month !== '' ? Number(r.date_month) : NaN;
    setNoteYearMonth(
      Number.isFinite(yRaw) && Number.isFinite(mRaw) ? toMonthInputValue(yRaw, mRaw) : ''
    );
    setNoteModal(r);
  };

  const openLeaderScoreModal = (r: SignupEstimatedScoreRow) => {
    if (!canDeleteRecord(r)) {
      setToast({ text: '当前不可录入或修改分数', variant: 'error' });
      return;
    }
    if (!isMentorNoteReadyForLeaderScores(r)) {
      setToast({ text: '请先由导师填写备注与出分年月', variant: 'error' });
      return;
    }
    setGradePick(
      r.estimated_score && String(r.estimated_score).trim() ? String(r.estimated_score) : ''
    );
    setExamPick(r.exam_score && String(r.exam_score).trim() ? String(r.exam_score) : '');
    setLeaderScoreModal(r);
  };

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const [listRes, selRes] = await Promise.all([
        getSignupEstimatedScore(),
        getEstimatedScoreSelect(),
      ]);
      if (listRes.code !== 200 || !listRes.data) {
        setError(listRes.message || '加载失败');
        setMentorRows([]);
        setLeaderRows([]);
      } else {
        const { mentor, leader } = splitSignupBuckets(listRes.data);
        setMentorRows(mentor);
        setLeaderRows(leader);
        if (!silent) {
          if (mentor.length > 0) {
            setActiveTab('mentor');
          } else if (leader.length > 0) {
            setActiveTab('leader');
          }
        }
      }
      if (selRes.code === 200 && selRes.data) {
        if (Array.isArray(selRes.data.subject_list)) {
          setSubjectListFromApi(selRes.data.subject_list);
        }
      }
    } catch {
      setError('加载失败');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const subjectOptions = useMemo(() => {
    const fromRows = [...mentorRows, ...leaderRows]
      .map((r) => r.subject_name)
      .filter(Boolean) as string[];
    const set = new Set<string>([...subjectListFromApi, ...fromRows]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'en'));
  }, [subjectListFromApi, mentorRows, leaderRows]);

  const filteredMentor = useMemo(
    () => filterRows(mentorRows, subjectFilter, searchTerm),
    [mentorRows, subjectFilter, searchTerm]
  );
  const filteredLeader = useMemo(
    () => filterRows(leaderRows, subjectFilter, searchTerm),
    [leaderRows, subjectFilter, searchTerm]
  );

  useEffect(() => {
    setMentorPage(1);
    setLeaderPage(1);
  }, [searchTerm, subjectFilter, pageSize]);

  const mentorTotal = filteredMentor.length;
  const mentorTotalPages = Math.max(1, Math.ceil(mentorTotal / pageSize));
  const mentorPageSafe = Math.min(mentorPage, mentorTotalPages);
  const mentorStart = (mentorPageSafe - 1) * pageSize;
  const paginatedMentor = filteredMentor.slice(mentorStart, mentorStart + pageSize);

  const leaderTotal = filteredLeader.length;
  const leaderTotalPages = Math.max(1, Math.ceil(leaderTotal / pageSize));
  const leaderPageSafe = Math.min(leaderPage, leaderTotalPages);
  const leaderStart = (leaderPageSafe - 1) * pageSize;
  const paginatedLeader = filteredLeader.slice(leaderStart, leaderStart + pageSize);

  const mentorPageNumbers = useMemo(
    () => buildPageNumbers(mentorTotalPages, mentorPageSafe),
    [mentorTotalPages, mentorPageSafe]
  );
  const leaderPageNumbers = useMemo(
    () => buildPageNumbers(leaderTotalPages, leaderPageSafe),
    [leaderTotalPages, leaderPageSafe]
  );

  const submitLeaderScores = async () => {
    if (!leaderScoreModal) return;
    if (!canDeleteRecord(leaderScoreModal)) {
      setToast({ text: '当前不可录入或修改分数', variant: 'error' });
      setLeaderScoreModal(null);
      return;
    }
    const row = leaderScoreModal;
    if (!isMentorNoteReadyForLeaderScores(row)) {
      setToast({ text: '请先由导师填写备注与出分年月', variant: 'error' });
      return;
    }
    const g = gradePick.trim();
    const e = examPick.trim();
    const curG = String(row.estimated_score ?? '').trim();
    const curE = String(row.exam_score ?? '').trim();
    const examAllowed = takeExamYes(row.take_exam);

    const wantEst = g !== curG;
    const wantExam = examAllowed && e !== curE;

    if (!wantEst && !wantExam) {
      setToast({ text: '没有修改', variant: 'error' });
      return;
    }
    if (wantEst) {
      if (!g) {
        setToast({ text: '请输入预估分', variant: 'error' });
        return;
      }
    }
    if (wantExam) {
      if (!e) {
        setToast({ text: '请输入考试等第', variant: 'error' });
        return;
      }
    }

    if (wantEst) {
      const res = await updateEstimatedScoreGrade(row.record_id, g);
      if (res.code !== 200) {
        setToast({ text: res.message || '预估分更新失败', variant: 'error' });
        return;
      }
    }
    if (wantExam) {
      const res = await updateEstimatedExamScore(row.record_id, e);
      if (res.code !== 200) {
        setToast({ text: res.message || '考试等第更新失败', variant: 'error' });
        return;
      }
    }

    setToast({
      text: [wantEst && '预估分 已更新', wantExam && '考试等第已更新'].filter(Boolean).join('；') || '已保存',
      variant: 'success',
    });
    setLeaderScoreModal(null);
    setGradePick('');
    setExamPick('');
    await load({ silent: true });
  };

  const submitNote = async () => {
    if (!noteModal) return;
    const parsed = parseMonthInputValue(noteYearMonth);
    if (!parsed) {
      setToast({ text: '请选择出分年月', variant: 'error' });
      return;
    }
    const res = await updateEstimatedScoreNote({
      record_id: noteModal.record_id,
      note: noteText.trim(),
      date_year: parsed.y,
      date_month: parsed.m,
    });
    if (res.code === 200) {
      setToast({ text: '备注已保存', variant: 'success' });
      setNoteModal(null);
      await load({ silent: true });
    } else {
      setToast({ text: res.message || '保存失败', variant: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteEstimatedScoreRecord(deleteTarget.record_id);
    if (res.code === 200) {
      setToast({ text: '已删除', variant: 'success' });
      setDeleteTarget(null);
      await load({ silent: true });
    } else {
      setToast({ text: res.message || '删除失败', variant: 'error' });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const showEmpty =
    !loading && mentorRows.length === 0 && leaderRows.length === 0 && !error;

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">权限不足</p>
          <p className="text-gray-600 text-sm mt-2">您没有查看预估分申请的权限</p>
        </div>
      </div>
    );
  }

  const renderPagination = (
    totalItems: number,
    startIdx: number,
    pageSafe: number,
    totalPages: number,
    pageNumbers: (number | 'dots')[],
    setPage: Dispatch<SetStateAction<number>>
  ) =>
    totalItems > 0 ? (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-600">
              显示第 {totalItems === 0 ? 0 : startIdx + 1} - {Math.min(startIdx + pageSize, totalItems)} 条，共{' '}
              {totalItems} 条记录
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每页显示</span>
              <select
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">条</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            {pageNumbers.map((p, idx) =>
              p === 'dots' ? (
                <span key={`d-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${
                    p === pageSafe
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">学生预估分申请</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
        )}
        {toast && (
          <div
            className={
              toast.variant === 'success'
                ? 'mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4'
                : 'mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4'
            }
            role="status"
          >
            {toast.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 flex-wrap">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Student name or subject…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-auto sm:min-w-[220px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject filter</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">All subjects</option>
                    {subjectOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => load()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shrink-0 self-start lg:self-end"
              >
                刷新
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {showEmpty && (
              <div className="bg-white rounded-lg shadow border border-gray-200 py-12 text-center text-sm text-gray-500">
                暂无数据
              </div>
            )}

            {!showEmpty && !error && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div
                  className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto"
                  role="tablist"
                  aria-label="预估分列表分类"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'mentor'}
                    id="tab-estimated-mentor"
                    onClick={() => setActiveTab('mentor')}
                    className={`shrink-0 px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'mentor'
                        ? 'border-blue-600 text-blue-700 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    导师
                    {mentorRows.length > 0 ? (
                      <span className="ml-1.5 text-xs font-normal text-gray-500">({mentorRows.length})</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'leader'}
                    id="tab-estimated-leader"
                    onClick={() => setActiveTab('leader')}
                    className={`shrink-0 px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'leader'
                        ? 'border-blue-600 text-blue-700 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    导师组长
                    {leaderRows.length > 0 ? (
                      <span className="ml-1.5 text-xs font-normal text-gray-500">({leaderRows.length})</span>
                    ) : null}
                  </button>
                </div>

                {activeTab === 'mentor' ? (
                  <>
                    <div className="overflow-x-auto">
                      <SignupBucketTable
                        mode="mentor"
                        paginated={paginatedMentor}
                        rowKeyPrefix="m"
                        rawBucketLength={mentorRows.length}
                        canEditNote={canEditNote}
                        isSubjectLeader={isSubjectLeader}
                        readMentorLeader={isMentorLeaderUser}
                        onOpenNote={openNoteModal}
                        onOpenLeaderScores={openLeaderScoreModal}
                        onRequestDelete={setDeleteTarget}
                      />
                    </div>
                    {renderPagination(
                      mentorTotal,
                      mentorStart,
                      mentorPageSafe,
                      mentorTotalPages,
                      mentorPageNumbers,
                      setMentorPage
                    )}
                  </>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <SignupBucketTable
                        mode="leader"
                        paginated={paginatedLeader}
                        rowKeyPrefix="l"
                        rawBucketLength={leaderRows.length}
                        canEditNote={canEditNote}
                        isSubjectLeader={isSubjectLeader}
                        readMentorLeader={isMentorLeaderUser}
                        onOpenNote={openNoteModal}
                        onOpenLeaderScores={openLeaderScoreModal}
                        onRequestDelete={setDeleteTarget}
                      />
                    </div>
                    {renderPagination(
                      leaderTotal,
                      leaderStart,
                      leaderPageSafe,
                      leaderTotalPages,
                      leaderPageNumbers,
                      setLeaderPage
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {leaderScoreModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
              <h3 className="text-lg font-medium mb-3">录入预估分与考试等第</h3>
              <p className="text-sm text-gray-600 mb-3">
                {leaderScoreModal.student_name} · {leaderScoreModal.subject_name}
              </p>
              <label className="block text-xs font-medium text-gray-600 mb-1">预估分</label>
              <input
                type="text"
                autoComplete="off"
                placeholder="请输入预估分"
                value={gradePick}
                onChange={(e) => setGradePick(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <label
                className={`block text-xs font-medium mb-1 ${
                  takeExamYes(leaderScoreModal.take_exam) ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                考试等第
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder={
                  takeExamYes(leaderScoreModal.take_exam) ? '请输入考试等第' : '学生未申请考试，不可填写'
                }
                value={examPick}
                onChange={(e) => setExamPick(e.target.value)}
                disabled={!takeExamYes(leaderScoreModal.take_exam)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-1 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              {!takeExamYes(leaderScoreModal.take_exam) ? (
                <p className="text-xs text-gray-500 mb-4">需学生先申请考试后，才可录入考试等第。</p>
              ) : null}
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setLeaderScoreModal(null);
                    setGradePick('');
                    setExamPick('');
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void submitLeaderScores()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {noteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-2">填写备注与出分年月</h3>
              <p className="text-sm text-gray-600 mb-3">
                {noteModal.student_name} · {noteModal.subject_name}
              </p>
              <label className="block text-xs font-medium text-gray-600 mb-1">备注</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
              />
              <label className="block text-xs font-medium text-gray-600 mb-1">出分年月</label>
              <input
                type="month"
                value={noteYearMonth}
                min={noteMonthInputMin}
                max={noteMonthInputMax}
                onChange={(e) => setNoteYearMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteModal(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void submitNote()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:flex sm:items-start sm:gap-4">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">删除这条预估分申请？</h3>
                <p className="text-sm text-gray-600 mb-1">
                  {deleteTarget.student_name} · {deleteTarget.subject_name}
                </p>
                <p className="text-xs text-gray-500 mb-4">仅学科组长可删除，操作不可恢复。</p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
