Zeeter — Quick Test Guide

Navigation & testing
- App root: open the app at APP_PUBLIC_URL (value is in generated-app/.env). The app is exposed on APP_PUBLIC_PORT (mapped to 4173).
- Pages:
  - Home (/): Personalized feed and composer (after login).
  - Explore (/explore): Browse members and follow them.
  - Profile (/profile/:id): View a member profile and recent posts.
  - Notifications (/notifications): Alerts for likes, comments, and follows.

Authentication
- Sign up with email and password. A demo seed has created two accounts you can use:
  - alice@example.com / password
  - bob@example.com / password
- After sign up, complete profile (display name) if prompted.

Key actions to try
1. Log in as alice@example.com (password)
2. From Home, create a short post (<=280 chars)
3. Visit Explore and view Bob's profile; follow Bob and like a post
4. Check Notifications to see a follow/like notification

Notes
- No email verification is required for these demo accounts.
- The seed script runs at container start to ensure demo users and sample posts exist.
