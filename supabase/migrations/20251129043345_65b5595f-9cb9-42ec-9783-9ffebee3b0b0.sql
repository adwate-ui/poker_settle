-- Create shared_links table for short, shareable links
CREATE TABLE public.shared_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('game', 'player')),
  resource_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_resource UNIQUE (user_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Users can create shared links for their own resources
CREATE POLICY "Users can create their own shared links"
  ON public.shared_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own shared links
CREATE POLICY "Users can view their own shared links"
  ON public.shared_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view shared links (needed to resolve short codes)
CREATE POLICY "Public can view shared links"
  ON public.shared_links
  FOR SELECT
  USING (true);

-- Users can delete their own shared links
CREATE POLICY "Users can delete their own shared links"
  ON public.shared_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster short code lookups
CREATE INDEX idx_shared_links_short_code ON public.shared_links(short_code);
CREATE INDEX idx_shared_links_user_resource ON public.shared_links(user_id, resource_type, resource_id);