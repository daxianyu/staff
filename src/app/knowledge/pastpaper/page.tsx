'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getAllPastpaper, type PastpaperItem } from '@/services/auth';

// API返回的节点结构（如果API支持树形结构）
interface ApiNode {
  text: string;
  nodes?: ApiNode[];
  href?: string;
}

// 树节点接口
interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  fileUrl?: string;
  originalData?: PastpaperItem;
}

// 分组后的试卷数据
interface GroupedPapers {
  [category: string]: PastpaperItem[];
}

export default function PastpaperPage() {
  const [items, setItems] = useState<PastpaperItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<{[key: string]: boolean}>({});
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 处理API响应数据，根据数据结构转换为树形或分组结构
  const processApiResponse = useCallback((data: any): TreeNode[] => {
    // 如果API返回的是树形结构
    if (Array.isArray(data) && data.length > 0 && data[0].nodes) {
      return processTreeStructure(data as ApiNode[]);
    }
    
    // 如果API返回的是简单列表，按类别分组
    if (Array.isArray(data)) {
      return processListStructure(data as PastpaperItem[]);
    }
    
    return [];
  }, []);

  // 处理树形结构数据
  const processTreeStructure = useCallback((nodes: ApiNode[], parentPath: string = ''): TreeNode[] => {
    return nodes.map((node, index) => {
      const id = parentPath ? `${parentPath}-${index}` : `node-${index}`;
      const isFile = !!node.href || ((!node.nodes || node.nodes.length === 0) && node.text.includes('.pdf'));
      
      const treeNode: TreeNode = {
        id,
        name: node.text,
        type: isFile ? 'file' : 'folder',
        fileUrl: node.href
      };
      
      if (node.nodes && node.nodes.length > 0) {
        treeNode.children = processTreeStructure(node.nodes, id);
      }
      
      return treeNode;
    });
  }, []);

  // 处理列表结构数据，按类别分组
  const processListStructure = useCallback((papers: PastpaperItem[]): TreeNode[] => {
    // 按type或name的前缀分组
    const grouped: GroupedPapers = {};
    
    papers.forEach(paper => {
      let category = paper.type || 'Other';
      
      // 如果没有type，尝试从文件名提取类别
      if (!paper.type && paper.name) {
        const match = paper.name.match(/^([A-Za-z\s]+)/);
        if (match) {
          category = match[1].trim();
        }
      }
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(paper);
    });
    
    // 转换为树形结构
    return Object.entries(grouped).map(([category, papers], index) => ({
      id: `category-${index}`,
      name: `${category} (${papers.length})`,
      type: 'folder' as const,
      children: papers.map((paper, paperIndex) => ({
        id: `${category}-${paperIndex}`,
        name: paper.name,
        type: 'file' as const,
        fileUrl: paper.file_url,
        originalData: paper
      }))
    }));
  }, []);

  // 加载试卷数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllPastpaper();
      console.log('试卷数据响应:', response);
      
      if (response.code === 200 && response.data) {
        setItems(Array.isArray(response.data) ? response.data : []);
        const processedTree = processApiResponse(response.data);
        setTreeData(processedTree);
        
        // 默认展开第一层节点
        const expandedState: {[key: string]: boolean} = {};
        processedTree.forEach(node => {
          expandedState[node.id] = true;
        });
        setExpandedNodes(expandedState);
      } else {
        setError(response.message || '获取试卷数据失败');
      }
    } catch (err) {
      setError('获取试卷数据时发生错误');
      console.error('加载试卷失败:', err);
    } finally {
      setLoading(false);
    }
  }, [processApiResponse]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换节点展开/折叠状态
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // 处理节点点击
  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'file' && node.fileUrl) {
      setSelectedNode(node);
    } else {
      toggleNode(node.id);
    }
  };

  // 处理下载
  const handleDownload = (node: TreeNode) => {
    if (node.fileUrl) {
      window.open(node.fileUrl, '_blank');
    }
  };

  // 递归渲染树节点
  const renderTreeNode = (nodes: TreeNode[]) => {
    return nodes.map(node => {
      const isExpanded = expandedNodes[node.id];
      const hasChildren = node.children && node.children.length > 0;
      
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
              selectedNode?.id === node.id 
                ? 'bg-blue-50 text-blue-700' 
                : 'hover:bg-gray-50'
            }`}
          >
            {node.type === 'file' ? (
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
            
            <span className={`${node.type === 'file' ? 'text-sm' : 'font-medium'} truncate`}>
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pastpaper</h1>
          <p className="mt-2 text-gray-600">查看和下载历年试卷</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索试卷..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-500">
              共 {items.length} 个试卷
            </div>
          </div>
        </div>

        {/* 左右分栏布局 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧试卷树 */}
          <div className="w-full lg:w-80 bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">试卷分类</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : treeData.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">暂无试卷数据</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {renderTreeNode(treeData)}
              </div>
            )}
          </div>

          {/* 右侧预览区域 */}
          <div className="flex-1 bg-white shadow rounded-lg p-4">
            {selectedNode && selectedNode.fileUrl ? (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium truncate pr-4">{selectedNode.name}</h2>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(selectedNode)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      下载
                    </button>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                  {selectedNode.fileUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={selectedNode.fileUrl} 
                      className="w-full h-full min-h-[70vh]"
                      title={selectedNode.name}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">此文件格式不支持预览，请下载后查看</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <DocumentMagnifyingGlassIcon className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择试卷查看</h3>
                <p className="text-center">请从左侧选择一个试卷文件进行预览或下载</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
