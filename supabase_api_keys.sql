-- SQL script to create the api_keys table
-- Run this in your Supabase SQL Editor (https://supabase.com dashboard)

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default Key',
    active BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for now (auth checks are handled on the server side)
DROP POLICY IF EXISTS "Allow all api_keys" ON public.api_keys;
CREATE POLICY "Allow all api_keys" ON public.api_keys FOR ALL USING (true) WITH CHECK (true);
