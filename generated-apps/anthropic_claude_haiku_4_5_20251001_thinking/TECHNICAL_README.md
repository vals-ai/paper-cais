# Zeeter - Technical Documentation

## Overview
Zeeter is a modern short-form social networking platform built with React, Vite, and Supabase. Users can share posts (up to 280 characters), follow other users, like and comment on posts, and receive notifications.

## Tech Stack
- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Backend**: Supabase (Auth, Database, RLS)
- **Database**: PostgreSQL with Row Level Security
- **State Management**: React Hooks
- **Routing**: React Router v7

## Architecture

### Frontend Structure
```
frontend/src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation and auth status
│   └── PostCard.jsx    # Post display with interactions
├── pages/              # Page components
│   ├── Home.jsx        # Feed with post creation
│   ├── Login.jsx       # Authentication
│   ├── Signup.jsx      # User registration
│   ├── Profile.jsx     # User profile view
│   ├── Notifications.jsx # Notification center
│   └── ProfileSetup.jsx # Initial profile configuration
├── hooks/
│   └── useAuth.jsx     # Authentication logic
├── lib/
│   ├── supabase.js     # Supabase client
│   └── utils.js        # Helper functions
├── App.jsx             # Root component with routing
└── index.css           # Tailwind + design system
```

### Database Schema
- **user_profiles**: User metadata (display_name, bio, avatar_url)
- **posts**: User posts with content, timestamps, and counts
- **likes**: Post likes (user_id, post_id)
- **comments**: Post comments with user content
- **follows**: User following relationships
- **notifications**: Alerts for interactions (likes, comments, follows)

All tables have Row Level Security (RLS) policies to ensure users can only access their own data appropriately.

## Key Features

### Authentication
- Email/password signup and login
- No email verification required
- User profiles created automatically on signup
- Session management via Supabase Auth

### Publishing
- Create posts up to 280 characters
- Real-time character counter
- Edit posts (via delete and recreate)
- Delete own posts

### Feed
- View all posts from all users
- Search posts by keyword/hashtag
- Sort by newest or trending (likes)
- Personalized feed follows user preferences

### Interactions
- Like/unlike posts with heart reaction
- Comment on posts with threading
- Delete own comments
- Real-time notification generation

### Notifications
- Like notifications
- Comment notifications
- Follow notifications
- Mark as read automatically

### Profiles
- View user profiles with bio and avatar
- Follow/unfollow users
- Edit own profile (bio, avatar URL)
- See follower/following counts
- View user's posts

## Design System
Using Tailwind CSS with custom color tokens:
- **Primary**: Sky blue (for main actions)
- **Secondary**: Violet (for secondary actions)
- **Accent**: Pink (for likes and important states)
- **Neutral**: Gray scale (for text and backgrounds)

All components use semantic tokens instead of hardcoded colors for consistent theming.

## Development Workflow
1. Install dependencies: `npm install`
2. Set Supabase environment variables in `.env`
3. Run dev server: `npm run dev`
4. Build for production: `npm run build`
5. Preview production build: `npm run preview`

## Deployment
The application is containerized using Docker and runs via Docker Compose. The frontend service (named `zeeter`) is exposed on the public port defined in the `.env` file.

## Security
- Row Level Security (RLS) enforces data access policies
- Users cannot access other users' private data
- Authentication required for protected operations
- Service role key used only for admin operations
