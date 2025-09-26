# Timeline Alchemy - AI Content Creation Platform

Timeline Alchemy (TLA) is a comprehensive SaaS application that helps small businesses and creators generate, schedule, and publish AI-powered content across all social media platforms.

## Features

- 🤖 **AI Content Generation**: Create engaging blog posts and social media content using OpenAI GPT-4
- 📅 **Smart Scheduling**: Schedule content across multiple platforms with intelligent calendar system
- 🔗 **Multi-Platform Publishing**: Connect and publish to Twitter, LinkedIn, Instagram, Facebook, and YouTube
- 🏢 **Organization Management**: Support for multiple organizations with role-based access
- 💳 **Subscription Management**: Stripe-powered billing with Basic, Pro, and Enterprise tiers
- 🔐 **Secure Authentication**: Supabase Auth with magic links and social login
- 📊 **Analytics Dashboard**: Track performance and usage across all platforms

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 and DALL-E 3
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timeline-alchemy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Initialize Supabase
   supabase init

   # Start local Supabase (optional for development)
   supabase start

   # Apply migrations
   supabase db push
   ```

5. **Deploy Edge Functions**
   ```bash
   supabase functions deploy create-org
   supabase functions deploy scheduled-publisher
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
timeline-alchemy/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard and main app
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── icons/            # Custom icons
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── stripe.ts         # Stripe configuration
│   ├── ai.ts             # AI service functions
│   └── utils.ts          # Utility functions
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Database Schema

The application uses the following main tables:

- `organizations` - Company/organization data
- `org_members` - User-organization relationships with roles
- `blog_posts` - Content posts with scheduling
- `social_connections` - OAuth tokens for social platforms
- `subscriptions` - Stripe subscription data
- `images` - Generated images for posts
- `clients` - Client management for agencies

## API Routes

- `POST /api/auth/callback` - Handle authentication callbacks
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/ai/generate` - Generate AI content
- `POST /api/posts` - Create/update posts
- `GET /api/posts` - Fetch user posts

## Edge Functions

- `create-org` - Create new organization with Stripe customer
- `scheduled-publisher` - Publish scheduled content to social platforms

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your preferred platform

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@timelinealchemy.com or join our Discord community.

## Roadmap

- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Content templates and themes
- [ ] Advanced AI customization
- [ ] Mobile app
- [ ] API for third-party integrations