import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// 学生选课申请记录类型定义
export interface GroupAssignmentRequest {
  id: number;
  student_id: number;
  signup_time: number;
  exam_id: number;
  note: string;
  self_signup_id: number;
  // 扩展字段（从后端获取）
  campus_id?: number;
  first_name?: string;
  last_name?: string;
  exam_name?: string;
  class_name?: string;
  topic_id?: number;
  mentor_id?: number;
  mentor_name?: string;
  topic_name?: string;
  campus_name?: string;
}

// 后端直接返回数组格式（实际使用）
export type GroupAssignmentListResponse = GroupAssignmentRequest[];

// 删除请求参数
export interface DeleteRequestsRequest {
  record_ids: string; // 逗号分隔的ID字符串，如 "1,2,3"
}

// 获取学生选课申请列表
export const getGroupAssignmentList = async (
  campusId?: string,
  topicId?: string
): Promise<ApiResponse<GroupAssignmentRequest[]>> => {
  try {
    const params = new URLSearchParams();
    if (campusId) params.append('campus_id', campusId);
    if (topicId) params.append('topic_id', topicId);

    const queryString = params.toString();
    const url = `/api/groups/group_assign_list${queryString ? `?${queryString}` : ''}`;

    const { data } = await request(url, {
      method: 'GET',
    });

    // 后端直接返回数组格式：{ status: 0, message: "", data: [...] }
    // 直接使用normalizeApiResponse处理，data字段就是数组
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取学生选课申请列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生选课申请列表失败' };
  }
};

// 删除指定的选课申请记录
export const deleteGroupAssignmentRequests = async (
  recordIds: string
): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/delete_assign_group', {
      method: 'POST',
      body: { record_ids: recordIds },
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除选课申请记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除选课申请记录失败' };
  }
};

// 清除所有选课申请记录
export const clearAllRequests = async (): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/groups/clear_all_request', {
      method: 'POST',
    });

    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('清除所有选课申请记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '清除所有选课申请记录失败' };
  }
};
