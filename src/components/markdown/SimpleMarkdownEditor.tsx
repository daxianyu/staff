'use client';

import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  CloudArrowUpIcon,
  CodeBracketIcon,
  EyeIcon,
  LinkIcon,
  ListBulletIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import { markdownLinkDestination } from '@/utils/markdownSafe';

type ViewMode = 'write' | 'split' | 'preview';

interface SelectionRange {
  start: number;
  end: number;
}

interface TransformResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function ToolbarButton({
  disabled = false,
  title,
  onClick,
  children,
}: {
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
    >
      {children}
    </button>
  );
}

export interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 上传文件并返回可访问 URL（完整或相对路径，用于插入 Markdown） */
  uploadFile: (file: File) => Promise<{ ok: boolean; url: string; name: string }>;
  /** 预览区：相对路径图片/附件链接解析（正文建议存相对路径，展示时再拼 API 域名） */
  previewResolveMediaUrl?: (src: string) => string;
  disabled?: boolean;
  minHeightPx?: number;
}

export default function SimpleMarkdownEditor({
  value,
  onChange,
  placeholder = '支持 Markdown：标题、列表、粗体、链接、代码块等。',
  uploadFile,
  previewResolveMediaUrl,
  disabled = false,
  minHeightPx = 320,
}: SimpleMarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [uploading, setUploading] = useState<'image' | 'file' | null>(null);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef<SelectionRange>({ start: 0, end: 0 });

  const syncSelection = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    selectionRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
  }, []);

  const focusEditor = useCallback((sel?: SelectionRange) => {
    const next = sel ?? selectionRef.current;
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(next.start, next.end);
      selectionRef.current = next;
    });
  }, []);

  const applyTransform = useCallback(
    (fn: (current: string, range: SelectionRange) => TransformResult) => {
      const ta = textareaRef.current;
      const range = ta
        ? { start: ta.selectionStart, end: ta.selectionEnd }
        : selectionRef.current;
      const result = fn(value, range);
      onChange(result.value);
      selectionRef.current = { start: result.selectionStart, end: result.selectionEnd };
      if (viewMode === 'preview') {
        setViewMode('split');
        requestAnimationFrame(() => focusEditor(selectionRef.current));
        return;
      }
      focusEditor(selectionRef.current);
    },
    [value, onChange, viewMode, focusEditor]
  );

  const wrapSelection = useCallback(
    (before: string, after: string, placeholder: string) => {
      applyTransform((current, range) => {
        const sel = current.slice(range.start, range.end);
        const inner = sel || placeholder;
        const next = `${current.slice(0, range.start)}${before}${inner}${after}${current.slice(range.end)}`;
        const s = range.start + before.length;
        const e = s + inner.length;
        return { value: next, selectionStart: s, selectionEnd: e };
      });
    },
    [applyTransform]
  );

  const prefixSelectedLines = useCallback(
    (prefix: string, placeholder: string) => {
      applyTransform((current, range) => {
        const lineStart = current.lastIndexOf('\n', Math.max(0, range.start - 1)) + 1;
        const nextBr = current.indexOf('\n', range.end);
        const lineEnd = nextBr === -1 ? current.length : nextBr;
        const block = current.slice(lineStart, lineEnd) || placeholder;
        const transformed = block
          .split('\n')
          .map((line) => `${prefix}${line || placeholder}`)
          .join('\n');
        const next = `${current.slice(0, lineStart)}${transformed}${current.slice(lineEnd)}`;
        return {
          value: next,
          selectionStart: lineStart,
          selectionEnd: lineStart + transformed.length,
        };
      });
    },
    [applyTransform]
  );

  const insertTemplate = useCallback(
    (template: string, cursorOffset?: number) => {
      applyTransform((current, range) => {
        const next = `${current.slice(0, range.start)}${template}${current.slice(range.end)}`;
        const c =
          typeof cursorOffset === 'number' ? range.start + cursorOffset : range.start + template.length;
        return { value: next, selectionStart: c, selectionEnd: c };
      });
    },
    [applyTransform]
  );

  const buildMdLink = (name: string, url: string, image: boolean) => {
    const safe = name.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const dest = markdownLinkDestination(url);
    return image ? `![${safe}](${dest})` : `[${safe}](${dest})`;
  };

  const insertAtCursor = useCallback(
    (snippets: string[]) => {
      applyTransform((current, range) => {
        const before = current.slice(0, range.start);
        const after = current.slice(range.end);
        const inserted = snippets.join('\n\n');
        const lead = before && !before.endsWith('\n') ? '\n\n' : '';
        const trail = after && !after.startsWith('\n') ? '\n\n' : '';
        const mid = `${lead}${inserted}${trail}`;
        const next = `${before}${mid}${after}`;
        const pos = before.length + mid.length;
        return { value: next, selectionStart: pos, selectionEnd: pos };
      });
    },
    [applyTransform]
  );

  const handleUploadFiles = async (files: File[], mode: 'image' | 'file' | 'auto') => {
    if (!files.length || disabled) return;
    setUploading(mode === 'image' ? 'image' : 'file');
    try {
      const snippets: string[] = [];
      for (const file of files) {
        const res = await uploadFile(file);
        if (!res.ok || !res.url) continue;
        const isImg =
          mode === 'image' || (mode === 'auto' && file.type.startsWith('image/'));
        snippets.push(buildMdLink(res.name || file.name, res.url, isImg));
      }
      if (snippets.length) insertAtCursor(snippets);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          await handleUploadFiles(files, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.png,.jpg,.jpeg,.gif,.webp"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          await handleUploadFiles(files, 'file');
          e.target.value = '';
        }}
      />

      <div className="border-b border-gray-100 px-3 py-2 sm:px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-gray-50/80">
        <div className="flex flex-wrap gap-1.5">
          <ToolbarButton title="二级标题" disabled={disabled} onClick={() => prefixSelectedLines('## ', '标题')}>
            H2
          </ToolbarButton>
          <ToolbarButton title="粗体" disabled={disabled} onClick={() => wrapSelection('**', '**', '粗体')}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton title="斜体" disabled={disabled} onClick={() => wrapSelection('*', '*', '斜体')}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton title="无序列表" disabled={disabled} onClick={() => prefixSelectedLines('- ', '列表项')}>
            <ListBulletIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="链接"
            disabled={disabled}
            onClick={() => wrapSelection('[', '](https://)', '文字')}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="行内代码" disabled={disabled} onClick={() => wrapSelection('`', '`', 'code')}>
            <CodeBracketIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="代码块"
            disabled={disabled}
            onClick={() => insertTemplate('\n```\n代码\n```\n', 5)}
          >
            {'{}'}
          </ToolbarButton>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <ToolbarButton
            title="插入图片"
            disabled={disabled || Boolean(uploading)}
            onClick={() => imageInputRef.current?.click()}
          >
            <PhotoIcon className="h-4 w-4" />
            {uploading === 'image' ? '…' : '图片'}
          </ToolbarButton>
          <ToolbarButton
            title="插入附件"
            disabled={disabled || Boolean(uploading)}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            {uploading === 'file' ? '…' : '附件'}
          </ToolbarButton>
          <div className="flex rounded-lg bg-gray-200/80 p-0.5 ml-1">
            {(
              [
                ['write', '编辑'],
                ['split', '分栏'],
                ['preview', '预览'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                disabled={disabled}
                onClick={() => setViewMode(k)}
                className={`rounded-md px-2 py-1 text-xs ${
                  viewMode === k ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                {k === 'preview' ? (
                  <span className="inline-flex items-center gap-1">
                    <EyeIcon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ) : (
                  label
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid ${viewMode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {viewMode !== 'preview' && (
          <div
            className={`relative ${viewMode === 'split' ? 'border-b md:border-b-0 md:border-r border-gray-100' : ''}`}
          >
            {dragging && (
              <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/90 text-xs font-medium text-blue-700">
                松手上传并插入 Markdown
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              onSelect={syncSelection}
              onClick={syncSelection}
              onKeyUp={syncSelection}
              onDrop={async (e) => {
                const files = Array.from(e.dataTransfer.files || []);
                if (!files.length) return;
                e.preventDefault();
                setDragging(false);
                await handleUploadFiles(files, 'auto');
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                setDragging(false);
              }}
              onPaste={async (e) => {
                const files = Array.from(e.clipboardData.files || []).filter((f) =>
                  f.type.startsWith('image/')
                );
                if (!files.length) return;
                e.preventDefault();
                await handleUploadFiles(files, 'image');
              }}
              placeholder={placeholder}
              spellCheck={false}
              className="w-full resize-none border-0 bg-transparent px-3 py-3 font-mono text-sm leading-6 text-gray-900 outline-none disabled:bg-gray-50 sm:px-4"
              style={{ minHeight: minHeightPx }}
            />
          </div>
        )}
        {viewMode !== 'write' && (
          <div
            className="bg-gray-50/80 px-3 py-3 sm:px-4 overflow-y-auto"
            style={{ minHeight: minHeightPx }}
          >
            {value.trim() ? (
              <MarkdownContent content={value} resolveMediaUrl={previewResolveMediaUrl} />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-400">
                预览：编写左侧 Markdown
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
