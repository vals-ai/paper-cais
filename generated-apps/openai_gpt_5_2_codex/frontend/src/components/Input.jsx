import clsx from 'clsx'

const Input = ({ className, ...props }) => (
  <input
    className={clsx(
      'w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      className
    )}
    {...props}
  />
)

export default Input
