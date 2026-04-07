-- Function to delete all data for the current user and their auth account
-- SECURITY DEFINER allows it to delete from auth.users (needs superuser privileges)
CREATE OR REPLACE FUNCTION delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete in correct order to avoid foreign key violations
  DELETE FROM activity_ratings    WHERE rater_id = v_uid OR rated_user_id = v_uid;
  DELETE FROM activity_messages   WHERE user_id = v_uid;
  DELETE FROM activity_requests   WHERE user_id = v_uid;
  DELETE FROM user_follows        WHERE follower_id = v_uid OR following_id = v_uid;
  DELETE FROM user_reports        WHERE reporter_id = v_uid OR reported_user_id = v_uid;
  -- Cancel hosted activities instead of deleting (so participants can see why it's gone)
  UPDATE activities SET status = 'cancelled' WHERE host_id = v_uid;
  DELETE FROM user_profiles       WHERE user_id = v_uid;
  -- Finally delete the auth user itself
  DELETE FROM auth.users          WHERE id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_current_user() TO authenticated;
