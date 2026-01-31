'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getAllCampus } from '@/services/auth';
import { uploadCooksbookFile } from '@/services/auth';

interface UploadCooksbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Campus {
  id: number;
  name: string;
}

export default function UploadCooksbookModal({ isOpen, onClose }: UploadCooksbookModalProps) {
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number>(-1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCampusList();
      // 重置状态
      setSelectedCampusId(-1);
      setSelectedFile(null);
      setMessage(null);
    }
  }, [isOpen]);

  const loadCampusList = async () => {
    try {
      const res = await getAllCampus();
      if (res.status === 200 && res.data) {
        setCampusList(res.data);
      } else {
        console.error('获取校区列表失败:', res.message);
        setMessage({ type: 'error', text: res.message || '获取校区列表失败' });
      }
    } catch (e) {
      console.error('获取校区列表失败:', e);
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '获取校区列表失败' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedCampusId === -1) {
      setMessage({ type: 'error', text: '请选择校区' });
      return;
    }

    if (!selectedFile) {
      setMessage({ type: 'error', text: '请选择要上传的文件' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const res = await uploadCooksbookFile(selectedCampusId, selectedFile);
      if (res.code === 200) {
        setMessage({ type: 'success', text: '上传成功！' });
        setSelectedFile(null);
        setSelectedCampusId(-1);
        // 清空文件选择
        const fileInput = document.getElementById('cooksbook-file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        // 2秒后关闭
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: res.message || '上传失败' });
      }
    } catch (error) {
      console.error('上传失败:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '上传失败' });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ArrowUpTrayIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">上传选课说明</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            disabled={uploading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 消息提示 */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* 校区选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择校区 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCampusId}
              onChange={(e) => {
                setSelectedCampusId(Number(e.target.value));
                setMessage(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            >
              <option value={-1}>请选择校区</option>
              {campusList.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          {/* 文件上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择文件 <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="cooksbook-file-input"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>点击选择文件</span>
                    <input
                      id="cooksbook-file-input"
                      name="cooksbook-file-input"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">或拖拽文件到此处</p>
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    已选择: <span className="font-medium">{selectedFile.name}</span> (
                    {(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-gray-500">支持所有文件格式</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || selectedCampusId === -1 || !selectedFile}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                上传中...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-4 w-4" />
                上传
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
