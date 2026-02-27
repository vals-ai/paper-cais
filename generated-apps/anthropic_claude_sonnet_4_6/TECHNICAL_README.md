# Zeeter Social Network — Technical README

## App Overview & Key Features
Zeeter is a short-form publishing platform (Twitter/X-style) where users share quick updates and engage with content.

- **Publishing**: Posts up to 280 characters with hashtag detection and clickable links
- **Personalized Feed**: Newest/Trending sorting, keyword and hashtag search
- **Social Graph**: Follow/unfollow other members; feed shows followed users' content
- **Engagement**: Like reactions and threaded comments on posts
- **Notifications**: Real-time alerts for likes, comments, and new followers
- **Profiles**: Avatar upload (Supabase Storage), bio, stats (following/followers/posts)
- **Visitor Mode**: Public posts and profiles browsable without login; interaction requires auth

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7, React Router v7 |
| Styling | Tailwind CSS v3 (semantic design tokens) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Icons | Lucide React |
| Date formatting | date-fns |
| Container | Docker + Docker Compose |

## Architecture
- **Frontend-only SPA** (no custom backend server)
- Supabase handles all auth (JWT), database queries (RLS enforced), and file storage
- Database triggers auto-create notifications on like/comment/follow events
- Lazy-loaded page components for fast initial load

## Code Structure
```
frontend/src/
  lib/
    supabase.js          # Supabase client initialization
  hooks/
    useAuth.jsx          # Auth context (user, profile, signIn/signUp/signOut)
    usePosts.js          # Feed fetching, post CRUD
    useNotifications.js  # Notification fetch, unread count, mark-read
  components/
    Navbar.jsx           # Sticky top nav with unread badge
    PostCard.jsx         # Post display with inline edit, like, comment thread
    PostComposer.jsx     # 280-char post form with circular progress
    FollowButton.jsx     # Toggle follow/unfollow with optimistic state
    Avatar.jsx           # Sized avatar with fallback icon
    PostSkeleton.jsx     # Animated loading placeholder
  pages/
    HomePage.jsx         # Feed + search + sort + composer + sidebar
    ProfilePage.jsx      # Profile header, banner, edit form, avatar upload
    SearchPage.jsx       # Posts + People tabs with search results
    NotificationsPage.jsx# Grouped notification list with mark-all-read
    LoginPage.jsx        # Sign-in form
    SignupPage.jsx        # Registration form with validation
```

## Database Schema
| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`; username, display_name, bio, avatar_url |
| `posts` | Content ≤280 chars; FK → profiles |
| `follows` | follower_id + following_id (unique pair, no self-follows) |
| `likes` | user_id + post_id (unique pair) |
| `comments` | Content ≤500 chars; FK → posts + profiles |
| `notifications` | Type (like/comment/follow), actor, target user, read flag |

Notification rows are created automatically by PostgreSQL triggers on `likes`, `comments`, and `follows` inserts. All tables have RLS enabled.
