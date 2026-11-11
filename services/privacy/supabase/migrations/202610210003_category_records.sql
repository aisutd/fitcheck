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
