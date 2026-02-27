import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export function NotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Page not found</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist.
        </div>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
