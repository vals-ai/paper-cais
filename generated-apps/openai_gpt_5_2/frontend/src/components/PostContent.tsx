import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

export function PostContent({ content, className }: { content: string; className?: string }) {
  const parts = content.split(/(#\w+)/g)

  return (
    <div className={cn('whitespace-pre-wrap text-sm leading-relaxed', className)}>
      {parts.map((part, idx) => {
        const isTag = /^#\w+$/.test(part)
        if (!isTag) return <span key={idx}>{part}</span>
        return (
          <Link
            key={idx}
            to={`/?q=${encodeURIComponent(part)}`}
            className="font-medium text-primary hover:underline"
          >
            {part}
          </Link>
        )
      })}
    </div>
  )
}
