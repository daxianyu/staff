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
