-- Änderungsprotokoll für Einträge und Abwesenheiten
-- Einmal im SQL Editor ausführen. Protokolliert ab diesem Zeitpunkt jede Erfassung,
-- Änderung und Löschung mit Person, Zeitpunkt sowie Werten vorher/nachher.

create table if not exists audit_log (
  id bigserial primary key,
  table_name text not null,
  row_id bigint not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  owner_id bigint,                 -- wessen Eintrag/Abwesenheit
  changed_by bigint,               -- wer geändert hat (null = System/SQL)
  changed_by_name text,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);
create index if not exists audit_log_changed_at on audit_log (changed_at desc);
create index if not exists audit_log_owner on audit_log (owner_id, changed_at desc);

-- Lesen nur für Admins; schreiben kann nur der Trigger, nicht die App
alter table audit_log enable row level security;
drop policy if exists audit_admin_read on audit_log;
create policy audit_admin_read on audit_log for select to authenticated using (is_admin());

create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_by bigint := app_user_id();
begin
  if tg_op = 'UPDATE' and v_old = v_new then return new; end if;
  insert into audit_log (table_name, row_id, action, owner_id, changed_by, changed_by_name, old_data, new_data)
  values (
    tg_table_name, (v_row->>'id')::bigint, tg_op,
    coalesce((v_row->>'employee_id')::bigint, (v_row->>'user_id')::bigint),
    v_by, coalesce((select name from users where id = v_by), 'System'),
    v_old, v_new
  );
  return coalesce(new, old);
end $$;
revoke all on function log_change() from public;

drop trigger if exists audit_entries on entries;
create trigger audit_entries after insert or update or delete on entries
  for each row execute function log_change();

drop trigger if exists audit_absences on absences;
create trigger audit_absences after insert or update or delete on absences
  for each row execute function log_change();
