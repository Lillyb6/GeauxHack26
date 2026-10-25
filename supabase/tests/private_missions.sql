-- Execute as postgres in Supabase SQL Editor AFTER the migration.
-- All fixtures and changes are rolled back. No real account sign-in is needed.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-0000000000a1','rls-a@example.invalid'),
 ('00000000-0000-4000-8000-0000000000b2','rls-b@example.invalid');
insert into public.missions(id,user_id,document) values
 ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-0000000000a1','{"format":"beyond-earth-mission","format_version":1,"model_version":"0.6.0","name":"A","saved_at":"2026-10-25T00:00:00Z","configuration":{}}'),
 ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-0000000000b2','{"format":"beyond-earth-mission","format_version":1,"model_version":"0.6.0","name":"B","saved_at":"2026-10-25T00:00:00Z","configuration":{}}');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}',true);
set local role authenticated;
do $$
declare changed integer;
begin
 if (select count(*) from public.missions) <> 1 then raise exception 'FAIL: owner A can see another owner'; end if;
 update public.missions set updated_at=now() where id='00000000-0000-4000-8000-000000000022';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL: cross-owner update'; end if;
 delete from public.missions where id='00000000-0000-4000-8000-000000000022';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL: cross-owner delete'; end if;
 begin
  insert into public.missions(user_id,document) select '00000000-0000-4000-8000-0000000000b2',document from public.missions;
  raise exception 'FAIL: cross-owner insert';
 exception when insufficient_privilege then null; end;
 begin
  update public.missions set user_id='00000000-0000-4000-8000-0000000000b2';
  raise exception 'FAIL: owner reassignment';
 exception when insufficient_privilege then null; end;
 insert into public.missions(user_id,document) select user_id,document from public.missions limit 1;
 if (select count(*) from public.missions) <> 2 then raise exception 'FAIL: own insert rejected'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.missions)<>1 then raise exception 'FAIL: owner B isolation'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 begin
  perform count(*) from public.missions;
  raise exception 'FAIL: anonymous read';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: owner isolation, cross-owner writes and anonymous access checked; fixtures rolled back' as result;
