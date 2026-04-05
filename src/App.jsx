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

const generarPDF = (turno, contratista, cuenta, firmaImg) => {
  const almuerzo = turno.salida_almuerzo ? `${fmtHora(turno.salida_almuerzo)} → ${fmtHora(turno.ingreso_almuerzo)}` : "Sin descanso";
  const firmaHtml = firmaImg
    ? `<img src="${firmaImg}" alt="Firma" style="max-width:100%;max-height:150px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;display:block;margin:10px auto"/>`
    : `<div style="padding:30px;color:#94a3b8;border:1px dashed #e2e8f0;border-radius:6px;text-align:center">Sin firma registrada</div>`;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
  <title>Cuenta de Cobro - ${contratista.nombre}</title>
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
    .firma-box{border:2px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:18px}
    .badge{display:inline-block;background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;border-radius:99px;padding:3px 12px;font-size:11px;font-weight:600}
    .footer{border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6}
    .print-btn{display:block;margin:24px auto 0;background:#1d4ed8;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
    @media print{.print-btn{display:none!important}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Prestación<span> de Servicio</span></div><div style="font-size:12px;color:#64748b;margin-top:4px">Sistema de control y pago de prestaciones de servicio</div></div>
    <div class="doc-info"><strong>CUENTA DE COBRO</strong>No. ${cuenta.numero_consecutivo||cuenta.token.substring(0,8).toUpperCase()}<br/>Fecha: ${fmtFecha(TODAY)}<br/><br/><span class="badge">✓ FIRMADA</span></div>
  </div>
  <h2>Datos del Contratista</h2>
  <div class="section grid" style="margin-bottom:18px">
    <div class="field"><label>Nombre completo</label><span>${contratista.nombre}</span></div>
    <div class="field"><label>Cédula</label><span>${contratista.cedula||"—"}</span></div>
    <div class="field"><label>Celular</label><span>${contratista.celular||"—"}</span></div>
    <div class="field"><label>Perfil</label><span>${contratista.perfil||"—"}</span></div>
    <div class="field"><label>Área</label><span>${contratista.area||"—"}</span></div>
    <div class="field"><label>Tipo de contrato</label><span>${contratista.tipo_contrato||"—"}</span></div>
    <div class="field"><label>Valor por hora de servicio</label><span>${COP(contratista.valor_hora)}</span></div>
  </div>
  <h2>Detalle de la Prestación de Servicio</h2>
  <div class="section grid" style="margin-bottom:18px">
    <div class="field"><label>Fecha de la prestación</label><span>${fmtFecha(turno.fecha)}</span></div>
    <div class="field"><label>Hora de inicio</label><span>${fmtHora(turno.entrada)}</span></div>
    <div class="field"><label>Descanso</label><span>${almuerzo}</span></div>
    <div class="field"><label>Hora de finalización</label><span>${fmtHora(turno.salida)}</span></div>
    <div class="field"><label>Horas de servicio prestado</label><span>${minToHrs(turno.horas_trabajadas)} horas</span></div>
    <div class="field"><label>Método de pago</label><span>${turno.metodo_pago||"Efectivo"}</span></div>
  </div>
  <div class="total-box">
    <div><div class="lbl">TOTAL A PAGAR</div><div class="amt">${COP(turno.pago)}</div><div style="font-size:12px;opacity:.7;margin-top:4px">${minToHrs(turno.horas_trabajadas)} hrs × ${COP(contratista.valor_hora)}/hr</div></div>
    <div style="text-align:right"><div class="lbl">ESTADO</div><div style="font-size:16px;font-weight:700;margin-top:4px">✓ PAGO REALIZADO</div><div style="font-size:12px;opacity:.7">Firmado digitalmente</div></div>
  </div>
  <h2>Firma del Contratista</h2>
  <div class="firma-box">
    <div style="font-size:12px;color:#64748b;margin-bottom:10px">El contratista firma confirmando que recibió el pago a satisfacción por la prestación de servicio:</div>
    ${firmaHtml}
    <div style="font-size:11px;color:#94a3b8;margin-top:12px;text-align:center">
      <strong style="color:#1a1a2e">Métodos de verificación aplicados:</strong><br/>
      ✓ Cédula verificada: ${contratista.cedula||"—"}<br/>
      ✓ OTP confirmado al celular: ${contratista.celular ? contratista.celular.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2") : "—"}<br/>
      ✓ IP del dispositivo: ${cuenta.ip_firma||"No disponible"}<br/>
      ✓ Firmado el: ${cuenta.firmado_en ? new Date(cuenta.firmado_en).toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" }) : "—"}<br/>
      No. Cuenta: ${cuenta.numero_consecutivo||"—"} · Token: ${cuenta.token}
    </div>
  </div>
  <div class="footer">Este documento es constancia de pago por prestación de servicio generada por el Sistema de Prestación de Servicio.<br/>La firma digital tiene validez como constancia de recibo del pago a satisfacción.<br/>Generado el ${nowStr()}</div>
  <button class="print-btn" onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) { win.onload = () => URL.revokeObjectURL(url); }
  else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuenta-cobro-${contratista.nombre.replace(/\s+/g,"-")}-${turno.fecha}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
};

// ── Página Pública de Firma ──
const PaginaFirma = ({ token }) => {
  const [estado, setEstado] = useState("cargando"); // cargando | cedula | otp | firma | firmando | firmado_ok | ya_firmado | no_encontrado
  const [cuenta, setCuenta] = useState(null);
  const [turno, setTurno] = useState(null);
  const [colaborador, setColaborador] = useState(null);
  const [cedulaInput, setCedulaInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [enviandoOTP, setEnviandoOTP] = useState(false);
  const [celularVerificado, setCelularVerificado] = useState("");

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("cuentas_cobro").select("*").eq("token", token).single();
      if (!c) return setEstado("no_encontrado");
      if (c.firmada) return setEstado("ya_firmado");
      const { data: t } = await supabase.from("turnos").select("*").eq("id", c.turno_id).single();
      const { data: col } = await supabase.from("colaboradores").select("*").eq("id", t.colaborador_id).single();
      setCuenta(c); setTurno(t); setColaborador(col); setEstado("cedula");
    })();
  }, [token]);

  // Paso 1: verificar cédula
  const verificarCedula = () => {
    setErrorMsg("");
    if (!cedulaInput.trim()) return setErrorMsg("Ingresa tu número de cédula");
    const cedulaRegistrada = colaborador.cedula?.replace(/\D/g, "");
    const cedulaIngresada = cedulaInput.replace(/\D/g, "");
    if (cedulaIngresada !== cedulaRegistrada) return setErrorMsg("La cédula no coincide con la registrada");
    if (!colaborador.celular) return setErrorMsg("No hay número de celular registrado. Contacta a tu empleador.");
    enviarOTP();
  };

  // Paso 2: enviar OTP
  const enviarOTP = async () => {
    setEnviandoOTP(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celular: colaborador.celular })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar SMS");
      setCelularVerificado(colaborador.celular);
      setEstado("otp");
    } catch (e) {
      setErrorMsg(e.message);
    }
    setEnviandoOTP(false);
  };

  // Paso 3: verificar OTP
  const verificarOTP = async () => {
    setErrorMsg("");
    if (!otpInput.trim() || otpInput.length !== 6) return setErrorMsg("Ingresa el código de 6 dígitos");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celular: colaborador.celular, otp: otpInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");
      setEstado("firma");
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  // Paso 4: guardar firma
  const firmar = async (img) => {
    setEstado("firmando");
    try {
      let ip = "No disponible";
      try { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json(); ip = d.ip || "No disponible"; } catch {}
      const { error: e1 } = await supabase.from("firmas").insert({ cuenta_cobro_id: cuenta.id, firma_base64: img, ip });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("cuentas_cobro").update({
        firmada: true, firmado_en: new Date().toISOString(), ip_firma: ip
      }).eq("id", cuenta.id);
      if (e2) throw e2;
      setEstado("firmado_ok");
    } catch (err) {
      console.error(err);
      setEstado("firma");
      alert("Error al guardar la firma. Intenta de nuevo.");
    }
  };

  // Celular enmascarado para mostrar
  const celularMask = colaborador?.celular
    ? colaborador.celular.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
    : "";

  if (estado === "cargando") return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><style>{css}</style><Spinner /><div style={{color:G.muted,fontSize:13}}>Cargando...</div></div>;
  if (estado === "no_encontrado") return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><div style={{textAlign:"center",padding:40}}><div style={{fontSize:48}}>❌</div><div style={{color:G.muted,marginTop:12}}>Cuenta de cobro no encontrada</div></div></div>;
  if (estado === "ya_firmado") return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><div style={{textAlign:"center",padding:40}} className="fade"><div style={{fontSize:64,marginBottom:16}}>✅</div><div style={{fontWeight:800,fontSize:24,color:G.green}}>Ya firmaste este comprobante</div><div style={{color:G.muted,marginTop:10,fontSize:14}}>Esta cuenta de cobro ya fue firmada anteriormente.</div></div></div>;
  if (estado === "firmado_ok") return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{css}</style>
      <div style={{textAlign:"center",padding:40}} className="fade">
        <div style={{fontSize:64,marginBottom:16}}>✅</div>
        <div style={{fontWeight:800,fontSize:24,color:G.green}}>¡Firma registrada!</div>
        <div style={{color:G.muted,marginTop:10,fontSize:14,lineHeight:1.6}}>Tu firma quedó guardada como constancia<br/>de que recibiste el pago por la prestación de servicio.</div>
        {turno && <div style={{marginTop:20,background:G.card,border:`1px solid ${G.border}`,borderRadius:10,padding:"16px 24px",display:"inline-block"}}>
          <div style={{color:G.gold,fontWeight:800,fontSize:22}}>{COP(turno.pago)}</div>
          <div style={{color:G.muted,fontSize:12,marginTop:4}}>Turno del {fmtFecha(turno?.fecha)}</div>
        </div>}
      </div>
    </div>
  );

  // Pasos de verificación y firma
  const pasos = ["cedula","otp","firma","firmando"];
  const pasoActual = pasos.indexOf(estado)+1;

  return (
    <div style={{minHeight:"100vh",background:G.bg,padding:"28px 16px"}}>
      <style>{css}</style>
      <div style={{maxWidth:520,margin:"0 auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:11,letterSpacing:".2em",color:G.muted,fontFamily:"'JetBrains Mono'",marginBottom:6}}>PRESTACIÓN DE SERVICIO · CUENTA DE COBRO</div>
          <div style={{fontSize:22,fontWeight:800}}>{colaborador?.nombre}</div>
          <div style={{color:G.gold,fontWeight:700,fontSize:18,marginTop:4}}>{turno && COP(turno.pago)}</div>
          <div style={{color:G.muted,fontSize:12,marginTop:2}}>Turno del {turno && fmtFecha(turno.fecha)}</div>
        </div>

        {/* Indicador de pasos */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
          {[["🪪","Cédula"],["📱","Código SMS"],["✍️","Firma"]].map(([icon,label],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:pasoActual>i+1?"#052e16":pasoActual===i+1?G.accent:G.surface,border:`1px solid ${pasoActual>i+1?G.green:pasoActual===i+1?G.accent:G.border}`}}>
                {pasoActual>i+1?"✓":icon}
              </div>
              <div style={{fontSize:11,color:pasoActual===i+1?G.text:G.muted,display:window.innerWidth>400?"block":"none"}}>{label}</div>
              {i<2&&<div style={{width:20,height:1,background:G.border}}/>}
            </div>
          ))}
        </div>

        {/* Paso 1: Cédula */}
        {estado==="cedula"&&(
          <div className="card fade">
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>🪪 Verifica tu identidad</div>
            <div style={{color:G.muted,fontSize:13,marginBottom:16}}>Ingresa tu número de cédula para continuar</div>
            <div style={{marginBottom:12}}>
              <label>Número de cédula</label>
              <input type="number" placeholder="Ej: 1234567890" value={cedulaInput} onChange={e=>setCedulaInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verificarCedula()} style={{fontSize:18,textAlign:"center",letterSpacing:".05em"}}/>
            </div>
            {errorMsg&&<div style={{color:G.red,fontSize:13,marginBottom:12,padding:"8px 12px",background:"#1f0a0a",borderRadius:6}}>⚠️ {errorMsg}</div>}
            <button className="btn-primary" style={{width:"100%",padding:"13px 0",fontSize:15}} onClick={verificarCedula} disabled={enviandoOTP}>
              {enviandoOTP?"Enviando código SMS...":"Verificar cédula →"}
            </button>
          </div>
        )}

        {/* Paso 2: OTP */}
        {estado==="otp"&&(
          <div className="card fade">
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>📱 Código de verificación</div>
            <div style={{color:G.muted,fontSize:13,marginBottom:16}}>
              Enviamos un código SMS al número <strong style={{color:G.text}}>{celularMask}</strong>. Ingresa el código de 6 dígitos:
            </div>
            <div style={{marginBottom:12}}>
              <label>Código SMS</label>
              <input type="number" placeholder="000000" value={otpInput} onChange={e=>setOtpInput(e.target.value.slice(0,6))} onKeyDown={e=>e.key==="Enter"&&verificarOTP()} style={{fontSize:28,textAlign:"center",letterSpacing:".3em",fontFamily:"'JetBrains Mono'"}}/>
            </div>
            {errorMsg&&<div style={{color:G.red,fontSize:13,marginBottom:12,padding:"8px 12px",background:"#1f0a0a",borderRadius:6}}>⚠️ {errorMsg}</div>}
            <button className="btn-primary" style={{width:"100%",padding:"13px 0",fontSize:15,marginBottom:10}} onClick={verificarOTP}>
              Verificar código →
            </button>
            <button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={()=>{setOtpInput("");setErrorMsg("");enviarOTP();}}>
              Reenviar código
            </button>
          </div>
        )}

        {/* Paso 3: Firma */}
        {(estado==="firma"||estado==="firmando")&&(
          <>
            <div className="card fade" style={{marginBottom:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Fecha",fmtFecha(turno.fecha)],["Horas",`${minToHrs(turno.horas_trabajadas)} hrs`],["Entrada",fmtHora(turno.entrada)],["Salida",fmtHora(turno.salida)]].map(([k,v])=>(
                  <div key={k} style={{background:G.surface,padding:"10px 12px",borderRadius:8}}>
                    <div style={{fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3,fontFamily:"'JetBrains Mono'"}}>{k}</div>
                    <div style={{fontWeight:600,fontSize:13}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)",borderRadius:10,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
                <div style={{color:"rgba(255,255,255,.7)",fontSize:12}}>Total a recibir</div>
                <div style={{fontWeight:800,fontSize:26,color:"#fff"}}>{COP(turno.pago)}</div>
              </div>
            </div>
            <div className="card fade">
              {estado==="firmando"
                ? <div style={{textAlign:"center",padding:30}}><Spinner /><div style={{color:G.muted,marginTop:12,fontSize:13}}>Guardando firma...</div></div>
                : <>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>✍️ Firma de conformidad</div>
                    <div style={{color:G.muted,fontSize:12,marginBottom:12}}>
                      ✓ Cédula verificada &nbsp;·&nbsp; ✓ SMS confirmado al {celularMask}
                    </div>
                    <FirmaCanvas onFirma={firmar}/>
                    <div style={{color:G.muted,fontSize:11,marginTop:12,textAlign:"center",lineHeight:1.5}}>
                      Al firmar confirmas que recibiste {COP(turno.pago)}<br/>por la prestación de servicio del {fmtFecha(turno.fecha)}
                    </div>
                  </>
              }
            </div>
          </>
        )}
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
  const [turnoForm, setTurnoForm] = useState({ colaborador_id:"", fecha:TODAY, entrada:"", salida_almuerzo:"", ingreso_almuerzo:"", salida:"", metodo_pago:"efectivo" });
  const [colForm, setColForm] = useState({ nombre:"", cedula:"", celular:"", valor_hora:"", perfil:"", area:"", tipo_contrato:"" });
  const [editCol, setEditCol] = useState(null);
  const [editTurno, setEditTurno] = useState(null);
  const [authForm, setAuthForm] = useState({ email:"", password:"" });
  const [filterCol, setFilterCol] = useState("");
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(null);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email:"", password:"", rol:"supervisor" });
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [anticipos, setAnticipos] = useState([]);
  const [anticipoForm, setAnticipoForm] = useState({ colaborador_id:"", monto:"", descripcion:"" });
  const [showAnticipos, setShowAnticipos] = useState(false);

  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) return <><style>{css}</style><PaginaFirma token={urlToken} /></>;

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session) loadRol(session.user.id); else setLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,s)=>{ setSession(s); if(s) loadRol(s.user.id); else {setLoading(false);setUserRol(null);} });
    return ()=>subscription.unsubscribe();
  },[]);

  const loadRol = async(uid)=>{
    const {data,error}=await supabase.from("user_roles").select("rol").eq("user_id",uid).maybeSingle();
    if(error) console.error("loadRol error:",error);
    setUserRol(data?.rol||"admin");
    setLoading(false);
  };

  useEffect(()=>{
    if(!session) return;
    loadColaboradores(); loadTurnos(); loadCuentas(); loadAnticipos();
    if(userRol==="admin") loadUsuarios();
    const sub = supabase.channel("cuentas_realtime")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"cuentas_cobro"},()=>{
        loadCuentas();
        showToast("🖊 ¡Un colaborador acaba de firmar su cuenta de cobro!");
      }).subscribe();

    // Recordatorio fin de día a las 6pm
    const checkRecordatorio = ()=>{
      const ahora=new Date();
      if(ahora.getHours()===18&&ahora.getMinutes()===0){
        supabase.from("cuentas_cobro").select("*").eq("firmada",false).then(({data})=>{
          if(data?.length>0) showToast(`⏰ Recordatorio: ${data.length} cuenta(s) de cobro pendiente(s) de firma por prestación de servicio`,"err");
        });
      }
    };
    const intervalo=setInterval(checkRecordatorio,60000);
    return ()=>{ supabase.removeChannel(sub); clearInterval(intervalo); };
  },[session,userRol]);

  const loadColaboradores = async()=>{ const {data}=await supabase.from("colaboradores").select("*").order("nombre"); setColaboradores(data||[]); };
  const loadTurnos = async()=>{ const {data}=await supabase.from("turnos").select("*").order("fecha",{ascending:false}); setTurnos(data||[]); };
  const loadCuentas = async()=>{ const {data}=await supabase.from("cuentas_cobro").select("*"); setCuentas(data||[]); };
  const loadUsuarios = async()=>{ const {data}=await supabase.from("user_roles").select("*").order("created_at"); setUsuarios(data||[]); };
  const loadAnticipos = async()=>{ const {data}=await supabase.from("anticipos").select("*").order("created_at",{ascending:false}); setAnticipos(data||[]); };

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
    // Verificar si hay anticipo pendiente para descontar
    const anticipoPendiente = anticipos.find(a=>a.colaborador_id===turnoForm.colaborador_id&&!a.descontado);
    const pagoFinal = anticipoPendiente ? Math.max(0, pago - anticipoPendiente.monto) : pago;

    if(editTurno) {
      const {error}=await supabase.from("turnos").update({...turnoForm,horas_trabajadas:mins,pago:pagoFinal}).eq("id",editTurno);
      if(error) return showToast("Error al actualizar prestación de servicio","err");
      if(anticipoPendiente){ await supabase.from("anticipos").update({descontado:true,turno_descuento_id:editTurno}).eq("id",anticipoPendiente.id); loadAnticipos(); }
      setEditTurno(null);
      showToast(`✓ Prestación actualizada · ${minToHrs(mins)} hrs · ${COP(pagoFinal)}`);
    } else {
      const {data:t,error}=await supabase.from("turnos").insert({...turnoForm,horas_trabajadas:mins,pago:pagoFinal,creado_por:session.user.id}).select().single();
      if(error) return showToast("Error al guardar prestación de servicio","err");
      // Generar número consecutivo
      const {data:consec} = await supabase.rpc("generar_consecutivo");
      await supabase.from("cuentas_cobro").insert({turno_id:t.id,token:genToken(),numero_consecutivo:consec});
      await supabase.from("auditoria").insert({user_id:session.user.id,accion:"crear_prestacion",tabla:"turnos",registro_id:t.id,detalle:{contratista:col.nombre,pago:pagoFinal}});
      if(anticipoPendiente){ await supabase.from("anticipos").update({descontado:true,turno_descuento_id:t.id}).eq("id",anticipoPendiente.id); loadAnticipos(); showToast(`✓ Prestación guardada · Anticipo de ${COP(anticipoPendiente.monto)} descontado · Neto: ${COP(pagoFinal)}`); }
      else showToast(`✓ Prestación guardada · ${minToHrs(mins)} hrs · ${COP(pagoFinal)}`);
    }
    loadTurnos(); loadCuentas();
    setTurnoForm(f=>({...f,entrada:"",salida_almuerzo:"",ingreso_almuerzo:"",salida:"",metodo_pago:"efectivo"}));
  };

  const deleteTurno = async(id)=>{
    if(!confirm("¿Eliminar esta prestación de servicio? Esta acción no se puede deshacer.")) return;
    await supabase.from("cuentas_cobro").delete().eq("turno_id",id);
    await supabase.from("turnos").delete().eq("id",id);
    loadTurnos(); loadCuentas();
    showToast("Prestación de servicio eliminada");
  };

  const saveAnticipos = async()=>{
    if(!anticipoForm.colaborador_id||!anticipoForm.monto) return showToast("Selecciona colaborador y monto","err");
    await supabase.from("anticipos").insert({ colaborador_id:anticipoForm.colaborador_id, monto:Number(anticipoForm.monto), descripcion:anticipoForm.descripcion, creado_por:session.user.id });
    setAnticipoForm({colaborador_id:"",monto:"",descripcion:""});
    loadAnticipos();
    showToast("Anticipo registrado — se descontará de la próxima prestación de servicio");
  };

  const exportarExcel = ()=>{
    setExportandoExcel(true);
    try {
      const filas = turnosFiltrados.map(t=>{
        const col=colMap[t.colaborador_id];
        const cuenta=cuentas.find(c=>c.turno_id===t.id);
        return [t.fecha, col?.nombre||"—", col?.cedula||"—", fmtHora(t.entrada), t.salida_almuerzo?fmtHora(t.salida_almuerzo):"", t.ingreso_almuerzo?fmtHora(t.ingreso_almuerzo):"", fmtHora(t.salida), minToHrs(t.horas_trabajadas), t.metodo_pago||"efectivo", t.pago, cuenta?.firmada?"Sí":"No"];
      });
      const header=["Fecha","Contratista","Cédula","Hora Inicio","Sale Descanso","Regresa Descanso","Hora Fin","Horas de Servicio","Método Pago","Total Pago","Firmado"];
      const csvContent = [header,...filas].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
      const blob=new Blob(["\uFEFF"+csvContent],{type:"text/csv;charset=utf-8;"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`prestacion-servicio-${TODAY}.csv`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),3000);
      showToast("✓ Archivo descargado");
    } catch(e){ showToast("Error al exportar","err"); }
    setExportandoExcel(false);
  };

  const saveCol = async()=>{
    if(!colForm.nombre.trim()||!colForm.cedula.trim()||!colForm.celular.trim()||!colForm.valor_hora||!colForm.perfil.trim()||!colForm.area.trim()||!colForm.tipo_contrato.trim())
      return showToast("Todos los campos son obligatorios","err");
    const payload={nombre:colForm.nombre.trim(),cedula:colForm.cedula.trim(),celular:colForm.celular.trim(),valor_hora:Number(colForm.valor_hora),perfil:colForm.perfil.trim(),area:colForm.area.trim(),tipo_contrato:colForm.tipo_contrato.trim()};
    if(editCol){ await supabase.from("colaboradores").update(payload).eq("id",editCol); setEditCol(null); showToast("Contratista actualizado"); }
    else { await supabase.from("colaboradores").insert(payload); showToast("Contratista agregado"); }
    setColForm({nombre:"",cedula:"",celular:"",valor_hora:"",perfil:"",area:"",tipo_contrato:""}); loadColaboradores();
  };

  const deleteCol = async(id)=>{ await supabase.from("colaboradores").delete().eq("id",id); loadColaboradores(); loadTurnos(); showToast("Contratista eliminado"); };

  const copiarLink = (turnoId)=>{
    const cuenta=cuentas.find(c=>c.turno_id===turnoId);
    if(!cuenta) return showToast("No se encontró la cuenta de cobro","err");
    const link=`${window.location.origin}${window.location.pathname}?token=${cuenta.token}`;
    navigator.clipboard.writeText(link).then(()=>showToast("¡Enlace copiado! Envíalo al trabajador")).catch(()=>prompt("Copia este enlace:",link));
  };

  const compartirWhatsApp = (turnoId)=>{
    const turno=turnos.find(t=>t.id===turnoId);
    const col=colMap[turno?.colaborador_id];
    const cuenta=cuentas.find(c=>c.turno_id===turnoId);
    if(!cuenta) return showToast("No se encontró la cuenta de cobro","err");
    const link=`${window.location.origin}${window.location.pathname}?token=${cuenta.token}`;
    const msg=`Hola ${col?.nombre||""}! 👋\n\nTe comparto tu cuenta de cobro de *Prestación de Servicio* correspondiente a la prestación del *${fmtFecha(turno.fecha)}*.\n\n💰 Total: *${COP(turno.pago)}*\n⏱ Horas de servicio: *${minToHrs(turno.horas_trabajadas)} hrs*\n\nPor favor firma aquí para confirmar que recibiste el pago:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
  };

  // Detectar turnos sin firmar después de 1 hora
  useEffect(()=>{
    if(!session||!turnos.length||!cuentas.length) return;
    const ahora = new Date();
    const sinFirmar = turnos.filter(t=>{
      const cuenta=cuentas.find(c=>c.turno_id===t.id);
      if(!cuenta||cuenta.firmada) return false;
      const creado=new Date(t.created_at);
      const diffHrs=(ahora-creado)/1000/60/60;
      return diffHrs>=1 && diffHrs<2; // solo alertar entre 1 y 2 horas
    });
    if(sinFirmar.length>0){
      const nombres=sinFirmar.map(t=>colMap[t.colaborador_id]?.nombre||"—").join(", ");
      showToast(`⚠️ ${sinFirmar.length} prestación(es) sin firmar hace más de 1 hora: ${nombres}`,"err");
    }
  },[turnos,cuentas]);

  const verPDF = async(turnoId)=>{
    setGenerandoPDF(turnoId);
    try {
      const turno=turnos.find(t=>t.id===turnoId);
      const contratista=colaboradores.find(c=>c.id===turno.colaborador_id);
      const {data:cuentaFresca}=await supabase.from("cuentas_cobro").select("*").eq("turno_id",turnoId).single();
      let firmaImg=null;
      if(cuentaFresca?.firmada){ const {data:f}=await supabase.from("firmas").select("firma_base64").eq("cuenta_cobro_id",cuentaFresca.id).single(); firmaImg=f?.firma_base64||null; }
      generarPDF(turno,contratista,cuentaFresca||cuentas.find(c=>c.turno_id===turnoId),firmaImg);
    } catch(e){ showToast("Error al generar PDF","err"); }
    setGenerandoPDF(null);
  };

  const previewMins = turnoForm.entrada&&turnoForm.salida ? calcHoras(turnoForm) : 0;
  const previewCol = colaboradores.find(c=>c.id===turnoForm.colaborador_id);
  const previewPago = previewMins&&previewCol ? (previewMins/60)*previewCol.valor_hora : 0;
  const anticipoPendiente = previewCol ? anticipos.find(a=>a.colaborador_id===previewCol.id&&!a.descontado) : null;
  const previewPagoFinal = anticipoPendiente ? Math.max(0, previewPago - anticipoPendiente.monto) : previewPago;
  const turnosFiltrados = turnos.filter(t=>{
    if(filterCol && t.colaborador_id!==filterCol) return false;
    if(filterFechaDesde && t.fecha<filterFechaDesde) return false;
    if(filterFechaHasta && t.fecha>filterFechaHasta) return false;
    return true;
  });
  const colMap = Object.fromEntries(colaboradores.map(c=>[c.id,c]));
  const METODOS = [{v:"efectivo",l:"💵 Efectivo"},{v:"transferencia",l:"🏦 Transferencia"},{v:"nequi",l:"📲 Nequi"},{v:"daviplata",l:"📲 Daviplata"}];

  if(loading) return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><style>{css}</style><Spinner /><div style={{color:G.muted,fontSize:13}}>Cargando...</div></div>;

  if(!session) return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{css}</style>
      {toast&&<Toast {...toast}/>}
      <div style={{width:"100%",maxWidth:400}} className="fade">
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:8}}>📋</div>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:"-.02em"}}>Prestación de Servicio</div>
          <div style={{color:G.muted,fontSize:13,marginTop:4}}>Sistema de control y pago de prestaciones de servicio</div>
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
    {id:"turnos",label:"Prestaciones",icon:"⏱"},
    {id:"colaboradores",label:"Contratistas",icon:"👥"},
    {id:"historial",label:"Historial",icon:"📋"},
    {id:"anticipos",label:"Anticipos",icon:"💸"},
    ...(userRol==="admin"?[{id:"reportes",label:"Reportes",icon:"📊"},{id:"usuarios",label:"Usuarios",icon:"🔐"}]:[]),
  ];

  return (
    <div style={{minHeight:"100vh",background:G.bg}}>
      <style>{css}</style>
      {toast&&<Toast {...toast}/>}
      <header style={{background:G.card,borderBottom:`1px solid ${G.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>📋</span>
          <div><div style={{fontWeight:800,fontSize:16}}>Prestación de Servicio</div><div style={{fontSize:10,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".08em"}}>Sistema de control y pago · {userRol?.toUpperCase()}</div></div>
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
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Registrar Prestación de Servicio</h2>
            {colaboradores.length===0?(
              <div className="card" style={{textAlign:"center",padding:48}}>
                <div style={{fontSize:40,marginBottom:12}}>👥</div>
                <div style={{color:G.muted}}>Primero agrega contratistas</div>
                <button className="btn-primary" style={{marginTop:16}} onClick={()=>setView("colaboradores")}>Ir a Contratistas →</button>
              </div>
            ):(
              <div className="card" style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div><label>Contratista *</label>
                    <select value={turnoForm.colaborador_id} onChange={e=>setTurnoForm(f=>({...f,colaborador_id:e.target.value}))}>
                      <option value="">— Seleccionar —</option>
                      {colaboradores.map(c=><option key={c.id} value={c.id}>{c.nombre} · {COP(c.valor_hora)}/hr</option>)}
                    </select>
                  </div>
                  <div><label>Fecha *</label><input type="date" value={turnoForm.fecha} onChange={e=>setTurnoForm(f=>({...f,fecha:e.target.value}))}/></div>
                </div>
                <div style={{height:1,background:G.border}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                  {[["entrada","🟢 Hora inicio *"],["salida_almuerzo","🍽 Sale descanso"],["ingreso_almuerzo","↩ Regresa descanso"],["salida","🔴 Hora fin *"]].map(([k,l])=>(
                    <div key={k}><label>{l}</label><input type="time" value={turnoForm[k]} onChange={e=>setTurnoForm(f=>({...f,[k]:e.target.value}))}/></div>
                  ))}
                </div>
                {previewMins>0&&(
                  <div style={{background:"linear-gradient(135deg,#061a0c,#0c1a30)",border:`1px solid ${G.border}`,borderRadius:10,padding:"14px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>HORAS DE SERVICIO</div><div style={{fontSize:24,fontWeight:800,color:G.green}}>{minToHrs(previewMins)} hrs</div></div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>PAGO {anticipoPendiente?"NETO":"ESTIMADO"}</div>
                        <div style={{fontSize:24,fontWeight:800,color:G.gold}}>{COP(previewPagoFinal)}</div>
                      </div>
                    </div>
                    {anticipoPendiente&&(
                      <div style={{marginTop:10,padding:"8px 12px",background:"#1f0a0a",border:`1px solid #5a1a1a`,borderRadius:6,fontSize:12,color:G.red}}>
                        ⚠️ Se descontará anticipo de {COP(anticipoPendiente.monto)}: {anticipoPendiente.descripcion||"Sin descripción"}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label>Método de pago</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                    {METODOS.map(m=>(
                      <button key={m.v} onClick={()=>setTurnoForm(f=>({...f,metodo_pago:m.v}))} style={{padding:"9px 0",fontSize:12,background:turnoForm.metodo_pago===m.v?G.accent:G.surface,color:turnoForm.metodo_pago===m.v?"#fff":G.muted,border:`1px solid ${turnoForm.metodo_pago===m.v?G.accent:G.border}`}}>
                        {m.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-primary" style={{flex:1,padding:"13px 0",fontSize:15}} onClick={saveTurno}>{editTurno?"Actualizar Prestación →":"Guardar Prestación →"}</button>
                  {editTurno&&<button className="btn-ghost" style={{padding:"13px 20px"}} onClick={()=>{setEditTurno(null);setTurnoForm({colaborador_id:"",fecha:TODAY,entrada:"",salida_almuerzo:"",ingreso_almuerzo:"",salida:"",metodo_pago:"efectivo"});}}>Cancelar</button>}
                </div>
              </div>
            )}
            {turnos.length>0&&(
              <div style={{marginTop:28}}>
                <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".1em",marginBottom:12}}>ÚLTIMAS PRESTACIONES</div>
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
                        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                          {cuenta&&!cuenta.firmada&&<>
                            <button onClick={()=>copiarLink(t.id)} style={{background:"#0c1a3a",border:`1px solid ${G.accent}`,color:G.accent,padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>📋 Copiar</button>
                            <button onClick={()=>compartirWhatsApp(t.id)} style={{background:"#0a2010",border:"1px solid #25d366",color:"#25d366",padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>📲 WhatsApp</button>
                            {userRol==="admin"&&<><button onClick={()=>{setEditTurno(t.id);setTurnoForm({colaborador_id:t.colaborador_id,fecha:t.fecha,entrada:t.entrada,salida_almuerzo:t.salida_almuerzo||"",ingreso_almuerzo:t.ingreso_almuerzo||"",salida:t.salida,metodo_pago:t.metodo_pago||"efectivo"});window.scrollTo(0,0);}} style={{background:"#1a1a0a",border:`1px solid ${G.gold}`,color:G.gold,padding:"6px 10px",fontSize:11,borderRadius:6}}>✏️</button><button onClick={()=>deleteTurno(t.id)} style={{background:"#1f0a0a",border:`1px solid ${G.red}`,color:G.red,padding:"6px 10px",fontSize:11,borderRadius:6}}>🗑</button></>}
                          </>}
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
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Contratistas</h2>
            {userRol==="admin"&&(
              <div className="card" style={{marginBottom:20}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><label>Nombre completo *</label><input placeholder="Nombre completo" value={colForm.nombre} onChange={e=>setColForm(f=>({...f,nombre:e.target.value}))}/></div>
                  <div><label>Cédula *</label><input placeholder="Número de cédula" value={colForm.cedula} onChange={e=>setColForm(f=>({...f,cedula:e.target.value}))}/></div>
                  <div><label>Celular *</label><input placeholder="Número de celular" value={colForm.celular} onChange={e=>setColForm(f=>({...f,celular:e.target.value}))}/></div>
                  <div><label>Valor / hora de servicio (COP) *</label><input type="number" placeholder="Ej: 8000" value={colForm.valor_hora} onChange={e=>setColForm(f=>({...f,valor_hora:e.target.value}))}/></div>
                  <div><label>Perfil *</label><input placeholder="Ej: Enfermero, Médico, Técnico" value={colForm.perfil} onChange={e=>setColForm(f=>({...f,perfil:e.target.value}))}/></div>
                  <div><label>Área *</label><input placeholder="Ej: Urgencias, UCI, Consulta" value={colForm.area} onChange={e=>setColForm(f=>({...f,area:e.target.value}))}/></div>
                  <div style={{gridColumn:"span 2"}}><label>Tipo de contrato *</label><input placeholder="Ej: Prestación de servicios, OPS" value={colForm.tipo_contrato} onChange={e=>setColForm(f=>({...f,tipo_contrato:e.target.value}))}/></div>
                </div>
                <div style={{fontSize:11,color:G.muted,marginBottom:12}}>* Todos los campos son obligatorios</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-primary" style={{flex:1}} onClick={saveCol}>{editCol?"Actualizar contratista":"+ Agregar contratista"}</button>
                  {editCol&&<button className="btn-ghost" onClick={()=>{setEditCol(null);setColForm({nombre:"",cedula:"",celular:"",valor_hora:"",perfil:"",area:"",tipo_contrato:""});}}>Cancelar</button>}
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
                      <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap"}}>
                        {c.perfil&&<span className="pill pill-blue">{c.perfil}</span>}
                        {c.area&&<span className="pill pill-green">{c.area}</span>}
                        {c.tipo_contrato&&<span style={{fontSize:11,color:G.muted}}>{c.tipo_contrato}</span>}
                      </div>
                      <div style={{color:G.muted,fontSize:11,marginTop:4}}>{tc.length} prestaciones · {minToHrs(totalHrs)} hrs · {COP(totalPago)} acumulado</div>
                    </div>
                    {userRol==="admin"&&(
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn-ghost" onClick={()=>{setEditCol(c.id);setColForm({nombre:c.nombre,cedula:c.cedula||"",celular:c.celular||"",valor_hora:c.valor_hora,perfil:c.perfil||"",area:c.area||"",tipo_contrato:c.tipo_contrato||""});}}>Editar</button>
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
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h2 style={{fontSize:20,fontWeight:700}}>Historial de Prestaciones</h2>
                <button onClick={exportarExcel} disabled={exportandoExcel} style={{background:"#052e16",border:`1px solid ${G.green}`,color:G.green,padding:"8px 14px",fontSize:12,borderRadius:8,fontWeight:600}}>
                  {exportandoExcel?"...":"📥 Exportar CSV"}
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <div><label>Colaborador</label>
                  <select value={filterCol} onChange={e=>setFilterCol(e.target.value)}>
                    <option value="">Todos</option>
                    {colaboradores.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div><label>Desde</label><input type="date" value={filterFechaDesde} onChange={e=>setFilterFechaDesde(e.target.value)}/></div>
                <div><label>Hasta</label><input type="date" value={filterFechaHasta} onChange={e=>setFilterFechaHasta(e.target.value)}/></div>
              </div>
              {(filterCol||filterFechaDesde||filterFechaHasta)&&(
                <button className="btn-ghost" style={{marginTop:8,fontSize:11}} onClick={()=>{setFilterCol("");setFilterFechaDesde("");setFilterFechaHasta("");}}>✕ Limpiar filtros</button>
              )}
            </div>
            {turnosFiltrados.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                {[["Prestaciones",turnosFiltrados.length,G.accent],["Horas de Servicio",`${minToHrs(turnosFiltrados.reduce((s,t)=>s+t.horas_trabajadas,0))}`,G.green],["Total",COP(turnosFiltrados.reduce((s,t)=>s+t.pago,0)),G.gold]].map(([l,v,color])=>(
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
                      {cuenta?.numero_consecutivo&&<div style={{color:G.accent,fontSize:10,fontFamily:"'JetBrains Mono'",marginTop:2}}>No. {cuenta.numero_consecutivo}</div>}
                    </div>
                    <span className="pill pill-green">{minToHrs(t.horas_trabajadas)}h servicio</span>
                    <div style={{fontWeight:700,color:G.gold,fontSize:14,minWidth:90,textAlign:"right"}}>{COP(t.pago)}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>{METODOS.find(m=>m.v===t.metodo_pago)?.l||"💵 Efectivo"}</span>
                      {cuenta&&!cuenta.firmada&&<>
                        <button onClick={()=>copiarLink(t.id)} style={{background:"#0c1a3a",border:`1px solid ${G.accent}`,color:G.accent,padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>📋</button>
                        <button onClick={()=>compartirWhatsApp(t.id)} style={{background:"#0a2010",border:"1px solid #25d366",color:"#25d366",padding:"6px 10px",fontSize:11,borderRadius:6,whiteSpace:"nowrap"}}>📲</button>
                        {userRol==="admin"&&<><button onClick={()=>{setEditTurno(t.id);setTurnoForm({colaborador_id:t.colaborador_id,fecha:t.fecha,entrada:t.entrada,salida_almuerzo:t.salida_almuerzo||"",ingreso_almuerzo:t.ingreso_almuerzo||"",salida:t.salida,metodo_pago:t.metodo_pago||"efectivo"});setView("turnos");window.scrollTo(0,0);}} style={{background:"#1a1a0a",border:`1px solid ${G.gold}`,color:G.gold,padding:"6px 8px",fontSize:11,borderRadius:6}}>✏️</button><button onClick={()=>deleteTurno(t.id)} style={{background:"#1f0a0a",border:`1px solid ${G.red}`,color:G.red,padding:"6px 8px",fontSize:11,borderRadius:6}}>🗑</button></>}
                      </>}
                      {cuenta?.firmada&&<><span className="pill pill-green">✓</span><button onClick={()=>verPDF(t.id)} disabled={generandoPDF===t.id} style={{background:"#1c1000",border:`1px solid ${G.gold}`,color:G.gold,padding:"6px 10px",fontSize:11,borderRadius:6}}>{generandoPDF===t.id?"...":"📄 PDF"}</button></>}
                    </div>
                  </div>
                );
              })}
              {turnosFiltrados.length===0&&<div style={{textAlign:"center",padding:40,color:G.muted}}>No hay registros</div>}
            </div>
          </div>
        )}

        {view==="reportes"&&userRol==="admin"&&(()=>{
          // Calcular semana actual
          const hoy=new Date();
          const diaSemana=hoy.getDay()||7;
          const lunes=new Date(hoy); lunes.setDate(hoy.getDate()-(diaSemana-1)); lunes.setHours(0,0,0,0);
          const domingo=new Date(lunes); domingo.setDate(lunes.getDate()+6); domingo.setHours(23,59,59,999);
          const fmtSemana=(d)=>d.toLocaleDateString("es-CO",{day:"2-digit",month:"short"});
          const turnosSemana=turnos.filter(t=>{ const f=new Date(t.fecha+"T00:00:00"); return f>=lunes&&f<=domingo; });

          return (
          <div className="fade">
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>Reportes</h2>

            {/* Totales generales */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
              {[["Total contratistas",colaboradores.length,"👥",G.accent],["Total prestaciones",turnos.length,"⏱",G.green],["Horas de servicio",`${minToHrs(turnos.reduce((s,t)=>s+t.horas_trabajadas,0))}`,"🕐",G.gold],["Total pagado",COP(turnos.reduce((s,t)=>s+t.pago,0)),"💰",G.green]].map(([l,v,icon,color])=>(
                <div key={l} className="card" style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:28}}>{icon}</div>
                  <div><div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'"}}>{l.toUpperCase()}</div><div style={{fontSize:22,fontWeight:800,color}}>{v}</div></div>
                </div>
              ))}
            </div>

            {/* Reporte semanal */}
            <div style={{background:"#0c1a30",border:`1px solid #1e3a6e`,borderRadius:12,padding:"18px 20px",marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:G.text}}>📅 Reporte Semanal de Prestaciones</div>
                  <div style={{fontSize:12,color:G.muted,marginTop:2}}>{fmtSemana(lunes)} — {fmtSemana(domingo)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:G.muted}}>PRESTACIONES ESTA SEMANA</div>
                  <div style={{fontSize:22,fontWeight:800,color:G.accent}}>{turnosSemana.length}</div>
                </div>
              </div>
              {turnosSemana.length===0
                ? <div style={{textAlign:"center",padding:20,color:G.muted,fontSize:13}}>No hay prestaciones registradas esta semana</div>
                : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {colaboradores.map(c=>{
                      const tc=turnosSemana.filter(t=>t.colaborador_id===c.id);
                      if(!tc.length) return null;
                      const hrs=tc.reduce((s,t)=>s+t.horas_trabajadas,0);
                      const pago=tc.reduce((s,t)=>s+t.pago,0);
                      const firmados=tc.filter(t=>cuentas.find(cc=>cc.turno_id===t.id&&cc.firmada)).length;
                      return (
                        <div key={c.id} style={{background:"#0a1520",border:`1px solid #1e2a3a`,borderRadius:8,padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 60px 90px 110px 80px",gap:12,alignItems:"center"}}>
                          <div><div style={{fontWeight:600,fontSize:13}}>{c.nombre}</div><div style={{fontSize:11,color:G.muted}}>{tc.length} turno{tc.length>1?"s":""}</div></div>
                          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>DÍAS</div><div style={{fontWeight:700,color:G.accent}}>{tc.length}</div></div>
                          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>HORAS</div><div style={{fontWeight:700,color:G.green}}>{minToHrs(hrs)}</div></div>
                          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>A PAGAR</div><div style={{fontWeight:700,color:G.gold,fontSize:13}}>{COP(pago)}</div></div>
                          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>FIRMAS</div><div style={{fontWeight:700,color:firmados===tc.length?G.green:G.red}}>{firmados}/{tc.length}</div></div>
                        </div>
                      );
                    })}
                    <div style={{borderTop:`1px solid #1e3a6e`,paddingTop:12,marginTop:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:12,color:G.muted}}>Total semana</div>
                      <div style={{display:"flex",gap:20}}>
                        <div style={{textAlign:"right"}}><div style={{fontSize:10,color:G.muted}}>HORAS</div><div style={{fontWeight:800,color:G.green}}>{minToHrs(turnosSemana.reduce((s,t)=>s+t.horas_trabajadas,0))}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontSize:10,color:G.muted}}>TOTAL</div><div style={{fontWeight:800,color:G.gold}}>{COP(turnosSemana.reduce((s,t)=>s+t.pago,0))}</div></div>
                      </div>
                    </div>
                  </div>
              }
            </div>

            {/* Por colaborador acumulado */}
            <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".1em",marginBottom:12}}>ACUMULADO TOTAL POR CONTRATISTA</div>
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
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:G.muted}}>FIRMADOS</div><div style={{fontWeight:700,color:firmados===tc.length&&tc.length>0?G.green:G.red}}>{firmados}/{tc.length}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {view==="anticipos"&&(
          <div className="fade">
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:22}}>💸 Anticipos y Préstamos</h2>
            {userRol==="admin"&&(
              <div className="card" style={{marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Registrar anticipo</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                  <div><label>Contratista</label>
                    <select value={anticipoForm.colaborador_id} onChange={e=>setAnticipoForm(f=>({...f,colaborador_id:e.target.value}))}>
                      <option value="">— Seleccionar —</option>
                      {colaboradores.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div><label>Monto (COP)</label><input type="number" placeholder="Ej: 50000" value={anticipoForm.monto} onChange={e=>setAnticipoForm(f=>({...f,monto:e.target.value}))}/></div>
                  <div><label>Descripción</label><input placeholder="Ej: Préstamo personal" value={anticipoForm.descripcion} onChange={e=>setAnticipoForm(f=>({...f,descripcion:e.target.value}))}/></div>
                </div>
                <button className="btn-primary" onClick={saveAnticipos}>+ Registrar anticipo</button>
                <div style={{fontSize:12,color:G.muted,marginTop:10}}>⚠️ El anticipo se descontará automáticamente de la próxima prestación de servicio del contratista</div>
              </div>
            )}

            {/* Pendientes */}
            <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".1em",marginBottom:10}}>PENDIENTES DE DESCUENTO</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
              {anticipos.filter(a=>!a.descontado).map(a=>{
                const col=colMap[a.colaborador_id];
                return (
                  <div key={a.id} className="card" style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid #5a1a1a`,background:"#1a0a0a"}}>
                    <div>
                      <div style={{fontWeight:600}}>{col?.nombre||"—"}</div>
                      <div style={{fontSize:12,color:G.muted,marginTop:2}}>{a.descripcion||"Sin descripción"} · {new Date(a.created_at).toLocaleDateString("es-CO")}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{color:G.red,fontWeight:700,fontSize:16}}>{COP(a.monto)}</div>
                      <span className="pill pill-red">Pendiente</span>
                    </div>
                  </div>
                );
              })}
              {anticipos.filter(a=>!a.descontado).length===0&&<div style={{textAlign:"center",padding:20,color:G.muted,fontSize:13}}>No hay anticipos pendientes</div>}
            </div>

            {/* Descontados */}
            <div style={{fontSize:11,color:G.muted,fontFamily:"'JetBrains Mono'",letterSpacing:".1em",marginBottom:10}}>HISTORIAL DESCONTADOS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {anticipos.filter(a=>a.descontado).map(a=>{
                const col=colMap[a.colaborador_id];
                return (
                  <div key={a.id} className="card" style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:600}}>{col?.nombre||"—"}</div>
                      <div style={{fontSize:12,color:G.muted,marginTop:2}}>{a.descripcion||"Sin descripción"} · {new Date(a.created_at).toLocaleDateString("es-CO")}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{color:G.muted,fontWeight:700,fontSize:15,textDecoration:"line-through"}}>{COP(a.monto)}</div>
                      <span className="pill pill-green">✓ Descontado</span>
                    </div>
                  </div>
                );
              })}
              {anticipos.filter(a=>a.descontado).length===0&&<div style={{textAlign:"center",padding:20,color:G.muted,fontSize:13}}>No hay anticipos descontados aún</div>}
            </div>
          </div>
        )}
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
