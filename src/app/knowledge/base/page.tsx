'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpenIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  HeartIcon as HeartOutlineIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  ClockIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { openUrlWithFallback } from '@/utils/openUrlWithFallback';
import { 
  getAllKnowledge, 
  getArticleInfo, 
  likeArticle,
  unLikeArticle,
  getWorkspaceSelect,
  type KnowledgeTreeData,
  type KnowledgeNode,
  type ArticleDetail,
  type SelectOption
} from '@/services/auth';

// 树节点接口
interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'article';
  spaceId?: number;
  articleId?: number;
  children?: TreeNode[];
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeTreeData>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [workspaceMap, setWorkspaceMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 目录选择模态框状态
  const [showFolderSelectModal, setShowFolderSelectModal] = useState(false);
  const [selectedFolderForNew, setSelectedFolderForNew] = useState<TreeNode | null>(null);

  // 检查 tool_user 权限
  const toolUser = (user as any)?.tool_user;
  const canEdit = toolUser === 1 || toolUser === true || toolUser === '1';

  // 计算总文章数量
  const countTotalArticles = useCallback((nodes: TreeNode[]): number => {
    let count = 0;
    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (node.type === 'article') {
          count++;
        } else if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return count;
  }, []);

  // 将新的知识库数据转换为树形结构
  const convertToTreeData = useCallback((knowledgeNodes: KnowledgeTreeData, spaceMap: Map<string, number>): TreeNode[] => {
    const convertNode = (node: KnowledgeNode, parentId: string = '', parentSpaceId?: number): TreeNode => {
      const nodeId = parentId ? `${parentId}-${node.text}` : node.text;
      
      if (node.article_id) {
        // 叶子节点（文章）
        return {
          id: `article-${node.article_id}`,
          name: node.text,
          type: 'article' as const,
          articleId: node.article_id,
          spaceId: parentSpaceId
        };
      } else {
        // 文件夹节点 - 通过名称查找 space_id
        const spaceId = spaceMap.get(node.text) || parentSpaceId;
        return {
          id: `folder-${nodeId}`,
          name: node.text,
          type: 'folder' as const,
          spaceId: spaceId,
          children: node.nodes ? node.nodes.map(child => convertNode(child, nodeId, spaceId)) : []
        };
      }
    };

    return knowledgeNodes.map(node => convertNode(node));
  }, []);

  // 获取 workspace 列表
  const loadWorkspaceMap = useCallback(async () => {
    try {
      const response = await getWorkspaceSelect();
      if (response.code === 200 && response.data) {
        const map = new Map<string, number>();
        const options = Array.isArray(response.data) ? response.data : [];
        options.forEach((opt: SelectOption) => {
          map.set(opt.name, opt.id);
        });
        setWorkspaceMap(map);
        return map;
      }
    } catch (err) {
      console.error('加载 workspace 列表失败:', err);
    }
    return new Map<string, number>();
  }, []);

  // 获取知识库数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 先加载 workspace 映射
      const spaceMap = await loadWorkspaceMap();
      
      const response = await getAllKnowledge();
      console.log('知识库数据响应:', response);
      
      if (response.code === 200 && response.data) {
        setKnowledgeData(response.data);
        const tree = convertToTreeData(response.data, spaceMap);
        setTreeData(tree);
        
        // 默认展开第一层节点
        const expandedState = new Set<string>();
        tree.forEach(node => {
          expandedState.add(node.id);
        });
        setExpandedNodes(expandedState);
      } else {
        setError(response.message || '获取知识库数据失败');
      }
    } catch (err) {
      setError('获取知识库数据时发生错误');
      console.error('加载知识库失败:', err);
    } finally {
      setLoading(false);
    }
  }, [convertToTreeData, loadWorkspaceMap]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取文章详情
  const handleArticleClick = useCallback(async (articleId: number, node: TreeNode) => {
    setArticleLoading(true);
    setSelectedNode(node);
    
    try {
      const response = await getArticleInfo(articleId);
      if (response.code === 200 && response.data) {
        setSelectedArticle(response.data);
      } else {
        console.error('获取文章详情失败:', response.message);
        setSelectedArticle(null);
      }
    } catch (error) {
      console.error('加载文章详情失败:', error);
      setSelectedArticle(null);
    } finally {
      setArticleLoading(false);
    }
  }, []);

  // 文章点赞
  const handleLike = useCallback(async (articleId: number) => {
    if (!selectedArticle) return;
    
    try {
      const response = await likeArticle(articleId);
      if (response.code === 200) {
        // 更新点赞状态
        setSelectedArticle(prev => prev ? {
          ...prev,
          like: prev.like === 1 ? 0 : 1,
          like_num: prev.like === 1 ? prev.like_num - 1 : prev.like_num + 1
        } : null);
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }, [selectedArticle]);

  // 文章取消点赞
  const handleUnlike = useCallback(async (articleId: number) => {
    if (!selectedArticle) return;
    
    try {
      const response = await unLikeArticle(articleId);
      if (response.code === 200) {
        // 更新点赞状态
        setSelectedArticle(prev => prev ? {
          ...prev,
          like: prev.like === 1 ? 0 : 1,
          like_num: prev.like === 1 ? prev.like_num - 1 : prev.like_num + 1
        } : null);
      }
    } catch (error) {
      console.error('取消点赞失败:', error);
    }
  }, [selectedArticle]);

  // 切换节点展开状态
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

  // 处理节点点击
  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.type === 'article' && node.articleId) {
      handleArticleClick(node.articleId, node);
    } else {
      toggleNode(node.id);
    }
  }, [handleArticleClick, toggleNode]);

  // 打开目录选择模态框
  const handleAddNew = useCallback(() => {
    setSelectedFolderForNew(null);
    setShowFolderSelectModal(true);
  }, []);

  // 在目录选择模态框中选择目录
  const handleSelectFolder = useCallback((node: TreeNode) => {
    if (node.type === 'folder' && node.spaceId) {
      setSelectedFolderForNew(node);
    }
  }, []);

  // 确认选择目录并打开编辑页面（新标签页）
  const handleConfirmFolderSelection = useCallback(() => {
    if (!selectedFolderForNew || !selectedFolderForNew.spaceId) {
      setError('请选择一个目录');
      return;
    }
    setShowFolderSelectModal(false);
    // 在新标签页打开新增编辑页面
    openUrlWithFallback(`/knowledge/base/edit?new=true&spaceId=${selectedFolderForNew.spaceId}`);
    setSelectedFolderForNew(null);
  }, [selectedFolderForNew]);

  // 打开编辑页面（新标签页）
  const handleEdit = useCallback(() => {
    if (!selectedArticle) return;
    
    // 检查是否是作者
    if (selectedArticle.author !== user?.id) {
      setError('只有作者本人才能编辑文章');
      return;
    }
    
    // 从树节点中获取 space_id
    const spaceId = selectedNode?.spaceId;
    
    if (!spaceId) {
      setError('无法确定文章所在目录，请重新选择文章');
      return;
    }
    
    // 在新标签页打开编辑页面
    openUrlWithFallback(`/knowledge/base/edit?articleId=${selectedArticle.id}&spaceId=${spaceId}`);
  }, [selectedArticle, selectedNode, user]);

  // 递归渲染树节点（用于左侧目录树）
  const renderTreeNode = useCallback((nodes: TreeNode[]) => {
    return nodes.map(node => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const isSelected = selectedNode?.id === node.id;
      
      // 搜索过滤
      const matchesSearch = !searchTerm || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hasChildren && node.children?.some(child => 
          child.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      if (!matchesSearch) return null;
      
      return (
        <div key={node.id} className="border-b border-gray-100 pb-1 last:border-0">
          <button
            onClick={() => handleNodeClick(node)}
            className={`flex items-center w-full text-left py-2 px-2 rounded-md transition-colors ${
              isSelected 
                ? 'bg-blue-50 text-blue-700' 
                : 'hover:bg-gray-50'
            }`}
          >
            {node.type === 'article' ? (
              <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            ) : hasChildren ? (
              isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
              )
            ) : (
              <FolderIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            )}
            
            <span className={`${node.type === 'article' ? 'text-sm' : 'font-medium'} truncate`}>
              {node.name}
            </span>
          </button>
          
          {hasChildren && isExpanded && (
            <div className="pl-4 mt-1 space-y-1">
              {renderTreeNode(node.children!)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedNodes, selectedNode, searchTerm, handleNodeClick]);

  // 递归渲染树节点（用于目录选择模态框）
  const renderFolderSelectTreeNode = useCallback((nodes: TreeNode[]) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isSelected = selectedFolderForNew?.id === node.id;
      
      // 只显示文件夹节点
      if (node.type === 'article') return null;
      
      return (
        <div key={node.id} className="border-b border-gray-100 pb-1 last:border-0">
          <button
            onClick={() => {
              if (node.type === 'folder') {
                handleSelectFolder(node);
              }
            }}
            className={`flex items-center w-full text-left py-2 px-2 rounded-md transition-colors ${
              isSelected 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <FolderIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            
            <span className="font-medium truncate">
              {node.name}
            </span>
            {isSelected && (
              <span className="ml-auto text-xs text-blue-600 font-medium">已选中</span>
            )}
          </button>
          
          {/* 始终展开所有子节点 */}
          {hasChildren && (
            <div className="pl-4 mt-1 space-y-1">
              {renderFolderSelectTreeNode(node.children!)}
            </div>
          )}
        </div>
      );
    });
  }, [selectedFolderForNew, handleSelectFolder]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-2 text-gray-600">浏览和学习知识库文章</p>
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

        {/* 搜索栏和操作按钮 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                共 {countTotalArticles(treeData)} 篇文章
              </div>
              {canEdit && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  新增文章
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 左右分栏布局 */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-80 bg-white shadow rounded-lg p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : treeData.length === 0 ? (
              <div className="text-center py-8">
                <BookOpenIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">暂无文章数据</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {renderTreeNode(treeData)}
              </div>
            )}
          </div>

          {/* 右侧文章内容区域 */}
          <div className="flex-1 bg-white shadow rounded-lg p-4">
            {articleLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedArticle ? (
              <div className="h-full flex flex-col">
                {/* 文章头部信息 */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 truncate mb-2">
                      {selectedArticle.title}
                    </h2>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="mr-4">{selectedArticle.author_name}</span>
                      <ClockIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{selectedArticle.create_time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && selectedArticle.author === user?.id && (
                      <button
                        onClick={handleEdit}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                        title="编辑文章"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">编辑</span>
                      </button>
                    )}
                    <button
                      onClick={() => selectedArticle.like === 1 ? handleUnlike(selectedArticle.id) : handleLike(selectedArticle.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                      {selectedArticle.like === 1 ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartOutlineIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600 font-medium">
                        {selectedArticle.like_num}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 文章内容 - 使用 Markdown 渲染 */}
                <div className="flex-1 overflow-y-auto">
                  {selectedArticle.article_info && selectedArticle.article_info.trim() ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-gray-100 prose-pre:bg-gray-100 prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-6 prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2 prose-h3:mt-4 prose-p:mb-4 prose-p:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:text-gray-600 prose-blockquote:italic prose-ul:list-disc prose-ul:list-inside prose-ul:mb-4 prose-ol:list-decimal prose-ol:list-inside prose-ol:mb-4 prose-li:text-gray-700">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                      >
                        {selectedArticle.article_info}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">该文章暂无内容</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <BookOpenIcon className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择文章阅读</h3>
                <p className="text-center">请从左侧目录中选择一篇文章开始阅读</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 目录选择模态框 */}
      {showFolderSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">选择目录</h3>
              <button
                onClick={() => {
                  setShowFolderSelectModal(false);
                  setSelectedFolderForNew(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                请选择一个目录来创建新文章
              </p>
              {treeData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>暂无目录</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {renderFolderSelectTreeNode(treeData)}
                </div>
              )}
              {selectedFolderForNew && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    已选择：<span className="font-medium">{selectedFolderForNew.name}</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFolderSelectModal(false);
                  setSelectedFolderForNew(null);
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmFolderSelection}
                disabled={!selectedFolderForNew || !selectedFolderForNew.spaceId}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
