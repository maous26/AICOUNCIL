'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings
          h1: ({ node, ...props }) => <h1 className={styles.h1} {...props} />,
          h2: ({ node, ...props }) => <h2 className={styles.h2} {...props} />,
          h3: ({ node, ...props }) => <h3 className={styles.h3} {...props} />,
          h4: ({ node, ...props }) => <h4 className={styles.h4} {...props} />,

          // Paragraphs
          p: ({ node, ...props }) => <p className={styles.paragraph} {...props} />,

          // Lists
          ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
          ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
          li: ({ node, ...props }) => <li className={styles.li} {...props} />,

          // Code
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return <code className={styles.inlineCode} {...props}>{children}</code>;
            }
            return (
              <div className={styles.codeBlock}>
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          pre: ({ node, ...props }) => <pre className={styles.pre} {...props} />,

          // Links
          a: ({ node, ...props }) => (
            <a className={styles.link} target="_blank" rel="noopener noreferrer" {...props} />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className={styles.blockquote} {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table} {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className={styles.thead} {...props} />,
          tbody: ({ node, ...props }) => <tbody className={styles.tbody} {...props} />,
          tr: ({ node, ...props }) => <tr className={styles.tr} {...props} />,
          th: ({ node, ...props }) => <th className={styles.th} {...props} />,
          td: ({ node, ...props }) => <td className={styles.td} {...props} />,

          // Horizontal rule
          hr: ({ node, ...props }) => <hr className={styles.hr} {...props} />,

          // Strong/Bold
          strong: ({ node, ...props }) => <strong className={styles.strong} {...props} />,

          // Emphasis/Italic
          em: ({ node, ...props }) => <em className={styles.em} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
