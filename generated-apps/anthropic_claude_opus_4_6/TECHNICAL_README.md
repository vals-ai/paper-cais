# Zeeter Social Network — Technical README

## General Implementation

### App Overview
Zeeter is a short-form social publishing platform where users share 280-character posts, follow other members, interact through likes and comments, and receive notifications.

### Key Features
- User authentication (email/password sign up, sign in, sign out)
- Profile management (display name, bio, avatar upload)
- Post creation, editing, deletion (280 char limit)
- Feed with newest/trending sorting and search
- Follow/unfollow system
- Like and comment interactions
- Real-time notification badges
- Hashtag highlighting

### Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS v3, React Router v7, Lucide Icons
- **Backend**: Supabase (Auth, PostgreSQL DB, Storage)
- **Deployment**: Docker Compose

### Architecture
Single-page application with Supabase as the backend. All data access uses the Supabase JS client with Row-Level Security (RLS) policies for authorization. Profile creation is automated via a database trigger on `auth.users`.

## Code Structure

### Frontend Directory Layout
```
frontend/src/
├── lib/          # Supabase client, helper utilities
├── hooks/        # Auth context provider (useAuth)
├── components/   # Reusable UI: Layout, Avatar, PostCard, CommentSection, CreatePost, UserCard, LoadingSpinner
├── pages/        # Page components: Home, Login, SignUp, Explore, Profile, Notifications
├── index.css     # Design system (CSS variables, Tailwind @layer components)
├── App.jsx       # Router and auth provider setup
└── main.jsx      # Entry point
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/supabase.js` | Supabase client initialization |
| `src/hooks/useAuth.jsx` | Auth context: session, profile, CRUD |
| `src/components/Layout.jsx` | App shell: navbar, notification badge |
| `src/components/PostCard.jsx` | Post display, edit, delete, like, comments |
| `src/pages/HomePage.jsx` | Main feed with create post, search, sorting |
| `src/pages/ProfilePage.jsx` | User profile, follow, avatar upload |

### Database Schema
| Table | Description |
|-------|-------------|
| `profiles` | User profiles (FK to auth.users), display_name, username, bio, avatar_url |
| `posts` | User posts (280 char limit), user_id FK |
| `likes` | Post likes, unique per user+post |
| `comments` | Post comments (500 char limit) |
| `follows` | Follow relationships, unique per follower+following |
| `notifications` | Alerts for likes, comments, follows with read status |

Storage bucket `avatars` is used for profile images with public read access.
