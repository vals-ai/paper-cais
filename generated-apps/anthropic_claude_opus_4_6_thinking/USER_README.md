# Zeeter Social Network - User Guide

## Test Credentials

| Account | Email | Password |
|---------|-------|----------|
| Demo User | demo@zeeter.com | demo123456 |
| Alice Johnson | alice@zeeter.com | alice123456 |
| Bob Smith | bob@zeeter.com | bob123456 |

## Navigation Guide

### As a Visitor (Not Logged In)
- **Home** (`/`): View the public feed of all posts. Use search bar to filter by keyword or #hashtag. Toggle between Newest and Trending sort.
- **Explore** (`/explore`): Browse all users on the platform.
- **Profiles** (`/profile/{username}`): View any user's profile and their posts.
- **Sign In**: Click "Sign In" in the top-right to log in or create an account.

### As a Member (Logged In)
1. **Sign In**: Go to `/login` and use the demo credentials above, or create a new account at `/signup`.

2. **Home Feed** (`/`):
   - Write a new post in the compose box at the top (280 character limit)
   - Like posts by clicking the heart icon ❤️
   - Comment on posts by clicking the comment icon 💬
   - Edit or delete your own posts using the pencil ✏️ and trash 🗑️ icons
   - Search posts by keyword or #hashtag
   - Sort by Newest or Trending

3. **Explore** (`/explore`):
   - Search for users by username or display name
   - Follow/unfollow users directly from the user cards

4. **Profile** (`/profile/{username}`):
   - View your stats (posts, followers, following)
   - Edit your display name and bio by clicking the pencil icon
   - Upload a profile picture by hovering over the avatar
   - View all posts by that user

5. **Notifications** (`/notifications`):
   - See alerts when someone likes your post, comments on your post, or follows you
   - Unread notifications are highlighted with a blue dot
   - Click "Mark all read" to clear notifications
   - Badge counter appears in the nav bar

### Key Actions to Test
1. **Sign up** → Create a new account with username/email/password
2. **Create a post** → Type in the compose box and click Post
3. **Like a post** → Click the heart icon on any post
4. **Comment** → Click the comment icon, type a reply, click Reply
5. **Follow a user** → Go to Explore, click Follow on a user card
6. **Edit profile** → Go to Profile, click the pencil icon, update bio
7. **Search** → Type a keyword in the search bar on the home feed
