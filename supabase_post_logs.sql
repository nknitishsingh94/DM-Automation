-- Migration: Create post_logs table for Analytics

CREATE TABLE IF NOT EXISTS public.post_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    platform text NOT NULL,
    response jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id text,
    workspace_id text
);

-- RLS Policies
ALTER TABLE public.post_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own post logs"
    ON public.post_logs FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own post logs"
    ON public.post_logs FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own post logs"
    ON public.post_logs FOR UPDATE
    USING (auth.uid()::text = user_id);
