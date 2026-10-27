-- ═══════════════════════════════════════════════════════════════════════════
-- Umstellung auf Supabase Auth
-- Reihenfolge: Teil 1 → neue App deployen → Teil 2 → (wenn alle umgestellt) Teil 3
-- Vorher im Dashboard: Authentication → Sign In / Providers → Email →
--   "Confirm email" AUS, "Allow new users to sign up" bleibt AN.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── TEIL 1: Verknüpfung + Funktionen (vor dem Deploy) ──────────────────────

alter table users add column if not exists auth_id uuid unique references auth.users(id) on delete set null;
-- Klartext-Passwort wird nach der Umstellung gelöscht, neue Benutzer haben keins
alter table users alter column password drop not null;

-- Eigene users.id / Admin-Prüfung für die eingeloggte Person
create or replace function app_user_id() returns bigint
language sql stable security definer set search_path = public as $$
  select id from users where auth_id = auth.uid()
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from users where auth_id = auth.uid()), false)
$$;

-- Login: Auth-E-Mail zu einem Benutzernamen (Benutzername bleibt das Login)
create or replace function login_email(p_username text) returns text
language sql stable security definer set search_path = public, auth as $$
  select au.email from users u join auth.users au on au.id = u.auth_id
  where u.username = lower(p_username)
$$;

-- Erstanmeldung: altes Passwort prüfen (nur für noch nicht umgestellte Konten)
create or replace function legacy_check(p_username text, p_password text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from users
    where username = lower(p_username) and auth_id is null
      and password is not null and password = p_password)
$$;

-- Erstanmeldung: neues Auth-Konto verknüpfen und Klartext-Passwort löschen
create or replace function link_auth(p_username text, p_password text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update users set auth_id = auth.uid(), password = null
  where username = lower(p_username) and auth_id is null
    and password is not null and password = p_password;
  return found;
end $$;

-- Admin setzt das Passwort einer anderen Person
create or replace function admin_set_password(p_user_id bigint, p_password text) returns void
language plpgsql security definer set search_path = public, extensions, auth as $$
declare v_auth uuid;
begin
  if not is_admin() then raise exception 'Nur für Admins'; end if;
  if length(p_password) < 6 then raise exception 'Passwort muss mindestens 6 Zeichen haben'; end if;
  select auth_id into v_auth from users where id = p_user_id;
  if v_auth is null then
    update users set password = p_password where id = p_user_id;  -- noch nicht umgestellt
  else
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
    where id = v_auth;
  end if;
end $$;

revoke all on function app_user_id(), is_admin(), login_email(text), legacy_check(text, text),
  link_auth(text, text), admin_set_password(bigint, text) from public;
grant execute on function login_email(text), legacy_check(text, text) to anon, authenticated;
grant execute on function app_user_id(), is_admin(), link_auth(text, text),
  admin_set_password(bigint, text) to authenticated;


-- ─── TEIL 2: Zugriffsregeln (direkt nach dem Deploy) ────────────────────────
-- Ohne Login ist danach kein Zugriff mehr möglich.

alter table users          enable row level security;
alter table entries        enable row level security;
alter table absences       enable row level security;
alter table timers         enable row level security;
alter table projects       enable row level security;
alter table activities     enable row level security;
alter table products       enable row level security;
alter table holidays       enable row level security;
alter table pensum_history enable row level security;

-- Lesen: alle eingeloggten Mitarbeitenden (kleines Team, Auswertungen brauchen das)
create policy read_users          on users          for select to authenticated using (app_user_id() is not null);
create policy read_entries        on entries        for select to authenticated using (app_user_id() is not null);
create policy read_absences       on absences       for select to authenticated using (app_user_id() is not null);
create policy read_projects       on projects       for select to authenticated using (app_user_id() is not null);
create policy read_activities     on activities     for select to authenticated using (app_user_id() is not null);
create policy read_products       on products       for select to authenticated using (app_user_id() is not null);
create policy read_holidays       on holidays       for select to authenticated using (app_user_id() is not null);
create policy read_pensum_history on pensum_history for select to authenticated using (app_user_id() is not null);

-- Schreiben: eigene Einträge/Abwesenheiten, Admin alles
create policy write_entries on entries for all to authenticated
  using (employee_id = app_user_id() or is_admin()) with check (employee_id = app_user_id() or is_admin());
create policy write_absences on absences for all to authenticated
  using (user_id = app_user_id() or is_admin()) with check (user_id = app_user_id() or is_admin());
create policy own_timers on timers for all to authenticated
  using (user_id = app_user_id()) with check (user_id = app_user_id());

-- Stammdaten: nur Admin
create policy admin_users          on users          for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_projects       on projects       for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_activities     on activities     for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_products       on products       for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_holidays       on holidays       for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_pensum_history on pensum_history for all to authenticated using (is_admin()) with check (is_admin());


-- ─── TEIL 3: Aufräumen (erst wenn alle umgestellt sind) ─────────────────────
-- Prüfen:  select name from users where auth_id is null;   → muss leer sein
--
-- drop function legacy_check(text, text);
-- drop function link_auth(text, text);
-- alter table users drop column password;
