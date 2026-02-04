'use client';

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { saveJsonData, getJsonData, getAllJsonData } from '@/services/modules/tools';
import { CheckCircleIcon, ExclamationCircleIcon, PencilIcon, PlusIcon, CodeBracketIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface JsonStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DataItem {
  key: string;
  value: string;
  isJson?: boolean; // 是否为 JSON 格式
}

// 检测字符串是否为有效的 JSON
const isValidJson = (str: string): boolean => {
  if (!str || !str.trim()) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// 格式化 JSON 字符串
const formatJson = (str: string): string => {
  if (!isValidJson(str)) return str;
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
};

export default function JsonStorageModal({ isOpen, onClose }: JsonStorageModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [dataList, setDataList] = useState<DataItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set()); // 展开的 key 集合
  const [editingKey, setEditingKey] = useState<string | null>(null); // 正在编辑的 key
  const [isAdding, setIsAdding] = useState(false);
  
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isJsonValue, setIsJsonValue] = useState(false);
  const [editMode, setEditMode] = useState<'auto' | 'json' | 'string'>('auto');

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await getAllJsonData();
      if (response.code === 200 && response.data) {
        const items: DataItem[] = Object.entries(response.data).map(([k, v]) => {
          const valueStr = typeof v === 'string' ? v : JSON.stringify(v);
          return {
            key: k,
            value: valueStr,
            isJson: isValidJson(valueStr),
          };
        });
        setDataList(items);
      } else {
        setMessage({ type: 'error', text: response.message || '加载失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '加载失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (itemKey: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
      setEditingKey(null);
    } else {
      newExpanded.add(itemKey);
      // 初始化编辑数据
      const item = dataList.find(i => i.key === itemKey);
      if (item) {
        setEditingKey(itemKey);
        setKey(item.key);
        if (item.isJson) {
          setValue(formatJson(item.value));
          setIsJsonValue(true);
          setEditMode('json');
        } else {
          setValue(item.value);
          setIsJsonValue(false);
          setEditMode('string');
        }
      }
    }
    setExpandedKeys(newExpanded);
  };

  const toggleAdd = () => {
    if (isAdding) {
      setIsAdding(false);
      setKey('');
      setValue('');
      setIsJsonValue(false);
      setEditMode('auto');
    } else {
      setIsAdding(true);
      setExpandedKeys(new Set()); // 收起所有展开项
      setEditingKey(null);
      setKey('');
      setValue('');
      setIsJsonValue(false);
      setEditMode('auto');
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setKey('');
    setValue('');
    setIsJsonValue(false);
    setEditMode('auto');
    setIsAdding(false);
    setExpandedKeys(new Set());
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (editMode === 'auto') {
      setIsJsonValue(isValidJson(newValue));
    }
  };

  const handleFormatJson = () => {
    if (isValidJson(value)) {
      setValue(formatJson(value));
    }
  };

  const handleModeChange = (mode: 'auto' | 'json' | 'string') => {
    setEditMode(mode);
    if (mode === 'json') {
      if (isValidJson(value)) {
        setValue(formatJson(value));
        setIsJsonValue(true);
      } else {
        setIsJsonValue(false);
      }
    } else if (mode === 'string') {
      setIsJsonValue(false);
    } else {
      setIsJsonValue(isValidJson(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!key.trim()) {
      setMessage({ type: 'error', text: '请输入 key' });
      return;
    }

    let finalValue = value.trim();
    if (editMode === 'json') {
      if (finalValue && !isValidJson(finalValue)) {
        setMessage({ type: 'error', text: 'JSON 格式错误，请检查后重试' });
        return;
      }
      if (isValidJson(finalValue)) {
        try {
          const parsed = JSON.parse(finalValue);
          finalValue = JSON.stringify(parsed);
        } catch {
          // 如果解析失败，使用原值
        }
      }
    }
    
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await saveJsonData(key.trim(), finalValue);

      if (response.code === 200) {
        setMessage({ type: 'success', text: '保存成功' });
        await loadAllData();
        handleCancelEdit();
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: response.message || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const truncateValue = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderEditForm = (itemKey: string | null, isNew: boolean) => (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="space-y-4">
        <div>
          <label htmlFor={`key-${itemKey}`} className="block text-sm font-medium text-gray-700 mb-2">
            Key <span className="text-red-500">*</span>
          </label>
          <input
            id={`key-${itemKey}`}
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="请输入 key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting || !isNew}
          />
          {!isNew && (
            <p className="mt-1 text-xs text-gray-500">编辑模式下不能修改 key</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={`value-${itemKey}`} className="block text-sm font-medium text-gray-700">
              内容
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => handleModeChange('auto')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                    editMode === 'auto'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  自动
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('json')}
                  className={`px-3 py-1.5 text-xs font-medium border-t border-b ${
                    editMode === 'json'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CodeBracketIcon className="h-3 w-3 inline mr-1" />
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('string')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-r-md border ${
                    editMode === 'string'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  字符串
                </button>
              </div>
              {editMode === 'json' && isValidJson(value) && (
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  <CodeBracketIcon className="h-3 w-3 mr-1" />
                  格式化
                </button>
              )}
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                editMode === 'json' || (editMode === 'auto' && isJsonValue)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 bg-gray-50'
              }`}>
                {editMode === 'json' || (editMode === 'auto' && isJsonValue) ? (
                  <>
                    <CodeBracketIcon className="h-3 w-3 mr-1" />
                    {editMode === 'json' ? 'JSON 模式' : 'JSON 格式'}
                  </>
                ) : (
                  editMode === 'string' ? '字符串模式' : '纯字符串'
                )}
              </span>
            </div>
          </div>
          <textarea
            id={`value-${itemKey}`}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={
              editMode === 'json'
                ? '请输入 JSON 内容，例如：{"name": "value"}'
                : editMode === 'string'
                ? '请输入纯字符串内容'
                : '请输入内容（支持 JSON 或纯字符串，系统会自动识别）'
            }
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            disabled={submitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            {editMode === 'auto' && '提示：系统会自动识别 JSON 格式，支持 JSON 或纯字符串'}
            {editMode === 'json' && '提示：JSON 模式会验证 JSON 格式，保存时会自动压缩格式'}
            {editMode === 'string' && '提示：字符串模式会保持原始格式，不会进行 JSON 解析'}
          </p>
          {editMode === 'json' && value && !isValidJson(value) && (
            <p className="mt-1 text-xs text-red-600">
              ⚠️ JSON 格式错误，请检查语法
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-md mt-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 mt-4">
        <button
          type="button"
          onClick={handleCancelEdit}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={submitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="数据存储管理" maxWidth="2xl">
      <div className="space-y-4">
        {/* 列表视图 */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">数据列表</h3>
          <button
            onClick={toggleAdd}
            className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
              isAdding
                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isAdding ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                收起
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-1" />
                添加
              </>
            )}
          </button>
        </div>

        {/* 添加表单 */}
        {isAdding && (
          <div className="mb-4">
            {renderEditForm(null, true)}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : dataList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无数据，点击"添加"按钮创建新项
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataList.map((item, index) => {
                    const isExpanded = expandedKeys.has(item.key);
                    return (
                      <React.Fragment key={item.key}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleExpand(item.key)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.isJson ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CodeBracketIcon className="h-3 w-3 mr-1" />
                                JSON
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                字符串
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="max-w-md truncate" title={item.value}>
                              {truncateValue(item.value)}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && editingKey === item.key && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 bg-gray-50">
                              {renderEditForm(item.key, false)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 列表视图时的消息提示 */}
        {!isAdding && !editingKey && message && (
          <div className={`flex items-center gap-2 p-3 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
