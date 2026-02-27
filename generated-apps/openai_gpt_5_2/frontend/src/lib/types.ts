export type Profile = {
  user_id: string
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

// Supabase embedded relationships sometimes come back as an object (to-one) or an array.
export type EmbeddedToOne<T> = T | T[] | null | undefined

export type PostRecord = {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: EmbeddedToOne<Profile>
  likes?: { count: number }[]
  comments?: { count: number }[]
}

export type FeedPost = {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  author: Profile | null
  likesCount: number
  commentsCount: number
  likedByMe: boolean
  trendScore: number
}

export type CommentRecord = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: EmbeddedToOne<Profile>
}

export type NotificationType = 'like' | 'comment' | 'follow'

export type NotificationRecord = {
  id: string
  recipient_id: string
  actor_id: string | null
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  created_at: string
  read_at: string | null
  actor?: EmbeddedToOne<Profile>
  post?: { id: string; content: string } | null
  comment?: { id: string; content: string } | null
}
