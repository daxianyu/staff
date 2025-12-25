'use client';

import React from 'react';
import { withStaffBasePath } from '@/utils/withStaffBasePath';
import { isWeChatMiniProgram } from '@/utils/miniprogram';
import { openUrlWithFallback } from '@/utils/openUrlWithFallback';

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
};

/**
 * 表格 action 跳转统一使用：新 Tab 打开 + prod 自动补 /staff
 */
export function TableActionLink({ href, rel, target, ...rest }: Props) {
  const finalHref = withStaffBasePath(href);
  const inMiniProgram = isWeChatMiniProgram();
  return (
    <a
      href={finalHref}
      // 小程序 webview 只有一个窗口：不新开 tab，直接当前窗口跳转
      target={inMiniProgram ? '_self' : (target ?? '_blank')}
      rel={inMiniProgram ? rel : (rel ?? 'noopener noreferrer')}
      onClick={(e) => {
        // 小程序里不要新开 tab，直接用统一逻辑做当前窗口跳转
        if (inMiniProgram) {
          e.preventDefault();
          openUrlWithFallback(href);
        }
        rest.onClick?.(e);
      }}
      {...rest}
    />
  );
}


