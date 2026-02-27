# Zeeter Social Network — User Guide

## Getting Started

The app runs at **http://localhost:63550** (or whatever `APP_PUBLIC_URL` is set to).

---

## Pre-seeded Test Accounts

Three accounts are ready to use immediately — no signup required:

| Name | Email | Password | Username |
|---|---|---|---|
| Alice Johnson | alice@zeeter.test | password123 | alice_zeeter |
| Bob Smith | bob@zeeter.test | password123 | bob_zeeter |
| Carol White | carol@zeeter.test | password123 | carol_zeeter |

Alice already follows Bob and Carol, and several posts, likes, and comments are pre-loaded.

---

## Key Pages & Actions

### Home Feed (`/`)
- **View posts** from everyone (or from followed users when signed in)
- **Sort** between *Newest* and *Trending* using the tab switcher
- **Search** posts and hashtags using the search bar at the top
- **Create a post** using the composer box (signed-in users only, max 280 chars)
- **Like** posts by clicking the ❤️ button; click again to unlike
- **Comment** by clicking the 💬 button to expand the thread, then type and submit
- **Edit/Delete** your own posts via the `⋯` menu on any post you authored

### Explore (`/search`)
- **Search** for posts by keyword or #hashtag
- Switch to **People** tab to find and follow other members
- The **Follow** button appears for any user you don't yet follow

### Notifications (`/notifications`)
- Displays alerts for: **likes on your posts**, **comments on your posts**, **new followers**
- Each notification shows the actor, type icon, and a preview of the related post
- Click **Mark all read** to clear the unread badge in the navbar

### Profile (`/profile/:username`)
- View any user's banner, bio, follow stats, and recent posts
- Click **Edit profile** (your own profile) to update display name and bio
- Click the avatar area to upload a profile photo
- **Follow/Unfollow** other members directly from their profile

### Sign In / Sign Up
- **Sign up** at `/signup` — choose a username (letters, numbers, underscores), display name, email, password (≥6 chars)
- **Sign in** at `/login` with email + password
- No email verification required

---

## Visitor Mode
You can browse public posts and profiles **without signing in**. Like and comment buttons are visible but disabled until you create an account.
