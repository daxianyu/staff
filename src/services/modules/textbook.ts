import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

export interface TextbookCampusInfo {
  campus_name: string;
  campus_id: number;
}

// 教材相关类型定义
export interface TextbookItem {
  id: number;
  name: string;
  type: string;
  price: number;
  paid_count: number;
  campus_id: number;
  inventory_info: TextbookCampusInfo[]
}

export interface TextbookResponse {
  code: number;
  message: string;
  data: TextbookItem[];
}

/**
 * 获取教材列表
 * @returns 教材列表数据
 */
export const getTextbookList = async (): Promise<ApiResponse<TextbookItem[]>> => {
  try {
    const { data } = await request('/api/textbook/get_staff_list', {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取教材列表失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取教材列表失败',
      data: []
    };
  }
};
