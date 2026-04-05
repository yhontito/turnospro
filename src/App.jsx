import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://acpqfphdstyfoasoxhfn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcHFmcGhkc3R5Zm9hc294aGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQzMzgsImV4cCI6MjA5MDkyMDMzOH0.bA0pFS01eK2RI0oTL5_rvj1N-t_5nnE3OMfSlYBWpAk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ──
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

// ── Styles ──
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
  input,select,textarea{background:${G.surface};border:1px solid ${G.border};color:${G.text};padding:10px 14px;border-radius:8px;font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;transition:border .2s,box-shadow .2s}
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
  .pill-red{background:#1f0a0a;color:${G.red};border:1px solid #5a1a1a}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade{animation:fadeIn .3s ease}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin 1s linear infinite;display:inline-block}
`;

// ── Components ──
const Spinner = () => <span className="spin" style={{ fontSize: 18 }}>⟳</span>;

const Toast = ({ msg, type }) => (
  <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: type === "err" ? "#1f0a0a" : "#052e16", border: `1px solid ${type === "err" ? G.red : G.green}`, color: type === "err" ? G.red : G.green, padding: "12px 20px", borderRadius: 10, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,.6)", maxWidth: 320 }}>
    {type === "err" ? "✕ " : "✓ "}{msg}
  </div>
);

// ── Firma Canvas ──
const FirmaCanvas = ({ onFirma }) => {
  const ref = useRef(null);
  const drawing = useRef(false);
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); };
  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; const c = ref.current, ctx = c.getContext("2d"), p = getPos(e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw = (e) => { e.preventDefault(); if (!drawing.current) return; const c = ref.current, ctx = c.getContext("2d"), p = getPos(e, c); ctx.lineTo(p.x, p.y); ctx.strokeStyle = G.accent; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke(); };
  const stop = () => { drawing.current = false; };
  const save = () => { const c = ref.current; onFirma(c.toDataURL("image/png")); };
  return (
    <div>
      <canvas ref={ref} width={480} height={160} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
        style={{ border: `1px dashed ${G.border}`, borderRadius: 8, background: "#0d0f14", touchAction: "none", width: "100%", cursor: "crosshair" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn-ghost" onClick={clear} style={{ flex: 1 }}>Limpiar</button>
        <button className="btn-primary" onClick={save} style={{ flex: 2 }}>Confirmar Firma →</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// PÁGINA PÚBLICA: Firma del trabajador
// ══════════════════════════════════════════
const PaginaFirma = ({ token }) => {
  const [estado, setEstado] = useState("cargando");
  const [cuenta, setCuenta] = useState(null);
  const [turno, setTurno] = useState(null);
  const [colaborador, setColaborador] = useState(null);
  const [firmado, setFirmado] = useState(false);

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
    await supabase.from("firmas").insert({ cuenta_cobro_id: cuenta.id, firma_base64: img });
    await supabase.from("cuentas_cobro").update({ firmada: true, firmado_en: new Date().toISOString() }).eq("id", cuenta.id);
    setFirmado(true);
  };

  if (estado === "cargando") return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: G.bg }}><Spinner /></div>;
  if (estado === "no_encontrado") return <div style={{ textAlign: "center", padding: 60, color: G.muted }}>Cuenta de cobro no encontrada.</div>;
  if (estado === "ya_firmado" || firmado) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 700, color: G.green }}>¡Cuenta firmada!</div>
        <div style={{ color: G.muted, marginTop: 8 }}>Gracias, tu firma quedó registrada.</div>
      </div>
    </div>
  );

  const hrs = minToHrs(turno.horas_trabajadas);
  return (
    <div style={{ minHeight: "100vh", background: G.bg, padding: "32px 16px" }}>
      <style>{css}</style>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: ".2em", color: G.muted, fontFamily: "'JetBrains Mono'", marginBottom: 6 }}>CUENTA DE COBRO</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: G.text }}>Comprobante de Pago</div>
        </div>
        <div className="card fade" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${G.border}` }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{colaborador.nombre}</div>
              <div style={{ color: G.muted, fontSize: 13, marginTop: 2 }}>{COP(colaborador.valor_hora)} / hora</div>
            </div>
            <span className="pill pill-blue">Pendiente firma</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[["Fecha", turno.fecha], ["Entrada", turno.entrada], ["Salida almuerzo", turno.salida_almuerzo || "—"], ["Regreso almuerzo", turno.ingreso_almuerzo || "—"], ["Salida", turno.salida], ["Horas trabajadas", `${hrs} hrs`]].map(([k, v]) => (
              <div key={k} style={{ background: G.surface, padding: "10px 14px", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3, fontFamily: "'JetBrains Mono'" }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "linear-gradient(135deg,#0c1a0c,#0a1a2e)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: G.muted, fontSize: 13 }}>Total a recibir</div>
            <div style={{ fontWeight: 800, fontSize: 26, color: G.gold }}>{COP(turno.pago)}</div>
          </div>
        </div>
        <div className="card fade">
          <label style={{ marginBottom: 12, fontSize: 13 }}>Firma aquí para confirmar que recibiste el pago</label>
          <FirmaCanvas onFirma={firmar} />
          <div style={{ color: G.muted, fontSize: 11, marginTop: 10, textAlign: "center" }}>Al firmar confirmas que recibiste {COP(turno.pago)} correspondiente al turno del {turno.fecha}</div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null);
  const [userRol, setUserRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [view, setView] = useState("turnos");
  const [toast, setToast] = useState(null);

  // Data
  const [colaboradores, setColaboradores] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Forms
  const [turnoForm, setTurnoForm] = useState({ colaborador_id: "", fecha: TODAY, entrada: "", salida_almuerzo: "", ingreso_almuerzo: "", salida: "" });
  const [colForm, setColForm] = useState({ nombre: "", valor_hora: "" });
  const [editCol, setEditCol] = useState(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "", nombre: "" });
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: "", password: "", rol: "supervisor" });
  const [filterCol, setFilterCol] = useState("");

  // Check token en URL para página de firma
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) return <><style>{css}</style><PaginaFirma token={urlToken} /></>;

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) loadRol(session.user.id); else setLoading(false); });
    supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (s) loadRol(s.user.id); else { setLoading(false); setUserRol(null); } });
  }, []);

  const loadRol = async (uid) => {
    const { data } = await supabase.from("user_roles").select("rol").eq("user_id", uid).single();
    setUserRol(data?.rol || "admin");
    setLoading(false);
  };

  useEffect(() => { if (session) { loadColaboradores(); loadTurnos(); loadCuentas(); if (userRol === "admin") loadUsuarios(); } }, [session, userRol]);

  const loadColaboradores = async () => { const { data } = await supabase.from("colaboradores").select("*").order("nombre"); setColaboradores(data || []); };
  const loadTurnos = async () => { const { data } = await supabase.from("turnos").select("*").order("fecha", { ascending: false }); setTurnos(data || []); };
  const loadCuentas = async () => { const { data } = await supabase.from("cuentas_cobro").select("*"); setCuentas(data || []); };
  const loadUsuarios = async () => { const { data } = await supabase.from("user_roles").select("*"); setUsuarios(data || []); };

  // Auth
  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
    if (error) { showToast(error.message, "err"); setLoading(false); }
  };

  const handleRegister = async () => {
    if (!authForm.email || !authForm.password) return showToast("Completa todos los campos", "err");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password });
    if (error) { showToast(error.message, "err"); setLoading(false); return; }
    await supabase.from("user_roles").insert({ user_id: data.user.id, rol: "admin" });
    showToast("¡Cuenta de administrador creada!");
    setLoading(false);
  };

  const logout = () => supabase.auth.signOut();

  // Turnos
  const saveTurno = async () => {
    if (!turnoForm.colaborador_id || !turnoForm.fecha || !turnoForm.entrada || !turnoForm.salida) return showToast("Completa los campos obligatorios", "err");
    const mins = calcHoras(turnoForm);
    if (!mins) return showToast("Revisa los horarios", "err");
    const col = colaboradores.find(c => c.id === turnoForm.colaborador_id);
    const pago = (mins / 60) * col.valor_hora;
    const { data: t, error } = await supabase.from("turnos").insert({ ...turnoForm, horas_trabajadas: mins, pago, creado_por: session.user.id }).select().single();
    if (error) return showToast("Error al guardar turno", "err");
    // Crear cuenta de cobro
    const token = genToken();
    await supabase.from("cuentas_cobro").insert({ turno_id: t.id, token });
    await supabase.from("auditoria").insert({ user_id: session.user.id, accion: "crear_turno", tabla: "turnos", registro_id: t.id, detalle: { colaborador: col.nombre, pago } });
    loadTurnos(); loadCuentas();
    setTurnoForm(f => ({ ...f, entrada: "", salida_almuerzo: "", ingreso_almuerzo: "", salida: "" }));
    showToast(`✓ Turno guardado · ${minToHrs(mins)} hrs · ${COP(pago)}`);
  };

  // Colaboradores
  const saveCol = async () => {
    if (!colForm.nombre.trim() || !colForm.valor_hora) return showToast("Completa todos los campos", "err");
    if (editCol) {
      await supabase.from("colaboradores").update({ nombre: colForm.nombre.trim(), valor_hora: Number(colForm.valor_hora) }).eq("id", editCol);
      setEditCol(null); showToast("Colaborador actualizado");
    } else {
      await supabase.from("colaboradores").insert({ nombre: colForm.nombre.trim(), valor_hora: Number(colForm.valor_hora) });
      showToast("Colaborador agregado");
    }
    setColForm({ nombre: "", valor_hora: "" }); loadColaboradores();
  };

  const deleteCol = async (id) => {
    await supabase.from("colaboradores").delete().eq("id", id);
    loadColaboradores(); loadTurnos(); showToast("Colaborador eliminado");
  };

  // Usuarios
  const crearUsuario = async () => {
    if (!nuevoUsuario.email || !nuevoUsuario.password) return showToast("Completa los campos", "err");
    const { data, error } = await supabase.auth.admin ? await supabase.auth.signUp({ email: nuevoUsuario.email, password: nuevoUsuario.password }) : { error: "No permitido" };
    if (error) return showToast("Usa el panel de Supabase para crear usuarios adicionales", "err");
    await supabase.from("user_roles").insert({ user_id: data.user.id, rol: nuevoUsuario.rol });
    loadUsuarios(); showToast("Usuario creado");
  };

  // Link firma
  const linkFirma = (turnoId) => {
    const cuenta = cuentas.find(c => c.turno_id === turnoId);
    if (!cuenta) return null;
    return `${window.location.origin}${window.location.pathname}?token=${cuenta.token}`;
  };

  const copiarLink = (turnoId) => {
    const link = linkFirma(turnoId);
    if (!link) return showToast("No se encontró la cuenta de cobro", "err");
    navigator.clipboard.writeText(link);
    showToast("¡Enlace copiado! Envíalo al trabajador");
  };

  // Turnos filtrados
  const turnosFiltrados = turnos.filter(t => !filterCol || t.colaborador_id === filterCol);
  const colMap = Object.fromEntries(colaboradores.map(c => [c.id, c]));

  // Preview turno
  const previewMins = turnoForm.entrada && turnoForm.salida ? calcHoras(turnoForm) : 0;
  const previewCol = colaboradores.find(c => c.id === turnoForm.colaborador_id);
  const previewPago = previewMins && previewCol ? (previewMins / 60) * previewCol.valor_hora : 0;

  // ── LOADING ──
  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <Spinner />
      <div style={{ color: G.muted, fontSize: 13 }}>Cargando...</div>
    </div>
  );

  // ── AUTH ──
  if (!session) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{css}</style>
      {toast && <Toast {...toast} />}
      <div style={{ width: "100%", maxWidth: 400 }} className="fade">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🕐</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>TurnosPRO</div>
          <div style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>Sistema de control de turnos y nómina</div>
        </div>
        <div className="card">
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: "9px 0", fontSize: 13, background: authMode === m ? G.accent : G.surface, color: authMode === m ? "#fff" : G.muted, border: `1px solid ${authMode === m ? G.accent : G.border}` }}>
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label>Email</label><input type="email" placeholder="correo@empresa.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label>Contraseña</label><input type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} /></div>
            <button className="btn-primary" style={{ marginTop: 4, padding: "13px 0", fontSize: 15 }} onClick={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "login" ? "Entrar →" : "Crear cuenta de administrador →"}
            </button>
          </div>
          {authMode === "register" && <div style={{ color: G.muted, fontSize: 11, marginTop: 14, textAlign: "center" }}>La primera cuenta creada será administrador</div>}
        </div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  const navItems = [
    { id: "turnos", label: "Turnos", icon: "⏱" },
    { id: "colaboradores", label: "Colaboradores", icon: "👥", adminOnly: false },
    { id: "historial", label: "Historial", icon: "📋" },
    ...(userRol === "admin" ? [{ id: "reportes", label: "Reportes", icon: "📊" }, { id: "usuarios", label: "Usuarios", icon: "🔐" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: G.bg }}>
      <style>{css}</style>
      {toast && <Toast {...toast} />}

      {/* Header */}
      <header style={{ background: G.card, borderBottom: `1px solid ${G.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🕐</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.01em" }}>TurnosPRO</div>
            <div style={{ fontSize: 10, color: G.muted, fontFamily: "'JetBrains Mono'", letterSpacing: ".08em" }}>{userRol?.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{ padding: "7px 12px", fontSize: 12, background: view === n.id ? G.accent : G.surface, color: view === n.id ? "#fff" : G.muted, border: `1px solid ${view === n.id ? G.accent : G.border}` }}>
              {n.icon} {n.label}
            </button>
          ))}
          <button className="btn-ghost" onClick={logout} style={{ padding: "7px 12px", fontSize: 12 }}>Salir</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>

        {/* ── TURNOS ── */}
        {view === "turnos" && (
          <div className="fade">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 22 }}>Registrar Turno</h2>
            {colaboradores.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <div style={{ color: G.muted }}>Primero agrega colaboradores</div>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setView("colaboradores")}>Ir a Colaboradores →</button>
              </div>
            ) : (
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label>Colaborador *</label>
                    <select value={turnoForm.colaborador_id} onChange={e => setTurnoForm(f => ({ ...f, colaborador_id: e.target.value }))}>
                      <option value="">— Seleccionar —</option>
                      {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre} · {COP(c.valor_hora)}/hr</option>)}
                    </select>
                  </div>
                  <div><label>Fecha *</label><input type="date" value={turnoForm.fecha} onChange={e => setTurnoForm(f => ({ ...f, fecha: e.target.value }))} /></div>
                </div>
                <div style={{ height: 1, background: G.border }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  {[["entrada", "🟢 Entrada *"], ["salida_almuerzo", "🍽 Sale almuerzo"], ["ingreso_almuerzo", "↩ Regresa almuerzo"], ["salida", "🔴 Salida *"]].map(([k, l]) => (
                    <div key={k}><label>{l}</label><input type="time" value={turnoForm[k]} onChange={e => setTurnoForm(f => ({ ...f, [k]: e.target.value }))} /></div>
                  ))}
                </div>
                {previewMins > 0 && (
                  <div style={{ background: "linear-gradient(135deg,#061a0c,#0c1a30)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: 11, color: G.muted, fontFamily: "'JetBrains Mono'", letterSpacing: ".08em" }}>HORAS TRABAJADAS</div><div style={{ fontSize: 24, fontWeight: 800, color: G.green }}>{minToHrs(previewMins)} hrs</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: G.muted, fontFamily: "'JetBrains Mono'", letterSpacing: ".08em" }}>PAGO ESTIMADO</div><div style={{ fontSize: 24, fontWeight: 800, color: G.gold }}>{COP(previewPago)}</div></div>
                  </div>
                )}
                <button className="btn-primary" style={{ padding: "13px 0", fontSize: 15 }} onClick={saveTurno}>Guardar Turno →</button>
              </div>
            )}

            {/* Últimos turnos */}
            {turnos.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 11, color: G.muted, fontFamily: "'JetBrains Mono'", letterSpacing: ".1em", marginBottom: 12 }}>ÚLTIMOS REGISTROS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {turnos.slice(0, 6).map(t => {
                    const col = colMap[t.colaborador_id];
                    const cuenta = cuentas.find(c => c.turno_id === t.id);
                    return (
                      <div key={t.id} className="card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{col?.nombre || "—"}</div>
                          <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{t.fecha} · {t.entrada} → {t.salida}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: G.green, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{minToHrs(t.horas_trabajadas)} hrs</div>
                            <div style={{ color: G.gold, fontWeight: 700 }}>{COP(t.pago)}</div>
                          </div>
                          {cuenta && (
                            <button onClick={() => copiarLink(t.id)} style={{ background: cuenta.firmada ? "#052e16" : "#0c1a3a", border: `1px solid ${cuenta.firmada ? G.green : G.accent}`, color: cuenta.firmada ? G.green : G.accent, padding: "6px 12px", fontSize: 11, borderRadius: 6, whiteSpace: "nowrap" }}>
                              {cuenta.firmada ? "✓ Firmado" : "📋 Copiar enlace"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COLABORADORES ── */}
        {view === "colaboradores" && (
          <div className="fade">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 22 }}>Colaboradores</h2>
            {userRol === "admin" && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
                  <div><label>Nombre</label><input placeholder="Nombre completo" value={colForm.nombre} onChange={e => setColForm(f => ({ ...f, nombre: e.target.value }))} /></div>
                  <div><label>Valor / hora (COP)</label><input type="number" placeholder="Ej: 8000" value={colForm.valor_hora} onChange={e => setColForm(f => ({ ...f, valor_hora: e.target.value }))} /></div>
                  <button className="btn-primary" onClick={saveCol}>{editCol ? "Actualizar" : "+ Agregar"}</button>
                </div>
                {editCol && <button className="btn-ghost" style={{ marginTop: 10 }} onClick={() => { setEditCol(null); setColForm({ nombre: "", valor_hora: "" }); }}>Cancelar</button>}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {colaboradores.map(c => {
                const tc = turnos.filter(t => t.colaborador_id === c.id);
                const totalHrs = tc.reduce((s, t) => s + t.horas_trabajadas, 0);
                const totalPago = tc.reduce((s, t) => s + t.pago, 0);
                return (
                  <div key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{c.nombre}</div>
                      <div style={{ color: G.gold, fontSize: 13, marginTop: 3 }}>{COP(c.valor_hora)} / hora</div>
                      <div style={{ color: G.muted, fontSize: 11, marginTop: 4 }}>{tc.length} turnos · {minToHrs(totalHrs)} hrs · {COP(totalPago)} acumulado</div>
                    </div>
                    {userRol === "admin" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-ghost" onClick={() => { setEditCol(c.id); setColForm({ nombre: c.nombre, valor_hora: c.valor_hora }); }}>Editar</button>
                        <button className="btn-danger" onClick={() => deleteCol(c.id)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {colaboradores.length === 0 && <div style={{ textAlign: "center", padding: 40, color: G.muted }}>No hay colaboradores aún</div>}
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {view === "historial" && (
          <div className="fade">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Historial de Turnos</h2>
              <select value={filterCol} onChange={e => setFilterCol(e.target.value)} style={{ width: "auto", minWidth: 180 }}>
                <option value="">Todos los colaboradores</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {turnosFiltrados.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[["Turnos", turnosFiltrados.length, G.accent], ["Horas", `${minToHrs(turnosFiltrados.reduce((s, t) => s + t.horas_trabajadas, 0))}`, G.green], ["Total", COP(turnosFiltrados.reduce((s, t) => s + t.pago, 0)), G.gold]].map(([l, v, color]) => (
                  <div key={l} className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: G.muted, fontFamily: "'JetBrains Mono'", letterSpacing: ".08em" }}>{l}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {turnosFiltrados.map(t => {
                const col = colMap[t.colaborador_id];
                const cuenta = cuentas.find(c => c.turno_id === t.id);
                return (
                  <div key={t.id} className="card" style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 80px 120px auto", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{col?.nombre || "—"}</div>
                      <div style={{ color: G.muted, fontSize: 11, marginTop: 2 }}>{t.fecha}</div>
                    </div>
                    <div style={{ fontSize: 12, color: G.muted }}>
                      <div>🟢 {t.entrada} {t.salida_almuerzo ? `· 🍽 ${t.salida_almuerzo}→${t.ingreso_almuerzo}` : ""}</div>
                      <div>🔴 {t.salida}</div>
                    </div>
                    <span className="pill pill-green">{minToHrs(t.horas_trabajadas)}h</span>
                    <div style={{ fontWeight: 700, color: G.gold, fontSize: 14 }}>{COP(t.pago)}</div>
                    {cuenta ? (
                      <button onClick={() => copiarLink(t.id)} style={{ background: cuenta.firmada ? "#052e16" : "#0c1a3a", border: `1px solid ${cuenta.firmada ? G.green : G.accent}`, color: cuenta.firmada ? G.green : G.accent, padding: "6px 10px", fontSize: 11, borderRadius: 6, whiteSpace: "nowrap" }}>
                        {cuenta.firmada ? "✓ Firmado" : "📋 Enlace"}
                      </button>
                    ) : <span />}
                  </div>
                );
              })}
              {turnosFiltrados.length === 0 && <div style={{ textAlign: "center", padding: 40, color: G.muted }}>No hay registros</div>}
            </div>
          </div>
        )}

        {/* ── REPORTES (solo admin) ── */}
        {view === "reportes" && userRol === "admin" && (
          <div className="fade">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 22 }}>Reportes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[["Total colaboradores", colaboradores.length, "👥", G.accent], ["Total turnos", turnos.length, "⏱", G.green], ["Horas totales", `${minToHrs(turnos.reduce((s, t) => s + t.horas_trabajadas, 0))}`, "🕐", G.gold], ["Total pagado", COP(turnos.reduce((s, t) => s + t.pago, 0)), "💰", G.green]].map(([l, v, icon, color]) => (
                <div key={l} className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{icon}</div>
                  <div><div style={{ fontSize: 11, color: G.muted, fontFamily: "'JetBrains Mono'" }}>{l.toUpperCase()}</div><div style={{ fontSize: 22, fontWeight: 800, color }}>{v}</div></div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: G.muted }}>Por colaborador</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {colaboradores.map(c => {
                const tc = turnos.filter(t => t.colaborador_id === c.id);
                const pTotal = tc.reduce((s, t) => s + t.pago, 0);
                const hTotal = tc.reduce((s, t) => s + t.horas_trabajadas, 0);
                const firmados = tc.filter(t => cuentas.find(cc => cc.turno_id === t.id && cc.firmada)).length;
                return (
                  <div key={c.id} className="card" style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 100px 80px", gap: 16, alignItems: "center" }}>
                    <div><div style={{ fontWeight: 600 }}>{c.nombre}</div><div style={{ fontSize: 11, color: G.muted }}>{COP(c.valor_hora)}/hr</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: G.muted }}>TURNOS</div><div style={{ fontWeight: 700 }}>{tc.length}</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: G.muted }}>HORAS</div><div style={{ fontWeight: 700, color: G.green }}>{minToHrs(hTotal)}</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: G.muted }}>TOTAL</div><div style={{ fontWeight: 700, color: G.gold }}>{COP(pTotal)}</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: G.muted }}>FIRMADOS</div><div style={{ fontWeight: 700, color: G.green }}>{firmados}/{tc.length}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── USUARIOS (solo admin) ── */}
        {view === "usuarios" && userRol === "admin" && (
          <div className="fade">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 22 }}>Gestión de Usuarios</h2>
            <div className="card" style={{ marginBottom: 20, background: "#0c1a0c", border: `1px solid #1a3a1a` }}>
              <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.6 }}>
                Para crear usuarios adicionales (supervisores), ve a <strong style={{ color: G.text }}>Supabase → Authentication → Users → Add user</strong>, crea el usuario y luego asígnale el rol desde la tabla <code style={{ background: G.surface, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>user_roles</code>.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {usuarios.map(u => (
                <div key={u.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13 }}>{u.user_id.substring(0, 16)}...</div>
                  <span className={`pill ${u.rol === "admin" ? "pill-gold" : "pill-blue"}`}>{u.rol}</span>
                </div>
              ))}
              {usuarios.length === 0 && <div style={{ textAlign: "center", padding: 40, color: G.muted }}>No hay usuarios registrados</div>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
