const EmptyState = ({ title, description, action }) => (
  <div className="surface-muted flex flex-col items-center gap-3 px-6 py-8 text-center">
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
    {action}
  </div>
)

export default EmptyState
