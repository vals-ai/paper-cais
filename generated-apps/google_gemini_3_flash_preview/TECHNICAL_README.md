# Zeeter Technical README

## General Implementation
Zeeter is a short-form social media platform built using React, Vite, and Supabase. It allows users to post short updates, follow others, and interact via likes and comments.

### Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React, React Router
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Docker Compose

## Code Structure
- `/frontend/src/components`: Reusable UI components (Button, Input, Card, etc.) and layout components like Navbar.
- `/frontend/src/pages`: Application pages (Home, Profile, Login, Signup, etc.).
- `/frontend/src/lib`: Helper libraries, including the Supabase client and utility functions.
- `/frontend/src/hooks`: Custom React hooks (if any).
- `docker-compose.yml`: Orchestrates the frontend service.

## Database Schema
The database uses Supabase (PostgreSQL) with the following tables:
- `profiles`: Stores user profile information (username, display name, bio, avatar).
- `posts`: Stores the short-form posts (max 280 characters).
- `follows`: Stores follower/following relationships.
- `likes`: Tracks post likes by users.
- `comments`: Stores replies to posts.
- `notifications`: Tracks interactions (likes, comments, follows) for users.

RLS (Row Level Security) is enabled on all tables to ensure users can only modify their own data.
