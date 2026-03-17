import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

export interface NoticeItem {
  id: number;
  title: string;
  content: string;
  create_time?: string;
  update_time?: string;
  operator_id?: number;
}

export interface NoticeListResponse {
  rows: NoticeItem[];
  total: number;
}

export const getNoticeList = async (): Promise<ApiResponse<NoticeListResponse>> => {
  try {
    const { data } = await request<ApiEnvelope<NoticeListResponse>>('/api/notice/get_notice_list');
    const raw = data as any;
    const rows = raw?.data?.rows ?? raw?.rows ?? [];
    const total = raw?.data?.total ?? raw?.total ?? rows.length;
    return normalizeApiResponse<NoticeListResponse>({
      ...data,
      data: { rows, total },
    } as any);
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取公告列表失败', data: { rows: [], total: 0 } };
  }
};

export const addNotice = async (params: { title: string; content: string; campus_id?: number }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/notice/add_record', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('新增公告失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增公告失败' };
  }
};

export const editNotice = async (params: { record_id: number; title: string; content: string; campus_id?: number }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/notice/edit_notice', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('编辑公告失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑公告失败' };
  }
};

export const changeNoticeRight = async (params: {
  record_id: number;
  visible_types: string;
  visible_years: string;
}): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/notice/change_record_right', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('修改公告权限失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '修改公告权限失败' };
  }
};

export const uploadNoticeFile = async (file: File): Promise<ApiResponse<{ file_path: string }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await request('/api/notice/upload_notice_file', {
      method: 'POST',
      body: formData,
    });
    const resData = data as any;
    const filePath = resData?.data?.file_path ?? resData?.file_path ?? '';
    return normalizeApiResponse<{ file_path: string }>({
      status: resData?.status ?? 0,
      message: resData?.message ?? '',
      data: { file_path: filePath },
    } as any);
  } catch (error) {
    console.error('上传公告附件失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '上传公告附件失败', data: { file_path: '' } };
  }
};
