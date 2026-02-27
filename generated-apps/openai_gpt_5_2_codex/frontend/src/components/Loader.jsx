const Loader = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-3 text-sm text-muted-foreground">
    <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
    <span>{label}...</span>
  </div>
)

export default Loader
