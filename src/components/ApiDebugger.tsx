import { useState, useEffect } from 'react';
import { ENV } from '@/config/env';

interface ApiDebuggerProps {
  onClose?: () => void;
}

interface QueryParam {
  key: string;
  value: string;
}

interface HeaderParam {
  key: string;
  value: string;
}

interface RequestTab {
  id: string;
  name: string;
  path: string;
  method: string;
  requestBody: string;
  queryParams: QueryParam[];
  headerParams: HeaderParam[];
  response: any | null;
  error: string;
}

export const ApiDebugger: React.FC<ApiDebuggerProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tabs, setTabs] = useState<RequestTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [path, setPath] = useState('/api/');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [queryParams, setQueryParams] = useState<QueryParam[]>([{ key: '', value: '' }]);
  const [headerParams, setHeaderParams] = useState<HeaderParam[]>([
    { key: 'Authorization', value: '' }
  ]);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 从localStorage加载请求tabs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTabs = localStorage.getItem('apiDebuggerTabs');
        if (savedTabs) {
          const parsedTabs = JSON.parse(savedTabs);
          setTabs(parsedTabs);
          
          // 如果有tabs，激活第一个
          if (parsedTabs.length > 0) {
            setActiveTabId(parsedTabs[0].id);
            loadTabData(parsedTabs[0]);
          } else {
            // 如果没有保存的tabs，创建一个新的
            createNewTab();
          }
        } else {
          // 没有保存的tabs，创建一个新的
          createNewTab();
        }
        
        // 获取token
        const token = localStorage.getItem('token');
        if (token) {
          setHeaderParams(prev => 
            prev.map(param => 
              param.key === 'Authorization' 
                ? { ...param, value: token }
                : param
            )
          );
        }
      } catch (e) {
        console.error('加载保存的请求失败:', e);
        createNewTab();
      }
    }
  }, []);

  // 当活动tab或请求参数变化时保存到localStorage
  useEffect(() => {
    if (activeTabId && tabs.length > 0) {
      saveCurrentTabData();
    }
  }, [path, method, requestBody, queryParams, headerParams, activeTabId]);

  if (!ENV.enableApiDebugger) {
    return null;
  }

  // 创建新tab
  const createNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: RequestTab = {
      id: newTabId,
      name: `请求 ${tabs.length + 1}`,
      path: '/api/',
      method: 'GET',
      requestBody: '',
      queryParams: [{ key: '', value: '' }],
      headerParams: [{ key: 'Authorization', value: '' }],
      response: null,
      error: ''
    };
    
    // 获取token并设置
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        newTab.headerParams[0].value = token;
      }
    }
    
    const updatedTabs = [...tabs, newTab];
    setTabs(updatedTabs);
    setActiveTabId(newTabId);
    loadTabData(newTab);
    
    // 保存到localStorage
    localStorage.setItem('apiDebuggerTabs', JSON.stringify(updatedTabs.map(tab => ({
      ...tab,
      response: null,
      error: ''
    }))));
  };

  // 切换tab
  const switchTab = (tabId: string) => {
    // 保存当前tab数据
    saveCurrentTabData();
    
    // 切换到新tab并加载数据
    setActiveTabId(tabId);
    const tabToLoad = tabs.find(tab => tab.id === tabId);
    if (tabToLoad) {
      loadTabData(tabToLoad);
    }
  };

  // 保存当前tab数据
  const saveCurrentTabData = () => {
    if (!activeTabId) return;
    
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          path,
          method,
          requestBody,
          queryParams,
          headerParams,
          response,
          error
        };
      }
      return tab;
    });
    
    setTabs(updatedTabs);
    localStorage.setItem('apiDebuggerTabs', JSON.stringify(updatedTabs.map(tab => ({
      ...tab,
      response: null,
      error: ''
    }))));
  };

  // 加载tab数据
  const loadTabData = (tab: RequestTab) => {
    setPath(tab.path);
    setMethod(tab.method);
    setRequestBody(tab.requestBody);
    setQueryParams(tab.queryParams);
    setHeaderParams(tab.headerParams);
    setResponse(tab.response);
    setError(tab.error);
  };

  // 删除tab
  const deleteTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tabs.length <= 1) {
      // 至少保留一个tab
      return;
    }
    
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(updatedTabs);
    
    // 如果删除的是当前激活的tab，切换到第一个
    if (tabId === activeTabId && updatedTabs.length > 0) {
      setActiveTabId(updatedTabs[0].id);
      loadTabData(updatedTabs[0]);
    }
    
    localStorage.setItem('apiDebuggerTabs', JSON.stringify(updatedTabs.map(tab => ({
      ...tab,
      response: null,
      error: ''
    }))));
  };

  // 重命名tab
  const renameTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1) {
      const newName = prompt('请输入新的请求名称:', tabs[tabIndex].name);
      if (newName && newName.trim()) {
        const updatedTabs = [...tabs];
        updatedTabs[tabIndex] = {
          ...updatedTabs[tabIndex],
          name: newName.trim()
        };
        setTabs(updatedTabs);
        localStorage.setItem('apiDebuggerTabs', JSON.stringify(updatedTabs.map(tab => ({
          ...tab,
          response: null,
          error: ''
        }))));
      }
    }
  };

  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  const handleQueryParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...queryParams];
    newParams[index][field] = value;
    setQueryParams(newParams);
  };

  const handleRemoveQueryParam = (index: number) => {
    if (queryParams.length > 1) {
      const newParams = [...queryParams];
      newParams.splice(index, 1);
      setQueryParams(newParams);
    }
  };

  const handleAddHeaderParam = () => {
    setHeaderParams([...headerParams, { key: '', value: '' }]);
  };

  const handleHeaderParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...headerParams];
    newParams[index][field] = value;
    setHeaderParams(newParams);
  };

  const handleRemoveHeaderParam = (index: number) => {
    if (headerParams.length > 1) {
      const newParams = [...headerParams];
      newParams.splice(index, 1);
      setHeaderParams(newParams);
    }
  };

  const refreshToken = () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // 更新Authorization请求头
          setHeaderParams(prev => 
            prev.map(param => 
              param.key === 'Authorization' 
                ? { ...param, value: token }
                : param
            )
          );
        }
      } catch (e) {
        console.error('获取token失败:', e);
      }
    }
  };

  const buildUrl = () => {
    const validParams = queryParams.filter(param => param.key.trim() !== '');
    if (validParams.length === 0) return path;
    
    const queryString = validParams
      .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
      .join('&');
    
    return `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
  };

  const buildHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    headerParams
      .filter(param => param.key.trim() !== '')
      .forEach(param => {
        headers[param.key] = param.value;
      });
    
    return headers;
  };

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse(null);
      
      const url = buildUrl();
      const headers = buildHeaders();
      
      const options: RequestInit = {
        method,
        headers
      };
      
      if (method !== 'GET' && requestBody.trim()) {
        try {
          options.body = requestBody;
        } catch (e) {
          setError('请求体JSON格式错误');
          setLoading(false);
          return;
        }
      }
      
      console.log('发送请求:', { url, method, headers, body: options.body });
      
      const res = await fetch(url, options);
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      
      const responseData = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data
      };
      
      setResponse(responseData);
      
      // 更新当前tab的响应数据
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            response: responseData,
            error: ''
          };
        }
        return tab;
      });
      setTabs(updatedTabs);
      
      // 只保存不含响应数据的tabs到localStorage
      localStorage.setItem('apiDebuggerTabs', JSON.stringify(updatedTabs.map(tab => ({
        ...tab,
        response: null,
        error: ''
      }))));
    } catch (err: any) {
      const errorMessage = err.message || '请求失败';
      setError(errorMessage);
      
      // 更新当前tab的错误信息
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            response: null,
            error: errorMessage
          };
        }
        return tab;
      });
      setTabs(updatedTabs);
      
      // 只保存不含响应数据的tabs到localStorage
      localStorage.setItem('apiDebuggerTabs', JSON.stringify(updatedTabs.map(tab => ({
        ...tab,
        response: null,
        error: ''
      }))));
    } finally {
      setLoading(false);
    }
  };

  const copyResponseToClipboard = () => {
    if (response) {
      try {
        const textToCopy = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data, null, 2);
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            alert('已复制到剪贴板');
          })
          .catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
          });
      } catch (err) {
        console.error('格式化响应数据失败:', err);
        alert('复制失败，请手动复制');
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer"
      >
        API 调试
      </button>
      
      {isOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[800px] max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
          {/* 固定标题栏 */}
          <div className="flex justify-between px-5 py-5 border-b border-gray-100">
            <h3 className="m-0">API 调试</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-transparent border-none cursor-pointer text-xl"
            >
              ×
            </button>
          </div>

          {/* 固定Tab栏 */}
          <div className="flex border-b border-gray-200 px-5 overflow-x-auto flex-shrink-0">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                onDoubleClick={() => renameTab(tab.id)}
                className={`px-3 py-2 mr-1 cursor-pointer flex items-center min-w-[100px] justify-between whitespace-nowrap
                  ${tab.id === activeTabId ? 'bg-gray-100 border border-gray-200 border-b-0 rounded-t-md' : 'border border-transparent border-b-0'}`}
              >
                <span className="max-w-[150px] overflow-hidden text-ellipsis">
                  {tab.name}
                </span>
                <button
                  onClick={(e) => deleteTab(tab.id, e)}
                  className="bg-transparent border-none cursor-pointer text-sm ml-2 px-1"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={createNewTab}
              className="px-3 py-2 bg-transparent border-none cursor-pointer text-xl leading-none"
            >
              +
            </button>
          </div>

          {/* 可滚动的内容区域 */}
          <div className="p-5 overflow-auto flex-1 max-h-[calc(90vh-120px)]">
            <div className="mb-4">
              <div className="mb-2">请求路径:</div>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="/api/your-endpoint"
              />
            </div>

            <div className="mb-4">
              <div className="mb-2">请求方法:</div>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span>请求头:</span>
                <button
                  onClick={refreshToken}
                  className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs cursor-pointer"
                >
                  刷新Token
                </button>
              </div>
              {headerParams.map((param, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => handleHeaderParamChange(index, 'key', e.target.value)}
                    placeholder="Header名"
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => handleHeaderParamChange(index, 'value', e.target.value)}
                    placeholder="Header值"
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => handleRemoveHeaderParam(index)}
                    className="p-2 border border-gray-300 rounded bg-white cursor-pointer"
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddHeaderParam}
                className="px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer"
              >
                添加请求头
              </button>
            </div>

            <div className="mb-4">
              <div className="mb-2">Query 参数:</div>
              {queryParams.map((param, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => handleQueryParamChange(index, 'key', e.target.value)}
                    placeholder="参数名"
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => handleQueryParamChange(index, 'value', e.target.value)}
                    placeholder="参数值"
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => handleRemoveQueryParam(index)}
                    className="p-2 border border-gray-300 rounded bg-white cursor-pointer"
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddQueryParam}
                className="px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer"
              >
                添加参数
              </button>
            </div>

            {method !== 'GET' && (
              <div className="mb-4">
                <div className="mb-2">请求体 (JSON):</div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full h-[120px] p-2 border border-gray-300 rounded font-mono"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            <div className="mb-4">
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className={`px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? '请求中...' : '发送请求'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded mb-4 text-red-600">
                {error}
              </div>
            )}

            {response && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <div>响应状态: {response.status} {response.statusText}</div>
                  <button
                    onClick={copyResponseToClipboard}
                    className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs cursor-pointer"
                  >
                    复制响应数据
                  </button>
                </div>
                <div className="mb-2">响应数据:</div>
                <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-[300px] font-mono">
                  {typeof response.data === 'string' 
                    ? response.data 
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 