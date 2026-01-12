import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ==================== Users API 接口 ====================

export interface ChangePasswordParams {
  old_password: string;
  new_password: string;
}

// Subject Evaluate 相关接口
export interface SubjectEvaluateItem {
  evaluate_id: number;
  exam_id: number;
  exam_name: string;
  topic_name: string;
  student_id: number;
  grade: string | number;
  result: string;
  second: string;
  student_name: string;
  teacher_name: string;
  teacher_id: number;
  evaluate_title: string;
  evaluate: string;
  is_mentor: number;
  mentor_str: string;
  create_time: string;
  update_time: string;
}

export interface SubjectEvaluateResponse {
  rows: SubjectEvaluateItem[];
  total: number;
}

export const getOwnerEvaluate = async (): Promise<ApiResponse<SubjectEvaluateResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_owner_evaluate', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取本人评价失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取本人评价失败',
    };
  }
};

export const getOtherEvaluate = async (): Promise<ApiResponse<SubjectEvaluateResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_other_evaluate', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取其他评价失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取其他评价失败',
    };
  }
};

export interface ChangeEvaluateParams {
  evaluate: string;
  record_id: number;
}

export const changeEvaluate = async (params: ChangeEvaluateParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/change_evaluate', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改评价失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改评价失败',
    };
  }
};

// Exit Permit 相关接口
export interface ExitPermitItem {
  record_id: number;
  student_id: number;
  student_name: string;
  staff_id: number;
  note: string;
  staff_name: string;
  status: number;
  status_name: string;
  distribute_status: number;
  start_time: string;
  end_time: string;
  create_time: string;
  update_time: string;
}

export interface ExitPermitResponse {
  rows: ExitPermitItem[];
  total: number;
}

export const getStaffOutTable = async (): Promise<ApiResponse<ExitPermitResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_staff_out_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取外出申请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取外出申请失败',
    };
  }
};

export interface OpenDoorParams {
  record_id: number;
  open_door_status?: number;
}

export const updateDoorFlag = async (params: OpenDoorParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_door_flag', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('开门操作失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '开门操作失败',
    };
  }
};

export const deleteOutRecord = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/user/delete_out_record/${recordId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除外出申请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除外出申请失败',
    };
  }
};

export interface BatchAddOutRecordParams {
  start_time: string;
  end_time: string;
  student_ids: string;
}

export const batchAddOutRecord = async (params: BatchAddOutRecordParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/batch_add_out_record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('批量添加外出申请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '批量添加外出申请失败',
    };
  }
};

export interface UpdateStudentOutInfoParams {
  record_id: number;
  status: number;
}

export const updateStudentOutInfo = async (params: UpdateStudentOutInfoParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_student_out_info', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改外出申请状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改外出申请状态失败',
    };
  }
};

export interface OpenDoorParams {
  record_id: number;
  open_door_status?: number;
}

export const openDoor = async (params: OpenDoorParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_door_flag', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('开门失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '开门失败',
    };
  }
};

// PS Polish 相关接口
export interface PSPolishItem {
  record_id: number;
  student_id: number;
  student_name: string;
  campus_name: string;
  teacher_id: number;
  teacher_name: string;
  submit_id: number;
  submit_name: string;
  note: string;
  status: number;
  status_name: string;
  evaluate_status: number;
  evaluate_status_name: string;
  evaluate_info: string;
  message: string;
  create_time: string;
  update_time: string;
  school_type: string;
  ps_type: string;
  words: number;
  major: string;
}

export interface PSPolishResponse {
  rows: PSPolishItem[];
  total: number;
}

export interface PSPolishSelectResponse {
  students: Array<{ id: number; name: string }>;
  staff_list: Array<{ id: number; name: string }>;
  school_type: string[];
  ps_type: string[];
}

export const getPolishSelect = async (): Promise<ApiResponse<PSPolishSelectResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_polish_select', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取PS润色选项失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取PS润色选项失败',
    };
  }
};

export const getPolishTable = async (): Promise<ApiResponse<PSPolishResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_polish_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取PS润色表格失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取PS润色表格失败',
    };
  }
};

export const getSubmitPolishTable = async (): Promise<ApiResponse<PSPolishResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_submit_polish_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取提交的PS润色表格失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取提交的PS润色表格失败',
    };
  }
};

export interface AddPaperPolishParams {
  student_id: number;
  teacher_id: number;
  school_type: string;
  ps_type: string;
  words: number;
  major: string;
  note?: string;
}

export const addPaperPolish = async (params: AddPaperPolishParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/add_paper_polish', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加文件润色邀请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加文件润色邀请失败',
    };
  }
};

export interface UpdatePolishStatusParams {
  record_id: number;
  status?: number;
  reject_reason?: string;
  evaluate_status?: number;
  unhappy?: string;
}

export const updatePolishStatus = async (params: UpdatePolishStatusParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_polish_status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改PS润色状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改PS润色状态失败',
    };
  }
};

// Withdrawal Overview 相关接口
export interface WithdrawalExamItem {
  record_id: number;
  student_name: string;
  campus_name?: string;
  mentor_name?: string;
  season: string;
  status: number;
  status_name: string;
  exam_name: string;
  pay_account?: string;
  account_name?: string;
  signup_price?: number;
  create_time: string;
  reject_reason: string;
  student_id?: number;
}

export interface WithdrawalExamResponse {
  rows: WithdrawalExamItem[];
  total: number;
}

export const getWithdrawalExamTable = async (): Promise<ApiResponse<WithdrawalExamResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_withdrawal_exam_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取退考信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取退考信息失败',
    };
  }
};

export const downloadWithdrawalExamTable = async (): Promise<ApiResponse<{ file_path: string }>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/download_withdrawal_exam_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('下载退考信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '下载退考信息失败',
    };
  }
};

export interface UpdateWithdrawalExamStatusParams {
  record_id: number;
  status: number;
  reject_reason?: string;
}

export const updateWithdrawalExamStatus = async (params: UpdateWithdrawalExamStatusParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_withdrawal_exam_status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改退考信息状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改退考信息状态失败',
    };
  }
};

export const deleteWithdrawalExam = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/user/delete_withdrawal_exam/${recordId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除退考信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除退考信息失败',
    };
  }
};

// Late Cashin Overview 相关接口
export interface CashinExamItem {
  record_id: number;
  season: string;
  mentor_name: string;
  subject_name: string;
  student_name: string;
  reject_reason: string;
  exam_code: string;
  level: string;
  note: string;
  status: number;
  create_time: string;
  status_name: string;
}

export interface CashinExamResponse {
  rows: CashinExamItem[];
  total: number;
}

export const getStaffCashinTable = async (): Promise<ApiResponse<CashinExamResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_staff_cashin_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取成绩补合并信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取成绩补合并信息失败',
    };
  }
};

export interface UpdateCashinParams {
  record_id: number;
  status: number;
  reject_reason: string;
}

export const updateCashin = async (params: UpdateCashinParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_cashin', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改成绩补合并状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改成绩补合并状态失败',
    };
  }
};

// Graduation Wishes 相关接口
export interface GraduationWishesItem {
  record_id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  wishes: string;
  is_mentor: string;
  create_time: string;
  update_time: string;
  delete_flag: number;
}

export interface GraduationWishesResponse {
  rows: GraduationWishesItem[];
  total: number;
}

export const getOwnerGraduationWishes = async (): Promise<ApiResponse<GraduationWishesResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_owner_graduation_wishes', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取本人毕业祝福失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取本人毕业祝福失败',
    };
  }
};

export const getOtherGraduationWishes = async (): Promise<ApiResponse<GraduationWishesResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_other_graduation_wishes', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取其他毕业祝福失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取其他毕业祝福失败',
    };
  }
};

// =========================
// Graduation Wishes Sender（分配/发送毕业祝福邀请）相关接口
// 后端实现：phy/handler/office/user.py
// - /api/user/get_graduation_select
// - /api/user/get_graduation_table
// - /api/user/add_graduation_wishes_record
// - /api/user/delete_graduation_wishes_record
// =========================

export interface GraduationSelectResponse {
  students: Array<{ id: number; name: string }>;
  staff: Array<{ id: number; name: string }>;
}

export interface GraduationWishesRecordItem {
  record_id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  wishes: string;
  is_mentor: string;
  create_time: string;
  update_time: string;
  operator: number;
  delete_flag: number;
}

export interface GraduationWishesRecordTableResponse {
  rows: GraduationWishesRecordItem[];
  total: number;
}

export const getGraduationSelect = async (): Promise<ApiResponse<GraduationSelectResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/user/get_graduation_select', {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取毕业祝福下拉选项失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取毕业祝福下拉选项失败',
    };
  }
};

export const getGraduationTable = async (): Promise<ApiResponse<GraduationWishesRecordTableResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/user/get_graduation_table', {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取毕业祝福表格失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取毕业祝福表格失败',
    };
  }
};

export interface AddGraduationWishesRecordParams {
  student_id: number;
  teacher_ids: number[];
}

export const addGraduationWishesRecord = async (
  params: AddGraduationWishesRecordParams
): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/user/add_graduation_wishes_record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加毕业祝福记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加毕业祝福记录失败',
    };
  }
};

export interface DeleteGraduationWishesRecordParams {
  record_id: number;
}

export const deleteGraduationWishesRecord = async (
  params: DeleteGraduationWishesRecordParams
): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/user/delete_graduation_wishes_record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除毕业祝福记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除毕业祝福记录失败',
    };
  }
};

// Transcript Apply 相关接口
export interface TranscriptApplyItem {
  record_id: number;
  student_name: string;
  exam_select: string;
  exam_season: string;
  file_type: string;
  status: number;
  manager_name: string;
  status_name: string;
  apply_desc: string;
  reject_reason: string;
  create_time: string;
}

export interface TranscriptApplyResponse {
  rows: TranscriptApplyItem[];
  total: number;
}

export interface TranscriptApplySelectResponse {
  students: Array<{ id: number; name: string }>;
  file_type: Array<{ id: number; name: string }>;
  exam_select: string[];
  exam_season: string[];
}

export const getTranscriptApplySelect = async (): Promise<ApiResponse<TranscriptApplySelectResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_transcript_apply_select', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取成绩单申请选项失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取成绩单申请选项失败',
    };
  }
};

export const getTranscriptApply = async (): Promise<ApiResponse<TranscriptApplyResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_transcript_apply', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取证明申请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取证明申请失败',
    };
  }
};

export interface AddTranscriptApplyParams {
  student_id: number;
  exam_select: string;
  exam_season: string;
  apply_desc: string;
  file_type: number;
}

export const addTranscriptApply = async (params: AddTranscriptApplyParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/add_transcript_apply', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增证明申请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增证明申请失败',
    };
  }
};

export const revokeTranscriptApply = async (id: number): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/user/revoke_transcript_apply/${id}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('撤销证明申请失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '撤销证明申请失败',
    };
  }
};

// Promote Comment 相关接口
export interface StaffPromoteItem {
  record_id: number;
  staff_id: number;
  staff_name: string;
  staff_effect_date: string;
  teacher_effect_date: string;
  level: number;
  staff_next_level: number;
  teacher_level: number;
  teacher_next_level: number;
  teacher_hours: number;
  comment: string;
  promote_staff: number;
  promote_staff_name: string;
  operator_id: number;
  operator_name: string;
  create_id: number;
  create_name: string;
}

export interface StaffPromoteResponse {
  rows: StaffPromoteItem[];
  total: number;
}

export const getStaffPromote = async (): Promise<ApiResponse<StaffPromoteResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_staff_promote', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取晋升评价失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取晋升评价失败',
    };
  }
};

export interface UpdateStaffPromoteCommentParams {
  record_id: number;
  comment: string;
}

export const updateStaffPromoteComment = async (params: UpdateStaffPromoteCommentParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/update_staff_promote_comment', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改晋升评价评论失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改晋升评价评论失败',
    };
  }
};

// My Card 相关接口
export interface StaffCardItem {
  cardId: number;
  cardNo: string;
  personName: string;
  genAccount: string;
  subAccount: string;
  totalAccount: string;
  useStatus: number;
  startDate: string;
  endDate: string;
}

export interface StaffCardResponse {
  rows: StaffCardItem[];
  total: number;
}

export const getStaffCard = async (): Promise<ApiResponse<StaffCardResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_staff_card', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取老师充值卡失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取老师充值卡失败',
    };
  }
};

export interface CardRechargeRecordItem {
  cardId: number;
  status: number;
  status_str: string;
  cardNo: string;
  personName: string;
  useStatus: string;
  amount: number;
  trade_number: string;
  create_time: string;
  update_time: string;
}

export interface CardRechargeRecordResponse {
  rows: CardRechargeRecordItem[];
  total: number;
}

export const getCardRechargeRecord = async (cardId: number): Promise<ApiResponse<CardRechargeRecordResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/user/get_card_recharge_record/${cardId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取充值记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取充值记录失败',
    };
  }
};

export interface CardConsumeRecordItem {
  chargeNo: string;
  cardNo: string;
  personId: string;
  preAccount: string;
  personName: string;
  merchantName: string;
  deduction: string;
  balance: string;
  debitTime: string;
}

export interface CardConsumeRecordResponse {
  rows: CardConsumeRecordItem[];
  total: number;
}

export const getCardConsumeRecord = async (cardNo: string): Promise<ApiResponse<CardConsumeRecordResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/user/get_card_consume_record/${cardNo}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取消费记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取消费记录失败',
    };
  }
};

export interface CardRechargeParams {
  amount: number;
  card_id: number;
}

export const cardRecharge = async (params: CardRechargeParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/card_recharge', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('餐卡充值失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '餐卡充值失败',
    };
  }
};

// My Subjects 相关接口
export interface SubjectOverviewItem {
  id: number;
  topic_id: number;
  class_name: string;
  campus_id: number;
  class_id: number;
}

export const getSubjectOverview = async (teacherId: number): Promise<ApiResponse<SubjectOverviewItem[]>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/user/get_subject_overview/${teacherId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取科目概览失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取科目概览失败',
    };
  }
};

export const disableSubject = async (subjectIds: Record<string, string>): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/disable_subject', {
      method: 'POST',
      headers,
      body: JSON.stringify(subjectIds),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('禁用科目失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '禁用科目失败',
    };
  }
};

// Edit Profile 相关接口
export interface MyProfile {
  staff_id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_email: string;
  phone_0: string;
  phone_1: string;
  active: number;
  inactive_since: string;
  mentor_leader_id: number;
  mentor_leader_name: string;
  campus_id: number;
  campus_name: string;
}

export const getMyProfile = async (): Promise<ApiResponse<MyProfile>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_my_profile', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取用户资料失败',
    };
  }
};

export const changeMyPassword = async (params: ChangePasswordParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/change_my_password', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        old_password: params.old_password,
        new_password: params.new_password,
      }),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('修改密码失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改密码失败',
    };
  }
};

// Remark相关接口类型定义
export interface RemarkItem {
  record_id: number;
  student_id: number;
  student_name: string;
  mentor_name: string;
  campus_name: string;
  season: string;
  price: number;
  exam_center: string;
  exam_id: number;
  exam_name: string;
  remark_type: string;
  exam_code: string;
  note: string;
  alipay_account: string;
  alipay_name: string;
  reject_reason: string;
  status: number;
  create_time: string;
  status_name: string;
}

export interface RemarkResponse {
  rows: RemarkItem[];
  total: number;
}

export interface RemarkUpdateParams {
  record_id: number;
  status: number;
  reject_reason?: string;
}

export interface RemarkDeleteParams {
  record_id: number;
}

// Remark API接口
export const getStaffRemarkTable = async (): Promise<ApiResponse<RemarkResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/remark/get_staff_remark_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取remark列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取remark列表失败',
    };
  }
};

export const updateRemarkStatus = async (params: RemarkUpdateParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/remark/update_remark_detail', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新remark状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新remark状态失败',
    };
  }
};

export const deleteRemarkRecord = async (params: RemarkDeleteParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/remark/delete_record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除remark记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除remark记录失败',
    };
  }
};

// 获取外出申请学生选择列表
export interface StaffOutSelectResponse {
  status: number;
  message: string;
  data: {
    all_students: Array<{
      id: number;
      name: string;
    }>;
    live_students: Array<{
      id: number;
      name: string;
    }>;
    out_student: Array<{
      id: number;
      name: string;
    }>;
    start_time: string;
    end_time: string;
  };
}

export const getStaffOutSelect = async (): Promise<ApiResponse<StaffOutSelectResponse['data']>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/user/get_staff_out_select', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取外出申请学生选择列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取外出申请学生选择列表失败',
    };
  }
};
