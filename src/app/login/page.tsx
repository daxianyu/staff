'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserInfo, getStudentSalesInfo, handleUserRedirect } from '@/services/auth';

interface LoginFormData {
  username: string;
  password: string;
}

// localStorage keys
const STORAGE_KEYS = {
  USERNAME: 'saved_username',
  PASSWORD: 'saved_password',
  REMEMBER_ME: 'remember_me',
};

export default function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting }, setValue } = useForm<LoginFormData>();
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [verifyingToken, setVerifyingToken] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 页面加载时，从 localStorage 恢复保存的用户名和密码
  useEffect(() => {
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const savedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD);
    const savedRememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';

    if (savedRememberMe && savedUsername && savedPassword) {
      setValue('username', savedUsername);
      setValue('password', savedPassword);
      setRememberMe(true);
    }
  }, [setValue]);

  // 检查URL中的token参数并验证
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      const verifyToken = async () => {
        try {
          setVerifyingToken(true);
          setError('');
          
          // 设置token到localStorage供auth.ts中使用
          localStorage.setItem('token', token);
          
          // 尝试获取用户信息
          const response = await getUserInfo();
          
          if (response.code === 200 && response.data) {
            // 验证成功，强制刷新页面以确保AuthContext完成更新
            console.log('Token验证成功，正在跳转...');
            
            // 使用统一的重定向处理函数，并设置useWindowLocation=true
            handleUserRedirect(response.data, router, true);
          } else {
            // 验证失败，清除token
            localStorage.removeItem('token');
            setError('Token验证失败，请重新登录');
          }
        } catch (error) {
          console.error('Token验证异常:', error);
          localStorage.removeItem('token');
          setError('登录验证失败，请重新登录');
        } finally {
          setVerifyingToken(false);
        }
      };
      
      verifyToken();
    }
  }, [searchParams]);  // 移除router依赖，使用window.location跳转

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      
      // 执行登录
      await login(data.username, data.password);
      
      // 根据"记住我"选项保存或清除密码
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.USERNAME, data.username);
        localStorage.setItem(STORAGE_KEYS.PASSWORD, data.password);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.USERNAME);
        localStorage.removeItem(STORAGE_KEYS.PASSWORD);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
    } catch (error) {
      console.error('登录异常:', error);
      setError(error instanceof Error ? error.message : '登录失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 p-6">
      <div className="w-[480px] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl">
        <div className="px-14 py-12 space-y-14">
          {/* 标题区域 */}
          <div className="space-y-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              课程管理系统
            </h2>
            <p className="text-center text-[15px] text-gray-600">
              请登录您的账号
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-[14px]">
              {error}
            </div>
          )}
          
          {/* Token验证中提示 */}
          {verifyingToken && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg text-[14px] flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在验证登录凭证...
            </div>
          )}

          {/* 表单区域 */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* 用户名输入框 */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-[15px] font-medium text-gray-700">
                  用户名
                </label>
                <input
                  {...register('username')}
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full px-4 py-3 text-[15px] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-blue-400"
                  placeholder="请输入用户名"
                />
              </div>

              {/* 密码输入框 */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-[15px] font-medium text-gray-700">
                  密码
                </label>
                <input
                  {...register('password')}
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full px-4 py-3 text-[15px] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-blue-400"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-[15px] text-gray-700 cursor-pointer">
                  记住我
                </label>
              </div>
              <a href="#" className="text-[15px] font-medium text-blue-600 hover:text-blue-500 transition-colors">
                忘记密码？
              </a>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isSubmitting || verifyingToken}
              className="w-full flex justify-center items-center py-3 px-4 text-[15px] font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isSubmitting ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 