import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ==================== Service 宿舍管理相关接口 ====================

// Service 宿舍信息接口
export interface ServiceItem {
  id: number;
  name: string;
  gender: number;
  size: number;
  booked: number;
  campus: number;
  mentor_id?: number;
  locked: number;
  grade?: string;
  graduate_year: number;
  mentor_name?: string;
  is_dormitory: number;
  campus_name?: string;
  toilets?: number;
  price?: number;
  start_time?: number;
  end_time?: number;
  dormitory_type?: number;
}

// Service 列表响应接口
export interface ServiceListResponse {
  code: number;
  message: string;
  data: {
    all_list: ServiceItem[];
    dormitory_student: Record<number, string[]>;
    campus_dict: Array<{ id: number; name: string }>;
    staff_dict: Array<{ id: number; name: string }>;
  };
}

// 添加 Service 参数接口
export interface AddServiceParams {
  name: string;
  gender: number;
  size: number;
  price: number;
  campus: number;
  mentor_id?: number;
  is_dormitory: number;
  start_time?: number;
  end_time?: number;
}

// 编辑 Service 参数接口
export interface EditServiceParams {
  record_id: number;
  name: string;
  gender: number;
  toilets: number;
  size: number;
  price: number;
  start_time: number;
  end_time: number;
  booked: number;
  campus: number;
  mentor_id?: number;
  locked: number;
  graduate_year: number;
}

// 删除 Service 参数接口
export interface DeleteServiceParams {
  record_id: number;
}

export interface BookedInfo {
  end_time: number;
  first_name: string;
  last_name: string;
  paid: number;
  start_time: number;
  student_id: number;
  student_name: string;
}

// Service 编辑信息响应接口
export interface ServiceEditInfoResponse {
  code: number;
  message: string;
  data: {
    service_info: ServiceItem;
    booked_info: BookedInfo[];
    campus_list: Array<{ id: number; name: string }>;
    staff_list: Array<{ id: number; name: string }>;
    student_list: Array<{ id: number; name: string }>;
    all_dormitory: Array<{ id: number; name: string }>;
  };
}

// 获取 Service 列表
export const getServiceList = async (): Promise<ServiceListResponse> => {
  try {
    const response = await fetch('/api/service/get_all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('获取Service列表响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取Service列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Service列表失败',
      data: { all_list: [], dormitory_student: {}, campus_dict: [], staff_dict: [] },
    };
  }
};

// 添加 Service
export const addService = async (params: AddServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/add_service', {
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
    console.log('添加Service响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加Service失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加Service失败',
    };
  }
};

// 编辑 Service
export const editService = async (params: EditServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/edit_service', {
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
    console.log('编辑Service响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('编辑Service失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '编辑Service失败',
    };
  }
};

// 删除 Service
export const deleteService = async (params: DeleteServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/delete_service', {
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
    console.log('删除Service响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('删除Service失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除Service失败',
    };
  }
};

// 获取 Service 编辑信息
export const getServiceEditInfo = async (serviceId: string): Promise<ServiceEditInfoResponse> => {
  try {
    const response = await fetch(`/api/service/get_edit_info/${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('获取Service编辑信息响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取Service编辑信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Service编辑信息失败',
      data: {
        service_info: {} as ServiceItem,
        booked_info: [],
        campus_list: [],
        staff_list: [],
        student_list: [],
        all_dormitory: [],
      },
    };
  }
};

// 添加学生到服务参数接口
export interface AddStudentToServiceParams {
  student_id: number;
  record_id: number;
}

// 移动学生参数接口
export interface MoveStudentToServiceParams {
  student_id: number;
  dormitory_id: number;
  new_dormitory: number;
}

// 添加学生到服务
export const addStudentToService = async (params: AddStudentToServiceParams): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/service/add_student', {
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
    console.log('添加学生到服务响应:', data);

    return {
      code: data.code || 0,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('添加学生到服务失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加学生到服务失败',
      data: null,
    };
  }
};
