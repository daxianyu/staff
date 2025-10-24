import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 只记录API请求
  if (request.nextUrl.pathname.startsWith('/api')) {
    // 创建新的headers对象
    const headers = new Headers();
    
    // 如果是登录接口，不需要token
    if (!request.nextUrl.pathname.endsWith('/api/login')) {
      // 从localStorage获取token是在客户端完成的，这里只负责转发
      const token = request.headers.get('Authorization');
      if (token) {
        headers.set('Authorization', token);
      }
      // headers.set('Host', 'www.huayaopudong.com');
    }
    console.log(`https://www.huayaopudong.com${request.nextUrl.pathname}`)
    try {
      const response = await fetch(`https://www.huayaopudong.com${request.nextUrl.pathname}${request.nextUrl.search}`, {
        method: request.method,
        headers: headers,
        body: request.method === 'GET' ? undefined : await request.text()
      });

      console.log('API响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // 直接返回原始响应
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      console.error('API请求失败:', error);
      return new NextResponse('API请求失败', { status: 500 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 