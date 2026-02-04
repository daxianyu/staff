// /schedule/strategies/types.ts
import type { ReactNode } from 'react';

export type EventKind = 'lesson' | 'unavailable' | 'invigilate';

export interface ApiBundle {
  // 员工课表API（向后兼容）
  addStaffInvigilate?: (p: { staff_id: string; start_time: number; end_time: number; topic_id: string; note: string }) => Promise<any>;
  updateStaffInvigilate?: (p: { record_id: string; staff_id: string; start_time: number; end_time: number; topic_id: string; note: string }) => Promise<any>;
  deleteStaffInvigilate?: (p: { record_id: string }) => Promise<any>;
  updateStaffUnavailable?: (staffId: string, p: { week_num: number; event_type: 1; time_list: Array<{ start_time: number; end_time: number }> }) => Promise<any>;
  editStaffLesson?: (staffId: string, p: { lesson_id: string; subject_id?: string; start_time: number; end_time: number; room_id?: string | number; repeat_num?: number }) => Promise<any>;
  deleteStaffLesson?: (staffId: string, p: { lesson_ids: string[]; repeat_num?: number }) => Promise<any>;

  // 班级课表API  
  addClassLesson?: (p: { class_id: any; subject_id: any; start_time: number; end_time: number; room_id: any; repeat_num: any }) => Promise<any>;
  editClassLesson?: (p: { record_id: any; start_time: number; end_time: number; room_id: any; repeat_num: any }) => Promise<any>;
  deleteClassLesson?: (p: { record_id: any; repeat_num: any }) => Promise<any>;

  // 上下文信息（支持双模式）
  staffId?: string;        // 员工课表模式
  classId?: string;        // 班级课表模式
  getWeekNum?: (d: Date) => number;
  weekNum?: string;        // 班级课表使用
  date: Date;              // 当前视图所在日期
}

export interface StrategyCtx {
  mode: 'add' | 'edit';
  readOnly: boolean;
  scheduleData?: any;          // 用于渲染（例如 class_topics）
  initialEvent?: any;          // 编辑模式的原始事件
  selectedDate?: Date;
  // 当前时间选择（由外壳生成）
  start: Date;
  end: Date;
  // 用于不可用策略做全量更新（秒级时间戳）
  unavailableRangesSec?: Array<{ start_time: number; end_time: number }>;
}

export interface RenderParams<FormState> {
  form: FormState;
  setForm: (patch: Partial<FormState>) => void;
  readOnly: boolean;
  scheduleData?: any;
  ctx?: StrategyCtx; // 添加上下文信息，包含start和end时间
}

export interface EventTypeStrategy<FormState = any> {
  key: EventKind;
  label: string;
  allowRepeat?: boolean;

  init(ctx: StrategyCtx): FormState;
  render(p: RenderParams<FormState>): ReactNode;
  validate?(form: FormState, ctx: StrategyCtx): string[];

  // 真正执行业务：策略内直接调接口
  onSave(form: FormState, ctx: StrategyCtx, api: ApiBundle): Promise<void>;
  onDelete?(
    current: { id: string; repeat_num?: number },
    ctx: StrategyCtx,
    api: ApiBundle
  ): Promise<void>;
}
