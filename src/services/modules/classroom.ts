import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ================= 教室管理相关接口 =================

// 教室信息接口定义
export interface Classroom {
  id: number;
  name: string;
  campus_id: number;
  campus_name: string;
  size: number;
  flag: number;
  owner: number;
  owner_name: string;
}

// 教室列表响应接口
export interface ClassroomListResponse {
  status: number;
  message: string;
  data: {
    room_list: Classroom[];
    campus_info: Array<{ id: number; name: string }>;
    staff_info: Record<string, string>;
  };
}

// 新增教室参数接口
export interface AddClassroomParams {
  room_name: string;
  campus_id: number;
  size: number;
  flag: number;
  owner: number;
}

// 更新教室参数接口
export interface UpdateClassroomParams {
  room_id: number;
  room_name: string;
  campus_id: number;
  size: number;
  flag: number;
  owner: number;
}

// 删除教室参数接口
export interface DeleteClassroomParams {
  record_id: number;
}

// 获取教室列表
export const getClassroomList = async (): Promise<ClassroomListResponse> => {
  try {
    console.log('获取教室列表请求URL:', '/api/room/list/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/room/list/', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取教室列表响应状态:', response.status);
    console.log('获取教室列表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || { room_list: [], campus_info: [], staff_info: {} },
    };
  } catch (error) {
    console.error('获取教室列表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取教室列表失败',
      data: { room_list: [], campus_info: [], staff_info: {} },
    };
  }
};

// 新增教室
export const addClassroom = async (params: AddClassroomParams): Promise<ApiResponse> => {
  try {
    console.log('新增教室请求参数:', params);
    console.log('新增教室请求URL:', '/api/room/add/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    // 注意：后端可能没有专门的add接口，这里先假设存在
    // 如果后端没有add接口，需要联系后端开发人员添加相应的API
    const response = await fetch('/api/room/add/', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('新增教室响应状态:', response.status);
    console.log('新增教室响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('新增教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '新增教室失败',
    };
  }
};

// 更新教室信息
export const updateClassroom = async (params: UpdateClassroomParams): Promise<ApiResponse> => {
  try {
    console.log('更新教室请求参数:', params);
    console.log('更新教室请求URL:', '/api/room/update/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/room/update/', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('更新教室响应状态:', response.status);
    console.log('更新教室响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('更新教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新教室失败',
    };
  }
};

// 删除教室
export const deleteClassroom = async (params: DeleteClassroomParams): Promise<ApiResponse> => {
  try {
    console.log('删除教室请求参数:', params);
    console.log('删除教室请求URL:', '/api/room/delete/');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/room/delete/', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('删除教室响应状态:', response.status);
    console.log('删除教室响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除教室失败',
    };
  }
};
