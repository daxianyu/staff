export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  token?: string;
}

export interface ApiEnvelope<T = unknown> {
  status: number;
  message: string;
  data?: T;
  token?: string;
  [key: string]: unknown;
}

// 共享的 SelectOption 类型
export interface SelectOption {
  id: number;
  name: string;
  [key: string]: any;
}
