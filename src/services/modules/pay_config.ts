import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// 支付配置列表项
export interface PayConfigRecord {
    record_id: number;
    pay_type: number;
    pay_desc: string;
    account: number;
    account_name: string;
}

// 支付账户选项
export interface PayAccountOption {
    id: number;
    value: string;
}

// 支付类型选项
export interface PayTypeOption {
    id: number;
    value: string;
}

// 支付账户列表响应
export interface PayAccountListResponse {
    pay_account: PayAccountOption[];
    pay_type: PayTypeOption[];
}

// 更新支付账户参数
export interface UpdatePayAccountParams {
    record_id: number;
    new_account: number;
}

// 更新Passcode参数
export interface UpdatePasscodeParams {
    new_passcode: string;
}

// 多账户配置项
export interface MultiAccountRecord {
    record_id: number;
    account_pay_type: number;
    account_pay_type_desc: string;
    account_1: number;
    account_1_name: string;
    account_2: number;
    account_2_name: string;
    account_3: number;
    account_3_name: string;
    account_1_amount: number;
    account_2_amount: number;
    account_3_amount: number;
    create_time: string;
    update_time: string;
}

// 添加多账户参数
export interface AddMultiAccountParams {
    account_pay_type: number;
    account_1: number;
    account_2: number;
    account_3: number;
    account_1_amount: number;
    account_2_amount: number;
    account_3_amount: number;
}

// 学生固定账户项
export interface StudentFixedAccountRecord {
    record_id: number;
    student_id: number;
    pay_type: number;
    student_name: string;
    pay_account: string;
}

// 添加学生固定账户参数
export interface AddStudentFixedAccountParams {
    student_id: number;
    pay_type: number;
}

// 获取支付配置列表
export const getPayConfigList = async (): Promise<ApiResponse<{ rows: PayConfigRecord[]; total: number }>> => {
    try {
        const { data } = await request('/api/core/pay_config_list');
        return normalizeApiResponse<{ rows: PayConfigRecord[]; total: number }>(data as ApiEnvelope<{ rows: PayConfigRecord[]; total: number }>);
    } catch (error) {
        console.error('获取支付配置列表失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '获取支付配置列表失败' };
    }
};

// 获取支付账户列表
export const getPayAccountList = async (): Promise<ApiResponse<PayAccountListResponse>> => {
    try {
        const { data } = await request('/api/core/pay_account_list');
        return normalizeApiResponse<PayAccountListResponse>(data as ApiEnvelope<PayAccountListResponse>);
    } catch (error) {
        console.error('获取支付账户列表失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '获取支付账户列表失败' };
    }
};

// 更新支付账户
export const updatePayAccount = async (params: UpdatePayAccountParams): Promise<ApiResponse<unknown>> => {
    try {
        const { data } = await request('/api/core/update_pay_account', {
            method: 'POST',
            body: params,
        });
        return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
    } catch (error) {
        console.error('更新支付账户失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '更新支付账户失败' };
    }
};

// 获取Passcode信息
export const getPasscodeInfo = async (): Promise<ApiResponse<string>> => {
    try {
        const { data } = await request('/api/core/passcode_info');
        // The backend returns the string directly in data, or wrapped?
        // Based on core_record.py: return return_json(passcode_data["passcode"])
        // So data will be the passcode string.
        return normalizeApiResponse<string>(data as ApiEnvelope<string>);
    } catch (error) {
        console.error('获取Passcode信息失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '获取Passcode信息失败' };
    }
};

// 更新Passcode信息
export const updatePasscode = async (params: UpdatePasscodeParams): Promise<ApiResponse<unknown>> => {
    try {
        const { data } = await request('/api/core/update_passcode', {
            method: 'POST',
            body: params,
        });
        return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
    } catch (error) {
        console.error('更新Passcode信息失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '更新Passcode信息失败' };
    }
};

// 获取多账户设置
export const getMultiAccount = async (): Promise<ApiResponse<{ rows: MultiAccountRecord[]; total: number }>> => {
    try {
        const { data } = await request('/api/core/get_multi_account');
        return normalizeApiResponse<{ rows: MultiAccountRecord[]; total: number }>(data as ApiEnvelope<{ rows: MultiAccountRecord[]; total: number }>);
    } catch (error) {
        console.error('获取多账户设置失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '获取多账户设置失败' };
    }
};

// 添加多账户设置
export const addMultiAccount = async (params: AddMultiAccountParams): Promise<ApiResponse<unknown>> => {
    try {
        const { data } = await request('/api/core/add_multi_account', {
            method: 'POST',
            body: params,
        });
        return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
    } catch (error) {
        console.error('添加多账户设置失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '添加多账户设置失败' };
    }
};

// 删除多账户设置
export const deleteMultiAccount = async (recordId: number): Promise<ApiResponse<unknown>> => {
    try {
        const { data } = await request('/api/core/delete_multi_account', {
            method: 'POST',
            body: { record_id: recordId },
        });
        return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
    } catch (error) {
        console.error('删除多账户设置失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '删除多账户设置失败' };
    }
};

// 获取学生固定支付账户
export const getStudentFixedAccount = async (): Promise<ApiResponse<{ rows: StudentFixedAccountRecord[]; total: number }>> => {
    try {
        const { data } = await request('/api/core/student_fixed_account');
        return normalizeApiResponse<{ rows: StudentFixedAccountRecord[]; total: number }>(data as ApiEnvelope<{ rows: StudentFixedAccountRecord[]; total: number }>);
    } catch (error) {
        console.error('获取学生固定支付账户失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '获取学生固定支付账户失败' };
    }
};

// 添加学生固定支付账户
export const addStudentFixedAccount = async (params: AddStudentFixedAccountParams): Promise<ApiResponse<unknown>> => {
    try {
        const { data } = await request('/api/core/add_student_fixed_account', {
            method: 'POST',
            body: params,
        });
        return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
    } catch (error) {
        console.error('添加学生固定支付账户失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '添加学生固定支付账户失败' };
    }
};

// 删除学生固定支付账户
export const deleteStudentFixedAccount = async (recordId: number): Promise<ApiResponse<unknown>> => {
    try {
        const { data } = await request('/api/core/delete_student_fixed_account', {
            method: 'POST',
            body: { record_id: recordId },
        });
        return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
    } catch (error) {
        console.error('删除学生固定支付账户失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '删除学生固定支付账户失败' };
    }
};
