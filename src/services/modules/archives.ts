import { request, normalizeApiResponse, getAuthHeader } from '../apiClient';
import type { ApiResponse, SelectOption, ApiEnvelope } from '../types';

// 档案列表项
export interface ArchivesListItem {
  staff_id: number;
  staff_name: string;
  campus_name: string;
  email: string;
  mentor_name: string;
  [key: string]: unknown;
}

// 档案列表响应
export interface ArchivesTableResponse {
  rows: ArchivesListItem[];
  total: number;
}

// 基础信息
export interface ArchivesBaseInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 岗位信息
export interface ArchivesPositionInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 晋升信息
export interface ArchivesPromotionInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 督导信息
export interface ArchivesSupervisionInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 面试信息
export interface ArchivesInterviewInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 投诉信息
export interface ArchivesComplaintInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 奖励信息
export interface ArchivesRewardInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 惩罚信息
export interface ArchivesPunishmentInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 考核信息
export interface ArchivesAccountingInfo {
  staff_id: number;
  [key: string]: unknown;
}

// 编辑字段选项
export interface EditSelectOptions {
  [key: string]: SelectOption[];
}

// 获取档案列表
export const getArchivesTable = async (): Promise<ApiResponse<ArchivesListItem[]>> => {
  try {
    const { data } = await request<{ status: number; message: string; data?: ArchivesTableResponse }>('/api/archives/get_archives_table');
    const normalized = normalizeApiResponse<ArchivesTableResponse>(data as ApiEnvelope<ArchivesTableResponse>);
    if (normalized.code === 200 && normalized.data) {
      // 返回 rows 数组
      return {
        code: 200,
        message: normalized.message,
        data: normalized.data.rows || [],
      };
    }
    return { code: normalized.code, message: normalized.message, data: [] };
  } catch (error) {
    console.error('获取档案列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取档案列表失败' };
  }
};

// 获取编辑字段选项
export const getEditSelect = async (): Promise<ApiResponse<EditSelectOptions>> => {
  try {
    const { data } = await request('/api/archives/get_edit_select');
    return normalizeApiResponse<EditSelectOptions>(data as ApiEnvelope<EditSelectOptions>);
  } catch (error) {
    console.error('获取编辑字段选项失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取编辑字段选项失败' };
  }
};

// 获取基础信息
export const getArchivesBaseInfo = async (staffId: number): Promise<ApiResponse<ArchivesBaseInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_base_info/${staffId}`);
    return normalizeApiResponse<ArchivesBaseInfo>(data as ApiEnvelope<ArchivesBaseInfo>);
  } catch (error) {
    console.error('获取基础信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取基础信息失败' };
  }
};

// 更新基础信息
export const editArchivesBaseInfo = async (params: ArchivesBaseInfo): Promise<ApiResponse<unknown>> => {
  try {
    const payload = { ...params } as Record<string, unknown>;
    if (payload.tc_status === undefined && payload.teacher_certification_status !== undefined) {
      payload.tc_status = payload.teacher_certification_status;
    }
    if (payload.teacher_base_position === undefined && payload.base_position !== undefined) {
      payload.teacher_base_position = payload.base_position;
    }
    const { data } = await request('/api/archives/edit_archives_base_info', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新基础信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新基础信息失败' };
  }
};

// 获取岗位信息
export const getArchivesPositionInfo = async (staffId: number): Promise<ApiResponse<ArchivesPositionInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_position_info/${staffId}`);
    return normalizeApiResponse<ArchivesPositionInfo>(data as ApiEnvelope<ArchivesPositionInfo>);
  } catch (error) {
    console.error('获取岗位信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取岗位信息失败' };
  }
};

// 更新岗位信息
export const editArchivesPositionInfo = async (params: ArchivesPositionInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_position_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新岗位信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新岗位信息失败' };
  }
};

// 获取晋升信息
export const getArchivesPromotionInfo = async (staffId: number): Promise<ApiResponse<ArchivesPromotionInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_promotion_info/${staffId}`);
    return normalizeApiResponse<ArchivesPromotionInfo>(data as ApiEnvelope<ArchivesPromotionInfo>);
  } catch (error) {
    console.error('获取晋升信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取晋升信息失败' };
  }
};

// 更新晋升信息
export const editArchivesPromotionInfo = async (params: ArchivesPromotionInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_promotion_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新晋升信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新晋升信息失败' };
  }
};

// 获取督导信息
export const getArchivesSupervisionInfo = async (staffId: number): Promise<ApiResponse<ArchivesSupervisionInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_supervision_info/${staffId}`);
    return normalizeApiResponse<ArchivesSupervisionInfo>(data as ApiEnvelope<ArchivesSupervisionInfo>);
  } catch (error) {
    console.error('获取督导信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取督导信息失败' };
  }
};

// 更新督导信息
export const editArchivesSupervisionInfo = async (params: ArchivesSupervisionInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_supervision_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新督导信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新督导信息失败' };
  }
};

// 获取面试信息
export const getArchivesInterviewInfo = async (staffId: number): Promise<ApiResponse<ArchivesInterviewInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_interview_info/${staffId}`);
    return normalizeApiResponse<ArchivesInterviewInfo>(data as ApiEnvelope<ArchivesInterviewInfo>);
  } catch (error) {
    console.error('获取面试信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取面试信息失败' };
  }
};

// 新增/更新面试记录
export const editArchivesInterviewInfo = async (params: ArchivesInterviewInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_interview_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新面试信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新面试信息失败' };
  }
};

// 获取投诉信息
export const getArchivesComplaintInfo = async (staffId: number): Promise<ApiResponse<ArchivesComplaintInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_complaint_info/${staffId}`);
    return normalizeApiResponse<ArchivesComplaintInfo>(data as ApiEnvelope<ArchivesComplaintInfo>);
  } catch (error) {
    console.error('获取投诉信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取投诉信息失败' };
  }
};

// 新增/更新投诉记录
export const editArchivesComplaintInfo = async (params: ArchivesComplaintInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_complaint_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新投诉信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新投诉信息失败' };
  }
};

// 获取奖励信息
export const getArchivesRewardInfo = async (staffId: number): Promise<ApiResponse<ArchivesRewardInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_reward_info/${staffId}`);
    return normalizeApiResponse<ArchivesRewardInfo>(data as ApiEnvelope<ArchivesRewardInfo>);
  } catch (error) {
    console.error('获取奖励信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取奖励信息失败' };
  }
};

// 新增/更新奖励记录
export const editArchivesRewardInfo = async (params: ArchivesRewardInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_reward_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新奖励信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新奖励信息失败' };
  }
};

// 获取惩罚信息
export const getArchivesPunishmentInfo = async (staffId: number): Promise<ApiResponse<ArchivesPunishmentInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_punishment_info/${staffId}`);
    return normalizeApiResponse<ArchivesPunishmentInfo>(data as ApiEnvelope<ArchivesPunishmentInfo>);
  } catch (error) {
    console.error('获取惩罚信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取惩罚信息失败' };
  }
};

// 新增/更新惩罚记录
export const editArchivesPunishmentInfo = async (params: ArchivesPunishmentInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_punishment_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新惩罚信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新惩罚信息失败' };
  }
};

// 获取考核信息
export const getArchivesAccountingInfo = async (staffId: number): Promise<ApiResponse<ArchivesAccountingInfo>> => {
  try {
    const { data } = await request(`/api/archives/get_archives_accounting_info/${staffId}`);
    return normalizeApiResponse<ArchivesAccountingInfo>(data as ApiEnvelope<ArchivesAccountingInfo>);
  } catch (error) {
    console.error('获取考核信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取考核信息失败' };
  }
};

// 新增/更新考核记录
export const editArchivesAccountingInfo = async (params: ArchivesAccountingInfo): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/edit_archives_accounting_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新考核信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新考核信息失败' };
  }
};

// 删除记录
export interface DeleteArchivesRecordParams {
  record_id: number;
  record_type: 'position' | 'promotion' | 'supervision' | 'interview' | 'complaint' | 'reward' | 'punishment' | 'accounting';
}

export const deleteArchivesRecord = async (params: DeleteArchivesRecordParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/archives/delete_archives_record', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除记录失败' };
  }
};

// 上传档案文件
export const uploadArchivesFile = async (field: string, file: File): Promise<ApiResponse<string>> => {
  try {
    const formData = new FormData();
    formData.append(field, file);

    const headers: HeadersInit = {
      ...getAuthHeader(),
      // 不要设置Content-Type，让浏览器自动设置
    };

    const response = await fetch('/api/archives/upload_archives_file', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data?.file_path || '',
    };
  } catch (error) {
    console.error('上传文件失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '上传文件失败',
    };
  }
};
