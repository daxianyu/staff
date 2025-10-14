import { clearStoredAuth, getAuthHeader, isBrowser, request } from '../apiClient';
import type { ApiEnvelope, ApiResponse } from '../types';

type RouterLike = { push: (path: string) => unknown } | null;

let globalRouter: RouterLike = null;

export const setGlobalRouter = (router: RouterLike) => {
  globalRouter = router;
};

const handleUnauthorized = () => {
  clearStoredAuth();
  if (!isBrowser) return;
  if (globalRouter) {
    globalRouter.push('/login');
  } else {
    window.location.href = '/login';
  }
};

if (isBrowser) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);

    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/') && !url.includes('/api/public/user_info')) {
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        if (data?.status === 400001 || data?.message === 'Unauthorized') {
          handleUnauthorized();
        }
      } catch (error) {
        console.warn('无法解析API响应:', error);
      }
    }

    return response;
  };
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface Exam {
  student_names: string[];
  exam_name: string;
  day_str: string;
  week_str: string;
  day: number;
}

export interface Lesson {
  lesson_id: string;
  start_time: string;
  end_time: string;
  teacher: string;
  subject_name: string;
  room_name: string;
  topic_name: string;
  students: string[];
  class_id: string;
  class_name: string;
}

export interface ScheduleResponse {
  status: number;
  message: string;
  data: {
    student_exam: Record<string, Exam[]>;
    special_day: unknown[];
    lessons: Lesson[];
  };
}

interface SalesInfoResponse {
  info_sign: number;
  [key: string]: unknown;
}

export const login = async (params: LoginParams): Promise<ApiResponse> => {
  try {
    const { response, data } = await request<ApiEnvelope<{ token?: string }>>('/api/login', {
      method: 'POST',
      body: params,
      auth: false,
    });

    const payload = data || { status: response.status, message: '', data: undefined, token: undefined };
    return {
      code: payload.status === 0 ? 200 : response.status,
      message: payload.message || '',
      data: payload.data,
      token: payload.token,
    };
  } catch (error) {
    console.error('登录异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '登录失败',
    };
  }
};

export const logout = async (): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/logout', {
      method: 'POST',
    });

    clearStoredAuth();

    return {
      code: data?.status === 0 ? 200 : 400,
      message: data?.message || '',
      data: data?.data,
    };
  } catch (error) {
    console.error('退出异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '退出失败',
    };
  }
};

export const getUserInfo = async (): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/public/user_info', {
      headers: getAuthHeader(),
    });
    return {
      code: data?.status === 0 ? 200 : 400,
      message: data?.message || '',
      data: data?.data,
    };
  } catch (error) {
    console.error('获取用户信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取用户信息失败',
    };
  }
};

export const getStudentSalesInfo = async (): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>('/api/sales/get_student_sales_info');

    return {
      code: data?.status === 0 ? 200 : 400,
      message: data?.message || '',
      data: data?.data,
    };
  } catch (error) {
    console.error('获取学生sales信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生sales信息失败',
    };
  }
};

// 用户类型常量
const USER_STAFF = 0;
const USER_STUDENT = 1;
const USER_PARENT = 2;
const USER_STUDENT_CANDIDATE = 4;

type BasicUser = { type?: number } | null | undefined;

export const handleUserRedirect = async (userData: BasicUser, router: RouterLike, useWindowLocation = false) => {
  if (!userData) return;

  try {
    // 根据用户类型进行不同的跳转处理
    switch (userData.type) {
      case USER_STUDENT: // 学生 - 跳转到学生系统
      case USER_STUDENT_CANDIDATE: // 预备学生 - 跳转到学生系统
        // 直接跳转到学生系统网站
        window.location.href = 'https://www.huayaopudong.com/student/notification';
        break;
        
      case USER_PARENT: // 家长 - 暂时保持现状，跳转到dashboard
        if (useWindowLocation) {
          window.location.href = '/staff/dashboard';
        } else {
          router?.push('/dashboard');
        }
        break;
        
      case USER_STAFF: // 员工 - 保持现状，跳转到dashboard
      default: // 其他未知类型默认也跳转到dashboard
        if (useWindowLocation) {
          window.location.href = '/staff/dashboard';
        } else {
          router?.push('/dashboard');
        }
        break;
    }
  } catch (error) {
    console.error('处理用户重定向异常:', error);
    // 出错时默认跳转到dashboard
    if (useWindowLocation) {
      window.location.href = '/staff/dashboard';
    } else {
      router?.push('/dashboard');
    }
  }
};
