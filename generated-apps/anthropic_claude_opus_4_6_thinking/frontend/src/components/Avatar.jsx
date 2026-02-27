import { cn, getInitials } from '../lib/utils';

export default function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(
          'rounded-full object-cover ring-2 ring-border',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold ring-2 ring-border',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
