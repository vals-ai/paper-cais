export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour

  if (diffMs < 30 * 1000) return 'just now'
  if (diffMs < hour) return `${Math.floor(diffMs / min)}m`
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h`
  if (diffMs < 14 * day) return `${Math.floor(diffMs / day)}d`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() === date.getFullYear() ? undefined : 'numeric',
  })
}

export function isEdited(createdIso: string, updatedIso: string): boolean {
  const created = new Date(createdIso).getTime()
  const updated = new Date(updatedIso).getTime()
  return updated - created > 60 * 1000
}
