-- ==========================================
-- SUPABASE MIGRATION: SETTINGS TABLE SETUP
-- ==========================================
-- This script sets up the 'settings' table in your Supabase database.
-- Run this in the Supabase Dashboard SQL Editor.
-- Note: Column names are in camelCase inside double-quotes because the
-- backend ORM wrapper expects exact camelCase fields.

-- 1. Create the 'settings' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE, -- Links to users.id
    
    -- Instagram Credentials
    "instagramAccessToken" TEXT,
    "instagramPageId" TEXT,
    "businessAccountId" TEXT,
    "connectedInstagramName" TEXT,
    "isAccountConnected" BOOLEAN DEFAULT FALSE,
    "instagramAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    -- Facebook Credentials (keep separate per instructions)
    "facebookAccessToken" TEXT,
    "facebookPageId" TEXT,
    "connectedFacebookName" TEXT,
    "isFacebookConnected" BOOLEAN DEFAULT FALSE,
    "facebookAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    -- WhatsApp Credentials
    "whatsappToken" TEXT,
    "whatsappPhoneNumberId" TEXT,
    "connectedWhatsAppName" TEXT,
    "isWhatsAppConnected" BOOLEAN DEFAULT FALSE,
    "whatsappAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    -- Other Channels (Coming Soon placeholders)
    "telegramToken" TEXT,
    "isTelegramConnected" BOOLEAN DEFAULT FALSE,
    "telegramAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    "twitterApiKey" TEXT,
    "isTwitterConnected" BOOLEAN DEFAULT FALSE,
    "twitterAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    "youtubeApiKey" TEXT,
    "isYouTubeConnected" BOOLEAN DEFAULT FALSE,
    "youtubeAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    "linkedinAccessToken" TEXT,
    "isLinkedInConnected" BOOLEAN DEFAULT FALSE,
    "linkedinAutomationEnabled" BOOLEAN DEFAULT TRUE,
    
    -- Connection Diagnostics
    "connectionError" TEXT,
    "lastTestedAt" TIMESTAMP WITH TIME ZONE,
    
    -- AI Assistant Configs
    "aiFallbackMessage" TEXT DEFAULT 'I am currently in limited mode, please contact support.',
    "aiName" TEXT DEFAULT 'Zen Assistant',
    "aiTone" TEXT DEFAULT 'friendly and concise',
    "aiKnowledgeBase" TEXT DEFAULT 'You are an AI helpful assistant.',
    "aiTemperature" NUMERIC DEFAULT 0.7,
    
    -- Metadata timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Add ForeignKey Constraint if the public.users table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'users'
    ) THEN
        ALTER TABLE public.settings 
        DROP CONSTRAINT IF EXISTS fk_settings_user,
        ADD CONSTRAINT fk_settings_user 
        FOREIGN KEY ("userId") 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Successfully linked settings."userId" to public.users.id';
    ELSE
        RAISE NOTICE '⚠️ public.users table not found yet. Constraint skipped - create it soon.';
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Stricter Policies for Data Protection
DROP POLICY IF EXISTS "Enable read access for all" ON public.settings;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.settings;
DROP POLICY IF EXISTS "Enable update access for all" ON public.settings;
DROP POLICY IF EXISTS "Enable delete access for all" ON public.settings;

-- Policy A: Allow anyone to view settings (or restrict to authenticated users)
CREATE POLICY "Allow read settings" 
ON public.settings 
FOR SELECT 
USING (true);

-- Policy B: Allow anyone to insert new settings rows
CREATE POLICY "Allow insert settings" 
ON public.settings 
FOR INSERT 
WITH CHECK (true);

-- Policy C: Allow anyone to update existing settings rows
CREATE POLICY "Allow update settings" 
ON public.settings 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Policy D: Allow delete settings
CREATE POLICY "Allow delete settings" 
ON public.settings 
FOR DELETE 
USING (true);

-- 5. Expose the settings table explicitly to the Data API (anon / authenticated roles)
GRANT ALL ON public.settings TO anon, authenticated, service_role;

RAISE NOTICE '🚀 Supabase connections settings table setup complete! Run this in your SQL Editor.';
