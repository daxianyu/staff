/**
 * Markdown 内联链接目标中含空格、括号时，`]() ` 会在第一个 `)` 处结束解析。
 * CommonMark：使用 `<destination>` 包住完整 URL。
 */
export function markdownLinkDestination(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (/^<[\s\S]*>$/.test(u)) return u;
  if (/[\s()]/.test(u)) return `<${u}>`;
  return u;
}

/**
 * 修复历史上插入的错误图片语法：`![](/path/xxx (1).jpeg)` 被解析成 URL 在首个 ) 处截断。
 */
export function repairBrokenMarkdownImages(md: string): string {
  let out = md.replace(
    /!\[([^\]]*)\]\(\s*(\/(?:[^\s(]+\/)*[^\s(]+\s+)\(\s*([^)]*)\)\s*\.(jpe?g|png|gif|webp)\s*\)/gi,
    (_, alt: string, baseSp: string, inner: string, ext: string) =>
      `![${alt}](<${baseSp.trim()} (${inner}).${ext.toLowerCase()}>)`
  );
  out = out.replace(
    /!\[([^\]]*)\]\(\s*(\/(?:[^\s(]+\/)*[^\s(]+)\(\s*([^)]*)\)\s*\.(jpe?g|png|gif|webp)\s*\)/gi,
    (_, alt: string, base: string, inner: string, ext: string) =>
      `![${alt}](<${base}(${inner}).${ext.toLowerCase()}>)`
  );
  return out;
}
