# Zeeter Social Network – Technical Overview

## 1. General Implementation
**App overview & key features**
- Short-form social feed with 280-character posts, edits, deletes, likes, and comments.
- Personalized feed blending followed-member posts with trending content.
- Public profiles and visitor access to explore posts without signing in.
- Notifications for likes, comments, and new followers.
- Profile onboarding with display name, bio, and avatar upload via Supabase Storage.

**Tech stack summary**
- **Frontend:** React + Vite, React Router
- **Styling:** Tailwind CSS v3 with a token-based design system
- **Backend:** Supabase (Auth, Postgres, Storage)

**Architecture approach**
- Client-only React app communicates directly with Supabase via `@supabase/supabase-js`.
- Row Level Security (RLS) policies enforce ownership rules for posts, follows, likes, comments, and notifications.
- Database triggers generate notifications automatically on likes, comments, and follows.

## 2. Code Structure
**Frontend layout**
```
frontend/
  src/
    components/   # Reusable UI components (PostCard, ProfileForm, etc.)
    hooks/        # Auth context and state
    lib/          # Supabase client
    pages/        # Route-level pages
```

**Key files**
- `src/App.jsx`: Routing, guards, layout, and lazy loading.
- `src/hooks/useAuth.js`: Auth context, profile state, and Supabase session management.
- `src/lib/supabaseClient.js`: Supabase client initialization.
- `frontend/scripts/seed.mjs`: Idempotent seed script for users/posts/interactions.

**Database schema**
- `profiles`: `id`, `display_name`, `bio`, `avatar_url`, timestamps
- `posts`: `id`, `author_id`, `content`, timestamps
- `follows`: `follower_id`, `following_id`
- `likes`: `user_id`, `post_id`
- `comments`: `id`, `post_id`, `author_id`, `content`
- `notifications`: `id`, `user_id`, `actor_id`, `type`, `post_id`, `comment_id`, `read_at`
