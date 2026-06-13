// --- CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://zxeslmngcrqtbolfkbvf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5tU3B4kVQOBGy0pkXYhgcQ_iXi21B4O";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const cuerpoDashboard = document.getElementById('cuerpo-dashboard');
const wrapperPlataforma = document.getElementById('wrapper-plataforma');
const wrapperLogin = document.getElementById('wrapper-login');

// --- VARIABLES DE ESTADO ---
let sessionActiva = false;

// --- REGLAS AUXILIARES DE CÁLCULO ---
// Función para calcular dinámicamente el tiempo transcurrido exacto de tu Figma
function calcularTiempoTranscurrido(fechaBaseDatos) {
    const ahora = new Date();
    const fechaIncidente = new Date(fechaBaseDatos);
    const diferenciaMilisegundos = ahora - fechaIncidente;
    const minutos = Math.floor(diferenciaMilisegundos / 1000 / 60);

    if (minutos < 1) return "Hace un instante";
    if (minutos < 60) return `Hace ${minutos} min`;
    
    const horas = Math.floor(minutos / 60);
    return `Hace ${horas} h`;
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
            <div style="margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: var(--texto-mutado);">
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
        
        // CORREGIDO: Inyectamos los iconos de Figma en la barra lateral una sola vez al entrar
        document.getElementById('menu-panel').innerHTML = `<svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> Panel de Control`;
        document.getElementById('menu-denuncias').innerHTML = `<div style="display:flex; align-items:center;"><svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Denuncias Recibidas</div> <span class="badge">3</span>`;
        document.getElementById('menu-videos').innerHTML = `<div style="display:flex; align-items:center;"><svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg> Gestión Videollamadas</div> <span class="badge">1</span>`;
        document.getElementById('menu-patrullas').innerHTML = `<svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg> Derivación Patrullas`;

        navegarA('panel');
    } else {
        alert("Credenciales institucionales incorrectas.");
    }
}

// CONECTADO A SUPABASE: Carga contadores dinámicos y la lista de incidentes real
async function renderPanelControl() {
    cuerpoDashboard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; background:#fff; padding:12px 20px; border-radius:8px; border:1px solid #e2e8f0;">
            <div style="position:relative; width:400px;">
                <span style="position:absolute; left:12px; top:11px; color:var(--texto-mutated);">🔍</span>
                <input type="text" placeholder="Buscar denuncia, patrulla, folio..." style="width:100%; padding:10px 10px 10px 35px; border:none; background:#f1f5f9; border-radius:6px; font-size:0.9rem;">
            </div>
            <div style="display:flex; align-items:center; gap:20px;">
                <span style="background: #e2f5ec; color: #10b981; font-weight: bold; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; display:flex; align-items:center; gap:6px;">
                    <span style="width:7px; height:7px; background:#10b981; border-radius:50%;"></span> Sistema En Línea
                </span>
                <div style="position:relative; cursor:pointer;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--texto-oscuro)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <span style="position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:#ff4757; border-radius:50%; border:2px solid #fff;"></span>
                </div>
            </div>
        </div>

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
    
    // Visor horario
    const actualizarReloj = () => {
        const r = document.getElementById('reloj-cenco');
        if (r) {
            r.innerText = new Date().toLocaleTimeString('es-CL', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
        }
    };
    actualizarReloj();
    clearInterval(window.intervaloReloj);
    window.intervaloReloj = setInterval(actualizarReloj, 1000);

    // CONSULTA ASÍNCRONA A SUPABASE
    const { data: incidentes, error } = await supabaseClient
        .from('incidentes_cenco')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !incidentes) {
        document.getElementById('contenedor-actividad-realtime').innerHTML = `<p style="color:red;">Error de conexión con la red policial.</p>`;
        return;
    }

    const totalSOS = incidentes.filter(i => i.estado_procedimiento === 'CRÍTICO' || i.categoria_tag === 'SOS').length;
    const totalVideos = incidentes.filter(i => i.categoria_tag === 'Videollamada' && i.estado_procedimiento !== 'RESUELTO').length;

    document.getElementById('contenedor-contadores-dinamicos').innerHTML = `
        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#fee2e2; color:#ef4444; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Alertas SOS Activas</p>
                    <h3>${totalSOS}</h3>
                </div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('denuncias')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>

        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#ffedd5; color:#f97316; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Videollamadas en Espera</p>
                    <h3>${totalVideos}</h3>
                </div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('videos')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>

        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#dcfce7; color:#22c55e; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Patrullas Disponibles</p>
                    <h3>12</h3>
                </div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('patrullas')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>

        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#e0f2fe; color:#0ea5e9; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Casos Resueltos (Hoy)</p>
                    <h3>45</h3>
                </div>
            </div>
            <a href="#" onclick="event.preventDefault();" style="font-size:0.8rem; color:var(--texto-mutado); text-decoration:none; font-weight:500; margin-top:4px; cursor:default;">Corte diario automático</a>
        </div>
    `;

    // 2. RENDERIZADO DINÁMICO DE FILAS DE ACTIVIDAD RECIENTE
    let htmlLista = '';
    incidentes.forEach((inc, index) => {
        let colorCirculo = '#3b82f6'; 
        let vistaDestino = 'denuncias';

        if (inc.estado_procedimiento === 'CRÍTICO') { colorCirculo = '#ff4757'; }
        else if (inc.estado_procedimiento === 'PENDIENTE') { colorCirculo = '#f97316'; }
        
        if (inc.categoria_tag === 'Videollamada') { vistaDestino = 'videos'; }

        const estiloBorde = (index < incidentes.length - 1) ? 'border-bottom:1px solid #f1f5f9; padding-bottom:12px;' : '';
        
        // CORREGIDO: Lógica de tiempo relativo dinámico basado en la columna created_at de Supabase
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
                    <button class="btn-submit" style="padding:6px 16px; font-size:0.85rem; width:auto;" onclick="navegarA('${vistaDestino}')">Atender</button>
                </div>
            </div>
        `;
    });

    document.getElementById('contenedor-actividad-realtime').innerHTML = htmlLista || '<p style="color: var(--texto-mutado);">No se registran eventos recientes.</p>';
}

// PANTALLA 3 FIGMA: Lista completa de Denuncias Recibidas (`image_df0bde.png`)
async function renderDenunciasRecibidas() {
    wrapperLogin.style.display = "none";
    wrapperPlataforma.style.display = "flex";
    
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 0.5rem;">Denuncias y Alertas Recibidas</h1>
        <p style="color: var(--texto-mutado); margin-bottom: 1.5rem;">Gestión de emergencias y reportes ciudadanos en tiempo real.</p>
        
        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: var(--texto-mutated); font-weight: 600;">
                        <th style="padding: 15px 20px;">ID / Estado</th>
                        <th style="padding: 15px 20px;">Tipo / Usuario</th>
                        <th style="padding: 15px 20px;">Ubicación</th>
                        <th style="padding: 15px 20px;">Hora</th>
                        <th style="padding: 15px 20px; text-align: center;">Acción</th>
                    </tr>
                </thead>
                <tbody id="tabla-denuncias-body">
                    <tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--texto-mutado);">Descargando bitácora de denuncias...</td></tr>
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

    let htmlFilas = '';
    incidentes.forEach(inc => {
        let badgeColor = '#f97316'; 
        if (inc.estado_procedimiento === 'CRÍTICO') badgeColor = '#ff4757';
        if (inc.estado_procedimiento === 'EN ATENCION') badgeColor = '#3b82f6';

        const horaTexto = new Date(inc.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        htmlFilas += `
            <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <td style="padding: 20px;">
                    <div style="font-weight: bold; margin-bottom: 6px;">${inc.id}</div>
                    <span style="background:${badgeColor}22; color:${badgeColor}; font-size:0.75rem; font-weight:bold; padding:3px 8px; border-radius:4px;">${inc.estado_procedimiento}</span>
                </td>
                <td style="padding: 20px;">
                    <div style="font-weight: bold; color: var(--texto-oscuro); display: flex; align-items: center; gap: 6px;">
                        ${inc.categoria_tag === 'SOS' ? '⚠️' : '👤'} ${inc.tipo_incidente}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--texto-mutado); margin-top: 4px;">👤 ${inc.nombre_usuario_anonimo || 'Anónimo'}</div>
                    <div style="font-size: 0.85rem; color: var(--texto-mutado); font-style: italic; margin-top: 8px; max-width: 400px; line-height: 1.4;">"${inc.detalles_reporte}"</div>
                </td>
                <td style="padding: 20px; color: var(--texto-mutado); font-size: 0.9rem;">📍 ${inc.ubicacion_texto}</td>
                <td style="padding: 20px; color: var(--texto-mutado); font-size: 0.9rem;">🕒 ${horaTexto}</td>
                <td style="padding: 20px; text-align: center;">
                    <button class="btn-submit" style="padding: 8px 16px; font-size: 0.85rem; width: auto; background: #004d35;" onclick="navegarA('patrullas')">Gestionar</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = htmlFilas;
}

// PANTALLA 4 FIGMA: Gestión Videollamadas en LSCh (`image_df0b80.png`)
function renderGestionVideollamadas() {
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 1.5rem;">Módulo de Asistencia Inclusiva (LSCh)</h1>
        <div style="background: #1e293b; height: 60vh; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:white;">
            <p style="opacity: 0.6;">📳 Esperando llamada entrante desde la APK móvil...</p>
        </div>
    `;
}

// PANTALLA 5 FIGMA: Derivación Patrullas en mapa (`image_df0b4b.png`)
function renderDerivacionPatrullas() {
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 1.5rem;">Despacho y Derivación de Unidades</h1>
        <div style="background: white; height: 60vh; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
            <p style="color: var(--texto-mutado);">🗺️ Inicializando visor de mapas y cuadrantes...</p>
        </div>
    `;
}

// --- SISTEMA DE ENRUTAMIENTO SPA ---
function navegarA(vista) {
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

// Arranque inicial de la plataforma
renderLogin();