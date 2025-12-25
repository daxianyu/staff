/**
 * 小程序 web-view 环境适配：
 * - 不能真正“新 tab”，只能通过小程序 navigateTo 打开新的 web-view 承载页
 *
 * 需要小程序侧提供一个通用 web-view 页面（默认：/pages/webview/index），并接收 query 参数 url
 * 例如：/pages/webview/index?url=https%3A%2F%2Fexample.com%2Fstaff%2Fstudents
 *
 * 可通过 NEXT_PUBLIC_MINIPROGRAM_WEBVIEW_PATH 覆盖默认路径
 */

export function isWeChatMiniProgram(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  // 微信官方推荐：__wxjs_environment === 'miniprogram'
  if (w.__wxjs_environment === 'miniprogram') return true;
  // 兜底：存在 wx.miniProgram
  if (w.wx?.miniProgram && typeof w.wx.miniProgram.navigateTo === 'function') return true;
  return false;
}

export function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (typeof window === 'undefined') return url;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

export function getMiniProgramWebviewPath(): string {
  const raw = (process.env.NEXT_PUBLIC_MINIPROGRAM_WEBVIEW_PATH || '/pages/webview/index').trim();
  if (!raw) return '/pages/webview/index';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

/**
 * 在小程序内打开新的 web-view 页面（等价“新 tab”）
 * 返回 true 表示已成功触发 navigateTo；false 表示不可用/失败
 */
export function openInMiniProgramWebview(url: string): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  const wx = w.wx;
  if (!wx?.miniProgram || typeof wx.miniProgram.navigateTo !== 'function') return false;

  const absUrl = toAbsoluteUrl(url);
  const pagePath = getMiniProgramWebviewPath();
  const navUrl = `${pagePath}?url=${encodeURIComponent(absUrl)}`;

  try {
    wx.miniProgram.navigateTo({
      url: navUrl,
      fail: (err: any) => {
        // 某些场景（页面栈满/路径不对）会失败；这里不抛错，让调用方兜底
        // eslint-disable-next-line no-console
        console.warn('[miniProgram] navigateTo failed:', err);
      },
    });
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[miniProgram] navigateTo threw:', e);
    return false;
  }
}

// 小程序工具函数

// 检测是否在微信小程序环境
export const isInMiniProgram = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('miniprogram');
};

// 向小程序发送消息
export const postMessageToMiniProgram = (data: any): void => {
  if (typeof window !== 'undefined' && (window as any).wx?.miniProgram) {
    (window as any).wx.miniProgram.postMessage({ data });
    console.log('已发送消息到小程序:', data);
  }
};

// 通知小程序用户已登出
export const notifyMiniProgramLogout = (): void => {
  if (isInMiniProgram()) {
    postMessageToMiniProgram({
      type: 'logout'
    });
    console.log('已通知小程序登出');
    
    // 因为 postMessage 只在特定时机触发，我们尝试触发页面返回
    setTimeout(() => {
      if ((window as any).wx?.miniProgram) {
        try {
          // 尝试返回上一页，触发消息发送
          (window as any).wx.miniProgram.navigateBack();
        } catch (error) {
          console.log('无法自动返回，需要用户手动返回');
        }
      }
    }, 300);
  }
};

