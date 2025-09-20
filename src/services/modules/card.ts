import { getAuthHeader } from '../apiClient';
import type { ApiResponse } from '../types';

// ================== 卡片管理相关接口 ==================

// 获取绑卡选项接口
export interface CardSelectOptions {
  staff_list: Array<{ id: number; name: string }>;
  student_list: Array<{ id: number; name: string }>;
  hik_person_list: Array<{ id: number; name: string }>;
}

// 绑卡记录接口
export interface CardBindRecord {
  record_id: number;
  student_id: number;
  staff_id: number;
  staff_name: string;
  student_name: string;
  person_id: number;
  hik_user: string;
  operator_id: number;
  operator_name: string;
  in_use: number;
  in_use_str: string;
  create_time: string;
  update_time: string;
}

// 卡片详情接口
export interface CardDetail {
  cardId: string;
  cardNo: string;
  personName: string;
  useStatus: string;
  startDate: string;
  endDate: string;
  lossDate: string;
  unlossDate: string;
}

// 绑卡参数接口
export interface BindCardParams {
  student_id: number;
  staff_id: number;
  personId: number;
}

// 解绑卡参数接口
export interface UnbindCardParams {
  record_id: number;
}

// 获取绑卡选项
export const getCardSelectOptions = async (): Promise<ApiResponse<CardSelectOptions>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/card/get_card_select', {
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
    console.error('获取绑卡选项失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取绑卡选项失败',
    };
  }
};

// 获取绑卡列表
export const getCardBindTable = async (): Promise<ApiResponse<{ rows: CardBindRecord[]; total: number }>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/card/get_bind_table', {
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
    console.error('获取绑卡列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取绑卡列表失败',
    };
  }
};

// 绑定卡
export const bindCard = async (params: BindCardParams): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/card/bind-card', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '绑定成功',
      data: data.data,
    };
  } catch (error) {
    console.error('绑定卡片失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '绑定卡片失败',
    };
  }
};

// 解绑卡
export const unbindCard = async (params: UnbindCardParams): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch('/api/card/unbind-card', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '解绑成功',
      data: data.data,
    };
  } catch (error) {
    console.error('解绑卡片失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '解绑卡片失败',
    };
  }
};

// 获取指定人员的卡列表
export const getPersonCardList = async (personId: number): Promise<ApiResponse<{ rows: CardDetail[]; total: number }>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    
    const response = await fetch(`/api/card/get_person_card_list/${personId}`, {
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
    console.error('获取人员卡列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取人员卡列表失败',
    };
  }
};

// 检查消费数据
export const checkCardConsume = async (file: File): Promise<ApiResponse> => {
  try {
    const headers: HeadersInit = {
      ...getAuthHeader(),
    };
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/card/check_consume', {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await response.json();
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('检查消费数据失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '检查消费数据失败',
    };
  }
};
