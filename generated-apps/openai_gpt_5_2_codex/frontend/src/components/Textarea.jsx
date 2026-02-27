import clsx from 'clsx'

const Textarea = ({ className, ...props }) => (
  <textarea
    className={clsx(
      'w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      className
    )}
    {...props}
  />
)

export default Textarea
