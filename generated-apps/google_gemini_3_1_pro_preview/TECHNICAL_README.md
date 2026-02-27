# Zeeter Social Network - Technical Documentation

## General Implementation

Zeeter is a simple short-form publishing platform allowing users to share updates, engage with content, follow other members, and receive notifications. 

**Key Features:**
- Authentication (Login/Signup without email verification) and Profile creation.
- A home feed with "Following" and "Global" tabs.
- Publishing posts (up to 280 characters).
- Engaging with posts via likes and comments.
- Following other users.
- Notifications for likes, comments, and follows.

**Tech Stack:**
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (PostgreSQL Database, Authentication, Row Level Security (RLS)).
- **Deployment:** Docker, Docker Compose for the frontend.

**Architecture Approach:**
The application is a purely client-side React app interacting directly with Supabase via the official `@supabase/supabase-js` SDK. All business logic, constraints, and data protection are handled by the database schema and Row Level Security (RLS) policies implemented in PostgreSQL. There is no separate Node.js backend to maintain.

## Code Structure

```
generated-app/
├── docker-compose.yml       # Docker Compose setup exposing the app
├── TECHNICAL_README.md      # This file
├── USER_README.md           # User manual
└── frontend/
    ├── Dockerfile.frontend  # Docker configuration for Vite app
    ├── seed.cjs             # Node script to seed initial database data
    └── src/
        ├── App.tsx          # Main routing table and layout wrapper
        ├── main.tsx         # React root initialization
        ├── components/      # Reusable UI components
        │   ├── Navbar.tsx   # Top/Bottom navigation bar
        │   ├── PostItem.tsx # Reusable post card with like/comment logic
        │   └── ui/          # shadcn primitive components
        ├── hooks/
        │   └── useAuth.tsx  # React Context for global auth state & profile
        ├── lib/
        │   └── supabase.ts  # Singleton Supabase client instance
        └── pages/
            ├── AuthPage.tsx       # Login & Signup flows
            ├── HomeFeed.tsx       # Main feed (Following & Global) and composer
            ├── LandingPage.tsx    # Unauthenticated visitor landing
            ├── NotificationsPage.tsx # Notification feed
            ├── ProfilePage.tsx    # User profile and their posts
            └── SetupProfile.tsx   # Initial profile creation after signup
```

## Database Schema

The database consists of the following Custom Types securely managed with RLS:
- **profiles:** Extends `auth.users` with `username`, `display_name`, `bio`, and `avatar_url`.
- **posts:** Contains `content` (max 280 chars) and a foreign key to `profiles`.
- **likes:** Maps users to posts they liked (composite unique constraint).
- **comments:** Contains `content` and relationships to `profiles` and `posts`.
- **follows:** Associates a `follower_id` with a `following_id`.
- **notifications:** Uses an ENUM for `type` ('like', 'comment', 'follow') to notify users.

RLS guarantees that users can view public data but only modify (insert/delete) their own rows.
