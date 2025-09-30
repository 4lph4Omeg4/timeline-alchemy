-- Create social_posts table
CREATE TABLE social_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, platform)
);

-- Add RLS policy for social_posts
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view social posts for posts they have access to
CREATE POLICY "Users can view social posts for accessible posts" ON social_posts
    FOR SELECT USING (
        post_id IN (
            SELECT bp.id FROM blog_posts bp
            JOIN org_members om ON bp.org_id = om.org_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Policy: Users can insert social posts for posts they have access to
CREATE POLICY "Users can insert social posts for accessible posts" ON social_posts
    FOR INSERT WITH CHECK (
        post_id IN (
            SELECT bp.id FROM blog_posts bp
            JOIN org_members om ON bp.org_id = om.org_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Policy: Users can update social posts for posts they have access to
CREATE POLICY "Users can update social posts for accessible posts" ON social_posts
    FOR UPDATE USING (
        post_id IN (
            SELECT bp.id FROM blog_posts bp
            JOIN org_members om ON bp.org_id = om.org_id
            WHERE om.user_id = auth.uid()
        )
    );
