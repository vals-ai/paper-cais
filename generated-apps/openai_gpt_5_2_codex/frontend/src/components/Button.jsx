import clsx from 'clsx'

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  muted: 'bg-muted text-foreground hover:bg-muted/70',
  danger: 'bg-warning text-warning-foreground hover:bg-warning/90'
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-sm'
}

const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={clsx(
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60',
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  />
)

export default Button
