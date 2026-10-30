-- Monatlicher Versand der Stundenabschlüsse
-- Erst ausführen, wenn die Function "monthly-report" deployt und die Secrets gesetzt sind.
-- HIER_DAS_CRON_SECRET unten durch denselben Wert wie das Secret CRON_SECRET ersetzen.

-- Protokoll der Versände: cutoff_at trennt, was in welchem Abschluss steht
create table if not exists monthly_report_runs (
  id bigserial primary key,
  period text not null unique,
  cutoff_at timestamptz not null,
  sent_at timestamptz not null default now(),
  recipient text not null,
  files int not null
);
alter table monthly_report_runs enable row level security;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 21:30 und 22:30 UTC: eine der beiden Zeiten ist immer 23:30 in Zürich (Sommer-/Winterzeit).
-- Die Function versendet nur am letzten Tag des Monats um 23 Uhr Zürcher Zeit.
select cron.schedule(
  'monatsabschluss-mail',
  '30 21,22 * * *',
  $$
  select net.http_post(
    url := 'https://pjwwzgklzerleftkvnag.supabase.co/functions/v1/monthly-report',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'HIER_DAS_CRON_SECRET'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
