import type { EmbeddedToOne } from './types'

export function toOne<T>(value: EmbeddedToOne<T>): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}
