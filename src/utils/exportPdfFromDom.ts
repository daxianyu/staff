/**
 * Canvas 绘制 + jsPDF，不依赖 html2canvas（避免空白 / Tailwind color() 问题）。
 * 使用系统字体栈渲染中英文。
 */

import { jsPDF } from 'jspdf';

const FONT = '12px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans GB", sans-serif';
const FONT_BOLD = 'bold 12px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans GB", sans-serif';
const LINE = 18;
const PAD = 20;
const S = 2;

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

function scratchCtx(): CanvasRenderingContext2D {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = FONT;
  return c;
}

function makeCanvas(cssW: number, cssH: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(cssW * S);
  canvas.height = Math.ceil(cssH * S);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(S, S);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cssW, cssH);
  return { canvas, ctx };
}

function addCanvasPages(doc: jsPDF, canvas: HTMLCanvasElement, orient: 'p' | 'l'): void {
  const imgData = canvas.toDataURL('image/png');
  const pdfW = doc.internal.pageSize.getWidth();
  const pdfH = doc.internal.pageSize.getHeight();
  const props = doc.getImageProperties(imgData);
  const drawH = (props.height * pdfW) / props.width;

  let left = drawH;
  let pos = 0;

  doc.addImage(imgData, 'PNG', 0, pos, pdfW, drawH);
  left -= pdfH;

  const o = orient === 'l' ? 'l' : 'p';
  while (left > 0) {
    pos = left - drawH;
    doc.addPage('a4', o);
    doc.addImage(imgData, 'PNG', 0, pos, pdfW, drawH);
    left -= pdfH;
  }
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

/** Lesson Overview — Lesson Details */
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

  let bodyH = 0;
  for (const row of rows) {
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
    bodyH += linesInRow * LINE + 12;
  }

  const footerLines = wrap(measure, totalDuration, textMax(4));
  const footerH = Math.max(32, footerLines.length * LINE + 16);
  const cssH = PAD + 36 + headerH + 6 + bodyH + footerH + PAD;
  const { canvas, ctx } = makeCanvas(cssW, cssH);

  let y = PAD;
  ctx.fillStyle = '#111827';
  ctx.font = FONT_BOLD;
  ctx.fillText(`Lesson Details — ${meta.staffName} — ${meta.monthLabel}`, tx, y + 12);
  y += 36;
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
  y += headerH + 4;
  ctx.font = FONT;

  rows.forEach((row, r) => {
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

  const doc = new jsPDF('l', 'mm', 'a4');
  addCanvasPages(doc, canvas, 'l');
  doc.save(filename);
}

export type FeedbackPdfItem = {
  topic_name: string;
  teacher_name: string;
  time_format: string;
  note: string;
};

export function exportFeedbackListPdf(
  filename: string,
  meta: { studentName: string; exportedAt: string },
  items: FeedbackPdfItem[]
): void {
  const cssW = 800;
  const m = scratchCtx();

  let simY = PAD + 36 + 24;
  for (const it of items) {
    const noteLines = wrap(m, it.note || '—', cssW - 2 * PAD - 16);
    simY += 10 + 24 + 22 + 20 + noteLines.length * LINE + 12;
  }
  const cssH = simY + PAD;

  const { canvas, ctx } = makeCanvas(cssW, Math.max(360, cssH));
  let y = PAD;

  ctx.fillStyle = '#111827';
  ctx.font = FONT_BOLD;
  ctx.fillText(`学生反馈 — ${meta.studentName}`, PAD, y + 14);
  y += 28;
  ctx.font = FONT;
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`导出时间：${meta.exportedAt}`, PAD, y + 12);
  y += 28;
  ctx.fillStyle = '#111827';

  for (const it of items) {
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(cssW - PAD, y);
    ctx.stroke();
    y += 10;

    ctx.font = FONT_BOLD;
    ctx.fillStyle = '#111827';
    ctx.fillText(it.topic_name, PAD + 4, y + 14);
    y += 24;

    ctx.font = FONT;
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${it.time_format} · 教师：${it.teacher_name}`, PAD + 4, y + 12);
    y += 22;

    ctx.fillStyle = '#374151';
    ctx.fillText('反馈内容：', PAD + 4, y + 12);
    y += 20;

    const nls = wrap(ctx, it.note || '—', cssW - 2 * PAD - 16);
    for (const ln of nls) {
      ctx.fillText(ln, PAD + 4, y + 12);
      y += LINE;
    }
    y += 12;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  addCanvasPages(doc, canvas, 'p');
  doc.save(filename);
}
