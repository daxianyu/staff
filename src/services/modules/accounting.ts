import { normalizeApiResponse, request } from '../apiClient';
import type { ApiEnvelope, ApiResponse } from '../types';

/** 续费学生清单行 */
export interface RepaymentRow {
  student_id: number;
  student_name: string;
  campus_name: string;
  sales_person: string;
  mentor: string;
  mentor_leader: string;
  year_fee: string;
  start_time: string;
  graduate_time: string;
  paid: string | number[];
  unpaid: string | number[];
}

export interface RepaymentsTableData {
  rows?: RepaymentRow[];
  list?: RepaymentRow[];
}

export interface ConfirmStudentPayParams {
  student_id: number;
  year: number;
}

export const getRepaymentsTable = async (): Promise<ApiResponse<RepaymentsTableData>> => {
  try {
    const { data } = await request<ApiEnvelope<RepaymentsTableData>>('/api/accounting/get_repayments_table');
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取续费学生清单失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取续费学生清单失败' };
  }
};

export const confirmStudentPay = async (
  params: ConfirmStudentPayParams
): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request<ApiEnvelope<unknown>>('/api/accounting/confirm_student_pay', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('确认缴费失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '确认缴费失败' };
  }
};
