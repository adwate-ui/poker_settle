-- Add gemini_api_key to profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gemini_api_key') THEN 
        ALTER TABLE profiles ADD COLUMN gemini_api_key text;
        -- Optional: Add comment or security note
        COMMENT ON COLUMN profiles.gemini_api_key IS 'User provided Gemini API Key';
    END IF;
END $$;
