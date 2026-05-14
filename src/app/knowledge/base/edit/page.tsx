'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import {
  getArticleInfo,
  updateArticle,
  uploadArticleFile,
  type ArticleDetail,
} from '@/services/auth';
import { buildFileUrl } from '@/config/env';
import { markdownLinkDestination } from '@/utils/markdownSafe';

type EditorViewMode = 'write' | 'split' | 'preview';

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
  active = false,
  disabled = false,
  title,
  onClick,
  children,
}: {
  active?: boolean;
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
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export default function KnowledgeEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const articleId = searchParams.get('articleId') ? Number(searchParams.get('articleId')) : null;
  const spaceId = searchParams.get('spaceId') ? Number(searchParams.get('spaceId')) : null;
  const isNew = searchParams.get('new') === 'true';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSpaceId, setEditSpaceId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
  const [uploadingAsset, setUploadingAsset] = useState<'image' | 'file' | null>(null);
  const [lastUploadedLink, setLastUploadedLink] = useState<string | null>(null);
  const [draggingFiles, setDraggingFiles] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef<SelectionRange>({ start: 0, end: 0 });
  const initialSnapshotRef = useRef({ title: '', content: '' });

  const lineCount = useMemo(() => (editContent ? editContent.split(/\r?\n/).length : 0), [editContent]);
  const charCount = useMemo(() => editContent.length, [editContent]);
  const isDirty = editTitle !== initialSnapshotRef.current.title || editContent !== initialSnapshotRef.current.content;

  const syncSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    selectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }, []);

  const focusEditor = useCallback((selection?: SelectionRange) => {
    const nextSelection = selection ?? selectionRef.current;
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextSelection.start, nextSelection.end);
      selectionRef.current = nextSelection;
    });
  }, []);

  const applyTransform = useCallback((transformer: (current: string, range: SelectionRange) => TransformResult) => {
    const currentRange = textareaRef.current
      ? {
          start: textareaRef.current.selectionStart,
          end: textareaRef.current.selectionEnd,
        }
      : selectionRef.current;

    const result = transformer(editContent, currentRange);
    setEditContent(result.value);
    selectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };

    if (viewMode === 'preview') {
      setViewMode('split');
      requestAnimationFrame(() => focusEditor(selectionRef.current));
      return;
    }

    focusEditor(selectionRef.current);
  }, [editContent, focusEditor, viewMode]);

  const wrapSelection = useCallback((before: string, after: string, placeholder: string) => {
    applyTransform((current, range) => {
      const selected = current.slice(range.start, range.end);
      const content = selected || placeholder;
      const nextValue = `${current.slice(0, range.start)}${before}${content}${after}${current.slice(range.end)}`;
      const selectionStart = range.start + before.length;
      const selectionEnd = selectionStart + content.length;
      return {
        value: nextValue,
        selectionStart,
        selectionEnd,
      };
    });
  }, [applyTransform]);

  const prefixSelectedLines = useCallback((prefix: string, placeholder: string) => {
    applyTransform((current, range) => {
      const lineStart = current.lastIndexOf('\n', Math.max(0, range.start - 1)) + 1;
      const nextLineBreak = current.indexOf('\n', range.end);
      const lineEnd = nextLineBreak === -1 ? current.length : nextLineBreak;
      const selectedBlock = current.slice(lineStart, lineEnd) || placeholder;
      const transformedBlock = selectedBlock
        .split('\n')
        .map((line) => `${prefix}${line || placeholder}`)
        .join('\n');

      const nextValue = `${current.slice(0, lineStart)}${transformedBlock}${current.slice(lineEnd)}`;
      return {
        value: nextValue,
        selectionStart: lineStart,
        selectionEnd: lineStart + transformedBlock.length,
      };
    });
  }, [applyTransform]);

  const insertTemplate = useCallback((template: string, cursorOffset?: number) => {
    applyTransform((current, range) => {
      const nextValue = `${current.slice(0, range.start)}${template}${current.slice(range.end)}`;
      const nextCursor = typeof cursorOffset === 'number' ? range.start + cursorOffset : range.start + template.length;
      return {
        value: nextValue,
        selectionStart: nextCursor,
        selectionEnd: nextCursor,
      };
    });
  }, [applyTransform]);

  const handleBack = useCallback(() => {
    if (saving) return;
    if (isDirty && !window.confirm('当前内容尚未保存，确认离开吗？')) {
      return;
    }

    try {
      if (window.opener) {
        window.close();
        return;
      }
    } catch (closeError) {
      console.error('关闭窗口失败:', closeError);
    }

    router.push('/knowledge/base');
  }, [isDirty, router, saving]);

  const buildMarkdownLink = useCallback((file: File, url: string, mode: 'image' | 'file' | 'auto') => {
    const safeName = file.name.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const isImage = mode === 'image' || (mode === 'auto' && file.type.startsWith('image/'));
    const dest = markdownLinkDestination(url);
    return isImage ? `![${safeName}](${dest})` : `[${safeName}](${dest})`;
  }, []);

  const uploadAndInsertFiles = useCallback(async (files: File[], mode: 'image' | 'file' | 'auto') => {
    if (!files.length) return;

    setUploadingAsset(mode === 'image' ? 'image' : 'file');
    setError(null);
    setSuccess(null);

    try {
      const snippets: string[] = [];
      let latestUrl: string | null = null;

      for (const file of files) {
        const response = await uploadArticleFile(file);
        if (response.code !== 200 || (!response.data?.file_path && !response.data?.url)) {
          throw new Error(response.message || `${file.name} 上传失败`);
        }
        const url = buildFileUrl(response.data.url || response.data.file_path);
        latestUrl = url;
        snippets.push(buildMarkdownLink(file, url, mode));
      }

      applyTransform((current, range) => {
        const before = current.slice(0, range.start);
        const after = current.slice(range.end);
        const inserted = snippets.join('\n\n');
        const leadingBreak = before && !before.endsWith('\n') ? '\n\n' : '';
        const trailingBreak = after && !after.startsWith('\n') ? '\n\n' : '';
        const finalText = `${leadingBreak}${inserted}${trailingBreak}`;
        const nextValue = `${before}${finalText}${after}`;
        const selectionStart = before.length + finalText.length;
        return {
          value: nextValue,
          selectionStart,
          selectionEnd: selectionStart,
        };
      });
      setLastUploadedLink(latestUrl);
      setSuccess(files.length === 1 ? '文件已上传并插入正文' : `已上传 ${files.length} 个文件并插入正文`);
    } catch (uploadError) {
      console.error('文件上传失败:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : '文件上传失败');
    } finally {
      setUploadingAsset(null);
    }
  }, [applyTransform, buildMarkdownLink]);

  const handleImageInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadAndInsertFiles(files, 'image');
    e.target.value = '';
  }, [uploadAndInsertFiles]);

  const handleAttachmentInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadAndInsertFiles(files, 'file');
    e.target.value = '';
  }, [uploadAndInsertFiles]);

  const loadArticle = useCallback(async () => {
    if (isNew) {
      setEditSpaceId(spaceId);
      setEditTitle('');
      setEditContent('');
      initialSnapshotRef.current = { title: '', content: '' };
      setLoading(false);
      return;
    }

    if (!articleId) {
      setError('缺少文章ID参数');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getArticleInfo(articleId);
      if (response.code === 200 && response.data) {
        const articleData = response.data;
        if (user == null || Number(articleData.author) !== Number(user.id)) {
          setError('只有作者本人才能编辑文章');
          setLoading(false);
          return;
        }

        setArticle(articleData);
        setEditTitle(articleData.title);
        setEditContent(articleData.article_info || '');
        setEditSpaceId(spaceId || null);
        initialSnapshotRef.current = {
          title: articleData.title,
          content: articleData.article_info || '',
        };
      } else {
        setError(response.message || '获取文章详情失败');
      }
    } catch (loadError) {
      console.error('加载文章失败:', loadError);
      setError('加载文章时发生错误');
    } finally {
      setLoading(false);
    }
  }, [articleId, isNew, spaceId, user]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || saving) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, saving]);

  const handleSave = useCallback(async () => {
    if (!editTitle.trim()) {
      setError('请输入文章标题');
      return;
    }
    if (!editSpaceId) {
      setError('缺少目录信息');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const params: {
        record_id?: number;
        article_info: string;
        title: string;
        space_id: number;
      } = {
        article_info: editContent,
        title: editTitle.trim(),
        space_id: editSpaceId,
      };

      if (!isNew && articleId) {
        params.record_id = articleId;
      }

      const response = await updateArticle(params);

      if (response.code === 200) {
        initialSnapshotRef.current = {
          title: editTitle.trim(),
          content: editContent,
        };
        setSuccess(isNew ? '文章创建成功' : '文章更新成功');
        setTimeout(() => {
          try {
            if (window.opener) {
              window.close();
              if (window.opener && !window.opener.closed) {
                window.opener.location.reload();
              }
            } else {
              router.push('/knowledge/base');
            }
          } catch (saveError) {
            console.error('保存后跳转失败:', saveError);
            router.push('/knowledge/base');
          }
        }, 1200);
      } else {
        setError(response.message || (isNew ? '创建文章失败' : '更新文章失败'));
      }
    } catch (saveError) {
      console.error('保存文章失败:', saveError);
      setError('保存文章时发生错误');
    } finally {
      setSaving(false);
    }
  }, [articleId, editContent, editSpaceId, editTitle, isNew, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const metaKey = navigator.platform.toUpperCase().includes('MAC') ? event.metaKey : event.ctrlKey;

      if (metaKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }

      if (!metaKey || document.activeElement !== textareaRef.current) return;

      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        wrapSelection('**', '**', '粗体');
      }

      if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        wrapSelection('*', '*', '斜体');
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        wrapSelection('[', '](https://example.com)', '链接文字');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, wrapSelection]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !article && !isNew) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">错误</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleImageInputChange}
      />
      <input
        ref={attachmentInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleAttachmentInputChange}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                返回知识库
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{isNew ? '新增文章' : '编辑文章'}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  支持 Markdown 语法、实时预览、拖拽上传、粘贴图片和快捷键保存。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${isDirty ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {isDirty ? '有未保存修改' : '内容已同步'}
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                目录 ID: {editSpaceId ?? '-'}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存文章'}
              </button>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className={`mb-6 rounded-xl border p-4 ${
            error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
          }`}>
            <div className="flex items-start">
              <ExclamationTriangleIcon className={`mr-2 mt-0.5 h-5 w-5 flex-shrink-0 ${
                error ? 'text-red-500' : 'text-green-600'
              }`} />
              <p className={`flex-1 text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>{error || success}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              文章标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="请输入文章标题"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <ToolbarButton title="一级标题" onClick={() => prefixSelectedLines('# ', '标题')}>
                    <span className="font-semibold">H1</span>
                  </ToolbarButton>
                  <ToolbarButton title="二级标题" onClick={() => prefixSelectedLines('## ', '小节标题')}>
                    <span className="font-semibold">H2</span>
                  </ToolbarButton>
                  <ToolbarButton title="粗体" onClick={() => wrapSelection('**', '**', '粗体')}>
                    <span className="font-semibold">B</span>
                  </ToolbarButton>
                  <ToolbarButton title="斜体" onClick={() => wrapSelection('*', '*', '斜体')}>
                    <span className="italic">I</span>
                  </ToolbarButton>
                  <ToolbarButton title="引用" onClick={() => prefixSelectedLines('> ', '引用内容')}>
                    <span>&gt;</span>
                  </ToolbarButton>
                  <ToolbarButton title="行内代码" onClick={() => wrapSelection('`', '`', 'code')}>
                    <CodeBracketIcon className="h-4 w-4" />
                    代码
                  </ToolbarButton>
                  <ToolbarButton title="无序列表" onClick={() => prefixSelectedLines('- ', '列表项')}>
                    <ListBulletIcon className="h-4 w-4" />
                    列表
                  </ToolbarButton>
                  <ToolbarButton title="有序列表" onClick={() => prefixSelectedLines('1. ', '列表项')}>
                    <NumberedListIcon className="h-4 w-4" />
                    编号
                  </ToolbarButton>
                  <ToolbarButton
                    title="插入链接"
                    onClick={() => wrapSelection('[', '](https://example.com)', '链接文字')}
                  >
                    <LinkIcon className="h-4 w-4" />
                    链接
                  </ToolbarButton>
                  <ToolbarButton
                    title="插入代码块"
                    onClick={() => insertTemplate('\n```text\n代码块\n```\n', 9)}
                  >
                    <CodeBracketIcon className="h-4 w-4" />
                    代码块
                  </ToolbarButton>
                  <ToolbarButton
                    title="插入表格"
                    onClick={() => insertTemplate('\n| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |\n')}
                  >
                    <span>表格</span>
                  </ToolbarButton>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ToolbarButton
                    title="上传图片并插入 Markdown 图片链接"
                    disabled={Boolean(uploadingAsset)}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <PhotoIcon className="h-4 w-4" />
                    {uploadingAsset === 'image' ? '上传图片中...' : '上传图片'}
                  </ToolbarButton>
                  <ToolbarButton
                    title="上传附件并插入 Markdown 链接"
                    disabled={Boolean(uploadingAsset)}
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <CloudArrowUpIcon className="h-4 w-4" />
                    {uploadingAsset === 'file' ? '上传附件中...' : '上传附件'}
                  </ToolbarButton>
                  <div className="flex items-center rounded-xl bg-gray-100 p-1">
                    {([
                      { key: 'write', label: '编辑' },
                      { key: 'split', label: '分栏' },
                      { key: 'preview', label: '预览' },
                    ] as Array<{ key: EditorViewMode; label: string }>).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setViewMode(item.key)}
                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          viewMode === item.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 px-6 py-3 text-xs text-gray-500">
              快捷键：`Ctrl/Cmd + S` 保存，`Ctrl/Cmd + B` 粗体，`Ctrl/Cmd + I` 斜体，`Ctrl/Cmd + K` 插入链接。编辑区支持拖拽文件和直接粘贴图片。
            </div>

            <div className={`grid ${viewMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              {viewMode !== 'preview' && (
                <div className={`relative ${viewMode === 'split' ? 'border-b lg:border-b-0 lg:border-r' : ''} border-gray-100`}>
                  {draggingFiles && (
                    <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/90 text-sm font-medium text-blue-700">
                      松开鼠标即可上传文件并插入正文
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onSelect={syncSelection}
                    onClick={syncSelection}
                    onKeyUp={syncSelection}
                    onDrop={async (e) => {
                      const files = Array.from(e.dataTransfer.files || []);
                      if (!files.length) return;
                      e.preventDefault();
                      setDraggingFiles(false);
                      await uploadAndInsertFiles(files, 'auto');
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDraggingFiles(true);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                      setDraggingFiles(false);
                    }}
                    onPaste={async (e) => {
                      const files = Array.from(e.clipboardData.files || []).filter((file) => file.type.startsWith('image/'));
                      if (!files.length) return;
                      e.preventDefault();
                      await uploadAndInsertFiles(files, 'image');
                    }}
                    placeholder="请输入文章内容，支持 Markdown 格式。可以直接拖文件进来，也可以粘贴截图。"
                    className="min-h-[680px] w-full resize-none rounded-none border-0 bg-transparent px-6 py-5 font-mono text-sm leading-7 text-gray-900 outline-none"
                    spellCheck={false}
                  />
                </div>
              )}

              {viewMode !== 'write' && (
                <div className="min-h-[680px] bg-gray-50/60 px-6 py-5">
                  {editContent.trim() ? (
                    <MarkdownContent content={editContent} />
                  ) : (
                    <div className="flex h-full min-h-[640px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-sm text-gray-400">
                      <div className="text-center">
                        <EyeIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p>预览区会显示渲染后的 Markdown 内容</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-semibold text-gray-900">编辑辅助</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">字符数</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{charCount}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">行数</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{lineCount}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">最近上传</p>
                  <p className="mt-1 truncate text-sm text-gray-700">{lastUploadedLink || '暂无'}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                上传图片会插入 `![]()`，上传其他附件会插入 `[]()`。如果要改链接文字，直接编辑方括号里的内容即可。
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-base font-semibold text-gray-900">常用模板</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <ToolbarButton
                  title="插入前置条件模板"
                  onClick={() => insertTemplate('\n## 前置条件\n- 条件 1\n- 条件 2\n')}
                >
                  前置条件
                </ToolbarButton>
                <ToolbarButton
                  title="插入步骤模板"
                  onClick={() => insertTemplate('\n## 操作步骤\n1. 第一步\n2. 第二步\n3. 第三步\n')}
                >
                  操作步骤
                </ToolbarButton>
                <ToolbarButton
                  title="插入排错模板"
                  onClick={() => insertTemplate('\n## 常见问题\n> 现象\n\n**原因**\n\n**处理方式**\n')}
                >
                  排错模板
                </ToolbarButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
