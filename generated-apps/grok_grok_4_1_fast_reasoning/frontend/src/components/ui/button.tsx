import * as React from &quot;react&quot;
import { Slot } from &quot;@radix-ui/react-slot&quot;
import { cva, type VariantProps } from &quot;class-variance-authority&quot;
import { cn } from &quot;../../lib/utils&quot;

const buttonVariants = cva(
  &quot;inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50&quot;,
  {
    variants: {
      variant: {
        default: &quot;bg-primary text-primary-foreground hover:bg-primary/90&quot;,
        destructive:
          &quot;bg-destructive text-destructive-foreground hover:bg-destructive/90&quot;,
        outline:
          &quot;border border-input bg-background hover:bg-accent hover:text-accent-foreground&quot;,
        secondary:
          &quot;bg-secondary text-secondary-foreground hover:bg-secondary/80&quot;,
        ghost: &quot;hover:bg-accent hover:text-accent-foreground&quot;,
        link: &quot;text-primary underline-offset-4 hover:underline&quot;,
      },
      size: {
        default: &quot;h-10 px-4 py-2&quot;,
        sm: &quot;h-9 rounded-md px-3&quot;,
        lg: &quot;h-11 rounded-md px-8&quot;,
        icon: &quot;h-10 w-10&quot;,
      },
    },
    defaultVariants: {
      variant: &quot;default&quot;,
      size: &quot;default&quot;,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : &quot;button&quot;
    return (
      &lt;Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      /&gt;
    )
  }
)
Button.displayName = &quot;Button&quot;

export { Button, buttonVariants }