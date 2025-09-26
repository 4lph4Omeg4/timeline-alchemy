-- RLS Policies for organizations table
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update organizations they own or admin" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for org_members table
CREATE POLICY "Users can view members of their organizations" ON org_members
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert members in organizations they own or admin" ON org_members
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can update members in organizations they own or admin" ON org_members
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can delete members in organizations they own or admin" ON org_members
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for clients table
CREATE POLICY "Users can view clients of their organizations" ON clients
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert clients in organizations they belong to" ON clients
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update clients in organizations they belong to" ON clients
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete clients in organizations they belong to" ON clients
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for user_clients table
CREATE POLICY "Users can view their client assignments" ON user_clients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own client assignments" ON user_clients
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own client assignments" ON user_clients
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for blog_posts table
CREATE POLICY "Users can view posts from their organizations" ON blog_posts
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert posts in their organizations" ON blog_posts
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update posts in their organizations" ON blog_posts
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete posts in their organizations" ON blog_posts
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for images table
CREATE POLICY "Users can view images from their organizations" ON images
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert images in their organizations" ON images
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update images in their organizations" ON images
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete images in their organizations" ON images
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for social_connections table
CREATE POLICY "Users can view social connections from their organizations" ON social_connections
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert social connections in their organizations" ON social_connections
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update social connections in their organizations" ON social_connections
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete social connections in their organizations" ON social_connections
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view subscriptions from their organizations" ON subscriptions
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert subscriptions in their organizations" ON subscriptions
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update subscriptions in their organizations" ON subscriptions
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );
