# Zeeter - Technical README

## General Implementation

### Overview
Zeeter is a simple short-form publishing platform where users can share quick updates (up to 280 characters) and engage with content through likes, comments, and follows. The platform supports both visitors (who can browse public content) and members (who can post, follow, and interact).

### Key Features
- User authentication (sign up/sign in with email/password)
- Personalized home feed with posts from followed users and community content
- Post creation, editing, and deletion (280 character limit)
- Like and comment functionality on posts
- Follow/unfollow other users
- Notifications for likes, comments, and new followers
- User profiles with customizable display name, bio, and avatar

### Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS v3 with custom design system
- **UI Components**: Custom shadcn/ui-inspired components (Button, Card, Input, Avatar, Textarea)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time features)
- **Containerization**: Docker + Docker Compose

### Architecture
The application follows a modern JAMstack architecture:
- React frontend served via Vite's preview server
- Supabase handles all backend concerns (auth, database, RLS policies)
- Database triggers automatically create notifications for user interactions
- Row Level Security (RLS) ensures data access control

## Code Structure

### Frontend Directory Layout
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Avatar.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Textarea.jsx
│   │   ├── PostComposer.jsx
│   │   └── PostCard.jsx
│   ├── hooks/            # Custom React hooks
│   │   └── useAuth.js
│   ├── lib/              # Helper functions
│   │   ├── supabase.js   # Supabase client configuration
│   │   └── utils.js      # Utility functions (cn for class merging)
│   ├── pages/            # Page components
│   │   ├── Feed.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Profile.jsx
│   │   └── Notifications.jsx
│   ├── App.jsx           # Main app with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind directives + design tokens
├── .env                  # Environment variables
├── Dockerfile.frontend
└── vite.config.js
```

### Database Schema
```sql
profiles (id, display_name, bio, avatar_url, created_at, updated_at)
  └── References auth.users(id)

posts (id, user_id, content, created_at, updated_at)
  └── References profiles(id)

likes (id, user_id, post_id, created_at)
  └── References profiles(id), posts(id)

comments (id, user_id, post_id, content, created_at, updated_at)
  └── References profiles(id), posts(id)

follows (id, follower_id, following_id, created_at)
  └── References profiles(id)

notifications (id, user_id, type, actor_id, post_id, read, created_at)
  └── References profiles(id), posts(id)
  └── type: 'like' | 'comment' | 'follow'
```

### Key Implementation Details
- **Authentication**: Supabase Auth with email/password (no email verification required)
- **Profile Creation**: Automatic via database trigger on user signup
- **Notifications**: Automatically created via database triggers on likes, comments, and follows
- **RLS Policies**: All tables have Row Level Security enabled with appropriate policies for public read access and user-specific write access
