-- ==========================================
-- SUPABASE MIGRATION: REVIEWS TABLE SETUP
-- ==========================================
-- Run this in the Supabase Dashboard SQL Editor.

-- 1. Create the 'reviews' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    handle TEXT,
    role TEXT DEFAULT 'Verified Creator',
    rating INTEGER DEFAULT 5,
    text TEXT NOT NULL,
    platform TEXT DEFAULT 'instagram',
    verified BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Access Control
DROP POLICY IF EXISTS "Allow read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow delete reviews" ON public.reviews;

CREATE POLICY "Allow read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update reviews" ON public.reviews FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete reviews" ON public.reviews FOR DELETE USING (true);

-- 4. Expose the table explicitly to the API
GRANT ALL ON public.reviews TO anon, authenticated, service_role;

RAISE NOTICE '🚀 Supabase reviews table setup complete! Run this in your SQL Editor.';
