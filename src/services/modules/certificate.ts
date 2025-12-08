import { request, normalizeApiResponse } from '@/services/apiClient';
import type { ApiEnvelope } from '@/services/types';

export interface CertificateItem {
    record_id: number;
    certificate_type: string;
    note: string;
    student_id: number;
    student_name: string;
    mentor_id: number;
    mentor_name: string;
    campus_name: string;
    status: number; // 0: 申请中, 1: 完成, 2: 驳回, -1: 撤销
    status_name: string;
    reject_reason: string;
    create_time: string;
    update_time: string;
    operator_id: number;
    operator_name: string;
}

export interface CertificateTableResponse {
    rows: CertificateItem[];
}

export const CERTIFICATE_STATUS = {
    0: "申请中",
    1: "完成",
    2: "驳回",
    '-1': "撤销",
} as const;

/**
 * 获取证书申请列表
 */
export const getCertificateTable = async () => {
    try {
        const { data } = await request<ApiEnvelope<CertificateTableResponse>>('/api/certificate/get_certificate_table');
        const normalized = normalizeApiResponse<CertificateTableResponse>(data);
        if (normalized.code === 200 && normalized.data) {
            return {
                code: 200,
                message: normalized.message,
                data: normalized.data.rows || [],
            };
        }
        return { code: normalized.code, message: normalized.message, data: [] };
    } catch (error) {
        console.error('获取证书申请列表失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '获取证书申请列表失败' };
    }
};

/**
 * 更新证书申请状态
 * @param params
 * @param params.record_id 记录ID
 * @param params.status 新的状态 (1: 完成, 2: 驳回)
 * @param params.reject_reason 拒绝原因 (当 status 为 2 时必传)
 */
export const updateCertificateStatus = async (params: {
    record_id: string;
    status: number;
    reject_reason?: string;
}) => {
    try {
        const { data } = await request<ApiEnvelope<unknown>>('/api/certificate/update_status', {
            method: 'POST',
            body: params,
        });
        return normalizeApiResponse<unknown>(data);
    } catch (error) {
        console.error('更新证书申请状态失败:', error);
        return { code: 500, message: error instanceof Error ? error.message : '更新证书申请状态失败' };
    }
};
