import { request, normalizeApiResponse } from '../apiClient';
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
