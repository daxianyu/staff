/**
 * Canvas 绘制 + jsPDF，不依赖 html2canvas（避免空白 / Tailwind color() 问题）。
 * 使用系统字体栈渲染中英文。
 * 学生反馈 PDF 换行优先使用 @chenglou/pretext（Canvas measureText + Intl.Segmenter，与浏览器排版更一致）。
 */

import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';
import { jsPDF } from 'jspdf';

import {
  isFeedbackPdfDebugEnabled,
  resolveFeedbackPdfBackgroundImageSrc,
} from '@/config/feedbackPdfFooter';

const FONT = '12px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans GB", sans-serif';
const FONT_BOLD = 'bold 12px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans GB", sans-serif';
const LINE = 18;
const PAD = 20;
/**
 * 分场景控制清晰度：
 * - Lesson 表格文字较密，至少 1.5×
 * - 反馈透明文字层叠在背景图上，2× 更稳
 */
const PDF_LESSON_CANVAS_SCALE = 1.5;
const PDF_FEEDBACK_CANVAS_SCALE = 2;
/** 反馈 PDF：略缩小字号与行距，画布略窄，导出更接近 A4 阅读尺寸 */
const FEEDBACK_FONT =
  '11px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans GB", sans-serif';
const FEEDBACK_FONT_BOLD =
  'bold 11px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans GB", sans-serif';
const FEEDBACK_LINE = 16;
const FEEDBACK_CSS_W = 720;

/** A4 导出时四周留白（mm），内容区在可打印区域内分页，避免贴边裁切 */
const PDF_PAGE_MARGIN_MM = 12;

/**
 * PNG 像素 ↔ mm 换算、jsPDF 内部取整会产生浮点误差，drawH 可能比 contentH 略大。
 * 若阈值过小会误判需多页切片 → 多出几乎空白的页。
 */
const PDF_SINGLE_PAGE_EPSILON_MM = 1.2;
const PDF_TAIL_SLICE_IGNORE_MM = 0.8;

/** 与 appendCanvasToPdf 中 contentW/contentH 一致，用于把「一页 PDF 内容区高度」换算成画布像素高度 */
function getMaxCanvasHeightPxForA4Page(orient: 'p' | 'l', cssW: number): number {
  const tmp = new jsPDF(orient === 'l' ? 'l' : 'p', 'mm', 'a4', true);
  const pdfW = tmp.internal.pageSize.getWidth();
  const pdfH = tmp.internal.pageSize.getHeight();
  const m = PDF_PAGE_MARGIN_MM;
  const contentW = Math.max(1, pdfW - 2 * m);
  const contentH = Math.max(1, pdfH - 2 * m);
  return (contentH * cssW) / contentW;
}

/** 整页 A4 铺满背景（cover，含出血区视觉），再叠文字画布 */
function drawPdfFullPageBackgroundCover(doc: jsPDF, img: HTMLImageElement): void {
  const pdfW = doc.internal.pageSize.getWidth();
  const pdfH = doc.internal.pageSize.getHeight();
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw <= 0 || ih <= 0) return;
  const scale = Math.max(pdfW / iw, pdfH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (pdfW - dw) / 2;
  const dy = (pdfH - dh) / 2;
  doc.addImage(img, 'PNG', dx, dy, dw, dh);
}

type PdfCanvasRasterMode = 'lessonPng' | 'feedbackAlpha';

/** 将画布编码为嵌入 PDF 的位图：文字优先清晰度，统一使用 PNG；反馈透明层也保留 PNG 避免黑底 */
function canvasToPdfImageData(
  canvas: HTMLCanvasElement,
  mode: PdfCanvasRasterMode
): { dataUrl: string; format: 'PNG' } {
  if (mode === 'lessonPng') {
    return { dataUrl: canvas.toDataURL('image/png'), format: 'PNG' };
  }
  return { dataUrl: canvas.toDataURL('image/png'), format: 'PNG' };
}

/**
 * 将画布追加到 PDF。单页画布高度通常不超过一页；若仍超高（极少）则按片切片。
 * @param startWithNewPage 非首段画布时先 addPage
 * @param fullPageBackground 存在时先铺满整页（含边距），再叠内容区画布（宜为透明底仅文字）
 * @param rasterMode 选择画布嵌入格式
 */
function appendCanvasToPdf(
  doc: jsPDF,
  canvas: HTMLCanvasElement,
  orient: 'p' | 'l',
  startWithNewPage: boolean,
  fullPageBackground: HTMLImageElement | null | undefined,
  rasterMode: PdfCanvasRasterMode
): void {
  const { dataUrl: imgData, format: imgFormat } = canvasToPdfImageData(canvas, rasterMode);
  const pdfW = doc.internal.pageSize.getWidth();
  const pdfH = doc.internal.pageSize.getHeight();
  const m = PDF_PAGE_MARGIN_MM;
  const contentW = Math.max(1, pdfW - 2 * m);
  const contentH = Math.max(1, pdfH - 2 * m);
  const props = doc.getImageProperties(imgData);
  const drawH = (props.height * contentW) / props.width;
  const o = orient === 'l' ? 'l' : 'p';

  if (drawH <= contentH + PDF_SINGLE_PAGE_EPSILON_MM) {
    if (startWithNewPage) doc.addPage('a4', o);
    if (fullPageBackground && fullPageBackground.naturalWidth > 0) {
      drawPdfFullPageBackgroundCover(doc, fullPageBackground);
    }
    doc.addImage(imgData, imgFormat, m, m, contentW, drawH);
    return;
  }

  let offset = 0;
  let first = true;
  while (offset < drawH - PDF_TAIL_SLICE_IGNORE_MM) {
    if (!first || startWithNewPage) doc.addPage('a4', o);
    first = false;
    if (fullPageBackground && fullPageBackground.naturalWidth > 0) {
      drawPdfFullPageBackgroundCover(doc, fullPageBackground);
    }
    doc.addImage(imgData, imgFormat, m, m - offset, contentW, drawH);
    offset += contentH;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const t = text ?? '';
  if (!t) return [''];
  const lines: string[] = [];
  let cur = '';
  for (const ch of Array.from(t)) {
    const next = cur + ch;
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** 反馈正文：Pretext 排版 + 与 canvas 相同 font 串，失败时回退逐字 wrap */
function wrapFeedbackText(text: string, maxW: number): string[] {
  const t = text ?? '';
  if (!t) return [''];
  try {
    const prepared = prepareWithSegments(t, FEEDBACK_FONT);
    const { lines } = layoutWithLines(prepared, maxW, FEEDBACK_LINE);
    if (lines.length === 0) return [''];
    return lines.map((l) => l.text);
  } catch {
    const c = scratchCtx();
    c.font = FEEDBACK_FONT;
    return wrap(c, t, maxW);
  }
}

function scratchCtx(): CanvasRenderingContext2D {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = FONT;
  return c;
}

function loadImageForCanvas(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('[FeedbackPDF] 背景图加载失败:', src);
      resolve(null);
    };
    img.src = src;
  });
}

function makeCanvas(
  cssW: number,
  cssH: number,
  options?: { transparent?: boolean; scale?: number }
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const scale = options?.scale ?? PDF_LESSON_CANVAS_SCALE;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(cssW * scale);
  canvas.height = Math.ceil(cssH * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  if (!options?.transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssW, cssH);
  }
  return { canvas, ctx };
}

export type LessonPdfRow = {
  campus: string;
  date: string;
  time: string;
  className: string;
  lessonDetails: string;
  feedbackGiven: string;
  classId: number | string;
};

/** 列宽占表宽比例（合计 1），偏长文案给 Class / Details */
const LESSON_COL_FRAC = [0.1, 0.09, 0.11, 0.3, 0.26, 0.06, 0.08] as const;

function lessonTableColumnWidths(tableInnerW: number): number[] {
  const raw = LESSON_COL_FRAC.map((f) => Math.floor(f * tableInnerW));
  const drift = tableInnerW - raw.reduce((a, b) => a + b, 0);
  raw[raw.length - 1] += drift;
  return raw;
}

/** Lesson Overview — Lesson Details（按表格行分页，避免跨页裁切文字） */
export function exportLessonDetailsPdf(
  filename: string,
  meta: { monthLabel: string; staffName: string },
  rows: LessonPdfRow[],
  totalDuration: string
): void {
  const cssW = 1120;
  const tx = PAD;
  const innerW = cssW - 2 * PAD;
  const colW = lessonTableColumnWidths(innerW);
  const sumW = innerW;
  const cellPadX = 4;
  const textMax = (i: number) => Math.max(16, colW[i] - 2 * cellPadX);

  const heads = ['Campus', 'Date', 'Time', 'Class Name', 'Lesson Details', 'Fb', 'Class ID'];

  const measure = scratchCtx();

  const headerLineBlocks = heads.map((h, i) => wrap(measure, h, textMax(i)));
  const headerH =
    Math.max(1, ...headerLineBlocks.map((lines) => lines.length)) * LINE + 16;

  const rowHeights = rows.map((row) => {
    const cells = [
      row.campus,
      row.date,
      row.time,
      row.className,
      row.lessonDetails,
      row.feedbackGiven,
      String(row.classId),
    ];
    const blocks = cells.map((c, i) => wrap(measure, String(c), textMax(i)));
    const linesInRow = Math.max(1, ...blocks.map((b) => b.length));
    return linesInRow * LINE + 12;
  });

  const footerLines = wrap(measure, totalDuration, textMax(4));
  const footerH = Math.max(32, footerLines.length * LINE + 16);

  const maxH = getMaxCanvasHeightPxForA4Page('l', cssW);
  const titleH = 36;
  const gapAfterHeader = 4;
  const startBodyY = PAD + titleH + headerH + gapAfterHeader;

  const pages: LessonPdfRow[][] = [];
  let idx = 0;
  while (idx < rows.length) {
    const batch: LessonPdfRow[] = [];
    let cy = startBodyY;
    while (idx < rows.length) {
      const rH = rowHeights[idx];
      const remainingAfter = rows.length - idx - 1;
      const bottomLimit = remainingAfter === 0 ? maxH - PAD - footerH : maxH - PAD;
      if (cy + rH > bottomLimit) break;
      batch.push(rows[idx]);
      cy += rH;
      idx++;
    }
    if (batch.length === 0 && idx < rows.length) {
      batch.push(rows[idx]);
      idx++;
    }
    pages.push(batch);
  }
  if (pages.length === 0) {
    pages.push([]);
  }

  const doc = new jsPDF('l', 'mm', 'a4', true);
  let firstCanvas = true;

  for (let pi = 0; pi < pages.length; pi++) {
    const pageRows = pages[pi];
    const isLast = pi === pages.length - 1;
    let rowBase = 0;
    for (let k = 0; k < pi; k++) {
      rowBase += pages[k].length;
    }
    let bodyH = 0;
    for (let j = 0; j < pageRows.length; j++) {
      bodyH += rowHeights[rowBase + j];
    }

    const cssH =
      PAD + titleH + headerH + gapAfterHeader + bodyH + (isLast ? footerH + PAD : PAD);
    const { canvas, ctx } = makeCanvas(cssW, cssH, { scale: PDF_LESSON_CANVAS_SCALE });

    let y = PAD;
    ctx.fillStyle = '#111827';
    ctx.font = FONT_BOLD;
    const titleText =
      pi === 0
        ? `Lesson Details — ${meta.staffName} — ${meta.monthLabel}`
        : `Lesson Details — ${meta.staffName} — ${meta.monthLabel} · 续页`;
    ctx.fillText(titleText, tx, y + 12);
    y += titleH;
    ctx.font = FONT;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(tx, y, sumW, headerH);
    ctx.fillStyle = '#374151';
    ctx.font = FONT_BOLD;
    let hx = tx;
    headerLineBlocks.forEach((lines, i) => {
      let hy = y + 14;
      for (const ln of lines) {
        ctx.fillText(ln, hx + cellPadX, hy);
        hy += LINE;
      }
      hx += colW[i];
    });
    y += headerH + gapAfterHeader;
    ctx.font = FONT;

    pageRows.forEach((row, j) => {
      const r = rowBase + j;
      const cells = [
        row.campus,
        row.date,
        row.time,
        row.className,
        row.lessonDetails,
        row.feedbackGiven,
        String(row.classId),
      ];
      const blocks = cells.map((c, i) => wrap(ctx, String(c), textMax(i)));
      const linesInRow = Math.max(1, ...blocks.map((b) => b.length));
      const rowH = linesInRow * LINE + 12;

      ctx.fillStyle = r % 2 === 0 ? '#ffffff' : '#fafafa';
      ctx.fillRect(tx, y, sumW, rowH);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      let vx = tx;
      for (let c = 1; c < colW.length; c++) {
        vx += colW[c - 1];
        ctx.beginPath();
        ctx.moveTo(vx, y);
        ctx.lineTo(vx, y + rowH);
        ctx.stroke();
      }

      ctx.fillStyle = '#111827';
      let cx = tx;
      blocks.forEach((lines, ci) => {
        let ly = y + 14;
        for (const ln of lines) {
          ctx.fillText(ln, cx + cellPadX, ly);
          ly += LINE;
        }
        cx += colW[ci];
      });

      ctx.beginPath();
      ctx.moveTo(tx, y + rowH);
      ctx.lineTo(tx + sumW, y + rowH);
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();

      y += rowH;
    });

    if (isLast) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(tx, y, sumW, footerH);
      ctx.fillStyle = '#111827';
      ctx.font = FONT_BOLD;
      ctx.fillText('Total lesson time', tx + cellPadX, y + 20);
      ctx.font = FONT;
      let ty = y + 20;
      footerLines.forEach((ln) => {
        ctx.fillText(ln, tx + colW[0] + colW[1] + colW[2] + colW[3] + cellPadX, ty);
        ty += LINE;
      });
    }

    appendCanvasToPdf(doc, canvas, 'l', !firstCanvas, null, 'lessonPng');
    firstCanvas = false;
  }

  doc.save(filename);
}

export type FeedbackPdfItem = {
  topic_name: string;
  teacher_name: string;
  time_format: string;
  note: string;
};

export type ExportFeedbackListPdfOptions = {
  /** 传给 `api-echo-params?key=FEEDBACK_BG_FILENAME` 的额外 query（后端支持后使用） */
  feedbackBgEchoExtra?: Record<string, string>;
};

export async function exportFeedbackListPdf(
  filename: string,
  meta: { studentName: string; exportedAt: string },
  items: FeedbackPdfItem[],
  options?: ExportFeedbackListPdfOptions
): Promise<void> {
  const cssW = FEEDBACK_CSS_W;
  const noteMaxW = cssW - 2 * PAD - 16;

  const itemHeights = items.map((it) => {
    const noteLines = wrapFeedbackText(it.note || '—', noteMaxW);
    return 10 + 24 + 22 + 20 + noteLines.length * FEEDBACK_LINE + 12;
  });

  const maxH = getMaxCanvasHeightPxForA4Page('p', cssW);
  /** 标题 + 导出时间与首条分隔线起点（与下方绘制一致：28+28） */
  const headBlockH = 56;
  const startBodyY = PAD + headBlockH;

  const pages: FeedbackPdfItem[][] = [];
  let idx = 0;
  while (idx < items.length) {
    const batch: FeedbackPdfItem[] = [];
    let cy = startBodyY;
    while (idx < items.length) {
      const rH = itemHeights[idx];
      if (cy + rH > maxH - PAD) break;
      batch.push(items[idx]);
      cy += rH;
      idx++;
    }
    if (batch.length === 0 && idx < items.length) {
      batch.push(items[idx]);
      idx++;
    }
    pages.push(batch);
  }
  if (pages.length === 0) {
    pages.push([]);
  }

  const resolved = await resolveFeedbackPdfBackgroundImageSrc(options?.feedbackBgEchoExtra);
  let bgImg: HTMLImageElement | null = null;
  if (resolved.src) {
    bgImg = await loadImageForCanvas(resolved.src);
  }

  if (isFeedbackPdfDebugEnabled()) {
    console.log('[FeedbackPDF] 导出', {
      filename,
      pages: pages.length,
      canvasCssW: cssW,
      background: {
        source: resolved.source,
        src: resolved.src,
        echoCode: resolved.echoCode,
        echoRaw: resolved.echoRaw,
        loaded: !!(bgImg && bgImg.naturalWidth > 0),
        natural: bgImg ? { w: bgImg.naturalWidth, h: bgImg.naturalHeight } : null,
      },
    });
  }

  const doc = new jsPDF('p', 'mm', 'a4', true);
  let firstCanvas = true;

  for (let pi = 0; pi < pages.length; pi++) {
    const pageItems = pages[pi];
    let itemBase = 0;
    for (let k = 0; k < pi; k++) {
      itemBase += pages[k].length;
    }
    let bodyH = 0;
    for (let j = 0; j < pageItems.length; j++) {
      bodyH += itemHeights[itemBase + j];
    }
    const naturalH = PAD + headBlockH + bodyH + PAD;
    /** 短页也占满一页可排版高度，避免背景只在文字区域居中缩小 */
    const cssH = Math.max(naturalH, maxH);

    const { canvas, ctx } = makeCanvas(cssW, cssH, {
      transparent: !!(bgImg && bgImg.naturalWidth > 0),
      scale: PDF_FEEDBACK_CANVAS_SCALE,
    });

    if (resolved.src && !(bgImg && bgImg.naturalWidth > 0)) {
      console.warn('[FeedbackPDF] 背景图未绘制（加载失败或尺寸为 0）', { src: resolved.src });
    }

    let y = PAD;

    ctx.fillStyle = '#111827';
    ctx.font = FEEDBACK_FONT_BOLD;
    const titleText =
      pi === 0 ? `学生反馈 — ${meta.studentName}` : `学生反馈 — ${meta.studentName} · 续页`;
    ctx.fillText(titleText, PAD, y + 14);
    y += 28;
    ctx.font = FEEDBACK_FONT;
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`导出时间：${meta.exportedAt}`, PAD, y + 12);
    y += 28;
    ctx.fillStyle = '#111827';

    for (const it of pageItems) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(cssW - PAD, y);
      ctx.stroke();
      y += 10;

      ctx.font = FEEDBACK_FONT_BOLD;
      ctx.fillStyle = '#111827';
      ctx.fillText(it.topic_name, PAD + 4, y + 14);
      y += 24;

      ctx.font = FEEDBACK_FONT;
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`${it.time_format} · 教师：${it.teacher_name}`, PAD + 4, y + 12);
      y += 22;

      ctx.fillStyle = '#374151';
      ctx.fillText('反馈内容：', PAD + 4, y + 12);
      y += 20;

      const nls = wrapFeedbackText(it.note || '—', noteMaxW);
      for (const ln of nls) {
        ctx.fillText(ln, PAD + 4, y + 12);
        y += FEEDBACK_LINE;
      }
      y += 12;
    }

    appendCanvasToPdf(
      doc,
      canvas,
      'p',
      !firstCanvas,
      bgImg && bgImg.naturalWidth > 0 ? bgImg : null,
      'feedbackAlpha'
    );
    firstCanvas = false;
  }

  doc.save(filename);
}
