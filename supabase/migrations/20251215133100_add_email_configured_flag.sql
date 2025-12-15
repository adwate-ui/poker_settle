-- Add email_configured flag to profiles table to track if user has set up email notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_configured BOOLEAN NOT NULL DEFAULT FALSE;

-- Add emailjs settings to profiles table (optional - for user-specific email configuration)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS emailjs_service_id TEXT,
ADD COLUMN IF NOT EXISTS emailjs_template_id TEXT,
ADD COLUMN IF NOT EXISTS emailjs_public_key TEXT,
ADD COLUMN IF NOT EXISTS from_email TEXT;
