-- Follow system: follower_id follows following_id
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see all follows (needed for feed filtering)
CREATE POLICY "Authenticated users can read follows" ON user_follows
  FOR SELECT TO authenticated USING (true);

-- Users can only follow others as themselves
CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can only unfollow if they are the follower
CREATE POLICY "Users can unfollow" ON user_follows
  FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);
