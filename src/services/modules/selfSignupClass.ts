import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope, SelectOption } from '../types';

// 自助报名班级相关类型定义
export interface SelfSignupClass {
  id: number;
  topic_name: string;
  exam_name: string;
  class_name: string;
  disable_time: number;
  campus_id: number;
  campus_name: string;
  is_disable: number;
}

export interface SelfSignupClassStudent {
  id: number;
  campus_id: number;
  student_name: string;
  exam_name: string;
  topic_name: string;
  note: string;
  mentor_name: string;
  campus_name: string;
}

export interface SelfSignupClassEditInfo {
  record: {
    topic_id: number;
    exam_id: string;
    class_name: string;
    disable_time: number;
    campus_id: number;
    class_assignment_request: SelfSignupClassStudent[];
  };
  exams: Array<{
    id: number;
    name: string;
  }>;
  class_topics: Record<string, string>;
  campus_info: Array<{
    id: number;
    name: string;
  }>;
}

export interface ExamInfo {
  id: number;
  name: string;
}

export interface CampusInfo {
  id: number;
  name: string;
}

export interface SelfSignupClassListResponse {
  list: {
    rows: SelfSignupClass[];
    total: number;
  };
  exams: Record<string, string>;
  campus_info: Record<string, string>;
}

export interface SelfSignupClassSelectResponse {
  topics: SelectOption[];
  exams: SelectOption[];
  campus_info: SelectOption[];
}

export interface AddSelfSignupClassRequest {
  exam_id: number;
  topic_id: number;
  class_name: string;
  disable_time: number;
  campus_id: number;
}

export interface EditSelfSignupClassRequest {
  record_id: number;
  exam_id: number;
  topic_id: number;
  class_name: string;
  disable_time: number;
  campus_id: number;
}

export interface DeleteStudentRequest {
  record_id: number;
  student_id: number;
}

// 获取自助报名班级列表
export const getSelfSignupClassList = async (): Promise<ApiResponse<SelfSignupClassListResponse>> => {
  try {
    const { data } = await request('/api/class/self_signup_class/list', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<SelfSignupClassListResponse>);
  } catch (error) {
    console.error('获取自助报名班级列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取自助报名班级列表失败' };
  }
};

// 获取添加自助报名班级的选项
export const getSelfSignupClassSelect = async (): Promise<ApiResponse<SelfSignupClassSelectResponse>> => {
  try {
    const { data } = await request('/api/class/get_signup_class_select', {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<SelfSignupClassSelectResponse>);
  } catch (error) {
    console.error('获取选项失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取选项失败' };
  }
};

// 新增自助报名班级
export const addSelfSignupClass = async (params: AddSelfSignupClassRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/class/self_signup_class/add', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('新增自助报名班级失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增自助报名班级失败' };
  }
};

// 删除自助报名班级
export const deleteSelfSignupClass = async (recordId: number): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/class/self_signup_class/delete', {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除自助报名班级失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除自助报名班级失败' };
  }
};

// 批量上传自助报名班级
export const uploadSelfSignupClass = async (file: File): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await request('/api/class/self_signup_class/upload', {
      method: 'POST',
      body: formData,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('批量上传失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '批量上传失败' };
  }
};

// 下载基础数据模板
export const downloadSelfSignupClassTemplate = async (): Promise<void> => {
  try {
    const { data } = await request('/api/class/self_signup_class/download', {
      method: 'GET',
    });
    
    const response = data as ApiEnvelope<string>;
    
    if (response.status === 0 && response.data) {
      // API返回文件路径，拼接成完整可访问链接后触发下载
      const baseUrl = window.location.origin || process.env.NEXT_PUBLIC_API_BASE_URL;
      const fileUrl = response.data.startsWith('http')
        ? response.data
        : new URL(response.data, baseUrl).toString();
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = 'self_signup_class_template.xlsx';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      throw new Error(response.message || '下载失败');
    }
  } catch (error) {
    console.error('下载模板失败:', error);
    throw error;
  }
};

// 获取编辑信息
export const getSelfSignupClassEditInfo = async (recordId: number): Promise<ApiResponse<SelfSignupClassEditInfo>> => {
  try {
    const { data } = await request(`/api/class/self_signup_class/get_edit_info/${recordId}`, {
      method: 'GET',
    });
    return normalizeApiResponse(data as ApiEnvelope<SelfSignupClassEditInfo>);
  } catch (error) {
    console.error('获取编辑信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取编辑信息失败' };
  }
};

// 删除并新增班级
export const addNewSelfSignupClass = async (params: AddSelfSignupClassRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/class/self_signup_class/add_new', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除并新增班级失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除并新增班级失败' };
  }
};

// 编辑班级
export const editSelfSignupClass = async (params: EditSelfSignupClassRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/class/self_signup_class/edit', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('编辑班级失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑班级失败' };
  }
};

// 删除班级下的学生
export const deleteSelfSignupClassStudent = async (params: DeleteStudentRequest): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/class/self_signup_class/delete_student', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除学生失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除学生失败' };
  }
};

// 删除所有自助报名班级
export const deleteAllSelfSignupClasses = async (): Promise<ApiResponse> => {
  try {
    const { data } = await request('/api/class/self_signup_class/delete_all', {
      method: 'POST',
    });
    return normalizeApiResponse(data as ApiEnvelope);
  } catch (error) {
    console.error('删除所有自助报名班级失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除所有自助报名班级失败' };
  }
};
