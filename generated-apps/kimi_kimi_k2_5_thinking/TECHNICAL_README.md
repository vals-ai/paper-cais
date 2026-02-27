# Zeeter - Technical README

## Overview

Zeeter is a short-form social publishing platform built with React, Vite, TypeScript, and Supabase. It enables users to share posts up to 280 characters, follow other users, like and comment on posts, and receive notifications.

## Tech Stack

- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS 3
- **UI Components**: shadcn/ui, Radix UI primitives, Lucide icons
- **Backend**: Supabase (PostgreSQL, Auth, Realtime subscriptions)
- **State Management**: React Context (AuthContext)
- **Routing**: React Router v7

## Architecture

### Database Schema

**profiles**: User profiles extending auth.users
- id (uuid, FK to auth.users)
- username (unique)
- display_name
- bio
- avatar_url
- timestamps

**posts**: User posts
- id (uuid)
- user_id (FK to profiles)
- content (max 280 chars)
- timestamps

**follows**: User follow relationships
- id (uuid)
- follower_id, following_id (FK to profiles)

**likes**: Post likes
- id (uuid)
- user_id (FK to profiles), post_id (FK to posts)

**comments**: Post comments
- id (uuid)
- user_id (FK to profiles), post_id (FK to posts)
- content (max 280 chars)

**notifications**: User notifications
- id (uuid)
- user_id (FK to profiles), actor_id (FK to profiles)
- type (like, comment, follow)
- post_id, comment_id (nullable FKs)
- is_read (boolean)

### Key Features

1. **Authentication**: Email/password signup/login via Supabase Auth
2. **Feed**: Personalized feed with newest/trending sort options
3. **Posts**: Create, edit, delete posts (280 char limit)
4. **Interactions**: Like, comment, follow/unfollow
5. **Notifications**: Real-time notifications for likes, comments, follows
6. **Search**: Search posts and users by keyword/hashtag
7. **Profiles**: View and edit profile (display name, bio)

### Security

- Row Level Security (RLS) policies on all tables
- Users can only modify their own data
- Public read access to posts and profiles

## Project Structure

```
generated-app/
├── docker-compose.yml          # Docker Compose configuration
├── .env                        # Environment variables
├── supabase/migrations/        # Database migrations
└── frontend/
    ├── Dockerfile.frontend     # Frontend Docker image
    ├── src/
    │   ├── components/         # Reusable UI components
    │   │   ├── ui/            # shadcn/ui components
    │   │   └── Layout.tsx     # Main layout with navigation
    │   ├── contexts/
    │   │   └── AuthContext.tsx # Authentication state
    │   ├── lib/
    │   │   ├── supabase.ts    # Supabase client & types
    │   │   └── utils.ts       # Utility functions
    │   ├── pages/
    │   │   ├── AuthPage.tsx   # Login/Signup
    │   │   ├── HomePage.tsx   # Feed
    │   │   ├── ProfilePage.tsx # User profile
    │   │   ├── PostDetailPage.tsx # Single post view
    │   │   ├── NotificationsPage.tsx
    │   │   └── SearchPage.tsx
    │   ├── App.tsx            # Router configuration
    │   └── index.css          # Tailwind CSS imports
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## Running the Application

```bash
cd generated-app
docker compose -p zeeter up -d --build
```

The application will be available at the URL specified in APP_PUBLIC_URL.

## Environment Variables

- `APP_PUBLIC_PORT`: Port for the frontend service
- `APP_PUBLIC_URL`: Public URL for the application
- `SUPABASE_PROJECT_URL`: Supabase instance URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key