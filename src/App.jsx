import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://acpqfphdstyfoasoxhfn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcHFmcGhkc3R5Zm9hc294aGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQzMzgsImV4cCI6MjA5MDkyMDMzOH0.bA0pFS01eK2RI0oTL5_rvj1N-t_5nnE3OMfSlYBWpAk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const timeToMin = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const minToHrs = (m) => (m / 60).toFixed(2);
const calcHoras = ({ entrada, salida_almuerzo, ingreso_almuerzo, salida }) => {
  const e = timeToMin(entrada), s = timeToMin(salida);
  if (e == null || s == null) return 0;
  let t = s - e;
  const sa = timeToMin(salida_almuerzo), ia = timeToMin(ingreso_almuerzo);
  if (sa != null && ia != null) t -= (ia - sa);
  return t > 0 ? t : 0;
};
const COP = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
const TODAY = new Date().toISOString().split("T")[0];
const genToken = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
const fmtFecha = (f) => { if (!f) return "—"; const [y, m, d] = f.split("-"); return `${d}/${m}/${y}`; };
const fmtHora = (h) => h ? h.substring(0, 5) : "—";
const nowStr = () => new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });

const G = {
  bg: "#0a0c10", card: "#111318", border: "#1e2028", accent: "#3b82f6",
  gold: "#f59e0b", green: "#10b981", red: "#ef4444", text: "#e2e8f0",
  muted: "#64748b", surface: "#161820"
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'Outfit',sans-serif}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2e3244;border-radius:2px}
  input,select{background:${G.surface};border:1px solid ${G.border};color:${G.text};padding:10px 14px;border-radius:8px;font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;transition:border .2s,box-shadow .2s}
  input:focus,select:focus{border-color:${G.accent};box-shadow:0 0 0 3px rgba(59,130,246,.15)}
  input[type=time]::-webkit-calendar-picker-indicator,input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.6);cursor:pointer}
  button{cursor:pointer;font-family:'Outfit',sans-serif;border:none;border-radius:8px;transition:all .18s;font-weight:600}
  label{font-size:11px;letter-spacing:.08em;color:${G.muted};display:block;margin-bottom:6px;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
  .card{background:${G.card};border:1px solid ${G.border};border-radius:12px;padding:20px}
  .btn-primary{background:${G.accent};color:#fff;padding:11px 20px;font-size:14px}
  .btn-primary:hover{background:#2563eb;transform:translateY(-1px)}
  .btn-ghost{background:transparent;border:1px solid ${G.border};color:${G.muted};padding:8px 14px;font-size:12px}
  .btn-ghost:hover{border-color:${G.accent};color:${G.accent}}
  .btn-danger{background:#1f0a0a;border:1px solid #5a1a1a;color:${G.red};padding:8px 14px;font-size:12px}
  .pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace}
  .pill-green{background:#052e16;color:${G.green};border:1px solid #14532d}
  .pill-blue{background:#0c1a3a;color:${G.accent};border:1px solid #1e3a6e}
  .pill-gold{background:#1c1000;color:${G.gold};border:1px solid #451a00}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade{animation:fadeIn .3s ease}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin 1s linear infinite;display:inline-block}
`;

const Spinner = () => <span className="spin" style={{ fontSize: 18 }}>⟳</span>;
const Toast = ({ msg, type }) => (
  <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: type === "err" ? "#1f0a0a" : "#052e16", border: `1px solid ${type === "err" ? G.red : G.green}`, color: type === "err" ? G.red : G.green, padding: "12px 20px", borderRadius: 10, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,.6)", maxWidth: 320 }}>
    {type === "err" ? "✕ " : "✓ "}{msg}
  </div>
);

const FirmaCanvas = ({ onFirma }) => {
  const ref = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); hasDrawn.current = false; };
  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width, sy = c.height / r.height;
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; hasDrawn.current = true; const c = ref.current, ctx = c.getContext("2d"), p = getPos(e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw = (e) => { e.preventDefault(); if (!drawing.current) return; const c = ref.current, ctx = c.getContext("2d"), p = getPos(e, c); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#1d4ed8"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); };
  const stop = () => { drawing.current = false; };
  const save = () => { if (!hasDrawn.current) { alert("Por favor dibuja tu firma antes de confirmar"); return; } onFirma(ref.current.toDataURL("image/png")); };
  return (
    <div>
      <div style={{ fontSize: 12, color: G.muted, marginBottom: 8 }}>Firma con tu dedo o mouse en el recuadro blanco:</div>
      <canvas ref={ref} width={600} height={200}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
        style={{ border: `2px dashed ${G.accent}`, borderRadius: 8, background: "#ffffff", touchAction: "none", width: "100%", cursor: "crosshair", display: "block" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn-ghost" onClick={clear} style={{ flex: 1 }}>🗑 Limpiar</button>
        <button className="btn-primary" onClick={save} style={{ flex: 2 }}>✓ Confirmar Firma</button>
      </div>
    </div>
  );
};

const generarPDF = (turno, colaborador, cuenta, firmaImg) => {
  const win = window.open("", "_blank");
  const almuerzo = turno.salida_almuerzo ? `${fmtHora(turno.salida_almuerzo)} → ${fmtHora(turno.ingreso_almuerzo)}` : "Sin almuerzo";
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
  <title>Cuenta de Cobro - ${colaborador.nombre}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;background:#fff;padding:40px;max-width:750px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:20px;margin-bottom:28px}
    .logo{font-size:26px;font-weight:800;color:#1d4ed8}.logo span{color:#1a1a2e}
    .doc-info{text-align:right;font-size:12px;color:#64748b}.doc-info strong{display:block;font-size:15px;color:#1a1a2e;margin-bottom:4px}
    h2{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:12px}
    .section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 22px;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .field label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;display:block;margin-bottom:3px}
    .field span{font-size:14px;font-weight:600;color:#1a1a2e}
    .total-box{background:linear-gradient(135deg,#1d4ed8,#1e40af);color:#fff;border-radius:10px;padding:22px 26px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
    .total-box .lbl{font-size:12px;opacity:.8;margin-bottom:4px}.total-box .amt{font-size:32px;font-weight:800}
    .firma-box{border:2px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:18px;text-align:center}
    .firma-box img{max-width:100%;max-height:140px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;display:block;margin:10px auto}
    .badge{display:inline-block;background:#052e16;color:#10b981;border:1px solid #14532d;border-radius:99px;padding:3px 12px;font-size:11px;font-weight:600}
    .footer{border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6}
    .print-btn{display:block;margin:24px auto 0;background:#1d4ed8;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
    @media print{.print-btn{display:none}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Turnos<span>PRO</span></div><div style="font-size:12px;color:#64748b;margin-top:4px">Sistema de control de turnos y nómina</div></div>
    <div class="doc-info"><strong>CUENTA DE COBRO</strong>No. ${turno.id.substring(0,8).toUpperCase()}<br/>Fecha: ${fmtFecha(TODAY)}<br/><span class="badge">✓ FIRMADA</span></div>
  </div>
  <h2>Datos del Colaborador</h2>
  <div class="section grid">
    <div class="field"><label>Nombre completo</label><span>${colaborador.nombre}</span></div>
    <div class="field"><label>Cédula</label><span>${colaborador.cedula || "—"}</span></div>
    <div class="field"><label>Celular</label><span>${colaborador.celular || "—"}</span></div>
    <div class="field"><label>Valor por hora</label><span>${COP(colaborador.valor_hora)}</span></div>
  </div>
  <h2>Detalle del Turno</h2>
  <div class="section grid">
    <div class="field"><label>Fecha del turno</label><span>${fmtFecha(turno.fecha)}</span></div>
    <div class="field"><label>Hora de entrada</label><span>${fmtHora(turno.entrada)}</span></div>
    <div class="field"><label>Almuerzo</label><span>${almuerzo}</span></div>
    <div class="field"><label>Hora de salida</label><span>${fmtHora(turno.salida)}</span></div>
    <div class="field"><label>Horas trabajadas</label><span>${minToHrs(turno.horas_trabajadas)} horas</span></div>
    <div class="field"><label>Registrado el</label><span>${turno.created_at ? new Date(turno.created_at).toLocaleString("es-CO") : "—"}</span></div>
  </div>
  <div class="total-box">
    <div><div class="lbl">TOTAL A PAGAR</div><div class="amt">${COP(turno.pago)}</div><div style="font-size:12px;opacity:.7;margin-top:4px">${minToHrs(turno.horas_trabajadas)} hrs × ${COP(colaborador.valor_hora)}/hr</div></div>
    <div style="text-align:right"><div class="lbl">ESTADO</div><div style="font-size:16px;font-weight:700;margin-top:4px">✓ PAGO REALIZADO</div><div style="font-size:12px;opacity:.7">Firmado digitalmente</div></div>
  </div>
  <h2>Firma del Colaborador</h2>
  <div class="firma-box">
    <div style="font-size:12px;color:#64748b;margin-bottom:10px">El colaborador firma confirmando que recibió el pago a satisfacción:</div>
    ${firmaImg ? `<img src="${firmaImg}" alt="Firma"/>` : '<div style="padding:30px;color:#94a3b8;border:1px dashed #e2e8f0;border-radius:6px">Sin firma registrada</div>'}
    <div style="font-size:11px;color:#94a3b8;margin-top:10px">
      Firmado el ${cuenta.firmado_en ? new Date(cuenta.firmado_en).toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" }) : "—"}<br/>
      Token: ${cuenta.token}
    </div>
  </div>
  <div class="footer">Este documento es constancia de pago generada por TurnosPRO.<br/>La firma digital tiene validez como constancia de recibo del pago.<br/>Generado el ${nowStr()}</div>
  <button class="print-btn" onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>
  </body></html>`);
  win.document.close();
};

// ── Página Pública de Firma ──
const PaginaFirma = ({ token }) => {
  const [estado, setEstado] = useState("cargando");
  const [cuenta, setCuenta] = useState(null);
  const [turno, setTurno] = useState(null);
  const [colaborador, setColaborador] = useState(null);
  const [firmando, setFirmando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("cuentas_cobro").select("*").eq("token", token).single();
      if (!c) return setEstado("no_encontrado");
      if (c.firmada) return setEstado("ya_firmado");
      const { data: t } = await supabase.from("turnos").select("*").eq("id", c.turno_id).single();
      const { data: col } = await supabase.from("colaboradores").select("*").eq("id", t.colaborador_id).single();
      setCuenta(c); setTurno(t); setColaborador(col); setEstado("ok");
    })();
  }, [token]);

  const firmar = async (img) => {
    setFirmando(true);
    try {
      const { error: e1 } = await supabase.from("firmas").insert({ cuenta_cobro_id: cuenta.id, firma_base64: img });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("cuentas_cobro").update({ firmada: true, firmado_en: new Date().toISOString() }).eq("id", cuenta.id);
      if (e2) throw e2;
      setEstado("firmado_ok");
    } catch (err) {
      console.error(err);
      setFirmando(false);
      alert("Error al guardar la firma. Intenta de nuevo.");
    }
  };

  if (estado === "cargando") return <div style={{ minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}><style>{css}</style><Spinner /><div style={{color:G.muted,fontSize:13}}>Cargando...</div></div>;
  if (estado === "no_encontrado") return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><div style={{textAlign:"center",padding:40}}><div style={{fontSize:48}}>❌</div><div style={{color:G.muted,marginTop:12}}>Cuenta de cobro no encontrada</div></div></div>;
  if (estado === "ya_firmado" || estado === "firmado_ok") return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{css}</style>
      <div style={{textAlign:"center",padding:40}} className="fade">
        <div style={{fontSize:64,marginBottom:16}}>✅</div>
        <div style={{fontWeight:800,fontSize:24,color:G.green}}>¡Firma registrada!</div>
        <div style={{color:G.muted,marginTop:10,fontSize:14,lineHeight:1.6}}>Tu firma quedó guardada como constancia<br/>de que recibiste el pago a satisfacción.</div>
        {turno && <div style={{marginTop:20,background:G.card,border:`1px solid ${G.border}`,borderRadius:10,padding:"16px 24px",display:"inline-block"}}>
          <div style={{color:G.gold,fontWeight:800,fontSize:22}}>{COP(turno.pago)}</div>
          <div style={{color:G.muted,fontSize:12,marginTop:4}}>Turno del {fmtFecha(turno?.fecha)}</div>
        </div>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:G.bg,padding:"28px 16px"}}>
      <style>{css}</style>
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:11,letterSpacing:".2em",color:G.muted,fontFamily:"'JetBrains Mono'",marginBottom:6}}>CUENTA DE COBRO</div>
          <div style={{fontSize:24,fontWeight:800}}>Comprobante de Pago</div>
        </div>
        <div className="card fade" style={{marginBottom:16}}>
          <div style={{borderBottom:`1px solid ${G.border}`,paddingBottom:14,marginBottom:16}}>
            <div style={{fontSize:18,fontWeight:700}}>{colaborador.nombre}</div>
            {colaborador.cedula && <div style={{color:G.muted,fontSize:12,marginTop:2}}>🪪 CC {colaborador.cedula}</div>}
            {colaborador.celular && <div style={{color:G.muted,fontSize:12}}>📱 {colaborador.celular}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[["Fecha",fmtFecha(turno.fecha)],["Entrada",fmtHora(turno.entrada)],["Almuerzo",turno.salida_almuerzo?`${fmtHora(turno.salida_almuerzo)} → ${fmtHora(turno.ingreso_almuerzo)}`:"Sin almuerzo"],["Salida",fmtHora(turno.salida)],["Horas trabajadas",`${minToHrs(turno.horas_trabajadas)} hrs`],["Valor / hora",COP(colaborador.valor_hora)]].map(([k,v])=>(
              <div key={k} style={{background:G.surface,padding:"10px 12px",borderRadius:8}}>
                <div style={{fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3,fontFamily:"'JetBrains Mono'"}}>{k}</div>
                <div style={{fontWeight:600,fontSize:13}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)",borderRadius:10,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{color:"rgba(255,255,255,.7)",fontSize:12}}>Total a recibir</div>
            <div style={{fontWeight:800,fontSize:28,color:"#fff"}}>{COP(turno.pago)}</div>
          </div>
        </div>
        <div className="card fade">
          {firmando
            ? <div style={{textAlign:"center",padding:30}}><Spinner /><div style={{color:G.muted,marginTop:12,fontSize:13}}>Guardando firma...</div></div>
            : <>
                <FirmaCanvas onFirma={firmar} />
                <div style={{color:G.muted,fontSize:11,marginTop:12,textAlign:"center",lineHeight:1.5}}>
                  Al firmar confirmas que recibiste {COP(turno.pago)}<br/>correspondiente al turno del {fmtFecha(turno.fecha)}
                </div>
              </>
          }
        </div>
      </div>
    </div>
  );
};

// ── App Principal ──
export default function App() {
  const [session, setSession] = useState(null);
  const [userRol, setUserRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [view, setView] = useState("turnos");
  const [toast, setToast] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [turnoForm, setTurnoForm] = useState({ colaborador_id:"", fecha:TODAY, entrada:"", salida_almuerzo:"", ingreso_almuerzo:"", salida:"" });
  const [colForm, setColForm] = useState({ nombre:"", cedula:"", celular:"", valor_hora:"" });
  const [editCol, setEditCol] = useState(null);
  const [authForm, setAuthForm] = useState({ email:"", password:"" });
  const [filterCol, setFilterCol] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(null);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email:"", password:"", rol:"supervisor" });
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) return <><style>{css}</style><PaginaFirma token={urlToken} /></>;

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session) loadRol(session.user.id); else setLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,s)=>{ setSession(s); if(s) loadRol(s.user.id); else {setLoading(false);setUserRol(null);} });
    return ()=>subscription.unsubscribe();
  },[]);

  const loadRol = async(uid)=>{ const {data}=await supabase.from("user_roles").select("rol").eq("user_id",uid).single(); setUserRol(data?.rol||"admin"); setLoading(false); };

  useEffect(()=>{
    if(!session) return;
    loadColaboradores(); loadTurnos(); loadCuentas();
    if(userRol==="admin") loadUsuarios();
    // Tiempo real: detecta firmas nuevas
    const sub = supabase.channel("cuentas_realtime")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"cuentas_cobro"},()=>{
        loadCuentas();
        showToast("🖊 ¡Un colaborador acaba de firmar su cuenta de cobro!");
      }).subscribe();
    return ()=>supabase.removeChannel(sub);
  },[session,userRol]);

  const loadColaboradores = async()=>{ const {data}=await supabase.from("colaboradores").select("*").order("nombre"); setColaboradores(data||[]); };
  const loadTurnos = async()=>{ const {data}=await supabase.from("turnos").select("*").order("fecha",{ascending:false}); setTurnos(data||[]); };
  const loadCuentas = async()=>{ const {data}=await supabase.from("cuentas_cobro").select("*"); setCuentas(data||[]); };
  const loadUsuarios = async()=>{ const {data}=await supabase.from("user_roles").select("*, auth_email:user_id(email)").order("created_at"); setUsuarios(data||[]); };

  const handleLogin = async()=>{ setLoading(true); const {error}=await supabase.auth.signInWithPassword({email:authForm.email,password:authForm.password}); if(error){showToast(error.message,"err");setLoading(false);} };
  const handleRegister = async()=>{
    if(!authForm.email||!authForm.password) return showToast("Completa todos los campos","err");
    setLoading(true);
    const {data,error}=await supabase.auth.signUp({email:authForm.email,password:authForm.password});
    if(error){showToast(error.message,"err");setLoading(false);return;}
    await supabase.from("user_roles").insert({user_id:data.user.id,rol:"admin"});
    showToast("¡Cuenta creada! Revisa tu email para confirmar.");
    setLoading(false);
  };
  const logout = ()=>supabase.auth.signOut();

  const saveTurno = async()=>{
    if(!turnoForm.colaborador_id||!turnoForm.fecha||!turnoForm.entrada||!turnoForm.salida) return showToast("Completa los campos obligatorios","err");
    const mins = calcHoras(turnoForm);
    if(!mins) return showToast("Revisa los horarios ingresados","err");
    const col = colaboradores.find(c=>c.id===turnoForm.colaborador_id);
    const pago = (mins/60)*col.valor_hora;
    const {data:t,error}=await supabase.from("turnos").insert({...turnoForm,horas_trabajadas:mins,pago,creado_por:session.user.id}).select().single();
    if(error) return showToast("Error al guardar turno","err");
    await supabase.from("cuentas_cobro").insert({turno_id:t.id,token:genToken()});
    await supabase.from("auditoria").insert({user_id:session.user.id,accion:"crear_turno",tabla:"turnos",registro_id:t.id,detalle:{colaborador:col.nombre,pago}});
    loadTurnos(); loadCuentas();
    setTurnoForm(f=>({...f,entrada:"",salida_almuerzo:"",ingreso_almuerzo:"",salida:""}));
    showToast(`✓ Turno guardado · ${minToHrs(mins)} hrs · ${COP(pago)}`);
  };

  const saveCol = async()=>{
    if(!colForm.nombre.trim()||!colForm.valor_hora) return showToast("Nombre y valor por hora son obligatorios","err");
    const payload={nombre:colForm.nombre.trim(),cedula:colForm.cedula.trim(),celular:colForm.celular.trim(),valor_hora:Number(colForm.valor_hora)};
    if(editCol){ await supabase.from("colaboradores").update(payload).eq("id",editCol); setEditCol(null); showToast("Colaborador actualizado"); }
    else { await supabase.from("colaboradores").insert(payload); showToast("Colaborador agregado"); }
    setColForm({nombre:"",cedula:"",celular:"",valor_hora:""}); loadColaboradores();
  };

  const deleteCol = async(id)=>{ await supabase.from("colaboradores").delete().eq("id",id); loadColaboradores(); loadTurnos(); showToast("Colaborador eliminado"); };

  const copiarLink = (turnoId)=>{
    const cuenta=cuentas.find(c=>c.turno_id===turnoId);
    if(!cuenta) return showToast("No se encontró la cuenta de cobro","err");
    const link=`${window.location.origin}${window.location.pathname}?token=${cuenta.token}`;
    navigator.clipboard.writeText(link).then(()=>showToast("¡Enlace copiado! Envíalo al trabajador")).catch(()=>prompt("Copia este enlace:",link));
  };

  const verPDF = async(turnoId)=>{
    setGenerandoPDF(turnoId);
    try {
      const turno=turnos.find(t=>t.id===turnoId);
      const col=colaboradores.find(c=>c.id===turno.colaborador_id);
      const cuenta=cuentas.find(c=>c.turno_id===turnoId);
      let firmaImg=null;
      if(cuenta?.firmada){ const {data:f}=await supabase.from("firmas").select("firma_base64").eq("cuenta_cobro_id",cuenta.id).single(); firmaImg=f?.firma_base64||null; }
      generarPDF(turno,col,cuenta,firmaImg);
    } catch(e){ showToast("Error al generar PDF","err"); }
    setGenerandoPDF(null);
  };

  const previewMins = turnoForm.entrada&&turnoForm.salida ? calcHoras(turnoForm) : 0;
  const previewCol = colaboradores.find(c=>c.id===turnoForm.colaborador_id);
  const previewPago = previewMins&&previewCol ? (previewMins/60)*previewCol.valor_hora : 0;
  const turnosFiltrados = turnos.filter(t=>!filterCol||t.colaborador_id===filterCol);
  const colMap = Object.fromEntries(colaboradores.map(c=>[c.id,c]));

  if(loading) return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><style>{css}</style><Spinner /><div style={{color:G.muted,fontSize:13}}>Cargando...</div></div>;

  if(!session) return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{css}</style>
      {toast&&<Toast {...toast}/>}
      <div style={{width:"100%",maxWidth:400}} className="fade">
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:8}}>🕐</div>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:"-.02em"}}>TurnosPRO</div>
          <div style={{color:G.muted,fontSize:13,marginTop:4}}>Sistema de control de turnos y nómina</div>
        </div>
        <div className="card">
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setAuthMode(m)} style={{flex:1,padding:"9px 0",fontSize:13,background:authMode===m?G.accent:G.surface,color:authMode===m?"#fff":G.muted,border:`1px solid ${authMode===m?G.accent:G.border}`}}>
                {m==="login"?"Iniciar sesión":"Crear cuenta"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label>Email</label><input type="email" placeholder="correo@empresa.com" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))}/></div>
            <div><label>Contraseña</label><input type="password" placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}/></div>
            <button className="btn-primary" style={{marginTop:4,padding:"13px 0",fontSize:15}} onClick={authMode==="login"?handleLogin:handleRegister}>
              {authMode==="login"?"Entrar →":"Crear cuenta de administrador →"}
            </button>
          </div>
          {authMode==="register"&&<div style={{color:G.muted,fontSize:11,marginTop:14,textAlign:"center"}}>La primera cuenta creada será administrador</div>}
        </div>
      </div>
    </div>
  );

  const navItems=[
    {id:"turnos",label:"Turnos",icon:"⏱"},
    {id:"colaboradores",label:"Colaboradores",icon:"👥"},
    {id:"historial",label:"Historial",icon:"📋"},
    ...(userRol==="admin"?[{id:"reportes",label:"Reportes",icon:"📊"},{id:"usuarios",label:"Usuarios",icon:"🔐"}]:[]),
  ];

  return (
    <div style={{minHeight:"100vh",background:G.bg}}>
      <style>{css}</style>
      {toast&&<Toast {...toast}/>}
      <header style={{background:G.card,borderBottom:`1px solid ${G.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>🕐</span>
          <div><div style={{fontWeight:800,fontSize:16}}>TurnosPRO</div><div style={{fontSize:10,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".08em"}}>{userRol?.toUpperCase()}</div></div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} style={{padding:"7px 12px",fontSize:12,background:view===n.id?G.accent:G.surface,color:view===n.id?"#fff":G.muted,border:`1px solid ${view===n.id?G.accent:G.border}`}}>
              {n.icon} {n.label}
            </button>
          ))}
          <button className="btn-ghost" onClick={logout} style={{padding:"7px 12px",fontSize:12}}>Salir</button>
        </div>
      </header>

      <main style={{maxWidth:920,margin:"0 auto",padding:"28px 16px"}}>

        {view==="turnos"&&(
          <div className="fade">
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Registrar Turno</h2>
            {colaboradores.length===0?(
              <div className="card" style={{textAlign:"center",padding:48}}>
                <div style={{fontSize:40,marginBottom:12}}>👥</div>
                <div style={{color:G.muted}}>Primero agrega colaboradores</div>
                <button className="btn-primary" style={{marginTop:16}} onClick={()=>setView("colaboradores")}>Ir a Colaboradores →</button>
              </div>
            ):(
              <div className="card" style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div><label>Colaborador *</label>
                    <select value={turnoForm.colaborador_id} onChange={e=>setTurnoForm(f=>({...f,colaborador_id:e.target.value}))}>
                      <option value="">— Seleccionar —</option>
                      {colaboradores.map(c=><option key={c.id} value={c.id}>{c.nombre} · {COP(c.valor_hora)}/hr</option>)}
                    </select>
                  </div>
                  <div><label>Fecha *</label><input type="date" value={turnoForm.fecha} onChange={e=>setTurnoForm(f=>({...f,fecha:e.target.value}))}/></div>
                </div>
                <div style={{height:1,background:G.border}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                  {[["entrada","🟢 Entrada *"],["salida_almuerzo","🍽 Sale almuerzo"],["ingreso_almuerzo","↩ Regresa almuerzo"],["salida","🔴 Salida *"]].map(([k,l])=>(
                    <div key={k}><label>{l}</label><input type="time" value={turnoForm[k]} onChange={e=>setTurnoForm(f=>({...f,[k]:e.target.value}))}/></div>
                  ))}
                </div>
                {previewMins>0&&(
                  <div style={{background:"linear-gradient(135deg,#061a0c,#0c1a30)",border:`1px solid ${G.border}`,borderRadius:10,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>HORAS TRABAJADAS</div><div style={{fontSize:24,fontWeight:800,color:G.green}}>{minToHrs(previewMins)} hrs</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>PAGO ESTIMADO</div><div style={{fontSize:24,fontWeight:800,color:G.gold}}>{COP(previewPago)}</div></div>
                  </div>
                )}
                <button className="btn-primary" style={{padding:"13px 0",fontSize:15}} onClick={saveTurno}>Guardar Turno →</button>
              </div>
            )}
            {turnos.length>0&&(
              <div style={{marginTop:28}}>
                <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".1em",marginBottom:12}}>ÚLTIMOS REGISTROS</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {turnos.slice(0,6).map(t=>{
                    const col=colMap[t.colaborador_id];
                    const cuenta=cuentas.find(c=>c.turno_id===t.id);
                    return (
                      <div key={t.id} className="card" style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:14}}>{col?.nombre||"—"}</div>
                          <div style={{color:G.muted,fontSize:12,marginTop:2}}>{fmtFecha(t.fecha)} · {fmtHora(t.entrada)} → {fmtHora(t.salida)}</div>
                        </div>
                        <div style={{textAlign:"right",minWidth:90}}>
                          <div style={{color:G.green,fontSize:13,fontFamily:"'JetBrains Mono'"}}>{minToHrs(t.horas_trabajadas)} hrs</div>
                          <div style={{color:G.gold,fontWeight:700}}>{COP(t.pago)}</div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {cuenta&&!cuenta.firmada&&<button onClick={()=>copiarLink(t.id)} style={{background:"#0c1a3a",border:`1px solid ${G.accent}`,color:G.accent,padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>📋 Enlace firma</button>}
                          {cuenta?.firmada&&<><span className="pill pill-green">✓ Firmado</span><button onClick={()=>verPDF(t.id)} disabled={generandoPDF===t.id} style={{background:"#1c1000",border:`1px solid ${G.gold}`,color:G.gold,padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>{generandoPDF===t.id?"...":"📄 PDF"}</button></>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {view==="colaboradores"&&(
          <div className="fade">
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Colaboradores</h2>
            {userRol==="admin"&&(
              <div className="card" style={{marginBottom:20}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><label>Nombre completo *</label><input placeholder="Nombre completo" value={colForm.nombre} onChange={e=>setColForm(f=>({...f,nombre:e.target.value}))}/></div>
                  <div><label>Cédula</label><input placeholder="Número de cédula" value={colForm.cedula} onChange={e=>setColForm(f=>({...f,cedula:e.target.value}))}/></div>
                  <div><label>Celular</label><input placeholder="Número de celular" value={colForm.celular} onChange={e=>setColForm(f=>({...f,celular:e.target.value}))}/></div>
                  <div><label>Valor / hora (COP) *</label><input type="number" placeholder="Ej: 8000" value={colForm.valor_hora} onChange={e=>setColForm(f=>({...f,valor_hora:e.target.value}))}/></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-primary" style={{flex:1}} onClick={saveCol}>{editCol?"Actualizar colaborador":"+ Agregar colaborador"}</button>
                  {editCol&&<button className="btn-ghost" onClick={()=>{setEditCol(null);setColForm({nombre:"",cedula:"",celular:"",valor_hora:""});}}>Cancelar</button>}
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {colaboradores.map(c=>{
                const tc=turnos.filter(t=>t.colaborador_id===c.id);
                const totalHrs=tc.reduce((s,t)=>s+t.horas_trabajadas,0);
                const totalPago=tc.reduce((s,t)=>s+t.pago,0);
                return (
                  <div key={c.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:16}}>{c.nombre}</div>
                      <div style={{display:"flex",gap:12,marginTop:4,flexWrap:"wrap"}}>
                        {c.cedula&&<div style={{color:G.muted,fontSize:12}}>🪪 CC {c.cedula}</div>}
                        {c.celular&&<div style={{color:G.muted,fontSize:12}}>📱 {c.celular}</div>}
                        <div style={{color:G.gold,fontSize:12}}>{COP(c.valor_hora)}/hr</div>
                      </div>
                      <div style={{color:G.muted,fontSize:11,marginTop:4}}>{tc.length} turnos · {minToHrs(totalHrs)} hrs · {COP(totalPago)} acumulado</div>
                    </div>
                    {userRol==="admin"&&(
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn-ghost" onClick={()=>{setEditCol(c.id);setColForm({nombre:c.nombre,cedula:c.cedula||"",celular:c.celular||"",valor_hora:c.valor_hora});}}>Editar</button>
                        <button className="btn-danger" onClick={()=>deleteCol(c.id)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {colaboradores.length===0&&<div style={{textAlign:"center",padding:40,color:G.muted}}>No hay colaboradores aún</div>}
            </div>
          </div>
        )}

        {view==="historial"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <h2 style={{fontSize:20,fontWeight:700}}>Historial de Turnos</h2>
              <select value={filterCol} onChange={e=>setFilterCol(e.target.value)} style={{width:"auto",minWidth:180}}>
                <option value="">Todos los colaboradores</option>
                {colaboradores.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {turnosFiltrados.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                {[["Turnos",turnosFiltrados.length,G.accent],["Horas",`${minToHrs(turnosFiltrados.reduce((s,t)=>s+t.horas_trabajadas,0))}`,G.green],["Total",COP(turnosFiltrados.reduce((s,t)=>s+t.pago,0)),G.gold]].map(([l,v,color])=>(
                  <div key={l} className="card" style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>{l}</div>
                    <div style={{fontSize:22,fontWeight:800,color,marginTop:4}}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {turnosFiltrados.map(t=>{
                const col=colMap[t.colaborador_id];
                const cuenta=cuentas.find(c=>c.turno_id===t.id);
                return (
                  <div key={t.id} className="card" style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:140}}>
                      <div style={{fontWeight:600,fontSize:13}}>{col?.nombre||"—"}</div>
                      <div style={{color:G.muted,fontSize:11,marginTop:2}}>{fmtFecha(t.fecha)} · 🟢{fmtHora(t.entrada)} 🔴{fmtHora(t.salida)}</div>
                    </div>
                    <span className="pill pill-green">{minToHrs(t.horas_trabajadas)}h</span>
                    <div style={{fontWeight:700,color:G.gold,fontSize:14,minWidth:90,textAlign:"right"}}>{COP(t.pago)}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {cuenta&&!cuenta.firmada&&<button onClick={()=>copiarLink(t.id)} style={{background:"#0c1a3a",border:`1px solid ${G.accent}`,color:G.accent,padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>📋 Enlace</button>}
                      {cuenta?.firmada&&<><span className="pill pill-green">✓</span><button onClick={()=>verPDF(t.id)} disabled={generandoPDF===t.id} style={{background:"#1c1000",border:`1px solid ${G.gold}`,color:G.gold,padding:"6px 10px",fontSize:11,borderRadius:6}}>{generandoPDF===t.id?"...":"📄 PDF"}</button></>}
                    </div>
                  </div>
                );
              })}
              {turnosFiltrados.length===0&&<div style={{textAlign:"center",padding:40,color:G.muted}}>No hay registros</div>}
            </div>
          </div>
        )}

        {view==="reportes"&&userRol==="admin"&&(
          <div className="fade">
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Reportes</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
              {[["Total colaboradores",colaboradores.length,"👥",G.accent],["Total turnos",turnos.length,"⏱",G.green],["Horas totales",`${minToHrs(turnos.reduce((s,t)=>s+t.horas_trabajadas,0))}`,"🕐",G.gold],["Total pagado",COP(turnos.reduce((s,t)=>s+t.pago,0)),"💰",G.green]].map(([l,v,icon,color])=>(
                <div key={l} className="card" style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:28}}>{icon}</div>
                  <div><div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>{l.toUpperCase()}</div><div style={{fontSize:22,fontWeight:800,color}}>{v}</div></div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {colaboradores.map(c=>{
                const tc=turnos.filter(t=>t.colaborador_id===c.id);
                const pTotal=tc.reduce((s,t)=>s+t.pago,0);
                const hTotal=tc.reduce((s,t)=>s+t.horas_trabajadas,0);
                const firmados=tc.filter(t=>cuentas.find(cc=>cc.turno_id===t.id&&cc.firmada)).length;
                return (
                  <div key={c.id} className="card" style={{display:"grid",gridTemplateColumns:"1fr 70px 80px 110px 80px",gap:16,alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:600}}>{c.nombre}</div>
                      <div style={{fontSize:11,color:G.muted}}>{c.cedula?`CC ${c.cedula}`:""}{c.celular?` · 📱 ${c.celular}`:""}</div>
                    </div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>TURNOS</div><div style={{fontWeight:700}}>{tc.length}</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>HORAS</div><div style={{fontWeight:700,color:G.green}}>{minToHrs(hTotal)}</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>TOTAL</div><div style={{fontWeight:700,color:G.gold}}>{COP(pTotal)}</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>FIRMADOS</div><div style={{fontWeight:700,color:G.green}}>{firmados}/{tc.length}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view==="usuarios"&&userRol==="admin"&&(
          <div className="fade">
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Gestión de Usuarios</h2>

            {/* Formulario crear usuario */}
            <div className="card" style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:G.text}}>➕ Crear nuevo usuario</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                <div><label>Email</label><input type="email" placeholder="correo@empresa.com" value={nuevoUsuario.email} onChange={e=>setNuevoUsuario(f=>({...f,email:e.target.value}))}/></div>
                <div><label>Contraseña</label><input type="password" placeholder="Mínimo 6 caracteres" value={nuevoUsuario.password} onChange={e=>setNuevoUsuario(f=>({...f,password:e.target.value}))}/></div>
                <div><label>Rol</label>
                  <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario(f=>({...f,rol:e.target.value}))}>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" disabled={creandoUsuario} onClick={async()=>{
                if(!nuevoUsuario.email||!nuevoUsuario.password) return showToast("Completa todos los campos","err");
                if(nuevoUsuario.password.length<6) return showToast("La contraseña debe tener al menos 6 caracteres","err");
                setCreandoUsuario(true);
                try {
                  const {data,error} = await supabase.rpc("create_user",{
                    user_email: nuevoUsuario.email,
                    user_password: nuevoUsuario.password,
                    user_rol: nuevoUsuario.rol
                  });
                  if(error) throw error;
                  showToast(`✓ Usuario ${nuevoUsuario.email} creado como ${nuevoUsuario.rol}`);
                  setNuevoUsuario({email:"",password:"",rol:"supervisor"});
                  loadUsuarios();
                } catch(e) {
                  showToast(e.message||"Error al crear usuario","err");
                }
                setCreandoUsuario(false);
              }}>
                {creandoUsuario ? "Creando..." : "Crear usuario →"}
              </button>
            </div>

            {/* Lista de usuarios */}
            <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".1em",marginBottom:12}}>USUARIOS REGISTRADOS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {usuarios.map(u=>(
                <div key={u.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{u.email||u.user_id.substring(0,20)+"..."}</div>
                    <div style={{fontSize:11,color:G.muted,marginTop:3,fontFamily:"'JetBrains Mono'"}}>ID: {u.user_id.substring(0,16)}...</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span className={`pill ${u.rol==="admin"?"pill-gold":"pill-blue"}`}>{u.rol}</span>
                    {u.user_id !== session?.user?.id && (
                      <button className="btn-danger" onClick={async()=>{
                        if(!confirm("¿Eliminar este usuario?")) return;
                        await supabase.from("user_roles").delete().eq("user_id",u.user_id);
                        showToast("Usuario eliminado");
                        loadUsuarios();
                      }}>Eliminar</button>
                    )}
                    {u.user_id === session?.user?.id && (
                      <span style={{fontSize:11,color:G.muted}}>(tú)</span>
                    )}
                  </div>
                </div>
              ))}
              {usuarios.length===0&&<div style={{textAlign:"center",padding:40,color:G.muted}}>No hay usuarios registrados</div>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
