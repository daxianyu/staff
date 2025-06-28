interface LoginParams {
  username: string;
  password: string;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T; // 数据类型
  token?: string;
}

interface ChangePasswordParams {
  old_password: string;
  new_password: string;
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
    special_day: any[]; // TODO: 根据实际类型定义
    lessons: Lesson[];
  }
}

// 销售信息接口定义
interface SalesInfoResponse {
  info_sign: number;
  [key: string]: any;  // 其他可能的字段
}

// 获取存储的token
const getAuthHeader = (): HeadersInit => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': token } : {};
  }
  return {};
};

export const login = async (params: LoginParams): Promise<ApiResponse> => {
  try {
    console.log('登录请求参数:', params);
    console.log('登录请求URL:', '/api/login');
    
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    console.log('登录响应状态:', response.status);
    console.log('登录响应结果:', data);
    
    // 返回完整的响应数据，让调用方决定如何处理
    return {
      code: data.status === 0 ? 200 : response.status,
      message: data.message || '',
      data: data.data,
      token: data.token,
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
    console.log('退出请求URL:', '/api/logout');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/logout', {
      method: 'POST',
      headers,
    });
    
    const data = await response.json();
    console.log('退出响应状态:', response.status);
    console.log('退出响应结果:', data);

    // 清除本地存储的token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
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
    console.log('获取用户信息请求URL:', '/api/public/user_info');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/public/user_info', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取用户信息响应状态:', response.status);
    console.log('获取用户信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400, // 非0状态返回400错误码
      message: data.message || '',
      data: data.data,
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
    console.log('获取学生sales信息请求URL:', '/api/sales/get_student_sales_info');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/sales/get_student_sales_info', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('获取学生sales信息响应状态:', response.status);
    console.log('获取学生sales信息响应结果:', data);
    
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data,
    };
  } catch (error) {
    console.error('获取学生sales信息异常:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取学生sales信息失败',
    };
  }
};


// 用户登录后重定向路由处理函数
export const handleUserRedirect = async (userData: any, router: any, useWindowLocation = false) => {
  if (!userData) return;

  try {
    // pre_student用户(type=4)特殊处理
    if (userData.type === 4) {
      // 获取销售信息检查info_sign状态
      const salesInfoResp = await getStudentSalesInfo();
      
      if (salesInfoResp.code === 200) {
        const salesInfo = salesInfoResp.data as SalesInfoResponse;
        const targetPath = salesInfo.info_sign === 0 ? '/my-profile' : '/my-test';
        
        // 根据传入参数决定使用router还是window.location
        if (useWindowLocation) {
          window.location.href = targetPath;
        } else {
          router.push(targetPath);
        }
      } else {
        // 获取销售信息失败，默认导向my-profile
        if (useWindowLocation) {
          window.location.href = '/student/my-profile';
        } else {
          router.push('/my-profile');
        }
      }
    } else {
      // 其他用户类型导向notification
      if (useWindowLocation) {
        window.location.href = '/notification';
      } else {
        router.push('/notification');
      }
    }
  } catch (error) {
    console.error('处理用户重定向异常:', error);
    // 出错时默认导向通知页面
    if (useWindowLocation) {
      window.location.href = '/notification';
    } else {
      router.push('/notification');
    }
  }
};