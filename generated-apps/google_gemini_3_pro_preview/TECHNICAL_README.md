# Zeeter - Technical README

## General Implementation

### App Overview
Zeeter is a short-form social network platform inspired by Twitter/X. It allows users to sign up, create profiles, post short updates (up to 280 characters), follow other users, like and comment on posts, and search for content/users. It features a responsive layout with a personalized feed and notifications system.

### Tech Stack
- **Frontend Framework**: React v18+ (Vite)
- **UI Library**: Tailwind CSS v3, Shadcn UI (Radix Primitives + Tailwind)
- **Language**: JavaScript (ES Modules)
- **Routing**: React Router v6
- **State Management**: React Context (Auth) + Local State
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage) via `@supabase/supabase-js` SDK
- **Containerization**: Docker & Docker Compose

### Architecture Approach
The application is built as a Single Page Application (SPA).
- **Client-heavy**: Most logic resides in the React frontend.
- **Supabase-centric**: Supabase is used directly from the client for Authentication, Database (via PostgREST), and Storage. No intermediate backend server was strictly necessary for the MVP scope, keeping the architecture simple and scalable.
- **Row Level Security (RLS)**: Security is handled at the database layer using Postgres RLS policies, ensuring users can only modify their own data while allowing public read access where appropriate.
- **Component-based**: UI is broken down into reusable components (`Post`, `Layout`, UI primitives) to ensure consistency and maintainability.

## Code Structure

### Directory Layout
```
/generated-app/
├── docker-compose.yml      # Orchestration
├── frontend/
│   ├── Dockerfile.frontend # Build instructions
│   ├── src/
│   │   ├── components/     # Reusable UI components (Layout, Post, ui/*)
│   │   ├── context/        # React Contexts (AuthContext)
│   │   ├── pages/          # Route components (Home, Login, Profile, etc.)
│   │   ├── lib/            # Utilities (supabase client, utils)
│   │   ├── hooks/          # Custom hooks
│   │   ├── App.jsx         # Router setup
│   │   └── main.jsx        # Entry point
│   └── scripts/            # Database seeding scripts
└── supabase/
    └── migrations/         # SQL migrations
```

### Database Schema
- **profiles**: Public user profiles (linked to `auth.users`).
- **posts**: User content/updates.
- **likes**: Many-to-Many relation between users and posts.
- **comments**: Threaded replies to posts.
- **follows**: Follower/Following graph.
- **notifications**: Activity feed for interactions.
- **storage.buckets**: 'avatars' for profile images.

All tables are protected by RLS protocols.
