-- Fix: Allow role to be NULL for pending users
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;

-- Also ensure status column exists and has default
ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'pending';

-- Update existing profiles so they have a status
UPDATE profiles SET status = 'approved' WHERE status IS NULL;

-- Recreate trigger with the correct logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'pending',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
