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

