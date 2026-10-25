-- Run once in your Supabase SQL editor or with the Supabase migration CLI.
begin;
create table public.missions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 document jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint mission_document_shape check (coalesce((
  jsonb_typeof(document) = 'object'
  and document->>'format' = 'beyond-earth-mission'
  and document->>'format_version' = '1'
  and jsonb_typeof(document->'configuration') = 'object'
  and length(trim(document->>'name')) between 1 and 80
  and octet_length(document::text) <= 65536
  and document ?& array['format','format_version','model_version','name','saved_at','configuration']
 ), false))
);
create index missions_owner_updated_idx on public.missions(user_id, updated_at desc);
alter table public.missions enable row level security;
revoke all on public.missions from anon, authenticated;
grant select, insert, update, delete on public.missions to authenticated;
create policy "Read own missions" on public.missions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own missions" on public.missions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own missions" on public.missions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own missions" on public.missions for delete to authenticated using ((select auth.uid()) = user_id);
commit;
