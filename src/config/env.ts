export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  enableApiDebugger: process.env.NODE_ENV === 'development'
};

/**
 * 获取基础域名
 * 客户端：运行时从 window.location.origin 获取
 * 服务端：从环境变量获取，默认使用 huayaopudong.com
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 客户端：使用当前访问的域名
    return window.location.origin;
  }
  // 服务端：使用环境变量或默认值
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.huayaopudong.com';
};

/**
 * 获取API基础URL（用于开发环境代理和服务端请求）
 */
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.huayaopudong.com';
};

/**
 * 构建完整文件URL的辅助函数
 * @param filePath 文件路径（相对路径或绝对路径）
 * @returns 完整的文件URL
 */
export const buildFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  const baseUrl = getBaseUrl();
  // 确保路径格式正确
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${baseUrl}${normalizedPath}`;
}; 