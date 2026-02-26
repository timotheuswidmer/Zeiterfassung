import { useState, useEffect, useMemo, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Trage hier deine Supabase-Zugangsdaten ein (Anleitung im README.md)
const SUPABASE_URL = "https://pjwwzgklzerleftkvnag.supabase.co";        // z.B. https://abcxyz.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd3d6Z2tsemVybGVmdGt2bmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTU1MDksImV4cCI6MjA4NzY5MTUwOX0.1WnJd5-JJk4keOUk_VEV-WXiGgyNU1MHEZjxkaLkb54"; // langer JWT-Token

// ─── Supabase API (kein npm-Paket nötig) ─────────────────────────────────────
const sbHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
});

const sb = {
  async select(table, query = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: sbHeaders() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: { ...sbHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(table, id, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: { ...sbHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async remove(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE", headers: sbHeaders(),
    });
    if (!r.ok) throw new Error(await r.text());
  },
};

// ─── Konstanten ───────────────────────────────────────────────────────────────
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { background: #0a0c13; color: #e0e4f8; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #12141e; } ::-webkit-scrollbar-thumb { background: #2e3150; border-radius: 3px; }
  input, select, textarea, button { font-family: 'DM Sans', sans-serif; outline: none; }
  .nav-btn { background: none; border: none; cursor: pointer; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #7880a8; transition: all .18s; white-space: nowrap; }
  .nav-btn:hover { background: #1a1e2e; color: #e0e4f8; } .nav-btn.active { background: #4f5de8; color: #fff; }
  .card { background: rgba(19,22,32,0.8); border: 1px solid #1e2235; border-radius: 16px; padding: 24px; }
  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .label { font-size: 11px; font-weight: 700; color: #5a6090; letter-spacing: .07em; text-transform: uppercase; }
  .input { background: #0a0c13; border: 1.5px solid #1e2235; border-radius: 10px; padding: 11px 14px; font-size: 15px; color: #e0e4f8; transition: border .18s; width: 100%; -webkit-appearance: none; }
  .input:focus { border-color: #4f5de8; }
  select.input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235a6090' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; cursor: pointer; }
  select.input option { background: #131620; } textarea.input { resize: vertical; min-height: 70px; }
  .btn { border: none; border-radius: 10px; padding: 11px 22px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: #4f5de8; color: #fff; }
  .btn-primary:hover { background: #6472f5; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(79,93,232,0.3); }
  .btn-primary:active { transform: translateY(0); } .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .btn-ghost { background: #1a1e2e; color: #7880a8; } .btn-ghost:hover { background: #222640; color: #e0e4f8; }
  .btn-full { width: 100%; justify-content: center; padding: 13px; }
  .btn-excel { background: rgba(29,168,106,0.15); color: #4dffaa; border: 1px solid rgba(29,168,106,0.35); font-size: 13px; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; transition: all .18s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-excel:hover { background: rgba(29,168,106,0.28); transform: translateY(-1px); }
  .btn-danger { background: rgba(232,79,106,0.12); color: #ff6b85; border: 1px solid rgba(232,79,106,0.25); font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; transition: all .18s; }
  .btn-danger:hover { background: rgba(232,79,106,0.25); }
  .btn-warn { background: rgba(232,162,79,0.12); color: #ffc97a; border: 1px solid rgba(232,162,79,0.25); font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; transition: all .18s; }
  .btn-warn:hover { background: rgba(232,162,79,0.25); }
  .tag { display: inline-flex; align-items: center; gap: 6px; background: #1a1e2e; border: 1px solid #2a2e48; border-radius: 20px; padding: 5px 12px; font-size: 13px; }
  .tag-remove { background: none; border: none; cursor: pointer; color: #e84f6a; font-size: 18px; line-height: 1; padding: 0 1px; }
  .msg-success { background: #0d2e1e; border: 1px solid #1a5c38; color: #4dffaa; border-radius: 10px; padding: 10px 16px; font-size: 13px; }
  .msg-error { background: #2e0d14; border: 1px solid #6b1a2d; color: #ff8099; border-radius: 10px; padding: 10px 16px; font-size: 13px; }
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #5a6090; border-bottom: 1px solid #1e2235; white-space: nowrap; }
  td { padding: 11px 14px; border-bottom: 1px solid rgba(19,22,32,0.6); vertical-align: middle; }
  tr:last-child td { border-bottom: none; } tbody tr:hover td { background: rgba(26,30,46,0.5); }
  .bar-bg { background: #1e2235; border-radius: 4px; height: 7px; flex: 1; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg,#4f5de8,#7c8bff); transition: width .8s cubic-bezier(.4,0,.2,1); }
  .bar-fill-green { background: linear-gradient(90deg,#1da86a,#4dffaa); }
  .stat-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(30,34,53,0.5); }
  .stat-row:last-child { border-bottom: none; }
  .chip { display: inline-block; background: #1a1e2e; border: 1px solid #2a2e48; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 500; font-family: 'DM Mono', monospace; }
  .chip-blue { background: #141a38; border-color: #2a3580; color: #7c8bff; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .section-title { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #5a6090; margin-bottom: 18px; }
  .big-num { font-family: 'DM Mono', monospace; font-size: 26px; font-weight: 500; color: #e0e4f8; line-height: 1.2; }
  .summary-box { background: rgba(10,12,19,0.6); border: 1px solid #1e2235; border-radius: 12px; padding: 16px 18px; }
  .badge-admin { background: #1a1438; border: 1px solid #5a4af0; color: #a89aff; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 700; display: inline-block; }
  .badge-emp { background: #0d2e1e; border: 1px solid #1a5c38; color: #4dffaa; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 700; display: inline-block; }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: radial-gradient(ellipse at 30% 20%, rgba(26,29,64,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(13,46,30,0.3) 0%, transparent 60%), #0a0c13; }
  .login-card { background: rgba(19,22,32,0.95); border: 1px solid #1e2235; border-radius: 24px; padding: 36px; width: 100%; max-width: 400px; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }
  .user-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #1e2235; border-radius: 12px; margin-bottom: 8px; gap: 8px; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#4f5de8,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .abschluss-card { background: rgba(19,22,32,0.8); border: 1px solid #1e2235; border-radius: 14px; padding: 20px; margin-bottom: 14px; }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
  .modal { background: #131620; border: 1px solid #2a2e48; border-radius: 20px; padding: 28px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
  .pw-hint { font-size: 11px; color: #5a6090; margin-top: 4px; }
  .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0a0c13; flex-direction: column; gap: 16px; }
  .spinner { width: 32px; height: 32px; border: 3px solid #1e2235; border-top-color: #4f5de8; border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .config-code { background: #0a0c13; border: 1px solid #1e2235; border-radius: 12px; padding: 18px; font-size: 12px; font-family: 'DM Mono', monospace; color: #7880a8; line-height: 2; margin: 16px 0; }
  .mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(13,15,22,0.97); border-top: 1px solid #1e2235; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); z-index: 100; gap: 4px; justify-content: space-around; }
  .mobile-nav-btn { flex: 1; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 4px; border-radius: 10px; color: #5a6090; font-size: 10px; font-family: 'DM Sans', sans-serif; font-weight: 600; transition: all .18s; }
  .mobile-nav-btn.active { color: #7c8bff; background: rgba(79,93,232,0.12); }
  .mobile-nav-btn .icon { font-size: 20px; line-height: 1; }
  @media (max-width: 680px) {
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .hide-mobile { display: none !important; }
    .main-content { padding-bottom: 90px !important; }
    .mobile-nav { display: flex; }
    .desktop-nav { display: none !important; }
    .header-name { display: none !important; }
    .card { padding: 16px; } .login-card { padding: 24px; } .modal { padding: 20px; }
  }
  @media (min-width: 681px) { .mobile-nav { display: none !important; } }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (min) => `${Math.floor(min/60)}h ${(min%60).toString().padStart(2,"0")}m`;
const fmtDecimal = (min) => (min/60).toFixed(2);
const todayStr = () => new Date().toISOString().split("T")[0];
const initials = (name) => name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const years = Array.from({length:4},(_,i)=>new Date().getFullYear()-1+i);

// ─── Excel Export ─────────────────────────────────────────────────────────────
function loadSheetJS() {
  return new Promise((resolve,reject)=>{
    if(window.XLSX){resolve(window.XLSX);return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload=()=>resolve(window.XLSX); s.onerror=reject;
    document.head.appendChild(s);
  });
}
async function exportAuswertungExcel({filteredEntries,projectStats,activityStats,filterMonth,filterYear,isAdmin}){
  const XLSX=await loadSheetJS();
  const wb=XLSX.utils.book_new();
  const label=`${MONTHS[filterMonth]} ${filterYear}`;
  const total=filteredEntries.reduce((s,e)=>s+e.total_min,0);
  const cols=isAdmin?["Datum","Mitarbeiter","Projekt","Tätigkeit","Stunden","Minuten","Std (Dez.)","Bemerkung"]:["Datum","Projekt","Tätigkeit","Stunden","Minuten","Std (Dez.)","Bemerkung"];
  const rows=filteredEntries.map(e=>isAdmin?[e.date,e.employee_name,e.project,e.activity,Math.floor(e.total_min/60),e.total_min%60,fmtDecimal(e.total_min),e.note||""]:[e.date,e.project,e.activity,Math.floor(e.total_min/60),e.total_min%60,fmtDecimal(e.total_min),e.note||""]);
  const totalRow=isAdmin?["","","","TOTAL",Math.floor(total/60),total%60,fmtDecimal(total),""]  :["","","TOTAL",Math.floor(total/60),total%60,fmtDecimal(total),""];
  const ws1=XLSX.utils.aoa_to_sheet([cols,...rows,[],totalRow]);
  ws1["!cols"]=isAdmin?[{wch:12},{wch:18},{wch:22},{wch:18},{wch:9},{wch:9},{wch:12},{wch:30}]:[{wch:12},{wch:22},{wch:18},{wch:9},{wch:9},{wch:12},{wch:30}];
  XLSX.utils.book_append_sheet(wb,ws1,"Einträge");
  const mkStatSheet=(data,name)=>{
    const ws=XLSX.utils.aoa_to_sheet([[name,"Stunden","Minuten","Std (Dez.)","Anteil %"],...data.map(([n,m])=>[n,Math.floor(m/60),m%60,fmtDecimal(m),total>0?((m/total)*100).toFixed(1)+"%":"0%"]),[]  ,["TOTAL",Math.floor(total/60),total%60,fmtDecimal(total),"100%"]]);
    ws["!cols"]=[{wch:24},{wch:10},{wch:10},{wch:12},{wch:10}];
    return ws;
  };
  XLSX.utils.book_append_sheet(wb,mkStatSheet(projectStats,"Projekt"),"Nach Projekt");
  XLSX.utils.book_append_sheet(wb,mkStatSheet(activityStats,"Tätigkeit"),"Nach Tätigkeit");
  XLSX.writeFile(wb,`Zeiterfassung_Auswertung_${label.replace(" ","_")}.xlsx`);
}
async function exportAbschlussExcel({abschlussPerEmp,abschlussMonth,abschlussYear}){
  const XLSX=await loadSheetJS();
  const wb=XLSX.utils.book_new();
  const label=`${MONTHS[abschlussMonth]} ${abschlussYear}`;
  const totalAll=abschlussPerEmp.reduce((s,e)=>s+e.totalMin,0);
  const sumWs=XLSX.utils.aoa_to_sheet([[`Monatsabschluss — ${label}`],[],["Mitarbeiter","Einträge","Stunden","Minuten","Std (Dez.)"],...abschlussPerEmp.map(({name,totalMin,entries})=>[name,entries.length,Math.floor(totalMin/60),totalMin%60,fmtDecimal(totalMin)]),[]  ,["TOTAL",abschlussPerEmp.reduce((s,e)=>s+e.entries.length,0),Math.floor(totalAll/60),totalAll%60,fmtDecimal(totalAll)]]);
  sumWs["!cols"]=[{wch:22},{wch:10},{wch:10},{wch:10},{wch:12}]; sumWs["!merges"]=[{s:{r:0,c:0},e:{r:0,c:4}}];
  XLSX.utils.book_append_sheet(wb,sumWs,"Zusammenfassung");
  abschlussPerEmp.forEach(({name,totalMin,entries:empE})=>{
    const ws=XLSX.utils.aoa_to_sheet([[`${name} — ${label}`],[],["Datum","Projekt","Tätigkeit","Stunden","Minuten","Std (Dez.)","Bemerkung"],...empE.map(e=>[e.date,e.project,e.activity,Math.floor(e.total_min/60),e.total_min%60,fmtDecimal(e.total_min),e.note||""]),[]  ,["","","TOTAL",Math.floor(totalMin/60),totalMin%60,fmtDecimal(totalMin),""]]);
    ws["!cols"]=[{wch:12},{wch:22},{wch:18},{wch:9},{wch:9},{wch:12},{wch:30}]; ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:6}}];
    XLSX.utils.book_append_sheet(wb,ws,name.split(" ")[0].slice(0,28));
  });
  XLSX.writeFile(wb,`Zeiterfassung_Monatsabschluss_${label.replace(" ","_")}.xlsx`);
}

// ─── Screens ──────────────────────────────────────────────────────────────────
function ConfigScreen(){
  return(
    <div className="login-wrap">
      <div className="login-card">
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:54,height:54,background:"linear-gradient(135deg,#e84f6a,#f06050)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>⚙️</div>
          <div style={{fontSize:20,fontWeight:700}}>Supabase nicht konfiguriert</div>
          <div style={{color:"#5a6090",fontSize:13,marginTop:8,lineHeight:1.7}}>
            Öffne <code style={{background:"#1a1e2e",padding:"1px 6px",borderRadius:4,color:"#7c8bff"}}>src/App.jsx</code> und trage deine Zugangsdaten in Zeile 8–9 ein.
          </div>
        </div>
        <div className="config-code">
          <div style={{color:"#5a6090",fontSize:11,marginBottom:4}}>// Zeilen 8–9 in App.jsx anpassen:</div>
          <div><span style={{color:"#4dffaa"}}>SUPABASE_URL</span> = <span style={{color:"#ffc97a"}}>"https://xxx.supabase.co"</span></div>
          <div><span style={{color:"#4dffaa"}}>SUPABASE_ANON_KEY</span> = <span style={{color:"#ffc97a"}}>"eyJ..."</span></div>
        </div>
        <div style={{fontSize:12,color:"#5a6090",textAlign:"center"}}>Schritt-für-Schritt Anleitung: <strong style={{color:"#e0e4f8"}}>README.md</strong></div>
      </div>
    </div>
  );
}

function LoginScreen({onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const attempt=async()=>{
    if(!username.trim()||!password){setErr("Bitte alle Felder ausfüllen.");return;}
    setLoading(true); setErr("");
    try{
      const users=await sb.select("users",`?username=eq.${encodeURIComponent(username.trim().toLowerCase())}&select=*`);
      if(!users.length||users[0].password!==password){setErr("Benutzername oder Passwort falsch.");return;}
      onLogin(users[0]);
    }catch(e){setErr("Verbindungsfehler. Bitte Supabase-Konfiguration prüfen.");}
    finally{setLoading(false);}
  };
  return(
    <div className="login-wrap">
      <div className="login-card">
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:54,height:54,background:"linear-gradient(135deg,#4f5de8,#8b5cf6)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>⏱</div>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.02em"}}>Zeiterfassung</div>
          <div style={{color:"#5a6090",fontSize:13,marginTop:5}}>Melde dich mit deinen Zugangsdaten an</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="field-group">
            <label className="label">Benutzername</label>
            <input className="input" value={username} onChange={e=>{setUsername(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="z.B. anna" autoFocus autoCapitalize="none" autoCorrect="off"/>
          </div>
          <div className="field-group">
            <label className="label">Passwort</label>
            <input className="input" type="password" value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="••••••••"/>
          </div>
          {err&&<div className="msg-error">{err}</div>}
          <button className="btn btn-primary btn-full" style={{marginTop:4}} onClick={attempt} disabled={loading}>{loading?"Anmelden…":"Anmelden →"}</button>
        </div>
      </div>
    </div>
  );
}

function UserModal({existing,onSave,onClose}){
  const [form,setForm]=useState(existing?{...existing,password:""}:{name:"",username:"",password:"",role:"employee"});
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));
  const save=async()=>{
    if(!form.name.trim()||!form.username.trim()){setErr("Name und Benutzername sind Pflicht.");return;}
    if(!existing&&!form.password.trim()){setErr("Passwort ist Pflicht.");return;}
    setSaving(true);
    try{ await onSave({...form,name:form.name.trim(),username:form.username.trim().toLowerCase(),password:form.password.trim()||existing?.password}); }
    catch(e){setErr("Fehler: "+e.message);}
    finally{setSaving(false);}
  };
  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontSize:17,fontWeight:700,marginBottom:20}}>{existing?"Benutzer bearbeiten":"Neuer Benutzer"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="field-group"><label className="label">Vollständiger Name *</label><input className="input" value={form.name} onChange={e=>f("name")(e.target.value)} autoFocus/></div>
          <div className="grid-2">
            <div className="field-group"><label className="label">Benutzername *</label><input className="input" value={form.username} onChange={e=>f("username")(e.target.value)} autoCapitalize="none"/></div>
            <div className="field-group"><label className="label">Rolle</label><select className="input" value={form.role} onChange={e=>f("role")(e.target.value)}><option value="employee">Mitarbeiter</option><option value="admin">Admin</option></select></div>
          </div>
          <div className="field-group">
            <label className="label">Passwort {existing?"(leer = unverändert)":"*"}</label>
            <input className="input" type="text" value={form.password} onChange={e=>f("password")(e.target.value)} placeholder={existing?"Neues Passwort…":"Passwort vergeben"}/>
            {existing&&<div className="pw-hint">Leer lassen, um das bestehende Passwort zu behalten.</div>}
          </div>
          {err&&<div className="msg-error">{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Speichern…":"Speichern"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hauptapp ─────────────────────────────────────────────────────────────────
export default function App(){
  const isConfigured = SUPABASE_URL !== "DEINE_SUPABASE_URL" && SUPABASE_ANON_KEY !== "DEIN_SUPABASE_ANON_KEY";

  const [currentUser,setCurrentUser]=useState(()=>{
    try{const s=sessionStorage.getItem("ze_session");return s?JSON.parse(s):null;}catch{return null;}
  });
  const [view,setView]=useState("eintragen");
  const [users,setUsers]=useState([]);
  const [entries,setEntries]=useState([]);
  const [projects,setProjects]=useState([]);
  const [activities,setActivities]=useState([]);
  const [dataReady,setDataReady]=useState(false);
  const isAdmin=currentUser?.role==="admin";

  const [form,setForm]=useState({date:todayStr(),project:"",activity:"",hours:"",minutes:"",note:""});
  const [formMsg,setFormMsg]=useState(null);
  const [saving,setSaving]=useState(false);
  const [newProject,setNewProject]=useState("");
  const [newActivity,setNewActivity]=useState("");
  const [filterMonth,setFilterMonth]=useState(new Date().getMonth());
  const [filterYear,setFilterYear]=useState(new Date().getFullYear());
  const [filterProject,setFilterProject]=useState("alle");
  const [filterActivity,setFilterActivity]=useState("alle");
  const [filterEmployee,setFilterEmployee]=useState("alle");
  const [abschlussMonth,setAbschlussMonth]=useState(new Date().getMonth());
  const [abschlussYear,setAbschlussYear]=useState(new Date().getFullYear());
  const [userModal,setUserModal]=useState(null);

  const loadData=useCallback(async()=>{
    if(!isConfigured||!currentUser)return;
    try{
      const [u,e,p,a]=await Promise.all([
        sb.select("users","?select=id,name,username,role,password&order=name"),
        sb.select("entries","?select=*&order=date.desc,id.desc"),
        sb.select("projects","?select=*&order=name"),
        sb.select("activities","?select=*&order=name"),
      ]);
      setUsers(u); setEntries(e);
      setProjects(p.map(r=>r.name));
      setActivities(a.map(r=>r.name));
    }catch(err){console.error("Ladefehler:",err);}
    finally{setDataReady(true);}
  },[currentUser,isConfigured]);

  useEffect(()=>{if(currentUser&&isConfigured)loadData();},[loadData]);

  const login=(u)=>{setCurrentUser(u);try{sessionStorage.setItem("ze_session",JSON.stringify(u));}catch{}setView("eintragen");};
  const logout=()=>{setCurrentUser(null);setDataReady(false);try{sessionStorage.removeItem("ze_session");}catch{}};

  const submitEntry=async()=>{
    if(!form.project||!form.activity||(!form.hours&&!form.minutes)){setFormMsg({type:"error",text:"Bitte Projekt, Tätigkeit und Zeit ausfüllen."});return;}
    const totalMin=(parseInt(form.hours||0)*60)+parseInt(form.minutes||0);
    if(totalMin<=0){setFormMsg({type:"error",text:"Zeit muss grösser als 0 sein."});return;}
    setSaving(true);
    try{
      const created=await sb.insert("entries",{date:form.date,employee_id:currentUser.id,employee_name:currentUser.name,project:form.project,activity:form.activity,total_min:totalMin,note:form.note||null});
      setEntries(prev=>[created[0],...prev]);
      setForm(p=>({...p,project:"",activity:"",hours:"",minutes:"",note:""}));
      setFormMsg({type:"success",text:"✓ Eintrag gespeichert!"});
      setTimeout(()=>setFormMsg(null),2500);
    }catch(e){setFormMsg({type:"error",text:"Fehler: "+e.message});}
    finally{setSaving(false);}
  };

  const deleteEntry=async(id)=>{
    if(!window.confirm("Eintrag löschen?"))return;
    try{await sb.remove("entries",id);setEntries(prev=>prev.filter(e=>e.id!==id));}
    catch(e){alert("Fehler: "+e.message);}
  };

  const addProject=async()=>{
    if(!newProject.trim())return;
    try{await sb.insert("projects",{name:newProject.trim()});setProjects(prev=>[...prev,newProject.trim()].sort());setNewProject("");}
    catch(e){alert("Fehler: "+e.message);}
  };
  const removeProject=async(name)=>{
    try{const r=await sb.select("projects",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.remove("projects",r[0].id);setProjects(prev=>prev.filter(p=>p!==name));}
    catch(e){alert("Fehler: "+e.message);}
  };
  const addActivity=async()=>{
    if(!newActivity.trim())return;
    try{await sb.insert("activities",{name:newActivity.trim()});setActivities(prev=>[...prev,newActivity.trim()].sort());setNewActivity("");}
    catch(e){alert("Fehler: "+e.message);}
  };
  const removeActivity=async(name)=>{
    try{const r=await sb.select("activities",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.remove("activities",r[0].id);setActivities(prev=>prev.filter(a=>a!==name));}
    catch(e){alert("Fehler: "+e.message);}
  };

  const saveUser=async(data)=>{
    if(userModal&&userModal!=="new"){
      const updated=await sb.update("users",userModal.id,{name:data.name,username:data.username,role:data.role,password:data.password||userModal.password});
      setUsers(prev=>prev.map(u=>u.id===userModal.id?updated[0]:u));
      if(currentUser.id===userModal.id){const f=updated[0];setCurrentUser(f);try{sessionStorage.setItem("ze_session",JSON.stringify(f));}catch{}}
    }else{const c=await sb.insert("users",data);setUsers(prev=>[...prev,c[0]]);}
    setUserModal(null);
  };
  const deleteUser=async(id)=>{
    if(id===currentUser.id||!window.confirm("Benutzer löschen?"))return;
    try{await sb.remove("users",id);setUsers(prev=>prev.filter(u=>u.id!==id));}
    catch(e){alert("Fehler: "+e.message);}
  };

  const myEntries=useMemo(()=>entries.filter(e=>e.employee_id===currentUser?.id),[entries,currentUser]);
  const filteredEntries=useMemo(()=>{
    const base=isAdmin?entries:myEntries;
    return base.filter(e=>{
      const d=new Date(e.date);
      return d.getMonth()===filterMonth&&d.getFullYear()===filterYear
        &&(filterProject==="alle"||e.project===filterProject)
        &&(filterActivity==="alle"||e.activity===filterActivity)
        &&(!isAdmin||filterEmployee==="alle"||e.employee_name===filterEmployee);
    });
  },[entries,myEntries,isAdmin,filterMonth,filterYear,filterProject,filterActivity,filterEmployee]);

  const projectStats=useMemo(()=>{const m={};filteredEntries.forEach(e=>{if(!m[e.project])m[e.project]=0;m[e.project]+=e.total_min;});return Object.entries(m).sort((a,b)=>b[1]-a[1]);},[filteredEntries]);
  const activityStats=useMemo(()=>{const m={};filteredEntries.forEach(e=>{if(!m[e.activity])m[e.activity]=0;m[e.activity]+=e.total_min;});return Object.entries(m).sort((a,b)=>b[1]-a[1]);},[filteredEntries]);
  const abschlussEntries=useMemo(()=>entries.filter(e=>{const d=new Date(e.date);return d.getMonth()===abschlussMonth&&d.getFullYear()===abschlussYear;}),[entries,abschlussMonth,abschlussYear]);
  const abschlussPerEmp=useMemo(()=>{const map={};abschlussEntries.forEach(e=>{if(!map[e.employee_id])map[e.employee_id]={name:e.employee_name,totalMin:0,entries:[]};map[e.employee_id].totalMin+=e.total_min;map[e.employee_id].entries.push(e);});return Object.values(map).sort((a,b)=>b.totalMin-a.totalMin);},[abschlussEntries]);

  const totalFiltered=filteredEntries.reduce((s,e)=>s+e.total_min,0);
  const maxStat=Math.max(...projectStats.map(s=>s[1]),1);
  const maxAct=Math.max(...activityStats.map(s=>s[1]),1);

  const navItems=[
    {id:"eintragen",icon:"⏱",label:"Eintragen"},
    {id:"auswertung",icon:"📊",label:"Auswertung"},
    ...(isAdmin?[{id:"abschluss",icon:"📋",label:"Abschluss"},{id:"verwaltung",icon:"⚙️",label:"Verwaltung"}]:[]),
  ];

  if(!isConfigured) return <><style>{CSS}</style><ConfigScreen/></>;
  if(!currentUser)  return <><style>{CSS}</style><LoginScreen onLogin={login}/></>;
  if(!dataReady)    return <div className="loading"><style>{CSS}</style><div className="spinner"/><div style={{color:"#5a6090",fontSize:13}}>Daten werden geladen…</div></div>;

  return(
    <div style={{minHeight:"100vh",background:"#0a0c13",color:"#e0e4f8"}}>
      <style>{CSS}</style>
      {userModal&&<UserModal existing={userModal==="new"?null:userModal} onSave={saveUser} onClose={()=>setUserModal(null)}/>}

      {/* Header */}
      <header style={{borderBottom:"1px solid #1e2235",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,gap:8,position:"sticky",top:0,background:"rgba(10,12,19,0.97)",backdropFilter:"blur(10px)",zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#4f5de8,#8b5cf6)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⏱</div>
          <span style={{fontWeight:700,fontSize:15}}>Zeiterfassung</span>
        </div>
        <nav className="desktop-nav" style={{display:"flex",gap:2,overflow:"auto"}}>
          {navItems.map(n=><button key={n.id} className={`nav-btn${view===n.id?" active":""}`} onClick={()=>setView(n.id)}>{n.icon} {n.label}</button>)}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div className="header-name" style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:600}}>{currentUser.name}</div>
            <span className={isAdmin?"badge-admin":"badge-emp"} style={{fontSize:10}}>{isAdmin?"Admin":"Mitarbeiter"}</span>
          </div>
          <div className="avatar" style={{width:32,height:32,fontSize:12}}>{initials(currentUser.name)}</div>
          <button className="btn btn-ghost" style={{padding:"7px 14px",fontSize:13}} onClick={logout}>Logout</button>
        </div>
      </header>
      <nav className="mobile-nav">
        {navItems.map(n=><button key={n.id} className={`mobile-nav-btn${view===n.id?" active":""}`} onClick={()=>setView(n.id)}><span className="icon">{n.icon}</span>{n.label}</button>)}
        <button className="mobile-nav-btn" onClick={logout}><span className="icon">🚪</span>Logout</button>
      </nav>

      <div className="main-content" style={{maxWidth:980,margin:"0 auto",padding:"24px 16px"}}>

        {/* EINTRAGEN */}
        {view==="eintragen"&&(
          <div>
            <h1 style={{fontSize:21,fontWeight:700,marginBottom:5}}>Zeiteintrag erfassen</h1>
            <p style={{color:"#5a6090",fontSize:13,marginBottom:22}}>Erfassung als: <strong style={{color:"#7c8bff"}}>{currentUser.name}</strong></p>
            <div className="card" style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
              <div className="grid-2">
                <div className="field-group"><label className="label">Datum *</label><input type="date" className="input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
                <div className="field-group"><label className="label">Projekt *</label><select className="input" value={form.project} onChange={e=>setForm({...form,project:e.target.value})}><option value="">— wählen —</option>{projects.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className="grid-2">
                <div className="field-group"><label className="label">Tätigkeit *</label><select className="input" value={form.activity} onChange={e=>setForm({...form,activity:e.target.value})}><option value="">— wählen —</option>{activities.map(a=><option key={a}>{a}</option>)}</select></div>
                <div style={{display:"flex",gap:10}}>
                  <div className="field-group" style={{flex:1}}><label className="label">Stunden *</label><input type="number" min="0" max="24" className="input" placeholder="0" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})} inputMode="numeric"/></div>
                  <div className="field-group" style={{flex:1}}><label className="label">Minuten</label><input type="number" min="0" max="59" className="input" placeholder="0" value={form.minutes} onChange={e=>setForm({...form,minutes:e.target.value})} inputMode="numeric"/></div>
                </div>
              </div>
              <div className="field-group"><label className="label">Bemerkung</label><textarea className="input" rows={2} placeholder="Optionale Bemerkung…" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
              {formMsg&&<div className={formMsg.type==="error"?"msg-error":"msg-success"}>{formMsg.text}</div>}
              <div><button className="btn btn-primary" onClick={submitEntry} disabled={saving} style={{width:"100%"}}>{saving?"Speichern…":"Eintrag speichern →"}</button></div>
            </div>
            <h2 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#7880a8",letterSpacing:".05em",textTransform:"uppercase"}}>Meine letzten Einträge</h2>
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Datum</th><th>Projekt</th><th>Tätigkeit</th><th>Zeit</th><th className="hide-mobile">Bemerkung</th><th></th></tr></thead>
                  <tbody>
                    {myEntries.slice(0,20).map(e=>(
                      <tr key={e.id}>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,whiteSpace:"nowrap"}}>{e.date}</td>
                        <td><span className="chip chip-blue">{e.project}</span></td>
                        <td style={{color:"#7880a8"}}>{e.activity}</td>
                        <td><span className="chip">{fmtTime(e.total_min)}</span></td>
                        <td className="hide-mobile" style={{color:"#5a6090",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.note||"—"}</td>
                        <td><button className="btn-danger" onClick={()=>deleteEntry(e.id)}>✕</button></td>
                      </tr>
                    ))}
                    {myEntries.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:"#5a6090",padding:"32px 0"}}>Noch keine Einträge.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AUSWERTUNG */}
        {view==="auswertung"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,flexWrap:"wrap",gap:10}}>
              <h1 style={{fontSize:21,fontWeight:700}}>Auswertung</h1>
              <button className="btn-excel" onClick={()=>exportAuswertungExcel({filteredEntries,projectStats,activityStats,filterMonth,filterYear,isAdmin})}>⬇ Excel exportieren</button>
            </div>
            <p style={{color:"#5a6090",fontSize:13,marginBottom:22}}>{isAdmin?"Alle Mitarbeiter":"Deine persönliche Übersicht"}</p>
            <div className="card" style={{marginBottom:16}}>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <select className="input" style={{width:"auto",flex:"1 1 120px"}} value={filterMonth} onChange={e=>setFilterMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
                <select className="input" style={{width:"auto",flex:"1 1 80px"}} value={filterYear} onChange={e=>setFilterYear(+e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select>
                {isAdmin&&<select className="input" style={{width:"auto",flex:"1 1 140px"}} value={filterEmployee} onChange={e=>setFilterEmployee(e.target.value)}><option value="alle">Alle Mitarbeiter</option>{users.filter(u=>u.role==="employee").map(u=><option key={u.id}>{u.name}</option>)}</select>}
                <select className="input" style={{width:"auto",flex:"1 1 140px"}} value={filterProject} onChange={e=>setFilterProject(e.target.value)}><option value="alle">Alle Projekte</option>{projects.map(p=><option key={p}>{p}</option>)}</select>
                <select className="input" style={{width:"auto",flex:"1 1 140px"}} value={filterActivity} onChange={e=>setFilterActivity(e.target.value)}><option value="alle">Alle Tätigkeiten</option>{activities.map(a=><option key={a}>{a}</option>)}</select>
              </div>
            </div>
            <div className="grid-3" style={{marginBottom:16}}>
              {[["Gesamtzeit",fmtTime(totalFiltered)],["Einträge",filteredEntries.length],["Projekte",projectStats.length]].map(([label,val])=>(
                <div key={label} className="summary-box"><div style={{color:"#5a6090",fontSize:10,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>{label}</div><div className="big-num">{val}</div></div>
              ))}
            </div>
            <div className="grid-2" style={{marginBottom:16}}>
              <div className="card">
                <div className="section-title">Nach Projekt</div>
                {projectStats.length===0&&<div style={{color:"#5a6090",fontSize:13}}>Keine Daten</div>}
                {projectStats.map(([name,min])=>(
                  <div key={name} className="stat-row">
                    <div style={{minWidth:90,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                    <div className="bar-bg"><div className="bar-fill" style={{width:`${(min/maxStat)*100}%`}}/></div>
                    <div style={{minWidth:65,textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#7c8bff"}}>{fmtTime(min)}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-title">Nach Tätigkeit</div>
                {activityStats.length===0&&<div style={{color:"#5a6090",fontSize:13}}>Keine Daten</div>}
                {activityStats.map(([name,min])=>(
                  <div key={name} className="stat-row">
                    <div style={{minWidth:90,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                    <div className="bar-bg"><div className="bar-fill bar-fill-green" style={{width:`${(min/maxAct)*100}%`}}/></div>
                    <div style={{minWidth:65,textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#4dffaa"}}>{fmtTime(min)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:"1px solid #1e2235"}}><span className="section-title" style={{marginBottom:0}}>Einträge ({filteredEntries.length})</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Datum</th>{isAdmin&&<th>Mitarbeiter</th>}<th>Projekt</th><th>Tätigkeit</th><th>Zeit</th><th className="hide-mobile">Bemerkung</th></tr></thead>
                  <tbody>
                    {filteredEntries.map(e=>(
                      <tr key={e.id}>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,whiteSpace:"nowrap"}}>{e.date}</td>
                        {isAdmin&&<td style={{fontWeight:500}}>{e.employee_name}</td>}
                        <td><span className="chip chip-blue">{e.project}</span></td>
                        <td style={{color:"#7880a8"}}>{e.activity}</td>
                        <td><span className="chip">{fmtTime(e.total_min)}</span></td>
                        <td className="hide-mobile" style={{color:"#5a6090"}}>{e.note||"—"}</td>
                      </tr>
                    ))}
                    {filteredEntries.length===0&&<tr><td colSpan={7} style={{textAlign:"center",color:"#5a6090",padding:"28px 0"}}>Keine Einträge für diesen Filter.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MONATSABSCHLUSS */}
        {view==="abschluss"&&isAdmin&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,flexWrap:"wrap",gap:10}}>
              <h1 style={{fontSize:21,fontWeight:700}}>Monatsabschluss</h1>
              <button className="btn-excel" onClick={()=>exportAbschlussExcel({abschlussPerEmp,abschlussMonth,abschlussYear})}>⬇ Excel exportieren</button>
            </div>
            <p style={{color:"#5a6090",fontSize:13,marginBottom:22}}>Stundenzusammenfassung für die Lohnabrechnung.</p>
            <div className="card" style={{marginBottom:16}}><div style={{display:"flex",gap:10}}>
              <select className="input" style={{width:"auto",flex:1}} value={abschlussMonth} onChange={e=>setAbschlussMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
              <select className="input" style={{width:"auto"}} value={abschlussYear} onChange={e=>setAbschlussYear(+e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select>
            </div></div>
            <div style={{fontSize:13,color:"#5a6090",marginBottom:16}}>{MONTHS[abschlussMonth]} {abschlussYear} — {abschlussEntries.length} Einträge, Total: <strong style={{color:"#e0e4f8"}}>{fmtTime(abschlussEntries.reduce((s,e)=>s+e.total_min,0))}</strong></div>
            {abschlussPerEmp.map(({name,totalMin,entries:empE})=>(
              <div key={name} className="abschluss-card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div className="avatar">{initials(name)}</div>
                    <div><div style={{fontWeight:600,fontSize:15}}>{name}</div><div style={{color:"#5a6090",fontSize:12,marginTop:2}}>{empE.length} Einträge</div></div>
                  </div>
                  <div style={{textAlign:"right"}}><div className="big-num" style={{fontSize:20}}>{fmtTime(totalMin)}</div><div style={{color:"#7c8bff",fontSize:12,fontFamily:"'DM Mono',monospace"}}>{fmtDecimal(totalMin)} h</div></div>
                </div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Datum</th><th>Projekt</th><th>Tätigkeit</th><th>Zeit</th><th className="hide-mobile">Bemerkung</th></tr></thead>
                  <tbody>{empE.map(e=>(
                    <tr key={e.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:12}}>{e.date}</td>
                      <td><span className="chip chip-blue">{e.project}</span></td>
                      <td style={{color:"#7880a8"}}>{e.activity}</td>
                      <td><span className="chip">{fmtTime(e.total_min)}</span></td>
                      <td className="hide-mobile" style={{color:"#5a6090"}}>{e.note||"—"}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              </div>
            ))}
            {abschlussPerEmp.length===0&&<div style={{textAlign:"center",color:"#5a6090",padding:"48px 0"}}>Keine Einträge für {MONTHS[abschlussMonth]} {abschlussYear}.</div>}
          </div>
        )}

        {/* VERWALTUNG */}
        {view==="verwaltung"&&isAdmin&&(
          <div>
            <h1 style={{fontSize:21,fontWeight:700,marginBottom:5}}>Verwaltung</h1>
            <p style={{color:"#5a6090",fontSize:13,marginBottom:22}}>Benutzer, Projekte und Tätigkeiten zentral verwalten.</p>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div className="section-title" style={{marginBottom:0}}>Benutzerverwaltung</div>
                  <button className="btn btn-primary" style={{padding:"8px 14px",fontSize:13}} onClick={()=>setUserModal("new")}>+ Benutzer</button>
                </div>
                {users.map(u=>(
                  <div key={u.id} className="user-row">
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="avatar">{initials(u.name)}</div>
                      <div><div style={{fontSize:14,fontWeight:600}}>{u.name}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#5a6090"}}>@{u.username}</div></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <span className={u.role==="admin"?"badge-admin":"badge-emp"}>{u.role==="admin"?"Admin":"Mitarbeiter"}</span>
                      <button className="btn-warn" onClick={()=>setUserModal(u)}>✎</button>
                      {u.id!==currentUser.id&&<button className="btn-danger" onClick={()=>deleteUser(u.id)}>✕</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-title">Projekte</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                  {projects.map(p=><span key={p} className="tag">{p}<button className="tag-remove" onClick={()=>removeProject(p)}>×</button></span>)}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input className="input" placeholder="Neues Projekt…" value={newProject} onChange={e=>setNewProject(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProject()}/>
                  <button className="btn btn-primary" style={{flexShrink:0}} onClick={addProject}>+</button>
                </div>
              </div>
              <div className="card">
                <div className="section-title">Tätigkeiten</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                  {activities.map(a=><span key={a} className="tag">{a}<button className="tag-remove" onClick={()=>removeActivity(a)}>×</button></span>)}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input className="input" placeholder="Neue Tätigkeit…" value={newActivity} onChange={e=>setNewActivity(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addActivity()}/>
                  <button className="btn btn-primary" style={{flexShrink:0}} onClick={addActivity}>+</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
