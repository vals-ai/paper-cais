import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      expand
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'border border-border/60 bg-card text-card-foreground shadow-soft',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-foreground',
        },
      }}
    />
  )
}
