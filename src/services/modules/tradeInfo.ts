import { buildQueryString, normalizeApiResponse, request } from '../apiClient';
import type { ApiEnvelope, ApiResponse } from '../types';

export interface TradeInfoRow {
  record_id: number;
  type_name: string;
  price: number;
  out_trade_no: string;
  subject: string;
  account_name: string;
  refund_status: string;
  can_refund: number;
  refund_price: number;
  refund_reason: string;
  create_time: string;
  update_time: string;
  user_name: string;
}

export interface TradeInfoListData {
  rows: TradeInfoRow[];
  total: number;
}

export interface TradeInfoListParams extends Record<string, unknown> {
  start_date?: string;
  end_date?: string;
  pay_account?: number;
}

export interface TradeInfoDetailData {
  record_id: number;
  type_name: string;
  price: number;
  out_trade_no: string;
  subject: string;
  account_name: string;
  refund_status: string;
  refund_price: number;
  refund_reason: string;
  create_time: string;
  update_time: string;
  user_name: string;
  trade_no: string;
}

export interface TradeAccountOption {
  id: number;
  value: string;
}

export interface TradeAccountListData {
  pay_account: TradeAccountOption[];
}

export interface RefundTradeRecordParams {
  record_id: number;
  refund_amount: number | string;
  refund_reason: string;
}

export const getTradeInfoList = async (params?: TradeInfoListParams): Promise<ApiResponse<TradeInfoListData>> => {
  try {
    const { data } = await request<ApiEnvelope<TradeInfoListData>>(
      `/api/core/trade_info_list${buildQueryString(params)}`
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取支付记录失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取支付记录失败' };
  }
};

export const getTradeInfoDetail = async (recordId: number): Promise<ApiResponse<TradeInfoDetailData>> => {
  try {
    const { data } = await request<ApiEnvelope<TradeInfoDetailData>>(`/api/core/trade_info_detail/${recordId}`);
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取支付记录详情失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取支付记录详情失败' };
  }
};

export const refundTradeRecord = async (params: RefundTradeRecordParams): Promise<ApiResponse> => {
  try {
    const { data } = await request<ApiEnvelope>(
      '/api/core/refund_record',
      {
        method: 'POST',
        body: params,
      }
    );
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('支付退款操作失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '支付退款操作失败' };
  }
};

export const getTradeAccountList = async (): Promise<ApiResponse<TradeAccountListData>> => {
  try {
    const { data } = await request<ApiEnvelope<TradeAccountListData>>('/api/core/trade_account_list');
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('获取支付账户列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取支付账户列表失败' };
  }
};

