export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <div className="text-sm text-muted-foreground">{label ?? 'Loading…'}</div>
      </div>
    </div>
  )
}
