import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <article className={`max-w-none break-words text-gray-700 ${className}`.trim()}>
      <ReactMarkdown
        /** remark-breaks：单次换行即硬换行，避免「按一次回车预览仍同一行」的纯 CommonMark 体验 */
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-8 text-3xl font-bold tracking-tight text-gray-900 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 border-b border-gray-200 pb-2 text-2xl font-semibold text-gray-900 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-xl font-semibold text-gray-900 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-5 text-lg font-semibold text-gray-900 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="mt-4 leading-7 text-gray-700 first:mt-0">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="break-all font-medium text-blue-600 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-5 rounded-r-xl border-l-4 border-blue-200 bg-blue-50/70 px-4 py-3 italic text-gray-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-gray-200" />,
          br: () => <br />,
          table: ({ children }) => (
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full border-collapse bg-white text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-gray-100 px-4 py-3 align-top">{children}</td>,
          pre: ({ children }) => (
            <pre className="mt-5 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm leading-6 text-gray-100">
              {children}
            </pre>
          ),
          code: ({
            inline,
            className: codeClassName,
            children,
            ...props
          }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) =>
            inline ? (
              <code
                {...props}
                className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-pink-600"
              >
                {children}
              </code>
            ) : (
              <code {...props} className={codeClassName}>
                {children}
              </code>
            ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src || ''}
              alt={alt || ''}
              className="mt-5 max-h-[460px] rounded-xl border border-gray-200 bg-white object-contain shadow-sm"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
