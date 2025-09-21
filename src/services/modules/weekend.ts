import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// 周末计划相关类型定义
export interface LiveRecord {
  record_id: number;
  student_name: string;
  campus_name: string;
  mentor_name: string;
  live_date_str: string;
  live_date: string;
  create_time: string;
}

export interface DinnerRecord {
  record_id: number;
  student_name: string;
  campus_name: string;
  price: number;
  status_name: string;
  time_type: string;
  mentor_name: string;
  dine_date_str: string;
  dine_date: string;
  create_time: string;
}

export interface WeekendTimeTableResponse {
  live_result: {
    rows: LiveRecord[];
    total: number;
  };
  dinner_result: {
    rows: DinnerRecord[];
    total: number;
  };
}

export interface SpecialDateRecord {
  record_id: number;
  special_day: string;
  type: string;
}

export interface SpecialDateTableResponse {
  rows: SpecialDateRecord[];
  total: number;
}

export interface AddWeekendDateRequest {
  start_day: string;
  special_type: number;
}

// 获取学生周末时间表统计
export const getStudentWeekendTimeTable = async (): Promise<ApiResponse<WeekendTimeTableResponse>> => {
  try {
    const { data } = await request('/api/weekend/get_student_weekend_time_table', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<WeekendTimeTableResponse>);
  } catch (error) {
    console.error('获取周末时间表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取周末时间表失败' };
  }
};

// 获取节假日配置列表
export const getSpecialDateTable = async (): Promise<ApiResponse<SpecialDateTableResponse>> => {
  try {
    const { data } = await request('/api/weekend/special_date_table', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<SpecialDateTableResponse>);
  } catch (error) {
    console.error('获取节假日配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取节假日配置失败' };
  }
};

// 添加节假日
export const addWeekendDate = async (params: AddWeekendDateRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/weekend/add_weekend_date', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('添加节假日失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加节假日失败' };
  }
};

// 删除节假日
export const deleteWeekendDate = async (recordId: number): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/weekend/delete_special_date', {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除节假日失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除节假日失败' };
  }
};
