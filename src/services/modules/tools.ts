import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// 空闲搜索相关类型定义
export interface FreeSearchRecord {
  user_type: string;
  user_name: string;
}

export interface FreeSearchResponse {
  rows: FreeSearchRecord[];
  total: number;
}

export interface FreeSearchRequest {
  user_type: number; // 0: 教师, 1: 学生
  query_start: string; // 开始时间
  query_end: string; // 结束时间
}

// 查询空闲时间
export const freeSearch = async (params: FreeSearchRequest): Promise<ApiResponse<FreeSearchResponse>> => {
  try {
    // 将时间字符串转换为Date对象，因为后端需要时间戳
    const startDate = new Date(params.query_start);
    const endDate = new Date(params.query_end);
    
    const { data } = await request('/api/tools/free_search', {
      method: 'POST',
      body: {
        user_type: params.user_type,
        query_start: startDate,
        query_end: endDate,
      },
    });
    return normalizeApiResponse(data as ApiEnvelope<FreeSearchResponse>);
  } catch (error) {
    console.error('查询空闲时间失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '查询空闲时间失败' };
  }
};
