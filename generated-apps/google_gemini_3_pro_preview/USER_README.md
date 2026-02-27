# Zeeter - User Guide

## Validating the Application

### Access
The application is accessible in your browser at `http://localhost:58758` (or the port defined in your environment).

### Navigation & Key Workflows

1.  **Onboarding (Visitor -> Member)**
    *   Navigate to `/signup` or click "Sign up".
    *   Create an account with email/password.
    *   You will be redirected to the Home feed immediately (no email verification required).

2.  **Home Feed**
    *   View posts from the community.
    *   Use the text box at the top to write a new post (max 280 chars).
    *   Click "Post" to publish.

3.  **Interaction**
    *   **Like**: Click the heart icon on any post.
    *   **Comment**: Click the message icon or post body to view details and add a reply.
    *   **Profile**: Click user avatars to view their profiles.
    *   **Follow**: Click "Follow" on a user's profile to see their content in your feed (feed sorting implementation may vary in MVP).

4.  **Discovery & Notifications**
    *   **Search**: Use the "Search" tab to find users or posts by keyword.
    *   **Notifications**: Check the "Notifications" tab for recent interactions.

### Default Test Credentials
Use these pre-seeded accounts to test interactions immediately:

**User 1 (Alice)**
- **Email**: `alice@example.com`
- **Password**: `password123`

**User 2 (Bob)**
- **Email**: `bob@example.com`
- **Password**: `password123`

*Tip: Open the app in two different browsers (or incognito) to interact between Alice and Bob.*
