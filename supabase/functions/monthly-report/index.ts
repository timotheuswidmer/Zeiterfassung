import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { MONTHS, buildReports, fileName, reportPdf, scheduledPeriod } from "./report.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ error: "unauthorized" }, 401);

  const params = new URL(req.url).searchParams;
  const isTest = params.get("test") === "1";
  const now = new Date();
  let period = scheduledPeriod(now);
  const manual = params.get("period")?.match(/^(\d{4})-(\d{2})$/);
  if (manual) period = { year: Number(manual[1]), month: Number(manual[2]) - 1 };
  if (!period) return json({ skipped: "nicht letzter Tag des Monats um 23 Uhr" });

  const apiKey = Deno.env.get("MAILOMAT_API_KEY");
  const to = Deno.env.get("REPORT_TO");
  const fromEmail = Deno.env.get("REPORT_FROM");
  const appUrl = Deno.env.get("REPORT_APP_URL")?.replace(/\/+$/, "");
  if (!apiKey || !to || !fromEmail || !appUrl) return json({ error: "MAILOMAT_API_KEY, REPORT_TO, REPORT_FROM oder REPORT_APP_URL fehlt" }, 500);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const key = `${period.year}-${String(period.month + 1).padStart(2, "0")}`;

  const { data: runs, error: runsError } = await supabase
    .from("monthly_report_runs").select("period,cutoff_at").order("cutoff_at", { ascending: false });
  if (runsError) return json({ error: runsError.message }, 500);
  if (!isTest && runs!.some((r) => r.period === key)) return json({ skipped: `${key} wurde bereits versendet` });
  const prevCutoff = runs!.find((r) => r.period < key)?.cutoff_at ?? null;

  // PostgREST liefert pro Abfrage höchstens 1000 Zeilen
  const fetchAll = async (table: string, columns: string) => {
    const rows: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from(table).select(columns).order("id").range(offset, offset + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...data!);
      if (data!.length < 1000) return rows;
    }
  };

  try {
    const db = {
      users: await fetchAll("users", "id,name,employment_type,daily_hours,work_days,vacation_days_per_year,start_date"),
      entries: await fetchAll("entries", "id,date,employee_id,project,activity,total_min,note,created_at"),
      absences: await fetchAll("absences", "id,user_id,date,type"),
      holidays: await fetchAll("holidays", "id,date"),
      pensum: await fetchAll("pensum_history", "id,user_id,valid_from,daily_hours,work_days"),
    };
    const cutoff = now.toISOString();
    const reports = buildReports(db, period.year, period.month, cutoff, prevCutoff);
    const folder = isTest ? `test-${key}` : key;
    const files: string[] = [];
    for (const r of reports) {
      const name = fileName(r.name, period.year, period.month);
      const { error } = await supabase.storage.from("abschluesse").upload(`${folder}/${name}`, await reportPdf(r, period.year, period.month, now), { contentType: "application/pdf", upsert: true });
      if (error) throw new Error(`Speichern ${name}: ${error.message}`);
      files.push(name);
    }

    // Die Mail enthält bewusst keine Personendaten, nur den Link in den Adminbereich
    const label = `${MONTHS[period.month]} ${period.year}`;
    const link = `${appUrl}/?view=abschluss&period=${folder}`;
    const res = await fetch("https://api.mailomat.swiss/message", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { email: fromEmail, name: "Zeiterfassung" },
        to: to.split(",").map((email) => ({ email: email.trim() })),
        subject: `${isTest ? "[TEST] " : ""}Stundenabschlüsse ${label} sind bereit`,
        text: `Die Stundenabschlüsse ${label} (${files.length} Dateien) sind bereit.\n\nHerunterladen nach dem Admin-Login:\n${link}\n\nEinträge, die nach diesem Zeitpunkt erfasst werden, erscheinen im nächsten Abschluss als Nachtrag.`,
      }),
    });
    if (!res.ok) return json({ error: `mailomat: ${await res.text()}` }, 502);

    if (!isTest) {
      const { error } = await supabase.from("monthly_report_runs").insert({ period: key, cutoff_at: cutoff, recipient: to, files: files.length });
      if (error) return json({ error: `Mail versendet, Protokoll fehlgeschlagen: ${error.message}` }, 500);
    }
    return json({ sent: key, test: isTest, files });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
