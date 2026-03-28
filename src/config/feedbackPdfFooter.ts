import { getJsonData } from '@/services/auth';
import { withStaffBasePath } from '@/utils/withStaffBasePath';

const ECHO_KEY = 'FEEDBACK_BG_FILENAME';

export const isFeedbackPdfDebugEnabled = (): boolean =>
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_FEEDBACK_PDF === '1';

function feedbackPdfLog(message: string, payload?: Record<string, unknown>): void {
  if (!isFeedbackPdfDebugEnabled()) return;
  if (payload) {
    console.log(`[FeedbackPDF] ${message}`, payload);
  } else {
    console.log(`[FeedbackPDF] ${message}`);
  }
}

function isFullUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** public 根目录下单文件名，禁止路径穿越 */
function isSafePublicFilename(name: string): boolean {
  const n = name.trim();
  if (!n || n.includes('..') || n.includes('/') || n.includes('\\')) return false;
  return /^[a-zA-Z0-9_.-]+$/.test(n);
}

/**
 * 接口可能返回纯文本文件名，或 JSON：`{"status":0,"message":"","data":"feedback-bg-phy.png"}`
 *（及常见 `{ code, data }` 信封），统一取出用于 public 文件名的字符串。
 */
export function extractFilenameFromEchoResponse(body: string): string {
  const t = (body ?? '').trim();
  if (!t) return '';
  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t) as { data?: unknown; status?: number; code?: number };
      if (o && typeof o.data === 'string') return o.data.trim();
      if (o && o.data != null && typeof o.data !== 'object') return String(o.data).trim();
    } catch {
      /* 非 JSON 则走下方 */
    }
  }
  return t.replace(/^["']|["']$/g, '');
}

function getLegacyFeedbackPdfBackgroundImageSrc(): string | null {
  const site = (process.env.NEXT_PUBLIC_FEEDBACK_PDF_SITE ?? 'bhy').trim().toLowerCase();
  const file =
    site === 'huayao' || site === 'huayaopudong'
      ? 'feedback-bg-phy.png'
      : 'feedback-bg-bhy.png';
  const path = `/${file}`;
  if (typeof window === 'undefined') return path;
  return withStaffBasePath(path);
}

export type FeedbackPdfBackgroundResolveResult = {
  src: string | null;
  /** echo 接口返回的原始字符串（调试日志里可能截断） */
  echoRaw?: string;
  echoCode?: number;
  source: 'env_url' | 'echo' | 'legacy';
};

/**
 * Feedback PDF 整页淡背景图地址：
 * 1. `NEXT_PUBLIC_FEEDBACK_PDF_FOOTER_URL`（完整 URL，最高优先级；名称历史遗留，实为背景图）
 * 2. `GET /api/site/api-echo-params?key=FEEDBACK_BG_FILENAME`（及可选额外 query），返回 public 下文件名或完整 URL
 * 3. 按 `NEXT_PUBLIC_FEEDBACK_PDF_SITE` 的默认文件名
 */
export async function resolveFeedbackPdfBackgroundImageSrc(
  echoExtraQuery?: Record<string, string>
): Promise<FeedbackPdfBackgroundResolveResult> {
  const direct = process.env.NEXT_PUBLIC_FEEDBACK_PDF_FOOTER_URL?.trim();
  if (direct) {
    feedbackPdfLog('背景图来源: 环境变量 NEXT_PUBLIC_FEEDBACK_PDF_FOOTER_URL', { src: direct });
    return { src: direct, source: 'env_url' };
  }

  try {
    const res = await getJsonData(ECHO_KEY, echoExtraQuery);
    const rawBody = (res.data ?? '').trim();
    const raw = extractFilenameFromEchoResponse(rawBody);
    feedbackPdfLog('echo FEEDBACK_BG_FILENAME', {
      httpCode: res.code,
      bodyPreview: rawBody.length > 200 ? `${rawBody.slice(0, 200)}…` : rawBody,
      extracted: raw,
      extraQuery: echoExtraQuery ?? null,
    });

    if (!raw) {
      const leg = getLegacyFeedbackPdfBackgroundImageSrc();
      feedbackPdfLog('echo 为空，使用 legacy', { src: leg });
      return { src: leg, echoCode: res.code, echoRaw: raw, source: 'legacy' };
    }
    if (isFullUrl(raw)) {
      const u = raw.trim();
      return { src: u, echoCode: res.code, echoRaw: raw, source: 'echo' };
    }
    if (!isSafePublicFilename(raw)) {
      console.warn('[FeedbackPDF] FEEDBACK_BG_FILENAME 无效，已回退 legacy:', raw);
      const leg = getLegacyFeedbackPdfBackgroundImageSrc();
      return { src: leg, echoCode: res.code, echoRaw: raw, source: 'legacy' };
    }
    const path = `/${raw.trim()}`;
    const src = typeof window === 'undefined' ? path : withStaffBasePath(path);
    return { src, echoCode: res.code, echoRaw: raw, source: 'echo' };
  } catch (e) {
    console.warn('[FeedbackPDF] 获取 FEEDBACK_BG_FILENAME 失败', e);
    const leg = getLegacyFeedbackPdfBackgroundImageSrc();
    return { src: leg, source: 'legacy' };
  }
}

/** @deprecated 使用 resolveFeedbackPdfBackgroundImageSrc */
export async function resolveFeedbackPdfFooterImageSrc(
  echoExtraQuery?: Record<string, string>
): Promise<string | null> {
  const r = await resolveFeedbackPdfBackgroundImageSrc(echoExtraQuery);
  return r.src;
}
