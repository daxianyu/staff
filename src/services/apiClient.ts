import type { ApiEnvelope, ApiResponse } from './types';

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

export const isBrowser = typeof window !== 'undefined';

export const getStoredToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const clearStoredAuth = () => {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getAuthHeader = (): HeadersInit => {
  const token = getStoredToken();
  return token ? { Authorization: token } : {};
};

export const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export type ResponseParser = 'json' | 'text' | 'blob' | 'raw';

export interface RequestOptions {
  method?: string;
  body?: BodyInit | Record<string, unknown> | unknown;
  headers?: HeadersInit;
  auth?: boolean;
  parser?: ResponseParser;
  signal?: AbortSignal;
}

const mergeHeaders = (source: HeadersInit | undefined, target: Headers) => {
  if (!source) return;
  if (source instanceof Headers) {
    source.forEach((value, key) => target.set(key, value));
    return;
  }
  if (Array.isArray(source)) {
    source.forEach(([key, value]) => target.set(key, value));
    return;
  }
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined) {
      target.set(key, String(value));
    }
  });
};

export const request = async <T = unknown>(input: RequestInfo | URL, options: RequestOptions = {}) => {
  const { method = 'GET', body, headers, auth = true, parser = 'json', signal } = options;

  const finalHeaders = new Headers();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && method !== 'GET') {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    mergeHeaders(getAuthHeader(), finalHeaders);
  }

  mergeHeaders(headers, finalHeaders);

  const init: RequestInit = {
    method,
    headers: finalHeaders,
    signal,
  };

  if (body !== undefined) {
    init.body = isFormData || typeof body === 'string' || body instanceof Blob
      ? (body as BodyInit)
      : JSON.stringify(body);
  }

  const response = await fetch(input, init);

  let data: T | null = null;
  try {
    if (parser === 'json') {
      data = (await response.json()) as T;
    } else if (parser === 'text') {
      data = (await response.text()) as unknown as T;
    } else if (parser === 'blob') {
      data = (await response.blob()) as unknown as T;
    } else {
      data = null;
    }
  } catch (error) {
    if (parser === 'json') {
      console.warn('Failed to parse JSON response', error);
    }
  }

  return { response, data };
};

export const normalizeApiResponse = <T>(payload: ApiEnvelope<T> | null | undefined): ApiResponse<T> => ({
  code: payload?.status === 0 ? 200 : 400,
  message: payload?.message || '',
  data: payload?.data,
});
