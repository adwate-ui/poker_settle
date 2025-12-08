-- Create a SECURITY DEFINER function to validate share tokens
-- This allows unauthenticated users to validate tokens without direct table access
CREATE OR REPLACE FUNCTION public.validate_share_token(_token text)
RETURNS TABLE(resource_type text, resource_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT sl.resource_type, sl.resource_id
  FROM public.shared_links sl
  WHERE sl.access_token = _token
  LIMIT 1;
$$;