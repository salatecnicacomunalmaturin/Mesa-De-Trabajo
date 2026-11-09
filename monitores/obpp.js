/**
 * =========================================================================================
 * DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES DEL MUNICIPIO MATURÍN
 * SISTEMA CENTRAL DE GESTIÓN Y MONITOREO INSTITUCIONAL
 * MÓDULO ESPECIALIZADO: Monitor Dinámico OBPP Monagas (Consejos Comunales y Vocerías)
 * Archivo: monitores/obpp.js
 * Versión: 6.0.0 Pure Modular Encapsulation
 * =========================================================================================
 * CARACTERÍSTICAS:
 * 1. Estándar de encapsulamiento: window.MonitorOBPP = { montar: fn, desmontar: fn }
 * 2. Visualización y monitoreo de Consejos Comunales, vocerías, estatus SINCO y renovaciones.
 * 3. Botón de retorno iOS al menú principal y verificación estricta de permisos de edición.
 * 4. Resumen por Parroquias (Vista de Tabla Detallada y Vista de Tarjetas con Barras).
 * 5. Cero terminología técnica: Lenguaje 100% administrativo institucional.
 */

window.MonitorOBPP = (function () {
  let containerRef = null;
  let baseDatos = [];
  let datosFiltradosGlobal = [];
  let paginaActual = 1;
  let tamanoPagina = 25;
  let totalPaginas = 1;
  let modoVistaTabla = true;
  let loaderInterval = null;
  let searchDebounceTimer = null;

  let estadoFiltros = {
    municipio: 'TODOS',
    parroquia: 'TODOS',
    comuna: 'TODOS',
    consejo: 'TODOS',
    estatusSinco: 'TODOS',
    busqueda: '',
    prioridad: 'TODOS',
    fechaTope: '',
    rangoDias: 'TODOS'
  };

  /**
   * Monta el monitor en el contenedor asignado
   */
  async function montar(contenedor) {
    containerRef = contenedor;
    injectScopedStyles();
    renderBaseShell();
    await cargarDatosServidor();
  }

  function desmontar() {
    if (loaderInterval) clearInterval(loaderInterval);
    containerRef = null;
    baseDatos = [];
    datosFiltradosGlobal = [];
    const styleEl = document.getElementById('styles-monitor-obpp');
    if (styleEl) styleEl.remove();
  }

  /**
   * Inyecta estilos aislados bajo el scope #obpp-monitor-scope
   */
  function injectScopedStyles() {
    if (document.getElementById('styles-monitor-obpp')) return;
    const style = document.createElement('style');
    style.id = 'styles-monitor-obpp';
    style.innerHTML = `
      #obpp-monitor-scope {
        --obpp-bg-card: rgba(13, 20, 36, 0.95);
        --obpp-bg-card-hover: rgba(20, 32, 58, 0.98);
        --obpp-border: rgba(255, 255, 255, 0.1);
        --obpp-text: #f8fafc;
        --obpp-text-muted: #cbd5e1;
        --obpp-accent: #38bdf8;
        --obpp-amarillo: #FFCC00;
        --obpp-azul: #0066FF;
        --obpp-rojo: #CF142B;
        --obpp-alta: #ef4444;
        --obpp-media: #f59e0b;
        --obpp-baja: #10b981;
        --obpp-renov: #a855f7;
        position: relative;
        min-height: 100%;
        color: var(--obpp-text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: radial-gradient(circle at 10% 8%, rgba(255, 204, 0, 0.04) 0%, transparent 40%),
                    radial-gradient(circle at 90% 30%, rgba(0, 102, 255, 0.05) 0%, transparent 45%),
                    radial-gradient(circle at 20% 90%, rgba(207, 20, 43, 0.04) 0%, transparent 40%),
                    #090d18;
      }

      /* Loader Interno */
      #obppLoader,
      #obpp-loader {
        position: absolute;
        inset: 0;
        background: rgba(6, 9, 19, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        transition: opacity 0.25s ease;
      }
      #obppLoader.fade-out,
      #obpp-loader.fade-out {
        opacity: 0;
        pointer-events: none;
      }
      .obpp-ring-wrap {
        position: relative;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }
      .obpp-ring {
        position: absolute;
        border-radius: 50%;
        border: 3px solid transparent;
      }
      .obpp-ring-1 { width: 100%; height: 100%; border-top-color: var(--obpp-amarillo); border-left-color: var(--obpp-amarillo); animation: obppSpinRight 1.6s cubic-bezier(0.68,-0.55,0.27,1.55) infinite; }
      .obpp-ring-2 { width: 78%; height: 78%; border-right-color: var(--obpp-azul); border-bottom-color: var(--obpp-azul); animation: obppSpinLeft 1.3s linear infinite; }
      .obpp-ring-3 { width: 56%; height: 56%; border-top-color: var(--obpp-rojo); border-right-color: var(--obpp-rojo); animation: obppSpinRight 1s ease-in-out infinite; }
      @keyframes obppSpinRight { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes obppSpinLeft { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }

      .obpp-progress-container {
        width: 240px;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
        margin-top: 14px;
      }
      .obpp-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--obpp-amarillo), var(--obpp-azul), var(--obpp-rojo));
        border-radius: 4px;
        transition: width 0.25s ease-out;
      }

      /* Barra Superior */
      .obpp-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 14px;
        margin-bottom: 20px;
        padding: 16px 20px;
        background: var(--obpp-bg-card);
        border: 1px solid var(--obpp-border);
        border-radius: 14px;
        position: relative;
        overflow: visible;
        z-index: 50;
      }
      .obpp-top-bar::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, var(--obpp-amarillo) 0%, var(--obpp-azul) 50%, var(--obpp-rojo) 100%);
      }

      .obpp-btn-action {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--obpp-border);
        color: var(--obpp-text);
        padding: 8px 14px;
        border-radius: 9px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      .obpp-btn-action:hover {
        background: rgba(255, 255, 255, 0.16);
        transform: translateY(-1px);
      }
      .obpp-btn-primary {
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(37, 99, 235, 0.35));
        border-color: rgba(250, 204, 21, 0.55);
        color: #fef08a;
      }
      .obpp-btn-reset {
        background: rgba(239, 68, 68, 0.16);
        border-color: rgba(239, 68, 68, 0.4);
        color: #fecaca;
      }

      /* Dropdown Impresión */
      .obpp-dropdown { position: relative; display: inline-block; }
      .obpp-dropdown-content {
        display: none;
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        background: #0d1322;
        min-width: 220px;
        box-shadow: 0px 12px 35px rgba(0,0,0,0.85);
        border: 1px solid rgba(56, 189, 248, 0.5);
        border-radius: 10px;
        z-index: 1000;
        overflow: hidden;
      }
      .obpp-dropdown-content button {
        color: var(--obpp-text);
        padding: 11px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        border: none;
        background: none;
        text-align: left;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .obpp-dropdown-content button:hover {
        background: rgba(56, 189, 248, 0.25);
        color: var(--obpp-accent);
      }
      .obpp-dropdown-content.show { display: block; }

      /* Botones de Navegación */
      .obpp-nav-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
        gap: 10px;
        margin-bottom: 18px;
        position: relative;
        z-index: 1;
      }
      .obpp-nav-btn {
        background: var(--obpp-bg-card);
        border: 1px solid var(--obpp-border);
        color: var(--obpp-text);
        padding: 12px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        transition: transform 0.15s ease, background 0.15s ease;
        text-align: center;
      }
      .obpp-nav-btn:hover, .obpp-nav-btn.active {
        border-color: rgba(250, 204, 21, 0.6);
        background: var(--obpp-bg-card-hover);
        transform: translateY(-2px);
      }
      .obpp-nav-icon-box {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--obpp-amarillo);
      }
      .obpp-sub-val {
        font-size: 0.65rem;
        color: var(--obpp-accent);
        font-weight: 600;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Paneles Desplegables (Drawers) */
      .obpp-drawer {
        display: none;
        background: #0d1424;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 18px;
        position: relative;
        z-index: 20;
      }
      .obpp-drawer.show { display: block; }
      .obpp-drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--obpp-amarillo);
      }

      /* Filtros de Prioridad */
      .obpp-pills-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .obpp-pill {
        border: 1px solid var(--obpp-border);
        background: var(--obpp-bg-card);
        color: var(--obpp-text);
        padding: 7px 14px;
        border-radius: 20px;
        font-size: 0.74rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }
      .obpp-pill.active {
        border-color: #ffffff;
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      /* KPI Cards */
      .obpp-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .obpp-kpi-card {
        background: var(--obpp-bg-card);
        border: 1px solid var(--obpp-border);
        border-radius: 13px;
        padding: 14px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.15s ease;
      }
      .obpp-kpi-card:hover { transform: translateY(-3px); }
      .obpp-kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
      .obpp-kpi-total::before { background: var(--obpp-azul); }
      .obpp-kpi-alta::before { background: var(--obpp-alta); }
      .obpp-kpi-media::before { background: var(--obpp-media); }
      .obpp-kpi-baja::before { background: var(--obpp-baja); }
      .obpp-kpi-renov::before { background: var(--obpp-renov); }

      /* Chips SINCO */
      .obpp-sinco-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--obpp-border);
      }
      .obpp-sinco-chip {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--obpp-border);
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.73rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--obpp-text);
        transition: all 0.2s;
      }
      .obpp-sinco-chip:hover, .obpp-sinco-chip.active {
        border-color: var(--obpp-amarillo);
        background: rgba(250, 204, 21, 0.16);
        color: #fef08a;
      }

      /* Tabla y Tarjetas de Parroquias */
      .obpp-detailed-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
        text-align: left;
      }
      .obpp-detailed-table th, .obpp-detailed-table td {
        padding: 11px 13px;
        border-bottom: 1px solid var(--obpp-border);
      }
      .obpp-detailed-table th {
        background: rgba(15, 23, 42, 0.95);
        color: var(--obpp-amarillo);
      }
      .obpp-detailed-table tr:hover {
        background: rgba(255, 255, 255, 0.03);
        cursor: pointer;
      }
      .obpp-detailed-table tr.total-row {
        background: rgba(37, 99, 235, 0.22);
        font-weight: 800;
        border-top: 2px solid var(--obpp-accent);
      }

      .obpp-bar-item {
        background: rgba(9, 14, 26, 0.7);
        border: 1px solid var(--obpp-border);
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .obpp-bar-item:hover {
        background: rgba(37, 99, 235, 0.22);
        border-color: var(--obpp-accent);
      }

      /* Lista de Consejos Comunales */
      .obpp-cc-list { display: flex; flex-direction: column; gap: 10px; }
      .obpp-cc-item {
        background: rgba(9, 14, 26, 0.85);
        border: 1px solid var(--obpp-border);
        border-left: 5px solid var(--obpp-text-muted);
        border-radius: 10px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        transition: all 0.2s;
      }
      .obpp-cc-item:hover { background: rgba(20, 30, 52, 0.95); }
      .obpp-cc-item.prio-ALTA { border-left-color: var(--obpp-alta); }
      .obpp-cc-item.prio-MEDIA { border-left-color: var(--obpp-media); }
      .obpp-cc-item.prio-BAJA { border-left-color: var(--obpp-baja); }
      .obpp-cc-item.prio-RENOVADO { border-left-color: var(--obpp-renov); }

      .obpp-badge-status {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.03em;
      }
      .obpp-badge-ALTA { background: rgba(239, 68, 68, 0.22); color: #fecaca; border: 1px solid var(--obpp-alta); }
      .obpp-badge-MEDIA { background: rgba(245, 158, 11, 0.22); color: #fde68a; border: 1px solid var(--obpp-media); }
      .obpp-badge-BAJA { background: rgba(16, 185, 129, 0.22); color: #a7f3d0; border: 1px solid var(--obpp-baja); }
      .obpp-badge-RENOVADO { background: rgba(168, 85, 247, 0.25); color: #e9d5ff; border: 1px solid var(--obpp-renov); }
      .obpp-badge-SINCO { background: rgba(56, 189, 248, 0.18); color: #bae6fd; border: 1px solid rgba(56, 189, 248, 0.45); }

      /* Impresión */
      @media print {
        #obpp-monitor-scope .obpp-orb-bg,
        #obpp-monitor-scope #obpp-loader,
        #obpp-monitor-scope .obpp-top-bar,
        #obpp-monitor-scope .obpp-nav-grid,
        #obpp-monitor-scope .obpp-drawer,
        #obpp-monitor-scope .obpp-pills-row,
        #obpp-monitor-scope .obpp-kpi-grid,
        #obpp-monitor-scope .obpp-pagination-bar,
        #obpp-monitor-scope .btn-back-ios { display: none !important; }
        
        .obpp-print-header { display: block !important; margin-bottom: 20px; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Renderiza el esqueleto principal del monitor
   */
  function renderBaseShell() {
    if (!containerRef) return;

    containerRef.innerHTML = `
      <div id="obpp-monitor-scope">
        <!-- Loader Interno -->
        <div id="obppLoader">
          <div class="obpp-ring-wrap">
            <div class="obpp-ring obpp-ring-1"></div>
            <div class="obpp-ring obpp-ring-2"></div>
            <div class="obpp-ring obpp-ring-3"></div>
          </div>
          <div style="font-size:1.05rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#fff;" id="obppLoaderTitle">
            Sincronizando Sistema Central
          </div>
          <div style="font-size:0.8rem; color:var(--obpp-text-muted); margin-top:4px;" id="obppLoaderSub">
            Consultando registros de Consejos Comunales OBPP Monagas...
          </div>
          <div class="obpp-progress-container">
            <div id="obppProgressBarFill" class="obpp-progress-fill"></div>
          </div>
          <div id="obppProgressPercentage" style="font-size:0.75rem; color:var(--obpp-accent); font-weight:700; margin-top:6px;">0%</div>
        </div>

        <!-- Barra Superior con Botón Volver iOS -->
        <div class="obpp-top-bar">
          <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
            <button class="btn-back-ios" onclick="window.AppCore.showDashboardMenu()">
              <svg viewBox="0 0 24 24"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"/></svg>
              <span>Volver al Menú</span>
            </button>
            <div>
              <span style="font-size:0.75rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:var(--obpp-amarillo);">
                DIRECCIÓN DE COMUNAS &bull; SALA SITUACIONAL
              </span>
              <h2 style="font-size:1.45rem; font-weight:900; margin:2px 0 0; letter-spacing:-0.4px;">
                Monitor Dinámico OBPP Monagas
              </h2>
              <p style="font-size:0.75rem; color:var(--obpp-text-muted);" id="obppInfoSubtitulo">
                Sincronizando registros institucionales...
              </p>
            </div>
          </div>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <!-- Dropdown Impresión / PDF -->
            <div class="obpp-dropdown">
              <button class="obpp-btn-action" onclick="window.MonitorOBPP.togglePrintDropdown(event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM16 19H8V15H16V19ZM19 12C18.45 12 18 11.55 18 11C18 10.45 18.45 10 19 10C19.55 10 20 10.45 20 11C20 11.55 19.55 12 19 12ZM18 3H6V7H18V3Z"/></svg>
                <span>🖨️ Imprimir / PDF ▾</span>
              </button>
              <div id="obppPrintDropdown" class="obpp-dropdown-content">
                <button onclick="window.MonitorOBPP.ejecutarImpresion('consolidado')">📄 Solo Consolidado</button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('lista')">📋 Lista de Consejos Comunales</button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('ambos')">📑 Consolidado y Lista (Ambos)</button>
              </div>
            </div>

            <!-- Botón Registro / Editar (Restringido por Permiso de Escritura) -->
            <div id="obppActionRegWrap"></div>

            <button class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.limpiarFiltros()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/></svg>
              <span>Limpiar Filtros</span>
            </button>

            <button class="obpp-btn-action" onclick="window.MonitorOBPP.recargarServidor(true)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"/></svg>
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <!-- Encabezado exclusivo de Impresión -->
        <div class="obpp-print-header" id="obppPrintHeader" style="display:none; padding:16px; background:#0d1322; border-bottom:3px solid var(--obpp-amarillo); margin-bottom:16px;">
          <h2 style="font-size:14pt; color:#ffffff; margin-bottom:4px;" id="obppPrintTitle">REPORTE INSTITUCIONAL OBPP MONAGAS</h2>
          <span style="font-size:9pt; color:#cbd5e1;" id="obppPrintSub">Filtros Activos: Todos</span>
        </div>

        <!-- Botones de Navegación por Filtro Geográfico y Calendario -->
        <div class="obpp-nav-grid">
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerMunicipio')">
            <div class="obpp-nav-icon-box">🏛️</div>
            <span>Municipio</span>
            <span class="obpp-sub-val" id="obppLblMunicipio">TODOS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerParroquia')">
            <div class="obpp-nav-icon-box">📍</div>
            <span>Parroquia</span>
            <span class="obpp-sub-val" id="obppLblParroquia">TODAS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerComuna')">
            <div class="obpp-nav-icon-box">🏘️</div>
            <span>Comuna</span>
            <span class="obpp-sub-val" id="obppLblComuna">TODAS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerConsejo')">
            <div class="obpp-nav-icon-box">🔍</div>
            <span>Consejo Comunal</span>
            <span class="obpp-sub-val" id="obppLblConsejo">BUSCAR</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerCalendario')">
            <div class="obpp-nav-icon-box">📅</div>
            <span>Calendario Venc.</span>
            <span class="obpp-sub-val" id="obppLblCalendario">TODOS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.scrollResumen()">
            <div class="obpp-nav-icon-box">📊</div>
            <span>Resumen Condición</span>
            <span class="obpp-sub-val">PARROQUIAS</span>
          </button>
        </div>

        <!-- Drawers Desplegables -->
        <div id="obppDrawerMunicipio" class="obpp-drawer">
          <div class="obpp-drawer-header"><span>Filtrar por Municipio</span><button class="action-btn-sm" onclick="window.MonitorOBPP.cerrarDrawers()">✕</button></div>
          <select id="obppSelMunicipio" class="form-input" onchange="window.MonitorOBPP.aplicarFiltro('municipio', this.value)"></select>
        </div>

        <div id="obppDrawerParroquia" class="obpp-drawer">
          <div class="obpp-drawer-header"><span>Filtrar por Parroquia</span><button class="action-btn-sm" onclick="window.MonitorOBPP.cerrarDrawers()">✕</button></div>
          <select id="obppSelParroquia" class="form-input" onchange="window.MonitorOBPP.aplicarFiltro('parroquia', this.value)"></select>
        </div>

        <div id="obppDrawerComuna" class="obpp-drawer">
          <div class="obpp-drawer-header"><span>Filtrar por Comuna o Circuito Comunal</span><button class="action-btn-sm" onclick="window.MonitorOBPP.cerrarDrawers()">✕</button></div>
          <select id="obppSelComuna" class="form-input" onchange="window.MonitorOBPP.aplicarFiltro('comuna', this.value)"></select>
        </div>

        <div id="obppDrawerConsejo" class="obpp-drawer">
          <div class="obpp-drawer-header"><span>Buscar Consejo Comunal</span><button class="action-btn-sm" onclick="window.MonitorOBPP.cerrarDrawers()">✕</button></div>
          <input type="text" id="obppTxtBuscarCC" class="form-input" placeholder="Escriba nombre del consejo o SITUR..." oninput="window.MonitorOBPP.aplicarBusquedaCC(this.value)">
          <select id="obppSelConsejo" class="form-input" style="margin-top:8px;" onchange="window.MonitorOBPP.aplicarFiltro('consejo', this.value)"></select>
        </div>

        <div id="obppDrawerCalendario" class="obpp-drawer">
          <div class="obpp-drawer-header"><span>Filtro de Días por Vencer</span><button class="action-btn-sm" onclick="window.MonitorOBPP.cerrarDrawers()">✕</button></div>
          <label style="font-size:0.75rem; color:var(--obpp-text-muted); display:block; margin-bottom:4px;">Fecha Tope de Vencimiento:</label>
          <input type="date" id="obppInputFechaTope" class="form-input" onchange="window.MonitorOBPP.aplicarFiltroCalendario(this.value)">
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VENCIDOS')">🔴 Vencidos (≤ 0 días)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('30DIAS')">🟠 Críticos (1-30 días)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('90DIAS')">🟡 Próximos (31-90 días)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VIGENTES')">🟢 Vigentes (> 90 días)</button>
          </div>
        </div>

        <!-- Filtros de Prioridad / Condición -->
        <div class="obpp-pills-row">
          <button class="obpp-pill active" id="obppPillTODOS" onclick="window.MonitorOBPP.filtrarPrioridad('TODOS')">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#38bdf8;"></span>
            <span>Todos (<span id="obppCntTodos">0</span>)</span>
          </button>
          <button class="obpp-pill" id="obppPillALTA" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--obpp-alta);"></span>
            <span>Por Renovar (<span id="obppCntAlta">0</span>)</span>
          </button>
          <button class="obpp-pill" id="obppPillMEDIA" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--obpp-media);"></span>
            <span>Por Vencer (<span id="obppCntMedia">0</span>)</span>
          </button>
          <button class="obpp-pill" id="obppPillRENOV" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--obpp-renov);"></span>
            <span>Renovados (<span id="obppCntRenov">0</span>)</span>
          </button>
          <button class="obpp-pill" id="obppPillBAJA" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--obpp-baja);"></span>
            <span>Registrada (<span id="obppCntBaja">0</span>)</span>
          </button>
        </div>

        <!-- Tarjetas KPI -->
        <div class="obpp-kpi-grid">
          <div class="obpp-kpi-card obpp-kpi-total" onclick="window.MonitorOBPP.filtrarPrioridad('TODOS')">
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--obpp-text-muted); font-weight:700;">Total Selección</div>
            <div style="font-size:1.8rem; font-weight:900; margin:4px 0;" id="obppKpiTotal">0</div>
            <div style="font-size:0.7rem; color:var(--obpp-accent); font-weight:700;">100% activo</div>
          </div>
          <div class="obpp-kpi-card obpp-kpi-alta" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')">
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--obpp-text-muted); font-weight:700;">Por Renovar (Neto)</div>
            <div style="font-size:1.8rem; font-weight:900; margin:4px 0; color:var(--obpp-alta);" id="obppKpiAlta">0</div>
            <div style="font-size:0.7rem; color:#fca5a5; font-weight:600;" id="obppPctAlta">Crítico</div>
          </div>
          <div class="obpp-kpi-card obpp-kpi-media" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')">
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--obpp-text-muted); font-weight:700;">Por Vencer (Neto)</div>
            <div style="font-size:1.8rem; font-weight:900; margin:4px 0; color:var(--obpp-media);" id="obppKpiMedia">0</div>
            <div style="font-size:0.7rem; color:#fde68a; font-weight:600;" id="obppPctMedia">Alerta</div>
          </div>
          <div class="obpp-kpi-card obpp-kpi-renov" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')">
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--obpp-text-muted); font-weight:700;">Renovados</div>
            <div style="font-size:1.8rem; font-weight:900; margin:4px 0; color:var(--obpp-renov);" id="obppKpiRenov">0</div>
            <div style="font-size:0.7rem; color:#e9d5ff; font-weight:600;" id="obppPctRenov">En trámite</div>
          </div>
          <div class="obpp-kpi-card obpp-kpi-baja" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')">
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--obpp-text-muted); font-weight:700;">Vocería Registrada</div>
            <div style="font-size:1.8rem; font-weight:900; margin:4px 0; color:var(--obpp-baja);" id="obppKpiBaja">0</div>
            <div style="font-size:0.7rem; color:#6ee7b7; font-weight:600;" id="obppPctBaja">Vigentes</div>
          </div>
        </div>

        <!-- Sección de Resumen de Condición por Parroquias y Estatus SINCO -->
        <div id="obppSeccionResumen" class="glass-card" style="padding:20px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.8rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:var(--obpp-amarillo);">
                ESTATUS SINCO (PAPELERÍA)
              </span>
            </div>
          </div>
          <div id="obppContenedorSinco" class="obpp-sinco-strip"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.85rem; font-weight:800; color:var(--obpp-accent);" id="obppTituloDesglose">
              RESUMEN POR PARROQUIAS
            </span>
            <div style="display:flex; align-items:center; gap:10px;">
              <button class="action-btn-sm" onclick="window.MonitorOBPP.alternarVistaResumen()" id="obppBtnToggleView" style="background:rgba(56,189,248,0.15); color:var(--obpp-accent); border:1px solid rgba(56,189,248,0.3);">
                📊 Cambiar a Tarjetas
              </button>
              <span id="obppContadorParroquias" style="font-size:0.75rem; color:var(--obpp-amarillo); font-weight:700;">0</span>
            </div>
          </div>
          <div id="obppContenedorBarrasResumen"></div>
        </div>

        <!-- Listado de Consejos Comunales Paginado -->
        <div class="glass-card" style="padding:20px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 style="font-size:1.1rem; font-weight:800; margin:0;">Consejos Comunales Filtrados</h3>
            </div>
            <span id="obppContadorListaCC" style="font-size:0.78rem; color:var(--obpp-amarillo); font-weight:800;">0</span>
          </div>

          <!-- Barra de Paginación -->
          <div class="obpp-pagination-bar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:10px 14px; background:rgba(9, 14, 26, 0.75); border:1px solid var(--obpp-border); border-radius:10px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="action-btn-sm" id="obppBtnFirst" onclick="window.MonitorOBPP.cambiarPagina(1)">«</button>
              <button class="action-btn-sm" id="obppBtnPrev" onclick="window.MonitorOBPP.cambiarPagina(paginaActual - 1)">‹</button>
              <span id="obppInfoPagina" style="font-size:0.75rem; font-weight:700; padding:0 8px;">Página 1</span>
              <button class="action-btn-sm" id="obppBtnNext" onclick="window.MonitorOBPP.cambiarPagina(paginaActual + 1)">›</button>
              <button class="action-btn-sm" id="obppBtnLast" onclick="window.MonitorOBPP.cambiarPagina(totalPaginas)">»</button>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <label style="font-size:0.75rem; color:var(--obpp-text-muted);">Mostrar por página:</label>
              <select id="obppSelTamanoPagina" class="form-input" style="width:auto; padding:4px 10px; font-size:0.75rem;" onchange="window.MonitorOBPP.cambiarTamanoPagina(this.value)">
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="TODOS">Todos</option>
              </select>
            </div>
          </div>

          <!-- Contenedor de Tarjetas de Consejos Comunales -->
          <div id="obppListaConsejos" class="obpp-cc-list"></div>
        </div>

        <!-- Modal de Edición / Registro -->
        <div class="modal-backdrop" id="obppModalRegistro">
          <div class="modal-container" style="max-width:540px;">
            <div class="modal-header">
              <h3 class="modal-title" id="obppTituloModalReg">Actualizar Condición OBPP</h3>
              <button class="modal-close-btn" onclick="window.MonitorOBPP.cerrarModalRegistro()">&times;</button>
            </div>

            <div id="obppBloqueBuscadorModal" class="form-group">
              <label class="form-label">Buscar Consejo Comunal:</label>
              <input type="text" id="obppInputFiltroModalCC" class="form-input" placeholder="Filtrar..." oninput="window.MonitorOBPP.filtrarSelectModalCC(this.value)">
              <select id="obppSelModalCC" class="form-input" style="margin-top:6px;" onchange="window.MonitorOBPP.cargarDatosCCEnModal(this.value)"></select>
            </div>

            <form onsubmit="window.MonitorOBPP.guardarCambiosFormulario(event)">
              <input type="hidden" id="obppHidFilaSheet">
              <div class="form-group">
                <label class="form-label">Nombre del Consejo Comunal:</label>
                <input type="text" id="obppRegConsejo" class="form-input" required>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label class="form-label">Condición Actual:</label>
                  <select id="obppRegCondicion" class="form-input">
                    <option value="VOCERIA REGISTRADA">VOCERIA REGISTRADA</option>
                    <option value="VOCERIA POR VENCER">VOCERIA POR VENCER</option>
                    <option value="VOCERIA POR RENOVAR">VOCERIA POR RENOVAR</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estatus SINCO:</label>
                  <select id="obppRegEstatusSinco" class="form-input">
                    <option value="REGISTRADA">REGISTRADA</option>
                    <option value="VENCIDA">VENCIDA</option>
                    <option value="TERRITORIO">TERRITORIO</option>
                    <option value="EN CONSIGNACION">EN CONSIGNACION</option>
                    <option value="POR VALIDACION">POR VALIDACION</option>
                    <option value="EN REVICION">EN REVICION</option>
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label class="form-label">Renovados / Addendum:</label>
                  <select id="obppRegRenovado" class="form-input" onchange="window.MonitorOBPP.onRenovadoChange(this.value)">
                    <option value="">Sin marca</option>
                    <option value="Renovado">Renovado</option>
                    <option value="NUEVA CONFORMACION">NUEVA CONFORMACION</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">SITUR Actual:</label>
                  <input type="text" id="obppRegSitur" class="form-input">
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="action-btn-sm" style="background:var(--surface-glass-input); color:var(--text-main);" onclick="window.MonitorOBPP.cerrarModalRegistro()">Cancelar</button>
                <button type="submit" class="action-btn-sm action-btn-approve">Aplicar Cambios</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    updateActionRegButton();
  }

  function updateActionRegButton() {
    const wrap = document.getElementById('obppActionRegWrap');
    if (!wrap) return;

    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === "function"
      ? window.AppCore.canEditModule('obpp')
      : false;

    if (canEdit) {
      wrap.innerHTML = `
        <button class="obpp-btn-action obpp-btn-primary" onclick="window.MonitorOBPP.abrirModalRegistroGeneral()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/></svg>
          <span>Registro / Editar</span>
        </button>
      `;
    } else {
      wrap.innerHTML = `
        <span class="status-badge fecha" style="padding:6px 12px; background:rgba(255,204,0,0.12); color:var(--obpp-amarillo); border:1px solid rgba(255,204,0,0.3);">
          Modo Supervisión / Solo Lectura
        </span>
      `;
    }
  }

  function mostrarLoader(titulo, sub) {
    const lTitle = document.getElementById('obppLoaderTitle');
    const lSub = document.getElementById('obppLoaderSub');
    const loader = document.getElementById('obppLoader');
    if (lTitle) lTitle.innerText = titulo || 'Sincronizando Sistema Central';
    if (lSub) lSub.innerText = sub || 'Consultando registros...';
    if (loader) {
      loader.classList.remove('fade-out');
      loader.style.display = 'flex';
      loader.style.opacity = '1';
    }

    let progreso = 15;
    const fill = document.getElementById('obppProgressBarFill');
    const text = document.getElementById('obppProgressPercentage');
    if (fill) fill.style.width = progreso + '%';
    if (text) text.innerText = progreso + '%';

    if (loaderInterval) clearInterval(loaderInterval);
    loaderInterval = setInterval(() => {
      // Sube automáticamente hasta un máximo temporal (85-88%) mientras espera la respuesta
      if (progreso < 88) {
        progreso += Math.floor(Math.random() * 6) + 3;
        if (progreso > 88) progreso = 88;
        if (fill) fill.style.width = progreso + '%';
        if (text) text.innerText = progreso + '%';
      }
    }, 120);
  }

  function ocultarLoader(isSuccess = true, errorMsg = "") {
    if (loaderInterval) {
      clearInterval(loaderInterval);
      loaderInterval = null;
    }
    const loader = document.getElementById('obppLoader');
    const fill = document.getElementById('obppProgressBarFill');
    const text = document.getElementById('obppProgressPercentage');

    if (isSuccess) {
      // Salta de inmediato al 100% y desvanece suavemente el telón
      if (fill) fill.style.width = '100%';
      if (text) text.innerText = '100%';

      setTimeout(() => {
        if (loader) {
          loader.classList.add('fade-out');
          setTimeout(() => { loader.style.display = 'none'; }, 250);
        }
      }, 200);
    } else {
      // Detiene la animación de inmediato, quita el telón y muestra toast de alerta
      if (loader) {
        loader.classList.add('fade-out');
        loader.style.display = 'none';
      }
      if (errorMsg && window.AppCore && typeof window.AppCore.showToast === 'function') {
        window.AppCore.showToast(errorMsg, "danger");
      }
    }
  }

  async function sincronizarFondo(cacheKey, cacheTimeKey) {
    try {
      if (!window.AppCore || !window.AppCore.API_URL || !window.AppCore.API_URL.startsWith('http')) return;
      const resp = await fetch(`${window.AppCore.API_URL}?data=obpp&t=${Date.now()}`);
      const res = await resp.json();
      if (res && (res.status === 'ok' || res.ok) && res.registros) {
        baseDatos = res.registros;
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(baseDatos));
          sessionStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch(e) {}
        const sub = document.getElementById('obppInfoSubtitulo');
        if (sub) sub.innerText = `Registros Consolidados: ${res.totalRegistros || baseDatos.length}`;
        actualizarVista();
      }
    } catch(e) {
      console.warn("[MonitorOBPP] Revalidación en segundo plano omitida:", e);
    }
  }

  /**
   * Carga de datos desde el Servidor Central con manejo resiliente y caché ultra-rápida (SWR)
   */
  async function cargarDatosServidor(forzar = false) {
    const CACHE_KEY = 'OBPP_CACHE_REGISTROS_V2';
    const CACHE_TIME_KEY = 'OBPP_CACHE_TIME_V2';
    const ahora = Date.now();
    const tiempoMaximo = 10 * 60 * 1000; // 10 minutos de caché ultra-rápida

    if (!forzar) {
      try {
        const rawCache = sessionStorage.getItem(CACHE_KEY);
        const cacheTime = parseInt(sessionStorage.getItem(CACHE_TIME_KEY) || '0', 10);
        if (rawCache && (ahora - cacheTime) < tiempoMaximo) {
          const parsed = JSON.parse(rawCache);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            baseDatos = parsed;
            const sub = document.getElementById('obppInfoSubtitulo');
            if (sub) sub.innerText = `Registros Consolidados: ${baseDatos.length}`;
            poblarSelectoresCascada();
            actualizarVista();
            // Revalidación silenciosa en background sin bloquear la pantalla
            setTimeout(() => sincronizarFondo(CACHE_KEY, CACHE_TIME_KEY), 1000);
            return;
          }
        }
      } catch(e) {
        console.warn("[MonitorOBPP] Aviso leyendo caché local:", e);
      }
    }

    mostrarLoader('Cargando la Matriz', 'Sincronizando 1.370 registros en Servidor Central...');
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const urlFetch = `${window.AppCore.API_URL}?data=obpp${forzar ? '&nocache=1&t=' + ahora : ''}`;
        const resp = await fetch(urlFetch);
        const res = await resp.json();

        // Si el backend responde con error estructurado
        if (res && res.status === 'error') {
          const errDetalle = res.mensaje || res.error || "No se pudo leer el documento central.";
          ocultarLoader(false, "Servidor Central: " + errDetalle);
          return;
        }

        if (res && (res.status === 'ok' || res.ok) && res.registros) {
          ocultarLoader(true);
          baseDatos = res.registros;
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(baseDatos));
            sessionStorage.setItem(CACHE_TIME_KEY, ahora.toString());
          } catch(e) {}
          const sub = document.getElementById('obppInfoSubtitulo');
          if (sub) sub.innerText = `Registros Consolidados: ${res.totalRegistros || baseDatos.length}`;
          poblarSelectoresCascada();
          actualizarVista();
          return;
        }
      }
    } catch (e) {
      console.warn("[MonitorOBPP] Falla conectando al backend central:", e);
      ocultarLoader(false, "Error de sincronización con el Servidor Central: " + e.message);
      return;
    }

    ocultarLoader(true);
    // Datos de contingencia local institucional si la base de datos está vacía
    if (baseDatos.length === 0) {
      baseDatos = [
        { filaSheet: 2, num: "1", estado: "EDO. MONAGAS", municipio: "MATURIN", parroquia: "SAN SIMON", siturAnt: "SIT-01", siturAct: "01-14-01-001-0001", consejo: "CONSEJO COMUNAL CASCO CENTRAL", fechaReg: "2023-01-15", fechaVenc: "2025-01-15", estatusSinco: "REGISTRADA", dias: -650, diasTexto: "-650 días", condicion: "VOCERIA POR RENOVAR", renovado: "", condicionBase: "ALTA", prioridad: "ALTA", comuna: "COMUNA CORAZON DE JESUS" },
        { filaSheet: 3, num: "2", estado: "EDO. MONAGAS", municipio: "MATURIN", parroquia: "ALTO DE LOS GODOS", siturAnt: "SIT-02", siturAct: "01-14-01-002-0004", consejo: "CONSEJO COMUNAL LOS GODOS II", fechaReg: "2024-04-10", fechaVenc: "2026-04-10", estatusSinco: "TERRITORIO", dias: 520, diasTexto: "520 días", condicion: "VOCERIA REGISTRADA", renovado: "Renovado", condicionBase: "BAJA", prioridad: "RENOVADO", comuna: "COMUNA VENCEDORES DE GUANAGUANA" },
        { filaSheet: 4, num: "3", estado: "EDO. MONAGAS", municipio: "MATURIN", parroquia: "BOQUERON", siturAnt: "SIT-03", siturAct: "01-14-01-003-0008", consejo: "CONSEJO COMUNAL LA CACHERA", fechaReg: "2023-11-20", fechaVenc: "2025-11-20", estatusSinco: "VENCIDA", dias: 20, diasTexto: "20 días", condicion: "VOCERIA POR VENCER", renovado: "", condicionBase: "MEDIA", prioridad: "MEDIA", comuna: "COMUNA HEROES DE MONAGAS" },
        { filaSheet: 5, num: "4", estado: "EDO. MONAGAS", municipio: "MATURIN", parroquia: "LAS COCUIZAS", siturAnt: "SIT-04", siturAct: "01-14-01-004-0012", consejo: "CONSEJO COMUNAL SABANA GRANDE", fechaReg: "2024-08-05", fechaVenc: "2026-08-05", estatusSinco: "REGISTRADA", dias: 640, diasTexto: "640 días", condicion: "VOCERIA REGISTRADA", renovado: "", condicionBase: "BAJA", prioridad: "BAJA", comuna: "COMUNA SABANA VIVE" }
      ];
    }
    poblarSelectoresCascada();
    actualizarVista();
  }

  function togglePrintDropdown(e) {
    e.stopPropagation();
    const d = document.getElementById("obppPrintDropdown");
    if (d) d.classList.toggle("show");
  }

  function ejecutarImpresion(tipo) {
    const d = document.getElementById("obppPrintDropdown");
    if (d) d.classList.remove("show");

    let tituloUsuario = prompt("Título para el reporte institucional:", "REPORTE INSTITUCIONAL OBPP MONAGAS");
    if (tituloUsuario && tituloUsuario.trim()) {
      document.getElementById('obppPrintTitle').innerText = tituloUsuario.trim().toUpperCase();
    }

    const fMun = estadoFiltros.municipio !== 'TODOS' ? `Municipio: ${estadoFiltros.municipio}` : 'Todos los Municipios';
    const fParr = estadoFiltros.parroquia !== 'TODOS' ? ` | Parroquia: ${estadoFiltros.parroquia}` : '';
    const fPrio = estadoFiltros.prioridad !== 'TODOS' ? ` | Prioridad: ${estadoFiltros.prioridad}` : '';

    document.getElementById('obppPrintSub').innerText = `${fMun}${fParr}${fPrio} (Registros: ${datosFiltradosGlobal.length})`;
    window.print();
  }

  function alternarVistaResumen() {
    modoVistaTabla = !modoVistaTabla;
    const btn = document.getElementById('obppBtnToggleView');
    if (btn) btn.innerText = modoVistaTabla ? '📊 Cambiar a Tarjetas' : '🗂️ Cambiar a Tabla Detallada';
    renderizarResumenParroquias(datosFiltradosGlobal);
  }

  function abrirDrawer(id) {
    const d = document.getElementById(id);
    const isOpen = d && d.classList.contains('show');
    cerrarDrawers();
    if (d && !isOpen) d.classList.add('show');
  }

  function cerrarDrawers() {
    document.querySelectorAll('.obpp-drawer').forEach(p => p.classList.remove('show'));
  }

  function poblarSelectoresCascada() {
    const mun = [...new Set(baseDatos.map(r => r.municipio).filter(Boolean))].sort();
    llenarSelect('obppSelMunicipio', mun, estadoFiltros.municipio, 'TODOS LOS MUNICIPIOS');

    const dMun = estadoFiltros.municipio === 'TODOS' ? baseDatos : baseDatos.filter(r => r.municipio === estadoFiltros.municipio);
    const par = [...new Set(dMun.map(r => r.parroquia).filter(Boolean))].sort();
    llenarSelect('obppSelParroquia', par, estadoFiltros.parroquia, 'TODAS LAS PARROQUIAS');

    const dPar = estadoFiltros.parroquia === 'TODOS' ? dMun : dMun.filter(r => r.parroquia === estadoFiltros.parroquia);
    const com = [...new Set(dPar.map(r => r.comuna).filter(Boolean))].sort();
    llenarSelect('obppSelComuna', com, estadoFiltros.comuna, 'TODAS LAS COMUNAS');

    const con = [...new Set(dPar.map(r => r.consejo).filter(Boolean))].sort();
    llenarSelect('obppSelConsejo', con, estadoFiltros.consejo, 'TODOS LOS CONSEJOS');
  }

  function llenarSelect(id, opts, act, def) {
    const s = document.getElementById(id);
    if (!s) return;
    let html = `<option value="TODOS">${def} (${opts.length})</option>`;
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      html += `<option value="${o}" ${o === act ? 'selected' : ''}>${o}</option>`;
    }
    s.innerHTML = html;
  }

  function aplicarFiltro(campo, val) {
    estadoFiltros[campo] = val;
    if (campo === 'municipio') { estadoFiltros.parroquia = 'TODOS'; estadoFiltros.comuna = 'TODOS'; estadoFiltros.consejo = 'TODOS'; }
    else if (campo === 'parroquia') { estadoFiltros.comuna = 'TODOS'; estadoFiltros.consejo = 'TODOS'; }
    paginaActual = 1;
    poblarSelectoresCascada();
    actualizarEtiquetas();
    actualizarVista();
  }

  function filtrarSinco(est) {
    estadoFiltros.estatusSinco = (estadoFiltros.estatusSinco === est) ? 'TODOS' : est;
    paginaActual = 1;
    actualizarVista();
  }

  function aplicarBusquedaCC(txt) {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      estadoFiltros.busqueda = txt.trim().toUpperCase();
      paginaActual = 1;
      actualizarVista();
    }, 180);
  }

  function aplicarFiltroCalendario(f) {
    estadoFiltros.fechaTope = f;
    estadoFiltros.rangoDias = 'TODOS';
    paginaActual = 1;
    actualizarVista();
  }

  function aplicarRangoDias(r) {
    estadoFiltros.rangoDias = r;
    estadoFiltros.fechaTope = '';
    paginaActual = 1;
    actualizarVista();
  }

  function filtrarPrioridad(p) {
    estadoFiltros.prioridad = p;
    document.querySelectorAll('.obpp-pill').forEach(b => b.classList.remove('active'));
    const map = { TODOS: 'obppPillTODOS', ALTA: 'obppPillALTA', MEDIA: 'obppPillMEDIA', BAJA: 'obppPillBAJA', RENOVADO: 'obppPillRENOV' };
    if (map[p]) {
      const el = document.getElementById(map[p]);
      if (el) el.classList.add('active');
    }
    paginaActual = 1;
    actualizarVista();
  }

  function scrollResumen() {
    cerrarDrawers();
    const el = document.getElementById('obppSeccionResumen');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function limpiarFiltros() {
    estadoFiltros = {
      municipio: 'TODOS',
      parroquia: 'TODOS',
      comuna: 'TODOS',
      consejo: 'TODOS',
      estatusSinco: 'TODOS',
      busqueda: '',
      prioridad: 'TODOS',
      fechaTope: '',
      rangoDias: 'TODOS'
    };
    paginaActual = 1;
    cerrarDrawers();
    poblarSelectoresCascada();
    actualizarEtiquetas();
    filtrarPrioridad('TODOS');
  }

  function actualizarEtiquetas() {
    const lM = document.getElementById('obppLblMunicipio');
    const lP = document.getElementById('obppLblParroquia');
    const lC = document.getElementById('obppLblComuna');
    if (lM) lM.innerText = estadoFiltros.municipio;
    if (lP) lP.innerText = estadoFiltros.parroquia;
    if (lC) lC.innerText = estadoFiltros.comuna;
  }

  function actualizarVista() {
    const pre = [];
    const busq = estadoFiltros.busqueda;
    const mun = estadoFiltros.municipio;
    const par = estadoFiltros.parroquia;
    const com = estadoFiltros.comuna;
    const con = estadoFiltros.consejo;
    const sinco = estadoFiltros.estatusSinco;
    const fTope = estadoFiltros.fechaTope;
    const rDias = estadoFiltros.rangoDias;

    for (let i = 0; i < baseDatos.length; i++) {
      const r = baseDatos[i];
      if (mun !== 'TODOS' && r.municipio !== mun) continue;
      if (par !== 'TODOS' && r.parroquia !== par) continue;
      if (com !== 'TODOS' && r.comuna !== com) continue;
      if (con !== 'TODOS' && r.consejo !== con) continue;
      if (sinco !== 'TODOS' && r.estatusSinco !== sinco) continue;
      if (busq && !r.consejo.includes(busq) && !(r.siturAct || "").toUpperCase().includes(busq)) continue;
      if (fTope && (!r.fechaVenc || r.fechaVenc > fTope)) continue;
      if (rDias !== 'TODOS') {
        const d = r.dias;
        if (rDias === 'VENCIDOS' && (d === null || d > 0)) continue;
        if (rDias === '30DIAS' && (d === null || d <= 0 || d > 30)) continue;
        if (rDias === '90DIAS' && (d === null || d <= 30 || d > 90)) continue;
        if (rDias === 'VIGENTES' && (d === null || d <= 90)) continue;
      }
      pre.push(r);
    }

    // Estadísticas consolidada en una sola pasada O(N)
    let bAlta = 0, rAlta = 0, bMed = 0, rMed = 0, totalRenovados = 0, netoBaja = 0;
    for (let i = 0; i < pre.length; i++) {
      const r = pre[i];
      const isRenov = (r.prioridad === 'RENOVADO' || r.renovado);
      if (isRenov) totalRenovados++;

      if (r.condicionBase === 'ALTA') {
        bAlta++;
        if (isRenov) rAlta++;
      } else if (r.condicionBase === 'MEDIA') {
        bMed++;
        if (isRenov) rMed++;
      } else if (r.prioridad === 'BAJA') {
        netoBaja++;
      }
    }

    const netoAlta = bAlta - rAlta;
    const netoMedia = bMed - rMed;
    const totalNeto = netoAlta + netoMedia + totalRenovados + netoBaja;

    const cT = document.getElementById('obppCntTodos');
    const cA = document.getElementById('obppCntAlta');
    const cM = document.getElementById('obppCntMedia');
    const cR = document.getElementById('obppCntRenov');
    const cB = document.getElementById('obppCntBaja');
    if (cT) cT.innerText = totalNeto;
    if (cA) cA.innerText = netoAlta;
    if (cM) cM.innerText = netoMedia;
    if (cR) cR.innerText = totalRenovados;
    if (cB) cB.innerText = netoBaja;

    // Filtrado por prioridad seleccionada
    const prio = estadoFiltros.prioridad;
    if (prio === 'TODOS') {
      datosFiltradosGlobal = pre;
    } else if (prio === 'RENOVADO') {
      datosFiltradosGlobal = pre.filter(r => r.prioridad === 'RENOVADO' || r.renovado);
    } else {
      datosFiltradosGlobal = pre.filter(r => r.prioridad === prio);
    }

    const kT = document.getElementById('obppKpiTotal');
    const kA = document.getElementById('obppKpiAlta');
    const kM = document.getElementById('obppKpiMedia');
    const kR = document.getElementById('obppKpiRenov');
    const kB = document.getElementById('obppKpiBaja');
    if (kT) kT.innerText = datosFiltradosGlobal.length;
    if (kA) kA.innerText = netoAlta;
    if (kM) kM.innerText = netoMedia;
    if (kR) kR.innerText = totalRenovados;
    if (kB) kB.innerText = netoBaja;

    const pA = document.getElementById('obppPctAlta');
    const pM = document.getElementById('obppPctMedia');
    const pR = document.getElementById('obppPctRenov');
    const pB = document.getElementById('obppPctBaja');
    if (pA) pA.innerText = `Bruto: ${bAlta} − Renovados: ${rAlta}`;
    if (pM) pM.innerText = `Bruto: ${bMed} − Renovados: ${rMed}`;
    if (pR) pR.innerText = `${((totalRenovados / (totalNeto || 1)) * 100).toFixed(1)}% en trámite`;
    if (pB) pB.innerText = `${((netoBaja / (totalNeto || 1)) * 100).toFixed(1)}% solventes`;

    renderizarEstatusSinco(pre);
    renderizarResumenParroquias(datosFiltradosGlobal);
    renderizarListaPaginada();
  }

  function renderizarEstatusSinco(datos) {
    const cont = document.getElementById('obppContenedorSinco');
    if (!cont) return;
    const counts = {};
    for (let i = 0; i < datos.length; i++) {
      const e = datos[i].estatusSinco;
      counts[e] = (counts[e] || 0) + 1;
    }

    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    let html = '';
    for (let j = 0; j < entries.length; j++) {
      const [est, cnt] = entries[j];
      const activeClass = (estadoFiltros.estatusSinco === est) ? ' active' : '';
      html += `<button class="obpp-sinco-chip${activeClass}" onclick="window.MonitorOBPP.filtrarSinco('${est}')"><span>${est}: <strong>${cnt}</strong></span></button>`;
    }
    cont.innerHTML = html;
  }

  function renderizarResumenParroquias(datos) {
    const cont = document.getElementById('obppContenedorBarrasResumen');
    if (!cont) return;
    cont.innerHTML = '';
    const map = {};

    datos.forEach(r => {
      const k = estadoFiltros.municipio === 'TODOS' ? `${r.municipio} › ${r.parroquia}` : r.parroquia;
      if (!map[k]) map[k] = { mun: r.municipio, parr: r.parroquia, baja: 0, renov: 0, media: 0, alta: 0 };
      if (r.prioridad === 'BAJA') map[k].baja++;
      else if (r.prioridad === 'RENOVADO') map[k].renov++;
      else if (r.prioridad === 'MEDIA') map[k].media++;
      else if (r.prioridad === 'ALTA') map[k].alta++;
    });

    const arr = Object.entries(map).sort((a,b)=> (b[1].baja + b[1].renov + b[1].media + b[1].alta) - (a[1].baja + a[1].renov + a[1].media + a[1].alta));
    const cntEl = document.getElementById('obppContadorParroquias');
    if (cntEl) cntEl.innerText = `${arr.length} parroquias`;

    if (modoVistaTabla) {
      let sB = 0, sR = 0, sM = 0, sA = 0, sTot = 0;
      let html = `<div style="overflow-x:auto;"><table class="obpp-detailed-table">
        <thead><tr><th>Parroquia</th><th>Registrada</th><th>Renovada</th><th>Por Vencer</th><th>Por Renovar</th><th>Total CC</th></tr></thead><tbody>`;

      arr.forEach(([etiq, info]) => {
        const tot = info.baja + info.renov + info.media + info.alta;
        sB += info.baja; sR += info.renov; sM += info.media; sA += info.alta; sTot += tot;
        html += `<tr onclick="window.MonitorOBPP.aplicarFiltro('parroquia', '${info.parr}')">
          <td><strong>${etiq}</strong></td>
          <td style="color:#10b981;">${info.baja}</td>
          <td style="color:#a855f7;">${info.renov}</td>
          <td style="color:#f59e0b;">${info.media}</td>
          <td style="color:#ef4444;">${info.alta}</td>
          <td><strong>${tot}</strong></td>
        </tr>`;
      });

      html += `<tr class="total-row">
        <td><strong>TOTAL GENERAL</strong></td>
        <td style="color:#6ee7b7;">${sB}</td>
        <td style="color:#e9d5ff;">${sR}</td>
        <td style="color:#fde68a;">${sM}</td>
        <td style="color:#fca5a5;">${sA}</td>
        <td><strong>${sTot}</strong></td>
      </tr></tbody></table></div>`;
      cont.innerHTML = html;
    } else {
      let html = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">`;
      arr.forEach(([etiq, info]) => {
        const tot = (info.baja + info.renov + info.media + info.alta) || 1;
        html += `
          <div class="obpp-bar-item" onclick="window.MonitorOBPP.aplicarFiltro('parroquia', '${info.parr}')">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:5px;">
              <span style="font-weight:700; color:#fff;">${etiq}</span>
              <span style="color:var(--obpp-amarillo); font-weight:800;">${tot} CC</span>
            </div>
            <div style="height:7px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; display:flex;">
              <div style="background:var(--obpp-baja); width:${(info.baja/tot)*100}%;"></div>
              <div style="background:var(--obpp-renov); width:${(info.renov/tot)*100}%;"></div>
              <div style="background:var(--obpp-media); width:${(info.media/tot)*100}%;"></div>
              <div style="background:var(--obpp-alta); width:${(info.alta/tot)*100}%;"></div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      cont.innerHTML = html;
    }
  }

  function cambiarTamanoPagina(val) {
    tamanoPagina = val === 'TODOS' ? 999999 : parseInt(val, 10);
    paginaActual = 1;
    renderizarListaPaginada();
  }

  function cambiarPagina(p) {
    if (p < 1 || p > totalPaginas) return;
    paginaActual = p;
    renderizarListaPaginada();
  }

  function renderizarListaPaginada() {
    const cont = document.getElementById('obppListaConsejos');
    if (!cont) return;
    cont.innerHTML = '';

    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === "function"
      ? window.AppCore.canEditModule('obpp')
      : false;

    const total = datosFiltradosGlobal.length;
    totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const ini = (paginaActual - 1) * tamanoPagina;
    const fin = Math.min(ini + tamanoPagina, total);
    const lote = datosFiltradosGlobal.slice(ini, fin);

    const cEl = document.getElementById('obppContadorListaCC');
    const pEl = document.getElementById('obppInfoPagina');
    if (cEl) cEl.innerText = `${total > 0 ? ini + 1 : 0} - ${fin} de ${total}`;
    if (pEl) pEl.innerText = `Página ${paginaActual} de ${totalPaginas}`;

    const bF = document.getElementById('obppBtnFirst');
    const bP = document.getElementById('obppBtnPrev');
    const bN = document.getElementById('obppBtnNext');
    const bL = document.getElementById('obppBtnLast');
    if (bF) bF.disabled = (paginaActual <= 1);
    if (bP) bP.disabled = (paginaActual <= 1);
    if (bN) bN.disabled = (paginaActual >= totalPaginas);
    if (bL) bL.disabled = (paginaActual >= totalPaginas);

    if (lote.length === 0) {
      cont.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--obpp-text-muted); font-size: 0.9rem;">
          No se encontraron Consejos Comunales con los filtros aplicados.
        </div>
      `;
      return;
    }

    const htmlLote = lote.map(r => `
      <div class="obpp-cc-item prio-${r.prioridad}">
        <div style="flex:1; min-width:260px;">
          <h4 style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:4px;">${r.consejo}</h4>
          <div style="font-size:0.72rem; color:var(--obpp-text-muted); display:flex; flex-wrap:wrap; gap:10px;">
            <span>🏛️ ${r.municipio}</span>
            <span>📍 ${r.parroquia}</span>
            <span>🏘️ ${r.comuna}</span>
            <span>📅 Vence: <strong>${r.fechaVenc || 'S/F'}</strong></span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            <span class="obpp-badge-status obpp-badge-SINCO">${r.estatusSinco}</span>
            <span class="obpp-badge-status obpp-badge-${r.prioridad}">${r.condicion}</span>
          </div>
          ${canEdit ? `
            <button class="action-btn-sm action-btn-approve" onclick="window.MonitorOBPP.abrirModalEdicionFila(${r.filaSheet})">
              Editar Ficha
            </button>
          ` : `
            <span style="font-size:0.7rem; color:var(--text-dim); padding:2px 8px; background:rgba(255,255,255,0.04); border-radius:4px;">
              Solo Lectura
            </span>
          `}
        </div>
      </div>
    `).join('');

    cont.innerHTML = htmlLote;
  }

  function abrirModalRegistroGeneral() {
    const m = document.getElementById('obppModalRegistro');
    if (m) m.classList.add('open');
    filtrarSelectModalCC('');
  }

  function abrirModalEdicionFila(fila) {
    abrirModalRegistroGeneral();
    const sel = document.getElementById('obppSelModalCC');
    if (sel) {
      sel.value = fila;
      cargarDatosCCEnModal(fila);
    }
  }

  function cerrarModalRegistro() {
    const m = document.getElementById('obppModalRegistro');
    if (m) m.classList.remove('open');
  }

  function onRenovadoChange(val) {
    if (val === 'Renovado' || val === 'NUEVA CONFORMACION') {
      const e = document.getElementById('obppRegEstatusSinco');
      if (e) e.value = 'TERRITORIO';
    }
  }

  function filtrarSelectModalCC(txt) {
    const sel = document.getElementById('obppSelModalCC');
    if (!sel) return;
    const q = txt ? txt.toUpperCase().trim() : '';
    const filtrados = baseDatos.filter(r => !q || r.consejo.includes(q)).slice(0, 150);
    sel.innerHTML = filtrados.map(r => `<option value="${r.filaSheet}">${r.consejo} (${r.parroquia})</option>`).join('');
  }

  function cargarDatosCCEnModal(fila) {
    const reg = baseDatos.find(r => r.filaSheet == fila);
    if (!reg) return;
    document.getElementById('obppHidFilaSheet').value = reg.filaSheet;
    document.getElementById('obppRegConsejo').value = reg.consejo;
    document.getElementById('obppRegCondicion').value = reg.condicion;
    document.getElementById('obppRegEstatusSinco').value = reg.estatusSinco;
    document.getElementById('obppRegRenovado').value = reg.renovado || "";
    document.getElementById('obppRegSitur').value = reg.siturAct || "";
  }

  async function guardarCambiosFormulario(e) {
    if (e && e.preventDefault) e.preventDefault();
    const fila = document.getElementById('obppHidFilaSheet').value;
    const item = baseDatos.find(x => x.filaSheet == fila);

    const payload = {
      accion: "guardar_registro_obpp",
      modulo: "obpp",
      modo: "EDITAR",
      filaSheet: fila,
      consejo: document.getElementById('obppRegConsejo').value.trim(),
      condicion: document.getElementById('obppRegCondicion').value,
      estatusSinco: document.getElementById('obppRegEstatusSinco').value,
      renovado: document.getElementById('obppRegRenovado').value,
      siturAct: document.getElementById('obppRegSitur').value.trim()
    };

    cerrarModalRegistro();

    // Actualización optimista local
    if (item) {
      item.consejo = payload.consejo;
      item.condicion = payload.condicion;
      item.estatusSinco = payload.estatusSinco;
      item.renovado = payload.renovado;
      item.siturAct = payload.siturAct;
      if (item.renovado) item.prioridad = 'RENOVADO';
      actualizarVista();
    }

    if (window.AppCore) window.AppCore.showLoading("Sincronizando Sistema Central...");

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === "function") {
        await window.AppCore.updateRecord(payload);
        if (window.AppCore) {
          window.AppCore.hideLoading();
          window.AppCore.showToast(`Consejo Comunal actualizado con éxito en el Servidor Central.`, "success");
        }
      }
    } catch (err) {
      console.error("[MonitorOBPP] Error al sincronizar con el Servidor:", err);
      if (window.AppCore) {
        window.AppCore.hideLoading();
        window.AppCore.showToast("Error de sincronización con el Servidor Central.", "danger");
      }
    }
  }

  return {
    montar,
    desmontar,
    mount: montar,
    unmount: desmontar,
    recargarServidor: cargarDatosServidor,
    togglePrintDropdown,
    ejecutarImpresion,
    alternarVistaResumen,
    abrirDrawer,
    cerrarDrawers,
    aplicarFiltro,
    aplicarBusquedaCC,
    aplicarFiltroCalendario,
    aplicarRangoDias,
    filtrarPrioridad,
    scrollResumen,
    limpiarFiltros,
    cambiarTamanoPagina,
    cambiarPagina,
    abrirModalRegistroGeneral,
    abrirModalEdicionFila,
    cerrarModalRegistro,
    onRenovadoChange,
    filtrarSelectModalCC,
    cargarDatosCCEnModal,
    guardarCambiosFormulario
  };
})();
