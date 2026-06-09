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

    // Validación mock simplificada para desarrollo rápido
    if (user === 'operator' && pass === 'cenco2026') {
        sessionActiva = true;
        wrapperLogin.style.display = "none";
        wrapperPlataforma.style.display = "flex";
        navegarA('panel');
    } else {
        alert("Credenciales institucionales incorrectas.");
    }
}

// PANTALLA 2 FIGMA: Panel de Control principal (`image_0dd059.png`)
function renderPanelControl() {
    cuerpoDashboard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
            <div>
                <h1 style="font-size: 1.8rem; font-weight: bold;">Resumen del Turno</h1>
                <p style="color: var(--texto-mutado); margin-top:4px;">Monitoreo de emergencias para personas sordas - Sector Central</p>
            </div>
            <div style="text-align: right;">
                <span style="background: #e2f5ec; color: #10b981; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">● Sistema En Línea</span>
                <h2 style="font-size: 1.6rem; font-weight: 700; margin-top: 8px;" id="reloj-cenco">14:32:05</h2>
            </div>
        </div>

        <div class="grid-indicadores">
            <div class="card-indicador">
                <div class="icon-box" style="background:#fee2e2; color:#ef4444;">⚠ Generar</div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Alertas SOS Activas</p>
                    <h3>3</h3>
                </div>
            </div>
            <div class="card-indicador">
                <div class="icon-box" style="background:#ffedd5; color:#f97316;">📹</div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Videollamadas en Espera</p>
                    <h3>1</h3>
                </div>
            </div>
            <div class="card-indicador">
                <div class="icon-box" style="background:#dcfce7; color:#22c55e;">🚔</div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Patrullas Disponibles</p>
                    <h3>12</h3>
                </div>
            </div>
            <div class="card-indicador">
                <div class="icon-box" style="background:#e0f2fe; color:#0ea5e9;">✅</div>
                <div class="card-content">
                    <p style="color: var(--texto-mutado); font-size:0.85rem;">Casos Resueltos (Hoy)</p>
                    <h3>45</h3>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 2rem;">
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h3 style="font-size: 1.1rem; margin-bottom: 1rem; font-weight:700;">Actividad Reciente</h3>
                <p style="color:var(--texto-mutado); font-size:0.9rem;">Cargando despachos en tiempo real...</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; flex-direction:column; gap:12px;">
                <h3 style="font-size: 1.1rem; font-weight:700;">Acciones Rápidas</h3>
                <button class="btn-submit" style="background:#004d35;">⚡ Despachar Patrulla Cercana</button>
                <button class="btn-submit" style="background:transparent; border: 1px solid #cbd5e1; color: var(--texto-oscuro);">📹 Iniciar Videollamada (LSCh)</button>
            </div>
        </div>
    `;
    
    // Timer para simular el reloj en vivo del CENCO de tu Figma
    setInterval(() => {
        const r = document.getElementById('reloj-cenco');
        if(r) r.innerText = new Date().toLocaleTimeString('es-CL');
    }, 1000);
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
    // Sincronizamos las clases activas en la barra lateral
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