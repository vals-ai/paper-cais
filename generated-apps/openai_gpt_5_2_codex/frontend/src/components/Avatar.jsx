import clsx from 'clsx'

const Avatar = ({ src, name = 'Member', size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg'
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center overflow-hidden rounded-full bg-muted text-foreground font-semibold',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{name?.[0]?.toUpperCase() ?? 'Z'}</span>
      )}
    </div>
  )
}

export default Avatar
