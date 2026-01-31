// 主题管理工具

// 辅助函数：将颜色变暗
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) - percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - percent));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) - percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export interface Theme {
  name: string;
  description: string;
  colors: {
    primary: {
      background: string;
      text: string;
    };
    sidebar: {
      background: string;
      lightBackground?: string;
      activeBackground?: string;
      text: string;
      inactiveText?: string;
      activeIndicator?: string;
    };
    header: {
      background: string;
      text: string;
    };
    content: {
      background: string;
      cardBackground: string;
      border: string;
      text: string;
    };
    button: {
      primary: {
        background: string;
        text: string;
      };
    };
  };
  cssVariables: Record<string, string>;
}

// 默认主题（深蓝色）
const DEFAULT_THEME: Theme = {
  name: '默认主题',
  description: '默认深蓝色主题',
  colors: {
    primary: {
      background: '#1e3965',
      text: '#ffffff',
    },
    sidebar: {
      background: '#1e3965',
      text: '#ffffff',
    },
    header: {
      background: '#1e3965',
      text: '#ffffff',
    },
    content: {
      background: '#f5f5f5',
      cardBackground: '#ffffff',
      border: '#e5e5e5',
      text: '#333333',
    },
    button: {
      primary: {
        background: '#1e3965',
        text: '#ffffff',
      },
    },
  },
  cssVariables: {
    '--header-bg': '#1e3965',
    '--header-text': '#ffffff',
    '--sidebar-bg': '#1e3965',
    '--sidebar-text': '#ffffff',
    '--button-primary-bg': '#1e3965',
    '--button-primary-text': '#ffffff',
    '--button-primary-hover': '#2a4a75',
  },
};

// 应用主题
export const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;

  // 应用所有 CSS 变量
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  // 调试信息（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('主题已应用:', theme.name);
    console.log('按钮颜色:', {
      bg: theme.cssVariables['--button-primary-bg'],
      text: theme.cssVariables['--button-primary-text'],
      hover: theme.cssVariables['--button-primary-hover'],
    });
  }
};

// 从 localStorage 获取主题
export const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('theme_config');
    if (stored) {
      return JSON.parse(stored) as Theme;
    }
  } catch (error) {
    console.error('读取存储的主题失败:', error);
  }
  return null;
};

// 存储主题到 localStorage
export const storeTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('theme_config', JSON.stringify(theme));
  } catch (error) {
    console.error('存储主题失败:', error);
  }
};

// 从接口获取主题
export const fetchThemeFromAPI = async (): Promise<Theme | null> => {
  try {
    const { getAuthHeader } = await import('@/services/auth');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    const response = await fetch('/api/site/api-echo-params', {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 0 && result.data) {
        // 优先使用 staff_theme（当前项目是 staff）
        let themeData = result.data.staff_theme;
        
        // 如果没有 staff_theme，尝试使用 theme（向后兼容）
        if (!themeData) {
          themeData = result.data.theme;
        }
        
        if (themeData) {
          // 如果接口返回了完整的主题对象（包含 name 和 cssVariables）
          if (themeData.name && themeData.cssVariables && typeof themeData.cssVariables === 'object') {
            // 验证主题对象结构
            const theme: Theme = {
              name: themeData.name,
              description: themeData.description || '',
              colors: themeData.colors || DEFAULT_THEME.colors,
              cssVariables: themeData.cssVariables,
            };
            
            // 调试信息（开发环境）
            if (process.env.NODE_ENV === 'development') {
              console.log('从接口获取到主题:', theme.name);
              console.log('CSS变量数量:', Object.keys(theme.cssVariables).length);
            }
            
            return theme;
          }
          // 如果只返回了颜色值（向后兼容）
          if (themeData.color && typeof themeData.color === 'string') {
            // 计算悬停颜色（稍微变暗）
            const hoverColor = themeData.color.startsWith('#') 
              ? darkenColor(themeData.color, 10)
              : themeData.color;
            
            return {
              ...DEFAULT_THEME,
              colors: {
                ...DEFAULT_THEME.colors,
                primary: {
                  background: themeData.color,
                  text: '#ffffff',
                },
                sidebar: {
                  ...DEFAULT_THEME.colors.sidebar,
                  background: themeData.color,
                },
                header: {
                  background: themeData.color,
                  text: '#ffffff',
                },
                button: {
                  primary: {
                    background: themeData.color,
                    text: '#ffffff',
                  },
                },
              },
              cssVariables: {
                ...DEFAULT_THEME.cssVariables,
                '--header-bg': themeData.color,
                '--sidebar-bg': themeData.color,
                '--button-primary-bg': themeData.color,
                '--button-primary-text': '#ffffff',
                '--button-primary-hover': hoverColor,
              },
            };
          }
        } else {
          // 调试信息：接口返回了数据但没有主题
          if (process.env.NODE_ENV === 'development') {
            console.warn('接口返回的数据中没有找到主题:', result.data);
          }
        }
      }
    } else {
      console.error('获取主题接口请求失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('从接口获取主题失败:', error);
  }
  return null;
};

// 加载本地主题文件
export const loadLocalTheme = async (themeName: 'orange' | 'blue'): Promise<Theme | null> => {
  try {
    const response = await fetch(`/config/themes/${themeName}-theme.json`, {
      cache: 'no-cache',
    });
    if (response.ok) {
      const theme = await response.json() as Theme;
      return theme;
    }
  } catch (error) {
    console.error(`加载主题 ${themeName} 失败:`, error);
  }
  return null;
};

// 初始化主题
export const initTheme = async () => {
  if (typeof window === 'undefined') return;
  
  // 1. 先从 localStorage 读取并应用（快速显示）
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    // 如果没有存储的主题，先应用默认主题
    applyTheme(DEFAULT_THEME);
  }

  // 2. 从接口获取最新主题
  try {
    const apiTheme = await fetchThemeFromAPI();
    if (apiTheme) {
      // 存储并应用接口返回的主题
      storeTheme(apiTheme);
      applyTheme(apiTheme);
      
      // 强制浏览器重新渲染，确保 CSS 变量生效
      setTimeout(() => {
        // 触发重排，确保样式更新
        document.body.offsetHeight;
      }, 50);
      
      return;
    }
  } catch (error) {
    console.error('初始化主题时出错:', error);
  }

  // 3. 如果接口没有返回主题，且 localStorage 也没有，则使用默认主题
  if (!storedTheme) {
    storeTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  }
};

// 切换主题
export const switchTheme = async (themeName: 'orange' | 'blue' | 'default') => {
  let theme: Theme | null = null;

  if (themeName === 'default') {
    theme = DEFAULT_THEME;
  } else {
    theme = await loadLocalTheme(themeName);
  }

  if (theme) {
    storeTheme(theme);
    applyTheme(theme);
    return theme;
  }

  return null;
};

// 加载默认主题文件
export const loadDefaultTheme = async (): Promise<Theme | null> => {
  try {
    const response = await fetch('/config/themes/default-theme.json', {
      cache: 'no-cache',
    });
    if (response.ok) {
      const theme = await response.json() as Theme;
      return theme;
    }
  } catch (error) {
    console.error('加载默认主题失败:', error);
  }
  // 如果加载失败，返回内置的默认主题
  return DEFAULT_THEME;
};
