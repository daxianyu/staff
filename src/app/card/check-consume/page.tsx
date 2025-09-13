'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { checkCardConsume } from '@/services/auth';

export default function CheckConsumePage() {
  const { hasPermission } = useAuth();
  
  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_CARD_CONSUME);
  const canEdit = hasPermission(PERMISSIONS.EDIT_CARD_CONSUME);

  // 状态管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 权限检查页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问此页面的权限</p>
        </div>
      </div>
    );
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 检查文件类型
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('请选择Excel文件(.xlsx, .xls)或CSV文件');
        return;
      }
      
      setSelectedFile(file);
      setResult(null);
    }
  };

  // 处理文件拖拽
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // 检查文件类型
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('请选择Excel文件(.xlsx, .xls)或CSV文件');
        return;
      }
      
      setSelectedFile(file);
      setResult(null);
    }
  };

  // 处理文件上传和检查
  const handleUploadAndCheck = async () => {
    if (!selectedFile || !canEdit) return;
    
    setUploading(true);
    try {
      const response = await checkCardConsume(selectedFile);
      
      if (response.code === 200) {
        setResult({
          success: true,
          message: response.message || '数据验证成功！提交的数据和数据库相匹配。',
        });
      } else {
        setResult({
          success: false,
          message: response.message || '数据验证失败',
        });
      }
    } catch (error) {
      console.error('文件检查失败:', error);
      setResult({
        success: false,
        message: '文件检查失败，请稍后重试',
      });
    } finally {
      setUploading(false);
    }
  };

  // 清除选择的文件
  const clearFile = () => {
    setSelectedFile(null);
    setResult(null);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">卡消费数据核对</h1>
          <p className="mt-2 text-sm text-gray-600">上传每月卡消费数据文件进行核对验证</p>
        </div>

        {/* 文件上传区域 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">上传消费数据文件</h3>
            
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
              >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      拖拽文件到这里，或
                      <span className="text-blue-600 hover:text-blue-500"> 点击选择文件</span>
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    支持 Excel (.xlsx, .xls) 或 CSV 文件
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentArrowUpIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            {selectedFile && canEdit && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUploadAndCheck}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      检查中...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                      上传并检查
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 结果显示 */}
        {result && (
          <div className="mt-6">
            <div className={`rounded-lg p-4 ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                {result.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? '验证成功' : '验证失败'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>{result.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 错误详情 */}
        {result && !result.success && (
          <div className="mt-4 bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">错误详情</h3>
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {result.message}
                </pre>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>可能的解决方案：</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>检查文件格式是否正确</li>
                  <li>确认数据字段是否完整</li>
                  <li>验证数据中的卡号、消费金额等信息是否准确</li>
                  <li>检查数据是否包含非法字符或格式错误</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
