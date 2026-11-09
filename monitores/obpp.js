/**
 * =========================================================================================
 * DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES DEL MUNICIPIO MATURÍN
 * SISTEMA CENTRAL DE GESTIÓN Y MONITOREO INSTITUCIONAL
 * MÓDULO ESPECIALIZADO: Monitor Dinámico OBPP Monagas (Consejos Comunales y Vocerías)
 * Archivo: monitores/obpp.js
 * Versión: 6.9.0 - Integración Completa Columnas A a la R (18 Campos Oficiales)
 * =========================================================================================
 */

window.MonitorOBPP = (function () {
  let containerRef = null;
  let baseDatos = [];
  let datosFiltradosGlobal = [];
  let paginaActual = 1;
  let tamanoPagina = 100;
  let totalPaginas = 1;
  let modoVistaTabla = true;
  let loaderInterval = null;
  let searchDebounceTimer = null;
  let modoModal = 'EDITAR';

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

  const SVG = {
    printer: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
    chevronDown: `<svg class="obpp-svg obpp-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    doc: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    list: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    layers: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    edit: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    reset: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    refresh: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    back: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    municipio: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"></line><line x1="6" y1="18" x2="6" y2="11"></line><line x1="10" y1="18" x2="10" y2="11"></line><line x1="14" y1="18" x2="14" y2="11"></line><line x1="18" y1="18" x2="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>`,
    parroquia: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    comuna: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    consejo: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    calendario: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    resumen: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    table: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
    cards: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    sinco: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
    close: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    check: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    cube: `<svg class="obpp-svg obpp-core-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`
  };

  async function montar(contenedor) {
    containerRef = contenedor;
    injectScopedStyles();
    renderBaseShell();
    await cargarDatosServidor();
  }

  function desmontar() {
    if (loaderInterval) clearInterval(loaderInterval);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    containerRef = null;
    baseDatos = [];
    datosFiltradosGlobal = [];
    const s = document.getElementById('styles-monitor-obpp');
    if (s) s.remove();
  }

  function injectScopedStyles() {
    if (document.getElementById('styles-monitor-obpp')) return;
    const style = document.createElement('style');
    style.id = 'styles-monitor-obpp';
    style.innerHTML = `
      #obpp-monitor-scope {
        --obpp-bg-base: #060913;
        --obpp-bg-card: rgba(13, 20, 36, 0.90);
        --obpp-bg-card-hover: rgba(22, 32, 54, 0.96);
        --obpp-bg-drawer: rgba(10, 15, 28, 0.98);
        --obpp-bg-item: rgba(9, 14, 26, 0.85);
        --obpp-bg-item-hover: rgba(20, 30, 52, 0.98);
        --obpp-border: rgba(255, 255, 255, 0.13);
        --obpp-border-active: rgba(250, 204, 21, 0.65);
        --obpp-text: #f8fafc;
        --obpp-text-muted: #cbd5e1;
        --obpp-text-dim: #94a3b8;
        --obpp-input-bg: rgba(6, 9, 19, 0.95);
        --obpp-input-border: rgba(255, 255, 255, 0.22);
        --obpp-accent: #38bdf8;
        --obpp-amarillo: #facc15;
        --obpp-amarillo-rgb: 250, 204, 21;
        --obpp-azul: #2563eb;
        --obpp-rojo: #ef4444;
        --obpp-alta: #ef4444;
        --obpp-media: #f59e0b;
        --obpp-baja: #10b981;
        --obpp-renov: #a855f7;
        --obpp-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
        --obpp-transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        position: relative; min-height: 100%; color: var(--obpp-text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
      }
      [data-theme="light"] #obpp-monitor-scope {
        --obpp-bg-base: #f8fafc; --obpp-bg-card: rgba(255, 255, 255, 0.95);
        --obpp-bg-card-hover: rgba(248, 250, 252, 0.98); --obpp-bg-drawer: rgba(255, 255, 255, 0.98);
        --obpp-bg-item: rgba(255, 255, 255, 0.92); --obpp-bg-item-hover: rgba(241, 245, 249, 0.98);
        --obpp-border: rgba(0, 36, 125, 0.12); --obpp-border-active: rgba(0, 102, 255, 0.6);
        --obpp-text: #0f172a; --obpp-text-muted: #475569; --obpp-text-dim: #64748b;
        --obpp-input-bg: #ffffff; --obpp-input-border: rgba(0, 36, 125, 0.22);
        --obpp-accent: #0284c7; --obpp-amarillo: #d97706; --obpp-azul: #00247D; --obpp-rojo: #dc2626;
        --obpp-shadow: 0 10px 30px rgba(0, 36, 125, 0.08);
      }
      .obpp-svg { width: 17px; height: 17px; flex-shrink: 0; vertical-align: middle; }
      .obpp-svg-xs { width: 12px; height: 12px; }
      .obpp-tricolor-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
      .obpp-orb { position: absolute; border-radius: 50%; filter: blur(95px); opacity: 0.45; }
      [data-theme="light"] .obpp-orb { opacity: 0.12; }
      .obpp-orb-amarillo { width: 430px; height: 430px; background: radial-gradient(circle, #facc15 0%, #ca8a04 100%); top: -8%; left: -6%; }
      .obpp-orb-azul { width: 490px; height: 490px; background: radial-gradient(circle, #2563eb 0%, #1e3a8a 100%); top: 25%; right: -10%; }
      .obpp-orb-rojo { width: 450px; height: 450px; background: radial-gradient(circle, #ef4444 0%, #991b1b 100%); bottom: -10%; left: 20%; }

      #obppLoader {
        position: fixed; inset: 0; background: rgba(6, 9, 19, 0.92); backdrop-filter: blur(20px);
        display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999;
        transition: opacity 0.3s ease;
      }
      #obppLoader.fade-out { opacity: 0; pointer-events: none; }
      .obpp-loader-circle-wrap { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
      .obpp-ring { position: absolute; border-radius: 50%; border: 3px solid transparent; }
      .obpp-ring-1 { width: 100%; height: 100%; border-top-color: var(--obpp-amarillo); border-left-color: var(--obpp-amarillo); animation: obppSpin 1.6s linear infinite; }
      .obpp-ring-2 { width: 78%; height: 78%; border-right-color: var(--obpp-azul); animation: obppSpinRev 1.3s linear infinite; }
      .obpp-ring-3 { width: 56%; height: 56%; border-top-color: var(--obpp-rojo); animation: obppSpin 1s linear infinite; }
      @keyframes obppSpin { 100% { transform: rotate(360deg); } }
      @keyframes obppSpinRev { 100% { transform: rotate(-360deg); } }
      .obpp-progress-container { width: 260px; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-top: 10px; }
      .obpp-progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--obpp-amarillo), var(--obpp-azul), var(--obpp-rojo)); transition: width 0.3s; }

      .obpp-top-bar {
        display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding: 14px 18px;
        background: var(--obpp-bg-card); backdrop-filter: blur(16px); border: 1px solid var(--obpp-border); border-radius: 14px; position: relative; z-index: 50; box-shadow: var(--obpp-shadow);
      }
      .obpp-top-bar::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--obpp-amarillo), var(--obpp-azul), var(--obpp-rojo)); }
      .obpp-brand { display: flex; align-items: center; gap: 12px; }
      .obpp-brand-badge { width: 42px; height: 42px; border-radius: 10px; background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      .obpp-brand h2 { font-size: 1.15rem; font-weight: 800; color: var(--obpp-text); margin: 0; }
      .obpp-brand p { font-size: 0.72rem; color: var(--obpp-text-muted); margin-top: 2px; }

      .obpp-btn-action {
        background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text);
        padding: 8px 13px; border-radius: 9px; font-size: 0.76rem; font-weight: 700; cursor: pointer;
        display: inline-flex; align-items: center; gap: 7px; transition: var(--obpp-transition);
      }
      .obpp-btn-action:hover { background: rgba(255, 255, 255, 0.16); transform: translateY(-1px); }
      .obpp-btn-atras { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.4); color: var(--obpp-accent); }
      .obpp-btn-primary { background: linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(37, 99, 235, 0.35)); border-color: rgba(250, 204, 21, 0.55); color: var(--obpp-amarillo); }
      .obpp-btn-reset { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }

      .obpp-dropdown { position: relative; display: inline-block; }
      .obpp-dropdown-content {
        display: none; position: absolute; right: 0; top: calc(100% + 8px); background: var(--obpp-bg-drawer);
        min-width: 230px; box-shadow: 0 14px 40px rgba(0,0,0,0.7); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; z-index: 1000; overflow: hidden;
      }
      .obpp-dropdown-content.show { display: block; }
      .obpp-dropdown-content button {
        color: var(--obpp-text); padding: 11px 14px; display: flex; align-items: center; gap: 9px; width: 100%; border: none; background: none; font-size: 0.76rem; font-weight: 700; cursor: pointer;
      }
      .obpp-dropdown-content button:hover { background: rgba(56, 189, 248, 0.2); color: var(--obpp-accent); }

      .obpp-nav-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 9px; margin-bottom: 16px; }
      .obpp-nav-btn {
        background: var(--obpp-bg-card); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 11px 8px; border-radius: 12px;
        font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: var(--obpp-transition); text-align: center;
      }
      .obpp-nav-btn:hover, .obpp-nav-btn.active { border-color: var(--obpp-border-active); background: var(--obpp-bg-card-hover); transform: translateY(-2px); }
      .obpp-sub-val { font-size: 0.64rem; color: var(--obpp-accent); font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .obpp-drawer-panel {
        display: none; background: var(--obpp-bg-drawer); border: 1px solid var(--obpp-border); border-radius: 13px; padding: 16px; margin-bottom: 16px; box-shadow: var(--obpp-shadow);
      }
      .obpp-drawer-panel.show { display: block; }
      .obpp-drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.82rem; font-weight: 700; color: var(--obpp-amarillo); }
      .obpp-close-drawer { background: rgba(255,255,255,0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); width: 28px; height: 28px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

      .obpp-filter-select, .obpp-search-input, .obpp-date-input {
        width: 100%; background: var(--obpp-input-bg); border: 1px solid var(--obpp-input-border); color: var(--obpp-text); padding: 9px 12px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 8px; outline: none;
      }
      .obpp-filter-select:focus, .obpp-search-input:focus, .obpp-date-input:focus { border-color: var(--obpp-amarillo); }

      .obpp-filters-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 14px; }
      .obpp-priority-filters { display: flex; flex-wrap: wrap; gap: 7px; }
      .obpp-pill-btn {
        border: 1px solid var(--obpp-border); background: var(--obpp-bg-card); color: var(--obpp-text); padding: 6px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: var(--obpp-transition);
      }
      .obpp-pill-btn.active { border-color: var(--obpp-text); background: rgba(255, 255, 255, 0.18); }
      .obpp-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .dot-todos { background: #38bdf8; } .dot-alta { background: var(--obpp-alta); } .dot-media { background: var(--obpp-media); } .dot-baja { background: var(--obpp-baja); } .dot-renov { background: var(--obpp-renov); }

      .obpp-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 11px; margin-bottom: 16px; }
      .obpp-kpi-card { background: var(--obpp-bg-card); border: 1px solid var(--obpp-border); border-radius: 13px; padding: 13px; position: relative; overflow: hidden; cursor: pointer; transition: var(--obpp-transition); box-shadow: var(--obpp-shadow); }
      .obpp-kpi-card:hover { transform: translateY(-3px); }
      .obpp-kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
      .kpi-total::before { background: var(--obpp-azul); } .kpi-alta::before { background: var(--obpp-alta); } .kpi-media::before { background: var(--obpp-media); } .kpi-baja::before { background: var(--obpp-baja); } .kpi-renov::before { background: var(--obpp-renov); }
      .obpp-kpi-num { font-size: 1.65rem; font-weight: 800; margin: 2px 0; font-variant-numeric: tabular-nums; }
      .obpp-kpi-title { font-size: 0.67rem; text-transform: uppercase; color: var(--obpp-text-muted); font-weight: 700; }

      .obpp-card-section { background: var(--obpp-bg-card); border: 1px solid var(--obpp-border); border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: var(--obpp-shadow); }
      .obpp-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; font-size: 0.82rem; font-weight: 700; }
      .obpp-sinco-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-sinco-chip { background: rgba(255, 255, 255, 0.06); border: 1px solid var(--obpp-border); border-radius: 8px; padding: 6px 11px; font-size: 0.71rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--obpp-text); }
      .obpp-sinco-chip.active { border-color: var(--obpp-amarillo); background: rgba(250, 204, 21, 0.16); color: var(--obpp-amarillo); }

      .obpp-table-view-container { width: 100%; overflow-x: auto; }
      .obpp-detailed-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; }
      .obpp-detailed-table th, .obpp-detailed-table td { padding: 10px 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-detailed-table th { background: rgba(15, 23, 42, 0.95); color: var(--obpp-amarillo); font-weight: 800; }
      .obpp-detailed-table tr:hover { background: rgba(255, 255, 255, 0.03); cursor: pointer; }
      .obpp-detailed-table tr.total-row { background: rgba(37, 99, 235, 0.18); font-weight: 800; border-top: 2px solid var(--obpp-accent); }

      .obpp-parroquias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; width: 100%; }
      .obpp-bar-item { background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); padding: 9px 12px; border-radius: 9px; cursor: pointer; }
      .obpp-bar-bg { height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; display: flex; margin-top: 6px; }
      .obpp-bar-seg-baja { background: var(--obpp-baja); height: 100%; }
      .obpp-bar-seg-renov { background: var(--obpp-renov); height: 100%; }
      .obpp-bar-seg-media { background: var(--obpp-media); height: 100%; }
      .obpp-bar-seg-alta { background: var(--obpp-alta); height: 100%; }

      .obpp-pagination-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 12px; background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-radius: 10px; margin-bottom: 12px; }
      .obpp-page-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 11px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; }
      .obpp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

      .obpp-cc-list { display: flex; flex-direction: column; gap: 9px; }
      .obpp-cc-item {
        background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-left: 5px solid var(--obpp-text-dim);
        border-radius: 10px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; transition: var(--obpp-transition);
      }
      .obpp-cc-item:hover { background: var(--obpp-bg-item-hover); transform: translateY(-1px); }
      .obpp-cc-item.prio-ALTA { border-left-color: var(--obpp-alta); }
      .obpp-cc-item.prio-MEDIA { border-left-color: var(--obpp-media); }
      .obpp-cc-item.prio-BAJA { border-left-color: var(--obpp-baja); }
      .obpp-cc-item.prio-RENOVADO { border-left-color: var(--obpp-renov); }

      .obpp-cc-info h4 { font-size: 0.88rem; font-weight: 700; color: var(--obpp-text); margin: 0 0 6px 0; }
      .obpp-cc-meta { font-size: 0.71rem; color: var(--obpp-text-muted); display: flex; flex-wrap: wrap; gap: 12px; }
      .obpp-meta-tag { display: inline-flex; align-items: center; gap: 5px; }

      .obpp-badge-row { display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end; margin-bottom: 6px; }
      .obpp-badge-status { padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; white-space: nowrap; }
      .obpp-badge-ALTA { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid var(--obpp-alta); }
      .obpp-badge-MEDIA { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid var(--obpp-media); }
      .obpp-badge-BAJA { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid var(--obpp-baja); }
      .obpp-badge-RENOVADO { background: rgba(168, 85, 247, 0.22); color: #e9d5ff; border: 1px solid var(--obpp-renov); }
      .obpp-badge-SINCO { background: rgba(56, 189, 248, 0.16); color: #bae6fd; border: 1px solid rgba(56, 189, 248, 0.45); }

      .obpp-btn-edit-card { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-amarillo); padding: 5px 11px; border-radius: 6px; font-size: 0.70rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
      .obpp-modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(6, 9, 19, 0.85); backdrop-filter: blur(12px); z-index: 5000; align-items: center; justify-content: center; padding: 16px; }
      .obpp-modal-backdrop.show { display: flex; }
      .obpp-modal-box { background: var(--obpp-bg-drawer); border: 1px solid rgba(250, 204, 21, 0.4); border-radius: 14px; width: 100%; max-width: 600px; padding: 22px; max-height: 92vh; overflow-y: auto; }
      .obpp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
      .obpp-form-group { display: flex; flex-direction: column; gap: 4px; }
      .obpp-form-group.full { grid-column: 1 / -1; }
      .obpp-form-group label { font-size: 0.72rem; color: var(--obpp-text-muted); font-weight: 700; }
    `;
    document.head.appendChild(style);
  }

  function renderBaseShell() {
    if (!containerRef) return;
    containerRef.innerHTML = `
      <div id="obpp-monitor-scope">
        <div class="obpp-tricolor-bg">
          <div class="obpp-orb obpp-orb-amarillo"></div>
          <div class="obpp-orb obpp-orb-azul"></div>
          <div class="obpp-orb obpp-orb-rojo"></div>
        </div>

        <div id="obppLoader">
          <div class="obpp-loader-circle-wrap">
            <div class="obpp-ring obpp-ring-1"></div>
            <div class="obpp-ring obpp-ring-2"></div>
            <div class="obpp-ring obpp-ring-3"></div>
            ${SVG.cube}
          </div>
          <div class="obpp-loader-title" id="obppLoaderTitle">Cargando la Matriz A-R</div>
          <div class="obpp-loader-sub" id="obppLoaderSub">Sincronizando 1.370 registros en vivo...</div>
          <div class="obpp-progress-container">
            <div id="obppProgressBarFill" class="obpp-progress-fill"></div>
          </div>
          <div id="obppProgressPercentage" style="font-size:0.75rem; color:var(--obpp-accent); margin-top:6px; font-weight:700;">0%</div>
        </div>

        <div class="obpp-top-bar">
          <div class="obpp-brand">
            <div class="obpp-brand-badge">${SVG.cube}</div>
            <div>
              <h2>MONITOR OFICIAL OBPP MONAGAS (1.370 CC)</h2>
              <p id="obppInfoSubtitulo">Lectura completa de Campos A al R &bull; Google Sheets</p>
            </div>
          </div>

          <div class="obpp-top-actions">
            <button class="obpp-btn-action obpp-btn-atras" onclick="window.AppCore && window.AppCore.showDashboardMenu ? window.AppCore.showDashboardMenu() : history.back()">
              ${SVG.back} <span>Atrás</span>
            </button>
            <div id="obppActionRegWrap"></div>
            <button class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.limpiarFiltros()">
              ${SVG.reset} <span>Limpiar Filtros</span>
            </button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.recargarServidor(true)">
              ${SVG.refresh} <span>Actualizar</span>
            </button>
          </div>
        </div>

        <div class="obpp-nav-buttons">
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerMunicipio')">
            <div class="obpp-nav-icon-box">${SVG.municipio}</div>
            <span>Municipio</span><span class="obpp-sub-val" id="obppLblMunicipio">TODOS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerParroquia')">
            <div class="obpp-nav-icon-box">${SVG.parroquia}</div>
            <span>Parroquia</span><span class="obpp-sub-val" id="obppLblParroquia">TODAS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerComuna')">
            <div class="obpp-nav-icon-box">${SVG.comuna}</div>
            <span>Comuna / Circuito</span><span class="obpp-sub-val" id="obppLblComuna">TODAS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerConsejo')">
            <div class="obpp-nav-icon-box">${SVG.consejo}</div>
            <span>Buscador General</span><span class="obpp-sub-val" id="obppLblConsejo">BUSCAR (A-R)</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerCalendario')">
            <div class="obpp-nav-icon-box">${SVG.calendario}</div>
            <span>Vencimiento</span><span class="obpp-sub-val" id="obppLblCalendario">TODOS LOS DÍAS</span>
          </button>
          <button class="obpp-nav-btn active" onclick="window.MonitorOBPP.scrollResumen()">
            <div class="obpp-nav-icon-box">${SVG.resumen}</div>
            <span>Resumen Parroquias</span><span class="obpp-sub-val">CONSOLIDADO</span>
          </button>
        </div>

        <div id="obppDrawerMunicipio" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Filtrar por Municipio (Columna C)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <select id="obppSelMunicipio" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('municipio', this.value)"></select>
        </div>

        <div id="obppDrawerParroquia" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Filtrar por Parroquia (Columna D)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <select id="obppSelParroquia" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('parroquia', this.value)"></select>
        </div>

        <div id="obppDrawerComuna" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Filtrar por Comuna o Circuito (Columna R)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <select id="obppSelComuna" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('comuna', this.value)"></select>
        </div>

        <div id="obppDrawerConsejo" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Búsqueda Inteligente (Nombre, SITUR, CNE o Comuna)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <input type="text" id="obppTxtBuscarCC" class="obpp-search-input" placeholder="Escriba nombre, SITUR, CNE o Comuna..." oninput="window.MonitorOBPP.aplicarBusquedaCC(this.value)">
          <select id="obppSelConsejo" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('consejo', this.value)"></select>
        </div>

        <div id="obppDrawerCalendario" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Filtro de Días por Vencer (Columna K)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <input type="date" id="obppInputFechaTope" class="obpp-date-input" onchange="window.MonitorOBPP.aplicarFiltroCalendario(this.value)">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-top:8px;">
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VENCIDOS')">Vencidos (≤ 0)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('30DIAS')">Críticos (1-30)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('90DIAS')">Próximos (31-90)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VIGENTES')">Vigentes (> 90)</button>
          </div>
        </div>

        <div class="obpp-filters-row">
          <div class="obpp-priority-filters">
            <button class="obpp-pill-btn active" id="obppPillTODOS" onclick="window.MonitorOBPP.filtrarPrioridad('TODOS')"><span class="obpp-status-dot dot-todos"></span><span>Todos (<span id="obppCntTodos">0</span>)</span></button>
            <button class="obpp-pill-btn" id="obppPillALTA" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')"><span class="obpp-status-dot dot-alta"></span><span>Por Renovar (<span id="obppCntAlta">0</span>)</span></button>
            <button class="obpp-pill-btn" id="obppPillMEDIA" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')"><span class="obpp-status-dot dot-media"></span><span>Por Vencer (<span id="obppCntMedia">0</span>)</span></button>
            <button class="obpp-pill-btn" id="obppPillRENOV" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')"><span class="obpp-status-dot dot-renov"></span><span>Renovados (<span id="obppCntRenov">0</span>)</span></button>
            <button class="obpp-pill-btn" id="obppPillBAJA" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')"><span class="obpp-status-dot dot-baja"></span><span>Registrada (<span id="obppCntBaja">0</span>)</span></button>
          </div>
        </div>

        <div class="obpp-kpi-grid">
          <div class="obpp-kpi-card kpi-total" onclick="window.MonitorOBPP.filtrarPrioridad('TODOS')">
            <div class="obpp-kpi-title">Total Consejos Comunales</div>
            <div class="obpp-kpi-num" id="obppKpiTotal">0</div>
          </div>
          <div class="obpp-kpi-card kpi-alta" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')">
            <div class="obpp-kpi-title">Por Renovar</div>
            <div class="obpp-kpi-num" id="obppKpiAlta" style="color:var(--obpp-alta);">0</div>
          </div>
          <div class="obpp-kpi-card kpi-media" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')">
            <div class="obpp-kpi-title">Por Vencer</div>
            <div class="obpp-kpi-num" id="obppKpiMedia" style="color:var(--obpp-media);">0</div>
          </div>
          <div class="obpp-kpi-card kpi-renov" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')">
            <div class="obpp-kpi-title">Renovados</div>
            <div class="obpp-kpi-num" id="obppKpiRenov" style="color:var(--obpp-renov);">0</div>
          </div>
          <div class="obpp-kpi-card kpi-baja" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')">
            <div class="obpp-kpi-title">Vocerías Registradas</div>
            <div class="obpp-kpi-num" id="obppKpiBaja" style="color:var(--obpp-baja);">0</div>
          </div>
        </div>

        <div id="obppSeccionResumen" class="obpp-card-section">
          <div class="obpp-section-head">
            <span>ESTATUS SINCO (COLUMNA J)</span>
          </div>
          <div id="obppContenedorSinco" class="obpp-sinco-strip"></div>

          <div class="obpp-section-head" style="margin-top:10px;">
            <span>RESUMEN CONSOLIDADO POR PARROQUIA (COLUMNA D)</span>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.alternarVistaResumen()" id="obppBtnToggleView">
              ${SVG.cards} <span>Cambiar a Tarjetas</span>
            </button>
          </div>
          <div id="obppContenedorBarrasResumen"></div>
        </div>

        <div id="obppSeccionListado" class="obpp-card-section">
          <div class="obpp-section-head">
            <span>CONSEJOS COMUNALES (DETALLE CAMPOS A - R)</span>
            <span id="obppContadorListaCC" style="font-size:0.75rem; color:var(--obpp-amarillo); font-weight:700;">0</span>
          </div>

          <div class="obpp-pagination-bar">
            <div style="display:flex; gap:6px;">
              <button class="obpp-page-btn" id="obppBtnFirst" onclick="window.MonitorOBPP.cambiarPagina(1)">&laquo; Primera</button>
              <button class="obpp-page-btn" id="obppBtnPrev" onclick="window.MonitorOBPP.cambiarPagina(paginaActual - 1)">&lsaquo; Anterior</button>
              <span id="obppInfoPagina" style="font-size:0.74rem; font-weight:700; padding:0 8px;">Página 1</span>
              <button class="obpp-page-btn" id="obppBtnNext" onclick="window.MonitorOBPP.cambiarPagina(paginaActual + 1)">Siguiente &rsaquo;</button>
              <button class="obpp-page-btn" id="obppBtnLast" onclick="window.MonitorOBPP.cambiarPagina(totalPaginas)">Última &raquo;</button>
            </div>
            <select id="obppSelTamanoPagina" class="obpp-filter-select" style="width:auto; margin:0;" onchange="window.MonitorOBPP.cambiarTamanoPagina(this.value)">
              <option value="50">50 por página</option>
              <option value="100" selected>100 por página</option>
              <option value="250">250 por página</option>
              <option value="TODOS">Ver Todos</option>
            </select>
          </div>

          <div id="obppListaConsejos" class="obpp-cc-list"></div>
        </div>

        <div id="obppModalRegistro" class="obpp-modal-backdrop">
          <div class="obpp-modal-box">
            <div class="obpp-drawer-header">
              <span id="obppTituloModalReg">ACTUALIZAR CONSEJO COMUNAL (CAMPOS A-R)</span>
              <button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarModalRegistro()">${SVG.close}</button>
            </div>

            <form onsubmit="window.MonitorOBPP.guardarCambiosFormulario(event)">
              <input type="hidden" id="obppHidFilaSheet">
              <div class="obpp-form-grid">
                <div class="obpp-form-group full">
                  <label>Nombre del Consejo Comunal (Columna G):</label>
                  <input type="text" id="obppRegConsejo" class="obpp-search-input" style="margin:0;" required>
                </div>
                <div class="obpp-form-group">
                  <label>Parroquia (Columna D):</label>
                  <input type="text" id="obppRegParroquia" class="obpp-search-input" style="margin:0;">
                </div>
                <div class="obpp-form-group">
                  <label>Comuna o Circuito (Columna R):</label>
                  <input type="text" id="obppRegComuna" class="obpp-search-input" style="margin:0;">
                </div>
                <div class="obpp-form-group">
                  <label>SITUR Actual (Columna F):</label>
                  <input type="text" id="obppRegSitur" class="obpp-search-input" style="margin:0;">
                </div>
                <div class="obpp-form-group">
                  <label>Fecha Vencimiento (Columna I):</label>
                  <input type="date" id="obppRegFechaVenc" class="obpp-date-input" style="margin:0;">
                </div>
                <div class="obpp-form-group">
                  <label>Condición (Columna L):</label>
                  <select id="obppRegCondicion" class="obpp-filter-select" style="margin:0;">
                    <option value="VOCERIA REGISTRADA">VOCERIA REGISTRADA</option>
                    <option value="VOCERIA POR VENCER">VOCERIA POR VENCER</option>
                    <option value="VOCERIA POR RENOVAR">VOCERIA POR RENOVAR</option>
                  </select>
                </div>
                <div class="obpp-form-group">
                  <label>Estatus SINCO (Columna J):</label>
                  <select id="obppRegEstatusSinco" class="obpp-filter-select" style="margin:0;">
                    <option value="REGISTRADA">REGISTRADA</option>
                    <option value="VENCIDA">VENCIDA</option>
                    <option value="TERRITORIO">TERRITORIO</option>
                    <option value="EN CONSIGNACION">EN CONSIGNACION</option>
                    <option value="POR VALIDACION">POR VALIDACION</option>
                    <option value="EN REVICION">EN REVICION</option>
                  </select>
                </div>
                <div class="obpp-form-group full">
                  <label>Renovados / Addendum (Columna M):</label>
                  <select id="obppRegRenovado" class="obpp-filter-select" style="margin:0;">
                    <option value="">Sin marca</option>
                    <option value="Renovado">Renovado</option>
                    <option value="NUEVA CONFORMACION">NUEVA CONFORMACION</option>
                  </select>
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.cerrarModalRegistro()">Cancelar</button>
                <button type="submit" class="obpp-btn-action obpp-btn-primary">${SVG.check} <span>Guardar en Google Sheets</span></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    actualizarBotonRegistroPermisos();
  }

  function actualizarBotonRegistroPermisos() {
    const wrap = document.getElementById('obppActionRegWrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <button class="obpp-btn-action obpp-btn-primary" onclick="window.MonitorOBPP.abrirModalRegistroGeneral()">
        ${SVG.edit} <span>Actualizar Fila</span>
      </button>
    `;
  }

  function mostrarLoader(titulo, sub) {
    const lTitle = document.getElementById('obppLoaderTitle');
    const lSub = document.getElementById('obppLoaderSub');
    const loader = document.getElementById('obppLoader');
    if (lTitle) lTitle.innerText = titulo || 'Cargando la Matriz';
    if (lSub) lSub.innerText = sub || 'Sincronizando 1.370 Consejos Comunales...';
    if (loader) {
      loader.classList.remove('fade-out');
      loader.style.display = 'flex';
    }

    let progreso = 15;
    const fill = document.getElementById('obppProgressBarFill');
    const text = document.getElementById('obppProgressPercentage');
    if (fill) fill.style.width = progreso + '%';
    if (text) text.innerText = progreso + '%';

    if (loaderInterval) clearInterval(loaderInterval);
    loaderInterval = setInterval(() => {
      if (progreso < 95) {
        progreso += Math.floor(Math.random() * 8) + 4;
        if (progreso > 95) progreso = 95;
        if (fill) fill.style.width = progreso + '%';
        if (text) text.innerText = progreso + '%';
      }
    }, 120);
  }

  function ocultarLoader() {
    if (loaderInterval) clearInterval(loaderInterval);
    const loader = document.getElementById('obppLoader');
    const fill = document.getElementById('obppProgressBarFill');
    const text = document.getElementById('obppProgressPercentage');
    if (fill) fill.style.width = '100%';
    if (text) text.innerText = '100%';
    setTimeout(() => {
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; }, 250);
      }
    }, 200);
  }

  async function cargarDatosServidor(forzar = false) {
    mostrarLoader('Cargando Columnas A a R', 'Conectando con el Google Sheets de Monagas...');
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const urlFetch = `${window.AppCore.API_URL}?data=obpp${forzar ? '&t=' + Date.now() : ''}`;
        const resp = await fetch(urlFetch);
        const res = await resp.json();

        if (res && res.registros && res.registros.length > 0) {
          ocultarLoader();
          baseDatos = res.registros;
          const sub = document.getElementById('obppInfoSubtitulo');
          if (sub) sub.innerText = `Pestaña: ${res.nombreHoja || 'MONAGAS_1370CC_OBPP'} | ${res.totalRegistros || baseDatos.length} Consejos Comunales`;
          poblarSelectoresCascada();
          actualizarVista();
          return;
        }
      }
    } catch (e) {
      console.warn("Falla de red:", e);
    }

    ocultarLoader();
    poblarSelectoresCascada();
    actualizarVista();
  }

  function alternarVistaResumen() {
    modoVistaTabla = !modoVistaTabla;
    const btn = document.getElementById('obppBtnToggleView');
    if (btn) {
      btn.innerHTML = modoVistaTabla
        ? `${SVG.cards} <span>Cambiar a Tarjetas</span>`
        : `${SVG.table} <span>Cambiar a Tabla Detallada</span>`;
    }
    renderizarResumenParroquias(datosFiltradosGlobal);
  }

  function abrirDrawer(id) {
    const d = document.getElementById(id);
    const isOpen = d && d.classList.contains('show');
    cerrarDrawers();
    if (d && !isOpen) d.classList.add('show');
  }

  function cerrarDrawers() {
    document.querySelectorAll('.obpp-drawer-panel').forEach(p => p.classList.remove('show'));
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
    if (campo === 'municipio') {
      estadoFiltros.parroquia = 'TODOS';
      estadoFiltros.comuna = 'TODOS';
      estadoFiltros.consejo = 'TODOS';
    } else if (campo === 'parroquia') {
      estadoFiltros.comuna = 'TODOS';
      estadoFiltros.consejo = 'TODOS';
    }
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
    }, 150);
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
    const inp = document.getElementById('obppInputFechaTope');
    if (inp) inp.value = '';
    paginaActual = 1;
    actualizarVista();
  }

  function filtrarPrioridad(p) {
    estadoFiltros.prioridad = p;
    document.querySelectorAll('.obpp-pill-btn').forEach(b => b.classList.remove('active'));
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
      municipio: 'TODOS', parroquia: 'TODOS', comuna: 'TODOS', consejo: 'TODOS',
      estatusSinco: 'TODOS', busqueda: '', prioridad: 'TODOS', fechaTope: '', rangoDias: 'TODOS'
    };
    const inpBusq = document.getElementById('obppTxtBuscarCC');
    const inpFecha = document.getElementById('obppInputFechaTope');
    if (inpBusq) inpBusq.value = '';
    if (inpFecha) inpFecha.value = '';
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

      // Búsqueda inteligente en múltiples columnas A-R
      if (busq) {
        const enConsejo = r.consejo && r.consejo.toUpperCase().includes(busq);
        const enSiturAct = r.siturAct && r.siturAct.toUpperCase().includes(busq);
        const enSiturAnt = r.siturAnt && r.siturAnt.toUpperCase().includes(busq);
        const enComuna = r.comuna && r.comuna.toUpperCase().includes(busq);
        const enCne = r.codCne && r.codCne.toUpperCase().includes(busq);
        if (!enConsejo && !enSiturAct && !enSiturAnt && !enComuna && !enCne) continue;
      }

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

    let bAlta = 0, bMed = 0, totalRenovados = 0, netoBaja = 0;
    for (let i = 0; i < pre.length; i++) {
      const r = pre[i];
      if (r.prioridad === 'RENOVADO' || r.renovado) totalRenovados++;
      else if (r.condicionBase === 'ALTA') bAlta++;
      else if (r.condicionBase === 'MEDIA') bMed++;
      else netoBaja++;
    }

    const cT = document.getElementById('obppCntTodos');
    const cA = document.getElementById('obppCntAlta');
    const cM = document.getElementById('obppCntMedia');
    const cR = document.getElementById('obppCntRenov');
    const cB = document.getElementById('obppCntBaja');
    if (cT) cT.innerText = pre.length;
    if (cA) cA.innerText = bAlta;
    if (cM) cM.innerText = bMed;
    if (cR) cR.innerText = totalRenovados;
    if (cB) cB.innerText = netoBaja;

    const prio = estadoFiltros.prioridad;
    if (prio === 'TODOS') datosFiltradosGlobal = pre;
    else if (prio === 'RENOVADO') datosFiltradosGlobal = pre.filter(r => r.prioridad === 'RENOVADO' || r.renovado);
    else datosFiltradosGlobal = pre.filter(r => r.prioridad === prio && !r.renovado);

    const kT = document.getElementById('obppKpiTotal');
    const kA = document.getElementById('obppKpiAlta');
    const kM = document.getElementById('obppKpiMedia');
    const kR = document.getElementById('obppKpiRenov');
    const kB = document.getElementById('obppKpiBaja');
    if (kT) kT.innerText = datosFiltradosGlobal.length;
    if (kA) kA.innerText = bAlta;
    if (kM) kM.innerText = bMed;
    if (kR) kR.innerText = totalRenovados;
    if (kB) kB.innerText = netoBaja;

    renderizarEstatusSinco(pre);
    renderizarResumenParroquias(datosFiltradosGlobal);
    renderizarListaPaginada();
  }

  function renderizarEstatusSinco(datos) {
    const cont = document.getElementById('obppContenedorSinco');
    if (!cont) return;
    const counts = {};
    for (let i = 0; i < datos.length; i++) {
      const e = datos[i].estatusSinco || 'SIN ESTATUS';
      counts[e] = (counts[e] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    let html = '';
    for (let j = 0; j < entries.length; j++) {
      const [est, cnt] = entries[j];
      const activeClass = (estadoFiltros.estatusSinco === est) ? ' active' : '';
      html += `<button type="button" class="obpp-sinco-chip${activeClass}" onclick="window.MonitorOBPP.filtrarSinco('${est}')"><span>${est}: <strong>${cnt}</strong></span></button>`;
    }
    cont.innerHTML = html;
  }

  function renderizarResumenParroquias(datos) {
    const cont = document.getElementById('obppContenedorBarrasResumen');
    if (!cont) return;
    cont.innerHTML = '';
    const map = {};

    datos.forEach(r => {
      const nomMun = r.municipio || 'MATURIN';
      const nomParr = r.parroquia || 'SIN PARROQUIA';
      const k = estadoFiltros.municipio === 'TODOS' ? `${nomMun} › ${nomParr}` : nomParr;
      if (!map[k]) map[k] = { mun: nomMun, parr: nomParr, baja: 0, renov: 0, media: 0, alta: 0 };
      if (r.prioridad === 'BAJA') map[k].baja++;
      else if (r.prioridad === 'RENOVADO' || r.renovado) map[k].renov++;
      else if (r.prioridad === 'MEDIA') map[k].media++;
      else if (r.prioridad === 'ALTA') map[k].alta++;
    });

    const arr = Object.entries(map).sort((a,b)=> (b[1].baja + b[1].renov + b[1].media + b[1].alta) - (a[1].baja + a[1].renov + a[1].media + a[1].alta));

    if (modoVistaTabla) {
      let sB = 0, sR = 0, sM = 0, sA = 0, sTot = 0;
      let html = `<div class="obpp-table-view-container"><table class="obpp-detailed-table">
        <thead><tr><th>Parroquia (Columna D)</th><th>Registrada</th><th>Renovada</th><th>Por Vencer</th><th>Por Renovar</th><th>Total CC</th></tr></thead><tbody>`;

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
      let html = `<div class="obpp-parroquias-grid">`;
      arr.forEach(([etiq, info]) => {
        const tot = (info.baja + info.renov + info.media + info.alta) || 1;
        html += `
          <div class="obpp-bar-item" onclick="window.MonitorOBPP.aplicarFiltro('parroquia', '${info.parr}')">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
              <span style="font-weight:700;">${etiq}</span>
              <span style="color:var(--obpp-amarillo); font-weight:800;">${tot} CC</span>
            </div>
            <div class="obpp-bar-bg">
              <div class="obpp-bar-seg-baja" style="width:${(info.baja/tot)*100}%;"></div>
              <div class="obpp-bar-seg-renov" style="width:${(info.renov/tot)*100}%;"></div>
              <div class="obpp-bar-seg-media" style="width:${(info.media/tot)*100}%;"></div>
              <div class="obpp-bar-seg-alta" style="width:${(info.alta/tot)*100}%;"></div>
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
      cont.innerHTML = `<div style="padding:30px; text-align:center; color:var(--obpp-text-muted);">No se encontraron Consejos Comunales.</div>`;
      return;
    }

    const htmlLote = lote.map(r => `
      <div class="obpp-cc-item prio-${r.prioridad}">
        <div class="obpp-cc-info">
          <h4>${r.consejo}</h4>
          <div class="obpp-cc-meta">
            <span class="obpp-meta-tag">${SVG.municipio} <span>${r.municipio}</span></span>
            <span class="obpp-meta-tag">${SVG.parroquia} <span>${r.parroquia}</span></span>
            <span class="obpp-meta-tag">${SVG.comuna} <span>${r.comuna || 'SIN COMUNA ASIGNADA'}</span></span>
            <span class="obpp-meta-tag">${SVG.calendario} <span>Vence: <strong>${r.fechaVenc || 'S/F'}</strong> (${r.diasTexto})</span></span>
            ${r.siturAct ? `<span class="obpp-meta-tag" style="color:var(--obpp-accent); font-family:monospace;">SITUR: ${r.siturAct}</span>` : ''}
            ${r.codCne ? `<span class="obpp-meta-tag" style="color:var(--obpp-amarillo); font-family:monospace;">CNE: ${r.codCne}</span>` : ''}
          </div>
        </div>
        <div>
          <div class="obpp-badge-row">
            <span class="obpp-badge-status obpp-badge-SINCO">${r.estatusSinco}</span>
            <span class="obpp-badge-status obpp-badge-${r.prioridad}">${r.condicion}</span>
          </div>
          <button class="obpp-btn-edit-card" onclick="window.MonitorOBPP.abrirModalEdicionFila(${r.filaSheet})">
            ${SVG.edit} <span>Editar</span>
          </button>
        </div>
      </div>
    `).join('');

    cont.innerHTML = htmlLote;
  }

  function abrirModalRegistroGeneral() {
    const m = document.getElementById('obppModalRegistro');
    if (m) m.classList.add('show');
  }

  function abrirModalEdicionFila(fila) {
    const reg = baseDatos.find(r => r.filaSheet == fila);
    if (!reg) return;
    abrirModalRegistroGeneral();
    document.getElementById('obppHidFilaSheet').value = reg.filaSheet;
    document.getElementById('obppRegConsejo').value = reg.consejo;
    document.getElementById('obppRegParroquia').value = reg.parroquia || "";
    document.getElementById('obppRegComuna').value = reg.comuna || "";
    document.getElementById('obppRegSitur').value = reg.siturAct || "";
    document.getElementById('obppRegFechaVenc').value = reg.fechaVenc || "";
    document.getElementById('obppRegCondicion').value = reg.condicion;
    document.getElementById('obppRegEstatusSinco').value = reg.estatusSinco;
    document.getElementById('obppRegRenovado').value = reg.renovado || "";
  }

  function cerrarModalRegistro() {
    const m = document.getElementById('obppModalRegistro');
    if (m) m.classList.remove('show');
  }

  async function guardarCambiosFormulario(e) {
    if (e && e.preventDefault) e.preventDefault();
    const fila = document.getElementById('obppHidFilaSheet').value;
    const consejoVal = document.getElementById('obppRegConsejo').value.trim();
    const parroquiaVal = document.getElementById('obppRegParroquia').value.trim();
    const comunaVal = document.getElementById('obppRegComuna').value.trim();
    const siturVal = document.getElementById('obppRegSitur').value.trim();
    const fVencVal = document.getElementById('obppRegFechaVenc').value;
    const condicionVal = document.getElementById('obppRegCondicion').value;
    const sincoVal = document.getElementById('obppRegEstatusSinco').value;
    const renovVal = document.getElementById('obppRegRenovado').value;

    const payload = {
      accion: "guardar_registro_obpp",
      modulo: "obpp",
      filaSheet: fila,
      consejo: consejoVal,
      parroquia: parroquiaVal,
      comuna: comunaVal,
      siturAct: siturVal,
      fechaVenc: fVencVal,
      condicion: condicionVal,
      estatusSinco: sincoVal,
      renovado: renovVal
    };

    cerrarModalRegistro();

    // Actualización inmediata en memoria local
    if (fila) {
      const item = baseDatos.find(x => x.filaSheet == fila);
      if (item) {
        item.consejo = consejoVal;
        item.parroquia = parroquiaVal;
        item.comuna = comunaVal;
        item.siturAct = siturVal;
        item.fechaVenc = fVencVal;
        item.condicion = condicionVal;
        item.estatusSinco = sincoVal;
        item.renovado = renovVal;
        item.prioridad = renovVal ? 'RENOVADO' : (condicionVal.includes('RENOVAR') ? 'ALTA' : (condicionVal.includes('POR VENCER') ? 'MEDIA' : 'BAJA'));
        actualizarVista();
      }
    }

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === "function") {
        await window.AppCore.updateRecord(payload);
      } else if (window.AppCore && window.AppCore.API_URL) {
        await fetch(window.AppCore.API_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.warn("Falla al guardar en Google Sheets:", err);
    }
  }

  return {
    montar, desmontar, mount: montar, unmount: desmontar,
    recargarServidor: cargarDatosServidor,
    alternarVistaResumen, abrirDrawer, cerrarDrawers, aplicarFiltro,
    aplicarBusquedaCC, aplicarFiltroCalendario, aplicarRangoDias,
    filtrarPrioridad, filtrarSinco, scrollResumen, limpiarFiltros,
    cambiarTamanoPagina, cambiarPagina, abrirModalRegistroGeneral,
    abrirModalEdicionFila, cerrarModalRegistro, guardarCambiosFormulario
  };
})();
