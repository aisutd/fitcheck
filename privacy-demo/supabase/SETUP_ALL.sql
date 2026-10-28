-- Run this whole file once in Supabase SQL Editor. Safe to rerun.
begin;
create table if not exists public.privacy_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 closet_visibility text not null default 'Private'
   check (closet_visibility in ('Private', 'Friends Only', 'Public'))
);
alter table public.privacy_settings enable row level security;
grant select, insert, update, delete on public.privacy_settings to authenticated;
drop policy if exists "Fitcheck owner access" on public.privacy_settings;
create policy "Fitcheck owner access" on public.privacy_settings for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Fitcheck owner boundary" on public.privacy_settings;
create policy "Fitcheck owner boundary" on public.privacy_settings as restrictive for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;

-- 202610210001_privacy_preferences.sql
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


-- 202610210002_remaining_preferences.sql
begin;
alter table public.privacy_settings
  add column if not exists private_mirror boolean not null default true,
  add column if not exists blur_faces boolean not null default true,
  add column if not exists blur_background boolean not null default true,
  add column if not exists strip_location boolean not null default true,
  add column if not exists personalized_suggestions boolean not null default true,
  add column if not exists retailer_sharing boolean not null default false,
  add column if not exists saved_memory jsonb not null
    default '{"style":"","size":"","budget":""}'::jsonb
    check (
      jsonb_typeof(saved_memory) = 'object'
      and saved_memory ?& array['style', 'size', 'budget']
      and jsonb_typeof(saved_memory->'style') = 'string'
      and jsonb_typeof(saved_memory->'size') = 'string'
      and jsonb_typeof(saved_memory->'budget') = 'string'
      and length(saved_memory->>'style') <= 120
      and length(saved_memory->>'size') <= 20
      and length(saved_memory->>'budget') <= 20
      and case when saved_memory->>'budget' = '' then true
        when saved_memory->>'budget' ~ '^\d+(\.\d{1,2})?$'
          then (saved_memory->>'budget')::numeric > 0
        else false end
    );
commit;


-- 202610210003_category_records.sql
-- NULL means the standalone demo has not saved its sample records yet.
-- An object containing empty arrays means they were deleted; never reseed it.
alter table public.privacy_settings
  add column if not exists demo_records jsonb
  check (
    demo_records is null or (
      jsonb_typeof(demo_records) = 'object'
      and demo_records ?& array['closet', 'bodyPhotos', 'tryOns', 'chats', 'outfits']
      and jsonb_typeof(demo_records->'closet') = 'array'
      and jsonb_typeof(demo_records->'bodyPhotos') = 'array'
      and jsonb_typeof(demo_records->'tryOns') = 'array'
      and jsonb_typeof(demo_records->'chats') = 'array'
      and jsonb_typeof(demo_records->'outfits') = 'array'
    )
  );

