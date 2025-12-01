-- Drop and recreate the public shared links policy to ensure it works for anonymous users
DROP POLICY IF EXISTS "Public can view shared links" ON public.shared_links;

-- Create policy that explicitly allows anonymous users to query shared_links
CREATE POLICY "Anyone can view shared links by short_code"
ON public.shared_links
FOR SELECT
TO anon, authenticated
USING (true);