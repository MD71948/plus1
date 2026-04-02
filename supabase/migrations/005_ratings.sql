-- Show-up score on profiles (starts at 100)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS show_up_score integer DEFAULT 100;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ratings_count integer DEFAULT 0;

-- Ratings table: thumbs up/down after an activity
CREATE TABLE activity_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id),
  rated_user_id uuid NOT NULL REFERENCES auth.users(id),
  is_positive boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, rater_id, rated_user_id)
);

ALTER TABLE activity_ratings ENABLE ROW LEVEL SECURITY;

-- Host and accepted participants can insert ratings
CREATE POLICY "Participants can rate others"
  ON activity_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id
    AND rater_id != rated_user_id
    AND (
      auth.uid() = (SELECT host_id FROM activities WHERE id = activity_id)
      OR EXISTS (
        SELECT 1 FROM activity_requests
        WHERE activity_id = activity_ratings.activity_id
          AND user_id = auth.uid()
          AND status = 'accepted'
      )
    )
  );

-- Can read ratings you gave or received
CREATE POLICY "Users can read relevant ratings"
  ON activity_ratings FOR SELECT
  USING (auth.uid() = rated_user_id OR auth.uid() = rater_id);

-- Trigger: auto-update show_up_score after every rating
CREATE OR REPLACE FUNCTION update_show_up_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total integer;
  v_positive integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_positive = true)
  INTO v_total, v_positive
  FROM activity_ratings
  WHERE rated_user_id = NEW.rated_user_id;

  IF v_total > 0 THEN
    UPDATE user_profiles
    SET
      show_up_score = ROUND((v_positive::float / v_total::float) * 100),
      ratings_count = v_total
    WHERE user_id = NEW.rated_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rating_insert
  AFTER INSERT ON activity_ratings
  FOR EACH ROW EXECUTE FUNCTION update_show_up_score();
