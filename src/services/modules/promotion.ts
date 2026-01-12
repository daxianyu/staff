import { request, normalizeApiResponse, getAuthHeader } from '../apiClient';
import type { ApiResponse, ApiEnvelope, SelectOption } from '../types';
import { buildFileUrl } from '@/config/env';

// 导师晋升select选项响应
export interface MentorPromotionSelectResponse {
  [key: string]: Array<{ value: string | number; label: string }>;
}

// 教师有效课时响应
export interface TeacherEffectiveClassHoursResponse {
  teacher_id: number;
  teacher_name: string;
  effective_hours: number;
  [key: string]: unknown;
}

// 导师晋升记录项
export interface MentorPromotionRecord {
  record_id: number;
  staff_id: number;
  staff_name: string;
  staff_effect_date: string;
  teacher_effect_date: string;
  level: string;
  staff_next_level: string;
  teacher_level: string;
  teacher_next_level: string;
  teacher_hours: string;
  promote_staff: number;
  promote_staff_name: string;
  comment: string;
  operator_id: number;
  operator_name: string;
  create_id: number;
  create_name: string;
  status: number | string; // 0: 进行中, 1: 已完结, "None": 无权限查看状态
  [key: string]: unknown;
}

// 添加导师晋升记录参数
export interface AddMentorPromotionRecordParams {
  staff_id: number;
  staff_effect_date: string;
  teacher_effect_date: string;
  level: string;
  staff_next_level: string;
  teacher_cur_level: string;
  teacher_next_level: string;
  promote_1: string;
  promote_2: string;
  promote_3: string;
  promote_4: string;
  teacher_hours: string;
  promote_staff: number;
  [key: string]: unknown;
}

// 删除记录参数
export interface DeletePromotionRecordParams {
  record_id: number;
}

// 完结晋升参数
export interface CompletePromotionParams {
  record_id: number;
}

// 下载推荐表参数
export interface DownloadRecommendationParams {
  record_id: number;
  type: '1' | '2'; // 导师推荐表或教师推荐表
}

// 获取导师晋升的select信息
export const getMentorPromotionSelect = async (): Promise<ApiResponse<MentorPromotionSelectResponse>> => {
  try {
    const { data } = await request('/api/core/mentor_promotion_select');
    return normalizeApiResponse<MentorPromotionSelectResponse>(data as ApiEnvelope<MentorPromotionSelectResponse>);
  } catch (error) {
    console.error('获取导师晋升select信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取导师晋升select信息失败' };
  }
};

// 获取教师的有效课时
export const getTeacherEffectiveClassHours = async (teacherId: number, queryDay: string): Promise<ApiResponse<TeacherEffectiveClassHoursResponse>> => {
  try {
    const { data } = await request(`/api/core/teacher_effective_class_hours?teacher_id=${teacherId}&query_day=${queryDay}`);
    return normalizeApiResponse<TeacherEffectiveClassHoursResponse>(data as ApiEnvelope<TeacherEffectiveClassHoursResponse>);
  } catch (error) {
    console.error('获取教师有效课时失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取教师有效课时失败' };
  }
};

// 导师晋升列表响应
export interface MentorPromotionListResponse {
  rows: MentorPromotionRecord[];
  total: number;
}

// 获取教师晋升的记录列表
export const getMentorPromotionRecord = async (): Promise<ApiResponse<MentorPromotionListResponse>> => {
  try {
    const { data } = await request('/api/core/mentor_promotion_record');
    return normalizeApiResponse<MentorPromotionListResponse>(data as ApiEnvelope<MentorPromotionListResponse>);
  } catch (error) {
    console.error('获取教师晋升记录列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取教师晋升记录列表失败' };
  }
};

// 添加导师晋升记录
export const addMentorPromotionRecord = async (params: AddMentorPromotionRecordParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/core/add_mentor_promotion_record', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('添加导师晋升记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加导师晋升记录失败' };
  }
};

// 删除导师晋升记录
export const deleteMentorPromotionRecord = async (params: DeletePromotionRecordParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/core/delete_mentor_promotion_record', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除导师晋升记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除导师晋升记录失败' };
  }
};

// 下载导师推荐表
export const downloadMentorRecommendation = async (params: DownloadRecommendationParams): Promise<void> => {
  try {
    const url = `/api/core/download_mentor_recommendation?record_id=${params.record_id}&record_type=${params.type}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 解析 JSON 响应获取 file_path
    const result = await response.json();
    
    if (result.status !== 0 || !result.data?.file_path) {
      throw new Error(result.message || '获取文件路径失败');
    }

    const filePath = result.data.file_path;
    
    // 构建完整的文件下载URL
    // 如果是相对路径，需要添加基础URL
    const downloadUrl = filePath.startsWith('http') 
      ? filePath 
      : buildFileUrl(filePath);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = downloadUrl;
    // 从文件路径中提取文件名
    const fileName = filePath.split('/').pop() || `recommendation_${params.type}_${params.record_id}_${Date.now()}.docx`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载导师推荐表失败:', error);
    throw error;
  }
};

// 晋升完结更新完结的状态
export const completeMentorPromotion = async (params: CompletePromotionParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/core/complete_mentor_promotion', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('晋升完结更新失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '晋升完结更新失败' };
  }
};

