import clsx from 'clsx'

const Badge = ({ children, className }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground',
      className
    )}
  >
    {children}
  </span>
)

export default Badge
