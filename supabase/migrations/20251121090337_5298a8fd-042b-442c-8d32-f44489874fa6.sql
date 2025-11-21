-- 1. Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Update existing profiles to have username based on display_name or id
UPDATE public.profiles 
SET username = COALESCE(
  LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]', '', 'g')),
  'user_' || SUBSTRING(id::text, 1, 8)
)
WHERE username IS NULL;

-- Make username unique and not null
ALTER TABLE public.profiles 
  ALTER COLUMN username SET NOT NULL,
  ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Create reactions table (to replace post_likes)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS for reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create comments view pointing to post_comments
CREATE OR REPLACE VIEW public.comments AS
SELECT * FROM public.post_comments;

-- 5. Add foreign keys for friendships (drop and recreate to ensure correct references)
ALTER TABLE public.friendships
  DROP CONSTRAINT IF EXISTS friendships_requester_id_fkey,
  DROP CONSTRAINT IF EXISTS friendships_addressee_id_fkey;

ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_requester_id_fkey 
    FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT friendships_addressee_id_fkey 
    FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Fix conversation_participants RLS policy with security definer function
-- First, create a helper function
CREATE OR REPLACE FUNCTION public.user_in_conversation(conversation_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = $1
    AND conversation_participants.user_id = $2
  );
$$;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;

-- Create new policies using the function
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (public.user_in_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can add participants to conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    public.user_in_conversation(conversation_id, auth.uid())
  );

-- 7. Update handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base username from metadata or email
  base_username := COALESCE(
    LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'username', '[^a-zA-Z0-9_-]', '', 'g')),
    LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'display_name', '[^a-zA-Z0-9_-]', '', 'g')),
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Ensure username is unique
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;
  
  -- Insert profile with username
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 9. Create trigger to update posts likes_count when reactions change
CREATE OR REPLACE FUNCTION public.update_post_reactions_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_reactions_count ON public.reactions;
CREATE TRIGGER update_reactions_count
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_reactions_count();