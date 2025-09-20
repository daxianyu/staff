import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ==================== STAS 统计相关 API ====================

// 获取考试中心列表
export const getCenterList = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/stas/get_center_list', {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data?.rows || [],
    };
  } catch (error) {
    console.error('获取考试中心列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试中心列表失败',
    };
  }
};

// 获取Mentee列表（可排序）
export const getMenteeList = async (mtype: number = 0): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_mentee_list/${mtype}`, {
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
    console.error('获取Mentee列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Mentee列表失败',
    };
  }
};

// 获取Mentor列表
export const getMentorList = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/stas/get_mentor_list', {
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
    console.error('获取Mentor列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Mentor列表失败',
    };
  }
};

// 获取所有老师的授课总小时数
export const getTeachingHoursOverviewTotal = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/stas/get_teaching_hours_overview_total', {
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
    console.error('获取老师授课总小时数失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取老师授课总小时数失败',
    };
  }
};

// 获取学科相关信息
export const getSubjectRelative = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/stas/get_subject_relative', {
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
    console.error('获取学科相关信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学科相关信息失败',
    };
  }
};

// 获取学科相关月度信息
export const getSubjectRelativeMonthly = async (overviewMonth: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_subject_relative_monthly/${overviewMonth}`, {
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
    console.error('获取学科相关月度信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学科相关月度信息失败',
    };
  }
};

// 获取学生学习课时信息
export const getStudentFullness = async (overviewMonth: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_student_fullness/${overviewMonth}`, {
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
    console.error('获取学生学习课时信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生学习课时信息失败',
    };
  }
};

// 获取教室使用时长
export const getClassroomUsage = async (overviewMonth: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_classroom_usage/${overviewMonth}`, {
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
    console.error('获取教室使用时长失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取教室使用时长失败',
    };
  }
};

// 获取老师月度教学时间
export const getTeachingHoursOverview = async (overviewMonth: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_teaching_hours_overview/${overviewMonth}`, {
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
    console.error('获取老师月度教学时间失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取老师月度教学时间失败',
    };
  }
};

// 获取学生月度学习时间
export const getStudentsHoursOverview = async (overviewMonth: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_students_hours_overview/${overviewMonth}`, {
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
    console.error('获取学生月度学习时间失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生月度学习时间失败',
    };
  }
};

// 获取学生考勤情况
export const getStudentAttendance = async (overviewMonth: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_student_attendance/${overviewMonth}`, {
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
    console.error('获取学生考勤情况失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生考勤情况失败',
    };
  }
};

// 获取指定学生指定月份的请假信息
export const getStudentAttendanceDetail = async (studentId: number, queryData: string): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/stas/get_student_attendance_detail/${studentId}/${queryData}`, {
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
    console.error('获取学生请假详情失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生请假详情失败',
    };
  }
};
