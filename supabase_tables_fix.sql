-- FIX SCRIPT FOR CAPTIONS AND SCHEDULED POSTS
-- Run this in your Supabase SQL Editor

-- 1. Ensure captions table exists
CREATE TABLE IF NOT EXISTS public.captions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    title TEXT,
    content TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure user_id column exists just in case it was missing
ALTER TABLE public.captions ADD COLUMN IF NOT EXISTS user_id UUID;

-- Fix incorrect foreign key constraint pointing to auth.users instead of public.users
ALTER TABLE public.captions DROP CONSTRAINT IF EXISTS captions_user_id_fkey;
ALTER TABLE public.captions ADD CONSTRAINT captions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Ensure scheduled_posts table exists
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    caption TEXT,
    "scheduledFor" TIMESTAMP WITH TIME ZONE,
    "mediaUrl" TEXT,
    "triggerKeyword" TEXT,
    "autoResponse" TEXT,
    status TEXT DEFAULT 'Scheduled',
    "retryCount" INTEGER DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure user_id column exists just in case it was missing
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS user_id UUID;

-- Ensure createdAt and updatedAt columns exist with correct casing
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.captions ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.captions ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Enable RLS and add basic policies
ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow all captions" ON public.captions;
DROP POLICY IF EXISTS "Allow all scheduled_posts" ON public.scheduled_posts;

-- Create simple policies (allow all for now, assuming your API handles auth)
CREATE POLICY "Allow all captions" ON public.captions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all scheduled_posts" ON public.scheduled_posts FOR ALL USING (true) WITH CHECK (true);

RAISE NOTICE '✅ Tables successfully fixed!';
