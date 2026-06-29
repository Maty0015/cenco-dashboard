# 💻 CENCO Dashboard - Central de Control y Despacho

Panel de control institucional de la Central de Comunicaciones (CENCO) de Carabineros de Chile, diseñado con una arquitectura SPA de alto rendimiento, e integrado en tiempo real con Supabase.

---

## 🚀 Funcionalidades Clave

1. **Monitoreo SOS en Tiempo Real:** 
   * Recepción de alertas georreferenciadas provenientes del botón de pánico de la app móvil.
   * Reproducción de alerta sonora radial al ingresar reportes críticos nuevos.
2. **Despacho Multiderivación de Patrullas:**
   * Selección y asignación múltiple de patrullas policiales (`patrullas_cenco`) a un único incidente.
   * Bloqueo inteligente del estado del vehículo a `"en procedimiento"`, y posterior liberación en cascada a `"disponible"` una vez finalizado el caso.
3. **Chat de Emergencia Bidireccional:**
   * Canal de mensajería radial instantáneo para interactuar directamente con el ciudadano sordo durante la emergencia.
   * Soporte en tiempo real mediante canales de Supabase.
4. **CRUD de Operadores y Dotación (HU-02):**
   * Panel de administración de oficiales de Carabineros de guardia e intérpretes oficiales de LSCh.
   * Registro, edición y baja de personal en la tabla `perfiles_operadores`.
5. **Módulo de Asistencia Inclusiva (Videollamada HU-03):**
   * Simulación interactiva de enlace trilateral conforme a la Ley N° 21.719.
   * Conecta 3 cámaras de video en vivo (Ciudadano Sordo, Intérprete LSCh y Operador CENCO) con transcripción y subtítulos progresivos automatizados.

---

## ⚡ Instrucciones de Ejecución

Debido a que el Dashboard se comunica con Supabase mediante el SDK web oficial, es ideal ejecutarlo bajo un servidor HTTP local para evitar bloqueos de CORS y asegurar el correcto funcionamiento de las llamadas asíncronas.

### Opción A (Python - Recomendado)
1. Abre tu terminal de comandos en la carpeta `cenco-dashboard/`:
   ```bash
   cd cenco-dashboard
   ```
2. Inicia un servidor web básico de python:
   ```bash
   python -m http.server 8080
   ```
3. Abre tu navegador preferido e ingresa a: `http://localhost:8080`

### Opción B (NodeJS - Live Server)
1. Instala el servidor HTTP simple globalmente:
   ```bash
   npm install -g live-server
   ```
2. Ejecuta el servidor en la raíz del dashboard:
   ```bash
   live-server --port=8080
   ```

### Opción C (Uso Directo)
* Si no dispones de consolas o intérpretes instalados, puedes ejecutar el sistema simplemente haciendo doble clic sobre el archivo [index.html](file:///c:/Users/benja/Documents/weas%20de%20la%20u/Interfaces/app/cenco-dashboard/index.html) en tu explorador de archivos.

---

## 🔑 Credenciales de Acceso

* **Usuario:** `operator`
* **Contraseña:** `cenco2026`
