import { buildQueryString, request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse } from '../types';

// 知识库相关类型定义
export interface PastpaperItem {
  id: number;
  name: string;
  file_url?: string;
  type?: string;
  create_time?: string;
}

// 新的知识库节点结构
export interface KnowledgeNode {
  text: string;
  article_id?: number;
  nodes?: KnowledgeNode[];
}

// 新的知识库树形结构
export type KnowledgeTreeData = KnowledgeNode[];

// 保留旧的接口定义以向后兼容
export interface KnowledgeSpaceData {
  [spaceId: string]: ArticleItem[];
}

export interface ArticleItem {
  article_id: number;
  article_title: string;
  author: string;
  pub_time: string;
}

export interface ArticleDetail {
  id: number;
  title: string;
  article_info: string;
  author: number;
  author_name: string;
  create_time: string;
  like: number;
  like_num: number;
}

// ===== Pastpaper / Workspace (对齐 phy 后端实现) =====
export interface PastpaperAllSelectData {
  cascade_info: Record<string, Record<string, string[]>>;
  year_list: Array<number | string>;
  season_list: string[];
  type_list: string[];
}

export interface UploadPastpaperResult {
  file_path: string;
}

export interface AddNewPastpaperParams {
  root_new?: string;
  root_select?: string;
  second_new?: string;
  second_select?: string;
  subject_new?: string;
  subject_select?: string;
  code_new?: string;
  year_select?: string | number;
  season_select?: string;
  type_select?: string;
  file_path: string;
}

export interface DeletePastpaperParams {
  record_ids: number[];
}

export interface EditPastpaperSubjectParams {
  record_id: number;
  subject_new: string;
}

export interface PastpaperTableParams {
  root: string;
  second?: string | number; // -1 表示全部
  subject?: string | number; // -1 表示全部
  year?: string | number; // -1 表示全部
  season?: string | number; // -1 表示全部
}

export interface PastpaperTableRow {
  id: number;
  record_id: number;
  root: string;
  second: string;
  subject: string;
  code: string;
  year: string;
  season: string;
  level: string;
  file_name: string;
}

export interface PastpaperTableResult {
  rows: PastpaperTableRow[];
  total: number;
}

export interface WorkspaceRow {
  record_id: number;
  space_name: string;
  parent_id: number;
  weight: number;
  parent_name: string;
}

export interface WorkspaceListResult {
  rows: WorkspaceRow[];
  total: number;
}

export interface AddWorkspaceParams {
  space_name: string;
  parent_id?: number | string;
}

export interface EditWorkspaceParams {
  record_id: number;
  space_name?: string;
  weight?: number | string;
}

export interface DeleteWorkspaceParams {
  record_id: number;
}

/**
 * 获取所有的pastpaper信息
 */
export const getAllPastpaper = async (): Promise<ApiResponse<PastpaperItem[]>> => {
  try {
    const { data } = await request('/api/library/get_all_pastpaper', {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取pastpaper失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取pastpaper失败',
      data: []
    };
  }
};

/**
 * 获取所有的knowledge信息（新的树形结构）
 */
export const getAllKnowledge = async (): Promise<ApiResponse<KnowledgeTreeData>> => {
  try {
    const { data } = await request('/api/library/get_all_knowledge', {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取knowledge失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取knowledge失败',
      data: []
    };
  }
};

/**
 * 获取指定文章的详细信息
 * @param articleId 文章ID
 */
export const getArticleInfo = async (articleId: number): Promise<ApiResponse<ArticleDetail>> => {
  try {
    const { data } = await request(`/api/library/get_article_info/${articleId}`, {
      method: 'GET',
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '获取文章详情失败'
    };
  }
};

/**
 * 文章点赞操作
 * @param recordId 文章ID
 */
export const likeArticle = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/like_article', {
      method: 'POST',
      body: { record_id: recordId },
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('文章点赞失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '文章点赞失败'
    };
  }
};

export const unLikeArticle = async (recordId: number): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/unlike_article', {
      method: 'POST',
      body: { article_id: recordId },
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('文章取消点赞失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '文章取消点赞失败'
    };
  }
};

/**
 * 保存文章信息
 * @param articleData 文章数据
 */
export const saveArticle = async (articleData: {
  record_id?: number;
  article_info: string;
  title: string;
  space_id: number;
}): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/save_article', {
      method: 'POST',
      body: articleData,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('保存文章失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '保存文章失败'
    };
  }
};

/**
 * 新增文章
 * @param articleData 文章数据
 */
export const addNewArticle = async (articleData: {
  space_id: number;
  article_title: string;
}): Promise<ApiResponse<{ record_id: number }>> => {
  try {
    const { data } = await request('/api/library/add_new_article', {
      method: 'POST',
      body: articleData,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('新增文章失败:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '新增文章失败'
    };
  }
};

/**
 * 获取所有 pastpaper 的 select 选项（subject_leader/core_user）
 */
export const getAllPastpaperSelect = async (): Promise<ApiResponse<PastpaperAllSelectData>> => {
  try {
    const { data } = await request('/api/library/get_all_pastpaper_select', { method: 'GET' });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取pastpaper select失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取pastpaper select失败' };
  }
};

/**
 * pastpaper 上传与保存（subject_leader/core_user）
 * 备注：后端通常使用 multipart/form-data，建议传 FormData
 */
export const uploadPastpaper = async (formData: FormData): Promise<ApiResponse<UploadPastpaperResult>> => {
  try {
    const { data } = await request('/api/library/upload_pastpaper', {
      method: 'POST',
      body: formData,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('上传pastpaper失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '上传pastpaper失败' };
  }
};

/**
 * 新增新的 pastpaper（subject_leader/core_user）
 */
export const addNewPastpaper = async (payload: AddNewPastpaperParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/add_new_pastpaper', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('新增pastpaper失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增pastpaper失败' };
  }
};

/**
 * 获取 pastpaper edit 的 select（subject_leader/core_user）
 */
export const getPastpaperSelect = async (): Promise<ApiResponse<Record<string, any>>> => {
  try {
    const { data } = await request('/api/library/get_pastpaper_select', { method: 'GET' });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取pastpaper edit select失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取pastpaper edit select失败' };
  }
};

/**
 * 删除指定的 pastpaper（subject_leader/core_user）
 */
export const deletePastpaper = async (payload: DeletePastpaperParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/delete_pastpaper', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('删除pastpaper失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除pastpaper失败' };
  }
};

/**
 * 编辑 pastpaper 的 subject 信息（subject_leader/core_user）
 */
export const editPastpaperSubject = async (payload: EditPastpaperSubjectParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/edit_pastpaper_subject', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('编辑pastpaper subject失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑pastpaper subject失败' };
  }
};

/**
 * 获取 pastpaper 编辑的 table 信息（subject_leader/core_user）
 */
export const getPastpaperTable = async (params: PastpaperTableParams): Promise<ApiResponse<PastpaperTableResult>> => {
  try {
    const query = buildQueryString({
      root: params.root,
      second: params.second ?? -1,
      subject: params.subject ?? -1,
      year: params.year ?? -1,
      season: params.season ?? -1,
    });
    const { data } = await request(`/api/library/get_pastpaper_table${query}`, { method: 'GET' });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取pastpaper table失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取pastpaper table失败' };
  }
};

/**
 * 获取 workspace 的 select 信息（operation_right=25/core_user）
 */
export const getWorkspaceSelect = async (): Promise<ApiResponse<Array<{ id: number; name: string }>>> => {
  try {
    const { data } = await request('/api/library/get_workspace_select', { method: 'GET' });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取workspace select失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取workspace select失败' };
  }
};

/**
 * 添加 workspace（operation_right=25/core_user）
 */
export const addWorkspace = async (payload: AddWorkspaceParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/add_workspace', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('添加workspace失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '添加workspace失败' };
  }
};

/**
 * 获取所有 workspace 列表（operation_right=25/core_user）
 */
export const getAllWorkspace = async (): Promise<ApiResponse<WorkspaceListResult>> => {
  try {
    const { data } = await request('/api/library/get_all_workspace', { method: 'GET' });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('获取workspace列表失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取workspace列表失败' };
  }
};

/**
 * 编辑 workspace 的名称和权重（operation_right=25/core_user）
 */
export const editWorkspace = async (payload: EditWorkspaceParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/edit_workspace', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('编辑workspace失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '编辑workspace失败' };
  }
};

/**
 * 删除 workspace 记录（operation_right=25/core_user）
 */
export const deleteWorkspaceRecord = async (payload: DeleteWorkspaceParams): Promise<ApiResponse<string>> => {
  try {
    const { data } = await request('/api/library/delete_workspace_record', {
      method: 'POST',
      body: payload,
    });
    return normalizeApiResponse(data as any);
  } catch (error) {
    console.error('删除workspace失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除workspace失败' };
  }
};
