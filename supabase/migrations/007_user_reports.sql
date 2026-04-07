-- User reports table for flagging inappropriate profiles
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Only the reporter can insert their own report
CREATE POLICY "Users can insert reports" ON user_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can read all reports (via service role)
CREATE POLICY "Service role can read all reports" ON user_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
