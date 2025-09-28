import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

// 课程列表相关类型定义
export interface ClassSignupItem {
  id: number;
  topic_id: number;
  class_name: string;
  campus_id: number;
  exam_id: number;
  exam_name?: string;
  campus_name?: string;
  signed_up_id?: number;
}

export interface ClassSignupResponse {
  code: number;
  message: string;
  data: ClassSignupItem[];
}

export interface StudentSignupInfo {
  signed_up_list: ClassSignupItem[];
  not_signed_up_list: ClassSignupItem[];
  file_path: string;
}

export interface StudentSignupInfoResponse {
  code: number;
  message: string;
  data: StudentSignupInfo;
}

/**
 * 获取完整的课程报名信息
 * @returns 课程报名信息
 */
export const getStudentSignupInfo = async (): Promise<StudentSignupInfoResponse> => {
  try {
    const { data } = await request('/api/subjects/student_signup_info', {
      method: 'GET',
    });
    const response = normalizeApiResponse(data as any);
    return {
      code: response.code,
      message: response.message,
      data: (response.data as StudentSignupInfo) || {
        signed_up_list: [],
        not_signed_up_list: [],
        file_path: ''
      }
    };
  } catch (error) {
    console.error('获取课程报名信息失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取课程报名信息失败',
      data: {
        signed_up_list: [],
        not_signed_up_list: [],
        file_path: ''
      }
    };
  }
};

/**
 * 获取staff课程列表（仅未报名的课程）
 * @returns 课程列表数据
 */
export const getStaffClassList = async (): Promise<ClassSignupResponse> => {
  try {
    const response = await getStudentSignupInfo();
    return {
      code: response.code,
      message: response.message,
      data: response.data.not_signed_up_list
    };
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取课程列表失败',
      data: []
    };
  }
};

/**
 * 下载课程列表
 * @returns 下载链接
 */
export const downloadClassList = async (): Promise<{ url: string }> => {
  try {
    const response = await fetch('/api/subjects/staff/download', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('下载失败');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_list_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return { url };
  } catch (error) {
    console.error('下载课程列表失败:', error);
    throw error;
  }
};
