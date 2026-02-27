Zeeter Social Network — Technical Overview

1. General Implementation
- App: Zeeter is a short-form publishing platform (280 chars) built with React + Vite. It supports sign up/login (email+password), profiles, posting, following, likes, comments, and basic notifications.
- Tech stack: Frontend: React (Vite), Tailwind CSS. Backend: Supabase (Auth, Postgres DB, Storage). The app uses @supabase/supabase-js for client and server-side seeding.
- Architecture: Single-page React app with client-side routing (React Router). Supabase handles auth and data storage. A small seed script uses the Supabase service role key to create demo users and content.

2. Code Structure
- frontend/: Vite React app
  - src/components/: Navbar, PostComposer, PostCard
  - src/pages/: Home, Login, Signup, Profile, Notifications, Explore
  - src/hooks/: useAuth (auth state hook)
  - src/lib/: supabaseClient.js (Supabase client wrapper)
  - scripts/seed.js: Server-side seed script executed at container start (uses SUPABASE_SERVICE_ROLE_KEY)
  - Dockerfile.frontend, .dockerignore
- supabase/migrations/: SQL migration (001_init.sql) that creates tables, indexes, and RLS policies
- docker-compose.yml: Defines the zeeter frontend service; builds the frontend image and exposes the app on APP_PUBLIC_PORT

Database schema (key tables)
- profiles(id uuid PK -> auth.users.id, username, display_name, bio, avatar_url, created_at)
- posts(id uuid PK, author uuid -> profiles.id, content text (<=280), created_at)
- follows(follower uuid, following uuid, PK(follower,following))
- likes(id uuid PK, post_id -> posts.id, user_id -> profiles.id)
- comments(id uuid PK, post_id, user_id, content, created_at)
- notifications(id uuid PK, recipient -> profiles.id, type text, payload jsonb, read boolean)

Notes:
- Migrations were applied via the MCP SQL tools and are stored in supabase/migrations/001_init.sql
- The seed script uses the Supabase service role key for admin actions; see USER_README for test credentials.
