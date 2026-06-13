// --- CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://zxeslmngcrqtbolfkbvf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5tU3B4kVQOBGy0pkXYhgcQ_iXi21B4O";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const cuerpoDashboard = document.getElementById('cuerpo-dashboard');
const wrapperPlataforma = document.getElementById('wrapper-plataforma');
const wrapperLogin = document.getElementById('wrapper-login');

// --- VARIABLES DE ESTADO ---
let sessionActiva = false;

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
        navegarA('panel');
    } else {
        alert("Credenciales institucionales incorrectas.");
    }
}

// PANTALLA 2 FIGMA: Panel de Control principal (`image_0dd059.png` / Corregida con SVGs de Figma)
function renderPanelControl() {
    cuerpoDashboard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
            <div>
                <h1 style="font-size: 1.8rem; font-weight: bold;">Resumen del Turno</h1>
                <p style="color: var(--texto-mutado); margin-top:4px;">Monitoreo de emergencias para personas sordas - Sector Central</p>
            </div>
            <div style="text-align: right;">
                <span style="background: #e2f5ec; color: #10b981; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">● Sistema En Línea</span>
                <h2 style="font-size: 1.6rem; font-weight: 700; margin-top: 8px;" id="reloj-cenco">--:--:--</h2>
            </div>
        </div>

        <div class="grid-indicadores">
            <div class="card-indicador">
                <div class="icon-box" style="background:#fee2e2; color:#ef4444; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Alertas SOS Activas</p>
                    <h3>3</h3>
                </div>
            </div>
            <div class="card-indicador">
                <div class="icon-box" style="background:#ffedd5; color:#f97316; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Videollamadas en Espera</p>
                    <h3>1</h3>
                </div>
            </div>
            <div class="card-indicador">
                <div class="icon-box" style="background:#dcfce7; color:#22c55e; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Patrullas Disponibles</p>
                    <h3>12</h3>
                </div>
            </div>
            <div class="card-indicador">
                <div class="icon-box" style="background:#e0f2fe; color:#0ea5e9; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Casos Resueltos (Hoy)</p>
                    <h3>45</h3>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 2rem;">
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem; font-weight:700;">Actividad Reciente</h3>
                    <a href="#" onclick="event.preventDefault(); navegarA('denuncias')" style="color: var(--verde-carabinero); font-weight:600; font-size:0.9rem; text-decoration:none;">Ver todas</a>
                </div>
                
                <div id="contenedor-actividad-realtime" style="display:flex; flex-direction:column; gap:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="width:10px; height:10px; background:#ff4757; border-radius:50%;"></span>
                            <div>
                                <span style="font-weight:700; font-size:0.95rem;">SOS-892</span>
                                <span style="background:#f1f5f9; color:var(--texto-mutado); font-size:0.75rem; padding:2px 6px; border-radius:4px; font-weight:bold; margin-left:6px;">SOS</span>
                                <p style="color:var(--texto-mutado); font-size:0.85rem; margin-top:4px;">Av. Providencia 1034</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="color:var(--texto-mutado); font-size:0.8rem;">🕒 Hace 2 min</span>
                            <button class="btn-submit" style="padding:6px 16px; font-size:0.85rem; width:auto;" onclick="navegarA('denuncias')">Atender</button>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="width:10px; height:10px; background:#f97316; border-radius:50%;"></span>
                            <div>
                                <span style="font-weight:700; font-size:0.95rem;">DEN-445</span>
                                <span style="background:#f1f5f9; color:var(--texto-mutado); font-size:0.75rem; padding:2px 6px; border-radius:4px; font-weight:bold; margin-left:6px;">Denuncia - Robo</span>
                                <p style="color:var(--texto-mutado); font-size:0.85rem; margin-top:4px;">Plaza Italia</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="color:var(--texto-mutado); font-size:0.8rem;">🕒 Hace 15 min</span>
                            <button class="btn-submit" style="padding:6px 16px; font-size:0.85rem; width:auto;" onclick="navegarA('denuncias')">Atender</button>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="width:10px; height:10px; background:#3b82f6; border-radius:50%;"></span>
                            <div>
                                <span style="font-weight:700; font-size:0.95rem;">VID-102</span>
                                <span style="background:#f1f5f9; color:var(--texto-mutado); font-size:0.75rem; padding:2px 6px; border-radius:4px; font-weight:bold; margin-left:6px;">Videollamada</span>
                                <p style="color:var(--texto-mutado); font-size:0.85rem; margin-top:4px;">No especificada</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="color:var(--texto-mutado); font-size:0.8rem;">🕒 Hace 18 min</span>
                            <button class="btn-submit" style="padding:6px 16px; font-size:0.85rem; width:auto;" onclick="navegarA('videos')">Atender</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; flex-direction:column; gap:12px;">
                <h3 style="font-size: 1.1rem; font-weight:700;">Acciones Rápidas</h3>
                <button class="btn-submit" style="background:#004d35; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="navegarA('patrullas')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                    Despachar Patrulla Cercana
                </button>
                <button class="btn-submit" style="background:transparent; border: 1px solid #cbd5e1; color: var(--texto-oscuro); display:flex; align-items:center; justify-content:center; gap:8px;" onclick="navegarA('videos')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    Iniciar Videollamada (LSCh)
                </button>
            </div>
        </div>
    `;
    
    // Sincronización del visor horario del CENCO
    const actualizarReloj = () => {
        const r = document.getElementById('reloj-cenco');
        if (r) r.innerText = new Date().toLocaleTimeString('es-CL');
    };
    actualizarReloj();
    clearInterval(window.intervaloReloj);
    window.intervaloReloj = setInterval(actualizarReloj, 1000);
}

// PANTALLA 3 FIGMA: Denuncias Recibidas (`image_0d7eb8.png`)
function renderDenunciasRecibidas() {
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 0.5rem;">Denuncias y Alertas Recibidas</h1>
        <p style="color: var(--texto-mutado); margin-bottom: 1.5rem;">Gestión de emergencias y reportes ciudadanos en tiempo real.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="color: var(--texto-mutado);">Conectando con Supabase Realtime Stream...</p>
        </div>
    `;
}

// PANTALLA 4 FIGMA: Gestión Videollamadas en LSCh (`image_0d7e82.png`)
function renderGestionVideollamadas() {
    cuerpoDashboard.innerHTML = `
        <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 1.5rem;">Módulo de Asistencia Inclusiva (LSCh)</h1>
        <div style="background: #1e293b; height: 60vh; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:white;">
            <p style="opacity: 0.6;">📳 Esperando llamada entrante desde la APK móvil...</p>
        </div>
    `;
}

// PANTALLA 5 FIGMA: Derivación Patrullas en mapa (`image_0d7e5b.png`)
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