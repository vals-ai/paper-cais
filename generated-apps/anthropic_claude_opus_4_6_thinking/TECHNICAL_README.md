# Zeeter Social Network - Technical README

## General Implementation

### App Overview
Zeeter is a short-form social publishing platform where users share 280-character posts, follow others, and engage through likes and comments. Visitors can browse the public feed, while authenticated members get a full-featured social experience.

### Key Features
- **Authentication**: Email/password signup and login (no email verification)
- **Profiles**: Display name, bio, avatar upload via Supabase Storage
- **Posts**: Create, edit, delete posts (280 char limit)
- **Feed**: Personalized feed with newest/trending sort and keyword search
- **Social**: Follow/unfollow users, like posts, comment threads
- **Notifications**: Real-time alerts for likes, comments, and new followers
- **Discovery**: Explore page to search and discover users

### Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS v3, React Router v7
- **Backend**: Supabase (Auth, PostgreSQL, Storage) - no custom backend needed
- **Icons**: Lucide React
- **Deployment**: Docker + Docker Compose

### Architecture
Single-page application using Supabase as a complete backend. All data operations go through the Supabase JS client with Row Level Security enforced at the database level. No custom API server required.

## Code Structure

### Frontend (`frontend/src/`)
```
src/
├── lib/
│   ├── supabase.js       # Supabase client initialization
│   └── utils.js          # Helper functions (cn, formatDate, getInitials)
├── hooks/
│   └── useAuth.jsx       # Auth context provider and hook
├── components/
│   ├── Layout.jsx        # Main layout with nav bar
│   ├── Avatar.jsx        # Reusable avatar with initials fallback
│   ├── PostCard.jsx      # Post display with like/comment/edit/delete
│   ├── ComposeBox.jsx    # New post composer with char counter
│   ├── FollowButton.jsx  # Follow/unfollow toggle
│   ├── UserCard.jsx      # User profile card for explore
│   └── LoadingSpinner.jsx
├── pages/
│   ├── HomePage.jsx      # Feed with search and sort
│   ├── LoginPage.jsx     # Sign in form
│   ├── SignupPage.jsx    # Registration form
│   ├── ProfilePage.jsx   # User profile with stats and posts
│   ├── ExplorePage.jsx   # User discovery/search
│   └── NotificationsPage.jsx
├── App.jsx               # Router configuration
├── main.jsx              # Entry point
└── index.css             # Design system tokens + Tailwind
```

### Database Schema
| Table | Description |
|-------|-------------|
| `profiles` | User profiles (linked to auth.users), username, display_name, bio, avatar_url |
| `posts` | User posts with 280-char constraint, timestamps |
| `follows` | Follower/following relationships (unique constraint, no self-follow) |
| `likes` | Post likes (unique per user/post) |
| `comments` | Post comments (280-char limit) |
| `notifications` | Alerts for likes, comments, follows |

All tables have RLS enabled with appropriate policies for public reads and authenticated writes.
