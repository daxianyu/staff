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

export interface TextbookPurchase {
  id: number;
  student_id: number;
  student_name: string;
  textbook_id: number;
  textbook_name: string;
  status: number; // 0: 待付款, 1: 已付款, 2: 已取消, 3: 已领取
  create_time: string;
}

/**
 * 获取教材购买记录
 */
export const getTextbookPurchases = async (textbookId: number): Promise<ApiResponse<TextbookPurchase[]>> => {
  try {
    const { data } = await request(`/api/textbook/get_textbook_purchases/${textbookId}`, {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取教材购买记录失败:', error);
    return { code: 500, message: '获取教材购买记录失败' };
  }
};

/**
 * 标记教材为已领取
 */
export const markTextbookAsReceived = async (purchaseId: number): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/textbook/mark_textbook_as_received', {
      method: 'POST',
      body: { purchase_id: purchaseId },
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('标记教材已领取失败:', error);
    return { code: 500, message: '标记教材已领取失败' };
  }
};

/**
 * 删除教材购买记录 (回滚)
 */
export const deleteTextbookPurchase = async (purchaseId: number): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/textbook/delete_textbook_purchase', {
      method: 'POST',
      body: { purchase_id: purchaseId },
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('删除教材购买记录失败:', error);
    return { code: 500, message: '删除教材购买记录失败' };
  }
};
