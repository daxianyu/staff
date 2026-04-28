import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// ---- 类型定义 ----

export interface PhyNewsItem {
  /** 后端返回字段名为 id */
  id?: number;
  record_id?: number;
  title: string;
  tag?: string;
  tagName?: string;
  news_desc?: string;
  summary?: string;
  link?: string;
  link_url?: string;
  coverUrl?: string;
  cover_url?: string;
  month?: string;
  day?: string;
  startTime?: string;
  /** 0=新闻 1=动态 2=活动 */
  news_type?: number;
  type?: number | string;
  show_home_page?: number;
}

// ---- 最新动态 新增/删除 ----
export interface UpdatePhyNewsParams {
  news_title: string;
  news_cover: string;
  news_desc: string;
  news_link: string;
  tag: string;
  /** 0=新闻 1=动态 2=活动 */
  news_type: number;
  show_home_page?: number;
}

export const updatePhyNews = async (params: UpdatePhyNewsParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/update_campus_news', {
      method: 'POST',
      body: { ...params, show_home_page: params.show_home_page ?? 1 },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('新增PHY动态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增PHY动态失败' };
  }
};

export const deletePhyNews = async (record_id: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/delete_campus_news', {
      method: 'POST',
      body: { record_id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除PHY动态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除PHY动态失败' };
  }
};

export interface PhyNewsTypeItem {
  id: number | string;
  name: string;
}

export interface PhyAboutUsItem {
  /** 后端返回字段名为 id */
  id?: number;
  record_id?: number;
  title: string;
  desc?: string;
  link?: string;
  href?: string;
  type?: number | string;
}

export interface PhyAboutUsTypeItem {
  id: number | string;
  name: string;
}

export interface PhyTeacherItem {
  record_id?: number;
  id?: number;
  title?: string;
  desc?: string;
  coverUrl?: string;
  link?: string;
  teacher_name?: string;
  teacher_title?: string;
  teacher_desc?: string;
  teacher_photo?: string;
  teacher_group?: number | string;
  group_leader?: number;
  teacher_responsible?: string;
}

export interface PhyCourseItem {
  record_id: number;
  title: string;
  summary?: string;
  coverUrl?: string;
  buttonText?: string;
  link?: string;
}

export interface PhyCourseInfoItem {
  record_id: number;
  type: string;
  cn_name: string;
  en_name?: string;
}

export interface PhySiteInfo {
  news?: PhyNewsItem[];
  news_type?: PhyNewsTypeItem[];
  aboutus?: PhyAboutUsItem[];
  aboutus_type?: PhyAboutUsTypeItem[];
  teachers?: PhyTeacherItem[];
  courses?: PhyCourseItem[];
  courses_info?: PhyCourseInfoItem[];
}

// ---- 获取网站配置信息 ----
export const getPhySiteInfo = async (): Promise<ApiResponse<PhySiteInfo>> => {
  try {
    const { data } = await request<ApiEnvelope<PhySiteInfo>>('/api/web_site/v1/get_site_info');
    return normalizeApiResponse<PhySiteInfo>(data as ApiEnvelope<PhySiteInfo>);
  } catch (error) {
    console.error('获取PHY网站配置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取PHY网站配置失败' };
  }
};

// ---- 课程设置（大卡片） ----
export interface UpdatePhyCoursesParams {
  title: string;
  summary: string;
  coverUrl: string;
  buttonText: string;
  link: string;
  record_id?: number;
}

export const updatePhyCourses = async (params: UpdatePhyCoursesParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/v1/update_courses', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新PHY课程设置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新PHY课程设置失败' };
  }
};

export const deletePhyCourses = async (record_id: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/v1/delete_courses', {
      method: 'POST',
      body: { record_id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除PHY课程设置失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除PHY课程设置失败' };
  }
};

// ---- 关于我们 ----
export interface UpdatePhyAboutUsParams {
  title: string;
  desc: string;
  link: string;
  href: string;
  type: number | string;
  record_id?: number;
}

export const updatePhyAboutUs = async (params: UpdatePhyAboutUsParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/v1/update_aboutus', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新PHY关于我们失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新PHY关于我们失败' };
  }
};

export const deletePhyAboutUs = async (record_id: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/v1/delete_aboutus', {
      method: 'POST',
      body: { record_id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除PHY关于我们失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除PHY关于我们失败' };
  }
};

// ---- 课程信息（IGCSE/A-Level科目列表） ----
export interface UpdatePhyCoursesInfoParams {
  type: string;
  cn_name: string;
  en_name: string;
  record_id?: number;
}

export const updatePhyCoursesInfo = async (params: UpdatePhyCoursesInfoParams): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/v1/update_courses_info', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新PHY课程信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新PHY课程信息失败' };
  }
};

export const deletePhyCoursesInfo = async (record_id: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/v1/delete_courses_info', {
      method: 'POST',
      body: { record_id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除PHY课程信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除PHY课程信息失败' };
  }
};
