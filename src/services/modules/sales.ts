/* eslint-disable @typescript-eslint/no-explicit-any */
import { request, normalizeApiResponse, buildQueryString, getAuthHeader } from '../apiClient';
import type { ApiResponse, ApiEnvelope, SelectOption } from '../types';

// ============= Sales 相关类型定义 =============

export interface SalesRecord {
  sales_id: number;           // 合同ID
  student_name: string;        // 学生姓名
  sales_status: number;         // 销售状态
  status_name: string;         // 状态名称
  sales_name: string;          // 招生老师姓名
  registration_time: number;   // 注册时间（时间戳）
  downloaded: number;          // 是否已下载
  channel: number;             // 渠道
  channel_name: string;        // 渠道名称
  assigned_staff: number;       // 分配的员工ID
  phone: string;                // 电话
  campus_id: number;           // 校区ID
  create_time: string;          // 创建时间
  update_time: string;          // 更新时间
  email: string;                // 邮箱
  signing_request_state: number; // 签约请求状态1
  signing_request_state_2: number; // 签约请求状态2
  service_file: string;         // 服务文件
  consult_file: string;         // 咨询文件
  has_right: boolean;           // 是否有权限
  service_tail: string;         // 服务文件链接
  consult_tail: string;         // 咨询文件链接
  [key: string]: any;
}

export interface SalesListData {
  rows: SalesRecord[];
  total: number;
}

export interface SalesInfo {
  info: {
    added_to_lms: number;
    student_name: string;
    student_first_name_pinyin: string;
    student_last_name_pinyin: string;
    student_sfz: string;
    guardian_name: string;
    address: string;
    phone: string;
    gender: number;
    source: string;
    relationship: string;
    wechat: string;
    current_school: string;
    grade: string;
    sales_status: number;
    follow_up_1: string;
    follow_up_2: string;
    follow_up_3: string;
    assigned_staff: number;
    fee: number;
    registration_time: number;
    email: string;
    birthday: number;
    course: number;
    channel: number;
    campus_id: number;
    enrolment_date: number;
    sales_pay_date: number;
    graduation_date: number;
    year_fee: number;
    year_fee_reminder_time_1: number;
    year_fee_reminder_time_2: number;
    year_fee_reminder_time_3: number;
    guardian_sfz: string;
    signing_request_state: number;
    id_card_front: string;
    id_card_back: string;
    recent_front: string;
    exam_start_time: string;
    commitment_letter_v1_status: number;
    commitment_letter_v2_status: number;
    commitment_letter_v3_status: number;
    password: string;
    hobbies: string;
    awards: string;
    evaluation: string;
    study_year: string;
    math_type: string;
    current_lesson: string;
    signing_request_state_2: number;
    province: string;
    city: string;
    apply_courses: number;
    [key: string]: any;
  };
  student_repeat_info: string;
  apply_course: Record<number, string>;
  sales_status: Record<number, string>;
  apply_data: any[];
  can_add_students: number;
  staff_info: Record<number, string>;
  channel_list?: Array<{ key: number; name: string }>;
  [key: string]: any;
  /**
   * mail_result 字段结构:
   * {
   *   0: Array<[1 | 0, number]>;   // 录取通知: 0=失败, 1=成功; number为发送时间戳
   *   1: Array<[1 | 0, number]>;   // 拒信通知: 0=失败, 1=成功; number为发送时间戳
   * }
   * 其中 [0, send_time] 表示发送失败及该时间, [1, send_time] 表示发送成功及该时间.
   */
  mail_result: {
    0: Array<[1 | 0, number]>; // Admission notice
    1: Array<[1 | 0, number]>; // Rejection notice
    [type: number]: Array<[1 | 0, number]>; // 可扩展
  };
  /**
   * sales_standard_score_data 字段结构:
   * Array<{
   *   exam_day: string;    // 考试日期，格式: "YYYY-MM-DD"
   *   link_url: string;    // 图片链接
   * }>
   */
  sales_standard_score_data?: Array<{
    exam_day: string;
    link_url: string;
  }>;
}

export interface InterviewConfig {
  record_id: number;           // 记录ID
  ref_day: string;             // 参考日期
  interviewer_num: number;      // 面试官数量
  interview_desc: string;       // 面试描述
  create_time: string;          // 创建时间
  interview_day: string;        // 面试日期
  [key: string]: any;
}

export interface InterviewTimeConfig {
  id: number;
  time_slot: string;
  record_id: number;
  [key: string]: any;
}

export interface InterviewRoomConfig {
  record_id: number;             // 记录ID
  room_id: number;               // 房间ID
  room_info: string;             // 房间信息
  create_time: string;            // 创建时间
  update_time: string;            // 更新时间
  [key: string]: any;
}

export interface ExamConfig {
  record_id: number;           // 记录ID
  exam_desc: string;            // 考试描述
  start_day: string;            // 开始日期
  end_day: string;              // 结束日期
  exam_time: string;            // 考试时间（格式: "YYYY-MM-DD HH:MM:SS"）
  create_time: string;          // 创建时间
  price: number;                // 价格
  exam_type: string;            // 考试类型名称
  [key: string]: any;
}

export interface ExamSession {
  record_id: number;             // 记录ID
  exam_id: number;               // 考试ID
  exam_desc: string;             // 考试描述
  campus_id: number;             // 校区ID
  campus_name: string;           // 校区名称
  study_year: string;            // 年制（换行分隔）
  paper_type: string;           // 试卷类型（换行分隔）
  pay_start_day?: string;        // 缴费开始日期
  pay_end_day?: string;          // 缴费结束日期
  exam_time?: string;            // 考试时间
  online_type?: string;          // 在线类型
  price?: number;                // 价格
  [key: string]: any;
}

export interface ExamBaseConfig {
  record_id: number;             // 记录ID
  name: string;                  // 名称
  type: string;                   // 类型名称
  create_time: string;            // 创建时间
  [key: string]: any;
}

export interface PaymentInfo {
  record_id: number;           // 记录ID
  sales_id: number;            // 销售ID
  status: number;              // 支付状态
  status_name: string;          // 状态名称
  price: number;               // 价格
  exam_day: string;            // 考试日期时间（格式: "YYYY-MM-DD HH:MM:SS"）
  sales_name: string;          // 学生姓名
  create_time: string;          // 创建时间
  update_time: string;          // 更新时间
  campus_name: string;          // 校区名称
  study_year: string;          // 年制
  paper_type: string;          // 试卷类型
  math_type: string;           // 数学类型
  send_status: number;          // 发送状态
  sales_interview: number;      // 面试状态
  standard_score: string;       // 标准成绩
  index: number;               // 索引
  delete_flag: boolean;         // 删除标志
  [key: string]: any;
}

export interface PaymentDetail {
  detail: {
    exam_id: number;
    order_num: string;
    sales_id: number;
    price: number;
    exam_day: string; // 格式: "YYYY-MM-DD HH:mm:ss"
    online: string; // "线上考试" 或 "线下考试"
    status: string; // 状态名称
    book_time: string; // 格式: "YYYY-MM-DD HH:mm:ss"
    update_time: string; // 格式: "YYYY-MM-DD HH:mm:ss"
    exam_desc: string;
  };
  exam_info: Array<{
    test_name: string;
    finished: string; // "已完成" 或 "未开始"
    score: number; // 分数（0-100）
    points: number;
    sales_id: number;
    assigned_id: number;
    test_id: number;
  }>;
  exam_setting?: Array<{
    id: number;
    exam_desc: string;
  }>;
  study_year_list?: string[];
  paper_type_list?: string[];
  math_type_list?: string[];
  apply_info?: {
    exam_id: number;
    campus_id: number;
    study_year: string;
    paper_type: string;
    math_type: string;
  } | null;
  campus_list?: Array<{
    id: number;
    name: string;
  }>;
}

// ============= Sales 相关API函数 =============

// 获取所有的sales记录
export const getAllSales = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<ApiResponse<SalesListData>> => {
  try {
    // 后端接口不支持分页参数，返回所有数据
    const url = `/api/sales/get_all_sales`;
    const { data } = await request<ApiEnvelope<SalesListData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取sales记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取sales记录失败',
      data: { rows: [], total: 0 },
    };
  }
};

// 创建sales记录
export const addSalesRecord = async (params: { student_name: string }): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/add_record`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('创建sales记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '创建sales记录失败',
    };
  }
};

// 删除sales记录
export const deleteSalesRecord = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/staff_delete`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除sales记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除sales记录失败',
    };
  }
};

// 获取sales的基本信息
export const getSalesInfo = async (contractId: number): Promise<ApiResponse<SalesInfo>> => {
  try {
    const url = `/api/sales/staff_sales_info/${contractId}`;
    const { data } = await request<ApiEnvelope<SalesInfo>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取sales基本信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取sales基本信息失败',
    };
  }
};

// 发送录取通知的邮件参数
export interface AdmissionMailParams {
  contract_id: number;
  school_year: string;      // 学年
  semester: string;          // 学期
  english_score: string;     // 英语成绩
  math_score: string;        // 数学成绩
  campuses: string;           // 校区
  year_num: string;           // Enrollment Year
  year_of_study?: string;     // Year of Study (数字类型)
}

// 发送录取通知的邮件
export const sendEntranceAdmission = async (
  params: AdmissionMailParams
): Promise<ApiResponse<void>> => {
  try {
    const url = `/api/sales/send_entrance_admission`;
    const { data } = await request<ApiEnvelope<void>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('发送录取通知邮件失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '发送录取通知邮件失败',
    };
  }
};

// 发送reject的邮件参数
export interface RejectMailParams {
  contract_id: number;
  school_year: string;       // 学年
  english_score: string;     // 英语成绩
  math_score: string;        // 数学成绩
}

// 发送reject的邮件
export const sendEntranceReject = async (
  params: RejectMailParams
): Promise<ApiResponse<void>> => {
  try {
    const url = `/api/sales/send_entrance_reject`;
    const { data } = await request<ApiEnvelope<void>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('发送拒信失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '发送拒信失败',
    };
  }
};

// 添加sales到students
export const addSalesToStudent = async (contractId: number): Promise<ApiResponse<void>> => {
  try {
    const url = `/api/sales/add_to_student`;
    const { data } = await request<ApiEnvelope<void>>(url, {
      method: 'POST',
      body: { contract_id: contractId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加sales到students失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加sales到students失败',
    };
  }
};

// 更新sales信息
export interface UpdateSalesParams {
  contract_id: number;
  assigned_staff?: number;
  follow_up_1?: string;
  follow_up_2?: string;
  follow_up_3?: string;
  wechat?: string;
  current_school?: string;
  grade?: string;
  sales_status?: number;
  student_name?: string;
  student_first_name_pinyin?: string;
  student_last_name_pinyin?: string;
  student_sfz?: string;
  guardian_name?: string;
  address?: string;
  phone?: string;
  gender?: number;
  source?: string;
  relationship?: string;
  fee?: number;
  registration_time?: number;
  email?: string;
  birthday?: number;
  course?: number;
  channel?: number;
  campus_id?: number;
  enrolment_date?: number;
  sales_pay_date?: number;
  graduation_date?: number;
  year_fee?: number;
  year_fee_reminder_time_1?: number;
  year_fee_reminder_time_2?: number;
  year_fee_reminder_time_3?: number;
  guardian_sfz?: string;
  id_front_path?: string;
  id_back_path?: string;
  id_card_recent?: string;
  current_lesson?: string;
  province?: string;
  city?: string;
  apply_course?: number;
  hobbies?: string;
  awards?: string;
  evaluation?: string;
  password?: string;
  study_year?: string;
  math_type?: string;
  signing_request_state?: number;
}

export const updateSalesInfo = async (params: UpdateSalesParams): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/staff_sales_info/${params.contract_id}`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('更新sales信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新sales信息失败',
    };
  }
};

// 上传sales图片
export const uploadSalesImage = async (field: 'sfz_front' | 'sfz_back' | 'recent_front_photo', file: File): Promise<ApiResponse<string>> => {
  try {
    const formData = new FormData();
    formData.append(field, file);
    
    const headers: HeadersInit = {
      ...getAuthHeader(),
      // 不要设置Content-Type，让浏览器自动设置
    };
    
    const response = await fetch('/api/sales/upload_sales_image', {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await response.json();
    return {
      code: data.status === 0 ? 200 : 400,
      message: data.message || '',
      data: data.data?.file_path || '',
    };
  } catch (error) {
    console.error('上传图片失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '上传图片失败',
    };
  }
};

// ============= 面试配置相关API =============

// 获取面试配置的select信息
export const getInterviewSelect = async (): Promise<ApiResponse<{ exam_day: string[]; interviewer_num: number[] }>> => {
  try {
    const url = `/api/sales/get_interview_select`;
    const { data } = await request<ApiEnvelope<{ exam_day: string[]; interviewer_num: number[] }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取面试配置select信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取面试配置select信息失败',
      data: { exam_day: [], interviewer_num: [] },
    };
  }
};

// 获取面试的配置信息
export const getInterviewConfigTable = async (): Promise<ApiResponse<{ rows: InterviewConfig[]; total: number }>> => {
  try {
    const url = `/api/sales/get_interview_config_table`;
    const { data } = await request<ApiEnvelope<{ rows: InterviewConfig[]; total: number }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse<{ rows: InterviewConfig[]; total: number }>(data);
  } catch (error) {
    console.error('获取面试配置信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取面试配置信息失败',
      data: {
        rows: [],
        total: 0,
      },
    };
  }
};

// 添加面试的配置信息
export const addInterviewConfig = async (params: Record<string, any>): Promise<ApiResponse<InterviewConfig>> => {
  try {
    const url = `/api/sales/add_interview_config`;
    const { data } = await request<ApiEnvelope<InterviewConfig>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加面试配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加面试配置失败',
    };
  }
};

// 删除面试配置
export const deleteInterviewConfig = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/del_interview_config`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除面试配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除面试配置失败',
    };
  }
};

// 获取面试的时间配置的select信息
export const getInterviewTimeSelect = async (recordId: number): Promise<ApiResponse<{
  ref_day: string;
  interview_desc: string;
  interviewer_num: number;
  interview_day: string;
  interview_time: number[];
}>> => {
  try {
    const url = `/api/sales/get_interview_time_select/${recordId}`;
    const { data } = await request<ApiEnvelope<{
      ref_day: string;
      interview_desc: string;
      interviewer_num: number;
      interview_day: string;
      interview_time: number[];
    }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取面试时间配置select信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取面试时间配置select信息失败',
      data: {
        ref_day: '',
        interview_desc: '',
        interviewer_num: 0,
        interview_day: '',
        interview_time: [],
      },
    };
  }
};

// 添加面试的时间配置选项
export const addInterviewTime = async (params: Record<string, any>): Promise<ApiResponse<InterviewTimeConfig>> => {
  try {
    const url = `/api/sales/add_interview_time`;
    const { data } = await request<ApiEnvelope<InterviewTimeConfig>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加面试时间配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加面试时间配置失败',
    };
  }
};

// 删除面试时间的配置
export const deleteInterviewTime = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/del_interview_time`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除面试时间配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除面试时间配置失败',
    };
  }
};

// 获取面试房间的select信息
export const getInterviewRoomSelect = async (recordId: number): Promise<ApiResponse<{
  ref_day: string;
  interview_desc: string;
  interviewer_num: number;
  interview_day: string;
  interview_room: Array<{ room_id: number; room_info: string }>;
}>> => {
  try {
    const url = `/api/sales/get_interview_room_select/${recordId}`;
    const { data } = await request<ApiEnvelope<{
      ref_day: string;
      interview_desc: string;
      interviewer_num: number;
      interview_day: string;
      interview_room: Array<{ room_id: number; room_info: string }>;
    }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取面试房间select信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取面试房间select信息失败',
      data: {
        ref_day: '',
        interview_desc: '',
        interviewer_num: 0,
        interview_day: '',
        interview_room: [],
      },
    };
  }
};

// 添加面试房间配置
export const addInterviewRoom = async (params: Record<string, any>): Promise<ApiResponse<InterviewRoomConfig>> => {
  try {
    const url = `/api/sales/add_interview_room`;
    const { data } = await request<ApiEnvelope<InterviewRoomConfig>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加面试房间配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加面试房间配置失败',
    };
  }
};

// 获取面试房间的基本信息
export const getInterviewRoom = async (recordId: number): Promise<ApiResponse<{ rows: InterviewRoomConfig[]; total: number }>> => {
  try {
    const url = `/api/sales/get_interview_room/${recordId}`;
    const { data } = await request<ApiEnvelope<{ rows: InterviewRoomConfig[]; total: number }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取面试房间基本信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取面试房间基本信息失败',
      data: { rows: [], total: 0 },
    };
  }
};

// ============= 考试配置相关API =============

// 获取添加考试配置的select信息
export const getExamConfigSelect = async (): Promise<ApiResponse<{ exam_type: Record<number, string> }>> => {
  try {
    const url = `/api/sales/exam_config_select`;
    const { data } = await request<ApiEnvelope<{ exam_type: Record<number, string> }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取考试配置select信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试配置select信息失败',
      data: { exam_type: {} },
    };
  }
};

// 添加exam的配置信息
export const addExamConfig = async (params: Record<string, any>): Promise<ApiResponse<ExamConfig>> => {
  try {
    const url = `/api/sales/add_exam_config`;
    const { data } = await request<ApiEnvelope<ExamConfig>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加考试配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加考试配置失败',
    };
  }
};

// 删除exam的配置
export const deleteExamConfig = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/del_exam_config`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除考试配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除考试配置失败',
    };
  }
};

// 获取考试的配置信息
export const getExamConfigTable = async (): Promise<ApiResponse<{ rows: ExamConfig[]; total: number }>> => {
  try {
    const url = `/api/sales/get_exam_config_table`;
    const { data } = await request<ApiEnvelope<{ rows: ExamConfig[]; total: number }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取考试配置信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试配置信息失败',
      data: { rows: [], total: 0 },
    };
  }
};

// 获取考试场次的select信息
export const getExamSessionSelect = async (): Promise<ApiResponse<{
  campus_info: Record<number, string>;
  exam_setting: Array<{ id: number; exam_desc: string }>;
  study_year: Array<{ value: string; name: string }>;
  paper_type: Array<{ value: string; name: string }>;
}>> => {
  try {
    const url = `/api/sales/get_exam_session_select`;
    const { data } = await request<ApiEnvelope<{
      campus_info: Record<number, string>;
      exam_setting: Array<{ id: number; exam_desc: string }>;
      study_year: Array<{ value: string; name: string }>;
      paper_type: Array<{ value: string; name: string }>;
    }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取考试场次select信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试场次select信息失败',
      data: {
        campus_info: {},
        exam_setting: [],
        study_year: [],
        paper_type: [],
      },
    };
  }
};

// 添加考试场次的信息
export const addExamSession = async (params: Record<string, any>): Promise<ApiResponse<ExamSession>> => {
  try {
    const url = `/api/sales/add_exam_session`;
    const { data } = await request<ApiEnvelope<ExamSession>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加考试场次失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加考试场次失败',
    };
  }
};

// 获取考试场次的列表
export const getExamSessionTable = async (): Promise<ApiResponse<{ rows: ExamSession[]; total: number }>> => {
  try {
    const url = `/api/sales/get_exam_session_table`;
    const { data } = await request<ApiEnvelope<{ rows: ExamSession[]; total: number }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取考试场次列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试场次列表失败',
      data: { rows: [], total: 0 },
    };
  }
};

// 删除考试场次配置
export const deleteExamSession = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/del_exam_session`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除考试场次配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除考试场次配置失败',
    };
  }
};

// 获取考试的基础配置的select选项信息
export const getExamBaseSelect = async (): Promise<ApiResponse<{ sales_exam_select: Record<number, string> }>> => {
  try {
    const url = `/api/sales/get_exam_base_select`;
    const { data } = await request<ApiEnvelope<{ sales_exam_select: Record<number, string> }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取考试基础配置select信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试基础配置select信息失败',
      data: { sales_exam_select: {} },
    };
  }
};

// 获取考试基础配置的列表信息
export const getExamBaseTable = async (): Promise<ApiResponse<{ rows: ExamBaseConfig[]; total: number }>> => {
  try {
    const url = `/api/sales/get_exam_base_table`;
    const { data } = await request<ApiEnvelope<{ rows: ExamBaseConfig[]; total: number }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取考试基础配置列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取考试基础配置列表失败',
      data: { rows: [], total: 0 },
    };
  }
};

// 添加考试基础配置
export const addExamBase = async (params: Record<string, any>): Promise<ApiResponse<ExamBaseConfig>> => {
  try {
    const url = `/api/sales/add_exam_base`;
    const { data } = await request<ApiEnvelope<ExamBaseConfig>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加考试基础配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加考试基础配置失败',
    };
  }
};

// 删除考试基础配置
export const deleteExamBase = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/del_exam_base`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除考试基础配置失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除考试基础配置失败',
    };
  }
};

// ============= 支付相关API =============

// 获取招生报名的缴费信息
export const getPaymentInfo = async (params?: {
  start_day?: string;
  end_day?: string;
}): Promise<ApiResponse<{ rows: PaymentInfo[]; total: number }>> => {
  try {
    const queryString = buildQueryString(params);
    const url = `/api/sales/get_payment_info${queryString}`;
    const { data } = await request<ApiEnvelope<{ rows: PaymentInfo[]; total: number }>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取支付信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取支付信息失败',
      data: { rows: [], total: 0 },
    };
  }
};

// 删除支付记录信息
export const deletePaymentRecord = async (recordId: number): Promise<ApiResponse<void>> => {
  try {
    const url = `/api/sales/del_payment_record`;
    const { data } = await request<ApiEnvelope<void>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除支付记录失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除支付记录失败',
    };
  }
};

// 获取支付记录的详细信息
export const getPaymentDetail = async (recordId: number): Promise<ApiResponse<PaymentDetail>> => {
  try {
    const url = `/api/sales/get_payment_detail/${recordId}`;
    const { data } = await request<ApiEnvelope<PaymentDetail>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取支付记录详情失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取支付记录详情失败',
    };
  }
};

// 修改招生报名的考试日期
export interface ChangeExamDateParams {
  sales_id: number;
  old_exam_id: number;
  new_exam_id: number;
}

export const changeExamDate = async (params: ChangeExamDateParams): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/change_exam_date`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('修改考试日期失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改考试日期失败',
    };
  }
};

// 修改报考信息
export interface ChangeSalesApplyParams {
  sales_id: number;
  pay_id: number;
  campus_id: number;
  study_year: string;
  paper_type: string;
  math_type: string;
}

export const changeSalesApply = async (params: ChangeSalesApplyParams): Promise<ApiResponse<string>> => {
  try {
    const url = `/api/sales/change_sales_apply`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('修改报考信息失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '修改报考信息失败',
    };
  }
};

// ============= 邮件发送相关API =============

// 发送面试通知
export const sendInterviewEmail = async (recordId: number): Promise<ApiResponse<void>> => {
  try {
    const url = `/api/sales/send_interview_email`;
    const { data } = await request<ApiEnvelope<void>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('发送面试通知失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '发送面试通知失败',
    };
  }
};

// 发送拒信
export const sendRejectEmail = async (recordId: number): Promise<ApiResponse<void>> => {
  try {
    const url = `/api/sales/send_reject_email`;
    const { data } = await request<ApiEnvelope<void>>(url, {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('发送拒信失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '发送拒信失败',
    };
  }
};

// 下载支付报考信息
export const downloadPaymentInfo = async (params: {
  start_day: string;
  end_day: string;
}): Promise<ApiResponse<string>> => {
  try {
    const queryString = buildQueryString(params);
    const url = `/api/sales/download_payment_info${queryString}`;
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取下载链接失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取下载链接失败',
    };
  }
};

// ============= 合同检查相关API =============

// 检查合同签署状态
export const checkContractStatus = async (checkUrl: string): Promise<ApiResponse<string>> => {
  try {
    // checkUrl 格式: /api/site/check_contract/<contract_id>/<version>/<file_type>
    // 这个接口返回 JSON 格式: { status: 0, message: "...", data: "下载地址" } 或 { status: 1, ... }
    const { data } = await request<ApiEnvelope<string>>(checkUrl, {
      method: 'GET',
      auth: true, // 需要认证
    });
    
    // 直接返回原始状态，不做特殊处理
    // status=0 表示有下载地址，status=1 表示没有
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('检查合同状态失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '检查合同状态失败',
    };
  }
};

// ============= 合同签署相关API =============

// 生成合同预览
export interface ContractPreviewData {
  link: string;      // 发送合同的链接
  iframe1: string;   // 服务协议预览URL
  iframe2: string;   // 咨询协议预览URL
}

export const generateContractPreview = async (contractId: number): Promise<ApiResponse<ContractPreviewData>> => {
  try {
    const url = `/api/sales/generate_sales_contract/${contractId}`;
    const { data } = await request<ApiEnvelope<ContractPreviewData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('生成合同预览失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '生成合同预览失败',
    };
  }
};

// 发送合同签署请求
export interface FinalizeSigningParams {
  contractId: number;
  fileIds: string;  // 格式: "fileId1--fileId2"
  version: number; // 版本号，通常是4
  subCompany?: string; // 子公司参数，格式: "subCompany1-subCompany2"
}

export const finalizeSigningRequest = async (params: FinalizeSigningParams): Promise<ApiResponse<string>> => {
  try {
    let url = `/api/sales/finalize_signing_request/${params.contractId}/${params.fileIds}/${params.version}`;
    if (params.subCompany) {
      url += `?sub_company=${params.subCompany}`;
    }
    const { data } = await request<ApiEnvelope<string>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('发送合同签署请求失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '发送合同签署请求失败',
    };
  }
};

// ============= 其他操作API =============

