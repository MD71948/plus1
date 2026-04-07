-- Add visibility to activities: public (all), followers, friends (mutual follow)
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'
  CHECK (visibility IN ('public', 'followers', 'friends'));
