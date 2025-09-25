import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// Mentee相关的类型定义
export interface MenteeStudent {
  student_id: number;
  student_name: string;
}

export interface MenteeStudentInfo {
  fee_pay: string[];
  student_long_id: string;
  first_edexcel_info: string;
  campus_name: string;
  gender: number;
  gender_str: string;
  birthday: string;
  enrolment_date: number;
  graduation_date: number;
  year_fee: number;
  relative_sum: string;
  week_absence: number;
  absence_week_details: string[];
  absence_month_details: string[];
  late_week_details: string[];
  late_month_details: string[];
  unauthorized_week_details: string[];
  unauthorized_month_details: string[];
  english_name: string;
  nationality: string;
  exam_0_number: string;
  exam_1_number: string;
  exam_2_number: string;
  phone_number: string;
  address: string;
  current_school: string;
  current_grade: string;
  fathers_name: string;
  fathers_phone_number: string;
  mothers_name: string;
  mothers_phone_number: string;
}

export interface MenteeCourseInfo {
  show_warning: number;
  student_info: {
    first_name: string;
    last_name: string;
    campus_name: string;
    gender: number;
    year_fee: number;
    enrolment_date: number;
    graduation_date: number;
    university_country_1: string;
    university_name_1: string;
    university_course_1: string;
    university_choice_confirmed: number;
    exam_0_number: string;
    exam_1_number: string;
    exam_2_number: string;
    birthday: string;
  };
  exams: Record<string, any>;
}

export interface MenteeClassInfo {
  class_id: number;
  class_name: string;
}

export interface AssignmentInfo {
  id: number;
  topic_id: number;
  exam_name: string;
  class_name: string;
  note: string;
  signup_time: number;
}

export interface MenteeExamInfo {
  table_1: any[];
  table_2: any[];
}

export interface FeedbackInfo {
  rows: {
    teacher_name: string;
    note: string;
    topic_id: number;
    topic_name: string;
    time_format: string;
  }[];
  total: number;
}

export interface RemarkInfo {
  rows: {
    record_id: number;
    student_id: number;
    student_name: string;
    mentor_name: string;
    campus_name: string;
    season: string;
    price: number;
    exam_center: string;
    exam_id: number;
    exam_name: string;
    remark_type: string;
    exam_code: string;
    note: string;
    alipay_account: string;
    alipay_name: string;
    reject_reason: string;
    status: number;
    create_time: string;
    status_name: string;
  }[];
  total: number;
}

export interface CashinInfo {
  rows: {
    record_id: number;
    season: string;
    mentor_name: string;
    subject_name: string;
    student_name: string;
    reject_reason: string;
    exam_code: string;
    level: string;
    note: string;
    status: number;
    create_time: string;
    status_name: string;
  }[];
  total: number;
}

export interface WithdrawalInfo {
  rows: {
    record_id: number;
    season: string;
    student_name: string;
    mentor_name: string;
    campus_name: string;
    exam_name: string;
    reject_reason: string;
    pay_account: string;
    account_name: string;
    signup_price: string;
    status: number;
    create_time: string;
    status_name: string;
  }[];
  total: number;
}

export interface LanguageExamInfo {
  rows: {
    record_id: number;
    exam_name: string;
    exam_day: string;
    grade: string;
    score: string;
    operator_id: number;
    student_name: string;
    staff_name: string;
  }[];
  total: number;
}

export interface NormalExamInfo {
  rows: {
    record_id: number;
    exam_center: string;
    exam_season: string;
    subject: string;
    qualification: string;
    grade: string;
    module: string;
    ums_pum: string;
    exam_room_num: string;
    operator_id: number;
    student_name: string;
    staff_name: string;
  }[];
  total: number;
}

export interface MyMentorStudents {
  mentor_id: number;
  mentor_name: string;
  students: {
    student_id: number;
    gender: string;
    enrolment_date: number;
    graduation_date: number;
    year_fee: number;
    student_name: string;
    exams: string[];
  }[];
}

export interface StudentInfoSelect {
  normal_exam: {
    exam_center: string[];
    qualification: string[];
    exam_subject: string[];
    exam_grade: string[];
  };
}

export interface EvaluateSelect {
  student_evaluate: Record<number, string[]>;
  mock_evaluate: Record<number, string[]>;
  grade_list: Record<string, string>;
}

// API函数

/**
 * 获取mentee学生列表
 */
export const getMenteeStudents = async (): Promise<ApiResponse<MenteeStudent[]>> => {
  try {
    const { data } = await request('/api/mentee/mentee_students');
    return normalizeApiResponse(data as ApiEnvelope<MenteeStudent[]>);
  } catch (error) {
    console.error('获取mentee学生列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取mentee学生列表失败' };
  }
};

/**
 * 获取学生基本信息
 */
export const getMenteeStudentInfo = async (studentId: string): Promise<ApiResponse<MenteeStudentInfo>> => {
  try {
    const { data } = await request(`/api/mentee/get_student_info/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<MenteeStudentInfo>);
  } catch (error) {
    console.error('获取学生基本信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生基本信息失败' };
  }
};

/**
 * 获取学生课程信息
 */
export const getCourseInfo = async (studentId: string): Promise<ApiResponse<MenteeCourseInfo>> => {
  try {
    const { data } = await request(`/api/mentee/get_course_info/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<MenteeCourseInfo>);
  } catch (error) {
    console.error('获取学生课程信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生课程信息失败' };
  }
};

/**
 * 获取学生班级信息
 */
export const getClasses = async (studentId: string): Promise<ApiResponse<MenteeClassInfo[]>> => {
  try {
    const { data } = await request(`/api/mentee/get_classes/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<MenteeClassInfo[]>);
  } catch (error) {
    console.error('获取学生班级信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生班级信息失败' };
  }
};

/**
 * 获取学生作业信息
 */
export const getAssignment = async (studentId: string): Promise<ApiResponse<AssignmentInfo[]>> => {
  try {
    const { data } = await request(`/api/mentee/get_assignment/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<AssignmentInfo[]>);
  } catch (error) {
    console.error('获取学生作业信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生作业信息失败' };
  }
};

/**
 * 获取学生考试信息
 */
export const getExamsInfo = async (studentId: string): Promise<ApiResponse<MenteeExamInfo>> => {
  try {
    const { data } = await request(`/api/mentee/get_exams_info/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<MenteeExamInfo>);
  } catch (error) {
    console.error('获取学生考试信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生考试信息失败' };
  }
};

/**
 * 获取学生反馈信息
 */
export const getFeedBack = async (studentId: string): Promise<ApiResponse<FeedbackInfo>> => {
  try {
    const { data } = await request(`/api/mentee/get_feed_back/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生反馈信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生反馈信息失败' };
  }
};

/**
 * 获取学生remark信息
 */
export const loadStudentRemark = async (studentId: string): Promise<ApiResponse<RemarkInfo>> => {
  try {
    const { data } = await request(`/api/mentee/load_student_remark/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生remark信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生remark信息失败' };
  }
};

/**
 * 获取学生cashin信息
 */
export const loadStudentCashin = async (studentId: string): Promise<ApiResponse<CashinInfo>> => {
  try {
    const { data } = await request(`/api/mentee/load_student_cashin/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生cashin信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生cashin信息失败' };
  }
};

/**
 * 获取学生withdrawal信息
 */
export const loadStudentWithdrawal = async (studentId: string): Promise<ApiResponse<WithdrawalInfo>> => {
  try {
    const { data } = await request(`/api/mentee/load_student_withdrawal/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生withdrawal信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生withdrawal信息失败' };
  }
};

/**
 * 获取学生语言考试信息
 */
export const getLanguageExamTable = async (studentId: string): Promise<ApiResponse<LanguageExamInfo>> => {
  try {
    const { data } = await request(`/api/mentee/get_language_exam_table/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生语言考试信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生语言考试信息失败' };
  }
};

/**
 * 获取学生大考信息
 */
export const getNormalExamTable = async (studentId: string): Promise<ApiResponse<NormalExamInfo>> => {
  try {
    const { data } = await request(`/api/mentee/get_normal_exam_table/${studentId}`);
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生大考信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生大考信息失败' };
  }
};

/**
 * 添加语言考试记录
 */
export const addLanguageExam = async (examData: {
  student_id: number;
  exam_name: string;
  exam_day: string;
  grade: string;
  score: string;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/add_language_exam', {
      method: 'POST',
      body: examData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('添加语言考试记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加语言考试记录失败' };
  }
};

/**
 * 删除语言考试记录
 */
export const deleteLanguageRow = async (recordData: {
  record_id: number;
  student_id: number;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/delete_language_row', {
      method: 'POST',
      body: recordData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('删除语言考试记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除语言考试记录失败' };
  }
};

/**
 * 添加大考记录
 */
export const addNormalExam = async (examData: {
  student_id: number;
  normal_exam_center: string;
  normal_exam_season: string;
  normal_exam_subject: string;
  normal_exam_grade: string;
  normal_qualification: string;
  normal_module: string;
  normal_ums_pum: string;
  normal_exam_room_num: string;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/add_normal_exam', {
      method: 'POST',
      body: examData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('添加大考记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加大考记录失败' };
  }
};

/**
 * 删除大考记录
 */
export const deleteNormalExamRow = async (recordData: {
  record_id: number;
  student_id: number;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/delete_normal_exam_row', {
      method: 'POST',
      body: recordData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('删除大考记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除大考记录失败' };
  }
};

/**
 * 更新投诉信息
 */
export const updateComplaint = async (complaintData: {
  student_id: number;
  complaint: string;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/update_complaint', {
      method: 'POST',
      body: complaintData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('更新投诉信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新投诉信息失败' };
  }
};

/**
 * 更新单个作业请求备注
 */
export const updateSingle = async (updateData: {
  student_id: number;
  record_id: number;
  note: string;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/update_single', {
      method: 'POST',
      body: updateData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('更新作业请求备注失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新作业请求备注失败' };
  }
};

/**
 * 更新学生状态
 */
export const updateStudent = async (updateData: {
  post_type: number;
  student_id: number;
  student_name: string;
  reason?: string;
  comment?: string;
  university?: string;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/mentee/update_student', {
      method: 'POST',
      body: updateData,
    });
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('更新学生状态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新学生状态失败' };
  }
};

/**
 * 获取mentor下的学生列表
 */
export const getMyMentorStudents = async (): Promise<ApiResponse<MyMentorStudents[]>> => {
  try {
    const { data } = await request('/api/mentee/get_my_mentor_students');
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取mentor下的学生列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取mentor下的学生列表失败' };
  }
};

/**
 * 获取学生信息选择项
 */
export const getStudentInfoSelect = async (): Promise<ApiResponse<StudentInfoSelect>> => {
  try {
    const { data } = await request('/api/mentee/get_student_info_select/');
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取学生信息选择项失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取学生信息选择项失败' };
  }
};

/**
 * 获取评价选择项
 */
export const getEvaluateSelect = async (): Promise<ApiResponse<EvaluateSelect>> => {
  try {
    const { data } = await request('/api/mentee/get_evaluate_select');
    return normalizeApiResponse(data as ApiEnvelope<any>);
  } catch (error) {
    console.error('获取评价选择项失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取评价选择项失败' };
  }
};
