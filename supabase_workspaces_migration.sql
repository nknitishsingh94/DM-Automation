-- SUPABASE MIGRATION: WORKSPACES SETUP & MULTI-WORKSPACE ISOLATION
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com).

-- 1. Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and add policies
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all workspaces" ON public.workspaces;
CREATE POLICY "Allow all workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.workspaces TO anon, authenticated, service_role;

-- 2. Add workspaceId column to existing tables if not present
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "workspaceId" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS "workspaceId" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS "workspaceId" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "workspaceId" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.flows ADD COLUMN IF NOT EXISTS "workspaceId" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS "workspaceId" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- scheduled_posts and captions use snake_case columns
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS "workspace_id" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.captions ADD COLUMN IF NOT EXISTS "workspace_id" UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add platform column to scheduled_posts (defaults to 'instagram')
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS "platform" TEXT DEFAULT 'instagram';

-- 3. Data Migration: Create a Default Workspace for each user and migrate existing data
DO $$
DECLARE
    user_rec RECORD;
    def_workspace_id UUID;
BEGIN
    FOR user_rec IN SELECT id FROM public.users LOOP
        -- Check if user already has a workspace
        SELECT id INTO def_workspace_id FROM public.workspaces WHERE "userId" = user_rec.id LIMIT 1;
        
        -- If no workspace exists, create the "Default Workspace"
        IF def_workspace_id IS NULL THEN
            INSERT INTO public.workspaces ("userId", name)
            VALUES (user_rec.id, 'Default Workspace')
            RETURNING id INTO def_workspace_id;
            
            RAISE NOTICE 'Created Default Workspace % for user %', def_workspace_id, user_rec.id;
        END IF;

        -- Migrate data that does not have workspaceId/workspace_id set
        UPDATE public.settings
        SET "workspaceId" = def_workspace_id
        WHERE "userId"::text = user_rec.id::text AND "workspaceId" IS NULL;

        UPDATE public.campaigns
        SET "workspaceId" = def_workspace_id
        WHERE "userId"::text = user_rec.id::text AND "workspaceId" IS NULL;

        UPDATE public.contacts
        SET "workspaceId" = def_workspace_id
        WHERE "userId"::text = user_rec.id::text AND "workspaceId" IS NULL;

        UPDATE public.messages
        SET "workspaceId" = def_workspace_id
        WHERE "userId"::text = user_rec.id::text AND "workspaceId" IS NULL;

        UPDATE public.flows
        SET "workspaceId" = def_workspace_id
        WHERE "userId"::text = user_rec.id::text AND "workspaceId" IS NULL;

        UPDATE public.chat_messages
        SET "workspaceId" = def_workspace_id
        WHERE "userId"::text = user_rec.id::text AND "workspaceId" IS NULL;

        UPDATE public.scheduled_posts
        SET "workspace_id" = def_workspace_id
        WHERE ("userId"::text = user_rec.id::text OR user_id::text = user_rec.id::text) AND "workspace_id" IS NULL;

        UPDATE public.captions
        SET "workspace_id" = def_workspace_id
        WHERE user_id::text = user_rec.id::text AND "workspace_id" IS NULL;
    END LOOP;
END $$;

-- 4. Alter unique constraint on public.settings
-- We drop the unique constraint on "userId" and replace it with a unique constraint on ("userId", "workspaceId").
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.settings'::regclass
      AND contype = 'u'
      AND array_to_string(conkey, ',') = (
          SELECT attnum::text 
          FROM pg_attribute 
          WHERE attrelid = 'public.settings'::regclass 
            AND attname = 'userId'
      );
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.settings DROP CONSTRAINT "' || constraint_name || '"';
        RAISE NOTICE 'Dropped unique constraint % on public.settings(userId)', constraint_name;
    END IF;
END $$;

-- Add the new unique constraint on ("userId", "workspaceId") if it does not exist yet
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'public.settings'::regclass 
          AND contype = 'u' 
          AND conname = 'settings_user_workspace_uniq'
    ) THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_user_workspace_uniq UNIQUE ("userId", "workspaceId");
        RAISE NOTICE 'Added unique constraint settings_user_workspace_uniq on public.settings("userId", "workspaceId")';
    END IF;
END $$;
