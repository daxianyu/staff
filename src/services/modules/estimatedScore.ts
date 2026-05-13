import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

export interface EstimatedScoreSelectData {
  subject_list: string[];
  grade_list: string[];
}

export interface SignupEstimatedScoreRow {
  record_id: number;
  student_name: string;
  subject_name: string;
  estimated_score: string;
  note?: string;
  date_year?: number | string | null;
  date_month?: number | string | null;
  take_exam?: number | boolean;
  exam_score?: string | null;
  can_delete?: number | boolean;
  create_time?: string;
  update_time?: string;
}

export interface SignupEstimatedBucket {
  rows: SignupEstimatedScoreRow[];
  total: number;
}

/**
 * get_signup_estimated_score 的 data 形状：两套桶 + 可选旧版扁平结构。
 * 返回哪些桶、每条记录字段是否齐全，由后端按当前登录用户决定；前端按桶原样展示即可。
 */
export interface SignupEstimatedListData {
  mentor_result?: SignupEstimatedBucket;
  mentor_leader_result?: SignupEstimatedBucket;
  /** 旧版/兼容：顶层 rows（无 mentor_result 时部分环境仍可能返回） */
  rows?: SignupEstimatedScoreRow[];
  total?: number;
}

/**
 * @deprecated 预估分导师页已改为 mentor_result / mentor_leader_result 分开展示，不再按前端角色合并。
 * 若其它页面需要「单一列表」可继续调用；逻辑为组长视角优先 leader 桶等，与后端实际裁剪可能不完全一致，以接口为准。
 */
export function pickSignupEstimatedDisplayRows(
  data: SignupEstimatedListData | undefined,
  isSubjectLeader: boolean,
  isMentorLeader: boolean
): SignupEstimatedScoreRow[] {
  if (!data) return [];
  const leaderView = isSubjectLeader || isMentorLeader;
  if (leaderView) {
    const fromLeader = data.mentor_leader_result?.rows;
    if (Array.isArray(fromLeader) && fromLeader.length > 0) return fromLeader;
    const fromMentor = data.mentor_result?.rows;
    if (Array.isArray(fromMentor) && fromMentor.length > 0) return fromMentor;
  } else {
    const fromMentor = data.mentor_result?.rows;
    if (Array.isArray(fromMentor) && fromMentor.length > 0) return fromMentor;
  }
  if (Array.isArray(data.rows) && data.rows.length > 0) return data.rows;
  return [];
}

export const getEstimatedScoreSelect = async (): Promise<ApiResponse<EstimatedScoreSelectData>> => {
  try {
    const { data } = await request<ApiEnvelope<EstimatedScoreSelectData>>(
      '/api/subjects/get_estimated_score_select',
      { method: 'GET' }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('getEstimatedScoreSelect failed', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取选项失败',
    };
  }
};

export const getSignupEstimatedScore = async (): Promise<ApiResponse<SignupEstimatedListData>> => {
  try {
    const { data } = await request<ApiEnvelope<SignupEstimatedListData>>(
      '/api/subjects/get_signup_estimated_score',
      { method: 'GET' }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('getSignupEstimatedScore failed', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取列表失败',
    };
  }
};

export const updateEstimatedScoreNote = async (params: {
  record_id: number;
  note: string;
  date_year: number | string;
  date_month: number | string;
}): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request<ApiEnvelope<unknown>>(
      '/api/subjects/update_estimated_score_note',
      { method: 'POST', body: params }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('updateEstimatedScoreNote failed', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新备注失败',
    };
  }
};

export const deleteEstimatedScoreRecord = async (recordId: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request<ApiEnvelope<unknown>>(
      '/api/subjects/delete_estimated_score_record',
      { method: 'POST', body: { record_id: recordId } }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('deleteEstimatedScoreRecord failed', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
};

export const updateEstimatedScoreGrade = async (
  recordId: number,
  estimatedScore: string
): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request<ApiEnvelope<unknown>>(
      '/api/subjects/update_estimated_score',
      { method: 'POST', body: { record_id: recordId, estimated_score: estimatedScore } }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('updateEstimatedScoreGrade failed', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新预估分失败',
    };
  }
};

export const updateEstimatedExamScore = async (
  recordId: number,
  score: string
): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request<ApiEnvelope<unknown>>(
      '/api/subjects/update_estimated_exam_score',
      { method: 'POST', body: { record_id: recordId, score } }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('updateEstimatedExamScore failed', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新考试成绩失败',
    };
  }
};
