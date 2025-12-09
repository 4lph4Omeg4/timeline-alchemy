# Facebook App Review - Testing Instructions for Timeline Alchemy

## App Access Information

**App URL:** https://www.timeline-alchemy.nl

**Test Account Credentials:**
- Email: [CREATE_TEST_ACCOUNT@example.com]
- Password: [CREATE_SECURE_PASSWORD]

**Note:** You can also create your own account directly on the website.

---

## Facebook Login Integration Overview

**Timeline Alchemy uses Facebook Login for:**
1. **Authentication** - Users can sign in with Facebook (optional)
2. **Social Media Management** - Users connect their Facebook Pages to schedule and publish content
3. **Instagram Integration** - Users connect Instagram Business Accounts (via Facebook Pages) for content posting

---

## Meta APIs & Permissions Used

We request the following permissions:

### 1. **public_profile** (Basic Permission)
- **Purpose:** Identify the user and display their name
- **Usage:** Store user's Facebook name for account display

### 2. **pages_show_list** (Standard Access)
- **Purpose:** Retrieve the list of Facebook Pages the user manages
- **Usage:** Allow users to select which Page to connect for content publishing

### 3. **pages_read_engagement** (Standard Access)
- **Purpose:** Read Page insights and engagement metrics
- **Usage:** Display basic analytics about published content (planned feature)

### 4. **pages_manage_posts** (Standard Access)
- **Purpose:** Create and publish posts on behalf of the user's Facebook Pages
- **Usage:** Schedule and publish AI-generated blog content to Facebook Pages

### 5. **Instagram Integration** (via Facebook Pages)
- **Purpose:** Publish content to Instagram Business Accounts connected to Facebook Pages
- **Usage:** Cross-post content to Instagram through the Facebook Pages API

---

## How to Test the App

### Step 1: Create an Account
1. Go to: https://www.timeline-alchemy.nl
2. Click "Get Started" or "Sign Up"
3. Create an account using email/password
4. You'll receive a 14-day trial plan automatically

### Step 2: Navigate to Social Connections
1. After logging in, you'll be on the Dashboard
2. Click "Socials" in the left sidebar navigation
3. This page shows all available social media platforms

### Step 3: Connect Facebook
1. On the Socials page, find the Facebook card
2. Click "Connect" button
3. You'll be redirected to Facebook OAuth dialog
4. **Grant all requested permissions:**
   - Access your public profile
   - Show list of Pages you manage
   - Read engagement on your Pages
   - Manage posts on your Pages

### Step 4: Select a Facebook Page
1. After authorization, you'll be redirected to Page Selection
2. You'll see a list of all Facebook Pages where you are Admin/Manager
3. Select the Page you want to use for Timeline Alchemy
4. Click "Connect Selected Page"
5. You'll be redirected back to the Socials page with a success message

### Step 5: Test Content Publishing (Optional)
1. Go to "Content" in the left sidebar
2. Click "Create New Content"
3. Enter a topic or prompt for AI content generation
4. The AI will generate a blog post
5. Click "Schedule to Social Media"
6. Select your connected Facebook Page
7. Choose a date/time or publish immediately
8. Content will be posted to your selected Facebook Page

---

## What Reviewers Will See

### OAuth Flow:
- Standard Facebook Login dialog
- Permission requests for the 4 scopes listed above
- Redirect to Page selection screen
- Success confirmation

### App Functionality:
- Dashboard with AI content creation tools
- Social media connection management
- Content scheduling interface
- Multi-platform posting capabilities

### Facebook Page Integration:
- List of user's managed Pages
- Ability to select specific Page for posting
- Schedule posts with AI-generated content
- View connection status and manage settings

---

## Privacy & Data Usage

**What data we collect:**
- Facebook user ID (for authentication)
- User's name (for display purposes)
- Page access tokens (for publishing)
- List of managed Pages (for Page selection)

**What data we DON'T collect:**
- Friends lists
- Personal posts or timeline data
- Private messages
- Photos or media (except what user explicitly creates in our app)

**Data storage:**
- Stored securely in our database
- Access tokens encrypted
- Only used for authorized actions (posting content)
- Users can disconnect at any time

**Data retention:**
- Tokens stored until user disconnects
- Can be revoked by user at any time via app or Facebook settings
- Deleted when user deletes account

---

## Technical Implementation

**OAuth Flow:**
- Standard OAuth 2.0 with PKCE
- Redirect URI: `https://www.timeline-alchemy.nl/api/auth/facebook/callback`
- Uses Facebook Graph API v18.0
- Implements proper error handling and token refresh

**API Endpoints Used:**
- `/me` - Get user info
- `/me/accounts` - Get user's Pages
- `/me/permissions` - Verify granted permissions
- `/{page-id}/feed` - Publish posts to Pages
- `/{page-id}?fields=instagram_business_account` - Get connected Instagram accounts

---

## Important Notes for Reviewers

### App Mode:
Our app is currently in **Development Mode** for testing. We are submitting this review to move to **Live Mode** for public access.

### Business Use Case:
Timeline Alchemy is an AI-powered content creation and social media management platform. Users create blog posts with AI assistance and publish them across multiple social platforms including Facebook Pages.

### Why We Need These Permissions:

1. **pages_show_list**: Users may manage multiple Pages. We need to show them which Pages they can connect.

2. **pages_read_engagement**: To provide basic analytics and insights about published content (helps users understand content performance).

3. **pages_manage_posts**: Core functionality - publishing AI-generated content to users' Facebook Pages on their behalf.

4. **Instagram via Pages**: Many users want to cross-post to Instagram. This is only possible through Instagram Business Accounts connected to Facebook Pages.

---

## Support Contact

If you encounter any issues during review:
- **Support Email:** [YOUR_SUPPORT_EMAIL]
- **Developer Contact:** [YOUR_EMAIL]
- **Documentation:** https://www.timeline-alchemy.nl/docs

---

## Test Scenarios

### Scenario 1: Basic Facebook Connection
1. Sign up for account
2. Connect Facebook
3. Select a Page
4. Verify connection shows as "Connected" in dashboard

### Scenario 2: Content Publishing
1. Create new content with AI
2. Schedule to Facebook
3. Verify post appears on selected Facebook Page

### Scenario 3: Disconnect & Reconnect
1. Disconnect Facebook in app
2. Verify tokens are removed
3. Reconnect with same account
4. Select different Page (if available)

### Scenario 4: Permission Verification
1. After connecting, check Facebook Settings → Business Integrations
2. Verify Timeline Alchemy appears with correct permissions
3. Verify user can revoke access from Facebook settings

---

Thank you for reviewing Timeline Alchemy! We're committed to providing a secure, privacy-focused platform for AI-powered content creation and social media management.

