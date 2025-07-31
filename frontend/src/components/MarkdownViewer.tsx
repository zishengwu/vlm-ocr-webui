import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from 'next/image';

const MarkdownViewer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props: React.ComponentProps<'code'> & { inline?: boolean }) {
          const { inline, className, children, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={vscDarkPlus as any}
              language={match[1]}
              PreTag="div"
              customStyle={{ fontSize: '14px', borderRadius: '8px' }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...rest}>
              {children}
            </code>
          );
        },
        img(props: React.ComponentProps<'img'>) {
          const src = typeof props.src === 'string' ? props.src : '';
          return (
            <Image
              src={src}
              alt={props.alt || 'markdown image'}
              width={800}
              height={600}
              className="max-w-full h-auto my-4 rounded-lg shadow-lg"
              style={{ width: 'auto', height: 'auto' }}
              unoptimized
            />
          );
        },
        // 添加表格样式
        table(props: React.ComponentProps<'table'>) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-300 dark:border-gray-700" {...props} />
            </div>
          );
        },
        thead(props: React.ComponentProps<'thead'>) {
          return <thead className="bg-gray-100 dark:bg-gray-800" {...props} />;
        },
        th(props: React.ComponentProps<'th'>) {
          return <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left" {...props} />;
        },
        td(props: React.ComponentProps<'td'>) {
          return <td className="px-4 py-2 border border-gray-300 dark:border-gray-700" {...props} />;
        },
        // 添加数学公式支持
        p(props: React.ComponentProps<'p'>) {
          const { children, ...rest } = props;
          // 检测是否包含数学公式 ($$...$$)
          const childrenString = String(children);
          if (childrenString.startsWith('$$') && childrenString.endsWith('$$')) {
            return (
              <div className="my-4 py-2 overflow-x-auto">
                <pre className="text-center">{childrenString}</pre>
              </div>
            );
          }
          return <p className="my-2" {...rest}>{children}</p>;
        },
      }}
    >
      {content}
    </Markdown>
  );
};

export default MarkdownViewer;