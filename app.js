// --- CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://zxeslmngcrqtbolfkbvf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5tU3B4kVQOBGy0pkXYhgcQ_iXi21B4O";

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

        navegarA('panel');
        escucharAlertasRealtime(); // Activa la escucha instantánea desde Supabase
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

    L.marker([-36.8262, -73.0503]).addTo(instanciaMapaLeaflet).bindPopup('<b>Z-8942</b> - Plaza Independencia');
    L.marker([-36.8290, -73.0398]).addTo(instanciaMapaLeaflet).bindPopup('<b>SOS-892</b> - Alerta Activa Sorda').openPopup();
};

// --- LOGICA CONSUMIDORA DE DATOS DE REPORTE (CORREGIDO TABLA alertas_sos) ---
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

async function renderPanelControl() {
    await cargarIncidentesDesdeSupabase();
    await cargarPatrullasDesdeSupabase();
    iniciarRelojGlobal();

    const totalSOS = cacheIncidentesGlobal.filter(i => i.estado === 'CRÍTICO' || i.categoria_tag === 'SOS').length;
    const totalVideos = cacheIncidentesGlobal.filter(i => i.categoria_tag === 'Videollamada' && i.estado !== 'RESUELTO').length;
    
    // Contamos dinámicamente los furgones con el tag disponible en Supabase
    const patrullasDisponibles = cachePatrullasGlobal.filter(p => p.estado_vehiculo === 'disponible').length || 12;

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
                <div class="card-content"><p style="color: var(--texto-mutated); font-size:0.85rem; font-weight:500;">Patrullas Disponibles</p><h3>${patrullasDisponibles}</h3></div>
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

    document.getElementById('dropdown-notificaciones-cenco').style.display = "none";
    document.getElementById('dropdown-lista-alertas-cuerpo').innerHTML = cacheIncidentesGlobal.slice(0, 3).map(i => `
        <div style="padding: 8px; border-bottom: 1px solid #f1f5f9; display:flex; flex-direction:column; gap:4px; font-size:0.8rem;">
            <div style="display:flex; justify-content:space-between; font-weight:700;"><span>${i.id.substring(0,6).toUpperCase()}</span><span style="color:var(--rojo-critico);">${calcularTiempoTranscurrido(i.creado_al)}</span></div>
            <p style="color:var(--texto-mutated); margin:0;">Alerta SOS Inclusiva</p>
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
        let vistaDestino = (inc.categoria_tag === 'Videollamada') ? 'videos' : 'detalle-incidente';

        if (inc.estado === 'CRÍTICO') { colorCirculo = '#ff4757'; }
        else if (inc.estado === 'PENDIENTE') { colorCirculo = '#f97316'; }

        const estiloBorde = (index < arregloIncidentes.length - 1) ? 'border-bottom:1px solid #f1f5f9; padding-bottom:12px;' : '';
        const tiempoRelativoStr = calcularTiempoTranscurrido(inc.creado_al);

        htmlLista += `
            <div style="display:flex; justify-content:space-between; align-items:center; ${estiloBorde}">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="width:10px; height:10px; background:${colorCirculo}; border-radius:50%;"></span>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:700; font-size:0.95rem;">${inc.id.substring(0,6).toUpperCase()}</span>
                            <span style="background:#f1f5f9; color:var(--texto-mutated); font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:bold; text-transform:uppercase;">${inc.categoria_tag}</span>
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
        let bgTag = isDisp ? '#e2f5ec' : '#e0f2fe';
        let colTag = isDisp ? '#10b981' : '#0ea5e9';

        return `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 10px; background: #fff; margin-bottom: 5px;">
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
                    <button onclick="window.abrirModalDespacho('${p.id}')" class="btn-submit" style="background: #004d35; font-size: 0.85rem; padding: 8px; flex-grow: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        🌐 Despachar
                    </button>
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
                    <strong style="color:var(--texto-oscuro); font-size:1rem;">${i.id.substring(0,6).toUpperCase()}</strong> - <span>Alerta SOS Inclusiva</span>
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
        operador_asignado_id: ID_OPERADOR_ACTIVO 
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
                        ⚠️ Alerta SOS Inclusiva
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

    const horaExpediente = new Date(inc.creado_al).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    document.getElementById('contenedor-modulo-detalle-vivo').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; width:100%;">
            <button onclick="navegarA('denuncias')" style="background:none; border:none; color:var(--texto-oscuro); font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; font-size:0.95rem;">← Volver a Denuncias</button>
            <div style="display:flex; gap:12px;">
                <button class="btn-submit" style="background:#004d35; width:auto; padding:10px 20px;" onclick="navegarA('patrullas')">Derivar Patrulla</button>
                <button class="btn-submit" style="background:#10b981; width:auto; padding:10px 20px;" onclick="window.cambiarEstadoIncidenteDirecto('${inc.id}', 'RESUELTO')">Marcar como Resuelto</button>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:20px; max-width:1000px; margin:0 auto;">
            <div style="background:#fff; padding:25px; border-radius:8px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                        <h2 style="font-size:1.8rem; font-weight:800; color:var(--texto-oscuro);">${inc.id.substring(0,6).toUpperCase()}</h2>
                        <span style="background:${badgeColor}15; color:${badgeColor}; font-size:0.75rem; font-weight:bold; padding:4px 10px; border-radius:4px; text-transform:uppercase;">● ${inc.estado}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:var(--texto-mutated); font-size:1.05rem;">⚠️ SOS: ${inc.nombre_ciudadano} (RUT: ${inc.rut_ciudadano})</div>
                </div>
                <div style="text-align:right; color:var(--texto-mutated); font-size:0.9rem;">
                    <div style="display:flex; align-items:center; gap:6px; font-weight:600;">🕒 ${horaExpediente}</div>
                    <p style="margin-top:6px; font-weight:500;">Ubicación: ${inc.ubicacion_texto}</p>
                </div>
            </div>
        </div>
    `;
}

window.cambiarEstadoIncidenteDirecto = function(id, nuevoEstado) {
    supabaseClient.from('alertas_sos').update({ estado: nuevoEstado }).eq('id', id).then(() => {
        alert(`🚨 Procedimiento cerrado de forma conforme.`);
        navegarA('panel');
    });
};

window.abrirModalDespacho = async function(idPatrulla) {
    patrullaSeleccionadaParaDespacho = idPatrulla;
    document.getElementById('modal-titulo-patrulla').innerText = `Despachar Patrulla ${idPatrulla}`;
    const modal = document.getElementById('modal-despacho-patrulla');
    const cuerpoModal = document.getElementById('modal-lista-denuncias-cuerpo');
    modal.style.display = "flex";

    await cargarIncidentesDesdeSupabase();
    const pendientes = cacheIncidentesGlobal.filter(i => i.estado !== 'RESUELTO');

    cuerpoModal.innerHTML = pendientes.map(i => `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display:flex; flex-direction:column; gap:10px; margin-bottom:5px;">
            <div style="display:flex; justify-content:space-between;"><strong>${i.id.substring(0,6).toUpperCase()}</strong> <span>● ${i.estado}</span></div>
            <p style="font-size:0.85rem; margin:0;"><b>Alerta SOS</b> - ${i.ubicacion_texto}</p>
            <button onclick="window.asignarPatrullaADenuncia('${i.id}')" class="btn-submit" style="background:#004d35; padding:8px; font-size:0.85rem; width:100%;">Asignar a esta denuncia</button>
        </div>
    `).join('');
};

window.cerrarModalDespacho = function() { document.getElementById('modal-despacho-patrulla').style.display = "none"; };

window.asignarPatrullaADenuncia = async function(idDenuncia) {
    await supabaseClient.from('alertas_sos').update({ estado: 'EN ATENCION' }).eq('id', idDenuncia);
    await supabaseClient.from('patrullas_cenco').update({ estado_vehiculo: 'en procedimiento' }).eq('id', patrullaSeleccionadaParaDespacho);
    alert(`Unidad ${patrullaSeleccionadaParaDespacho} asignada.`);
    window.cerrarModalDespacho();
    navegarA('panel');
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
    console.log("🟢 Central CENCO escuchando la tabla 'alertas_sos' en tiempo real...");
    
    supabaseClient
        .channel('cambios-incidentes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas_sos' }, (payload) => {
            console.log("🚨 NUEVA ALERTA SOS DETECTADA:", payload.new);
            
            const linkPanel = document.getElementById('menu-panel');
            if (linkPanel && linkPanel.classList.contains('active')) {
                renderPanelControl();
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
document.getElementById('btn-logout').onclick = (e) => { e.preventDefault(); sessionActiva = false; navegarA('login'); };

navegarA('login');