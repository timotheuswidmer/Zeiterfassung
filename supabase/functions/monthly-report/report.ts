import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";

export type Db = {
  users: any[];
  entries: any[];
  absences: any[];
  holidays: any[];
  pensum: any[];
};

export const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const monthKey = (y: number, m: number) => `${y}-${pad2(m + 1)}`;
const parseWD = (wd?: string | null) => (wd || "1,2,3,4,5").split(",").filter(Boolean).map(Number);
const dowOf = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).getUTCDay() || 7;
const isWeekdayHoliday = (h: any) => {
  const [y, m, d] = h.date.split("-").map(Number);
  return dowOf(y, m - 1, d) <= 5;
};
export const fmtTime = (min: number) => {
  const m = Math.round(min);
  return `${Math.floor(m / 60)}h ${pad2(m % 60)}m`;
};
const signed = (min: number) => `${min >= 0 ? "+" : "-"}${fmtTime(Math.abs(min))}`;
const capturedBy = (e: any, cutoff: string) => Date.parse(e.created_at) <= Date.parse(cutoff);
const fmtDate = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;

function zurichParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get("year"), month: get("month") - 1, day: get("day"), hour: get("hour"), minute: get("minute") };
}

// Der Zeitplan läuft in UTC zweimal, damit 23:30 auch über die Zeitumstellung stimmt
export function scheduledPeriod(now: Date) {
  const z = zurichParts(now);
  const lastDay = new Date(Date.UTC(z.year, z.month + 1, 0)).getUTCDate();
  return z.day === lastDay && z.hour === 23 ? { year: z.year, month: z.month } : null;
}

const pensumAt = (db: Db, user: any, month: number, year: number) => {
  const first = `${monthKey(year, month)}-01`;
  const h = db.pensum
    .filter((x) => x.user_id === user.id && x.valid_from <= first)
    .sort((a, b) => b.valid_from.localeCompare(a.valid_from))[0];
  return h ? { daily_hours: h.daily_hours, work_days: h.work_days } : { daily_hours: user.daily_hours, work_days: user.work_days };
};

// Gleiche Rechnung wie calcSollIst in der App; es zählen nur bis zum Stichtag erfasste Einträge
function sollIst(db: Db, user: any, month: number, year: number, cutoff: string) {
  if (user.employment_type !== "salaried") return null;
  const pm = pensumAt(db, user, month, year);
  const daily = parseFloat(pm.daily_hours);
  if (!daily) return null;
  const key = monthKey(year, month);
  const start: string = user.start_date || "";
  if (start && start.slice(0, 7) > key) return null;
  const wd = parseWD(pm.work_days);
  const firstDay = start.slice(0, 7) === key ? parseInt(start.slice(8, 10)) : 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let workDays = 0;
  for (let d = firstDay; d <= lastDay; d++) if (wd.includes(dowOf(year, month, d))) workDays++;
  const inRange = (date: string) => date.startsWith(key) && date >= start;
  const holidayDays = db.holidays.filter((h) => inRange(h.date) && isWeekdayHoliday(h)).length * (wd.length / 5);
  const abs = db.absences.filter((a) => a.user_id === user.id && inRange(a.date));
  const count = (t: string) => abs.filter((a) => a.type === t).length;
  const sollMin = Math.max(0, (workDays - holidayDays - count("unbezahlt")) * daily * 60);
  const entryMin = db.entries
    .filter((e) => e.employee_id === user.id && inRange(e.date) && capturedBy(e, cutoff))
    .reduce((s, e) => s + e.total_min, 0);
  const istMin = entryMin + (count("frei") + count("krank")) * daily * 60;
  return { sollMin, istMin, diff: istMin - sollMin };
}

function cumulativeSaldo(db: Db, user: any, month: number, year: number, cutoff: string) {
  let first: string | null = user.start_date || null;
  if (!first) {
    const dates = [
      ...db.entries.filter((e) => e.employee_id === user.id && capturedBy(e, cutoff)).map((e) => e.date),
      ...db.absences.filter((a) => a.user_id === user.id).map((a) => a.date),
    ];
    if (!dates.length) return 0;
    first = dates.reduce((a: string, b: string) => (a < b ? a : b));
  }
  let y = parseInt(first!.slice(0, 4)), m = parseInt(first!.slice(5, 7)) - 1, total = 0;
  while (y < year || (y === year && m <= month)) {
    const si = sollIst(db, user, m, y, cutoff);
    if (si) total += si.diff;
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return total;
}

function vacation(db: Db, user: any, year: number) {
  if (user.employment_type !== "salaried") return null;
  const ferien = db.absences.filter((a) => a.user_id === user.id && a.type === "frei");
  const dates = [
    ...db.entries.filter((e) => e.employee_id === user.id).map((e) => e.date),
    ...db.absences.filter((a) => a.user_id === user.id).map((a) => a.date),
  ];
  const startY = user.start_date ? parseInt(user.start_date.slice(0, 4))
    : dates.length ? Math.min(...dates.map((d) => parseInt(d.slice(0, 4)))) : year;
  const startM = user.start_date ? parseInt(user.start_date.slice(5, 7)) - 1 : 0;
  const startD = user.start_date ? parseInt(user.start_date.slice(8, 10)) : 1;
  const full = parseFloat(user.vacation_days_per_year ?? 25);
  const entitlementOf = (y: number) => {
    if (y < startY) return 0;
    let days = 0;
    for (let mo = y === startY ? startM : 0; mo < 12; mo++) {
      const pensum = parseWD(pensumAt(db, user, mo, y).work_days).length / 5;
      const dim = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
      const share = y === startY && mo === startM ? (dim - startD + 1) / dim : 1;
      days += (full * pensum / 12) * share;
    }
    return days;
  };
  let before = 0;
  for (let y = startY; y < year; y++) before += entitlementOf(y);
  const carryOver = before - ferien.filter((a) => a.date < `${year}-01-01`).length;
  const entitlement = entitlementOf(year);
  const used = ferien.filter((a) => a.date.startsWith(String(year))).length;
  return { carryOver, entitlement, used, remaining: carryOver + entitlement - used };
}

export type Report = ReturnType<typeof buildReports>[number];

// cutoff: Stichtag dieses Versands; prevCutoff: Stichtag des letzten Versands (für Nachträge)
export function buildReports(db: Db, year: number, month: number, cutoff: string, prevCutoff: string | null) {
  const key = monthKey(year, month);
  const monthStart = `${key}-01`;
  const reports = db.users.map((user) => {
    const mine = db.entries.filter((e) => e.employee_id === user.id && capturedBy(e, cutoff));
    const entries = mine.filter((e) => e.date.startsWith(key)).sort((a, b) => a.date.localeCompare(b.date));
    const late = prevCutoff
      ? mine.filter((e) => e.date < monthStart && !capturedBy(e, prevCutoff)).sort((a, b) => a.date.localeCompare(b.date))
      : [];
    const entryMin = entries.reduce((s, e) => s + e.total_min, 0);
    const lateMin = late.reduce((s, e) => s + e.total_min, 0);
    const si = sollIst(db, user, month, year, cutoff);
    const absences = db.absences
      .filter((a) => a.user_id === user.id && a.date.startsWith(key))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      user, name: user.name as string, entries, late, entryMin, lateMin, totalMin: entryMin + lateMin,
      // Nachträge zählen in diesem Abschluss; sie gehören beim Saldo zu ihrem Datum und sind dort schon enthalten
      soll: si ? si.sollMin : null,
      ist: si ? si.istMin + lateMin : null,
      diff: si ? si.diff + lateMin : null,
      saldo: si ? cumulativeSaldo(db, user, month, year, cutoff) : null,
      absences,
      vacation: si ? vacation(db, user, year) : null,
    };
  });
  return reports
    .filter((r) => r.entries.length || r.late.length || r.soll !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Standardschrift kennt nur WinAnsi; alles andere würde pdf-lib abstürzen lassen
const clean = (t: unknown) => String(t ?? "").replace(/−/g, "-").replace(/\s+/g, " ")
  .replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…€]/g, "?").trim();

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let line = "";
  const push = (word: string) => {
    let w = word;
    while (font.widthOfTextAtSize(w, size) > width && w.length > 1) {
      let n = w.length - 1;
      while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > width) n--;
      lines.push(w.slice(0, n));
      w = w.slice(n);
    }
    return w;
  };
  for (const word of clean(text).split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= width) line = test;
    else {
      if (line) lines.push(line);
      line = push(word);
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

const NAVY = rgb(0.12, 0.22, 0.39);
const GREY = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.82, 0.85, 0.9);
const ALT = rgb(0.93, 0.95, 0.98);
const W = 595.28, H = 841.89, M = 40;
const COLS = [{ t: "Datum", w: 60 }, { t: "Projekt", w: 125 }, { t: "Tätigkeit", w: 120 }, { t: "Zeit", w: 50 }, { t: "Bemerkung", w: W - 2 * M - 355 }];

export async function reportPdf(r: Report, year: number, month: number, cutoff: Date) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`Stundenabschluss ${MONTHS[month]} ${year} - ${clean(r.name)}`);
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const text = (t: string, x: number, size = 10, f = font, color = rgb(0.2, 0.2, 0.2)) =>
    page.drawText(clean(t), { x, y, size, font: f, color });
  const ensure = (h: number) => {
    if (y - h < M + 20) { page = doc.addPage([W, H]); y = H - M; return true; }
    return false;
  };

  text(`Stundenabschluss ${MONTHS[month]} ${year}`, M, 17, bold, NAVY); y -= 22;
  text(r.name, M, 13, bold); y -= 26;

  if (r.soll !== null) {
    const boxW = (W - 2 * M - 18) / 4;
    const kpis: [string, string][] = [["Soll", fmtTime(r.soll)], ["Ist", fmtTime(r.ist!)], ["+/- Monat", signed(r.diff!)], ["Saldo kumuliert", signed(r.saldo!)]];
    kpis.forEach(([label, val], i) => {
      const x = M + i * (boxW + 6);
      page.drawRectangle({ x, y: y - 28, width: boxW, height: 40, color: ALT });
      page.drawText(clean(label), { x: x + 8, y: y - 1, size: 8, font, color: GREY });
      page.drawText(clean(val), { x: x + 8, y: y - 18, size: 12, font: bold, color: NAVY });
    });
    y -= 46;
  }

  const table = (title: string, rows: any[], sum: number) => {
    ensure(50);
    text(title, M, 11, bold, NAVY); y -= 16;
    const header = () => {
      page.drawRectangle({ x: M, y: y - 5, width: W - 2 * M, height: 17, color: NAVY });
      let x = M;
      COLS.forEach((c) => { page.drawText(clean(c.t), { x: x + 4, y, size: 9, font: bold, color: rgb(1, 1, 1) }); x += c.w; });
      y -= 18;
    };
    header();
    if (!rows.length) { text("Keine Einträge", M + 4, 9, font, GREY); y -= 16; return; }
    rows.forEach((e, i) => {
      const cells = [fmtDate(e.date), e.project, e.activity, fmtTime(e.total_min), e.note || ""]
        .map((c, n) => wrap(c, font, 9, COLS[n].w - 8));
      const lines = Math.max(...cells.map((c) => c.length));
      const h = lines * 11 + 4;
      if (ensure(h)) header();
      if (i % 2 === 0) page.drawRectangle({ x: M, y: y - h + 9, width: W - 2 * M, height: h, color: ALT });
      let x = M;
      cells.forEach((c, n) => {
        c.forEach((l, li) => page.drawText(l, { x: x + 4, y: y - li * 11, size: 9, font, color: rgb(0.2, 0.2, 0.2) }));
        x += COLS[n].w;
      });
      y -= h;
    });
    ensure(20);
    y -= 3;
    page.drawLine({ start: { x: M, y: y + 10 }, end: { x: W - M, y: y + 10 }, color: LINE });
    text("Total", M + COLS[0].w + COLS[1].w + 4, 10, bold);
    text(fmtTime(sum), M + COLS[0].w + COLS[1].w + COLS[2].w + 4, 10, bold);
    y -= 22;
  };

  table("Einträge", r.entries, r.entryMin);
  if (r.late.length) table("Nachträge aus Vormonaten (nach dem letzten Abschluss erfasst)", r.late, r.lateMin);

  const labels: Record<string, string> = { frei: "Ferien", krank: "Krank", unbezahlt: "Unbezahlt" };
  if (r.absences.length || r.vacation) {
    ensure(40);
    text("Abwesenheiten", M, 11, bold, NAVY); y -= 15;
    for (const type of ["frei", "krank", "unbezahlt"]) {
      const days = r.absences.filter((a: any) => a.type === type);
      if (!days.length) continue;
      const lines = wrap(`${labels[type]} (${days.length}): ${days.map((a: any) => `${a.date.slice(8, 10)}.${a.date.slice(5, 7)}.`).join(", ")}`, font, 9, W - 2 * M);
      for (const l of lines) { ensure(12); text(l, M, 9); y -= 12; }
    }
    if (!r.absences.length) { text("Keine in diesem Monat", M, 9, font, GREY); y -= 12; }
    if (r.vacation) {
      const v = r.vacation;
      ensure(14);
      text(`Ferien ${year}: ${v.entitlement.toFixed(1)} Anspruch + ${v.carryOver.toFixed(1)} Übertrag - ${v.used} bezogen/geplant = ${v.remaining.toFixed(1)} Tage Rest`, M, 9, bold);
      y -= 14;
    }
    y -= 10;
  }

  ensure(50);
  y -= 30;
  page.drawLine({ start: { x: M, y }, end: { x: M + 220, y }, color: GREY });
  page.drawLine({ start: { x: W - M - 220, y }, end: { x: W - M, y }, color: GREY });
  y -= 12;
  text("Unterschrift Mitarbeiter/in", M, 8, font, GREY);
  text("Unterschrift Vorgesetzte/r", W - M - 220, 8, font, GREY);

  const z = zurichParts(cutoff);
  const stand = `Stand ${pad2(z.day)}.${pad2(z.month + 1)}.${z.year} ${pad2(z.hour)}:${pad2(z.minute)} - später Erfasstes erscheint im nächsten Abschluss`;
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(stand, { x: M, y: 24, size: 7.5, font, color: GREY });
    p.drawText(`Seite ${i + 1}/${pages.length}`, { x: W - M - 40, y: 24, size: 7.5, font, color: GREY });
  });
  return await doc.save();
}

// Speicherpfade erlauben keine Umlaute
export const fileName = (name: string, year: number, month: number) => {
  const ascii = clean(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_");
  return `${year}_${pad2(month + 1)}_Stundenabschluss_${ascii}.pdf`;
};
