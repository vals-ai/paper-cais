export function computeTrendScore(args: {
  likesCount: number
  commentsCount: number
  createdAtIso: string
}): number {
  const base = args.likesCount * 2 + args.commentsCount * 3
  if (base <= 0) return 0

  const createdMs = new Date(args.createdAtIso).getTime()
  const ageHours = Math.max(0, (Date.now() - createdMs) / (1000 * 60 * 60))

  // Give new posts a fair chance while still rewarding real engagement.
  const recency = 1 / (Math.pow(ageHours + 2, 1.15))
  return base * 1000 * recency
}

export function normalizeSearchQuery(q: string): string {
  return q.trim().replace(/\s+/g, ' ')
}

export function includesQuery(text: string, q: string): boolean {
  const query = normalizeSearchQuery(q).toLowerCase()
  if (!query) return true
  return text.toLowerCase().includes(query)
}
