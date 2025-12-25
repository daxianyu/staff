/**
 * 生产环境静态导出时配置了 basePath=/staff；
 * 开发环境不需要这个前缀。
 *
 * - 仅对站内路径（以 "/" 或相对路径）生效
 * - 对外链（http/https 等）原样返回
 */
export function withStaffBasePath(input: string): string {
  const url = (input ?? '').trim();
  if (!url) return url;

  // 外链 / 协议相对 URL 不做处理
  if (isExternalUrl(url)) return url;

  const normalized = url.startsWith('/') ? url : `/${url}`;

  // 生产环境（静态导出）需要 basePath=/staff
  if (process.env.NODE_ENV === 'production') {
    // if (normalized === '/staff' || normalized.startsWith('/staff/')) return normalized;
    return `/staff${normalized}`;
  }

  return normalized;
}

function isExternalUrl(url: string): boolean {
  // http:// https:// mailto: tel: 等
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return true;
  // //example.com 协议相对
  if (url.startsWith('//')) return true;
  return false;
}


