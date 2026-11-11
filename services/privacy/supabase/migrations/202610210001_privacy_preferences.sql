-- Run in the Supabase SQL Editor. Existing owner-only RLS policies apply.
begin;
alter table public.privacy_settings
  add column if not exists photo_retention text not null default 'After processing'
    check (photo_retention in ('After processing', 'After 24 hours', 'Keep until I delete')),
  add column if not exists ai_training_consent boolean not null default false,
  add column if not exists ai_training_consent_updated_at timestamptz;
commit;

-- These store preferences. Photo deletion workers and AI-provider enforcement
-- must read them when those processing features are integrated.
