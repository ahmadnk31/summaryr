"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn(
      "prose prose-slate max-w-none dark:prose-invert",
      "prose-headings:font-semibold prose-headings:text-foreground",
      "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:pb-2",
      "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5",
      "prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4",
      "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3",
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-em:text-muted-foreground prose-em:italic",
      "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-foreground",
      "prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto",
      "prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:py-2",
      "prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-1",
      "prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-1",
      "prose-li:text-muted-foreground prose-li:leading-relaxed",
      "prose-table:border-collapse prose-table:border prose-table:border-border",
      "prose-thead:bg-muted prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground",
      "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-muted-foreground",
      "prose-hr:border-border prose-hr:my-6",
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
      "prose-img:rounded-lg prose-img:border prose-img:shadow-sm",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom heading components with better styling
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 pb-2 border-b border-border">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
              {children}
            </h3>
          ),
          // Enhanced code blocks
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const inline = !match
            return !inline ? (
              <pre className="bg-muted border rounded-lg p-4 overflow-x-auto my-4">
                <code
                  className={`${className} text-sm font-mono`}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            )
          },
          // Enhanced blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/30 italic text-muted-foreground rounded-r">
              {children}
            </blockquote>
          ),
          // Enhanced table
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2 text-muted-foreground">
              {children}
            </td>
          ),
          // Enhanced links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary no-underline hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Enhanced lists
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-1 my-3">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1 my-3">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-muted-foreground leading-relaxed">
              {children}
            </li>
          ),
          // Enhanced paragraphs
          p: ({ children }) => (
            <p className="text-muted-foreground leading-relaxed mb-3">
              {children}
            </p>
          ),
          // Enhanced horizontal rules
          hr: () => (
            <hr className="border-border my-6" />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
