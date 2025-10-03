-- Enable Row Level Security (RLS) for all tables
-- This fixes the security issue where policies exist but RLS is disabled

-- Enable RLS for blog_posts table
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS for images table
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Enable RLS for org_members table
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS for organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS for social_connections table
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Enable RLS for subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS for telegram_channels table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_channels' AND table_schema = 'public') THEN
        ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS for ratings table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ratings' AND table_schema = 'public') THEN
        ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS for social_posts table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts' AND table_schema = 'public') THEN
        ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
