-- Add integration settings to user_preferences table
-- These settings allow users to configure email, payment confirmations, etc.

-- Add email configuration columns
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS email_service_id TEXT,
ADD COLUMN IF NOT EXISTS email_template_id TEXT,
ADD COLUMN IF NOT EXISTS email_public_key TEXT,
ADD COLUMN IF NOT EXISTS email_from_address TEXT,
ADD COLUMN IF NOT EXISTS email_from_name TEXT;

-- Add payment confirmation configuration
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS payment_keywords TEXT[] DEFAULT ARRAY['PAID', 'DONE', 'SETTLED', 'COMPLETE', 'CONFIRMED'];

-- Add custom Supabase configuration (optional, for advanced users)
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS custom_supabase_url TEXT,
ADD COLUMN IF NOT EXISTS custom_supabase_key TEXT;

-- Add tutorial completion flag
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.user_preferences.email_service_id IS 'EmailJS Service ID for sending emails';
COMMENT ON COLUMN public.user_preferences.email_template_id IS 'EmailJS Template ID for email notifications';
COMMENT ON COLUMN public.user_preferences.email_public_key IS 'EmailJS Public Key for authentication';
COMMENT ON COLUMN public.user_preferences.email_from_address IS 'From email address for notifications';
COMMENT ON COLUMN public.user_preferences.email_from_name IS 'From name for email notifications';
COMMENT ON COLUMN public.user_preferences.payment_keywords IS 'Keywords that trigger payment confirmation';
COMMENT ON COLUMN public.user_preferences.custom_supabase_url IS 'Custom Supabase URL (optional, for advanced users)';
COMMENT ON COLUMN public.user_preferences.custom_supabase_key IS 'Custom Supabase publishable key (optional)';
COMMENT ON COLUMN public.user_preferences.tutorial_completed IS 'Whether user has completed the first-time tutorial';
