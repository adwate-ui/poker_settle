-- Create a SECURITY DEFINER function to safely resolve short links
-- This prevents enumeration of access_tokens via the public RLS policy
CREATE OR REPLACE FUNCTION public.resolve_short_link(_short_code text)
RETURNS TABLE(resource_type text, resource_id uuid, access_token text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.resource_type, sl.resource_id, sl.access_token
  FROM public.shared_links sl
  WHERE sl.short_code = _short_code
  LIMIT 1;
$$;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view shared links by short_code" ON public.shared_links;