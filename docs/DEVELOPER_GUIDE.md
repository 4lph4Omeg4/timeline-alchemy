# 🛠 Developer Guide - Timeline Alchemy

> **Technical documentation for developers working on Timeline Alchemy**

## 🏗 **Architecture Overview**

### **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (Supabase)    │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React UI      │    │ • PostgreSQL    │    │ • OpenAI API    │
│ • TypeScript    │    │ • Auth          │    │ • Social APIs   │
│ • Tailwind CSS  │    │ • RLS           │    │ • Stripe        │
│ • shadcn/ui     │    │ • Edge Functions│    │ • WordPress     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**
1. **User Authentication** → Supabase Auth
2. **Content Creation** → OpenAI API → Database
3. **Social Connections** → OAuth → Database
4. **Scheduling** → Database → Cron Jobs
5. **Posting** → Social APIs → Status Updates

## 🗄 **Database Schema**

### **Core Tables**

#### **organizations**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **org_members**
```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'client')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
```

#### **blog_posts**
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  state TEXT DEFAULT 'draft' CHECK (state IN ('draft', 'scheduled', 'published')),
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  created_by_admin BOOLEAN DEFAULT FALSE,
  social_posts JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **social_connections**
```sql
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'discord', 'reddit', 'telegram', 'facebook', 'instagram', 'youtube', 'wordpress')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  site_url TEXT, -- For WordPress
  username TEXT, -- For WordPress
  password TEXT, -- For WordPress
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, platform, account_id)
);
```

### **Row Level Security (RLS)**

#### **Key Policies**
```sql
-- Users can only see their own organization's data
CREATE POLICY "Users can view their organization data" ON blog_posts
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    OR created_by_admin = TRUE
  );

-- Social connections are private to organization
CREATE POLICY "Users can view their org connections" ON social_connections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

## 🔧 **API Architecture**

### **API Routes Structure**

#### **Authentication Routes**
```
/api/auth/{platform}/callback/
├── twitter/callback/route.ts
├── linkedin/callback/route.ts
├── discord/callback/route.ts
├── reddit/callback/route.ts
└── telegram/callback/route.ts
```

#### **Content Generation Routes**
```
/api/generate-*/
├── generate-content/route.ts      # Main content generation
├── generate-image/route.ts        # Image generation
├── generate-social-posts/route.ts # Social media posts
└── save-image/route.ts           # Image storage
```

#### **Posting Engine Routes**
```
/api/post-*/
├── post-to-platforms/route.ts    # Core posting engine
├── post-status/route.ts          # Status tracking
├── manual-post/route.ts          # Manual posting
└── refresh-token/route.ts        # Token management
```

#### **Scheduling Routes**
```
/api/cron/
└── scheduled-posts/route.ts       # Cron job handler
```

### **Key API Patterns**

#### **Error Handling**
```typescript
export async function POST(request: NextRequest) {
  try {
    // API logic here
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

#### **Authentication Check**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### **Type Safety**
```typescript
// Use type assertions for dynamic data
const post = (data as any).post
const connections = (data as any).connections
```

## 🤖 **AI Integration**

### **OpenAI Configuration**
```typescript
// lib/ai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Content generation
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.7,
})
```

### **Image Generation**
```typescript
// DALL-E 3 integration
const image = await openai.images.generate({
  model: 'dall-e-3',
  prompt: cosmicImagePrompt,
  size: '1024x1024',
  quality: 'standard',
  n: 1,
})
```

### **Platform-Specific Prompts**
```typescript
const platformGuidelines = {
  twitter: 'Concise, engaging, hashtag-friendly, 280 characters max',
  linkedin: 'Professional, informative, industry-relevant, 2-3 sentences',
  discord: 'Community-friendly, engaging, emoji-rich, casual tone',
  reddit: 'Subreddit-appropriate, informative, engaging, 2-3 sentences',
  telegram: 'Channel-friendly, informative, engaging for community updates'
}
```

## 🔐 **Security Implementation**

### **OAuth 2.0 with PKCE**
```typescript
// lib/social-auth.ts
export class TwitterOAuth {
  generateAuthUrl(userId: string, orgId: string): string {
    const state = Buffer.from(JSON.stringify({ userId, orgId })).toString('base64')
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = this.generateCodeChallenge(codeVerifier)
    
    return `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${process.env.TWITTER_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`
  }
}
```

### **Token Management**
```typescript
// lib/token-manager.ts
export class TokenManager {
  static async getFreshToken(orgId: string, platform: string, accountId: string): Promise<string | null> {
    // Check if token needs refresh
    const statuses = await this.checkTokenStatus(orgId)
    const status = statuses.find(s => s.platform === platform && s.accountId === accountId)
    
    if (status?.needsRefresh) {
      const refreshResult = await this.refreshToken(orgId, platform, accountId)
      if (refreshResult.success && refreshResult.newAccessToken) {
        return refreshResult.newAccessToken
      }
    }
    
    // Return current token
    return await this.getCurrentToken(orgId, platform, accountId)
  }
}
```

## 📅 **Scheduling System**

### **Cron Job Implementation**
```typescript
// app/api/cron/scheduled-posts/route.ts
export async function GET() {
  const now = new Date().toISOString()
  
  // Get all scheduled posts
  const { data: scheduledPosts } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .eq('state', 'scheduled')
    .lte('scheduled_for', now)
    .order('scheduled_for')
  
  // Process each post
  for (const post of scheduledPosts || []) {
    await processScheduledPost(post)
  }
  
  return NextResponse.json({ processed: scheduledPosts?.length || 0 })
}
```

### **Posting Engine**
```typescript
// app/api/post-to-platforms/route.ts
export async function POST(request: NextRequest) {
  const { postId, platforms } = await request.json()
  
  // Get post and connections
  const post = await getPost(postId)
  const connections = await getConnections(post.org_id, platforms)
  
  // Post to each platform
  const results = await Promise.allSettled(
    platforms.map(platform => postToPlatform(post, connections[platform]))
  )
  
  // Update post status
  await updatePostStatus(postId, results)
  
  return NextResponse.json({ results })
}
```

## 🎨 **UI/UX Implementation**

### **Cosmic Styling**
```css
/* Cosmic gradient backgrounds */
.bg-cosmic {
  background: linear-gradient(135deg, 
    rgba(139, 69, 255, 0.1) 0%, 
    rgba(59, 130, 246, 0.1) 100%);
}

/* Glowing effects */
.glow-purple {
  box-shadow: 0 0 20px rgba(139, 69, 255, 0.3);
}

/* Animated gradients */
.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### **Component Patterns**
```typescript
// Reusable card component
export function CosmicCard({ children, className = '' }: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`
      bg-gradient-to-br from-purple-900/20 to-blue-900/20 
      backdrop-blur-md rounded-2xl border border-purple-500/20 
      shadow-2xl p-6 ${className}
    `}>
      {children}
    </div>
  )
}
```

## 🧪 **Testing & Debugging**

### **Debug Routes**
```
/api/debug/
├── auth/route.ts              # Check authentication
├── scheduled-posts/route.ts   # Check scheduled posts
├── post-details/route.ts      # Inspect specific post
├── user-orgs/route.ts         # Check user organizations
└── admin-package/route.ts     # Check admin packages
```

### **Development Tools**
```typescript
// Debug utility
export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${message}`, data)
  }
}
```

## 🚀 **Deployment**

### **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Build Process**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel --prod
```

## 📊 **Monitoring & Analytics**

### **Error Tracking**
```typescript
// Global error handler
export function trackError(error: Error, context: string) {
  console.error(`❌ ${context}:`, error)
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, etc.
  }
}
```

### **Performance Monitoring**
```typescript
// API response time tracking
const startTime = Date.now()
// ... API logic ...
const duration = Date.now() - startTime
console.log(`⏱️ API took ${duration}ms`)
```

## 🔄 **Development Workflow**

### **Git Workflow**
```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR
```

### **Code Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

### **Testing Strategy**
- **Unit Tests**: Jest for utility functions
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright for user flows
- **Manual Testing**: Debug routes for development

---

## 🎯 **Best Practices**

### **Code Organization**
- Keep components small and focused
- Use TypeScript interfaces for all data structures
- Implement proper error handling
- Follow the single responsibility principle

### **Performance**
- Use React.memo for expensive components
- Implement proper loading states
- Optimize database queries
- Use Next.js Image component for images

### **Security**
- Always validate user input
- Use RLS policies for data access
- Implement proper authentication checks
- Keep secrets in environment variables

### **Maintainability**
- Write clear, self-documenting code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep dependencies up to date

---

*This guide will be updated as the platform evolves! 🚀*
