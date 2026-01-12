'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getArticleInfo, 
  updateArticle,
  type ArticleDetail
} from '@/services/auth';
import { uploadImage } from '@/services/modules/frontPage';

// 导入编辑器样式
import 'react-markdown-editor-lite/lib/index.css';

// 动态导入 markdown 编辑器（避免 SSR 问题）
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
}) as any;

// 动态导入 markdown-it
let mdParser: any = null;
if (typeof window !== 'undefined') {
  // @ts-ignore - markdown-it 类型定义问题
  import('markdown-it').then((MarkdownIt: any) => {
    const MarkdownItClass = MarkdownIt.default || MarkdownIt;
    mdParser = new MarkdownItClass({
      html: true,
      linkify: true,
      typographer: true,
    });
  }).catch((err) => {
    console.error('Failed to load markdown-it:', err);
  });
}

export default function KnowledgeEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const articleId = searchParams.get('articleId') ? Number(searchParams.get('articleId')) : null;
  const spaceId = searchParams.get('spaceId') ? Number(searchParams.get('spaceId')) : null;
  const isNew = searchParams.get('new') === 'true';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSpaceId, setEditSpaceId] = useState<number | null>(null);

  // 加载文章数据
  useEffect(() => {
    const loadArticle = async () => {
      if (isNew) {
        // 新增模式
        setEditSpaceId(spaceId);
        setEditTitle('');
        setEditContent('');
        setLoading(false);
        return;
      }
      
      if (!articleId) {
        setError('缺少文章ID参数');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await getArticleInfo(articleId);
        if (response.code === 200 && response.data) {
          const articleData = response.data;
          
          // 检查是否是作者
          if (articleData.author !== user?.id) {
            setError('只有作者本人才能编辑文章');
            setLoading(false);
            return;
          }
          
          setArticle(articleData);
          setEditTitle(articleData.title);
          setEditContent(articleData.article_info || '');
          setEditSpaceId(spaceId || null);
        } else {
          setError(response.message || '获取文章详情失败');
        }
      } catch (err) {
        console.error('加载文章失败:', err);
        setError('加载文章时发生错误');
      } finally {
        setLoading(false);
      }
    };
    
    loadArticle();
  }, [articleId, spaceId, isNew, user]);

  // 保存文章
  const handleSave = useCallback(async () => {
    if (!editTitle.trim()) {
      setError('请输入文章标题');
      return;
    }
    if (!editSpaceId) {
      setError('缺少目录信息');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const params: {
        record_id?: number;
        article_info: string;
        title: string;
        space_id: number;
      } = {
        article_info: editContent,
        title: editTitle.trim(),
        space_id: editSpaceId,
      };

      if (!isNew && articleId) {
        params.record_id = articleId;
      }

      const response = await updateArticle(params);
      
      if (response.code === 200) {
        setSuccess(isNew ? '文章创建成功' : '文章更新成功');
        // 延迟关闭窗口或返回，让用户看到成功提示
        setTimeout(() => {
          // 尝试关闭窗口（如果是通过 window.open 打开的）
          try {
            if (window.opener) {
              // 如果有 opener，说明是通过 window.open 打开的，可以关闭
              window.close();
              // 刷新父窗口
              if (window.opener && !window.opener.closed) {
                window.opener.location.reload();
              }
            } else {
              // 否则返回列表页
              router.push('/knowledge/base');
            }
          } catch (err) {
            // 如果无法关闭，返回列表页
            router.push('/knowledge/base');
          }
        }, 1500);
      } else {
        setError(response.message || (isNew ? '创建文章失败' : '更新文章失败'));
      }
    } catch (err) {
      console.error('保存文章失败:', err);
      setError('保存文章时发生错误');
    } finally {
      setSaving(false);
    }
  }, [editTitle, editContent, editSpaceId, isNew, articleId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !article && !isNew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">错误</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? '新增文章' : '编辑文章'}
              </h1>
            </div>
          </div>
        </div>

        {/* 错误和成功提示 */}
        {(error || success) && (
          <div className={`rounded-lg p-4 mb-6 border ${
            error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start">
              <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 mr-2 flex-shrink-0 ${
                error ? 'text-red-500' : 'text-green-600'
              }`} />
              <p className={`text-sm flex-1 ${error ? 'text-red-700' : 'text-green-700'}`}>
                {error || success}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* 编辑表单 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文章标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="请输入文章标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文章内容（Markdown格式）
              </label>
              <div className="mt-1 border border-gray-300 rounded-md overflow-hidden" style={{ height: '600px' }}>
                {typeof window !== 'undefined' ? (
                  <MdEditor
                    value={editContent}
                    style={{ height: '100%' }}
                    renderHTML={(text: string) => {
                      if (!mdParser) {
                        return text;
                      }
                      try {
                        return mdParser.render(text);
                      } catch (err) {
                        console.error('Markdown render error:', err);
                        return text;
                      }
                    }}
                    onChange={({ text }: { text: string }) => {
                      setEditContent(text || '');
                    }}
                    onImageUpload={async (file: File) => {
                      try {
                        const response = await uploadImage(file);
                        if (response.code === 200 && response.data) {
                          return response.data.url || response.data.file_path;
                        } else {
                          throw new Error(response.message || '上传失败');
                        }
                      } catch (error) {
                        console.error('图片上传失败:', error);
                        throw error;
                      }
                    }}
                    config={{
                      view: {
                        menu: true,
                        md: true,
                        html: true,
                      },
                      canView: {
                        menu: true,
                        md: true,
                        html: true,
                        fullScreen: true,
                        hideMenu: false,
                      },
                    }}
                    placeholder="请输入文章内容，支持 Markdown 格式"
                  />
                ) : (
                  <div className="p-4 h-full flex items-center justify-center text-gray-400">
                    <p>加载编辑器中...</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                提示：支持 Markdown 语法，可以使用工具栏快速格式化文本，点击图片图标上传图片
              </p>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !editTitle.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

