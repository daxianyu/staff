import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

export interface RemarkConfSelect {
  exam_center: string[];
  remark_type: Record<number, string>;
  remark2_type: Record<number, string>;
  remark3_type: Record<number, string>;
}

export interface RemarkConfRecord {
  record_id: number;
  exam_center: string;
  conf_type: number;
  remark_type: string;
  price: number;
  in_use: string;
  record_name: string;
  create_time: string;
}

export interface RemarkConfListResponse {
  rows: RemarkConfRecord[];
  total: number;
}

export interface RemarkConfAddParams {
  exam_center: string;
  conf_type: number;
  price: number;
}

/**
 * 获取remark的select清单
 */
export const getRemarkConfSelect = async (): Promise<ApiResponse<RemarkConfSelect>> => {
  try {
    const { data } = await request('/api/remark/get_conf_select', {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取remark select清单失败:', error);
    return { code: 500, message: '获取remark select清单失败' };
  }
};

/**
 * 获取remark配置列表
 */
export const getRemarkConfTable = async (): Promise<ApiResponse<RemarkConfListResponse>> => {
  try {
    const { data } = await request('/api/remark/get_conf_table', {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取remark配置列表失败:', error);
    return { code: 500, message: '获取remark配置列表失败', data: { rows: [], total: 0 } };
  }
};

/**
 * 新增remark配置
 */
export const addRemarkConf = async (params: RemarkConfAddParams): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/remark/add_remark_conf', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('新增remark配置失败:', error);
    return { code: 500, message: '新增remark配置失败' };
  }
};

/**
 * 删除remark配置
 */
export const deleteRemarkConf = async (record_id: number): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/remark/delete_remark_conf', {
      method: 'POST',
      body: { record_id },
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('删除remark配置失败:', error);
    return { code: 500, message: '删除remark配置失败' };
  }
};
