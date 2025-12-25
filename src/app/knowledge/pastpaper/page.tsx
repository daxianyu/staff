'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  XMarkIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { addNewPastpaper, getAllPastpaper, getAllPastpaperSelect, uploadPastpaper, type PastpaperAllSelectData, type PastpaperItem } from '@/services/auth';

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
  const { user, hasPermission } = useAuth();
  const canOperate = hasPermission(PERMISSIONS.VIEW_PASTPAPER_EDIT) || hasPermission(PERMISSIONS.EDIT_PASTPAPER_EDIT);

  const [activeTab, setActiveTab] = useState<'list' | 'operate'>('list');

  const [items, setItems] = useState<PastpaperItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<{[key: string]: boolean}>({});
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 操作 Tab 数据
  const [operateLoading, setOperateLoading] = useState(false);
  const [operateMsg, setOperateMsg] = useState<string | null>(null);
  const [selectData, setSelectData] = useState<PastpaperAllSelectData | null>(null);

  // 级联选择
  const [rootSelect, setRootSelect] = useState('');
  const [secondSelect, setSecondSelect] = useState('');
  const [subjectSelect, setSubjectSelect] = useState('');
  const [yearSelect, setYearSelect] = useState<string>('');
  const [seasonSelect, setSeasonSelect] = useState('');
  const [typeSelect, setTypeSelect] = useState('');
  const [codeNew, setCodeNew] = useState('');

  // 新增输入（可选）
  const [rootNew, setRootNew] = useState('');
  const [secondNew, setSecondNew] = useState('');
  const [subjectNew, setSubjectNew] = useState('');

  // 上传
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

  const loadOperateSelect = useCallback(async () => {
    if (!canOperate) return;
    try {
      const resp = await getAllPastpaperSelect();
      if (resp.code === 200 && resp.data) {
        setSelectData(resp.data);
      } else {
        setSelectData(null);
      }
    } catch (e) {
      console.error(e);
      setSelectData(null);
    }
  }, [canOperate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'operate') {
      loadOperateSelect();
    }
  }, [activeTab, loadOperateSelect]);

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

  const rootOptions = Object.keys(selectData?.cascade_info ?? {});
  const secondOptions = rootSelect ? Object.keys(selectData?.cascade_info?.[rootSelect] ?? {}) : [];
  const subjectOptions = rootSelect && secondSelect ? (selectData?.cascade_info?.[rootSelect]?.[secondSelect] ?? []) : [];

  type MissingKey = 'root' | 'second' | 'subject' | 'year' | 'season' | 'type' | 'file';

  const missingKeys = useCallback((): MissingKey[] => {
    const misses: MissingKey[] = [];
    const finalRootNew = rootNew.trim();
    const finalSecondNew = secondNew.trim();
    const finalSubjectNew = subjectNew.trim();
    if (!finalRootNew && !rootSelect) misses.push('root');
    if (!finalSecondNew && !secondSelect) misses.push('second');
    if (!finalSubjectNew && !subjectSelect) misses.push('subject');
    if (!yearSelect) misses.push('year');
    if (!seasonSelect) misses.push('season');
    if (!typeSelect) misses.push('type');
    if (!uploadedFilePath) misses.push('file');
    return misses;
  }, [rootNew, rootSelect, secondNew, secondSelect, subjectNew, subjectSelect, yearSelect, seasonSelect, typeSelect, uploadedFilePath]);

  const missingSet = useMemo(() => new Set(missingKeys()), [missingKeys]);
  const isMissing = useCallback((key: MissingKey) => submitAttempted && missingSet.has(key), [submitAttempted, missingSet]);
  const canSubmit = useMemo(() => missingKeys().length === 0 && !operateLoading, [missingKeys, operateLoading]);

  const handleUploadFile = async () => {
    if (!canOperate) return;
    setOperateMsg(null);
    if (!uploadFile) {
      setOperateMsg('请选择要上传的文件');
      return;
    }
    setOperateLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const up = await uploadPastpaper(fd);
      if (up.code !== 200 || !up.data?.file_path) {
        setOperateMsg(up.message || '上传失败');
        return;
      }
      setUploadedFilePath(up.data.file_path);
      setOperateMsg('上传成功');
    } catch (e) {
      console.error(e);
      setOperateMsg('上传失败');
    } finally {
      setOperateLoading(false);
    }
  };

  const handleSubmitOperate = async () => {
    if (!canOperate) return;
    setOperateMsg(null);
    setSubmitAttempted(true);

    const misses = missingKeys();
    if (misses.length > 0) {
      setOperateMsg('请完善红框必填项');
      return;
    }

    const finalRootNew = rootNew.trim();
    const finalSecondNew = secondNew.trim();
    const finalSubjectNew = subjectNew.trim();

    setOperateLoading(true);
    try {
      const resp = await addNewPastpaper({
        root_new: finalRootNew,
        root_select: rootSelect,
        second_new: finalSecondNew,
        second_select: secondSelect,
        subject_new: finalSubjectNew,
        subject_select: subjectSelect,
        code_new: codeNew.trim(),
        year_select: yearSelect,
        season_select: seasonSelect,
        type_select: typeSelect,
        file_path: uploadedFilePath,
      });
      if (resp.code !== 200) {
        setOperateMsg(resp.message || '提交失败');
        return;
      }

      setOperateMsg('提交成功');
      // 重置部分状态
      setUploadFile(null);
      setUploadedFilePath('');
      setCodeNew('');
      setRootNew('');
      setSecondNew('');
      setSubjectNew('');
      setSubmitAttempted(false);

      // 刷新列表与下拉
      await Promise.all([loadData(), loadOperateSelect()]);
      setActiveTab('list');
    } catch (e) {
      console.error(e);
      setOperateMsg('提交失败');
    } finally {
      setOperateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 + Tabs */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pastpaper</h1>
          <p className="mt-2 text-gray-600">查看和下载历年试卷</p>

          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <button
                className={`py-2 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('list')}
              >
                列表
              </button>
              <button
                disabled={!canOperate}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'operate' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!canOperate ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setActiveTab('operate')}
              >
                操作
              </button>
            </nav>
          </div>
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

        {activeTab === 'list' ? (
          <>
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
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {!canOperate ? (
              <div className="text-center py-10">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <div className="text-gray-700">权限不足：需要 subject_leader 或 core_user</div>
                <div className="text-xs text-gray-400 mt-2">当前用户：{user?.name ?? '-'}</div>
              </div>
            ) : (
              <div className="space-y-6">
                {operateMsg && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    {operateMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">根目录</div>
                      <select
                        value={rootSelect}
                        onChange={(e) => {
                          setRootSelect(e.target.value);
                          setSecondSelect('');
                          setSubjectSelect('');
                        }}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 ${
                          isMissing('root')
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">请选择...</option>
                        {rootOptions.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">二级目录</div>
                      <select
                        value={secondSelect}
                        onChange={(e) => {
                          setSecondSelect(e.target.value);
                          setSubjectSelect('');
                        }}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 ${
                          isMissing('second')
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">请选择...</option>
                        {secondOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">subject</div>
                      <select
                        value={subjectSelect}
                        onChange={(e) => setSubjectSelect(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 ${
                          isMissing('subject')
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">请选择...</option>
                        {subjectOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">code</div>
                      <input
                        value={codeNew}
                        onChange={(e) => setCodeNew(e.target.value)}
                        placeholder="code非必须"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">year</div>
                      <select
                        value={yearSelect}
                        onChange={(e) => setYearSelect(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 ${
                          isMissing('year')
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">请选择...</option>
                        {(selectData?.year_list ?? []).map(y => (
                          <option key={String(y)} value={String(y)}>{String(y)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">Season</div>
                      <select
                        value={seasonSelect}
                        onChange={(e) => setSeasonSelect(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 ${
                          isMissing('season')
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">请选择...</option>
                        {(selectData?.season_list ?? []).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm text-gray-700">type</div>
                      <select
                        value={typeSelect}
                        onChange={(e) => setTypeSelect(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 ${
                          isMissing('type')
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">请选择...</option>
                        {(selectData?.type_list ?? []).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setRootSelect('');
                          setSecondSelect('');
                          setSubjectSelect('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                      >
                        新增
                      </button>
                      <input
                        value={rootNew}
                        onChange={(e) => setRootNew(e.target.value)}
                        placeholder="新增根目录"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSecondSelect('');
                          setSubjectSelect('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                      >
                        新增
                      </button>
                      <input
                        value={secondNew}
                        onChange={(e) => setSecondNew(e.target.value)}
                        placeholder="新增二级目录"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSubjectSelect('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                      >
                        新增
                      </button>
                      <input
                        value={subjectNew}
                        onChange={(e) => setSubjectNew(e.target.value)}
                        placeholder="新增subject"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="pt-6">
                      <div className={`border rounded-lg p-4 space-y-3 ${isMissing('file') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="text-sm font-medium text-gray-900">上传文件</div>
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <div className="w-full">
                            <input
                              type="file"
                              onChange={(e) => {
                                setUploadFile(e.target.files?.[0] ?? null);
                                setUploadedFilePath('');
                              }}
                              className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                            />
                          </div>
                          <button
                            onClick={handleUploadFile}
                            disabled={operateLoading || !uploadFile}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            上传
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 break-all">
                          file_path：{uploadedFilePath || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-gray-500">
                    {submitAttempted && missingKeys().length > 0 ? '请完善红框必填项' : ' '}
                  </div>
                  <button
                    onClick={handleSubmitOperate}
                    disabled={!canSubmit}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
