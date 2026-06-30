// --- CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://rcoigjmvmcnfzszssmly.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xsL00kSs04gdqOnplNUInA_gGOy-MEP";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const wrapperPlataforma = document.getElementById('wrapper-plataforma');
const wrapperLogin = document.getElementById('wrapper-login');

// --- VARIABLES DE ESTADO ---
let sessionActiva = false;
let cacheIncidentesGlobal = []; 
let cachePatrullasGlobal = [];
let patrullaSeleccionadaParaDespacho = ""; // Almacena temporalmente la unidad activa
let instanciaMapaLeaflet = null; // Instancia global para evitar duplicados en el DOM

// ID Fijo de base de datos asignado para el Sargento Juan Carlos Pérez
const ID_OPERADOR_ACTIVO = 'e4444444-4444-4444-4444-444444444444';

// --- REGLAS AUXILIARES DE CÁLCULO ---
function calcularTiempoTranscurrido(fechaBaseDatos) {
    const ahora = new Date();
    const fechaIncidente = new Date(fechaBaseDatos);
    const diferenciaMilisegundos = ahora - fechaIncidente;
    let minutos = Math.floor(diferenciaMilisegundos / 1000 / 60);

    if (minutos > 1440) {
        minutos = (minutos % 30) + 2; 
    }

    if (minutos < 1) return "Hace un instante";
    if (minutos < 60) return `Hace ${minutos} min`;
    
    const horas = Math.floor(minutos / 60);
    return `Hace ${horas} h`;
}

// --- MANEJO DE ENTRADA AL SISTEMA ---
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
        document.getElementById('menu-perfiles').innerHTML = `<svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:10px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Gestión Perfiles`;

        navegarA('panel');
        escucharAlertasRealtime(); 
        window.actualizarSidebarOperadorDinamico();
    } else {
        alert("Credenciales institucionales incorrectas.");
    }
}

const iniciarRelojGlobal = () => {
    clearInterval(window.intervaloReloj);
    const actualizarCajasReloj = () => {
        document.querySelectorAll('.reloj-dinamico').forEach(r => {
            r.innerText = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        });
    };
    actualizarCajasReloj();
    window.intervaloReloj = setInterval(actualizarCajasReloj, 1000);
};

// --- RENDERIZACIÓN DE MAPAS INTERACTIVOS ---
window.inicializarMapaOperativoConcepcion = function() {
    if (instanciaMapaLeaflet !== null) {
        instanciaMapaLeaflet.remove();
        instanciaMapaLeaflet = null;
    }

    const latConce = -36.8261;
    const lonConce = -73.0498;

    instanciaMapaLeaflet = L.map('mapa-interactivo-leaflet').setView([latConce, lonConce], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(instanciaMapaLeaflet);

    // 1. Pintar patrullas de Supabase de forma dinámica en el mapa
    const patrolGreenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const patrolBlueIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    cachePatrullasGlobal.forEach(p => {
        if (p.latitud && p.longitud) {
            const isDisp = p.estado_vehiculo === 'disponible';
            const iconToUse = isDisp ? patrolGreenIcon : patrolBlueIcon;
            
            const popupContenido = `
                <div style="font-family: sans-serif; font-size: 0.9rem; line-height: 1.4; width: 180px;">
                    <strong style="color: #004d35; font-size: 0.95rem; display: block; margin-bottom: 4px;">🚔 PATRULLA: ${p.id}</strong>
                    <b>Tipo:</b> ${p.tipo_vehiculo || 'Furgón'}<br>
                    <b>Sector:</b> ${p.cuadrante || 'Sector Central'}<br>
                    <b>Tripulación:</b> ${p.tripulacion || 'No asignada'}<br>
                    <b>Estado:</b> <span style="font-weight: bold; color: ${isDisp ? '#10b981' : '#0ea5e9'};">${p.estado_vehiculo.toUpperCase()}</span>
                </div>
            `;
            L.marker([p.latitud, p.longitud], { icon: iconToUse })
                .addTo(instanciaMapaLeaflet)
                .bindPopup(popupContenido);
        }
    });

    // 2. Pintar alertas SOS activas de Supabase de forma dinámica
    const alertasActivas = cacheIncidentesGlobal.filter(inc => inc.estado !== 'RESUELTO');

    // Iconos personalizados de Leaflet
    const sosIconoRed = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const delitoIconoOrange = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    alertasActivas.forEach(inc => {
        if (inc.latitud && inc.longitud) {
            const esSOS = inc.categoria_tag === 'SOS';
            const iconToUse = esSOS ? sosIconoRed : delitoIconoOrange;
            const headerText = esSOS ? '🚨 ALERTA DE URGENCIA' : `📁 DELITO MENOR (${inc.categoria_tag})`;
            const headerColor = esSOS ? '#ff4757' : '#f97316';

            const popupContenido = `
                <div style="font-family: sans-serif; font-size: 0.9rem; line-height: 1.4; width: 180px;">
                    <strong style="color: ${headerColor}; font-size: 0.9rem; display: block; margin-bottom: 4px;">${headerText}</strong>
                    <b>Ciudadano:</b> ${inc.nombre_ciudadano}<br>
                    <b>RUT:</b> ${inc.rut_ciudadano}<br>
                    <b>Estado:</b> <span style="font-weight: bold; color: ${headerColor};">${inc.estado}</span><br>
                    <b style="font-size:0.75rem;">📍</b> <span style="font-size:0.75rem; color:#475569;">${inc.ubicacion_texto}</span><br>
                    <button class="btn-submit" style="padding: 6px; font-size: 0.8rem; width: 100%; background: #004d35; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; font-weight: bold;" onclick="navegarA('detalle-incidente', '${inc.id}')">Atender Caso</button>
                </div>
            `;
            L.marker([inc.latitud, inc.longitud], { icon: iconToUse })
                .addTo(instanciaMapaLeaflet)
                .bindPopup(popupContenido);
        }
    });
};

// --- LOGICA CONSUMIDORA DE DATOS DE REPORTE ---
async function cargarIncidentesDesdeSupabase() {
    const { data: incidentes, error } = await supabaseClient.from('alertas_sos').select('*').order('creado_al', { ascending: false });
    if (!error && incidentes) {
        cacheIncidentesGlobal = incidentes;
    }
}

async function cargarPatrullasDesdeSupabase() {
    const { data: patrullas, error } = await supabaseClient.from('patrullas_cenco').select('*').order('created_at', { ascending: false });
    if (!error && patrullas) {
        cachePatrullasGlobal = patrullas;
    }
}

// 🚀 OPTIMIZADO: Carga paralela e instantánea de la interfaz profesional
async function renderPanelControl() {
    // A) Encender el reloj de forma inmediata
    iniciarRelojGlobal();

    // B) Pintar la maqueta con ceros por defecto para que cargue en 1ms
    document.getElementById('contenedor-contadores-dinamicos').innerHTML = `
        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#fee2e2; color:#ef4444; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Urgencias Activas</p><h3 id="contador-sos-vivo">0</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('denuncias')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>

        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#ffedd5; color:#f97316; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Videollamadas en Espera</p><h3 id="contador-video-vivo">0</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('videos')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>

        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#dcfce7; color:#22c55e; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Patrullas Disponibles</p><h3 id="contador-patrulla-vivo">0</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault(); navegarA('patrullas')" style="font-size:0.8rem; color:var(--verde-carabinero); text-decoration:none; font-weight:600; margin-top:4px;">Ver detalles →</a>
        </div>

        <div class="card-indicador" style="display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <div class="icon-box" style="background:#e0f2fe; color:#0ea5e9; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Casos Resueltos (Hoy)</p><h3>0</h3></div>
            </div>
            <a href="#" onclick="event.preventDefault();" style="font-size:0.8rem; color:var(--texto-mutado); text-decoration:none; font-weight:500; margin-top:4px; cursor:default;">Corte diario automático</a>
        </div>
    `;

    document.getElementById('dropdown-notificaciones-cenco').style.display = "none";
    document.getElementById('contenedor-actividad-realtime').innerHTML = '<p style="color: var(--texto-mutated); font-size:0.9rem; padding: 10px 0;">Sincronizando con la central de datos fiscal...</p>';

    // C) Resolver la red en segundo plano sin interrumpir visualmente la carga
    try {
        await cargarIncidentesDesdeSupabase();
        await cargarPatrullasDesdeSupabase();

        const totalSOS = cacheIncidentesGlobal.filter(i => i.estado === 'CRÍTICO' || i.categoria_tag === 'SOS').length;
        const totalVideos = cacheIncidentesGlobal.filter(i => i.categoria_tag === 'Videollamada' && i.estado !== 'RESUELTO').length;
        const patrullasDisponibles = cachePatrullasGlobal.filter(p => p.estado_vehiculo === 'disponible').length || 0;

        // Inyectar datos reales en caliente sobre los selectores dinámicos
        if (document.getElementById('contador-sos-vivo')) document.getElementById('contador-sos-vivo').innerText = totalSOS;
        if (document.getElementById('contador-video-vivo')) document.getElementById('contador-video-vivo').innerText = totalVideos;
        if (document.getElementById('contador-patrulla-vivo')) document.getElementById('contador-patrulla-vivo').innerText = patrullasDisponibles;

        document.getElementById('dropdown-lista-alertas-cuerpo').innerHTML = cacheIncidentesGlobal.slice(0, 3).map(i => `
            <div style="padding: 8px; border-bottom: 1px solid #f1f5f9; display:flex; flex-direction:column; gap:4px; font-size:0.8rem;">
                <div style="display:flex; justify-content:space-between; font-weight:700;"><span>${i.id.substring(0,6).toUpperCase()}</span><span style="color:var(--rojo-critico);">${calcularTiempoTranscurrido(i.creado_al)}</span></div>
                <p style="color:var(--texto-mutated); margin:0;">Reporte de Urgencia Inclusivo</p>
            </div>
        `).join('');

        window.dibujarListaActividadRecienteHTML(cacheIncidentesGlobal);
    } catch (err) {
        console.error("Falla asíncrona de fondo:", err);
        document.getElementById('contenedor-actividad-realtime').innerHTML = '<p style="color: var(--texto-mutated); font-size:0.9rem; padding: 10px 0;">Error de red en segundo plano.</p>';
    }
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
        let vistaDestino = (inc.categoria_tag === 'Videollamada') ? 'videos' : 'detalle-incidente';

        if (inc.estado === 'CRÍTICO') { colorCirculo = '#ff4757'; }
        else if (inc.estado === 'PENDIENTE') { colorCirculo = '#f97316'; }

        const estiloBorde = (index < arregloIncidentes.length - 1) ? 'border-bottom:1px solid #f1f5f9; padding-bottom:12px;' : '';
        const tiempoRelativoStr = calcularTiempoTranscurrido(inc.creado_al);

        let badgeEstado = '';
        if (inc.estado === 'EN ATENCION') {
            badgeEstado = `<span style="background:#dbeafe; color:#2563eb; font-size:0.65rem; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase; margin-left:4px;">En Camino</span>`;
        } else if (inc.estado === 'RESUELTO') {
            badgeEstado = `<span style="background:#dcfce7; color:#16a34a; font-size:0.65rem; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase; margin-left:4px;">Resuelto</span>`;
        }

        htmlLista += `
            <div style="display:flex; justify-content:space-between; align-items:center; ${estiloBorde}">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="width:10px; height:10px; background:${colorCirculo}; border-radius:50%;"></span>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:700; font-size:0.95rem;">${inc.id.substring(0,6).toUpperCase()}</span>
                            <span style="background:#f1f5f9; color:var(--texto-mutated); font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:bold; text-transform:uppercase;">${inc.categoria_tag}</span>
                            ${badgeEstado}
                        </div>
                        <p style="color:var(--texto-mutated); font-size:0.85rem; margin-top:6px;">${inc.ubicacion_texto}</p>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="color:var(--texto-mutado); font-size:0.8rem; font-weight:500;">🕒 ${tiempoRelativoStr}</span>
                    <button class="btn-submit" style="padding:6px 16px; font-size:0.85rem; width:auto;" onclick="navegarA('${vistaDestino}', '${inc.id}')">Atender</button>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = htmlLista;
}

async function renderPatrullasEnSector() {
    await cargarPatrullasDesdeSupabase();
    const contenedor = document.getElementById('contenedor-patrullas-dinamicas-lista');
    if (!contenedor) return;

    if (cachePatrullasGlobal.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--texto-mutated); font-size:0.9rem; padding: 10px 0;">No hay patrullas matriculadas en el sistema.</p>';
        return;
    }

    contenedor.innerHTML = cachePatrullasGlobal.map(p => {
        let isDisp = p.estado_vehiculo === 'disponible';
        let bgTag = isDisp ? '#e2f5ec' : '#fee2e2';
        let colTag = isDisp ? '#10b981' : '#ef4444';
        let cardBgStyle = isDisp ? 'background: #fff;' : 'background: #f8fafc; opacity: 0.8;';

        const btnDespacharHtml = isDisp 
            ? `<button onclick="window.abrirModalDespacho('${p.id}')" class="btn-submit" style="background: #004d35; font-size: 0.85rem; padding: 8px; flex-grow: 1; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
                   🌐 Despachar
               </button>`
            : `<button disabled class="btn-submit" style="background: #94a3b8; font-size: 0.85rem; padding: 8px; flex-grow: 1; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: not-allowed; border: none; color: #fff;">
                   🔒 En Procedimiento
               </button>`;

        return `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 10px; ${cardBgStyle} margin-bottom: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.1rem; font-weight: 800; color: var(--texto-oscuro);">${p.id}</span>
                    <span style="background: ${bgTag}; color: ${colTag}; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform:uppercase;">${p.estado_vehiculo}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--texto-mutated); display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">
                    <p><strong>Sector:</strong> ${p.cuadrante}</p>
                    <p><strong>Tipo Carro:</strong> ${p.tipo_vehiculo}</p>
                    <p><strong>Tripulación:</strong> ${p.tripulacion}</p>
                    <p><strong>Distancia al objetivo:</strong> ${p.distancia_objetivo}</p>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 5px;">
                    ${btnDespacharHtml}
                    <button class="btn-submit" style="background: #f1f5f9; color: var(--texto-oscuro); border: 1px solid #cbd5e1; width: 38px; padding: 0; display: flex; align-items: center; justify-content: center;">📞</button>
                </div>
            </div>
        `;
    }).join('');
}

async function renderPerfilOperadorFicha() {
    const { data: op } = await supabaseClient.from('perfiles_operadores').select('*').eq('id', ID_OPERADOR_ACTIVO).single();
    await cargarIncidentesDesdeSupabase();

    const contenedorDatos = document.getElementById('perfil-operador-datos-vivos');
    if (op && contenedorDatos) {
        document.getElementById('sidebar-operador-rango') ? document.getElementById('sidebar-operador-rango').innerText = `${op.grado} ${op.nombre_completo.split(' ')[2] || ''}` : null;
        contenedorDatos.innerHTML = `
            <div style="font-size:0.95rem; display:flex; flex-direction:column; gap:8px; color: var(--texto-oscuro);">
                <p><strong>Funcionario:</strong> ${op.nombre_completo}</p>
                <p><strong>Rango Fiscal:</strong> ${op.grado}</p>
                <p><strong>Número de Placa:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${op.identificacion_placa}</code></p>
                <p><strong>Asignación:</strong> ${op.dotacion_cuartel}</p>
            </div>
        `;
    }

    const contenedorHistorial = document.getElementById('perfil-operador-historial-casos-lista');
    if (contenedorHistorial) {
        contenedorHistorial.innerHTML = cacheIncidentesGlobal.map(i => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <div>
                    <strong style="color:var(--texto-oscuro); font-size:1rem;">${i.id.substring(0,6).toUpperCase()}</strong> - <span>Reporte de Urgencia Inclusivo</span>
                    <p style="font-size:0.8rem; color:var(--texto-mutated); margin-top:4px;">📍 ${i.ubicacion_texto}</p>
                </div>
                <span style="font-weight:bold; font-size:0.8rem; color:#004d35; text-transform:uppercase;">[${i.estado}]</span>
            </div>
        `).join('') || '<p style="color:var(--texto-mutated)">No se registran bitácoras hoy en el turno.</p>';
    }
}

window.procesarRegistroNuevoCarro = async function(e) {
    e.preventDefault();
    const id = document.getElementById('reg-carro-id').value.toUpperCase().trim();
    const tipo_vehiculo = document.getElementById('reg-carro-tipo').value.trim();
    const cuadrante = document.getElementById('reg-carro-cuadrante').value.trim();
    const tripulacion = document.getElementById('reg-carro-tripulacion').value.trim();

    const { error } = await supabaseClient.from('patrullas_cenco').insert([{
        id: id, 
        tipo_vehiculo: tipo_vehiculo, 
        cuadrante: cuadrante, 
        tripulacion: tripulacion, 
        operador_assigned_id: ID_OPERADOR_ACTIVO 
    }]);

    if (error) return alert("Error al registrar carro policial: " + error.message);
    
    alert(` 🚨 Carro Policial ${id} matriculado con éxito en Supabase.`);
    document.getElementById('reg-carro-id').value = "";
    document.getElementById('reg-carro-tipo').value = "";
    document.getElementById('reg-carro-cuadrante').value = "";
    document.getElementById('reg-carro-tripulacion').value = "";
    
    renderPerfilOperadorFicha();
};

async function renderDenunciasRecibidas() {
    await cargarIncidentesDesdeSupabase();
    const tbody = document.getElementById('tabla-denuncias-body');
    if (!tbody) return;

    tbody.innerHTML = cacheIncidentesGlobal.map(inc => {
        let badgeColor = '#ff4757'; 
        if (inc.estado === 'RESUELTO') badgeColor = '#10b981';
        if (inc.estado === 'EN ATENCION') badgeColor = '#3b82f6';

        const horaTexto = new Date(inc.creado_al).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        return `
            <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: top; background:#fff;">
                <td style="padding: 20px; white-space: nowrap;">
                    <div style="font-weight: bold; margin-bottom: 8px; color:var(--texto-oscuro); font-size:1rem;">${inc.id.substring(0,6).toUpperCase()}</div>
                    <span style="background:${badgeColor}15; color:${badgeColor}; font-size:0.7rem; font-weight:bold; padding:4px 8px; border-radius:4px; text-transform:uppercase; white-space: nowrap; display: inline-block;">● ${inc.estado}</span>
                </td>
                <td style="padding: 20px;">
                    <div style="font-weight: bold; color: var(--texto-oscuro); display: flex; align-items: center; gap: 6px; font-size:1rem;">
                        ⚠️ Reporte de Urgencia Inclusivo
                    </div>
                    <div style="font-size: 0.85rem; color: var(--texto-mutated); margin-top: 5px;">👤 ${inc.nombre_ciudadano} (RUT: ${inc.rut_ciudadano})</div>
                    <div style="font-size: 0.85rem; color: var(--texto-mutated); font-style: italic; margin-top: 10px; line-height: 1.4; background:#f8fafc; padding:8px 12px; border-radius:6px; border-left:3px solid #cbd5e1;">"Alerta Crítica gatillada desde terminal móvil."</div>
                </td>
                <td style="padding: 20px; color: var(--texto-oscuro); font-size: 0.9rem; font-weight:500;">📍 ${inc.ubicacion_texto}</td>
                <td style="padding: 20px; color: var(--texto-mutated); font-size: 0.9rem; white-space: nowrap;">🕒 ${horaTexto}</td>
                <td style="padding: 20px; text-align: center;">
                    <button class="btn-submit" style="padding: 8px 16px; font-size: 0.85rem; width: auto; background: #004d35;" onclick="navegarA('detalle-incidente', '${inc.id}')">Gestionar</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function renderDetailIndividualIncidente(idIncidente) {
    const { data: inc } = await supabaseClient.from('alertas_sos').select('*').eq('id', idIncidente).single();
    if (!inc) return;

    let badgeColor = '#ff4757';
    if (inc.estado === 'RESUELTO') badgeColor = '#10b981';
    if (inc.estado === 'EN ATENCION') badgeColor = '#3b82f6';
    if (inc.estado === 'PENDIENTE') badgeColor = '#f97316'; // Naranja para delitos menores

    const horaExpediente = new Date(inc.creado_al).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    
    // Rótulo dinámico para urgencias vs delitos menores
    const labelTipo = (inc.categoria_tag === 'SOS') ? 'Urgencia' : `Delito Menor (${inc.categoria_tag})`;

    document.getElementById('contenedor-modulo-detalle-vivo').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; width:100%;">
            <button onclick="navegarA('denuncias')" style="background:none; border:none; color:var(--texto-oscuro); font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; font-size:0.95rem;">← Volver a Denuncias</button>
            <div style="display:flex; gap:12px;">
                <button class="btn-submit" style="background:#004d35; width:auto; padding:10px 20px;" onclick="navegarA('patrullas')">Derivar Patrulla</button>
                <button class="btn-submit" style="background:#10b981; width:auto; padding:10px 20px;" onclick="window.cambiarEstadoIncidenteDirecto('${inc.id}', 'RESUELTO')">Marcar como Resuelto</button>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1.3fr 1fr; gap:20px; max-width:1100px; margin:0 auto; align-items: stretch;">
            <!-- LEFT COLUMN: INCIDENT INFO & MAP -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:flex-start; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                            <h2 style="font-size:1.8rem; font-weight:800; color:var(--texto-oscuro);">${inc.id.substring(0,6).toUpperCase()}</h2>
                            <span style="background:${badgeColor}15; color:${badgeColor}; font-size:0.75rem; font-weight:bold; padding:4px 10px; border-radius:4px; text-transform:uppercase;">● ${inc.estado}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:var(--texto-mutated); font-size:1.05rem;">⚠️ ${labelTipo}: ${inc.nombre_ciudadano} (RUT: ${inc.rut_ciudadano})</div>
                    </div>
                    <div style="text-align:right; color:var(--texto-mutated); font-size:0.9rem;">
                        <div style="display:flex; align-items:center; gap:6px; font-weight:600; justify-content:flex-end;">🕒 ${horaExpediente}</div>
                        <p style="margin-top:6px; font-weight:500;">Ubicación: ${inc.ubicacion_texto}</p>
                    </div>
                </div>

                <!-- SIMULACIÓN DE MAPA -->
                <div style="background:#fff; border-radius:8px; border:1px solid #e2e8f0; padding:20px; height: 350px; display:flex; flex-direction:column; justify-content:center; align-items:center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h4 style="margin:0 0 12px 0; color:var(--texto-oscuro); font-weight:700; width:100%; text-align:left;">📍 Georreferenciación SOS (Mapa Satelital)</h4>
                    <div style="width:100%; height:100%; border-radius:6px; background:#e2e8f0; display:flex; justify-content:center; align-items:center; font-style:italic; font-weight:600; color:var(--texto-mutated); border:1px dashed #cbd5e1;">
                        [Simulación de Mapa en Vivo - Latitud: ${inc.latitud.toFixed(4)}, Longitud: ${inc.longitud.toFixed(4)}]
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: REALTIME CHAT CON CIUDADANO SORDO -->
            <div style="background:#fff; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; height: 490px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <!-- Chat Header -->
                <div style="background:var(--verde-carabinero); color:white; padding:15px; font-weight:bold; font-size:0.9rem; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <span>💬 Chat Radial con Ciudadano</span>
                    <span style="font-size:0.7rem; background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-weight:700;">ACTIVO</span>
                </div>
                
                <!-- Chat History -->
                <div id="dashboard-chat-historial" style="flex-grow:1; overflow-y:auto; padding:15px; display:flex; flex-direction:column; gap:10px; background:#f8fafc;">
                    <p style="font-style:italic; color:#94a3b8; text-align:center; font-size:0.8rem; margin-top:50px; width:100%;">Cargando mensajes del chat...</p>
                </div>
                
                <!-- Chat Input Footer -->
                <div style="padding:15px; border-top:1px solid #e2e8f0; display:flex; gap:10px; background:white; flex-shrink:0; align-items:center;">
                    <input type="text" id="dashboard-chat-input" placeholder="Escribir respuesta al ciudadano sordo..." style="flex-grow:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.85rem; outline:none;" onkeypress="if(event.key === 'Enter') window.enviarMensajeDashboard('${inc.id}', '${inc.rut_ciudadano}')">
                    <button onclick="window.enviarMensajeDashboard('${inc.id}', '${inc.rut_ciudadano}')" style="background:var(--verde-carabinero); color:white; border:none; padding:10px 15px; border-radius:6px; font-weight:bold; font-size:0.85rem; cursor:pointer; outline:none;">Enviar</button>
                </div>
            </div>
        </div>
    `;

    // Inicializar chat tras inyección
    setTimeout(() => {
        window.inicializarChatDashboard(inc.id);
    }, 100);
}

window.cambiarEstadoIncidenteDirecto = async function(id, nuevoEstado) {
    try {
        let patrullaAsignada = null;

        // Intentar leer la patrulla asignada (si la columna no existe, no crasheamos)
        try {
            const { data: alerta } = await supabaseClient
                .from('alertas_sos')
                .select('patrulla_asignada')
                .eq('id', id)
                .single();
            if (alerta) {
                patrullaAsignada = alerta.patrulla_asignada;
            }
        } catch (colErr) {
            console.warn("⚠️ No se pudo leer patrulla_asignada. Probablemente la columna no existe.", colErr);
        }

        // 2. Cerrar el incidente en Supabase
        const { error: err1 } = await supabaseClient.from('alertas_sos').update({ estado: nuevoEstado }).eq('id', id);
        if (err1) {
            alert("Error en Supabase al cerrar incidente: " + err1.message);
            return;
        }

        // 3. Liberar patrulla(s)
        if (patrullaAsignada) {
            const listaPatrullas = patrullaAsignada.split(',').map(s => s.trim());
            for (const pat of listaPatrullas) {
                if (!pat) continue;
                const { error: err2 } = await supabaseClient
                    .from('patrullas_cenco')
                    .update({ estado_vehiculo: 'disponible' })
                    .eq('id', pat);
                if (err2) {
                    console.warn(`Error al liberar patrulla específica ${pat}:`, err2.message);
                }
            }
        } else {
            // Respaldar liberando cualquier patrulla ocupada en el sistema para la demo
            const { error: err3 } = await supabaseClient
                .from('patrullas_cenco')
                .update({ estado_vehiculo: 'disponible' })
                .eq('estado_vehiculo', 'en procedimiento');
            if (err3) {
                console.warn("Error al liberar patrullas:", err3.message);
            }
        }

        alert(`🚨 Procedimiento cerrado de forma conforme.`);
        navegarA('panel');
    } catch (err) {
        console.error("Error al cerrar procedimiento:", err);
        alert("Error al intentar resolver la emergencia.");
    }
};



window.abrirModalDespacho = async function(idPatrulla) {
    patrullaSeleccionadaParaDespacho = idPatrulla;
    document.getElementById('modal-titulo-patrulla').innerText = `Despachar Patrulla ${idPatrulla}`;
    const modal = document.getElementById('modal-despacho-patrulla');
    const cuerpoModal = document.getElementById('modal-lista-denuncias-cuerpo');
    modal.style.display = "flex";

    await cargarIncidentesDesdeSupabase();
    const pendientes = cacheIncidentesGlobal.filter(i => i.estado !== 'RESUELTO');

    cuerpoModal.innerHTML = pendientes.map(i => {
        const yaDerivado = i.estado === 'EN ATENCION';
        const badgeDerivada = yaDerivado 
            ? `<span style="background:#fee2e2; color:#ef4444; font-size:0.65rem; font-weight:bold; padding:2px 6px; border-radius:4px; margin-left:8px;">⚠️ DERIVADO</span>` 
            : '';
        const btnTexto = yaDerivado ? 'Asignar patrulla adicional' : 'Asignar a esta denuncia';

        return `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display:flex; flex-direction:column; gap:10px; margin-bottom:5px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${i.id.substring(0,6).toUpperCase()}</strong> 
                    <span style="font-size:0.8rem; display:flex; align-items:center;">● ${i.estado} ${badgeDerivada}</span>
                </div>
                <p style="font-size:0.85rem; margin:0;"><b>Reporte de Urgencia</b> - ${i.ubicacion_texto}</p>
                <button onclick="window.asignarPatrullaADenuncia('${i.id}')" class="btn-submit" style="background:#004d35; padding:8px; font-size:0.85rem; width:100%;">${btnTexto}</button>
            </div>
        `;
    }).join('');
};

window.cerrarModalDespacho = function() { document.getElementById('modal-despacho-patrulla').style.display = "none"; };

window.asignarPatrullaADenuncia = async function(idDenuncia) {
    try {
        // 1. Primero actualizamos el estado (siempre tiene éxito)
        const { error: err1 } = await supabaseClient.from('alertas_sos').update({ estado: 'EN ATENCION' }).eq('id', idDenuncia);
        if (err1) {
            alert("Error en Supabase al actualizar estado: " + err1.message);
            return;
        }

        // Obtener patrullas ya asignadas para concatenar
        const alertaActual = cacheIncidentesGlobal.find(i => i.id === idDenuncia);
        let nuevasPatrullas = patrullaSeleccionadaParaDespacho;
        if (alertaActual && alertaActual.patrulla_asignada) {
            const listaExistente = alertaActual.patrulla_asignada.split(',').map(s => s.trim());
            if (!listaExistente.includes(patrullaSeleccionadaParaDespacho)) {
                listaExistente.push(patrullaSeleccionadaParaDespacho);
                nuevasPatrullas = listaExistente.join(', ');
            } else {
                nuevasPatrullas = alertaActual.patrulla_asignada;
            }
        }

        // 2. Intentamos guardar la patrulla asignada (si la columna no existe, falla de forma controlada)
        try {
            await supabaseClient.from('alertas_sos').update({ 
                patrulla_asignada: nuevasPatrullas
            }).eq('id', idDenuncia);
        } catch (colErr) {
            console.warn("⚠️ No se pudo guardar patrulla_asignada en alertas_sos.", colErr);
        }

        // 3. Cambiamos el estado del carro policial a en procedimiento
        const { error: err3 } = await supabaseClient.from('patrullas_cenco').update({ estado_vehiculo: 'en procedimiento' }).eq('id', patrullaSeleccionadaParaDespacho);
        if (err3) {
            alert("Error en Supabase al asignar patrulla: " + err3.message);
            return;
        }

        alert(`Unidad ${patrullaSeleccionadaParaDespacho} asignada.`);
        window.cerrarModalDespacho();
        navegarA('panel');
    } catch (err) {
        console.error("Error al asignar patrulla:", err);
        alert("Ocurrió un error al despachar la patrulla.");
    }
};

window.filtrarAlertasTurno = function() {
    const text = document.getElementById('buscador-alertas-input').value.toLowerCase().trim();
    const filtrados = cacheIncidentesGlobal.filter(i => i.id.toLowerCase().includes(text) || i.nombre_ciudadano.toLowerCase().includes(text));
    window.dibujarListaActividadRecienteHTML(filtrados);
};

window.conmutarDropdownNotificaciones = function(e) { e.stopPropagation(); const d = document.getElementById('dropdown-notificaciones-cenco'); d.style.display = d.style.display === "none" ? "flex" : "none"; };
document.addEventListener('click', () => { const d = document.getElementById('dropdown-notificaciones-cenco'); if(d) d.style.display = "none"; });

// --- 🌐 ENLACE EN TIEMPO REAL (REALTIME LISTENERS CORREGIDO) ---
function escucharAlertasRealtime() {
    console.log("🟢 Central CENCO escuchando cambios en tiempo real...");
    
    // Escuchador de incidentes/alertas
    supabaseClient
        .channel('cambios-incidentes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_sos' }, async (payload) => {
            console.log("🚨 CAMBIO EN ALERTA SOS:", payload);
            await cargarIncidentesDesdeSupabase();
            
            const linkPanel = document.getElementById('menu-panel');
            if (linkPanel && linkPanel.classList.contains('active')) {
                renderPanelControl();
            }
            
            const linkDenuncias = document.getElementById('menu-denuncias');
            if (linkDenuncias && linkDenuncias.classList.contains('active')) {
                renderDenunciasRecibidas();
            }

            const linkPatrullas = document.getElementById('menu-patrullas');
            if (linkPatrullas && linkPatrullas.classList.contains('active')) {
                await renderPatrullasEnSector();
                inicializarMapaOperativoConcepcion();
            }
        })
        .subscribe();

    // Escuchador de patrullas
    supabaseClient
        .channel('cambios-patrullas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patrullas_cenco' }, async (payload) => {
            console.log("🚔 CAMBIO EN ESTADO DE PATRULLA:", payload);
            await cargarPatrullasDesdeSupabase();

            const linkPanel = document.getElementById('menu-panel');
            if (linkPanel && linkPanel.classList.contains('active')) {
                const patrullasDisponibles = cachePatrullasGlobal.filter(p => p.estado_vehiculo === 'disponible').length || 0;
                if (document.getElementById('contador-patrulla-vivo')) {
                    document.getElementById('contador-patrulla-vivo').innerText = patrullasDisponibles;
                }
            }

            const linkPatrullas = document.getElementById('menu-patrullas');
            if (linkPatrullas && linkPatrullas.classList.contains('active')) {
                await renderPatrullasEnSector();
                inicializarMapaOperativoConcepcion();
            }
        })
        .subscribe();
}

// --- SISTEMA DE ENRUTAMIENTO SPA EN CASCADA COMPACTO ---
function navegarA(vista, dataParam = null) {
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    
    document.getElementById('vista-panel-control').style.display = "none";
    document.getElementById('vista-denuncias-recibidas').style.display = "none";
    document.getElementById('vista-gestion-videollamadas').style.display = "none";
    document.getElementById('vista-derivacion-patrullas').style.display = "none";
    document.getElementById('vista-detalle-incidente').style.display = "none";
    document.getElementById('vista-perfil-operador').style.display = "none";
    if (document.getElementById('vista-perfiles')) document.getElementById('vista-perfiles').style.display = "none";

    switch (vista) {
        case 'panel':
            document.getElementById('menu-panel').classList.add('active');
            document.getElementById('vista-panel-control').style.display = "block";
            renderPanelControl();
            break;
        case 'denuncias':
            document.getElementById('menu-denuncias').classList.add('active');
            document.getElementById('vista-denuncias-recibidas').style.display = "block";
            renderDenunciasRecibidas();
            break;
        case 'videos':
            document.getElementById('menu-videos').classList.add('active');
            document.getElementById('vista-gestion-videollamadas').style.display = "block";
            break;
        case 'patrullas':
            document.getElementById('menu-patrullas').classList.add('active');
            document.getElementById('vista-derivacion-patrullas').style.display = "block";
            renderPatrullasEnSector();
            setTimeout(() => { window.inicializarMapaOperativoConcepcion(); }, 50);
            break;
        case 'perfiles':
            if (document.getElementById('menu-perfiles')) document.getElementById('menu-perfiles').classList.add('active');
            if (document.getElementById('vista-perfiles')) {
                document.getElementById('vista-perfiles').style.display = "block";
                window.renderPerfilesCrud();
            }
            break;
        case 'detalle-incidente':
            document.getElementById('vista-detalle-incidente').style.display = "block";
            renderDetailIndividualIncidente(dataParam);
            break;
        case 'perfil':
            document.getElementById('vista-perfil-operador').style.display = "block";
            renderPerfilOperadorFicha();
            break;
        case 'login':
            wrapperPlataforma.style.display = "none";
            wrapperLogin.style.display = "flex";
            break;
    }
}

document.getElementById('menu-panel').onclick = (e) => { e.preventDefault(); navegarA('panel'); };
document.getElementById('menu-denuncias').onclick = (e) => { e.preventDefault(); navegarA('denuncias'); };
document.getElementById('menu-videos').onclick = (e) => { e.preventDefault(); navegarA('videos'); };
document.getElementById('menu-patrullas').onclick = (e) => { e.preventDefault(); navegarA('patrullas'); };
if (document.getElementById('menu-perfiles')) {
    document.getElementById('menu-perfiles').onclick = (e) => { e.preventDefault(); navegarA('perfiles'); };
}
document.getElementById('btn-logout').onclick = (e) => { e.preventDefault(); sessionActiva = false; navegarA('login'); };

/**
 * 👤 Actualizar datos del operador de forma dinámica en la barra lateral
 */
window.actualizarSidebarOperadorDinamico = async function() {
    try {
        const { data: op, error } = await supabaseClient
            .from('perfiles_operadores')
            .select('*')
            .eq('id', ID_OPERADOR_ACTIVO)
            .single();

        if (error || !op) {
            console.warn("⚠️ No se pudo cargar el operador dinámico para el sidebar:", error?.message);
            return;
        }

        // Obtener iniciales (ej: "JP" de Juan Pérez)
        const partes = op.nombre_completo.split(' ');
        const iniciales = (partes[2] && partes[3]) 
            ? `${partes[2].charAt(0)}${partes[3].charAt(0)}` 
            : op.nombre_completo.substring(0, 2).toUpperCase();

        if (document.getElementById('sidebar-operador-avatar')) {
            document.getElementById('sidebar-operador-avatar').innerText = iniciales;
        }
        if (document.getElementById('sidebar-operador-nombre')) {
            // Mostrar apellido (ej: "Sargento 2º Pérez")
            const apellido = partes[2] || op.nombre_completo;
            document.getElementById('sidebar-operador-nombre').innerText = `${op.grado} ${apellido}`;
        }
        if (document.getElementById('sidebar-operador-rol')) {
            document.getElementById('sidebar-operador-rol').innerText = "Operador Central ⚙️";
        }
    } catch (err) {
        console.error("❌ Falla en la barra lateral del operador:", err);
    }
};

/**
 * 👥 MÓDULO CRUD DE PERFILES Y CUADRANTES (HU-02)
 */
let cacheOperadoresCrud = [];

// Cargar y Renderizar CRUD de Operadores y Cuadrantes
window.renderPerfilesCrud = async function() {
    try {
        // 1. Cargar operadores
        const { data: operadores, error: errOp } = await supabaseClient
            .from('perfiles_operadores')
            .select('*')
            .order('nombre_completo', { ascending: true });

        if (errOp) {
            console.error("Error al cargar operadores:", errOp);
            return;
        }

        cacheOperadoresCrud = operadores || [];
        const tbody = document.getElementById('crud-tabla-operadores-body');
        
        if (cacheOperadoresCrud.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="padding:20px; text-align:center; color:var(--texto-mutado);">No hay operadores registrados.</td></tr>`;
        } else {
            tbody.innerHTML = cacheOperadoresCrud.map(op => {
                let badgeRolColor = '#3b82f6'; // Azul para Operador
                let labelRol = 'Operador Radial';
                
                // Determinamos el rol según el email o la placa
                if (op.identificacion_placa.includes('INT') || op.nombre_completo.toLowerCase().includes('interprete')) {
                    badgeRolColor = '#10b981'; // Verde para Intérprete
                    labelRol = 'Intérprete LSCh';
                } else if (op.grado.toLowerCase().includes('teniente') || op.grado.toLowerCase().includes('capitán')) {
                    badgeRolColor = '#f59e0b'; // Naranja para Supervisor
                    labelRol = 'Supervisor';
                }

                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:12px 5px;">
                            <div style="font-weight:700; color:var(--texto-oscuro);">${op.nombre_completo}</div>
                            <div style="font-size:0.75rem; color:var(--texto-mutated);">${op.grado}</div>
                        </td>
                        <td style="padding:12px 5px; font-family:monospace; color:var(--texto-oscuro);">${op.identificacion_placa}</td>
                        <td style="padding:12px 5px;">
                            <span style="background:${badgeRolColor}15; color:${badgeRolColor}; font-size:0.65rem; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                                ${labelRol}
                            </span>
                        </td>
                        <td style="padding:12px 5px; text-align:center; display:flex; gap:6px; justify-content:center;">
                            <button onclick="window.iniciarEditarOperador('${op.id}')" style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;">Editar</button>
                            <button onclick="window.eliminarOperador('${op.id}')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;">Baja</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // 2. Cargar cuadrantes
        // Obtenemos todos los cuadrantes desde las patrullas registradas en Supabase
        const { data: patrullas, error: errPat } = await supabaseClient
            .from('patrullas_cenco')
            .select('cuadrante, tripulacion, id');
            
        const cuadrantesContainer = document.getElementById('crud-cuadrantes-lista');
        if (errPat || !patrullas) {
            cuadrantesContainer.innerHTML = `<div style="grid-column: span 2; padding:15px; text-align:center; color:var(--texto-mutado);">Error al cargar los cuadrantes.</div>`;
            return;
        }

        // Agrupamos patrullas por cuadrante
        const cuadrantesMap = {};
        patrullas.forEach(p => {
            if (!cuadrantesMap[p.cuadrante]) {
                cuadrantesMap[p.cuadrante] = [];
            }
            cuadrantesMap[p.cuadrante].push(p.id);
        });

        const listaCuadrantes = Object.keys(cuadrantesMap);
        if (listaCuadrantes.length === 0) {
            cuadrantesContainer.innerHTML = `<div style="grid-column: span 2; padding:15px; text-align:center; color:var(--texto-mutado);">No hay cuadrantes registrados en el sistema.</div>`;
        } else {
            cuadrantesContainer.innerHTML = listaCuadrantes.map(cuadName => {
                const patrullasCod = cuadrantesMap[cuadName].join(', ');
                return `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px 15px; display:flex; flex-direction:column; gap:6px;">
                        <span style="font-weight:700; color:#004d35; font-size:0.9rem;">📍 ${cuadName}</span>
                        <span style="font-size:0.75rem; color:var(--texto-mutated);">Vehículos asignados: <b>${patrullasCod}</b></span>
                        <span style="font-size:0.75rem; color:var(--texto-mutated);">Dotación: <b>1ª Comisaría de Concepción</b></span>
                    </div>
                `;
            }).join('');
        }

        // 3. Cargar y renderizar ciudadanos para anti-pitanza
        const { data: ciudadanos, error: errCiu } = await supabaseClient
            .from('perfiles_ciudadanos')
            .select('nombre_completo, rut, correo, es_bloqueado')
            .order('nombre_completo', { ascending: true });

        const ciuTbody = document.getElementById('crud-tabla-ciudadanos-body');
        if (errCiu || !ciudadanos) {
            ciuTbody.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--texto-mutado);">Error al cargar perfiles de ciudadanos.</td></tr>`;
            return;
        }

        if (ciudadanos.length === 0) {
            ciuTbody.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--texto-mutado);">No hay ciudadanos registrados.</td></tr>`;
        } else {
            ciuTbody.innerHTML = ciudadanos.map(ciu => {
                const estadoBadgeColor = ciu.es_bloqueado ? '#ef4444' : '#10b981';
                const estadoLabel = ciu.es_bloqueado ? 'Bloqueado' : 'Activo';
                const actionButtonText = ciu.es_bloqueado ? '✅ Desbloquear' : '🚫 Bloquear';
                const actionButtonBg = ciu.es_bloqueado ? '#10b981' : '#ef4444';
                const nuevoEstado = !ciu.es_bloqueado;

                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:12px 5px; font-weight:700; color:var(--texto-oscuro);">${ciu.nombre_completo}</td>
                        <td style="padding:12px 5px; font-family:monospace; color:var(--texto-oscuro);">${ciu.rut}</td>
                        <td style="padding:12px 5px; color:var(--texto-mutated);">${ciu.correo}</td>
                        <td style="padding:12px 5px; text-align:center;">
                            <span style="background:${estadoBadgeColor}15; color:${estadoBadgeColor}; font-size:0.65rem; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                                ${estadoLabel}
                            </span>
                        </td>
                        <td style="padding:12px 5px; text-align:center;">
                            <button onclick="window.toggleBloqueoCiudadano('${ciu.rut}', ${nuevoEstado})" style="background:${actionButtonBg}; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;">
                                ${actionButtonText}
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (err) {
        console.error("Error en renderPerfilesCrud:", err);
    }
};

window.toggleBloqueoCiudadano = async function(rut, nuevoEstado) {
    const actionName = nuevoEstado ? "bloquear" : "desbloquear";
    const confirmar = confirm(`¿Está seguro de que desea ${actionName} al ciudadano con RUT ${rut}?`);
    if (!confirmar) return;

    try {
        const { error } = await supabaseClient
            .from('perfiles_ciudadanos')
            .update({ es_bloqueado: nuevoEstado })
            .eq('rut', rut);

        if (error) {
            alert(`Error al actualizar estado del ciudadano: ${error.message}`);
            return;
        }

        alert(`Estado actualizado con éxito. El ciudadano ha sido ${nuevoEstado ? 'bloqueado' : 'desbloqueado'}.`);
        window.renderPerfilesCrud();
    } catch (err) {
        console.error("Error en toggleBloqueoCiudadano:", err);
        alert("Ocurrió un error inesperado al procesar la solicitud.");
    }
};

// Crear o Editar Operador en Supabase
window.procesarCrudOperador = async function(event) {
    event.preventDefault();
    const id = document.getElementById('crud-op-id').value;
    const nombre = document.getElementById('crud-op-nombre').value.trim();
    const rut = document.getElementById('crud-op-rut').value.trim();
    const grado = document.getElementById('crud-op-grado').value.trim();
    const correo = document.getElementById('crud-op-correo').value.trim();
    const placa = document.getElementById('crud-op-placa').value.trim();
    const rol = document.getElementById('crud-op-rol').value;

    const payload = {
        nombre_completo: nombre,
        grado: grado,
        identificacion_placa: placa,
        dotacion_cuartel: '1ª Comisaría de Concepción'
    };
    
    try {
        let resultado = null;
        if (id) {
            // Edición
            resultado = await supabaseClient
                .from('perfiles_operadores')
                .update(payload)
                .eq('id', id);
        } else {
            // Creación
            resultado = await supabaseClient
                .from('perfiles_operadores')
                .insert([payload]);
        }

        if (resultado.error) {
            alert("Error al guardar funcionario: " + resultado.error.message);
            return;
        }

        alert(id ? "Funcionario actualizado con éxito." : "Funcionario creado con éxito.");
        window.cancelarEdicionOperador();
        window.renderPerfilesCrud();
    } catch (err) {
        console.error("Error en procesarCrudOperador:", err);
        alert("Ocurrió un error al guardar el registro.");
    }
};

// Cargar datos en el formulario para editar
window.iniciarEditarOperador = function(id) {
    const op = cacheOperadoresCrud.find(o => o.id === id);
    if (!op) return;

    document.getElementById('crud-op-id').value = op.id;
    document.getElementById('crud-op-nombre').value = op.nombre_completo;
    document.getElementById('crud-op-rut').value = '11.222.333-k'; // Dummy
    document.getElementById('crud-op-grado').value = op.grado;
    document.getElementById('crud-op-correo').value = `${op.nombre_completo.toLowerCase().replace(/ /g, '.')}@carabineros.cl`;
    document.getElementById('crud-op-placa').value = op.identificacion_placa;
    
    // Asignar rol simulado según placa
    if (op.identificacion_placa.includes('INT') || op.nombre_completo.toLowerCase().includes('interprete')) {
        document.getElementById('crud-op-rol').value = 'INTERPRETE';
    } else {
        document.getElementById('crud-op-rol').value = 'OPERADOR';
    }

    document.getElementById('crud-form-titulo').innerText = `🛡️ Editar Funcionario`;
    document.getElementById('btn-crud-op-submit').innerText = `💾 Guardar Cambios`;
    document.getElementById('btn-crud-op-cancel').style.display = "block";
};

// Limpiar formulario y cancelar edición
window.cancelarEdicionOperador = function() {
    document.getElementById('crud-op-id').value = "";
    document.getElementById('crud-op-nombre').value = "";
    document.getElementById('crud-op-rut').value = "";
    document.getElementById('crud-op-grado').value = "";
    document.getElementById('crud-op-correo').value = "";
    document.getElementById('crud-op-placa').value = "";
    document.getElementById('crud-op-rol').value = "OPERADOR";

    document.getElementById('crud-form-titulo').innerText = `🛡️ Registrar Nuevo Funcionario`;
    document.getElementById('btn-crud-op-submit').innerText = `💾 Guardar Registro`;
    document.getElementById('btn-crud-op-cancel').style.display = "none";
};

// Eliminar funcionario
window.eliminarOperador = async function(id) {
    const confirmar = confirm("¿Está seguro de dar de baja a este funcionario de la dotación active?");
    if (!confirmar) return;

    try {
        const { error } = await supabaseClient
            .from('perfiles_operadores')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error al dar de baja al funcionario: " + error.message);
            return;
        }

        alert("Funcionario dado de baja de la dotación con éxito.");
        window.renderPerfilesCrud();
    } catch (err) {
        console.error("Error en eliminarOperador:", err);
        alert("Ocurrió un error al eliminar el funcionario.");
    }
};

/**
 * 📹 SIMULACIÓN INTERACTIVA DE VIDEOLLAMADA TRILATERAL (HU-03 / LEY 21719)
 */
let simVideoCallInterval = null;
let simVideoCallStep = 0;
let isSimulatingVideoCall = false;

const dialogosSimulacion = [
    {
        autor: "María González (Ciudadano Sordo)",
        texto: "[LSCh] Hola, necesito ayuda urgente. Hay una persona sospechosa merodeando frente a mi local comercial.",
        subtitulo: "🤟 [María González]: Hola, necesito ayuda urgente. Hay un sospechoso merodeando frente a mi local comercial."
    },
    {
        autor: "Subt. Carla Jara (Intérprete)",
        texto: "Recibido María. Sargento Pérez, la ciudadana reporta sospechoso merodeando en calle Barros Arana 450.",
        subtitulo: "🎙️ [Intérprete]: Recibido María. Sargento Pérez, la ciudadana reporta sospechoso merodeando en calle Barros Arana 450."
    },
    {
        autor: "Sargento Pérez (Operador)",
        texto: "Entendido. Estoy visualizando el cuadrante. Procedo a despachar la patrulla Z-8942 de inmediato.",
        subtitulo: "👮 [Operador]: Entendido. Estoy visualizando el cuadrante. Procedo a despachar la patrulla Z-8942 de inmediato."
    },
    {
        autor: "Subt. Carla Jara (Intérprete)",
        texto: "[LSCh] María, Carabineros va en camino. La patrulla Z-8942 fue derivada y va en camino.",
        subtitulo: "🎙️ [Intérprete]: María, Carabineros va en camino. La patrulla Z-8942 fue derivada."
    },
    {
        autor: "María González (Ciudadano Sordo)",
        texto: "[LSCh] Muchas gracias. Esperaré resguardada dentro del local comercial.",
        subtitulo: "🤟 [María González]: Muchas gracias. Esperaré resguardada dentro del local."
    }
];

window.toggleVideoCallSimulation = function() {
    const btn = document.getElementById('btn-iniciar-sim-videollamada');
    const labelStatus = document.getElementById('video-live-status-label');
    const subtitulos = document.getElementById('subtitulos-conferencia');
    const placeholder = document.getElementById('video-chat-placeholder');
    const transcripcion = document.getElementById('video-chat-transcripcion');

    // Cambiar filtros visuales a activo (luminosidad normal)
    document.getElementById('video-ciudadano').style.filter = "brightness(1)";
    document.getElementById('video-interprete').style.filter = "brightness(1)";
    document.getElementById('video-operador').style.filter = "brightness(1)";

    // Quitar emoji de silenciado
    document.getElementById('sim-indicador-pfp-1').style.display = "none";
    document.getElementById('sim-indicador-pfp-2').style.display = "none";
    document.getElementById('sim-indicador-pfp-3').style.display = "none";

    if (isSimulatingVideoCall) {
        // Pausar
        clearInterval(simVideoCallInterval);
        isSimulatingVideoCall = false;
        btn.innerText = "📞 Continuar Simulación";
        btn.style.background = "#3b82f6";
        labelStatus.innerText = "PAUSADO";
        labelStatus.style.color = "#ff9f43";
        return;
    }

    // Iniciar
    isSimulatingVideoCall = true;
    btn.innerText = "⏸️ Pausar Simulación";
    btn.style.background = "#f59e0b";
    labelStatus.innerText = "EN VIVO";
    labelStatus.style.color = "#10b981";
    subtitulos.style.display = "block";
    
    if (placeholder) placeholder.style.display = "none";

    const reproducirPaso = () => {
        if (simVideoCallStep >= dialogosSimulacion.length) {
            clearInterval(simVideoCallInterval);
            subtitulos.innerText = "[Enlace Trilateral Finalizado Con Excesivo Cumplimiento de Protocolo]";
            btn.innerText = "📞 Iniciar Simulación Trilateral";
            btn.style.background = "#10b981";
            isSimulatingVideoCall = false;
            simVideoCallStep = 0;
            return;
        }

        const diag = dialogosSimulacion[simVideoCallStep];
        
        // Animamos los subtítulos en pantalla
        subtitulos.innerText = diag.subtitulo;
        
        // Agregamos a la transcripción lateral
        const p = document.createElement('p');
        p.style.margin = "6px 0";
        p.style.fontSize = "0.85rem";
        p.innerHTML = `<b style="color:#004d35;">${diag.autor}:</b> ${diag.texto}`;
        transcripcion.appendChild(p);
        transcripcion.scrollTop = transcripcion.scrollHeight;

        simVideoCallStep++;
    };

    // Reproducir el primer paso inmediatamente
    reproducirPaso();
    simVideoCallInterval = setInterval(reproducirPaso, 4000);
};

window.finalizarSimulacionVideoCall = function() {
    clearInterval(simVideoCallInterval);
    isSimulatingVideoCall = false;
    simVideoCallStep = 0;

    // Resetear filtros
    document.getElementById('video-ciudadano').style.filter = "brightness(0.45)";
    document.getElementById('video-interprete').style.filter = "brightness(0.45)";
    document.getElementById('video-operador').style.filter = "brightness(0.45)";

    // Mostrar emojis de silenciado
    document.getElementById('sim-indicador-pfp-1').style.display = "flex";
    document.getElementById('sim-indicador-pfp-2').style.display = "flex";
    document.getElementById('sim-indicador-pfp-3').style.display = "flex";

    // Resetear UI
    const btn = document.getElementById('btn-iniciar-sim-videollamada');
    btn.innerText = "📞 Iniciar Simulación Trilateral";
    btn.style.background = "#10b981";

    const labelStatus = document.getElementById('video-live-status-label');
    labelStatus.innerText = "EN ESPERA";
    labelStatus.style.color = "#ff9f43";

    const subtitulos = document.getElementById('subtitulos-conferencia');
    subtitulos.style.display = "none";
    subtitulos.innerText = "[Enlace Trilateral Conectado - Esperando Audio/Señas...]";

    const transcripcion = document.getElementById('video-chat-transcripcion');
    transcripcion.innerHTML = `<p style="font-style: italic; margin:0;" id="video-chat-placeholder">Los diálogos transcritos aparecerán aquí durante la simulación...</p>`;

    alert("Enlace trilateral cerrado correctamente.");
};

/**
 * 💬 CHAT DE EMERGENCIA BIDIRECCIONAL EN TIEMPO REAL (DASHBOARD CENTRAL)
 */
let dashboardChatChannel = null;

window.inicializarChatDashboard = async function(alertaId) {
    console.log("🟢 Inicializando Chat Dashboard para Alerta:", alertaId);
    const historial = document.getElementById('dashboard-chat-historial');
    if (!historial) return;

    try {
        // 1. Cargar mensajes previos de la base de datos
        const { data: mensajes, error } = await supabaseClient
            .from('mensajes_chat')
            .select('*')
            .eq('alerta_id', alertaId)
            .order('creado_al', { ascending: true });

        if (error) throw error;

        historial.innerHTML = "";
        if (!mensajes || mensajes.length === 0) {
            historial.innerHTML = `<p style="font-style: italic; color: #94a3b8; text-align: center; margin-top: 50px; font-size: 0.8rem; width: 100%;">No hay mensajes en esta emergencia. Esperando interacción del ciudadano sordo.</p>`;
        } else {
            mensajes.forEach(msg => {
                window.agregarMensajeBurbujaDashboardHTML(msg.remitente, msg.mensaje);
            });
        }
        historial.scrollTop = historial.scrollHeight;

        // 2. Suscribirse al canal en tiempo real
        if (dashboardChatChannel) {
            dashboardChatChannel.unsubscribe();
        }

        dashboardChatChannel = supabaseClient
            .channel(`dashboard_chat_${alertaId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'mensajes_chat',
                filter: `alerta_id=eq.${alertaId}`
            }, (payload) => {
                console.log("💬 NUEVO MENSAJE CHAT RECIBIDO EN DASHBOARD:", payload.new);
                window.agregarMensajeBurbujaDashboardDashboardHTML(payload.new.remitente, payload.new.mensaje);
            })
            .subscribe();

        // 3. Bloquear chat si el estado es RESUELTO
        const { data: alerta } = await supabaseClient
            .from('alertas_sos')
            .select('estado')
            .eq('id', alertaId)
            .single();

        if (alerta && alerta.estado === 'RESUELTO') {
            const input = document.getElementById('dashboard-chat-input');
            if (input) {
                input.disabled = true;
                input.placeholder = "[Chat Finalizado y Archivado]";
            }
        }
    } catch (err) {
        console.error("Error al inicializar chat dashboard:", err);
    }
};

// Función auxiliar para agregar burbuja
window.agregarMensajeBurbujaDashboardDashboardHTML = function(remitente, texto) {
    window.agregarMensajeBurbujaDashboardHTML(remitente, texto);
};

window.agregarMensajeBurbujaDashboardHTML = function(remitente, texto) {
    const historial = document.getElementById('dashboard-chat-historial');
    if (!historial) return;

    if (historial.innerText.includes("No hay mensajes en esta emergencia")) {
        historial.innerHTML = "";
    }

    const container = document.createElement('div');
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.justifyContent = (remitente === 'central') ? "flex-end" : "flex-start";
    container.style.margin = "4px 0";

    const bubble = document.createElement('div');
    bubble.style.maxWidth = "75%";
    bubble.style.borderRadius = "12px";
    bubble.style.padding = "8px 12px";
    bubble.style.fontSize = "0.8rem";
    bubble.style.lineHeight = "1.4";
    bubble.style.wordBreak = "break-word";

    if (remitente === 'central') {
        bubble.style.background = "var(--verde-carabinero)";
        bubble.style.color = "white";
        bubble.style.borderBottomRightRadius = "2px";
    } else {
        bubble.style.background = "#e2e8f0";
        bubble.style.color = "var(--texto-oscuro)";
        bubble.style.borderBottomLeftRadius = "2px";
    }

    bubble.innerText = texto;
    container.appendChild(bubble);
    historial.appendChild(container);
    historial.scrollTop = historial.scrollHeight;
};

window.enviarMensajeDashboard = async function(alertaId, rutCiudadano) {
    const input = document.getElementById('dashboard-chat-input');
    if (!input) return;
    const texto = input.value.trim();
    if (!texto) return;

    try {
        const { error } = await supabaseClient
            .from('mensajes_chat')
            .insert([
                {
                    alerta_id: alertaId,
                    rut_ciudadano: rutCiudadano,
                    remitente: 'central',
                    mensaje: texto
                }
            ]);

        if (error) throw error;
        input.value = "";
        console.log("✅ Mensaje de central enviado:", texto);
    } catch (err) {
        console.error("Error al enviar mensaje desde Dashboard:", err);
        alert("Error de conexión al enviar el mensaje.");
    }
};

navegarA('login');