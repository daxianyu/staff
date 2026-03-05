'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserInfo, getStudentSalesInfo, handleUserRedirect } from '@/services/auth';
import { initTheme } from '@/utils/theme';

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
  const tokenVerifiedRef = useRef(false); // 防止重复验证
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 页面加载时初始化主题
  useEffect(() => {
    initTheme();
  }, []);

  // 页面加载时，从 localStorage 恢复保存的用户名和密码
  // WebView 的 localStorage 是持久化的，小程序和浏览器都可以直接使用
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

  // 统一处理 token 验证和跳转逻辑
  useEffect(() => {
    // 如果已经验证过token，不再重复验证（防止跳转后再次触发）
    if (tokenVerifiedRef.current) return;
    
    const ua = window.navigator.userAgent.toLowerCase();
    const isInMiniProgram = ua.includes('miniprogram');
    const urlToken = searchParams.get('token');
    const storedToken = localStorage.getItem('token');
    
    // 确定最终使用的token（URL参数优先于localStorage）
    const token = urlToken || storedToken;
    
    // 小程序跳转到登录页的辅助函数
    const redirectToMiniProgramLogin = () => {
      if (isInMiniProgram && (window as any).wx?.miniProgram) {
        try {
          (window as any).wx.miniProgram.redirectTo({
            url: '/pages/login/login'
          });
        } catch (error) {
          console.error('跳转小程序登录页失败:', error);
        }
      }
    };
    
    // Token验证和跳转
    const verifyAndRedirect = async () => {
      // 没有token的情况
      if (!token) {
        console.log(isInMiniProgram ? '小程序环境无token，跳转到小程序登录页' : '浏览器环境无token，停留在登录页');
        redirectToMiniProgramLogin();
        return;
      }
      
      try {
        setVerifyingToken(true);
        setError('');
        tokenVerifiedRef.current = true; // 标记为已验证，防止重复验证
        
        // 如果是URL传入的token，保存到localStorage
        if (urlToken) {
          localStorage.setItem('token', urlToken);
        }
        
        // 验证token
        const response = await getUserInfo();
        
        if (response.code === 200 && response.data) {
          // 验证成功，跳转业务页面
          console.log('Token验证成功，正在跳转...');
          handleUserRedirect(response.data, router, true);
        } else {
          // 验证失败
          console.error('Token验证失败:', response.message);
          localStorage.removeItem('token');
          tokenVerifiedRef.current = false; // 重置验证标记
          setError('Token verification failed, please sign in again');
          redirectToMiniProgramLogin();
        }
      } catch (error) {
        // 验证异常
        console.error('Token验证异常:', error);
        localStorage.removeItem('token');
        tokenVerifiedRef.current = false; // 重置验证标记
        setError('Sign in verification failed, please try again');
        redirectToMiniProgramLogin();
      } finally {
        setVerifyingToken(false);
      }
    };
    
    verifyAndRedirect();
  }, [searchParams, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      
      // 执行登录
      await login(data.username, data.password);
      
      // 根据"记住我"选项保存或清除密码
      // WebView 的 localStorage 是持久化的，小程序和浏览器都可以直接使用
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
      setError(error instanceof Error ? error.message : 'Sign in failed, please try again later');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--header-bg, #3b7bc0)' }}>
      <div className="w-[480px] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl">
        <div className="px-14 py-12 space-y-14">
          {/* Title area */}
          <div className="space-y-4">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              OASIS
            </h2>
            <p className="text-center text-[15px] text-gray-600">
              Please sign in to your account
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-[14px]">
              {error}
            </div>
          )}
          
          {/* Token verification */}
          {verifyingToken && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg text-[14px] flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying credentials...
            </div>
          )}

          {/* Form area */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Username input */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-[15px] font-medium text-gray-700">
                  Username
                </label>
                <input
                  {...register('username')}
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full px-4 py-3 text-[15px] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-blue-400"
                  placeholder="Enter username"
                />
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-[15px] font-medium text-gray-700">
                  Password
                </label>
                <input
                  {...register('password')}
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full px-4 py-3 text-[15px] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-blue-400"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Remember me and forgot password */}
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
                  Remember me
                </label>
              </div>
              <a href="#" className="text-[15px] font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Sign in button */}
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
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 