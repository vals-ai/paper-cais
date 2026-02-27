import { User } from 'lucide-react'

export default function Avatar({ src, alt, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 22,
    xl: 32,
  }

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-secondary border-2 border-border flex items-center justify-center flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={alt || 'avatar'} className="w-full h-full object-cover" />
      ) : (
        <User size={iconSizes[size]} className="text-muted-foreground" />
      )}
    </div>
  )
}
