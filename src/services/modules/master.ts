import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ==================== Master Admin API Functions ====================

// 投诉管理相关API

// 获取投诉列表
export const getComplaintsList = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/complains/list', {
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
    console.error('获取投诉列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取投诉列表失败',
    };
  }
};

// 回复投诉
export const replyComplaint = async (recordId: number, replyInfo: string): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const params = new URLSearchParams({
      record_id: recordId.toString(),
      replay_info: replyInfo,
    });

    const response = await fetch(`/api/complains/send_complaint_mail?${params}`, {
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
    console.error('回复投诉失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '回复投诉失败',
    };
  }
};

// 选课时间管理相关API

// 获取选课时间列表
export const getSignupTimeList = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/signup/list', {
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
    console.error('获取选课时间列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取选课时间列表失败',
    };
  }
};

// 添加选课时间
export const addSignupTime = async (campusId: number, startDay: string, endDay: string): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/signup/add', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        campus_id: campusId,
        start_day: startDay,
        end_day: endDay,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加选课时间失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加选课时间失败',
    };
  }
};

// 删除选课时间
export const deleteSignupTime = async (recordId: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/signup/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        record_id: recordId,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除选课时间失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除选课时间失败',
    };
  }
};

// 校区管理相关API

// 获取所有校区
export const getAllCampuses = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/campus/get_all_campus', {
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
    console.error('获取校区列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取校区列表失败',
    };
  }
};

// 获取校区详情
export const getCampusDetail = async (campusId: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch(`/api/campus/get_detail/${campusId}`, {
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
    console.error('获取校区详情失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取校区详情失败',
    };
  }
};

// 添加校区
export const addCampus = async (name: string, code: string): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/campus/add', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        code,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加校区失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加校区失败',
    };
  }
};

// 编辑校区
export const editCampus = async (recordId: number, name: string, code: string): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/campus/edit', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        record_id: recordId,
        name,
        code,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑校区失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑校区失败',
    };
  }
};

// 删除校区
export const deleteCampus = async (recordId: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/campus/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        record_id: recordId,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除校区失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除校区失败',
    };
  }
};

// 主题管理相关API

// 获取主题列表
export const getTopicsList = async (): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/topic/list', {
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
    console.error('获取主题列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取主题列表失败',
    };
  }
};

// 添加主题
export const addTopic = async (name: string, cnName: string, isEnglish: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/topic/add', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        cn_name: cnName,
        is_english: isEnglish,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加主题失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加主题失败',
    };
  }
};

// 编辑主题
export const editTopic = async (recordId: number, name: string, cnName: string, isEnglish: number): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/topic/edit', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        record_id: recordId,
        name,
        cn_name: cnName,
        is_english: isEnglish,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑主题失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑主题失败',
    };
  }
};

// 删除主题
export const deleteTopics = async (ids: string): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/topic/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ids,
      }),
    });

    const data = await response.json();

    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除主题失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除主题失败',
    };
  }
};
