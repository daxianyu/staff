import { getAuthHeader, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

// 操作记录相关类型
export interface OperationRecord {
  operator_id: number;
  operator_name: string;
  operation_type: number;
  operation_type_desc: string;
  operation_before: string;
  operation_after: string;
  operation_desc: string;
  operator: string;
  op_time: string;
}

export interface OperationRecordListParams {
  start_date?: string;
  end_date?: string;
}

export interface OperationRecordListResponse extends ApiResponse {
  data?: {
    rows: OperationRecord[];
    total: number;
  };
}

// 导师变更记录相关类型
export interface MentorChangeRecord {
  student_id: number;
  student_name: string;
  last_mentor: number;
  last_mentor_name: string;
  now_mentor: number;
  now_mentor_name: string;
  create_time: string;
}

export interface MentorChangeRecordListResponse extends ApiResponse {
  data?: {
    rows: MentorChangeRecord[];
    total: number;
  };
}

// 调课记录相关类型
export interface ClassChangeRecord {
  id: number;
  apply_id: number;
  apply_name: string;
  operator_id: number;
  operator_name: string;
  student_name: string;
  desc: string;
  status_num: number;
  status: string;
  reject_reason: string;
  apply_time: string;
  update_time: string;
}

export interface ClassChangeRecordListParams {
  start_day?: string;
  end_day?: string;
}

export interface ClassChangeRecordListResponse extends ApiResponse {
  data?: {
    rows: ClassChangeRecord[];
    total: number;
  };
}

export interface UpdateClassChangeStatusParams {
  record_id: number;
  status: number;
  reject_reason?: string;
}

export interface AddClassChangeRecordParams {
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  change_desc: string;
}

// 外出申请相关类型
export interface ExitPermitRecord {
  record_id: number;
  student_id: number;
  student_name: string;
  staff_id: number;
  staff_name: string;
  note: string;
  status: number;
  status_name: string;
  distribute_status: number;
  start_time: string;
  end_time: string;
  create_time: string;
  update_time: string;
}

export interface ExitPermitListResponse extends ApiResponse {
  data?: {
    rows: ExitPermitRecord[];
    total: number;
  };
}

/**
 * 获取操作记录列表
 */
export const getOperationRecordList = async (params?: OperationRecordListParams): Promise<OperationRecordListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const url = `/api/core/operation_record_list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取操作记录列表响应状态:', response.status);
    console.log('获取操作记录列表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { rows: [], total: 0 },
    };
  } catch (error) {
    console.error('获取操作记录列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取操作记录列表失败' };
  }
};

/**
 * 获取导师变更记录列表
 */
export const getMentorChangeRecordList = async (): Promise<MentorChangeRecordListResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/core/mentor_change_record_list', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取导师变更记录列表响应状态:', response.status);
    console.log('获取导师变更记录列表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { rows: [], total: 0 },
    };
  } catch (error) {
    console.error('获取导师变更记录列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取导师变更记录列表失败' };
  }
};

/**
 * 获取调课记录列表
 */
export const getClassChangeRecordList = async (params?: ClassChangeRecordListParams): Promise<ClassChangeRecordListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.start_day) queryParams.append('start_day', params.start_day);
    if (params?.end_day) queryParams.append('end_day', params.end_day);
    
    const url = `/api/core/class_change_record_list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取调课记录列表响应状态:', response.status);
    console.log('获取调课记录列表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { rows: [], total: 0 },
    };
  } catch (error) {
    console.error('获取调课记录列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取调课记录列表失败' };
  }
};

/**
 * 更新调课记录状态
 */
export const updateClassChangeStatus = async (params: UpdateClassChangeStatusParams): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/core/update_status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新调课记录状态响应状态:', response.status);
    console.log('更新调课记录状态响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新调课记录状态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新调课记录状态失败' };
  }
};

/**
 * 添加调课记录
 */
export const addClassChangeRecord = async (params: AddClassChangeRecordParams): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/core/add_class_change_record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('添加调课记录响应状态:', response.status);
    console.log('添加调课记录响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加调课记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加调课记录失败' };
  }
};

/**
 * 获取外出申请列表
 */
export const getExitPermitList = async (): Promise<ExitPermitListResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/core/get_exit_table', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取外出申请列表响应状态:', response.status);
    console.log('获取外出申请列表响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { rows: [], total: 0 },
    };
  } catch (error) {
    console.error('获取外出申请列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取外出申请列表失败' };
  }
};

/**
 * 获取用户相关的操作记录（申请或操作人是当前用户）
 */
export const getOperatorList = async (): Promise<ClassChangeRecordListResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/core/operator_list', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取用户操作记录响应状态:', response.status);
    console.log('获取用户操作记录响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { rows: [], total: 0 },
    };
  } catch (error) {
    console.error('获取用户操作记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取用户操作记录失败' };
  }
};
