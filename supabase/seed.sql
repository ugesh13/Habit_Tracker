-- Seed data: achievement catalog + starter templates.
-- Safe to re-run: uses `on conflict do nothing`.

insert into public.achievements (key, name, description, icon) values
  ('first_checkin', 'First step', 'Complete your first check-in', 'footprints'),
  ('streak_3', 'Momentum', 'Reach a 3-day streak on any habit', 'flame'),
  ('streak_7', 'One week strong', 'Reach a 7-day streak on any habit', 'flame'),
  ('streak_30', 'A month of showing up', 'Reach a 30-day streak on any habit', 'trophy'),
  ('streak_100', 'Centurion', 'Reach a 100-day streak on any habit', 'crown'),
  ('perfect_day', 'Perfect day', 'Complete every scheduled habit in one day', 'star'),
  ('mood_week', 'Checking in', 'Log your mood for 7 days in a row', 'heart')
on conflict (key) do nothing;

insert into public.templates (category, name, description, estimated_minutes, benefits, definition) values
  ('hydration', 'Steady Hydration', 'Simple daily water intake tracking.', 2,
    array['Better focus', 'Fewer energy dips'],
    '{"habits":[{"title":"Drink water","goal_type":"count","goal_target":8,"goal_unit":"glasses","recurrence_type":"daily","time_block":"anytime"}]}'::jsonb),
  ('meditation', 'Calm Mind Starter', 'A gentle 10-minute daily meditation habit.', 10,
    array['Lower stress', 'Better sleep onset'],
    '{"habits":[{"title":"Meditate","goal_type":"duration","goal_target":10,"goal_unit":"minutes","recurrence_type":"daily","time_block":"morning"}]}'::jsonb),
  ('reading', 'Daily Pages', 'Build a consistent reading habit.', 20,
    array['Improved focus', 'Long-term knowledge'],
    '{"habits":[{"title":"Read","goal_type":"duration","goal_target":20,"goal_unit":"minutes","recurrence_type":"daily","time_block":"evening"}]}'::jsonb),
  ('fitness', 'Move Daily', 'A flexible movement habit with a linked alternative.', 30,
    array['Cardiovascular health', 'Mood boost'],
    '{"habits":[{"title":"Workout","goal_type":"yes_no","recurrence_type":"times_per_week","times_per_week":4,"time_block":"morning"}]}'::jsonb),
  ('sleep', 'Wind Down', 'A consistent evening wind-down routine.', 15,
    array['Better sleep quality', 'Easier mornings'],
    '{"habits":[{"title":"Screens off by 10pm","goal_type":"yes_no","recurrence_type":"daily","time_block":"evening"}]}'::jsonb),
  ('mental_wellbeing', 'Daily Reflection', 'End-of-day mood and gratitude check-in.', 5,
    array['Self-awareness', 'Emotional regulation'],
    '{"habits":[{"title":"Journal 3 things","goal_type":"yes_no","recurrence_type":"daily","time_block":"evening"}]}'::jsonb)
on conflict do nothing;
