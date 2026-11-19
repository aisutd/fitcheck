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
