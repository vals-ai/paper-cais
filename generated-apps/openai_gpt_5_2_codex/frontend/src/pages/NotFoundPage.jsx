import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="app-container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12 text-center">
    <h1 className="text-3xl font-semibold text-foreground">Page not found</h1>
    <p className="text-sm text-muted-foreground">The page you’re looking for doesn’t exist.</p>
    <Link
      to="/"
      className="rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/70"
    >
      Go back home
    </Link>
  </div>
)

export default NotFoundPage
