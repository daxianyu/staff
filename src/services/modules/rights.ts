/* eslint-disable @typescript-eslint/no-explicit-any */
import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// ==================== Rights 权限管理相关接口 ====================

// 权限组信息接口
export interface GroupRight {
  id: number;
  name: string;
  [key: string]: any; // 其他权限字段
}

// 权限字段说明接口
export interface RightsColumnComment {
  [columnName: string]: string;
}

// 单个权限点信息接口
export interface SingleRight {
  right_desc: string;
  value: number;
}

// 操作权限列表项接口
export interface OperationRight {
  id: number;
  right_desc: string;
}

// 新增权限组参数
export interface AddGroupParams {
  name: string;
}

// 删除权限组参数
export interface DeleteGroupParams {
  record_id: number;
}

// 编辑权限组参数
export interface EditGroupParams {
  record_id: number;
  [key: string]: any; // 其他权限字段
}

// 单个权限点操作参数
export interface SingleRightParams {
  staff_id: number;
  right_desc: string;
}

// 获取基础权限清单
export const getRightsList = async (): Promise<ApiResponse<GroupRight[]>> => {
  try {
    const { data } = await request<ApiEnvelope<GroupRight[]>>('/api/rights/list', {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取权限清单失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取权限清单失败' };
  }
};

// 获取基础权限的字段说明
export const getRightsColumnComment = async (): Promise<ApiResponse<RightsColumnComment>> => {
  try {
    const { data } = await request<ApiEnvelope<RightsColumnComment>>('/api/rights/group/column', {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取权限字段说明失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取权限字段说明失败' };
  }
};

// 获取基础权限的单个权限组的信息
export const getGroupRightInfo = async (groupId: number): Promise<ApiResponse<GroupRight>> => {
  try {
    const { data } = await request<ApiEnvelope<GroupRight>>(`/api/rights/info/${groupId}`, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取权限组信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取权限组信息失败' };
  }
};

// 新增权限组
export const addRightsGroup = async (params: AddGroupParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/add', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('新增权限组失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增权限组失败' };
  }
};

// 删除权限组
export const deleteRightsGroup = async (params: DeleteGroupParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/delete', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除权限组失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除权限组失败' };
  }
};

// 编辑权限组的权限
export const editRightsGroup = async (params: EditGroupParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/edit', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('编辑权限组失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑权限组失败' };
  }
};

// 获取用户的单个权限点信息
export const getSingleRight = async (staffId: number): Promise<ApiResponse<SingleRight[]>> => {
  try {
    const { data } = await request<ApiEnvelope<[string, number][]>>(`/api/rights/get_single_right/${staffId}`, {
      method: 'GET',
    });
    // 后端返回的是 [[right_desc, value], ...] 格式，需要转换为对象数组
    if (data?.data && Array.isArray(data.data)) {
      const result: SingleRight[] = data.data.map((item: [string, number]) => ({
        right_desc: item[0],
        value: item[1],
      }));
      return normalizeApiResponse({ status: data.status || 0, message: data.message || '', data: result });
    }
    // 如果数据格式不符合预期，返回空数组
    return normalizeApiResponse({ status: 0, message: '', data: [] });
  } catch (error) {
    console.error('获取单个权限点信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取单个权限点信息失败' };
  }
};

// 编辑单个权限点信息（新增）
export const updateSingleRight = async (params: SingleRightParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/update_single_right', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('编辑单个权限点失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑单个权限点失败' };
  }
};

// 删除单个权限点信息
export const deleteSingleRight = async (params: SingleRightParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/delete_single_right', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除单个权限点失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除单个权限点失败' };
  }
};

// 获取配置权限的列表
export const getOperationList = async (): Promise<ApiResponse<OperationRight[]>> => {
  try {
    const { data } = await request<ApiEnvelope<OperationRight[]>>('/api/rights/operation_list', {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取配置权限列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取配置权限列表失败' };
  }
};

// ==================== Staff Operation 人员操作权限相关接口 ====================

// 配置权限下的用户记录
export interface StaffOperationRecord {
  id: number;
  teacher_id: number;
  staff_name: string;
  create_time: string;
}

// 配置权限用户列表响应
export interface StaffOperationListResponse {
  rows: StaffOperationRecord[];
  total: number;
}

// 添加人员操作权限参数
export interface AddStaffOperationParams {
  staff_ids: string; // 逗号分隔的员工ID字符串，如 "1,2,3"
  conf_type: number; // 配置权限类型ID
}

// 删除人员操作权限参数
export interface DeleteStaffOperationParams {
  record_id: number;
}

// 获取单个配置权限下的人员列表
export const getStaffOperation = async (confType: number): Promise<ApiResponse<StaffOperationListResponse>> => {
  try {
    const { data } = await request<ApiEnvelope<StaffOperationListResponse>>(`/api/rights/get_staff_operation/${confType}`, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取配置权限用户列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取配置权限用户列表失败' };
  }
};

// 给人员添加某个配置权限
export const addStaffOperation = async (params: AddStaffOperationParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/add_staff_operation', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加人员操作权限失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加人员操作权限失败' };
  }
};

// 删除指定配置权限下的某个用户
export const deleteStaffOperation = async (params: DeleteStaffOperationParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/delete_staff_operation', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除人员操作权限失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除人员操作权限失败' };
  }
};

// ==================== Time Config 时间配置相关接口 ====================

// 时间配置类型选项
export interface TimeConfigTypeSelect {
  [key: number]: string;
}

// 校区选项
export interface CampusOption {
  id: number;
  name: string;
}

// 时间配置下拉选项响应
export interface TimeConfigSelectResponse {
  type_select: TimeConfigTypeSelect;
  campus_list: CampusOption[];
}

// 时间配置记录
export interface TimeConfigRecord {
  record_id: number;
  type_name: string;
  start_time: string;
  end_time: string;
  campus_name: string;
}

// 时间配置列表响应
export interface TimeConfigTableResponse {
  rows: TimeConfigRecord[];
  total: number;
}

// 添加时间配置参数
export interface AddTimeConfigParams {
  type: number;
  start_time: string; // 格式: "2025-06-30 12:10:10"
  end_time: string; // 格式: "2025-06-30 12:10:10"
  campus_id: number;
}

// 删除时间配置参数
export interface DeleteTimeConfigParams {
  record_id: number;
}

// 获取时间配置的下拉选项内容
export const getTimeConfigSelect = async (): Promise<ApiResponse<TimeConfigSelectResponse>> => {
  try {
    const { data } = await request<ApiEnvelope<TimeConfigSelectResponse>>('/api/rights/get_time_conf_select', {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取时间配置下拉选项失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取时间配置下拉选项失败' };
  }
};

// 添加时间配置
export const addTimeConfig = async (params: AddTimeConfigParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/add_time_conf', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加时间配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加时间配置失败' };
  }
};

// 删除时间配置
export const deleteTimeConfig = async (params: DeleteTimeConfigParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/rights/delete_time_conf', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除时间配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除时间配置失败' };
  }
};

// 获取时间配置的表单
export const getTimeConfigTable = async (): Promise<ApiResponse<TimeConfigTableResponse>> => {
  try {
    const { data } = await request<ApiEnvelope<TimeConfigTableResponse>>('/api/rights/get_time_conf_table', {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取时间配置表单失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取时间配置表单失败' };
  }
};

