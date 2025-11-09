/* eslint-disable @typescript-eslint/no-explicit-any */
import { request, normalizeApiResponse, buildQueryString, getAuthHeader } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// ============= School Info 相关API函数 =============

// Missing Feedback 接口
export interface MissingFeedbackData {
  result: Record<string, number>; // 教师名 -> 缺失数量
  start_time: string;
  end_time: string;
}

export const getMissingFeedback = async (timeUnit: number): Promise<ApiResponse<MissingFeedbackData>> => {
  try {
    const url = `/api/school/info/get_missing_feedback/${timeUnit}`;
    const { data } = await request<ApiEnvelope<MissingFeedbackData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Missing Feedback失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Missing Feedback失败',
      data: { result: {}, start_time: '', end_time: '' },
    };
  }
};

// Missing Absence 接口
export interface MissingAbsenceData {
  [teacherName: string]: number; // 教师名 -> 缺失数量
}

export const getMissingAbsence = async (monthNum: number): Promise<ApiResponse<MissingAbsenceData>> => {
  try {
    const url = `/api/school/info/get_missing_absense/${monthNum}`;
    const { data } = await request<ApiEnvelope<MissingAbsenceData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Missing Absence失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Missing Absence失败',
      data: {},
    };
  }
};

// 操作日志接口
export interface LogEntry {
  teacher_name: string;
  time: string;
  message: string;
}

export interface LogData {
  result: LogEntry[];
  total: number;
}

export const getLogs = async (params: { page?: number; page_size?: number }): Promise<ApiResponse<LogData>> => {
  try {
    const queryString = buildQueryString({
      page: params.page || 1,
      page_size: params.page_size || 100,
    });
    const url = `/api/school/info/get_log${queryString}`;
    const { data } = await request<ApiEnvelope<LogData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取操作日志失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取操作日志失败',
      data: { result: [], total: 0 },
    };
  }
};

// Over Book Room 接口
export interface OverBookRoomItem {
  class_id: number;
  room_name: string;
  room_size: number;
  class_size: number;
  week_num: number;
  start_time: string;
}

export interface OverBookRoomData {
  rows: OverBookRoomItem[];
  total: number;
}

export const getOverBookRoom = async (): Promise<ApiResponse<OverBookRoomData>> => {
  try {
    const url = `/api/school/info/get_over_book_room`;
    const { data } = await request<ApiEnvelope<OverBookRoomData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Over Book Room失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Over Book Room失败',
      data: { rows: [], total: 0 },
    };
  }
};

// Enter Exam Grades List 接口
export interface ExamGradeItem {
  exam_id: number;
  name: string;
  time: string;
  topic: string;
  location: string;
  period: number;
  period_name: string;
  type: number;
  type_name: string;
  disabled: number;
}

export interface ExamGradesListData {
  rows: ExamGradeItem[];
  total: number;
}

export const getEnterExamGrades = async (): Promise<ApiResponse<ExamGradesListData>> => {
  try {
    const url = `/api/school/info/get_enter_exam_grades`;
    const { data } = await request<ApiEnvelope<ExamGradesListData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Enter Exam Grades失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Enter Exam Grades失败',
      data: { rows: [], total: 0 },
    };
  }
};

// Enter Grades 详细信息接口
export interface ExamStudent {
  record_id: number;
  student_name: string;
  signup_time: string;
  signup_price: number;
  paid: number;
  result: string;
  second: string;
  student_id: number;
  grade: string;
  teacher_invite: Array<{ id: number; name: string }>;
}

export interface TeacherItem {
  id: number;
  name: string;
}

export interface EnterGradesData {
  exam_info: {
    id: number;
    name: string;
    time: number;
    time_2: number;
    time_3: number;
    base_price: number;
    location: string;
    topic: string;
    period: number;
    code: string;
    type: number;
    topic_id: number;
    alipay_account: string;
  };
  semester_list: string[];
  semester_default: number;
  school_year_list: string[];
  exam_students: ExamStudent[];
  teacher_query_list: TeacherItem[];
}

export const getEnterGrades = async (examId: number): Promise<ApiResponse<EnterGradesData>> => {
  try {
    const url = `/api/school/info/get_enter_grades/${examId}`;
    const { data } = await request<ApiEnvelope<EnterGradesData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Enter Grades失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Enter Grades失败',
      data: {
        exam_info: {
          id: 0,
          name: '',
          time: 0,
          time_2: 0,
          time_3: 0,
          base_price: 0,
          location: '',
          topic: '',
          period: 0,
          code: '',
          type: 0,
          topic_id: 0,
          alipay_account: '',
        },
        semester_list: [],
        semester_default: 0,
        school_year_list: [],
        exam_students: [],
        teacher_query_list: [],
      },
    };
  }
};

// Exam All Evaluate 接口
export interface ExamEvaluateItem {
  record_id: number;
  evaluate: string;
  evaluate_title: string;
  student_name: string;
  teacher_name: string;
  is_mentor: string;
}

export interface ExamAllEvaluateData {
  rows: ExamEvaluateItem[];
  total: number;
}

export const getExamAllEvaluate = async (examId: number): Promise<ApiResponse<ExamAllEvaluateData>> => {
  try {
    const url = `/api/school/info/get_exam_all_evaluate/${examId}`;
    const { data } = await request<ApiEnvelope<ExamAllEvaluateData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Exam All Evaluate失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Exam All Evaluate失败',
      data: { rows: [], total: 0 },
    };
  }
};

// Exam Template 接口
export interface ExamTemplateData {
  file_path: string;
}

export const getExamTemplate = async (examId: number): Promise<ApiResponse<ExamTemplateData>> => {
  try {
    const url = `/api/school/info/get_exam_template/${examId}`;
    const { data } = await request<ApiEnvelope<ExamTemplateData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Exam Template失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Exam Template失败',
      data: { file_path: '' },
    };
  }
};

// Batch Add Student Exam 接口（上传Excel文件）
export const batchAddStudentExam = async (examId: number, file: File): Promise<ApiResponse<any>> => {
  try {
    const url = `/api/school/info/batch_add_student_exam/${examId}`;
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await request<ApiEnvelope<any>>(url, {
      method: 'POST',
      body: formData,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('批量添加学生到Exam失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '批量添加学生到Exam失败',
      data: {},
    };
  }
};

// Update Student Exam Grade 接口
export interface UpdateStudentExamGradeItem {
  record_id: number;
  result?: string;
  second?: string;
  grade?: string;
}

export interface UpdateStudentExamGradeParams {
  data: UpdateStudentExamGradeItem[];
}

export const updateStudentExamGrade = async (
  params: UpdateStudentExamGradeParams
): Promise<ApiResponse<any>> => {
  try {
    const url = `/api/school/info/update_student_exam_grade`;
    const { data } = await request<ApiEnvelope<any>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('更新学生Exam成绩失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新学生Exam成绩失败',
      data: {},
    };
  }
};

// Add Exam Teacher Evaluate 接口
export interface AddExamTeacherEvaluateParams {
  exam_id: number;
  student_id: number;
  teacher_id: number;
  [key: string]: any;
}

export const addExamTeacherEvaluate = async (
  params: AddExamTeacherEvaluateParams
): Promise<ApiResponse<any>> => {
  try {
    const url = `/api/school/info/add_exam_teacher_evaluate`;
    const { data } = await request<ApiEnvelope<any>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('添加Exam Teacher Evaluate失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '添加Exam Teacher Evaluate失败',
      data: {},
    };
  }
};

// Delete Subject Evaluate 接口
export interface DeleteSubjectEvaluateParams {
  record_id: number;
}

export const deleteSubjectEvaluate = async (params: DeleteSubjectEvaluateParams): Promise<ApiResponse<any>> => {
  try {
    const url = `/api/school/info/delete_subject_evaluate`;
    const { data } = await request<ApiEnvelope<any>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('删除Subject Evaluate失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '删除Subject Evaluate失败',
      data: {},
    };
  }
};

// Student PDF 列表接口
export interface StudentPdfItem {
  id: number;
  first_name: string;
  last_name: string;
  active: number;
  campus_id: number;
  birthday: number;
  gender: number;
  personal_id: string;
  enrolment_date: number;
  graduation_date: number;
  pinyin_first_name: string;
  pinyin_last_name: string;
  student_long_id: string;
  report: number;
  mock_report: number;
  wish_report: number;
  ig_time: string;
  as_time: string;
  al_time: string;
  '10_time': string;
  '11_time': string;
  '12_time': string;
}

export interface StudentPdfData {
  student_list: StudentPdfItem[];
  america_subjects: string[];
  all_course: string[];
  grade_select: string[];
  am_grade_list: string[];
  fix_course: string[];
  school_year_list: string[];
  transaction_list: string[];
  transcript_grade_list?: string[]; // 新增字段，用于Transcript成绩单的成绩选项
}

export const getStudentPdf = async (): Promise<ApiResponse<StudentPdfData>> => {
  try {
    const url = `/api/school/info/get_student_pdf`;
    const { data } = await request<ApiEnvelope<StudentPdfData>>(url, {
      method: 'GET',
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取Student PDF列表失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '获取Student PDF列表失败',
      data: {
        student_list: [],
        america_subjects: [],
        all_course: [],
        grade_select: [],
        am_grade_list: [],
        fix_course: [],
        school_year_list: [],
        transaction_list: [],
        transcript_grade_list: [],
      },
    };
  }
};

// Download Wishes 接口
export interface DownloadWishesData {
  file_path: string;
}

export const downloadWishes = async (studentId: number): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/school/info/down_wishes/${studentId}`;
    const { data } = await request<ApiResponse<DownloadWishesData>>(url, {
      method: 'GET',
      parser: 'blob',
    });
    // 对于下载，我们需要特殊处理
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `wishes_${studentId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    return {
      code: 200,
      message: '下载成功',
      data: { file_path: '' },
    };
  } catch (error) {
    console.error('下载Wishes失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '下载Wishes失败',
      data: { file_path: '' },
    };
  }
};

// Download Wishes Zip 接口
export const downloadWishesZip = async (studentId: number): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/school/info/down_wishes_zip/${studentId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `wishes_${studentId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    return {
      code: 200,
      message: '下载成功',
      data: { file_path: '' },
    };
  } catch (error) {
    console.error('下载Wishes Zip失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '下载Wishes Zip失败',
      data: { file_path: '' },
    };
  }
};

// Download All Graduation Wish 接口
export const downloadAllGraduationWish = async (): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/school/info/down_all_graduation_wish`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `all_graduation_wish_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    return {
      code: 200,
      message: '下载成功',
      data: { file_path: '' },
    };
  } catch (error) {
    console.error('下载All Graduation Wish失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '下载All Graduation Wish失败',
      data: { file_path: '' },
    };
  }
};

// Gen Transcript Report 接口
export interface GenTranscriptReportParams {
  student_id: number;
  name: string;
  chinese_name: string;
  is_male: number;
  birthday: number;
  duration_from: number;
  graduation_time: string;
  ig_time: string;
  as_time: string;
  al_time: string;
  values: any[];
}

export const genTranscriptReport = async (
  params: GenTranscriptReportParams
): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/school/info/gen_transcript_report`;
    const { data } = await request<ApiEnvelope<DownloadWishesData>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('生成Transcript Report失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '生成Transcript Report失败',
      data: { file_path: '' },
    };
  }
};

// Gen Predict Report 接口
export interface GenPredictReportParams {
  student_id: number;
  name: string;
  chinese_name: string;
  is_male: number;
  birthday: number;
  duration_from: number;
  graduation_time: string;
  values: any[];
}

export const genPredictReport = async (
  params: GenPredictReportParams
): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/school/info/gen_predict_report`;
    const { data } = await request<ApiEnvelope<DownloadWishesData>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('生成Predict Report失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '生成Predict Report失败',
      data: { file_path: '' },
    };
  }
};

// Report API (美本成绩单、成绩单、模考成绩报告)
export interface ReportParams {
  student_id: number;
  [key: string]: any;
}

export const genAmReport = async (params: ReportParams): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/report/am_report`;
    const { data } = await request<ApiEnvelope<DownloadWishesData>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('生成美本成绩单失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '生成美本成绩单失败',
      data: { file_path: '' },
    };
  }
};

export const genViewReport = async (params: ReportParams): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/report/view_report`;
    const { data } = await request<ApiEnvelope<DownloadWishesData>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('生成成绩单失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '生成成绩单失败',
      data: { file_path: '' },
    };
  }
};

// Gen Certificate Report 接口（待后端实现）
export interface GenCertificateReportParams {
  student_id: number;
  name: string;
  id: string;
  gender: string; // "Male" or "Female"
  birthday: number;
  studied_from: number;
  graduation_date: number;
}

export const genCertificateReport = async (
  params: GenCertificateReportParams
): Promise<ApiResponse<DownloadWishesData>> => {
  try {
    const url = `/api/school/info/gen_certificate_report`; // 待后端实现后修改URL
    const { data } = await request<ApiEnvelope<DownloadWishesData>>(url, {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('生成Certificate Report失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '生成Certificate Report失败',
      data: { file_path: '' },
    };
  }
};

