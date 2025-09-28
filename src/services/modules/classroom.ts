import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

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
