# Zeeter - Technical Documentation

## Overview

Zeeter is a short-form social publishing platform where users share quick updates and engage with content. It enables basic onboarding, posting, and notifications.

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS v3
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Routing**: React Router v6

## Architecture

### Directory Structure

```
generated-app/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Layout.jsx    # Main layout with navigation
│   │   │   └── PostCard.jsx  # Post display component
│   │   ├── pages/        # Page components
│   │   │   ├── Home.jsx      # Main feed with post creation
│   │   │   ├── Login.jsx     # Login page
│   │   │   ├── Signup.jsx    # Signup page
│   │   │   ├── Profile.jsx   # User profile
│   │   │   ├── ProfileSetup.jsx  # Profile setup flow
│   │   │   ├── Notifications.jsx # Notifications page
│   │   │   └── Search.jsx    # Search and discovery
│   │   ├── hooks/        # Custom React hooks
│   │   │   └── useAuth.jsx  # Authentication context
│   │   ├── lib/          # Helper functions
│   │   │   └── supabase.js  # Supabase client
│   │   ├── App.jsx       # Main app with routing
│   │   ├── main.jsx      # Entry point
│   │   └── index.css    # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## Database Schema

### Tables

1. **profiles** - User profiles with display name, bio, avatar
   - `id` (UUID, FK to auth.users)
   - `email` (TEXT)
   - `display_name` (TEXT)
   - `bio` (TEXT)
   - `avatar_url` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **posts** - User posts (max 280 characters)
   - `id` (UUID, PK)
   - `content` (TEXT, max 280 chars)
   - `author_id` (UUID, FK to profiles)
   - `is_public` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

3. **likes** - Post likes
   - `id` (UUID, PK)
   - `user_id` (UUID, FK to profiles)
   - `post_id` (UUID, FK to posts)
   - Unique constraint on (user_id, post_id)

4. **comments** - Post comments
   - `id` (UUID, PK)
   - `content` (TEXT, max 280 chars)
   - `author_id` (UUID, FK to profiles)
   - `post_id` (UUID, FK to posts)

5. **follows** - User follow relationships
   - `id` (UUID, PK)
   - `follower_id` (UUID, FK to profiles)
   - `following_id` (UUID, FK to profiles)
   - Unique constraint on (follower_id, following_id)

6. **notifications** - User notifications
   - `id` (UUID, PK)
   - `user_id` (UUID, FK to profiles)
   - `type` (TEXT: 'like', 'comment', 'follow')
   - `from_user_id` (UUID, FK to profiles)
   - `post_id` (UUID, FK to posts)
   - `read` (BOOLEAN)

## RLS Policies

All tables have Row Level Security enabled with appropriate policies:
- Profiles: Public read, user-specific insert/update
- Posts: Public read, user-specific CRUD
- Likes/Comments: Public read, user-specific insert/delete
- Follows: Public read, user-specific insert/delete
- Notifications: User-specific read/insert/update

## Running the Application

```bash
cd generated-app
docker compose -p zeeter up -d --build
```

The application will be available at `http://localhost:23929` (or the port specified in .env).

## Environment Variables

- `VITE_SUPABASE_PROJECT_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
