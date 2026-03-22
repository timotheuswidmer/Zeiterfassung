import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://pjwwzgklzerleftkvnag.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd3d6Z2tsemVybGVmdGt2bmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTU1MDksImV4cCI6MjA4NzY5MTUwOX0.1WnJd5-JJk4keOUk_VEV-WXiGgyNU1MHEZjxkaLkb54";

const sbHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
});
const sb = {
  async select(table, query="") {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`,{headers:sbHeaders()});
    if(!r.ok)throw new Error(await r.text()); return r.json();
  },
  async insert(table,data) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",headers:{...sbHeaders(),Prefer:"return=representation"},body:JSON.stringify(data)});
    if(!r.ok)throw new Error(await r.text()); return r.json();
  },
  async update(table,id,data) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:{...sbHeaders(),Prefer:"return=representation"},body:JSON.stringify(data)});
    if(!r.ok)throw new Error(await r.text()); return r.json();
  },
  async remove(table,id) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,{method:"DELETE",headers:sbHeaders()});
    if(!r.ok)throw new Error(await r.text());
  },
  async updateWhere(table,filter,data) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`,{method:"PATCH",headers:{...sbHeaders(),Prefer:"return=minimal"},body:JSON.stringify(data)});
    if(!r.ok)throw new Error(await r.text());
  },
};

const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{background:#0a0c13;color:#e0e4f8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#12141e;}::-webkit-scrollbar-thumb{background:#2e3150;border-radius:3px;}
  input,select,textarea,button{font-family:'DM Sans',sans-serif;outline:none;}
  .nav-btn{background:none;border:none;cursor:pointer;padding:9px 14px;border-radius:8px;font-size:13px;font-weight:500;color:#9aa2c8;transition:all .18s;white-space:nowrap;}
  .nav-btn:hover{background:#1a1e2e;color:#e0e4f8;}.nav-btn.active{background:#4f5de8;color:#fff;}
  .card{background:rgba(19,22,32,0.8);border:1px solid #1e2235;border-radius:16px;padding:24px;}
  .field-group{display:flex;flex-direction:column;gap:6px;}
  .label{font-size:11px;font-weight:700;color:#8890b8;letter-spacing:.07em;text-transform:uppercase;}
  .input{background:#0a0c13;border:1.5px solid #1e2235;border-radius:10px;padding:11px 14px;font-size:15px;color:#e0e4f8;transition:border .18s;width:100%;-webkit-appearance:none;}
  .input:focus{border-color:#4f5de8;}
  select.input{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235a6090' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;cursor:pointer;}
  select.input option{background:#131620;}textarea.input{resize:vertical;min-height:70px;}
  .btn{border:none;border-radius:10px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:6px;}
  .btn-primary{background:#4f5de8;color:#fff;}
  .btn-primary:hover{background:#6472f5;transform:translateY(-1px);box-shadow:0 4px 20px rgba(79,93,232,0.3);}
  .btn-primary:active{transform:translateY(0);}.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .btn-ghost{background:#1a1e2e;color:#9aa2c8;}.btn-ghost:hover{background:#222640;color:#e0e4f8;}
  .btn-full{width:100%;justify-content:center;padding:13px;}
  .btn-excel{background:rgba(29,168,106,0.15);color:#4dffaa;border:1px solid rgba(29,168,106,0.35);font-size:13px;padding:8px 14px;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
  .btn-excel:hover{background:rgba(29,168,106,0.28);transform:translateY(-1px);}
  .btn-excel2{background:rgba(124,139,255,0.12);color:#7c8bff;border:1px solid rgba(124,139,255,0.3);font-size:13px;padding:8px 14px;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
  .btn-excel2:hover{background:rgba(124,139,255,0.22);transform:translateY(-1px);}
  .btn-excel3{background:rgba(255,201,122,0.12);color:#ffc97a;border:1px solid rgba(255,201,122,0.3);font-size:13px;padding:8px 14px;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
  .btn-excel3:hover{background:rgba(255,201,122,0.22);transform:translateY(-1px);}
  .btn-danger{background:rgba(232,79,106,0.12);color:#ff6b85;border:1px solid rgba(232,79,106,0.25);font-size:12px;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;}
  .btn-danger:hover{background:rgba(232,79,106,0.25);}
  .btn-warn{background:rgba(232,162,79,0.12);color:#ffc97a;border:1px solid rgba(232,162,79,0.25);font-size:12px;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;}
  .btn-warn:hover{background:rgba(232,162,79,0.25);}
  .btn-edit{background:rgba(79,93,232,0.12);color:#7c8bff;border:1px solid rgba(79,93,232,0.25);font-size:12px;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;}
  .btn-edit:hover{background:rgba(79,93,232,0.25);}
  .tag{display:inline-flex;align-items:center;gap:6px;background:#1a1e2e;border:1px solid #2a2e48;border-radius:20px;padding:5px 12px;font-size:13px;}
  .tag-remove{background:none;border:none;cursor:pointer;color:#e84f6a;font-size:18px;line-height:1;padding:0 1px;}
  .msg-success{background:#0d2e1e;border:1px solid #1a5c38;color:#4dffaa;border-radius:10px;padding:10px 16px;font-size:13px;}
  .msg-error{background:#2e0d14;border:1px solid #6b1a2d;color:#ff8099;border-radius:10px;padding:10px 16px;font-size:13px;}
  .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;padding:10px 14px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8890b8;border-bottom:1px solid #1e2235;white-space:nowrap;}
  td{padding:11px 14px;border-bottom:1px solid rgba(19,22,32,0.6);vertical-align:middle;}
  tr:last-child td{border-bottom:none;}tbody tr:hover td{background:rgba(26,30,46,0.5);}
  .bar-bg{background:#1e2235;border-radius:4px;height:7px;flex:1;overflow:hidden;}
  .bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#4f5de8,#7c8bff);transition:width .8s cubic-bezier(.4,0,.2,1);}
  .bar-fill-green{background:linear-gradient(90deg,#1da86a,#4dffaa);}
  .stat-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(30,34,53,0.5);}
  .stat-row:last-child{border-bottom:none;}
  .chip{display:inline-block;background:#1a1e2e;border:1px solid #2a2e48;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:500;font-family:'DM Mono',monospace;}
  .chip-blue{background:#141a38;border-color:#2a3580;color:#7c8bff;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
  .section-title{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8890b8;margin-bottom:18px;}
  .big-num{font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:#e0e4f8;line-height:1.2;}
  .summary-box{background:rgba(10,12,19,0.6);border:1px solid #1e2235;border-radius:12px;padding:16px 18px;}
  .badge-admin{background:#1a1438;border:1px solid #5a4af0;color:#a89aff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;display:inline-block;}
  .badge-emp{background:#0d2e1e;border:1px solid #1a5c38;color:#4dffaa;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;display:inline-block;}
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(ellipse at 30% 20%,rgba(26,29,64,0.4) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(13,46,30,0.3) 0%,transparent 60%),#0a0c13;}
  .login-card{background:rgba(19,22,32,0.95);border:1px solid #1e2235;border-radius:24px;padding:36px;width:100%;max-width:400px;box-shadow:0 24px 80px rgba(0,0,0,0.5);}
  .user-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid #1e2235;border-radius:12px;margin-bottom:8px;gap:8px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#4f5de8,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;}
  .abschluss-card{background:rgba(19,22,32,0.8);border:1px solid #1e2235;border-radius:14px;padding:20px;margin-bottom:14px;}
  .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;}
  .modal{background:#131620;border:1px solid #2a2e48;border-radius:20px;padding:28px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
  .pw-hint{font-size:11px;color:#8890b8;margin-top:4px;}
  .loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0c13;flex-direction:column;gap:16px;}
  .spinner{width:32px;height:32px;border:3px solid #1e2235;border-top-color:#4f5de8;border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .config-code{background:#0a0c13;border:1px solid #1e2235;border-radius:12px;padding:18px;font-size:12px;font-family:'DM Mono',monospace;color:#9aa2c8;line-height:2;margin:16px 0;}
  .filter-label{font-size:11px;font-weight:700;color:#8890b8;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;}
  .filter-group{display:flex;flex-direction:column;gap:6px;flex:1 1 120px;}
  .range-sep{color:#8890b8;font-size:13px;align-self:flex-end;padding-bottom:13px;flex-shrink:0;}
  .action-btns{display:flex;gap:6px;flex-shrink:0;}
  .stopwatch-display{font-family:'DM Mono',monospace;font-size:42px;font-weight:500;color:#e0e4f8;letter-spacing:.05em;text-align:center;line-height:1;}
  .stopwatch-running{color:#4dffaa;}
  .stopwatch-paused{color:#ffbe32;}
  .btn-stop{background:rgba(232,79,106,0.15);color:#ff6b85;border:1px solid rgba(232,79,106,0.35);border-radius:12px;padding:12px 28px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;display:inline-flex;align-items:center;gap:8px;}
  .btn-stop:hover{background:rgba(232,79,106,0.28);transform:translateY(-1px);}
  .btn-start{background:rgba(77,255,170,0.12);color:#4dffaa;border:1px solid rgba(77,255,170,0.3);border-radius:12px;padding:12px 28px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;display:inline-flex;align-items:center;gap:8px;}
  .btn-start:hover{background:rgba(77,255,170,0.22);transform:translateY(-1px);}
  .btn-start:disabled{opacity:.4;cursor:not-allowed;transform:none;}
  .btn-pause{background:rgba(255,190,50,0.12);color:#ffbe32;border:1px solid rgba(255,190,50,0.3);border-radius:12px;padding:12px 22px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;display:inline-flex;align-items:center;gap:8px;}
  .btn-pause:hover{background:rgba(255,190,50,0.22);transform:translateY(-1px);}
  .day-chip{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:1.5px solid #1e2235;font-size:11px;font-weight:700;cursor:pointer;color:#8890b8;transition:all .15s;user-select:none;}.day-chip.active{background:#4f5de8;border-color:#4f5de8;color:#fff;}
  .badge-frei{background:rgba(77,255,170,0.12);color:#4dffaa;border:1px solid rgba(77,255,170,0.25);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;display:inline-block;}
  .badge-krank{background:rgba(255,107,133,0.12);color:#ff6b85;border:1px solid rgba(255,107,133,0.25);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;display:inline-block;}
  .balance-box{background:rgba(79,93,232,0.08);border:1px solid rgba(79,93,232,0.2);border-radius:12px;padding:14px 18px;display:flex;flex-direction:column;gap:8px;}
  .balance-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;}
  .soll-ist-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px;}
  .sw-dot{width:8px;height:8px;border-radius:50%;background:#4dffaa;animation:pulse 1s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
  /* Checkbox list für Projektauswahl */
  .proj-check-list{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;margin:12px 0;}
  .proj-check-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #1e2235;border-radius:10px;cursor:pointer;transition:background .15s;}
  .proj-check-item:hover{background:#1a1e2e;}
  .proj-check-item.checked{border-color:#4f5de8;background:rgba(79,93,232,0.08);}
  .proj-check-item input[type=checkbox]{width:16px;height:16px;accent-color:#4f5de8;cursor:pointer;flex-shrink:0;}
  .proj-check-item label{font-size:14px;cursor:pointer;flex:1;}
  .proj-check-item .proj-hours{font-family:'DM Mono',monospace;font-size:11px;color:#8890b8;}
  .select-all-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 2px;}
  .dropdown-wrap{position:relative;}
  .dropdown-menu{position:absolute;top:calc(100% + 8px);right:0;background:#1a1e2e;border:1px solid #2a2e48;border-radius:12px;padding:6px;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:300;animation:fadeIn .12s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .dropdown-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:#c0c8f0;border:none;background:none;width:100%;text-align:left;transition:background .15s;}
  .dropdown-item:hover{background:#222640;color:#e0e4f8;}
  .dropdown-item.danger{color:#ff6b85;}
  .dropdown-item.danger:hover{background:rgba(232,79,106,0.12);}
  .dropdown-divider{height:1px;background:#2a2e48;margin:4px 0;}
  /* Autocomplete */
  .ac-wrap{position:relative;}
  .ac-list{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#1a1e2e;border:1px solid #2a2e48;border-radius:10px;padding:4px;z-index:400;max-height:220px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.4);}
  .ac-item{padding:9px 12px;border-radius:7px;cursor:pointer;font-size:14px;color:#c0c8f0;transition:background .12s;}
  .ac-item:hover,.ac-item.active{background:#2a2e48;color:#e0e4f8;}
  .ac-item mark{background:none;color:#7c8bff;font-weight:700;}
  /* Verwaltungsliste */
  .mgmt-list-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #1e2235;border-radius:10px;margin-bottom:6px;gap:8px;}
  .mgmt-list-item:last-child{margin-bottom:0;}
  .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(13,15,22,0.97);border-top:1px solid #1e2235;padding:8px 8px calc(8px + env(safe-area-inset-bottom));z-index:100;gap:4px;justify-content:space-around;}
  .mobile-nav-btn{flex:1;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:10px;color:#8890b8;font-size:10px;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .18s;}
  .mobile-nav-btn.active{color:#7c8bff;background:rgba(79,93,232,0.12);}
  .mobile-nav-btn .icon{font-size:20px;line-height:1;}
  @media(max-width:680px){
    .grid-2,.grid-3{grid-template-columns:1fr;}
    .hide-mobile{display:none!important;}
    .main-content{padding-bottom:90px!important;}
    .mobile-nav{display:flex;}
    .desktop-nav{display:none!important;}
    .header-name{display:none!important;}
    .card{padding:16px;}.login-card{padding:24px;}.modal{padding:20px;}
    .range-sep{padding-bottom:0;align-self:center;}
    .export-btn-group{gap:6px;}
  }
  @media(min-width:681px){.mobile-nav{display:none!important;}}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (min) => { const m=Math.round(min); return `${Math.floor(m/60)}h ${String(m%60).padStart(2,"0")}m`; };
const fmtDecimal = (min) => (min/60).toFixed(2);
const todayStr = () => new Date().toISOString().split("T")[0];
const initials = (name) => name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const years = Array.from({length:6},(_,i)=>new Date().getFullYear()-2+i);
const toYM = (year,month) => year*100+month;
// Dateiname: "2025_05" oder "2025_05-2026_02"
const fmtFileRange = (fromYear,fromMonth,toYear,toMonth) => {
  const f=`${fromYear}_${String(fromMonth+1).padStart(2,"0")}`;
  const t=`${toYear}_${String(toMonth+1).padStart(2,"0")}`;
  return f===t ? f : `${f}-${t}`;
};

// ─── SheetJS laden ────────────────────────────────────────────────────────────
function loadSheetJS(){
  return new Promise((resolve,reject)=>{
    if(window.XLSX){resolve(window.XLSX);return;}
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
    s.onload=()=>resolve(window.XLSX);
    s.onerror=()=>{
      const s2=document.createElement("script");
      s2.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s2.onload=()=>resolve(window.XLSX);s2.onerror=reject;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  });
}

// Cell-Style Helpers
const ST = {
  hdr:(bg="1F3864")=>({font:{bold:true,color:{rgb:"FFFFFF"},sz:11,name:"Arial"},fill:{fgColor:{rgb:bg}},alignment:{horizontal:"center",vertical:"center"},border:{bottom:{style:"medium",color:{rgb:"FFFFFF"}}}}),
  title:(sz=14)=>({font:{bold:true,sz,name:"Arial",color:{rgb:"1F3864"}},alignment:{horizontal:"left"}}),
  meta:  {font:{sz:10,name:"Arial",color:{rgb:"595959"}},alignment:{horizontal:"left"}},
  cell:(bold=false,align="left",clr="333333")=>({font:{sz:10,name:"Arial",bold,color:{rgb:clr}},alignment:{horizontal:align,vertical:"center",wrapText:true},border:{bottom:{style:"thin",color:{rgb:"D0D7E5"}}}}),
  num:   {font:{sz:10,name:"Arial"},alignment:{horizontal:"center"},border:{bottom:{style:"thin",color:{rgb:"D0D7E5"}}}},
  total: {font:{bold:true,sz:11,name:"Arial",color:{rgb:"1F3864"}},fill:{fgColor:{rgb:"D9E2F3"}},alignment:{horizontal:"center"}},
  totalLbl:{font:{bold:true,sz:11,name:"Arial",color:{rgb:"1F3864"}},fill:{fgColor:{rgb:"D9E2F3"}},alignment:{horizontal:"right"}},
  alt:   {fill:{fgColor:{rgb:"EEF2FA"}}},
};
const sc=(v,s)=>({v,s,t:typeof v==="number"?"n":"s"});
const merge=(a,b)=>({...a,...b,font:{...a.font,...b.font},fill:{...a.fill,...b.fill},alignment:{...a.alignment,...b.alignment}});

// ─── Export 1: Monatsabschluss (A4-Stundenblatt pro Person) ──────────────────
async function exportMonatsabschlussExcel({abschlussPerEmp,abschlussMonth,abschlussYear}){
  const XLSX=await loadSheetJS();
  const wb=XLSX.utils.book_new();
  const label=`${MONTHS[abschlussMonth]} ${abschlussYear}`;
  const totalAll=abschlussPerEmp.reduce((s,e)=>s+e.totalMin,0);

  // Tab 1: Zusammenfassung aller Mitarbeitenden
  const sumRows=[
    [sc(`Monatsabschluss — ${label}`,ST.title(14)),"","","",""],
    ["","","","",""],
    [sc("Mitarbeiter",ST.hdr()),sc("Einträge",ST.hdr()),sc("Stunden",ST.hdr()),sc("Min",ST.hdr()),sc("Std (Dez.)",ST.hdr())],
    ...abschlussPerEmp.map(({name,totalMin,entries},i)=>{
      const bg=i%2===0?merge(ST.cell(),...[ST.alt]):{};
      return [sc(name,i%2===0?merge(ST.cell(false,"left"),ST.alt):ST.cell()),sc(entries.length,i%2===0?merge(ST.num,ST.alt):ST.num),sc(Math.floor(totalMin/60),i%2===0?merge(ST.num,ST.alt):ST.num),sc(totalMin%60,i%2===0?merge(ST.num,ST.alt):ST.num),sc(parseFloat(fmtDecimal(totalMin)),i%2===0?merge(ST.num,ST.alt):ST.num)];
    }),
    ["","","","",""],
    [sc("TOTAL",ST.totalLbl),sc(abschlussPerEmp.reduce((s,e)=>s+e.entries.length,0),ST.total),sc(Math.floor(totalAll/60),ST.total),sc(totalAll%60,ST.total),sc(parseFloat(fmtDecimal(totalAll)),ST.total)],
  ];
  const sumWs=XLSX.utils.aoa_to_sheet(sumRows);
  sumWs["!cols"]=[{wch:28},{wch:11},{wch:11},{wch:8},{wch:14}];
  sumWs["!merges"]=[{s:{r:0,c:0},e:{r:0,c:4}}];
  XLSX.utils.book_append_sheet(wb,sumWs,"Zusammenfassung");

  // Tab pro Mitarbeitender — druckfertig A4
  abschlussPerEmp.forEach(({name,totalMin,entries:empE})=>{
    const sorted=[...empE].sort((a,b)=>a.date.localeCompare(b.date));
    const dataRows=sorted.map((e,i)=>{
      const isAlt=i%2===0;
      return [
        sc(e.date,   isAlt?merge(ST.cell(false,"center"),ST.alt):ST.cell(false,"center")),
        sc(e.project,isAlt?merge(ST.cell(),ST.alt):ST.cell()),
        sc(e.activity,isAlt?merge(ST.cell(false,"left","595959"),ST.alt):ST.cell(false,"left","595959")),
        sc(Math.floor(e.total_min/60),isAlt?merge(ST.num,ST.alt):ST.num),
        sc(e.total_min%60,isAlt?merge(ST.num,ST.alt):ST.num),
        sc(parseFloat(fmtDecimal(e.total_min)),isAlt?merge(ST.num,ST.alt):ST.num),
        sc(e.note||"",isAlt?merge(ST.cell(false,"left","888888"),ST.alt):ST.cell(false,"left","888888")),
      ];
    });
    const rows=[
      [sc(`Stundenabschluss ${label}`,ST.title(14)),"","","","","",""],
      [sc(name,{font:{bold:true,sz:12,name:"Arial",color:{rgb:"2E4D8A"}},alignment:{horizontal:"left"}}),"","","","","",""],
      [sc(`Erstellt am: ${new Date().toLocaleDateString("de-CH")}`,ST.meta),"","","","","",""],
      ["","","","","","",""],
      [sc("Datum",ST.hdr()),sc("Projekt",ST.hdr()),sc("Tätigkeit",ST.hdr()),sc("Std",ST.hdr()),sc("Min",ST.hdr()),sc("Std (Dez.)",ST.hdr()),sc("Bemerkung",ST.hdr())],
      ...dataRows,
      ["","","","","","",""],
      [sc("",ST.totalLbl),sc("",ST.total),sc("TOTAL",ST.totalLbl),sc(Math.floor(totalMin/60),ST.total),sc(totalMin%60,ST.total),sc(parseFloat(fmtDecimal(totalMin)),{...ST.total,font:{bold:true,sz:12,name:"Arial",color:{rgb:"1F3864"}}}),sc("",ST.total)],
      ["","","","","","",""],
      [sc("Unterschrift Mitarbeiter/in:",ST.meta),"","",sc("Unterschrift Vorgesetzte/r:",ST.meta),"","",""],
      ["","","","","","",""],
      [sc("________________________________",ST.meta),"","",sc("________________________________",ST.meta),"","",""],
    ];
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:13},{wch:22},{wch:18},{wch:7},{wch:7},{wch:12},{wch:26}];
    ws["!rows"]=[{hpt:26},{hpt:20},{hpt:14},,{hpt:20}];
    const nr=rows.length;
    ws["!merges"]=[
      {s:{r:0,c:0},e:{r:0,c:6}},{s:{r:1,c:0},e:{r:1,c:6}},{s:{r:2,c:0},e:{r:2,c:6}},
      {s:{r:nr-3,c:0},e:{r:nr-3,c:2}},{s:{r:nr-3,c:3},e:{r:nr-3,c:6}},
      {s:{r:nr-1,c:0},e:{r:nr-1,c:2}},{s:{r:nr-1,c:3},e:{r:nr-1,c:6}},
    ];
    ws["!pageSetup"]={paperSize:9,orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0};
    ws["!margins"]={left:0.7,right:0.7,top:0.75,bottom:0.75,header:0.3,footer:0.3};
    XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));
  });
  XLSX.writeFile(wb,`${abschlussYear}_${String(abschlussMonth+1).padStart(2,"0")}_Monatsabschluss.xlsx`);
}

// ─── Export 2: Projektauswertung mit Projektauswahl ───────────────────────────
async function exportProjektauswertungExcel({entries,selectedProjects,fromMonth,fromYear,toMonth,toYear}){
  const XLSX=await loadSheetJS();
  const wb=XLSX.utils.book_new();
  const label=fromYear===toYear&&fromMonth===toMonth
    ?`${MONTHS[fromMonth]} ${fromYear}`
    :`${MONTHS[fromMonth]} ${fromYear} – ${MONTHS[toMonth]} ${toYear}`;

  // Nur ausgewählte Projekte, Zeitraum-gefiltert
  const fromYM=toYM(fromYear,fromMonth), toYM_=toYM(toYear,toMonth);
  const base=entries.filter(e=>{
    const d=new Date(e.date);
    const ym=toYM(d.getFullYear(),d.getMonth());
    return ym>=fromYM&&ym<=toYM_&&selectedProjects.includes(e.project);
  });

  // Tab 1: Übersicht — alle gewählten Projekte auf einen Blick
  const overviewRows=[
    [sc(`Projektauswertung — ${label}`,ST.title(14)),"","","","",""],
    ["","","","","",""],
    [sc("Projekt",ST.hdr("1F3864")),sc("Mitarbeiter",ST.hdr("1F3864")),sc("Tätigkeiten",ST.hdr("1F3864")),sc("Einträge",ST.hdr("1F3864")),sc("Std (h:mm)",ST.hdr("1F3864")),sc("Std (Dez.)",ST.hdr("1F3864"))],
  ];
  const grandTotal=base.reduce((s,e)=>s+e.total_min,0);

  selectedProjects.forEach((proj,pi)=>{
    const pe=base.filter(e=>e.project===proj);
    if(!pe.length)return;
    const pm=pe.reduce((s,e)=>s+e.total_min,0);
    const empNames=[...new Set(pe.map(e=>e.employee_name))].sort().join(", ");
    const acts=[...new Set(pe.map(e=>e.activity))].sort().join(", ");
    const isAlt=pi%2===0;
    overviewRows.push([
      sc(proj,    isAlt?merge(ST.cell(true),ST.alt):ST.cell(true)),
      sc(empNames,isAlt?merge(ST.cell(false,"left","595959"),ST.alt):ST.cell(false,"left","595959")),
      sc(acts,    isAlt?merge(ST.cell(false,"left","777777"),ST.alt):ST.cell(false,"left","777777")),
      sc(pe.length,isAlt?merge(ST.num,ST.alt):ST.num),
      sc(fmtTime(pm),isAlt?merge(ST.cell(false,"center"),ST.alt):ST.cell(false,"center")),
      sc(parseFloat(fmtDecimal(pm)),isAlt?merge(ST.num,ST.alt):ST.num),
    ]);
  });
  overviewRows.push(["","","","","",""]);
  overviewRows.push([sc("TOTAL",ST.totalLbl),"","",sc(base.length,ST.total),sc(fmtTime(grandTotal),{...ST.total,alignment:{horizontal:"center"}}),sc(parseFloat(fmtDecimal(grandTotal)),ST.total)]);

  const ovWs=XLSX.utils.aoa_to_sheet(overviewRows);
  ovWs["!cols"]=[{wch:26},{wch:32},{wch:38},{wch:10},{wch:14},{wch:14}];
  ovWs["!merges"]=[{s:{r:0,c:0},e:{r:0,c:5}}];
  XLSX.utils.book_append_sheet(wb,ovWs,"Übersicht");

  // Tab pro Projekt — detailliert: wer hat was geleistet
  selectedProjects.forEach(proj=>{
    const pe=[...base.filter(e=>e.project===proj)].sort((a,b)=>a.date.localeCompare(b.date));
    if(!pe.length)return;
    const pm=pe.reduce((s,e)=>s+e.total_min,0);

    // Mitarbeiter-Zusammenfassung mit Tätigkeitsaufteilung
    const empMap={};
    pe.forEach(e=>{
      if(!empMap[e.employee_name])empMap[e.employee_name]={total:0,acts:{}};
      empMap[e.employee_name].total+=e.total_min;
      if(!empMap[e.employee_name].acts[e.activity])empMap[e.employee_name].acts[e.activity]=0;
      empMap[e.employee_name].acts[e.activity]+=e.total_min;
    });
    const emps=Object.entries(empMap).sort((a,b)=>b[1].total-a[1].total);

    const rows=[
      [sc(`Projekt: ${proj}`,ST.title(13)),"","","",""],
      [sc(label,ST.meta),"","","",""],
      ["","","","",""],
      // Mitarbeiter-Übersicht
      [sc("STUNDEN NACH MITARBEITER",{font:{bold:true,sz:9,name:"Arial",color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"2E4D8A"}},alignment:{horizontal:"left"}}),"","","",""],
      [sc("Mitarbeiter",ST.hdr("2E4D8A")),sc("Tätigkeiten",ST.hdr("2E4D8A")),sc("Std (h:mm)",ST.hdr("2E4D8A")),sc("Std (Dez.)",ST.hdr("2E4D8A")),sc("Anteil",ST.hdr("2E4D8A"))],
      ...emps.map(([name,{total,acts}],i)=>{
        const actStr=Object.entries(acts).sort((a,b)=>b[1]-a[1]).map(([a,m])=>`${a}: ${fmtTime(m)}`).join(" | ");
        const pct=pm>0?((total/pm)*100).toFixed(1)+"%":"0%";
        const isAlt=i%2===0;
        return [
          sc(name,    isAlt?merge(ST.cell(true),ST.alt):ST.cell(true)),
          sc(actStr,  isAlt?merge(ST.cell(false,"left","595959"),ST.alt):ST.cell(false,"left","595959")),
          sc(fmtTime(total),isAlt?merge(ST.cell(false,"center"),ST.alt):ST.cell(false,"center")),
          sc(parseFloat(fmtDecimal(total)),isAlt?merge(ST.num,ST.alt):ST.num),
          sc(pct,     isAlt?merge(ST.cell(false,"center","595959"),ST.alt):ST.cell(false,"center","595959")),
        ];
      }),
      ["","","","",""],
      [sc("TOTAL",ST.totalLbl),sc("",ST.total),sc(fmtTime(pm),{...ST.total,alignment:{horizontal:"center"}}),sc(parseFloat(fmtDecimal(pm)),ST.total),sc("100%",ST.total)],
      ["","","","",""],
      // Tätigkeitsübersicht
      [sc("STUNDEN NACH TÄTIGKEIT",{font:{bold:true,sz:9,name:"Arial",color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1F5C3A"}},alignment:{horizontal:"left"}}),"","","",""],
      [sc("Tätigkeit",ST.hdr("1F5C3A")),sc("Mitarbeiter",ST.hdr("1F5C3A")),sc("Std (h:mm)",ST.hdr("1F5C3A")),sc("Std (Dez.)",ST.hdr("1F5C3A")),sc("Anteil",ST.hdr("1F5C3A"))],
      ...Object.entries(pe.reduce((m,e)=>{if(!m[e.activity])m[e.activity]={total:0,emps:new Set()};m[e.activity].total+=e.total_min;m[e.activity].emps.add(e.employee_name);return m;},{}))
        .sort((a,b)=>b[1].total-a[1].total)
        .map(([act,{total,emps:actEmps}],i)=>{
          const pct=pm>0?((total/pm)*100).toFixed(1)+"%":"0%";
          const isAlt=i%2===0;
          return [
            sc(act,  isAlt?merge(ST.cell(true),ST.alt):ST.cell(true)),
            sc([...actEmps].sort().join(", "),isAlt?merge(ST.cell(false,"left","595959"),ST.alt):ST.cell(false,"left","595959")),
            sc(fmtTime(total),isAlt?merge(ST.cell(false,"center"),ST.alt):ST.cell(false,"center")),
            sc(parseFloat(fmtDecimal(total)),isAlt?merge(ST.num,ST.alt):ST.num),
            sc(pct,  isAlt?merge(ST.cell(false,"center","595959"),ST.alt):ST.cell(false,"center","595959")),
          ];
        }),
      ["","","","",""],
      // Alle Einträge
      [sc("ALLE EINTRÄGE",{font:{bold:true,sz:9,name:"Arial",color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"444444"}},alignment:{horizontal:"left"}}),"","","",""],
      [sc("Datum",ST.hdr("444444")),sc("Mitarbeiter",ST.hdr("444444")),sc("Tätigkeit",ST.hdr("444444")),sc("Std (h:mm)",ST.hdr("444444")),sc("Bemerkung",ST.hdr("444444"))],
      ...pe.map((e,i)=>{
        const isAlt=i%2===0;
        return [
          sc(e.date, isAlt?merge(ST.cell(false,"center"),ST.alt):ST.cell(false,"center")),
          sc(e.employee_name,isAlt?merge(ST.cell(),ST.alt):ST.cell()),
          sc(e.activity,isAlt?merge(ST.cell(false,"left","595959"),ST.alt):ST.cell(false,"left","595959")),
          sc(fmtTime(e.total_min),isAlt?merge(ST.cell(false,"center"),ST.alt):ST.cell(false,"center")),
          sc(e.note||"",isAlt?merge(ST.cell(false,"left","888888"),ST.alt):ST.cell(false,"left","888888")),
        ];
      }),
    ];

    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:26},{wch:44},{wch:14},{wch:13},{wch:13}];
    ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:4}},{s:{r:1,c:0},e:{r:1,c:4}},{s:{r:3,c:0},e:{r:3,c:4}}];
    const sheetName=proj.replace(/[\\/*?[\]:]/g,"").slice(0,31);
    XLSX.utils.book_append_sheet(wb,ws,sheetName);
  });

  XLSX.writeFile(wb,`${fmtFileRange(fromYear,fromMonth,toYear,toMonth)}_Projektauswertung.xlsx`);
}

// ─── Export 3: Allgemeine Auswertung (wie bisher) ─────────────────────────────
async function exportAuswertungExcel({filteredEntries,projectStats,activityStats,fromMonth,fromYear,toMonth,toYear,isAdmin}){
  const XLSX=await loadSheetJS();
  const wb=XLSX.utils.book_new();
  const label=fromYear===toYear&&fromMonth===toMonth?`${MONTHS[fromMonth]} ${fromYear}`:`${MONTHS[fromMonth]} ${fromYear} – ${MONTHS[toMonth]} ${toYear}`;
  const total=filteredEntries.reduce((s,e)=>s+e.total_min,0);
  const cols=isAdmin?["Datum","Mitarbeiter","Projekt","Tätigkeit","Stunden","Minuten","Std (Dez.)","Bemerkung"]:["Datum","Projekt","Tätigkeit","Stunden","Minuten","Std (Dez.)","Bemerkung"];
  const dataRows=filteredEntries.map(e=>isAdmin?[e.date,e.employee_name,e.project,e.activity,Math.floor(e.total_min/60),e.total_min%60,parseFloat(fmtDecimal(e.total_min)),e.note||""]:[e.date,e.project,e.activity,Math.floor(e.total_min/60),e.total_min%60,parseFloat(fmtDecimal(e.total_min)),e.note||""]);
  const totalRow=isAdmin?["","","","TOTAL",Math.floor(total/60),total%60,parseFloat(fmtDecimal(total)),""]  :["","","TOTAL",Math.floor(total/60),total%60,parseFloat(fmtDecimal(total)),""];
  const ws1=XLSX.utils.aoa_to_sheet([cols,...dataRows,[],totalRow]);
  ws1["!cols"]=isAdmin?[{wch:12},{wch:18},{wch:22},{wch:18},{wch:9},{wch:9},{wch:12},{wch:30}]:[{wch:12},{wch:22},{wch:18},{wch:9},{wch:9},{wch:12},{wch:30}];
  XLSX.utils.book_append_sheet(wb,ws1,"Einträge");
  const mkStat=(data,name)=>{
    const ws=XLSX.utils.aoa_to_sheet([[name,"Stunden","Minuten","Std (Dez.)","Anteil %"],...data.map(([n,m])=>[n,Math.floor(m/60),m%60,parseFloat(fmtDecimal(m)),total>0?((m/total)*100).toFixed(1)+"%":"0%"]),[]  ,["TOTAL",Math.floor(total/60),total%60,parseFloat(fmtDecimal(total)),"100%"]]);
    ws["!cols"]=[{wch:24},{wch:10},{wch:10},{wch:12},{wch:10}]; return ws;
  };
  XLSX.utils.book_append_sheet(wb,mkStat(projectStats,"Projekt"),"Nach Projekt");
  XLSX.utils.book_append_sheet(wb,mkStat(activityStats,"Tätigkeit"),"Nach Tätigkeit");
  XLSX.writeFile(wb,`${fmtFileRange(fromYear,fromMonth,toYear,toMonth)}_Auswertung.xlsx`);
}

// ─── Projekt-Auswahl Modal ────────────────────────────────────────────────────
function ProjektAuswahlModal({allProjects,projectStats,onExport,onClose}){
  const [selected,setSelected]=useState(new Set(allProjects));
  const allChecked=selected.size===allProjects.length;
  const statsMap=Object.fromEntries(projectStats);

  const toggle=(p)=>setSelected(prev=>{const s=new Set(prev);s.has(p)?s.delete(p):s.add(p);return s;});
  const toggleAll=()=>setSelected(allChecked?new Set():new Set(allProjects));

  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>Projektauswertung exportieren</div>
        <div style={{fontSize:13,color:"#8890b8",marginBottom:16}}>Wähle die Projekte, die du exportieren möchtest.</div>

        <div className="select-all-row">
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#7c8bff"}}>
            <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{width:16,height:16,accentColor:"#4f5de8"}}/>
            Alle auswählen
          </label>
          <span style={{fontSize:12,color:"#8890b8"}}>{selected.size} / {allProjects.length} ausgewählt</span>
        </div>

        <div className="proj-check-list">
          {allProjects.map(p=>(
            <div key={p} className={`proj-check-item${selected.has(p)?" checked":""}`} onClick={()=>toggle(p)}>
              <input type="checkbox" checked={selected.has(p)} onChange={()=>toggle(p)} onClick={e=>e.stopPropagation()}/>
              <label style={{pointerEvents:"none"}}>{p}</label>
              {statsMap[p]&&<span className="proj-hours">{fmtTime(statsMap[p])}</span>}
            </div>
          ))}
          {allProjects.length===0&&<div style={{color:"#8890b8",fontSize:13,padding:"12px 0",textAlign:"center"}}>Keine Projekte im gewählten Zeitraum.</div>}
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" disabled={selected.size===0} onClick={()=>onExport([...selected])}>
            ⬇ {selected.size} Projekt{selected.size!==1?"e":""} exportieren
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Config / Login / User / Entry Modals ─────────────────────────────────────
function ConfigScreen(){
  return(
    <div className="login-wrap"><div className="login-card">
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:54,height:54,background:"linear-gradient(135deg,#e84f6a,#f06050)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>⚙️</div>
        <div style={{fontSize:20,fontWeight:700}}>Supabase nicht konfiguriert</div>
        <div style={{color:"#8890b8",fontSize:13,marginTop:8,lineHeight:1.7}}>Öffne <code style={{background:"#1a1e2e",padding:"1px 6px",borderRadius:4,color:"#7c8bff"}}>src/App.jsx</code> und trage deine Zugangsdaten in Zeile 5–6 ein.</div>
      </div>
      <div className="config-code">
        <div style={{color:"#8890b8",fontSize:11,marginBottom:4}}>// Zeilen 5–6 anpassen:</div>
        <div><span style={{color:"#4dffaa"}}>SUPABASE_URL</span> = <span style={{color:"#ffc97a"}}>"https://xxx.supabase.co"</span></div>
        <div><span style={{color:"#4dffaa"}}>SUPABASE_ANON_KEY</span> = <span style={{color:"#ffc97a"}}>"eyJ..."</span></div>
      </div>
      <div style={{fontSize:12,color:"#8890b8",textAlign:"center"}}>Anleitung: <strong style={{color:"#e0e4f8"}}>README.md</strong></div>
    </div></div>
  );
}

function LoginScreen({onLogin}){
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const attempt=async()=>{
    if(!username.trim()||!password){setErr("Bitte alle Felder ausfüllen.");return;}
    setLoading(true);setErr("");
    try{const users=await sb.select("users",`?username=eq.${encodeURIComponent(username.trim().toLowerCase())}&select=*`);if(!users.length||users[0].password!==password){setErr("Benutzername oder Passwort falsch.");return;}onLogin(users[0]);}
    catch{setErr("Verbindungsfehler.");}finally{setLoading(false);}
  };
  return(
    <div className="login-wrap"><div className="login-card">
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{width:54,height:54,background:"linear-gradient(135deg,#4f5de8,#8b5cf6)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>⏱</div>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.02em"}}>Zeiterfassung</div>
        <div style={{color:"#8890b8",fontSize:13,marginTop:5}}>Melde dich mit deinen Zugangsdaten an</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="field-group"><label className="label">Benutzername</label><input className="input" value={username} onChange={e=>{setUsername(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="z.B. anna" autoFocus autoCapitalize="none" autoCorrect="off"/></div>
        <div className="field-group"><label className="label">Passwort</label><input className="input" type="password" value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="••••••••"/></div>
        {err&&<div className="msg-error">{err}</div>}
        <button className="btn btn-primary btn-full" style={{marginTop:4}} onClick={attempt} disabled={loading}>{loading?"Anmelden…":"Anmelden →"}</button>
      </div>
    </div></div>
  );
}

function UserModal({existing,onSave,onClose,holidays}){
  const DAYS=[{v:"1",l:"Mo"},{v:"2",l:"Di"},{v:"3",l:"Mi"},{v:"4",l:"Do"},{v:"5",l:"Fr"},{v:"6",l:"Sa"},{v:"7",l:"So"}];
  const [form,setForm]=useState(existing?{...existing,password:"",work_days:existing.work_days||"1,2,3,4,5",employment_type:existing.employment_type||"hourly",daily_hours:existing.daily_hours!=null?String(existing.daily_hours):"",annual_hours:existing.annual_hours!=null?String(existing.annual_hours):"",vacation_days_per_year:existing.vacation_days_per_year!=null?String(existing.vacation_days_per_year):"25"}:{name:"",username:"",password:"",role:"employee",employment_type:"hourly",daily_hours:"",annual_hours:"",work_days:"1,2,3,4,5",vacation_days_per_year:"25"});
  const [err,setErr]=useState("");const [saving,setSaving]=useState(false);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));
  const toggleDay=v=>{const days=(form.work_days||"").split(",").filter(Boolean);const nd=days.includes(v)?days.filter(d=>d!==v):[...days,v].sort();setForm(p=>({...p,work_days:nd.join(",")}));};

  // Berechne Arbeitstage im aktuellen Jahr minus Feiertage auf Arbeitstagen
  const calcWorkdaysInYear=()=>{
    const wd=(form.work_days||"1,2,3,4,5").split(",").filter(Boolean);
    const pensum=wd.length/5;
    const curY=new Date().getFullYear();
    let count=0;
    for(let d=new Date(curY,0,1);d<=new Date(curY,11,31);d.setDate(d.getDate()+1)){const dow=d.getDay()||7;if(wd.includes(String(dow)))count++;}
    const holidayDeduction=(holidays||[]).filter(h=>h.year===curY).length*pensum;
    return Math.round((count-holidayDeduction)*10)/10;
  };

  // Brutto-Arbeitstage (vor Feiertagsabzug)
  const calcRawWorkdaysInYear=()=>{
    const wd=(form.work_days||"1,2,3,4,5").split(",").filter(Boolean);
    const curY=new Date().getFullYear();
    let count=0;
    for(let d=new Date(curY,0,1);d<=new Date(curY,11,31);d.setDate(d.getDate()+1)){const dow=d.getDay()||7;if(wd.includes(String(dow)))count++;}
    return count;
  };
  const onDailyChange=v=>{
    const dh=parseFloat(v);
    if(!isNaN(dh)&&dh>0){const raw=calcRawWorkdaysInYear();setForm(p=>({...p,daily_hours:v,annual_hours:String(Math.round(dh*raw*10)/10)}));}
    else setForm(p=>({...p,daily_hours:v,annual_hours:""}));
  };
  const onAnnualChange=v=>{
    const ah=parseFloat(v);
    if(!isNaN(ah)&&ah>0){const raw=calcRawWorkdaysInYear();setForm(p=>({...p,annual_hours:v,daily_hours:String(Math.round(ah/raw*100)/100)}));}
    else setForm(p=>({...p,annual_hours:v,daily_hours:""}));
  };

  const save=async()=>{
    if(!form.name.trim()||!form.username.trim()){setErr("Name und Benutzername sind Pflicht.");return;}
    if(!existing&&!form.password.trim()){setErr("Passwort ist Pflicht.");return;}
    setSaving(true);
    try{await onSave({...form,name:form.name.trim(),username:form.username.trim().toLowerCase(),password:form.password.trim()||existing?.password,daily_hours:form.daily_hours?parseFloat(form.daily_hours):null,annual_hours:form.annual_hours?parseFloat(form.annual_hours):null,vacation_days_per_year:parseInt(form.vacation_days_per_year)||25});}
    catch(e){setErr("Fehler: "+e.message);}finally{setSaving(false);}
  };
  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal">
      <div style={{fontSize:17,fontWeight:700,marginBottom:20}}>{existing?"Benutzer bearbeiten":"Neuer Benutzer"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="field-group"><label className="label">Vollständiger Name *</label><input className="input" value={form.name} onChange={e=>f("name")(e.target.value)} autoFocus/></div>
        <div className="grid-2">
          <div className="field-group"><label className="label">Benutzername *</label><input className="input" value={form.username} onChange={e=>f("username")(e.target.value)} autoCapitalize="none"/></div>
          <div className="field-group"><label className="label">Rolle</label><select className="input" value={form.role} onChange={e=>f("role")(e.target.value)}><option value="employee">Mitarbeiter</option><option value="admin">Admin</option></select></div>
        </div>
        <div className="field-group"><label className="label">Passwort {existing?"(leer = unverändert)":"*"}</label><input className="input" type="text" value={form.password} onChange={e=>f("password")(e.target.value)} placeholder={existing?"Neues Passwort…":"Passwort vergeben"}/>{existing&&<div className="pw-hint">Leer lassen = Passwort bleibt.</div>}</div>
        <div className="field-group"><label className="label">Anstellung</label>
          <select className="input" value={form.employment_type} onChange={e=>f("employment_type")(e.target.value)}>
            <option value="hourly">Stundenlohn</option>
            <option value="salaried">Festangestellt</option>
          </select>
        </div>
        {form.employment_type==="salaried"&&<>
          <div className="field-group"><label className="label">Arbeitstage</label>
            <div style={{display:"flex",gap:6,marginTop:4}}>
              {DAYS.map(d=><div key={d.v} className={`day-chip${(form.work_days||"").split(",").includes(d.v)?" active":""}`} onClick={()=>toggleDay(d.v)}>{d.l}</div>)}
            </div>
            <div className="pw-hint">{calcWorkdaysInYear()} Arbeitstage im {new Date().getFullYear()} (nach Feiertagen)</div>
          </div>
          <div className="grid-2">
            <div className="field-group"><label className="label">Jahreskapazität Brutto (Stunden)</label><input className="input" type="number" min="0" step="0.5" placeholder="z.B. 1900" value={form.annual_hours} onChange={e=>onAnnualChange(e.target.value)}/>{(()=>{const ah=parseFloat(form.annual_hours);const dh=parseFloat(form.daily_hours);const wd=(form.work_days||"1,2,3,4,5").split(",").filter(Boolean);const pensum=wd.length/5;const hdays=(holidays||[]).filter(h=>h.year===new Date().getFullYear()).length*pensum;if(!ah||!dh)return null;const netto=Math.round((ah-hdays*dh)*10)/10;return<div className="pw-hint">Netto nach Feiertagen: <b>{netto}h</b> (−{Math.round(hdays*dh*10)/10}h)</div>;})()}</div>
            <div className="field-group"><label className="label">Sollstunden / Tag</label><input className="input" type="number" min="0" max="24" step="0.01" placeholder="z.B. 8" value={form.daily_hours} onChange={e=>onDailyChange(e.target.value)}/></div>
          </div>
          <div className="grid-2">
            <div className="field-group"><label className="label">Ferientage / Jahr (100% Basis)</label><input className="input" type="number" min="0" max="365" placeholder="25" value={form.vacation_days_per_year} onChange={e=>f("vacation_days_per_year")(e.target.value)}/>{(()=>{const wd=(form.work_days||"1,2,3,4,5").split(",").filter(Boolean);const pensum=wd.length/5;const effective=Math.round((parseFloat(form.vacation_days_per_year)||25)*pensum*10)/10;return pensum<1?<div className="pw-hint">Bei {wd.length}/5 Tagen → effektiv <b>{effective} Tage</b>/Jahr</div>:null;})()}</div>
          </div>
        </>}
        {err&&<div className="msg-error">{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}><button className="btn btn-ghost" onClick={onClose}>Abbrechen</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Speichern…":"Speichern"}</button></div>
      </div>
    </div></div>
  );
}

function EntryModal({existing,projects,activities,products,onSave,onClose,swRunning,swSeconds,swTimerId,swStartWith,swPause,swStopClean}){
  const [form,setForm]=useState(existing?{date:existing.date,project:existing.project,activity:existing.activity,product:existing.product||"",hours:String(Math.floor(existing.total_min/60)),minutes:String(existing.total_min%60),note:existing.note||""}:{date:todayStr(),project:"",activity:"",product:"",hours:"",minutes:"",note:""});
  const [err,setErr]=useState("");const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(!form.project||!form.activity||(!form.hours&&!form.minutes)){setErr("Bitte Projekt, Tätigkeit und Zeit ausfüllen.");return;}
    const totalMin=(parseInt(form.hours||0)*60)+parseInt(form.minutes||0);
    if(totalMin<=0){setErr("Zeit muss grösser als 0 sein.");return;}
    setSaving(true);try{await onSave({...form,totalMin});}catch(e){setErr("Fehler: "+e.message);}finally{setSaving(false);}
  };
  const handleSwStop=async()=>{
    const elapsed=await swStopClean();
    const addMin=Math.round(elapsed/60);
    setForm(f=>{const prev=(parseInt(f.hours)||0)*60+(parseInt(f.minutes)||0);const total=prev+addMin;return{...f,hours:String(Math.floor(total/60)),minutes:String(total%60)};});
  };
  const swActive=swRunning||(!swRunning&&swTimerId);
  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal">
      <div style={{fontSize:17,fontWeight:700,marginBottom:20}}>{existing?"Eintrag bearbeiten":"Neuer Eintrag"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="grid-2">
          <div className="field-group"><label className="label">Datum *</label><input type="date" className="input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="field-group"><label className="label">Projekt *</label><Autocomplete value={form.project} onChange={v=>setForm(f=>({...f,project:v}))} options={projects} placeholder="Projekt suchen…"/></div>
        </div>
        <div className="grid-2">
          <div className="field-group"><label className="label">Tätigkeit *</label><Autocomplete value={form.activity} onChange={v=>setForm(f=>({...f,activity:v}))} options={activities} placeholder="Tätigkeit suchen…"/></div>
          <div style={{display:"flex",gap:10}}>
            <div className="field-group" style={{flex:1}}><label className="label">Stunden *</label><input type="number" min="0" max="24" className="input" placeholder="0" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})} inputMode="numeric"/></div>
            <div className="field-group" style={{flex:1}}><label className="label">Minuten</label><input type="number" min="0" max="59" className="input" placeholder="0" value={form.minutes} onChange={e=>setForm({...form,minutes:e.target.value})} inputMode="numeric"/></div>
          </div>
        </div>
        {/* Stoppuhr im Modal */}
        <div style={{background:"rgba(10,12,19,0.6)",border:"1px solid #1e2235",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div className={`stopwatch-display${swRunning?" stopwatch-running":swActive?" stopwatch-paused":""}`} style={{fontSize:28}}>
            {String(Math.floor(swSeconds/3600)).padStart(2,"0")}:{String(Math.floor((swSeconds%3600)/60)).padStart(2,"0")}:{String(swSeconds%60).padStart(2,"0")}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {!swRunning
              ? <button className="btn-start" style={{padding:"8px 16px",fontSize:13}} disabled={!form.project||!form.activity} onClick={()=>swStartWith(form.project,form.activity,form.note)}>{swSeconds>0?"▶ Weiter":"▶ Start"}</button>
              : <><button className="btn-pause" style={{padding:"8px 14px",fontSize:13}} onClick={swPause}>⏸</button>
                  <button className="btn-stop" style={{padding:"8px 16px",fontSize:13}} onClick={handleSwStop}>⏹ Addieren</button></>
            }
          </div>
          {!form.project&&<span style={{fontSize:11,color:"#8890b8"}}>Zuerst Projekt & Tätigkeit wählen</span>}
        </div>
        <div className="field-group"><label className="label">Produkt <span style={{color:"#8890b8",fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label><Autocomplete value={form.product} onChange={v=>setForm(f=>({...f,product:v}))} options={products} placeholder="Produkt suchen…"/></div>
        <div className="field-group"><label className="label">Bemerkung</label><textarea className="input" rows={2} placeholder="Optionale Bemerkung…" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
        {err&&<div className="msg-error">{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}><button className="btn btn-ghost" onClick={onClose}>Abbrechen</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Speichern…":"Speichern"}</button></div>
      </div>
    </div></div>
  );
}

// ─── Autocomplete Komponente ──────────────────────────────────────────────────
function Autocomplete({value,onChange,options,placeholder}){
  const [query,setQuery]=useState(value||"");
  const [open,setOpen]=useState(false);
  const [idx,setIdx]=useState(-1);
  const wrapRef=useRef(null);

  // Filtert Optionen: sucht in ALLEN Wörtern
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return options;
    return options.filter(o=>
      q.split(/\s+/).every(word=>o.toLowerCase().includes(word))
    );
  },[query,options]);

  // Highlight matching parts
  const highlight=(text,q)=>{
    const words=q.trim().split(/\s+/).filter(Boolean);
    if(!words.length)return text;
    const regex=new RegExp(`(${words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`, "gi");
    const parts=text.split(regex);
    return parts.map((p,i)=>regex.test(p)?<mark key={i}>{p}</mark>:p);
  };

  const select=(opt)=>{setQuery(opt);onChange(opt);setOpen(false);setIdx(-1);};

  const onKey=(e)=>{
    if(!open){if(e.key==="ArrowDown"){setOpen(true);setIdx(0);}return;}
    if(e.key==="ArrowDown"){e.preventDefault();setIdx(i=>Math.min(i+1,filtered.length-1));}
    else if(e.key==="ArrowUp"){e.preventDefault();setIdx(i=>Math.max(i-1,0));}
    else if(e.key==="Enter"){e.preventDefault();if(idx>=0&&filtered[idx])select(filtered[idx]);}
    else if(e.key==="Escape"){setOpen(false);setIdx(-1);}
  };

  // Sync wenn value von aussen geändert wird (z.B. Reset)
  useEffect(()=>{setQuery(value||"");},[value]);

  // Schliessen bei Klick ausserhalb
  useEffect(()=>{
    const h=(e)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  return(
    <div className="ac-wrap" ref={wrapRef}>
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        onChange={e=>{setQuery(e.target.value);onChange("");setOpen(true);setIdx(-1);}}
        onFocus={()=>setOpen(true)}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {open&&filtered.length>0&&(
        <div className="ac-list">
          {filtered.map((opt,i)=>(
            <div key={opt} className={`ac-item${i===idx?" active":""}`}
              onMouseDown={()=>select(opt)}>
              {highlight(opt,query)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PwModal({onSave,onClose}){
  const [oldPw,setOldPw]=useState(""); const [newPw,setNewPw]=useState(""); const [newPw2,setNewPw2]=useState("");
  const [err,setErr]=useState(""); const [ok,setOk]=useState(false); const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(!oldPw||!newPw||!newPw2){setErr("Alle Felder ausfüllen.");return;}
    if(newPw!==newPw2){setErr("Neues Passwort stimmt nicht überein.");return;}
    if(newPw.length<4){setErr("Passwort muss mindestens 4 Zeichen lang sein.");return;}
    setSaving(true);setErr("");
    try{await onSave(oldPw,newPw);setOk(true);setTimeout(onClose,1500);}
    catch(e){setErr(e.message);}finally{setSaving(false);}
  };
  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal" style={{maxWidth:380}}>
      <div style={{fontSize:17,fontWeight:700,marginBottom:20}}>🔑 Passwort ändern</div>
      {ok?<div className="msg-success">✓ Passwort erfolgreich geändert!</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="field-group"><label className="label">Aktuelles Passwort</label><input className="input" type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)} autoFocus/></div>
          <div className="field-group"><label className="label">Neues Passwort</label><input className="input" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}/></div>
          <div className="field-group"><label className="label">Neues Passwort wiederholen</label><input className="input" type="password" value={newPw2} onChange={e=>setNewPw2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}/></div>
          {err&&<div className="msg-error">{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Speichern…":"Speichern"}</button>
          </div>
        </div>
      )}
    </div></div>
  );
}

// ─── Hauptapp ─────────────────────────────────────────────────────────────────
export default function App(){
  const isConfigured=SUPABASE_URL!=="DEINE_SUPABASE_URL"&&SUPABASE_ANON_KEY!=="DEIN_SUPABASE_ANON_KEY";
  const [currentUser,setCurrentUser]=useState(()=>{try{const s=sessionStorage.getItem("ze_session");return s?JSON.parse(s):null;}catch{return null;}});
  const [view,setView]=useState(()=>currentUser?.role==="admin"?"auswertung":"eintragen");
  const [users,setUsers]=useState([]); const [entries,setEntries]=useState([]); const [projects,setProjects]=useState([]); const [activities,setActivities]=useState([]); const [products,setProducts]=useState([]);
  const [projectBudgets,setProjectBudgets]=useState({}); // {name: budget_hours|null}
  const [archivedProjects,setArchivedProjects]=useState([]); // nur archivierte Namen
  const [absences,setAbsences]=useState([]);
  const [holidays,setHolidays]=useState([]);
  const [holidayYear,setHolidayYear]=useState(new Date().getFullYear());
  const [hDate,setHDate]=useState("");const [hName,setHName]=useState("");
  const [absenceForm,setAbsenceForm]=useState({date:todayStr(),type:"frei",note:""});
  const [absenceSaving,setAbsenceSaving]=useState(false);
  const [dataReady,setDataReady]=useState(false);
  const isAdmin=currentUser?.role==="admin";

  const [entryModal,setEntryModal]=useState(null);
  const [formMsg,setFormMsg]=useState(null);
  const [selectedDate,setSelectedDate]=useState(todayStr());
  const FORM_KEY="ze_form_draft";
  const emptyForm=()=>({date:todayStr(),project:"",activity:"",product:"",hours:"",minutes:"",note:""});
  const [inlineForm,setInlineForm]=useState(()=>{
    try{const s=localStorage.getItem(FORM_KEY);return s?JSON.parse(s):emptyForm();}catch{return emptyForm();}
  });
  const [inlineSaving,setInlineSaving]=useState(false);

  // Draft live in localStorage speichern
  useEffect(()=>{
    try{localStorage.setItem(FORM_KEY,JSON.stringify(inlineForm));}catch{}
  },[inlineForm]);
  const [dropdownOpen,setDropdownOpen]=useState(false);
  const [pwModal,setPwModal]=useState(false);
  // Stoppuhr — persistent via Supabase (geräteübergreifend)
  const [swRunning,setSwRunning]=useState(false);
  const [swSeconds,setSwSeconds]=useState(0);
  const [swTimerId,setSwTimerId]=useState(null);
  const swRef=useRef(null);

  // Beim Laden: aktive Timer-Session aus Supabase laden
  useEffect(()=>{
    if(!currentUser)return;
    sb.select("timers",`?user_id=eq.${currentUser.id}&select=*&limit=1`).then(rows=>{
      if(rows.length){
        const row=rows[0];
        setSwTimerId(row.id);
        setInlineForm(f=>({...f,project:row.project||"",activity:row.activity||"",note:row.note||""}));
        if(row.is_paused){
          setSwSeconds(row.elapsed_seconds||0);
          setSwRunning(false);
        } else {
          const secs=Math.floor((Date.now()-new Date(row.started_at).getTime())/1000);
          setSwSeconds(secs);
          setSwRunning(true);
        }
      }
    }).catch(()=>{});
  },[currentUser]);

  // Ticker: läuft nur wenn Uhr aktiv ist
  useEffect(()=>{
    if(!swRunning){clearInterval(swRef.current);return;}
    swRef.current=setInterval(()=>setSwSeconds(s=>s+1),1000);
    return()=>clearInterval(swRef.current);
  },[swRunning]);

  // Tab wird wieder sichtbar → Zeit aus Supabase neu berechnen
  useEffect(()=>{
    const onVisible=async()=>{
      if(document.visibilityState!=="visible"||!swTimerId)return;
      try{
        const rows=await sb.select("timers",`?id=eq.${swTimerId}&select=*&limit=1`);
        if(!rows.length){clearInterval(swRef.current);setSwRunning(false);setSwTimerId(null);setSwSeconds(0);}
        else if(rows[0].is_paused){setSwSeconds(rows[0].elapsed_seconds||0);setSwRunning(false);}
        else{const secs=Math.floor((Date.now()-new Date(rows[0].started_at).getTime())/1000);setSwSeconds(secs);}
      }catch{}
    };
    document.addEventListener("visibilitychange",onVisible);
    return()=>document.removeEventListener("visibilitychange",onVisible);
  },[swTimerId]);

  // Polling: alle 5s prüfen ob Timer noch existiert — auch im Pause-Zustand
  useEffect(()=>{
    if(!swTimerId)return;
    const pollRef=setInterval(async()=>{
      try{
        const rows=await sb.select("timers",`?id=eq.${swTimerId}&select=id,is_paused,elapsed_seconds&limit=1`);
        if(!rows.length){
          // Timer wurde auf anderem Gerät gelöscht
          clearInterval(swRef.current);
          setSwRunning(false);
          setSwTimerId(null);
          setSwSeconds(0);
        } else if(rows[0].is_paused&&swRunning){
          // Auf anderem Gerät pausiert
          clearInterval(swRef.current);
          setSwRunning(false);
          setSwSeconds(rows[0].elapsed_seconds||0);
        } else if(!rows[0].is_paused&&!swRunning){
          // Auf anderem Gerät fortgesetzt — hier nur Ticker starten, Zeit kommt aus started_at beim nächsten Reload
          setSwRunning(true);
        }
      }catch{}
    },5000);
    return()=>clearInterval(pollRef);
  },[swTimerId,swRunning]);

  // Meta-Daten live in Supabase aktualisieren wenn Uhr läuft
  const swMetaRef=useRef(null);
  useEffect(()=>{
    if(!swRunning||!swTimerId)return;
    clearTimeout(swMetaRef.current);
    swMetaRef.current=setTimeout(()=>{
      sb.update("timers",swTimerId,{project:inlineForm.project,activity:inlineForm.activity,note:inlineForm.note}).catch(()=>{});
    },800);
  },[inlineForm.project,inlineForm.activity,inlineForm.note,swRunning,swTimerId]);

  const swStart=async()=>{
    if(swRunning)return;
    if(!inlineForm.project||!inlineForm.activity)return;
    try{
      if(swTimerId){
        // Fortsetzen nach Pause: Row in Supabase updaten
        await sb.update("timers",swTimerId,{is_paused:false,elapsed_seconds:0,started_at:new Date(Date.now()-swSeconds*1000).toISOString(),project:inlineForm.project,activity:inlineForm.activity,note:inlineForm.note||null});
      } else {
        // Neu starten
        const rows=await sb.insert("timers",{user_id:currentUser.id,started_at:new Date(Date.now()-swSeconds*1000).toISOString(),project:inlineForm.project,activity:inlineForm.activity,note:inlineForm.note||null,elapsed_seconds:0,is_paused:false});
        setSwTimerId(rows[0].id);
      }
      setSwRunning(true);
    }catch(e){alert("Fehler beim Starten: "+e.message);}
  };
  const swPause=async()=>{
    if(!swRunning||!swTimerId)return;
    clearInterval(swRef.current);
    try{
      await sb.update("timers",swTimerId,{is_paused:true,elapsed_seconds:swSeconds});
      setSwRunning(false);
      // swTimerId und swSeconds bleiben erhalten → geräteübergreifend sichtbar
    }catch(e){alert("Fehler beim Pausieren: "+e.message);}
  };
  const swStop=async()=>{
    clearInterval(swRef.current);
    if(swTimerId){try{await sb.remove("timers",swTimerId);}catch{}}
    setSwRunning(false);
    setSwTimerId(null);
    const totalMin=Math.round(swSeconds/60);
    setInlineForm(f=>{
      const prevMin=(parseInt(f.hours)||0)*60+(parseInt(f.minutes)||0);
      const newMin=prevMin+totalMin;
      return {...f,hours:String(Math.floor(newMin/60)),minutes:String(newMin%60)};
    });
    setSwSeconds(0);
  };
  const swReset=async()=>{
    clearInterval(swRef.current);
    if(swTimerId){try{await sb.remove("timers",swTimerId);}catch{}}
    setSwRunning(false);
    setSwTimerId(null);
    setSwSeconds(0);
  };
  // Starten mit expliziten Werten (z.B. aus EntryModal)
  const swStartWith=async(project,activity,note)=>{
    if(swRunning)return;
    if(!project||!activity)return;
    try{
      if(swTimerId){
        await sb.update("timers",swTimerId,{is_paused:false,elapsed_seconds:0,started_at:new Date(Date.now()-swSeconds*1000).toISOString(),project,activity,note:note||null});
      }else{
        const rows=await sb.insert("timers",{user_id:currentUser.id,started_at:new Date(Date.now()-swSeconds*1000).toISOString(),project,activity,note:note||null,elapsed_seconds:0,is_paused:false});
        setSwTimerId(rows[0].id);
      }
      setSwRunning(true);
    }catch(e){alert("Fehler beim Starten: "+e.message);}
  };
  // Stoppen ohne inlineForm zu überschreiben (für EntryModal)
  const swStopClean=async()=>{
    clearInterval(swRef.current);
    if(swTimerId){try{await sb.remove("timers",swTimerId);}catch{}}
    setSwRunning(false);
    setSwTimerId(null);
    const elapsed=swSeconds;
    setSwSeconds(0);
    return elapsed;
  };
  const [newProject,setNewProject]=useState(""); const [newActivity,setNewActivity]=useState(""); const [newProduct,setNewProduct]=useState("");
  const [budgetDraft,setBudgetDraft]=useState({}); // {name: string} für Verwaltung-Inputs
  const [editingProject,setEditingProject]=useState(null); // {orig, val}
  const [editingActivity,setEditingActivity]=useState(null);
  const [editingProduct,setEditingProduct]=useState(null);
  const [userModal,setUserModal]=useState(null);
  const [projektAuswahlOpen,setProjektAuswahlOpen]=useState(false);

  const now=new Date();
  const [fromMonth,setFromMonth]=useState(now.getMonth()); const [fromYear,setFromYear]=useState(now.getFullYear());
  const [toMonth,setToMonth]=useState(now.getMonth());     const [toYear,setToYear]=useState(now.getFullYear());
  const [filterProject,setFilterProject]=useState("alle"); const [filterActivity,setFilterActivity]=useState("alle"); const [filterEmployee,setFilterEmployee]=useState("alle"); const [filterNote,setFilterNote]=useState("");
  const [abschlussMonth,setAbschlussMonth]=useState(now.getMonth()); const [abschlussYear,setAbschlussYear]=useState(now.getFullYear());

  const loadData=useCallback(async()=>{
    if(!isConfigured||!currentUser)return;
    try{const [u,e,p,a,pr,abs,hol]=await Promise.all([sb.select("users","?select=*&order=name"),sb.select("entries","?select=*&order=date.desc,id.desc"),sb.select("projects","?select=*&order=name"),sb.select("activities","?select=*&order=name"),sb.select("products","?select=*&order=name"),sb.select("absences","?select=*&order=date.desc"),sb.select("holidays","?select=*&order=date.asc")]);setUsers(u);setEntries(e);setProjects(p.filter(r=>!r.is_archived).map(r=>r.name));setArchivedProjects(p.filter(r=>r.is_archived).map(r=>r.name));setActivities(a.map(r=>r.name));setProducts(pr.map(r=>r.name));setAbsences(abs);setHolidays(hol);
      const budgets=Object.fromEntries(p.map(r=>[r.name,r.budget_hours??null]));setProjectBudgets(budgets);setBudgetDraft(Object.fromEntries(p.map(r=>[r.name,r.budget_hours!=null?String(r.budget_hours):""])));}
    catch(err){console.error("Ladefehler:",err);}finally{setDataReady(true);}
  },[currentUser,isConfigured]);

  useEffect(()=>{if(currentUser&&isConfigured)loadData();},[loadData]);
  const login=(u)=>{setCurrentUser(u);try{sessionStorage.setItem("ze_session",JSON.stringify(u));}catch{}setView(u.role==="admin"?"auswertung":"eintragen");};
  const logout=()=>{setCurrentUser(null);setDataReady(false);try{sessionStorage.removeItem("ze_session");}catch{}};

  const saveEntry=async({date,project,activity,product,totalMin,note},isEdit=false)=>{
    if(isEdit&&entryModal){const updated=await sb.update("entries",entryModal.id,{date,project,activity,product:product||null,total_min:totalMin,note:note||null});setEntries(prev=>prev.map(e=>e.id===entryModal.id?updated[0]:e));setFormMsg({type:"success",text:"✓ Eintrag aktualisiert!"});setEntryModal(null);}
    else{const created=await sb.insert("entries",{date,employee_id:currentUser.id,employee_name:currentUser.name,project,activity,product:product||null,total_min:totalMin,note:note||null});setEntries(prev=>[created[0],...prev]);setFormMsg({type:"success",text:"✓ Eintrag gespeichert!"});}
    setTimeout(()=>setFormMsg(null),2500);
  };
  const submitInlineForm=async()=>{
    if(!inlineForm.project||!inlineForm.activity||(!inlineForm.hours&&!inlineForm.minutes)){setFormMsg({type:"error",text:"Bitte Projekt, Tätigkeit und Zeit ausfüllen."});return;}
    const totalMin=(parseInt(inlineForm.hours||0)*60)+parseInt(inlineForm.minutes||0);
    if(totalMin<=0){setFormMsg({type:"error",text:"Zeit muss grösser als 0 sein."});return;}
    setInlineSaving(true);
    try{
      await saveEntry({...inlineForm,totalMin});
      const fresh=emptyForm();
      setInlineForm(fresh);
      try{localStorage.removeItem(FORM_KEY);}catch{}
    }
    catch(e){setFormMsg({type:"error",text:"Fehler: "+e.message});}
    finally{setInlineSaving(false);}
  };
  const changePassword=async(oldPw,newPw)=>{
    if(currentUser.password!==oldPw)throw new Error("Aktuelles Passwort ist falsch.");
    const updated=await sb.update("users",currentUser.id,{password:newPw});
    const u=updated[0];setCurrentUser(u);try{sessionStorage.setItem("ze_session",JSON.stringify(u));}catch{}
  };
  const deleteEntry=async(id)=>{if(!window.confirm("Eintrag löschen?"))return;try{await sb.remove("entries",id);setEntries(prev=>prev.filter(e=>e.id!==id));}catch(e){alert("Fehler: "+e.message);}};
  const renameProject=async()=>{
    if(!editingProject)return;
    const {orig,val}=editingProject;
    const newName=val.trim();
    if(!newName||newName===orig){setEditingProject(null);return;}
    try{
      const r=await sb.select("projects",`?name=eq.${encodeURIComponent(orig)}`);
      if(r[0])await sb.update("projects",r[0].id,{name:newName});
      await sb.updateWhere("entries",`project=eq.${encodeURIComponent(orig)}`,{project:newName});
      setProjects(prev=>prev.map(p=>p===orig?newName:p).sort());
      setEntries(prev=>prev.map(e=>e.project===orig?{...e,project:newName}:e));
      setProjectBudgets(prev=>{const next={...prev};next[newName]=next[orig];delete next[orig];return next;});
      setBudgetDraft(prev=>{const next={...prev};next[newName]=next[orig]??"";delete next[orig];return next;});
      setEditingProject(null);
    }catch(e){alert("Fehler: "+e.message);}
  };
  const renameActivity=async()=>{
    if(!editingActivity)return;
    const {orig,val}=editingActivity;
    const newName=val.trim();
    if(!newName||newName===orig){setEditingActivity(null);return;}
    try{
      const r=await sb.select("activities",`?name=eq.${encodeURIComponent(orig)}`);
      if(r[0])await sb.update("activities",r[0].id,{name:newName});
      await sb.updateWhere("entries",`activity=eq.${encodeURIComponent(orig)}`,{activity:newName});
      setActivities(prev=>prev.map(a=>a===orig?newName:a).sort());
      setEntries(prev=>prev.map(e=>e.activity===orig?{...e,activity:newName}:e));
      setEditingActivity(null);
    }catch(e){alert("Fehler: "+e.message);}
  };
  const renameProduct=async()=>{
    if(!editingProduct)return;
    const {orig,val}=editingProduct;
    const newName=val.trim();
    if(!newName||newName===orig){setEditingProduct(null);return;}
    try{
      const r=await sb.select("products",`?name=eq.${encodeURIComponent(orig)}`);
      if(r[0])await sb.update("products",r[0].id,{name:newName});
      await sb.updateWhere("entries",`product=eq.${encodeURIComponent(orig)}`,{product:newName});
      setProducts(prev=>prev.map(p=>p===orig?newName:p).sort());
      setEntries(prev=>prev.map(e=>e.product===orig?{...e,product:newName}:e));
      setEditingProduct(null);
    }catch(e){alert("Fehler: "+e.message);}
  };
  const archiveProject=async(name)=>{
    try{const r=await sb.select("projects",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.update("projects",r[0].id,{is_archived:true});setProjects(prev=>prev.filter(p=>p!==name));setArchivedProjects(prev=>[...prev,name].sort());}catch(e){alert("Fehler: "+e.message);}
  };
  const restoreProject=async(name)=>{
    try{const r=await sb.select("projects",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.update("projects",r[0].id,{is_archived:false});setArchivedProjects(prev=>prev.filter(p=>p!==name));setProjects(prev=>[...prev,name].sort());}catch(e){alert("Fehler: "+e.message);}
  };
  const saveBudget=async(name)=>{
    const hours=parseFloat(budgetDraft[name]);
    const val=(isNaN(hours)||hours<=0)?null:hours;
    try{const r=await sb.select("projects",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.update("projects",r[0].id,{budget_hours:val});setProjectBudgets(prev=>({...prev,[name]:val}));}catch(e){alert("Fehler: "+e.message);}
  };
  const addProject=async()=>{if(!newProject.trim())return;try{await sb.insert("projects",{name:newProject.trim()});setProjects(prev=>[...prev,newProject.trim()].sort());setNewProject("");}catch(e){alert("Fehler: "+e.message);}};
  const removeProject=async(name)=>{try{const r=await sb.select("projects",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.remove("projects",r[0].id);setProjects(prev=>prev.filter(p=>p!==name));}catch(e){alert("Fehler: "+e.message);}};
  const addActivity=async()=>{if(!newActivity.trim())return;try{await sb.insert("activities",{name:newActivity.trim()});setActivities(prev=>[...prev,newActivity.trim()].sort());setNewActivity("");}catch(e){alert("Fehler: "+e.message);}};
  const removeActivity=async(name)=>{try{const r=await sb.select("activities",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.remove("activities",r[0].id);setActivities(prev=>prev.filter(a=>a!==name));}catch(e){alert("Fehler: "+e.message);}};
  const addProduct=async()=>{if(!newProduct.trim())return;try{await sb.insert("products",{name:newProduct.trim()});setProducts(prev=>[...prev,newProduct.trim()].sort());setNewProduct("");}catch(e){alert("Fehler: "+e.message);}};
  const removeProduct=async(name)=>{try{const r=await sb.select("products",`?name=eq.${encodeURIComponent(name)}`);if(r[0])await sb.remove("products",r[0].id);setProducts(prev=>prev.filter(p=>p!==name));}catch(e){alert("Fehler: "+e.message);}};
  const saveUser=async(data)=>{if(userModal&&userModal!=="new"){const updated=await sb.update("users",userModal.id,{name:data.name,username:data.username,role:data.role,password:data.password||userModal.password,employment_type:data.employment_type||"hourly",daily_hours:data.daily_hours??null,work_days:data.work_days||"1,2,3,4,5",vacation_days_per_year:data.vacation_days_per_year||25});setUsers(prev=>prev.map(u=>u.id===userModal.id?updated[0]:u));if(currentUser.id===userModal.id){const f=updated[0];setCurrentUser(f);try{sessionStorage.setItem("ze_session",JSON.stringify(f));}catch{}}}else{const c=await sb.insert("users",data);setUsers(prev=>[...prev,c[0]]);}setUserModal(null);};
  const deleteUser=async(id)=>{if(id===currentUser.id||!window.confirm("Benutzer löschen?"))return;try{await sb.remove("users",id);setUsers(prev=>prev.filter(u=>u.id!==id));}catch(e){alert("Fehler: "+e.message);}};

  const fetchHolidays=async(year)=>{
    try{
      const url=`https://openholidaysapi.org/PublicHolidays?countryIsoCode=CH&subdivisionCode=CH-LU&validFrom=${year}-01-01&validTo=${year}-12-31&languageIsoCode=DE`;
      const r=await fetch(url);if(!r.ok)throw new Error("API nicht erreichbar");
      const data=await r.json();
      const existing=holidays.filter(h=>h.year===year);
      await Promise.all(existing.map(h=>sb.remove("holidays",h.id)));
      const inserted=await Promise.all(data.map(h=>sb.insert("holidays",{date:h.startDate,name:h.name.find(n=>n.language==="DE")?.text||h.name[0]?.text||"Feiertag",year})));
      setHolidays(prev=>[...prev.filter(h=>h.year!==year),...inserted.map(i=>i[0])]);
    }catch(e){alert("Fehler beim Laden der Feiertage: "+e.message);}
  };
  const addHoliday=async(date,name,year)=>{
    try{const r=await sb.insert("holidays",{date,name,year});setHolidays(prev=>[...prev,r[0]].sort((a,b)=>a.date.localeCompare(b.date)));}catch(e){alert("Fehler: "+e.message);}
  };
  const deleteHoliday=async(id)=>{try{await sb.remove("holidays",id);setHolidays(prev=>prev.filter(h=>h.id!==id));}catch(e){alert("Fehler: "+e.message);}};
  const addAbsence=async()=>{
    if(!absenceForm.date)return;
    setAbsenceSaving(true);
    try{const r=await sb.insert("absences",{user_id:currentUser.id,date:absenceForm.date,type:absenceForm.type,note:absenceForm.note||null});setAbsences(prev=>[r[0],...prev]);setAbsenceForm({date:todayStr(),type:"frei",note:""});}
    catch(e){alert("Fehler: "+e.message);}finally{setAbsenceSaving(false);}
  };
  const addAbsenceForUser=async(userId,date,type,note)=>{
    try{const r=await sb.insert("absences",{user_id:userId,date,type,note:note||null});setAbsences(prev=>[r[0],...prev]);}catch(e){alert("Fehler: "+e.message);}
  };
  const deleteAbsence=async(id)=>{try{await sb.remove("absences",id);setAbsences(prev=>prev.filter(a=>a.id!==id));}catch(e){alert("Fehler: "+e.message);}};

  // ─── Arbeitszeit-Helpers ───────────────────────────────────────────────────
  const parseWorkDays=wd=>(wd||"1,2,3,4,5").split(",").map(Number);
  const calcVacBalance=useCallback((userId)=>{
    const user=users.find(u=>u.id===userId);
    if(!user||user.employment_type!=="salaried")return null;
    const wd=parseWorkDays(user.work_days);
    const curYear=new Date().getFullYear();
    const allDates=[...entries.filter(e=>e.employee_id===userId).map(e=>e.date),...absences.filter(a=>a.user_id===userId).map(a=>a.date)];
    const minYear=allDates.length>0?Math.min(...allDates.map(d=>parseInt(d.substring(0,4)))):curYear;
    const pensum=wd.length/5;
    const vacPerYearScaled=parseFloat(user.vacation_days_per_year||25)*pensum;
    let totalDays=0;
    for(let y=minYear;y<=curYear;y++){
      totalDays+=vacPerYearScaled;
    }
    const usedFrei=absences.filter(a=>a.user_id===userId&&a.type==="frei").length;
    const sickDays=absences.filter(a=>a.user_id===userId&&a.type==="krank").length;
    const holidayDaysThisYear=holidays.filter(h=>h.year===curYear).length*pensum;
    return{total:totalDays,used:usedFrei,remaining:totalDays-usedFrei,sick:sickDays,holidayDaysThisYear,vacPerYear:vacPerYearScaled};
  },[users,absences,holidays,entries]);

  const calcSollIst=useCallback((userId,month,year)=>{
    const user=users.find(u=>u.id===userId);
    if(!user||user.employment_type!=="salaried"||!user.daily_hours)return null;
    const wd=parseWorkDays(user.work_days);
    const pensum=wd.length/5;
    const daysInMonth=new Date(year,month+1,0).getDate();
    let workDays=0;
    for(let d=1;d<=daysInMonth;d++){const dow=(new Date(year,month,d).getDay())||7;if(wd.includes(dow))workDays++;}
    const holidaysInMonth=holidays.filter(h=>{const d=new Date(h.date);return d.getFullYear()===year&&d.getMonth()===month;}).length*pensum;
    const monthStr=`${year}-${String(month+1).padStart(2,"0")}`;
    const freiInMonth=absences.filter(a=>a.user_id===userId&&a.type==="frei"&&a.date.startsWith(monthStr)).length;
    const krankInMonth=absences.filter(a=>a.user_id===userId&&a.type==="krank"&&a.date.startsWith(monthStr)).length;
    const sollMin=(workDays-holidaysInMonth)*user.daily_hours*60;
    const istEntries=entries.filter(e=>e.employee_id===userId&&e.date.startsWith(monthStr)).reduce((s,e)=>s+e.total_min,0);
    const istMin=istEntries+((freiInMonth+krankInMonth)*user.daily_hours*60);
    return{sollMin,istMin,diff:istMin-sollMin,workDays,freiInMonth,krankInMonth};
  },[users,absences,entries]);

  const calcRunningBalance=useCallback((userId,untilMonth,untilYear)=>{
    const user=users.find(u=>u.id===userId);
    if(!user||user.employment_type!=="salaried"||!user.daily_hours)return null;
    const allDates=entries.filter(e=>e.employee_id===userId).map(e=>e.date);
    const absenceDates=absences.filter(a=>a.user_id===userId).map(a=>a.date);
    const allD=[...allDates,...absenceDates];
    if(!allD.length)return{cumulativeDiff:0,months:[]};
    const firstDate=allD.reduce((a,b)=>a<b?a:b);
    const startYear=parseInt(firstDate.substring(0,4));
    const startMonth=parseInt(firstDate.substring(5,7))-1;
    let cumulativeDiff=0;
    const months=[];
    let y=startYear,m=startMonth;
    while(y<untilYear||(y===untilYear&&m<=untilMonth)){
      const si=calcSollIst(userId,m,y);
      if(si){cumulativeDiff+=si.diff;months.push({year:y,month:m,...si,runningDiff:cumulativeDiff});}
      m++;if(m>11){m=0;y++;}
    }
    return{cumulativeDiff,months};
  },[users,entries,absences,calcSollIst]);

  const myEntries=useMemo(()=>entries.filter(e=>e.employee_id===currentUser?.id),[entries,currentUser]);
  const dayTotal=useMemo(()=>myEntries.filter(e=>e.date===inlineForm.date).reduce((s,e)=>s+e.total_min,0),[myEntries,inlineForm.date]);

  const filteredEntries=useMemo(()=>{
    const base=isAdmin?entries:myEntries;
    const fYM=toYM(fromYear,fromMonth),tYM=toYM(toYear,toMonth);
    const noteQ=filterNote.trim().toLowerCase();
    return base.filter(e=>{const d=new Date(e.date);const ym=toYM(d.getFullYear(),d.getMonth());return ym>=fYM&&ym<=tYM&&(filterProject==="alle"||e.project===filterProject)&&(filterActivity==="alle"||e.activity===filterActivity)&&(!isAdmin||filterEmployee==="alle"||e.employee_name===filterEmployee)&&(!noteQ||(e.note||"").toLowerCase().includes(noteQ));});
  },[entries,myEntries,isAdmin,fromMonth,fromYear,toMonth,toYear,filterProject,filterActivity,filterEmployee,filterNote]);

  const projectStats=useMemo(()=>{const m={};filteredEntries.forEach(e=>{if(!m[e.project])m[e.project]=0;m[e.project]+=e.total_min;});return Object.entries(m).sort((a,b)=>b[1]-a[1]);},[filteredEntries]);
  const activityStats=useMemo(()=>{const m={};filteredEntries.forEach(e=>{if(!m[e.activity])m[e.activity]=0;m[e.activity]+=e.total_min;});return Object.entries(m).sort((a,b)=>b[1]-a[1]);},[filteredEntries]);

  // Projekte die im gewählten Zeitraum vorkommen (für Projektauswahl-Modal)
  const projectsInRange=useMemo(()=>[...new Set(filteredEntries.map(e=>e.project))].sort(),[filteredEntries]);

  const abschlussEntries=useMemo(()=>entries.filter(e=>{const d=new Date(e.date);return d.getMonth()===abschlussMonth&&d.getFullYear()===abschlussYear;}),[entries,abschlussMonth,abschlussYear]);
  const abschlussPerEmp=useMemo(()=>{const map={};abschlussEntries.forEach(e=>{if(!map[e.employee_id])map[e.employee_id]={name:e.employee_name,totalMin:0,entries:[]};map[e.employee_id].totalMin+=e.total_min;map[e.employee_id].entries.push(e);});return Object.values(map).sort((a,b)=>b.totalMin-a.totalMin);},[abschlussEntries]);

  const totalFiltered=filteredEntries.reduce((s,e)=>s+e.total_min,0);
  const maxStat=Math.max(...projectStats.map(s=>s[1]),1);
  const maxAct=Math.max(...activityStats.map(s=>s[1]),1);

  const navItems=[...(!isAdmin?[{id:"eintragen",icon:"⏱",label:"Eintragen"}]:[]),{id:"auswertung",icon:"📊",label:"Auswertung"},...(isAdmin?[{id:"abschluss",icon:"📋",label:"Abschluss"},{id:"verwaltung",icon:"⚙️",label:"Verwaltung"}]:[])];

  if(!isConfigured)return <><style>{CSS}</style><ConfigScreen/></>;
  if(!currentUser) return <><style>{CSS}</style><LoginScreen onLogin={login}/></>;
  if(!dataReady)   return <div className="loading"><style>{CSS}</style><div className="spinner"/><div style={{color:"#8890b8",fontSize:13}}>Daten werden geladen…</div></div>;

  return(
    <div style={{minHeight:"100vh",background:"#0a0c13",color:"#e0e4f8"}}>
      <style>{CSS}</style>
      {userModal&&<UserModal existing={userModal==="new"?null:userModal} onSave={saveUser} onClose={()=>setUserModal(null)} holidays={holidays}/>}
      {entryModal&&<EntryModal existing={entryModal} projects={projects} activities={activities} products={products} onSave={(d)=>saveEntry(d,true)} onClose={()=>setEntryModal(null)} swRunning={swRunning} swSeconds={swSeconds} swTimerId={swTimerId} swStartWith={swStartWith} swPause={swPause} swStopClean={swStopClean}/>}
      {pwModal&&<PwModal onSave={changePassword} onClose={()=>setPwModal(false)}/>}
      {projektAuswahlOpen&&(
        <ProjektAuswahlModal
          allProjects={projectsInRange}
          projectStats={projectStats}
          onExport={(sel)=>{
            setProjektAuswahlOpen(false);
            exportProjektauswertungExcel({entries:filteredEntries,selectedProjects:sel,fromMonth,fromYear,toMonth,toYear});
          }}
          onClose={()=>setProjektAuswahlOpen(false)}
        />
      )}

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
          <div className="dropdown-wrap">
            <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 8px",borderRadius:10,transition:"background .15s"}}
              onClick={()=>setDropdownOpen(o=>!o)}
              onBlur={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(false); }}
              tabIndex={0}>
              <div className="header-name" style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:600}}>{currentUser.name}</div>
                <span className={isAdmin?"badge-admin":"badge-emp"} style={{fontSize:10}}>{isAdmin?"Admin":"Mitarbeiter"}</span>
              </div>
              <div className="avatar" style={{width:32,height:32,fontSize:12}}>{initials(currentUser.name)}</div>
              <span style={{color:"#8890b8",fontSize:11}}>▾</span>
            </div>
            {dropdownOpen&&(
              <div className="dropdown-menu">
                <div style={{padding:"8px 12px 6px",borderBottom:"1px solid #2a2e48",marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#e0e4f8"}}>{currentUser.name}</div>
                  <div style={{fontSize:11,color:"#8890b8"}}>@{currentUser.username}</div>
                </div>
                <button className="dropdown-item" onMouseDown={()=>{setDropdownOpen(false);setPwModal(true);}}>🔑 Passwort ändern</button>
                <div className="dropdown-divider"/>
                <button className="dropdown-item danger" onMouseDown={logout}>🚪 Logout</button>
              </div>
            )}
          </div>
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
            <div style={{marginBottom:16}}>
              <h1 style={{fontSize:21,fontWeight:700}}>Zeiteintrag erfassen</h1>
              <p style={{color:"#8890b8",fontSize:13,marginTop:4}}>Erfassung als: <strong style={{color:"#7c8bff"}}>{currentUser.name}</strong></p>
            </div>

            {/* Inline-Erfassungsformular */}
            <div className="card" style={{marginBottom:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Zeile 1: Datum + Tagestotal */}
                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <div className="field-group" style={{flex:"1 1 160px",maxWidth:220}}>
                    <label className="label">Datum</label>
                    <input type="date" className="input" value={inlineForm.date} onChange={e=>setInlineForm(f=>({...f,date:e.target.value}))}/>
                  </div>
                  <div style={{flex:"1 1 180px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#8890b8",letterSpacing:".07em",textTransform:"uppercase",marginBottom:4}}>Tagestotal</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:24,fontWeight:500,color:dayTotal>0?"#4dffaa":"#2a2e48"}}>{fmtTime(dayTotal)}</span>
                      {dayTotal>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#8890b8"}}>{fmtDecimal(dayTotal)} h</span>}
                    </div>
                    {(()=>{const u=users.find(u=>u.id===currentUser?.id);if(!u||u.employment_type!=="salaried"||!u.daily_hours)return null;const sollMin=Math.round(u.daily_hours*60);const diff=dayTotal-sollMin;return<div style={{fontSize:11,color:"#8890b8",marginTop:3}}>Soll: <span style={{color:"#9aa2c8",fontFamily:"'DM Mono',monospace"}}>{fmtTime(sollMin)}</span>{dayTotal>0&&<span style={{marginLeft:6,fontWeight:700,color:diff>=0?"#4dffaa":"#ff6b85"}}>{diff>=0?"+":""}{fmtTime(Math.abs(diff))}</span>}</div>;})()}
                  </div>
                </div>
                {/* Zeile 2: Projekt + Tätigkeit + Produkt */}
                <div className="grid-2">
                  <div className="field-group">
                    <label className="label">Projekt *</label>
                    <Autocomplete value={inlineForm.project} onChange={v=>setInlineForm(f=>({...f,project:v}))} options={projects} placeholder="Projekt suchen…"/>
                  </div>
                  <div className="field-group">
                    <label className="label">Tätigkeit *</label>
                    <Autocomplete value={inlineForm.activity} onChange={v=>setInlineForm(f=>({...f,activity:v}))} options={activities} placeholder="Tätigkeit suchen…"/>
                  </div>
                </div>
                <div className="field-group">
                  <label className="label">Produkt <span style={{color:"#8890b8",fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                  <Autocomplete value={inlineForm.product} onChange={v=>setInlineForm(f=>({...f,product:v}))} options={products} placeholder="Produkt suchen…"/>
                </div>
                {/* Zeile 3: Zeit (manuell oder Stoppuhr) + Bemerkung */}
                <div className="grid-2">
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {/* Stoppuhr */}
                    <div style={{background:"rgba(10,12,19,0.6)",border:"1px solid #1e2235",borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
                      <div className={`stopwatch-display${swRunning?" stopwatch-running":(!swRunning&&swTimerId?" stopwatch-paused":"")}`}>
                        {String(Math.floor(swSeconds/3600)).padStart(2,"0")}:{String(Math.floor((swSeconds%3600)/60)).padStart(2,"0")}:{String(swSeconds%60).padStart(2,"0")}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
                        {!swRunning
                          ? <button className="btn-start" disabled={!inlineForm.project||!inlineForm.activity} onClick={swStart}>{swSeconds>0?"▶ Weiter":"▶ Starten"}</button>
                          : <><button className="btn-pause" onClick={swPause}>⏸ Pause</button><button className="btn-stop" onClick={swStop}>⏹ Übernehmen</button></>
                        }
                        {swSeconds>0&&!swRunning&&<button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:13}} onClick={swReset}>↺ Reset</button>}
                      </div>
                      {!swRunning&&swTimerId&&swSeconds>0&&<div style={{fontSize:11,color:"#ffbe32"}}>⏸ Pausiert — auch auf anderen Geräten gespeichert</div>}
                      {!inlineForm.project&&<div style={{fontSize:11,color:"#8890b8"}}>Zuerst Projekt & Tätigkeit wählen</div>}
                    </div>
                    {/* Manuelle Eingabe */}
                    <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                      <div className="field-group" style={{flex:1}}>
                        <label className="label">Stunden *</label>
                        <input type="number" min="0" max="24" className="input" placeholder="0" value={inlineForm.hours} onChange={e=>setInlineForm(f=>({...f,hours:e.target.value}))} inputMode="numeric"/>
                      </div>
                      <div className="field-group" style={{flex:1}}>
                        <label className="label">Minuten</label>
                        <input type="number" min="0" max="59" className="input" placeholder="0" value={inlineForm.minutes} onChange={e=>setInlineForm(f=>({...f,minutes:e.target.value}))} inputMode="numeric"/>
                      </div>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="label">Bemerkung</label>
                    <input className="input" placeholder="Optionale Bemerkung…" value={inlineForm.note} onChange={e=>setInlineForm(f=>({...f,note:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submitInlineForm()}/>
                  </div>
                </div>
                {/* Zeile 4: Nachricht + Button */}
                {formMsg&&<div className={formMsg.type==="error"?"msg-error":"msg-success"}>{formMsg.text}</div>}
                <div style={{display:"flex",justifyContent:"flex-end"}}>
                  <button className="btn btn-primary" style={{padding:"11px 28px"}} onClick={submitInlineForm} disabled={inlineSaving}>{inlineSaving?"Speichern…":"+ Eintrag speichern"}</button>
                </div>
              </div>
            </div>

            {/* Letzte Einträge */}
            <h2 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#9aa2c8",letterSpacing:".05em",textTransform:"uppercase"}}>Meine letzten Einträge</h2>
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div className="table-wrap"><table>
                <thead><tr><th>Datum</th><th>Projekt</th><th>Tätigkeit</th><th>Zeit</th><th className="hide-mobile">Bemerkung</th><th style={{textAlign:"right"}}>Aktionen</th></tr></thead>
                <tbody>
                  {myEntries.slice(0,30).map(e=>(
                    <tr key={e.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,whiteSpace:"nowrap"}}>{e.date}</td>
                      <td><span className="chip chip-blue">{e.project}</span></td>
                      <td style={{color:"#9aa2c8"}}>{e.activity}</td>
                      <td><span className="chip">{fmtTime(e.total_min)}</span></td>
                      <td className="hide-mobile" style={{color:"#8890b8",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.note||"—"}</td>
                      <td><div className="action-btns" style={{justifyContent:"flex-end"}}><button className="btn-edit" onClick={()=>setEntryModal(e)}>✎</button><button className="btn-danger" onClick={()=>deleteEntry(e.id)}>✕</button></div></td>
                    </tr>
                  ))}
                  {myEntries.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:"#8890b8",padding:"32px 0"}}>Noch keine Einträge.</td></tr>}
                </tbody>
              </table></div>
            </div>

            {/* Abwesenheiten */}
            {(()=>{
              const myUser=users.find(u=>u.id===currentUser?.id);
              const isSalaried=myUser?.employment_type==="salaried";
              const myAbsences=absences.filter(a=>a.user_id===currentUser?.id).slice(0,20);
              const bal=isSalaried?calcVacBalance(currentUser?.id):null;
              return(<>
                <h2 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#9aa2c8",letterSpacing:".05em",textTransform:"uppercase",marginTop:24}}>Abwesenheiten</h2>
                {isSalaried&&bal&&(
                  <div className="balance-box" style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#9aa2c8",letterSpacing:".06em",textTransform:"uppercase",marginBottom:2}}>Ferienguthaben (rollend)</div>
                    <div className="balance-row"><span style={{color:"#8890b8"}}>Anspruch total (kumuliert)</span><strong>{bal.total.toFixed(1)} Tage</strong></div>
                    <div className="balance-row"><span style={{color:"#8890b8"}}>Davon Ferientage/Jahr</span><span>{bal.vacPerYear.toFixed(1)} Tage × {new Date().getFullYear()-Math.max(0,new Date().getFullYear()-1)+1} Jahr(e)</span></div>
                    <div className="balance-row"><span style={{color:"#8890b8"}}>Feiertage {new Date().getFullYear()} (auf Arbeitstagen)</span><span>{bal.holidayDaysThisYear.toFixed(1)} Tage</span></div>
                    <div className="balance-row"><span style={{color:"#8890b8"}}>Bezogen (Frei)</span><span style={{color:"#ff6b85"}}>−{bal.used.toFixed(1)} Tage</span></div>
                    <div style={{borderTop:"1px solid rgba(79,93,232,0.2)",paddingTop:8,marginTop:4}} className="balance-row">
                      <span style={{fontWeight:700}}>Verbleibend</span>
                      <strong style={{color:bal.remaining<0?"#ff6b85":bal.remaining<5?"#ffbe32":"#4dffaa",fontSize:16}}>{bal.remaining.toFixed(1)} Tage</strong>
                    </div>
                    {bal.sick>0&&<div className="balance-row"><span style={{color:"#8890b8"}}>Kranktage total</span><span>{bal.sick} Tage</span></div>}
                  </div>
                )}
                <div className="card" style={{marginBottom:12}}>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div className="field-group" style={{flex:"1 1 120px"}}><label className="label">Datum</label><input type="date" className="input" value={absenceForm.date} onChange={e=>setAbsenceForm(f=>({...f,date:e.target.value}))}/></div>
                    <div className="field-group" style={{flex:"1 1 120px"}}><label className="label">Typ</label>
                      <select className="input" value={absenceForm.type} onChange={e=>setAbsenceForm(f=>({...f,type:e.target.value}))}>
                        <option value="frei">Frei (Ferien/Feiertag)</option>
                        <option value="krank">Krank</option>
                      </select>
                    </div>
                    <div className="field-group" style={{flex:"2 1 160px"}}><label className="label">Bemerkung</label><input className="input" placeholder="Optional…" value={absenceForm.note} onChange={e=>setAbsenceForm(f=>({...f,note:e.target.value}))}/></div>
                    <button className="btn btn-primary" style={{flexShrink:0,padding:"11px 20px"}} onClick={addAbsence} disabled={absenceSaving}>{absenceSaving?"…":"+ Erfassen"}</button>
                  </div>
                </div>
                {myAbsences.length>0&&<div className="card" style={{padding:0,overflow:"hidden"}}>
                  <div className="table-wrap"><table>
                    <thead><tr><th>Datum</th><th>Typ</th><th className="hide-mobile">Bemerkung</th><th style={{textAlign:"right"}}></th></tr></thead>
                    <tbody>{myAbsences.map(a=>(
                      <tr key={a.id}>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:12}}>{a.date}</td>
                        <td><span className={a.type==="frei"?"badge-frei":"badge-krank"}>{a.type==="frei"?"Frei":"Krank"}</span></td>
                        <td className="hide-mobile" style={{color:"#8890b8"}}>{a.note||"—"}</td>
                        <td style={{textAlign:"right"}}><button className="btn-danger" onClick={()=>deleteAbsence(a.id)}>✕</button></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                </div>}
              </>);
            })()}
          </div>
        )}

        {/* AUSWERTUNG */}
        {view==="auswertung"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,flexWrap:"wrap",gap:10}}>
              <h1 style={{fontSize:21,fontWeight:700}}>Auswertung</h1>
              <div className="export-btn-group">
                <button className="btn-excel2" onClick={()=>setProjektAuswahlOpen(true)}>📁 Projektauswertung</button>
                <button className="btn-excel" onClick={()=>exportAuswertungExcel({filteredEntries,projectStats,activityStats,fromMonth,fromYear,toMonth,toYear,isAdmin})}>⬇ Auswertung</button>
              </div>
            </div>
            <p style={{color:"#8890b8",fontSize:13,marginBottom:18}}>{isAdmin?"Alle Mitarbeiter":"Deine persönliche Übersicht"}</p>

            <div className="card" style={{marginBottom:16}}>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div className="filter-group"><div className="filter-label">Von</div><select className="input" value={fromMonth} onChange={e=>setFromMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
                <div className="filter-group" style={{flex:"0 1 90px"}}><div className="filter-label">&nbsp;</div><select className="input" value={fromYear} onChange={e=>setFromYear(+e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></div>
                <div className="range-sep">—</div>
                <div className="filter-group"><div className="filter-label">Bis</div><select className="input" value={toMonth} onChange={e=>setToMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
                <div className="filter-group" style={{flex:"0 1 90px"}}><div className="filter-label">&nbsp;</div><select className="input" value={toYear} onChange={e=>setToYear(+e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}>
                {isAdmin&&<select className="input" style={{width:"auto",flex:"1 1 140px"}} value={filterEmployee} onChange={e=>setFilterEmployee(e.target.value)}><option value="alle">Alle Mitarbeiter</option>{users.filter(u=>u.role==="employee").map(u=><option key={u.id}>{u.name}</option>)}</select>}
                <select className="input" style={{width:"auto",flex:"1 1 140px"}} value={filterProject} onChange={e=>setFilterProject(e.target.value)}><option value="alle">Alle Projekte</option>{projects.map(p=><option key={p}>{p}</option>)}</select>
                <select className="input" style={{width:"auto",flex:"1 1 140px"}} value={filterActivity} onChange={e=>setFilterActivity(e.target.value)}><option value="alle">Alle Tätigkeiten</option>{activities.map(a=><option key={a}>{a}</option>)}</select>
                <input className="input" style={{width:"auto",flex:"1 1 160px"}} placeholder="Bemerkung enthält…" value={filterNote} onChange={e=>setFilterNote(e.target.value)}/>
              </div>
            </div>

            <div className="grid-3" style={{marginBottom:16}}>
              {[["Gesamtzeit",fmtTime(totalFiltered)],["Einträge",filteredEntries.length],["Projekte",projectStats.length]].map(([label,val])=>(
                <div key={label} className="summary-box"><div style={{color:"#8890b8",fontSize:10,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>{label}</div><div className="big-num">{val}</div></div>
              ))}
            </div>
            <div className="grid-2" style={{marginBottom:16}}>
              <div className="card"><div className="section-title">Nach Projekt</div>
                {projectStats.length===0&&<div style={{color:"#8890b8",fontSize:13}}>Keine Daten</div>}
                {projectStats.map(([name,min])=>{
                  const budgetH=projectBudgets[name];
                  const budgetMin=budgetH?budgetH*60:null;
                  const pct=budgetMin?Math.min((min/budgetMin)*100,100):(min/maxStat)*100;
                  const over=budgetMin&&min>budgetMin;
                  const barColor=!budgetMin?"linear-gradient(90deg,#4f5de8,#7c8bff)":over?"linear-gradient(90deg,#c0392b,#ff4d6b)":min/budgetMin>0.8?"linear-gradient(90deg,#c07c00,#ffbe32)":"linear-gradient(90deg,#1da86a,#4dffaa)";
                  return(
                  <div key={name} className="stat-row">
                    <div style={{minWidth:90,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                      <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:barColor}}/></div>
                      {budgetMin&&<div style={{fontSize:10,color:over?"#ff4d6b":min/budgetMin>0.8?"#ffbe32":"#4dffaa"}}>
                        {over?`+${fmtTime(min-budgetMin)} überschritten`:`${fmtTime(budgetMin-min)} verbleibend`}
                      </div>}
                    </div>
                    <div style={{minWidth:65,textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#7c8bff"}}>
                      {fmtTime(min)}{budgetH&&<span style={{fontSize:10,color:"#8890b8",fontFamily:"'DM Sans',sans-serif"}}> / {budgetH}h</span>}
                    </div>
                  </div>);
                })}
              </div>
              <div className="card"><div className="section-title">Nach Tätigkeit</div>
                {activityStats.length===0&&<div style={{color:"#8890b8",fontSize:13}}>Keine Daten</div>}
                {activityStats.map(([name,min])=>(
                  <div key={name} className="stat-row"><div style={{minWidth:90,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div><div className="bar-bg"><div className="bar-fill bar-fill-green" style={{width:`${(min/maxAct)*100}%`}}/></div><div style={{minWidth:65,textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#4dffaa"}}>{fmtTime(min)}</div></div>
                ))}
              </div>
            </div>
            {/* Kombinierte Übersicht: Stundensaldo + Ferienguthaben */}
            {(()=>{
              const now=new Date();const curM=now.getMonth();const curY=now.getFullYear();
              const salariedUsers=users.filter(u=>u.employment_type==="salaried");
              if(!salariedUsers.length)return null;
              const relevant=isAdmin?(filterEmployee==="alle"?salariedUsers:salariedUsers.filter(u=>u.name===filterEmployee)):salariedUsers.filter(u=>u.id===currentUser?.id);
              if(!relevant.length)return null;
              return(
                <div className="card" style={{marginBottom:16}}>
                  <div className="section-title">Übersicht Festangestellte — {MONTHS[curM]} {curY}</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr style={{fontSize:11,color:"#8890b8",textTransform:"uppercase",letterSpacing:".06em"}}>
                        <th style={{textAlign:"left",padding:"6px 8px",fontWeight:700}}>Mitarbeiter</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Jahreskapazität</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Soll Monat</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Ist Monat</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>± Monat</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Saldo kumuliert</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Ferien/Jahr</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Bezogen</th>
                        <th style={{textAlign:"right",padding:"6px 8px",fontWeight:700}}>Ferien Rest</th>
                      </tr></thead>
                      <tbody>{relevant.map(u=>{
                        const bal=calcVacBalance(u.id);
                        const si=calcSollIst(u.id,curM,curY);
                        const rb=calcRunningBalance(u.id,curM,curY);
                        if(!bal&&!si)return null;
                        const wd2=parseWorkDays(u.work_days);
                        let wdCount=0;
                        for(let d=new Date(curY,0,1);d<=new Date(curY,11,31);d.setDate(d.getDate()+1)){const dow=d.getDay()||7;if(wd2.includes(dow))wdCount++;}
                        const holidayDays=Math.round(bal.holidayDaysThisYear*10)/10;
                        const capacityDays=Math.round((wdCount-bal.holidayDaysThisYear)*10)/10;
                        const capacityH=u.annual_hours!=null?parseFloat(u.annual_hours):Math.round(capacityDays*(parseFloat(u.daily_hours)||0)*10)/10;
                        const monColor=si?(si.diff>=0?"#4dffaa":"#ff6b85"):"#8890b8";
                        const cumColor=rb?(rb.cumulativeDiff>=0?"#4dffaa":"#ff6b85"):"#8890b8";
                        return(<tr key={u.id} style={{borderTop:"1px solid #1e2235"}}>
                          <td style={{padding:"8px 8px",fontSize:13,fontWeight:600}}>{u.name}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#7c8bff"}}>{capacityH}h<span style={{fontSize:10,color:"#8890b8"}}> Brutto</span><div style={{fontSize:10,color:"#8890b8",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>− {holidayDays}T Feiertage ({Math.round(holidayDays*(parseFloat(u.daily_hours)||0)*10)/10}h)</div><div style={{fontSize:11,color:"#e0e4f8",marginTop:2}}>{Math.round((capacityH-holidayDays*(parseFloat(u.daily_hours)||0))*10)/10}h Netto</div></td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#9aa2c8"}}>{si?fmtTime(si.sollMin):"—"}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12}}>{si?fmtTime(si.istMin):"—"}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:monColor}}>{si?(si.diff>=0?"+":"")+fmtTime(Math.abs(si.diff)):"—"}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:cumColor}}>{rb?(rb.cumulativeDiff>=0?"+":"-")+fmtTime(Math.abs(rb.cumulativeDiff)):"—"}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#9aa2c8"}}>{bal?bal.vacPerYear.toFixed(1)+" T":"—"}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#ff6b85"}}>{bal?bal.used.toFixed(1)+" T":"—"}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:bal?(bal.remaining<0?"#ff6b85":bal.remaining<5?"#ffbe32":"#4dffaa"):"#8890b8"}}>{bal?bal.remaining.toFixed(1)+" T":"—"}</td>
                        </tr>);
                      })}</tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:"1px solid #1e2235"}}><span className="section-title" style={{marginBottom:0}}>Einträge ({filteredEntries.length})</span></div>
              <div className="table-wrap"><table>
                <thead><tr><th>Datum</th>{isAdmin&&<th>Mitarbeiter</th>}<th>Projekt</th><th>Tätigkeit</th><th>Zeit</th><th className="hide-mobile">Bemerkung</th></tr></thead>
                <tbody>
                  {filteredEntries.map(e=>(
                    <tr key={e.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:12,whiteSpace:"nowrap"}}>{e.date}</td>
                      {isAdmin&&<td style={{fontWeight:500}}>{e.employee_name}</td>}
                      <td><span className="chip chip-blue">{e.project}</span></td>
                      <td style={{color:"#9aa2c8"}}>{e.activity}</td>
                      <td><span className="chip">{fmtTime(e.total_min)}</span></td>
                      <td className="hide-mobile" style={{color:"#8890b8"}}>{e.note||"—"}</td>
                    </tr>
                  ))}
                  {filteredEntries.length===0&&<tr><td colSpan={7} style={{textAlign:"center",color:"#8890b8",padding:"28px 0"}}>Keine Einträge für diesen Zeitraum.</td></tr>}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {/* MONATSABSCHLUSS */}
        {view==="abschluss"&&isAdmin&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,flexWrap:"wrap",gap:10}}>
              <h1 style={{fontSize:21,fontWeight:700}}>Monatsabschluss</h1>
              <button className="btn-excel3" onClick={()=>exportMonatsabschlussExcel({abschlussPerEmp,abschlussMonth,abschlussYear})}>⬇ Stundenblätter (A4)</button>
            </div>
            <p style={{color:"#8890b8",fontSize:13,marginBottom:22}}>Stundenzusammenfassung für die Lohnabrechnung.</p>
            <div className="card" style={{marginBottom:16}}><div style={{display:"flex",gap:10}}>
              <select className="input" style={{width:"auto",flex:1}} value={abschlussMonth} onChange={e=>setAbschlussMonth(+e.target.value)}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
              <select className="input" style={{width:"auto"}} value={abschlussYear} onChange={e=>setAbschlussYear(+e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select>
            </div></div>
            <div style={{fontSize:13,color:"#8890b8",marginBottom:16}}>{MONTHS[abschlussMonth]} {abschlussYear} — {abschlussEntries.length} Einträge, Total: <strong style={{color:"#e0e4f8"}}>{fmtTime(abschlussEntries.reduce((s,e)=>s+e.total_min,0))}</strong></div>
            {abschlussPerEmp.map(({name,totalMin,entries:empE})=>(
              <div key={name} className="abschluss-card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div className="avatar">{initials(name)}</div>
                    <div><div style={{fontWeight:600,fontSize:15}}>{name}</div><div style={{color:"#8890b8",fontSize:12,marginTop:2}}>{empE.length} Einträge</div></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div className="big-num" style={{fontSize:20}}>{fmtTime(totalMin)}</div>
                    <div style={{color:"#7c8bff",fontSize:12,fontFamily:"'DM Mono',monospace"}}>{fmtDecimal(totalMin)} h</div>
                    {(()=>{
                      const empUser=users.find(u=>u.name===name);
                      if(!empUser)return null;
                      const si=calcSollIst(empUser.id,abschlussMonth,abschlussYear);
                      const rb=calcRunningBalance(empUser.id,abschlussMonth,abschlussYear);
                      if(!si)return null;
                      const diffColor=si.diff>=0?"#4dffaa":"#ff6b85";
                      const cumColor=rb&&rb.cumulativeDiff>=0?"#4dffaa":"#ff6b85";
                      return(<>
                        <div style={{marginTop:6,fontSize:11,color:"#8890b8"}}>Soll: {fmtTime(si.sollMin)} · Ist: {fmtTime(si.istMin)} · <span style={{color:diffColor,fontWeight:700}}>{si.diff>=0?"+":""}{fmtTime(Math.abs(si.diff))}</span></div>
                        {rb&&<div style={{marginTop:4,fontSize:12,fontWeight:700}}>Saldo kumuliert: <span style={{color:cumColor}}>{rb.cumulativeDiff>=0?"+":"-"}{fmtTime(Math.abs(rb.cumulativeDiff))}</span></div>}
                      </>);
                    })()}
                  </div>
                </div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Datum</th><th>Projekt</th><th>Tätigkeit</th><th>Zeit</th><th className="hide-mobile">Bemerkung</th></tr></thead>
                  <tbody>{empE.map(e=>(
                    <tr key={e.id}><td style={{fontFamily:"'DM Mono',monospace",fontSize:12}}>{e.date}</td><td><span className="chip chip-blue">{e.project}</span></td><td style={{color:"#9aa2c8"}}>{e.activity}</td><td><span className="chip">{fmtTime(e.total_min)}</span></td><td className="hide-mobile" style={{color:"#8890b8"}}>{e.note||"—"}</td></tr>
                  ))}</tbody>
                </table></div>
                {(()=>{
                  const empUser=users.find(u=>u.name===name);
                  if(!empUser||empUser.employment_type!=="salaried")return null;
                  const bal=calcVacBalance(empUser.id);
                  const monthAbsences=absences.filter(a=>a.user_id===empUser.id&&a.date.startsWith(`${abschlussYear}-${String(abschlussMonth+1).padStart(2,"0")}`));
                  if(!bal)return null;
                  return(
                    <div style={{padding:"12px 16px",borderTop:"1px solid #1e2235",display:"flex",gap:24,flexWrap:"wrap"}}>
                      <div style={{fontSize:12,color:"#8890b8"}}>Ferienguthaben: <strong style={{color:bal.remaining<0?"#ff6b85":bal.remaining<5?"#ffbe32":"#4dffaa"}}>{bal.remaining} Tage verbleibend</strong> ({bal.used}/{bal.total} bezogen)</div>
                      {monthAbsences.length>0&&<div style={{fontSize:12,color:"#8890b8"}}>Abwesenheiten {MONTHS[abschlussMonth]}: {monthAbsences.filter(a=>a.type==="frei").length} Frei, {monthAbsences.filter(a=>a.type==="krank").length} Krank</div>}
                    </div>
                  );
                })()}
              </div>
            ))}
            {abschlussPerEmp.length===0&&<div style={{textAlign:"center",color:"#8890b8",padding:"48px 0"}}>Keine Einträge für {MONTHS[abschlussMonth]} {abschlussYear}.</div>}
          </div>
        )}

        {/* VERWALTUNG */}
        {view==="verwaltung"&&isAdmin&&(
          <div>
            <h1 style={{fontSize:21,fontWeight:700,marginBottom:5}}>Verwaltung</h1>
            <p style={{color:"#8890b8",fontSize:13,marginBottom:22}}>Benutzer, Projekte und Tätigkeiten zentral verwalten.</p>
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
                      <div><div style={{fontSize:14,fontWeight:600}}>{u.name}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#8890b8"}}>@{u.username}</div></div>
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
                <div style={{marginBottom:16}}>
                  {projects.map(p=>(
                    <div key={p} className="mgmt-list-item">
                      {editingProject?.orig===p
                        ? <input autoFocus className="input" style={{flex:1,padding:"6px 10px",fontSize:14}} value={editingProject.val}
                            onChange={e=>setEditingProject(ep=>({...ep,val:e.target.value}))}
                            onKeyDown={e=>{if(e.key==="Enter")renameProject();if(e.key==="Escape")setEditingProject(null);}}
                            onBlur={renameProject}/>
                        : <span style={{fontSize:14,flex:1}}>{p}</span>
                      }
                      <button className="btn-warn" style={{padding:"6px 10px",fontSize:12}} onClick={()=>editingProject?.orig===p?renameProject():setEditingProject({orig:p,val:p})}>✎</button>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input
                          type="number" min="0" step="0.5"
                          className="input" placeholder="Budget h"
                          style={{width:100,padding:"6px 10px",fontSize:13}}
                          value={budgetDraft[p]??""}
                          onChange={e=>setBudgetDraft(prev=>({...prev,[p]:e.target.value}))}
                          onBlur={()=>saveBudget(p)}
                          onKeyDown={e=>e.key==="Enter"&&saveBudget(p)}
                        />
                        <span style={{fontSize:11,color:"#8890b8",whiteSpace:"nowrap"}}>h Budget</span>
                      </div>
                      <button className="btn-warn" onClick={()=>archiveProject(p)}>⬇ Archivieren</button>
                      <button className="btn-danger" onClick={()=>removeProject(p)}>✕ Entfernen</button>
                    </div>
                  ))}
                  {projects.length===0&&<div style={{color:"#8890b8",fontSize:13,padding:"8px 0"}}>Noch keine Projekte.</div>}
                </div>
                <div style={{display:"flex",gap:8}}><input className="input" placeholder="Neues Projekt…" value={newProject} onChange={e=>setNewProject(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProject()}/><button className="btn btn-primary" style={{flexShrink:0}} onClick={addProject}>+</button></div>
                {archivedProjects.length>0&&<>
                  <div style={{fontSize:11,fontWeight:700,color:"#8890b8",letterSpacing:".07em",textTransform:"uppercase",marginTop:20,marginBottom:8}}>Archiviert</div>
                  {archivedProjects.map(p=>(
                    <div key={p} className="mgmt-list-item" style={{opacity:0.6}}>
                      <span style={{fontSize:14,flex:1,textDecoration:"line-through"}}>{p}</span>
                      <button className="btn btn-ghost" style={{padding:"6px 12px",fontSize:12}} onClick={()=>restoreProject(p)}>↩ Wiederherstellen</button>
                    </div>
                  ))}
                </>}
              </div>
              <div className="card">
                <div className="section-title">Tätigkeiten</div>
                <div style={{marginBottom:16}}>
                  {activities.map(a=>(
                    <div key={a} className="mgmt-list-item">
                      {editingActivity?.orig===a
                        ? <input autoFocus className="input" style={{flex:1,padding:"6px 10px",fontSize:14}} value={editingActivity.val}
                            onChange={e=>setEditingActivity(ea=>({...ea,val:e.target.value}))}
                            onKeyDown={e=>{if(e.key==="Enter")renameActivity();if(e.key==="Escape")setEditingActivity(null);}}
                            onBlur={renameActivity}/>
                        : <span style={{fontSize:14,flex:1}}>{a}</span>
                      }
                      <button className="btn-warn" style={{padding:"6px 10px",fontSize:12}} onClick={()=>editingActivity?.orig===a?renameActivity():setEditingActivity({orig:a,val:a})}>✎</button>
                      <button className="btn-danger" onClick={()=>removeActivity(a)}>✕ Entfernen</button>
                    </div>
                  ))}
                  {activities.length===0&&<div style={{color:"#8890b8",fontSize:13,padding:"8px 0"}}>Noch keine Tätigkeiten.</div>}
                </div>
                <div style={{display:"flex",gap:8}}><input className="input" placeholder="Neue Tätigkeit…" value={newActivity} onChange={e=>setNewActivity(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addActivity()}/><button className="btn btn-primary" style={{flexShrink:0}} onClick={addActivity}>+</button></div>
              </div>
              <div className="card">
                <div className="section-title">Produkte</div>
                <div style={{marginBottom:16}}>
                  {products.map(p=>(
                    <div key={p} className="mgmt-list-item">
                      {editingProduct?.orig===p
                        ? <input autoFocus className="input" style={{flex:1,padding:"6px 10px",fontSize:14}} value={editingProduct.val}
                            onChange={e=>setEditingProduct(ep=>({...ep,val:e.target.value}))}
                            onKeyDown={e=>{if(e.key==="Enter")renameProduct();if(e.key==="Escape")setEditingProduct(null);}}
                            onBlur={renameProduct}/>
                        : <span style={{fontSize:14,flex:1}}>{p}</span>
                      }
                      <button className="btn-warn" style={{padding:"6px 10px",fontSize:12}} onClick={()=>editingProduct?.orig===p?renameProduct():setEditingProduct({orig:p,val:p})}>✎</button>
                      <button className="btn-danger" onClick={()=>removeProduct(p)}>✕ Entfernen</button>
                    </div>
                  ))}
                  {products.length===0&&<div style={{color:"#8890b8",fontSize:13,padding:"8px 0"}}>Noch keine Produkte.</div>}
                </div>
                <div style={{display:"flex",gap:8}}><input className="input" placeholder="Neues Produkt…" value={newProduct} onChange={e=>setNewProduct(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProduct()}/><button className="btn btn-primary" style={{flexShrink:0}} onClick={addProduct}>+</button></div>
              </div>

              {/* Feiertage */}
              <div className="card">
                <div className="section-title">Feiertage Luzern</div>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
                  <select className="input" style={{width:"auto"}} value={holidayYear} onChange={e=>setHolidayYear(+e.target.value)}>
                    {[...Array(5)].map((_,i)=>{const y=new Date().getFullYear()-1+i;return<option key={y} value={y}>{y}</option>;})}
                  </select>
                  <button className="btn btn-primary" style={{padding:"9px 16px",fontSize:13}} onClick={()=>fetchHolidays(holidayYear)}>↻ Feiertage laden</button>
                  <span style={{fontSize:12,color:"#8890b8"}}>{holidays.filter(h=>h.year===holidayYear).length} Einträge für {holidayYear}</span>
                </div>
                <div style={{marginBottom:16}}>
                  {holidays.filter(h=>h.year===holidayYear).map(h=>(
                    <div key={h.id} className="mgmt-list-item">
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#9aa2c8",minWidth:90}}>{h.date}</span>
                      <span style={{fontSize:14,flex:1}}>{h.name}</span>
                      <button className="btn-danger" onClick={()=>deleteHoliday(h.id)}>✕</button>
                    </div>
                  ))}
                  {holidays.filter(h=>h.year===holidayYear).length===0&&<div style={{color:"#8890b8",fontSize:13,padding:"8px 0"}}>Keine Feiertage für {holidayYear} — "Feiertage laden" klicken.</div>}
                </div>
                {/* Manuell hinzufügen */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input type="date" className="input" style={{flex:"1 1 130px"}} value={hDate} onChange={e=>setHDate(e.target.value)}/>
                  <input className="input" placeholder="Name…" style={{flex:"2 1 160px"}} value={hName} onChange={e=>setHName(e.target.value)}/>
                  <button className="btn btn-ghost" style={{flexShrink:0}} onClick={()=>{if(hDate&&hName){addHoliday(hDate,hName,holidayYear);setHDate("");setHName("");}}}>+ Manuell</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
