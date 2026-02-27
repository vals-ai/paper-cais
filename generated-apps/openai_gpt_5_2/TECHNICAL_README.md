# Zeeter Social Network — Technical README

## 1) General Implementation
**Overview**: Zeeter is a short-form social network where users post updates (≤ 280 chars), follow other members, like and comment on posts, and receive notifications.

**Key features**
- Email/password auth (Supabase Auth)
- Profiles (display name, bio, avatar stored in Supabase Storage)
- Feed (newest/trending, keyword/hashtag search)
- Post CRUD (create, edit, delete by owner)
- Likes + comment threads
- Notifications for likes, comments, and follows

**Tech stack**
- Frontend: React (Vite) + TypeScript + React Router
- UI: Tailwind CSS v3 + Radix UI primitives + small shadcn-style components
- Backend: Supabase (Postgres, Auth, Storage) via `@supabase/supabase-js`

**Architecture approach**
- Browser talks directly to Supabase using the anon key.
- Row Level Security (RLS) enforces permissions.
- Database triggers create notifications when likes/comments/follows happen.
- Docker build runs `vite build`, container starts `vite preview`.
- Runtime config is written into `dist/config.js` at container start so the browser can read Supabase URL/key.

## 2) Code Structure
```
generated-app/
  docker-compose.yml
  supabase/migrations/
  frontend/
    Dockerfile.frontend
    scripts/
      seed.mjs
      write-runtime-config.mjs
    src/
      components/
      components/ui/
      hooks/
      lib/
      pages/
```

**Key files**
- `frontend/src/lib/supabaseClient.ts`: lazy Supabase client
- `frontend/src/hooks/useAuth.tsx`: session/profile state + onboarding check
- `frontend/src/pages/HomePage.tsx`: feed (newest/trending) + search
- `frontend/src/pages/DiscoverPage.tsx`: member search + follow
- `frontend/src/pages/NotificationsPage.tsx`: notifications list + mark read
- `frontend/scripts/seed.mjs`: idempotent seed (creates demo users + sample content)
- `frontend/scripts/write-runtime-config.mjs`: writes `dist/config.js` from env vars

## 3) Database schema
Tables (all in `public`):
- `profiles(user_id PK -> auth.users)`
- `posts(id PK, user_id FK -> profiles, content <= 280)`
- `comments(id PK, post_id FK -> posts, user_id FK -> profiles)`
- `likes(post_id, user_id PK)`
- `follows(follower_id, followee_id PK)`
- `notifications(id PK, recipient_id, actor_id, type, post_id?, comment_id?, read_at?)`

RLS policies:
- Visitors can `select` public content (profiles/posts/comments/likes/follows).
- Only authenticated users can insert/update/delete their own content.
- Notifications are only selectable/updatable by the recipient.

Storage:
- Bucket `avatars` (public read). Users may write only to `avatars/{auth.uid()}/...`.
