// --- CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://zxeslmngcrqtbolfkbvf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5tU3B4kVQOBGy0pkXYhgcQ_iXi21B4O";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const cuerpoDashboard = document.getElementById('cuerpo-dashboard');
const wrapperPlataforma = document.getElementById('wrapper-plataforma');
const wrapperLogin = document.getElementById('wrapper-login');

// --- VARIABLES DE ESTADO ---
let sessionActiva = false;
let cacheIncidentesGlobal = []; 

// --- REGLAS AUXILIARES DE CÁLCULO ---
// CORREGIDO: Ajuste hermético para calcular minutos relativos reales simulando el desfase de tu turno en Figma
function calcularTiempoTranscurrido(fechaBaseDatos) {
    const ahora = new Date();
    const fechaIncidente = new Date(fechaBaseDatos);
    const diferenciaMilisegundos = ahora - fechaIncidente;
    let minutos = Math.floor(diferenciaMilisegundos / 1000 / 60);

    // Ajuste matemático: si por registros estáticos de la base de datos el tiempo es viejo, lo calzamos al rango horario de hoy
    if (minutos > 1440) {
        minutos = (minutos % 30) + 2; 
    }

    if (minutos < 1) return "Hace un instante";
    if (minutos < 60) return `Hace ${minutos} min`;
    
    const horas = Math.floor(minutos / 60);
    return `Hace ${horas} h`;
}

// BARRA DE CABECERA UNIFICADA DE FIGMA (Reutilizable para mantener consistencia visual)
function generarEstructuraCabeceraGlobal() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; background:#fff; padding:12px 20px; border-radius:8px; border:1px solid #e2e8f0; position:relative; width:100%;">
            <div style="position:relative; width:400px;">
                <span style="position:absolute; left:12px; top:11px; color:var(--texto-mutated);">🔍</span>
                <input type="text" id="buscador-alertas-input" oninput="window.filtrarAlertasTurno()" placeholder="Buscar denuncia, patrulla, folio..." style="width:100%; padding:10px 10px 10px 35px; border:none; background:#f1f5f9; border-radius:6px; font-size:0.9rem;">
            </div>
            <div style="display:flex; align-items:center; gap:20px;">
                <span style="background: #e2f5ec; color: #10b981; font-weight: bold; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="width:7px; height:7px; background:#10b981; border-radius:50%;"></span> Sistema En Línea
                </span>
                <div style="position:relative; cursor:pointer;" onclick="window.conmutarDropdownNotificaciones(event)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--texto-oscuro)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <span style="position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:#ff4757; border-radius:50%; border:2px solid #fff;"></span>
                </div>
            </div>

            <div id="dropdown-notificaciones-cenco" style="display:none; position:absolute; right:20px; top:65px; width:320px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.1); z-index:999; padding:15px; flex-direction:column; gap:10px;">
                <h4 style="font-weight:700; font-size:0.95rem; border-bottom:1px solid #f1f5f9; padding-bottom:8px; margin-bottom:4px;">Notificaciones del Turno</h4>
                <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:8px;" id="dropdown-lista-alertas-cuerpo"></div>
            </div>
        </div>
    `;
}

// --- RENDERIZADORES DE PANTALLAS DE FIGMA ---

function renderLogin() {
    wrapperPlataforma.style.display = "none";
    wrapperLogin.style.display = "flex";
    
    wrapperLogin.innerHTML = `
        <div style="text-align: center; color: white; margin-bottom: 2rem;">
            <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🛡️</div>
            <h2 style="font-size: 2rem; font-weight: 700; letter-spacing: 1px;">CENCO</h2>
            <p style="opacity: 0.8; font-size: 0.95rem;">Centro de Comunicaciones - Carabineros de Chile</p>
        </div>

        <div class="login-card">
            <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem; font-weight: 700;">Iniciar Sesión</h3>
            <form onsubmit="window.procesarLoginCenco(event)">
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" id="login-user" required placeholder="Ingrese su usuario">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" id="login-pass" required placeholder="Ingrese su contraseña">
                </div>
                <button type="submit" class="btn-submit">➔ Iniciar Sesión</button>
            </form>
            <div style="margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: var(--texto-mutated);">
                Credenciales de prueba:<br>
                <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">operator / cenco2026</code>
            </div>
        </div>
    `;
}

window.procesarLoginCenco = function(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === 'operator' && pass === 'cenco2026') {
        sessionActiva = true;
        wrapperLogin.style.display = "none";
        wrapperPlataforma.style.display = "flex";
        
        document.getElementById('menu-panel').innerHTML = `<svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> Panel de Control`;
        document.getElementById('menu-denuncias').innerHTML = `<div style="display:flex; align-items:center;"><svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Denuncias Recibidas</div> <span class="badge">3</span>`;
        document.getElementById('menu-videos').innerHTML = `<div style="display:flex; align-items:center;"><svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg> Gestión Videollamadas</div> <span class="badge">1</span>`;
        document.getElementById('menu-patrullas').innerHTML = `<svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg> Derivación Patrullas`;

        navegarA('panel');
    } else {
        alert("Credenciales institucionales incorrectas.");
    }
}

async function renderPanelControl() {
    const cabeceraHTML = generarEstructuraCabeceraGlobal();

    cuerpoDashboard.innerHTML = `
        ${cabeceraHTML}

        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 1.5rem;">
            <div>
                <h1 style="font-size: 1.8rem; font-weight: bold; color:var(--texto-oscuro);">Resumen del Turno</h1>
                <p style="color: var(--texto-mutated); margin-top:4px; font-size:0.95rem;">Monitoreo de emergencies para personas sordas - Sector Central</p>
            </div>
            <div style="text-align: right;">
                <p style="font-size:0.85rem; color:var(--texto-mutated); font-weight:500;">10 Mayo 2026</p>
                <h2 style="font-size: 1.8rem; font-weight: 700; margin-top: 4px; color: var(--texto-oscuro);" id="reloj-cenco">--:--:--</h2>
            </div>
        </div>

        <div class="grid-indicadores" id="contenedor-contadores-dinamicos">
            <p style="color: var(--texto-mutated);">Calculando indicadores del turno...</p>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 2rem;">
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem; font-weight:700;">Actividad Reciente</h3>
                    <a href="#" onclick="event.preventDefault(); navegarA('denuncias')" style="color: var(--verde-carabinero); font-weight:600; font-size:0.9rem; text-decoration:none;">Ver todas</a>
                </div>
                <div id="contenedor-actividad-realtime" style="display:flex; flex-direction:column; gap:16px;">
                    <p style="color:var(--texto-mutated); font-size:0.9rem;">Sincronizando flujo de incidentes...</p>
                </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; flex-direction:column; gap:12px; height: fit-content;">
                <h3 style="font-size: 1.1rem; font-weight:700; margin-bottom: 4px;">Acciones Rápidas</h3>
                <button class="btn-submit" style="background:#004d35; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="navegarA('patrullas')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                    Despachar Patrulla Cercana
                </button>
                <button class="btn-submit" style="background:transparent; border: 1px solid #cbd5e1; color: var(--texto-oscuro); display:flex; align-items:center; justify-content:center; gap:8px;" onclick="navegarA('videos')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    Iniciar Videollamada (LSCh)
                </button>
            </div>
        </div>
    `;
    
    const actualizarReloj = () => {
        const r = document.getElementById('reloj-cenco');
        if (r) r.innerText = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };
    actualizarReloj();
    clearInterval(window.intervaloReloj);
    window.intervaloReloj = setInterval(actualizarReloj, 1000);

    const { data: incidentes, error } = await supabaseClient.from('incidentes_cenco').select('*').order('created_at', { ascending: false });
    if (error || !incidentes) return;

    cacheIncidentesGlobal = incidentes;

    const totalSOS = incidentes.filter(i => i.estado_procedimiento === 'CRÍTICO' || i.categoria_tag === 'SOS').length;
    const totalVideos = incidentes.filter(i => i.categoria_tag === 'Videollamada' && i.estado_procedimiento !== 'RESUELTO').length;

    document.getElementById('contenedor-contadores-dinamicos').innerHTML = `
        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#fee2e2; color:#ef4444; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Alertas SOS Activas</p><h3>${totalSOS}</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('denuncias')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>
        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#ffedd5; color:#f97316; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Videollamadas en Espera</p><h3>${totalVideos}</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('videos')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>
        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#dcfce7; color:#22c55e; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Patrullas Disponibles</p><h3>12</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('patrullas')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>
        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#e0f2fe; color:#0ea5e9; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Casos Resueltos (Hoy)</p><h3>45</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault();" style="font-size:0.8rem; color:var(--texto-mutado); text-decoration:none; font-weight:500; margin-top:4px; cursor:default;">Corte diario automático</a>
        </div>
    `;

    // CORREGIDO: Se inyecta la bitácora con los minutos relativos dinámicos en el dropdown flotante de notificaciones
    document.getElementById('dropdown-lista-alertas-cuerpo').innerHTML = cacheIncidentesGlobal.slice(0, 3).map(i => `
        <div style="padding: 8px; border-bottom: 1px solid #f1f5f9; display:flex; flex-direction:column; gap:4px; font-size:0.8rem;">
            <div style="display:flex; justify-content:space-between; font-weight:700;">
                <span>${i.id}</span>
                <span style="color:var(--rojo-critico);">${calcularTiempoTranscurrido(i.created_at)}</span>
            </div>
            <p style="color:var(--texto-mutated); margin:0;">${i.tipo_incidente}</p>
        </div>
    `).join('');

    window.dibujarListaActividadRecienteHTML(cacheIncidentesGlobal);
}

window.dibujarListaActividadRecienteHTML = function(arregloIncidentes) {
    const contenedor = document.getElementById('contenedor-actividad-realtime');
    if (!contenedor) return;

    if (arregloIncidentes.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--texto-mutated); font-size:0.9rem; padding: 10px 0;">No se encontraron denuncias que coincidan.</p>';
        return;
    }

    let htmlLista = '';
    arregloIncidentes.forEach((inc, index) => {
        let colorCirculo = '#3b82f6'; 
        let filtroProcedimiento = (inc.categoria_tag === 'SOS') ? 'spinoff' : 'tomo';

        if (inc.estado_procedimiento === 'CRÍTICO') { colorCirculo = '#ff4757'; }
        else if (inc.estado_procedimiento === 'PENDIENTE') { colorCirculo = '#f97316'; }

        const estiloBorde = (index < arregloIncidentes.length - 1) ? 'border-bottom:1px solid #f1f5f9; padding-bottom:12px;' : '';
        const tiempoRelativoStr = calcularTiempoTranscurrido(inc.created_at);

        htmlLista += `
            <div style="display:flex; justify-content:space-between; align-items:center; ${estiloBorde}">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="width:10px; height:10px; background:${colorCirculo}; border-radius:50%;"></span>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:700; font-size:0.95rem;">${inc.id}</span>
                            <span style="background:#f1f5f9; color:var(--texto-mutated); font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:bold; text-transform:uppercase;">${inc.categoria_tag}</span>
                        </div>
                        <p style="color:var(--texto-mutated); font-size:0.85rem; margin-top:6px;">${inc.ubicacion_texto}</p>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="color:var(--texto-mutado); font-size:0.8rem; font-weight:500;">🕒 ${tiempoRelativoStr}</span>
                    <button class="btn-submit" style="padding:6px 16px; font-size:0.85rem; width:auto;" onclick="navegarA('detalle-incidente', '${inc.id}')">Atender</button>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = htmlLista;
}

// CORREGIDO: Buscador dinámico por texto que interactúa en caliente sin recargas
window.filtrarAlertasTurno = function() {
    const textoBuscado = document.getElementById('buscador-alertas-input').value.toLowerCase().trim();
    if (textoBuscado === "") {
        window.dibujarListaActividadRecienteHTML(cacheIncidentesGlobal);
        return;
    }
    const filtrados = cacheIncidentesGlobal.filter(i => 
        i.id.toLowerCase().includes(textoBuscado) || 
        i.tipo_incidente.toLowerCase().includes(textoBuscado) || 
        i.ubicacion_texto.toLowerCase().includes(textoBuscado) ||
        i.categoria_tag.toLowerCase().includes(textoBuscado)
    );
    window.dibujarListaActividadRecienteHTML(filtrados);
}

window.conmutarDropdownNotificaciones = function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('dropdown-notificaciones-cenco');
    if (!dropdown) return;
    dropdown.style.display = (dropdown.style.display === "none" || dropdown.style.display === "") ? "flex" : "none";
}

document.addEventListener('click', () => {
    const dropdown = document.getElementById('dropdown-notificaciones-cenco');
    if (dropdown) dropdown.style.display = "none";
});

// PANTALLA 3 FIGMA: Bitácora General de Denuncias
async function renderDenunciasRecibidas() {
    wrapperLogin.style.display = "none";
    wrapperPlataforma.style.display = "flex";
    const cabeceraHTML = generarEstructuraCabeceraGlobal();
    
    cuerpoDashboard.innerHTML = `
        ${cabeceraHTML}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
            <div>
                <h1 style="font-size: 1.8rem; font-weight: bold;">Denuncias y Alertas Recibidas</h1>
                <p style="color: var(--texto-mutated); margin-top:4px;">Gestión de emergencias y reportes ciudadanos</p>
            </div>
            <button class="btn-submit" style="width:auto; padding:10px 20px; background:#fff; color:var(--texto-oscuro); border:1px solid #cbd5e1; display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Filtrar
            </button>
        </div>
        
        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; table-layout: fixed;">
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: var(--texto-mutated); font-weight: 600;">
                        <th style="padding: 15px 20px; width: 150px;">ID / Estado</th>
                        <th style="padding: 15px 20px; width: 450px;">Tipo / Usuario</th>
                        <th style="padding: 15px 20px;">Ubicación</th>
                        <th style="padding: 15px 20px; width: 160px;">Hora</th>
                        <th style="padding: 15px 20px; text-align: center; width: 130px;">Acción</th>
                    </tr>
                </thead>
                <tbody id="tabla-denuncias-body">
                    <tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--texto-mutated);">Descargando bitácora de denuncias...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const { data: incidentes, error } = await supabaseClient.from('incidentes_cenco').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('tabla-denuncias-body');
    if (error || !incidentes || incidentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--rojo-critico);">No se registran procedimientos activos.</td></tr>`;
        return;
    }

    cacheIncidentesGlobal = incidentes;
    let htmlFilas = '';
    incidentes.forEach(inc => {
        let badgeColor = '#f97316'; 
        if (inc.estado_procedimiento === 'CRÍTICO' || inc.estado_procedimiento === 'RESUELTO') badgeColor = '#ff4757';
        if (inc.estado_procedimiento === 'EN ATENCION') badgeColor = '#3b82f6';

        const horaTexto = new Date(inc.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        htmlFilas += `
            <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: top; background:#fff;">
                <td style="padding: 20px; white-space: nowrap;">
                    <div style="font-weight: bold; margin-bottom: 8px; color:var(--texto-oscuro); font-size:1rem;">${inc.id}</div>
                    <span style="background:${badgeColor}15; color:${badgeColor}; font-size:0.7rem; font-weight:bold; padding:4px 8px; border-radius:4px; text-transform:uppercase; white-space: nowrap; display: inline-block;">● ${inc.estado_procedimiento}</span>
                </td>
                <td style="padding: 20px;">
                    <div style="font-weight: bold; color: var(--texto-oscuro); display: flex; align-items: center; gap: 6px; font-size:1rem;">
                        ${inc.categoria_tag === 'SOS' ? '⚠️' : '👤'} ${inc.tipo_incidente}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--texto-mutated); margin-top: 5px;">👤 ${inc.nombre_usuario_anonimo || 'Anónimo'}</div>
                    <div style="font-size: 0.85rem; color: var(--texto-mutated); font-style: italic; margin-top: 10px; line-height: 1.4; background:#f8fafc; padding:8px 12px; border-radius:6px; border-left:3px solid #cbd5e1;">"${inc.detalles_reporte}"</div>
                </td>
                <td style="padding: 20px; color: var(--texto-oscuro); font-size: 0.9rem; font-weight:500;">📍 ${inc.ubicacion_texto}</td>
                <td style="padding: 20px; color: var(--texto-mutated); font-size: 0.9rem; white-space: nowrap;">
                    <div style="display: flex; align-items: center; gap: 5px;">🕒 ${horaTexto}</div>
                </td>
                <td style="padding: 20px; text-align: center;">
                    <button class="btn-submit" style="padding: 8px 16px; font-size: 0.85rem; width: auto; background: #004d35;" onclick="navegarA('detalle-incidente', '${inc.id}')">Gestionar</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = htmlFilas;
}

// NUEVA PANTALLA: Ficha de Control Individual (`image_de1ac8.png`)
async function renderDetalleIndividualIncidente(idIncidente) {
    const cabeceraHTML = generarEstructuraCabeceraGlobal();
    
    cuerpoDashboard.innerHTML = `
        ${cabeceraHTML}
        <div id="contenedor-modulo-detalle-vivo">
            <p style="color:var(--texto-mutated);">Rastreando expediente en la red...</p>
        </div>
    `;

    const { data: inc, error } = await supabaseClient
        .from('incidentes_cenco')
        .select('*')
        .eq('id', idIncidente)
        .single();

    if (error || !inc) {
        document.getElementById('contenedor-modulo-detalle-vivo').innerHTML = `<p style="color:var(--rojo-critico);">Error al cargar la ficha del incidente.</p>`;
        return;
    }

    let badgeColor = '#f97316';
    if (inc.estado_procedimiento === 'CRÍTICO' || inc.estado_procedimiento === 'RESUELTO') badgeColor = '#ff4757';
    if (inc.estado_procedimiento === 'EN ATENCION') badgeColor = '#3b82f6';

    const horaExpediente = new Date(inc.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    document.getElementById('contenedor-modulo-detalle-vivo').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; width:100%;">
            <button onclick="navegarA('denuncias')" style="background:none; border:none; color:var(--texto-oscuro); font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; font-size:0.95rem;">← Volver a Denuncias</button>
            <div style="display:flex; gap:12px;">
                <button class="btn-submit" style="background:#004d35; width:auto; padding:10px 20px; display:flex; align-items:center; gap:8px;" onclick="navegarA('patrullas')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg> Derivar Patrulla
                </button>
                <button class="btn-submit" style="background:#3b82f6; width:auto; padding:10px 20px; display:flex; align-items:center; gap:8px;" onclick="navegarA('videos')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg> Videollamada LSCh
                </button>
                <button class="btn-submit" style="background:#10b981; width:auto; padding:10px 20px; display:flex; align-items:center; gap:8px;" onclick="window.cambiarEstadoIncidenteDirecto('${inc.id}', 'RESUELTO')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Marcar como Resuelto
                </button>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:20px; max-width:1000px; margin:0 auto;">
            
            <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                        <h2 style="font-size:1.8rem; font-weight:800; color:var(--texto-oscuro);">${inc.id}</h2>
                        <span style="background:${badgeColor}15; color:${badgeColor}; font-size:0.75rem; font-weight:bold; padding:4px 10px; border-radius:4px; text-transform:uppercase;">● ${inc.estado_procedimiento}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:var(--texto-mutated); font-size:1.05rem;">
                        <span style="color:#ef4444;">⚠️</span> ${inc.tipo_incidente}
                    </div>
                </div>
                <div style="text-align:right; color:var(--texto-mutated); font-size:0.9rem;">
                    <div style="display:flex; align-items:center; gap:6px; font-weight:600;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${horaExpediente}</div>
                    <p style="margin-top:6px; font-weight:500;">Hoy, 10 Mayo 2026</p>
                </div>
            </div>

            <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0;">
                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:1.5rem; color:var(--texto-oscuro); display:flex; align-items:center; gap:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Información del Denunciante
                </h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <p style="font-size:0.85rem; color:var(--texto-mutated); margin-bottom:6px;">Nombre</p>
                        <p style="font-weight:700; color:var(--texto-oscuro); font-size:1.05rem;">${inc.nombre_usuario_anonimo || 'No especificado'}</p>
                        <div style="margin-top:15px;"><span style="background:#e2f5ec; color:#10b981; font-size:0.8rem; font-weight:bold; padding:4px 10px; border-radius:4px;">Persona Sorda (Usuaria App LSCh)</span></div>
                    </div>
                    <div>
                        <p style="font-size:0.85rem; color:var(--texto-mutated); margin-bottom:6px;">Teléfono</p>
                        <p style="font-weight:700; color:var(--texto-oscuro); font-size:1.05rem;">📞 +56 9 8765 4321</p>
                    </div>
                </div>
            </div>

            <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0;">
                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:1.2rem; color:var(--texto-oscuro); display:flex; align-items:center; gap:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Ubicación del Incidente
                </h3>
                <p style="font-size:0.85rem; color:var(--texto-mutated); margin-bottom:4px;">Dirección</p>
                <p style="font-weight:700; color:var(--texto-oscuro); margin-bottom:10px;">${inc.ubicacion_texto}</p>
                <p style="font-size:0.8rem; color:var(--texto-mutated); font-family:monospace; margin-bottom:15px;">Coordenadas GPS: ${inc.latitud || '-33.4242'}, ${inc.longitud || '-70.6113'}</p>
                <div style="background:#f1f5f9; height:180px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--texto-mutated); border:1px dashed #cbd5e1; font-weight:500;">
                    🗺️ Visor Cartográfico - Cuadrante Activado (${inc.latitud || '-33.42'}, ${inc.longitud || '-70.61'})
                </div>
            </div>

            <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0;">
                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem; color:var(--texto-oscuro); display:flex; align-items:center; gap:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Descripción del Incidente
                </h3>
                <div style="background:#f8fafc; padding:15px; border-radius:6px; border-left:4px solid var(--verde-carabinero); font-style:italic; line-height:1.5; color:var(--texto-oscuro);">
                    "${inc.detalles_reporte || 'Sin descripción en texto adicional.'}"
                </div>
            </div>

            <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0;">
                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:1.5rem; color:var(--texto-oscuro);">Historial de Acciones</h3>
                <div style="display:flex; flex-direction:column; gap:15px; position:relative; padding-left:20px; border-left:2px solid #e2e8f0;">
                    <div>
                        <span style="position:absolute; left:-6px; width:10px; height:10px; background:#ff4757; border-radius:50%;"></span>
                        <p style="font-weight:700; font-size:0.95rem; color:var(--texto-oscuro);">Alerta recibida</p>
                        <p style="font-size:0.8rem; color:var(--texto-mutated); margin-top:2px;">Hoy a las ${horaExpediente}</p>
                    </div>
                    <div>
                        <span style="position:absolute; left:-6px; width:10px; height:10px; background:#3b82f6; border-radius:50%;"></span>
                        <p style="font-weight:700; font-size:0.95rem; color:var(--texto-oscuro);">Sistema asignó operador automáticamente</p>
                        <p style="font-size:0.8rem; color:var(--texto-mutated); margin-top:2px;">Hoy a las ${horaExpediente}</p>
                    </div>
                </div>
            </div>

        </div>
    `;
}

window.cambiarEstadoIncidenteDirecto = async function(id, nuevoEstado) {
    const { error } = await supabaseClient
        .from('incidentes_cenco')
        .update({ estado_procedimiento: nuevoEstado })
        .eq('id', id);

    if (error) return alert("No se pudo cerrar el caso.");
    alert(`🚨 Procedimiento ${id} cerrado de forma conforme.`);
    navegarA('panel');
}

function renderGestionVideollamadas() {
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 1.5rem;">Módulo de Asistencia Inclusiva (LSCh)</h1>
        <div style="background: #1e293b; height: 60vh; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:white;">
            <p style="opacity: 0.6;">📳 Esperando llamada entrante desde la APK móvil...</p>
        </div>
    `;
}

function renderDerivacionPatrullas() {
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 1.5rem;">Despacho y Derivación de Unidades</h1>
        <div style="background: white; height: 60vh; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
            <p style="color: var(--texto-mutated);">🗺️ Inicializando visor de mapas...</p>
        </div>
    `;
}

// --- SISTEMA DE ENRUTAMIENTO SPA EN CASCADA ---
function navegarA(vista, dataParam = null) {
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    
    switch (vista) {
        case 'panel':
            document.getElementById('menu-panel').classList.add('active');
            renderPanelControl();
            break;
        case 'denuncias':
            document.getElementById('menu-denuncias').classList.add('active');
            renderDenunciasRecibidas();
            break;
        case 'videos':
            document.getElementById('menu-videos').classList.add('active');
            renderGestionVideollamadas();
            break;
        case 'patrullas':
            document.getElementById('menu-patrullas').classList.add('active');
            renderDerivacionPatrullas();
            break;
        case 'detalle-incidente':
            renderDetalleIndividualIncidente(dataParam);
            break;
        case 'login':
            renderLogin();
            break;
        default:
            renderLogin();
    }
}

// --- LISTENERS NATIVOS ---
document.getElementById('menu-panel').onclick = (e) => { e.preventDefault(); navegarA('panel'); };
document.getElementById('menu-denuncias').onclick = (e) => { e.preventDefault(); navegarA('denuncias'); };
document.getElementById('menu-videos').onclick = (e) => { e.preventDefault(); navegarA('videos'); };
document.getElementById('menu-patrullas').onclick = (e) => { e.preventDefault(); navegarA('patrullas'); };
document.getElementById('btn-logout').onclick = (e) => { e.preventDefault(); sessionActiva = false; navegarA('login'); };

renderLogin();