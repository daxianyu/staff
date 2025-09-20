import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ================= 教室课表相关接口 =================

// 教室课表课程信息接口
export interface ClassroomLessonInfo {
  subject_id: number;
  start_time: number;
  end_time: number;
  id: number;
  room_id: number;
  subject_info: {
    teacher_id: number;
    teacher_name: string;
    class_id: number;
    topic_id: number;
    topic_name: string;
  };
  student_ids: number[];
  student_names: string[];
  class_name: string;
  room_name: string;
}

// 教室课表响应接口
export interface ClassroomScheduleResponse {
  status: number;
  message: string;
  data: ClassroomLessonInfo[];
}

// 获取指定周的教室课表
export const getClassroomSchedule = async (roomId: string, weekNum: string): Promise<ClassroomScheduleResponse> => {
  try {
    console.log('获取教室课表请求URL:', `/api/room/schedule/${roomId}/${weekNum}/`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/room/schedule/${roomId}/${weekNum}/`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取教室课表响应状态:', response.status);
    console.log('获取教室课表响应结果:', data);
    
    return {
      status: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data || [],
    };
  } catch (error) {
    console.error('获取教室课表失败:', error);
    return {
      status: 500,
      message: error instanceof Error ? error.message : '获取教室课表失败',
      data: [],
    };
  }
};

export const deleteInnerSignup = async (
  params: { record_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/delete_inner_signup', {
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
    console.error('删除内部报名失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除内部报名失败',
    };
  }
};

export const deletePublicSignup = async (
  params: { record_id: number }
): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    const response = await fetch('/api/exam/delete_public_signup', {
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
    console.error('删除公共报名失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除公共报名失败',
    };
  }
};
