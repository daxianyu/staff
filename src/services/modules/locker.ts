/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';
import type { MoveStudentToServiceParams } from './service';
import type { FinanceStudentsParams } from './staff';

// ==================== Locker 管理相关接口 ====================

// Locker 信息接口
export interface Locker {
  locker_id: number;
  locker_name: string;
  location: string;
  campus_id: number;
  campus_name: string;
  student_id: number;
  student_name: string;
  status: number; // 0 未占用 1 已占用 2 申请中 3 已禁用
  status_name: string;
  update_time: string;
  create_time: string;
}

// Locker 列表响应接口
export interface LockerListResponse {
  status: number;
  message: string;
  data: Locker[];
}

// 新增 Locker 参数接口
export interface AddLockerParams {
  locker_name: string;
  location: string;
  campus_id: number;
}

// 编辑 Locker 参数接口
export interface UpdateLockerParams {
  record_id: number;
  locker_name: string;
  location: string;
  campus_id: number;
  status: number;
  student_id: number;
}

// 删除 Locker 参数接口
export interface DeleteLockerParams {
  record_id: number;
}

// 解绑 Locker 参数接口
export interface UnbindLockerParams {
  record_id: number;
}

// 获取 Locker 列表
export const getLockerList = async (): Promise<LockerListResponse> => {
  try {
    console.log('获取Locker列表请求URL:', '/api/locker/all-locker');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/all-locker', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取Locker列表响应状态:', response.status);
    console.log('获取Locker列表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { list: [] },
    };
  } catch (error) {
    console.error('获取Locker列表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取Locker列表失败',
      data: []
    };
  }
};

// 新增 Locker
export const addLocker = async (params: AddLockerParams): Promise<ApiResponse> => {
  try {
    console.log('新增Locker请求参数:', params);
    console.log('新增Locker请求URL:', '/api/locker/add_locker');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/add_locker', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('新增Locker响应状态:', response.status);
    console.log('新增Locker响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增Locker失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增Locker失败',
    };
  }
};

// 更新 Locker 信息
export const updateLocker = async (params: UpdateLockerParams): Promise<ApiResponse> => {
  try {
    console.log('更新Locker请求参数:', params);
    console.log('更新Locker请求URL:', '/api/locker/update_locker');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/update_locker', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新Locker响应状态:', response.status);
    console.log('更新Locker响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新Locker失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新Locker失败',
    };
  }
};

// 删除 Locker
export const deleteLocker = async (params: DeleteLockerParams): Promise<ApiResponse> => {
  try {
    console.log('删除Locker请求参数:', params);
    console.log('删除Locker请求URL:', '/api/locker/delete_locker');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/delete_locker', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('删除Locker响应状态:', response.status);
    console.log('删除Locker响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除Locker失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除Locker失败',
    };
  }
};

// 解绑 Locker
export const unbindLocker = async (params: UnbindLockerParams): Promise<ApiResponse> => {
  try {
    console.log('解绑Locker请求参数:', params);
    console.log('解绑Locker请求URL:', '/api/locker/unbind_locker');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/unbind_locker', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('解绑Locker响应状态:', response.status);
    console.log('解绑Locker响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('解绑Locker失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '解绑Locker失败',
    };
  }
};

// 获取 Locker 编辑信息
export const getLockerEditInfo = async (lockerId: number): Promise<ApiResponse> => {
  try {
    console.log('获取Locker编辑信息请求URL:', `/api/locker/edit_locker_info/${lockerId}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/locker/edit_locker_info/${lockerId}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取Locker编辑信息响应状态:', response.status);
    console.log('获取Locker编辑信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取Locker编辑信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Locker编辑信息失败',
    };
  }
};

// 退柜相关接口定义
export interface ReturnLockerRecord {
  id: number;
  student_id: number;
  student_name: string;
  locker_id: number;
  locker_name: string;
  campus_id: number;
  campus_name: string;
  alipay_account: string;
  alipay_name: string;
  status: number;
  status_name: string;
  create_time: string;
}

export interface ReturnLockerListResponse {
  list: ReturnLockerRecord[];
  return_locker_status: Record<number, string>;
}

export interface UpdateReturnLockerStatusParams {
  record_id: number;
  status: 1 | 2; // 1: 已处理, 2: 拒绝
}

// 获取退柜记录列表
export const getReturnLockerList = async (): Promise<ApiResponse<ReturnLockerListResponse>> => {
  try {
    console.log('获取退柜记录列表请求URL:', '/api/locker/staff_return_lockers');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/staff_return_lockers', {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    console.log('获取退柜记录列表响应状态:', response.status);
    console.log('获取退柜记录列表响应结果:', data);

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取退柜记录列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取退柜记录列表失败',
    };
  }
};

// 更新退柜记录状态
export const updateReturnLockerStatus = async (params: UpdateReturnLockerStatusParams): Promise<ApiResponse> => {
  try {
    console.log('更新退柜记录状态请求URL:', '/api/locker/update_return_locker_status');
    console.log('更新退柜记录状态请求参数:', params);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/locker/update_return_locker_status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log('更新退柜记录状态响应状态:', response.status);
    console.log('更新退柜记录状态响应结果:', data);

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新退柜记录状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新退柜记录状态失败',
    };
  }
};

// 移动学生到其他服务
export const moveStudentToService = async (params: MoveStudentToServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/move_student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('移动学生响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('移动学生失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '移动学生失败',
      data: null,
    };
  }
};

// 承诺书管理相关接口
export interface CommitmentStudent {
  id: number;
  name: string;
  done: number;
  student_id?: number;
}

export interface CommitmentFile {
  id: number;
  file_path: string;
  file_type: number;
  file_desc: string;
}

export interface CommitmentTypeDesc {
  [key: string]: string;
}

export interface CommitmentListResponse {
  list: CommitmentFile[];
  type_desc: CommitmentTypeDesc;
}

export interface UploadFileResponse {
  file_path: string;
}

export interface NewCommitmentParams {
  file_path: string;
  file_type: number;
  file_desc?: string;
}

// 获取承诺书统计信息
export const getCommitmentStudentCount = async (): Promise<ApiResponse<CommitmentStudent[]>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/commitment/student_count', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取承诺书统计信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取承诺书统计信息失败',
    };
  }
};

// 获取承诺书清单
export const getCommitmentList = async (): Promise<ApiResponse<CommitmentListResponse>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/commitment/list_file', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取承诺书清单失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取承诺书清单失败',
    };
  }
};

// 上传承诺书文件
export const uploadCommitmentFile = async (file: File): Promise<ApiResponse<UploadFileResponse>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: HeadersInit = {
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/commitment/upload_file', {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || null,
    };
  } catch (error) {
    console.error('上传承诺书文件失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '上传承诺书文件失败',
    };
  }
};

// 新增承诺书记录
export const addCommitmentRecord = async (params: NewCommitmentParams): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/commitment/add_record', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增承诺书记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增承诺书记录失败',
    };
  }
};

// 教材管理相关接口定义
export interface TextbookInventoryWithCount {
  campus_id: number;
  campus_name: string;
  inventory: number;
}

export interface Textbook {
  textbook_id: number;
  name: string;
  type: string;
  price: number;
  paid_count: number;
  inventory_info: TextbookInventoryWithCount[];
}

export interface TextbookFormData {
  name: string;
  type: string;
  price: number;
  inventory_info: { [campusId: number]: number };
}

export interface TextbookEditInfo {
  name: string;
  type: string;
  price: number;
  inventory_info: { [campusId: string]: number };
  campus_info: { [campusId: string]: string };
}

// 获取教师的教材列表
export const getStaffTextbookList = async (): Promise<ApiResponse<Textbook[]>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/textbook/get_staff_list', {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取教材列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取教材列表失败',
    };
  }
};

// 新增教材
export const addTextbook = async (params: TextbookFormData): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    // 转换库存信息为API期望的格式
    const formData: any = {
      name: params.name,
      type: params.type,
      price: params.price,
    };

    // 添加每个校区的库存信息
    Object.entries(params.inventory_info).forEach(([campusId, inventory]) => {
      formData[`inventory_${campusId}`] = inventory;
    });

    const response = await fetch('/api/textbook/add_textbook', {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增教材失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增教材失败',
    };
  }
};

// 删除教材
export const deleteTextbook = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/textbook/delete_textbook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ record_id: recordId }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除教材失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除教材失败',
    };
  }
};

// 获取编辑教材信息
export const getTextbookEditInfo = async (recordId: number): Promise<ApiResponse<TextbookEditInfo>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/textbook/get_textbook_edit_info/${recordId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取教材编辑信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取教材编辑信息失败',
    };
  }
};

// 更新教材信息
export const editTextbook = async (recordId: number, params: TextbookFormData): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    // 转换库存信息为API期望的格式
    const formData: any = {
      record_id: recordId,
      name: params.name,
      type: params.type,
      price: params.price,
    };

    // 添加每个校区的库存信息
    Object.entries(params.inventory_info).forEach(([campusId, inventory]) => {
      formData[`inventory_${campusId}`] = inventory;
    });

    const response = await fetch('/api/textbook/edit_textbook', {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新教材失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新教材失败',
    };
  }
};

// 获取教师购买教材列表
export const getBuyTextbookList = async (): Promise<ApiResponse<Textbook[]>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/textbook/buy_textbook_list', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取购买教材列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取购买教材列表失败',
    };
  }
};

// 获取财务学生数据
export const getFinanceStudents = async (params: FinanceStudentsParams = {}): Promise<ApiResponse> => {
  try {
    console.log('获取财务学生数据请求参数:', params);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const queryParams = new URLSearchParams();
    if (params.start_day) queryParams.append('start_day', params.start_day);
    if (params.end_day) queryParams.append('end_day', params.end_day);
    if (params.campus !== undefined) queryParams.append('campus', params.campus.toString());

    const url = `/api/accounting/get_finance_students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取财务学生数据响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取财务学生数据失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取财务学生数据失败',
    };
  }
};

// 获取禁用学生数据
export const getDisabledStudents = async (): Promise<ApiResponse> => {
  try {
    console.log('获取禁用学生数据请求');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/accounting/get_disable_students', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取禁用学生数据响应:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取禁用学生数据失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取禁用学生数据失败',
    };
  }
};

// 教师预订教材
export const bookTextbook = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/textbook/book_textbook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ record_id: recordId }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('预订教材失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '预订教材失败',
    };
  }
};
