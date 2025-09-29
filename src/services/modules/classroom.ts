import { request, normalizeApiResponse, getAuthHeader } from '../apiClient';
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
    const { data } = await request('/api/room/list/', {
      method: 'GET',
    });
    const apiData = data as any;
    return {
      status: apiData.status === 0 ? 200 : 400,
      message: apiData.message || '',
      data: apiData.data || { room_list: [], campus_info: [], staff_info: {} },
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
    const { data } = await request('/api/room/add/', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
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
    const { data } = await request('/api/room/update/', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
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
    const { data } = await request('/api/room/delete/', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('删除教室失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除教室失败',
    };
  }
};

// ================= 教室日程概览相关接口 =================

// 教室日程概览相关类型定义
export interface ClassroomLesson {
  start_time: number;
  end_time: number;
  id: number;
  teacher_name: string;
  class_id: number;
  topic_id: number;
  room_id: number;
}

export type ClassroomUserInfo = { name?: string } | string;

export interface ClassroomOverviewData {
  class_student: Record<number, string[]>;
  lessons: ClassroomLesson[];
  change_classroom_right: boolean;
  campus_info: Record<string, string>;
  room_campuses: Record<string, Array<[string, number]>>;
  user_info?: Record<string, ClassroomUserInfo>;
}

export interface ClassroomOverviewResponse {
  code: number;
  message: string;
  data: ClassroomOverviewData;
}

/**
 * 获取教室日程概览
 * @param dayNum 日期数字
 * @returns 教室日程概览数据
 */
export const getClassroomOverview = async (dayNum: number): Promise<ClassroomOverviewResponse> => {
  try {
    const { data } = await request(`/api/room/day_overview/${dayNum}/`, {
      method: 'GET',
    });
    const response = normalizeApiResponse(data as any);
    return {
      code: response.code,
      message: response.message,
      data: (response.data as ClassroomOverviewData) || {
        class_student: {},
        lessons: [],
        change_classroom_right: false,
        campus_info: {},
        room_campuses: {},
        user_info: {}
      }
    };
  } catch (error) {
    console.error('获取教室日程概览失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取教室日程概览失败',
      data: {
        class_student: {},
        lessons: [],
        change_classroom_right: false,
        campus_info: {},
        room_campuses: {},
        user_info: {}
      }
    };
  }
};
