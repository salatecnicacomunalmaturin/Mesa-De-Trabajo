/**
 * =========================================================================================
 * DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES DEL MUNICIPIO MATURÍN
 * SISTEMA CENTRAL DE GESTIÓN Y MONITOREO INSTITUCIONAL
 * MÓDULO ESPECIALIZADO: Monitor Dinámico OBPP Monagas (Consejos Comunales y Vocerías)
 * Archivo: monitores/obpp.js
 * Versión: 6.8.1 - Sincronización Total con Backend Google Sheets 1370 CC
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

  let metasInstitucionales = {
    metaTotalMonagas: 1370,
    metaRenovacionPct: 100,
    metasPorParroquia: {}
  };

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
    search: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
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
    if (loaderInterval) {
      clearInterval(loaderInterval);
      loaderInterval = null;
    }
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    containerRef = null;
    baseDatos = [];
    datosFiltradosGlobal = [];
    const styleEl = document.getElementById('styles-monitor-obpp');
    if (styleEl) styleEl.remove();
  }

  function injectScopedStyles() {
    if (document.getElementById('styles-monitor-obpp')) return;
    const style = document.createElement('style');
    style.id = 'styles-monitor-obpp';
    style.innerHTML = `
      #obpp-monitor-scope {
        --obpp-bg-base: #060913;
        --obpp-bg-card: rgba(13, 20, 36, 0.88);
        --obpp-bg-card-hover: rgba(22, 32, 54, 0.95);
        --obpp-bg-drawer: rgba(10, 15, 28, 0.96);
        --obpp-bg-item: rgba(9, 14, 26, 0.82);
        --obpp-bg-item-hover: rgba(20, 30, 52, 0.96);
        --obpp-border: rgba(255, 255, 255, 0.13);
        --obpp-border-active: rgba(250, 204, 21, 0.6);
        --obpp-text: #f8fafc;
        --obpp-text-muted: #cbd5e1;
        --obpp-text-dim: #94a3b8;
        --obpp-input-bg: rgba(6, 9, 19, 0.92);
        --obpp-input-border: rgba(255, 255, 255, 0.2);
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
        --obpp-transition-ios: all 0.28s cubic-bezier(0.25, 1, 0.5, 1);
        position: relative;
        min-height: 100%;
        color: var(--obpp-text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
      }

      [data-theme="light"] #obpp-monitor-scope {
        --obpp-bg-base: #f8fafc;
        --obpp-bg-card: rgba(255, 255, 255, 0.94);
        --obpp-bg-card-hover: rgba(248, 250, 252, 0.98);
        --obpp-bg-drawer: rgba(255, 255, 255, 0.98);
        --obpp-bg-item: rgba(255, 255, 255, 0.92);
        --obpp-bg-item-hover: rgba(241, 245, 249, 0.98);
        --obpp-border: rgba(0, 36, 125, 0.12);
        --obpp-border-active: rgba(0, 102, 255, 0.6);
        --obpp-text: #0f172a;
        --obpp-text-muted: #475569;
        --obpp-text-dim: #64748b;
        --obpp-input-bg: #ffffff;
        --obpp-input-border: rgba(0, 36, 125, 0.22);
        --obpp-accent: #0284c7;
        --obpp-amarillo: #d97706;
        --obpp-amarillo-rgb: 217, 119, 6;
        --obpp-azul: #00247D;
        --obpp-rojo: #dc2626;
        --obpp-shadow: 0 10px 30px rgba(0, 36, 125, 0.08);
      }

      .obpp-svg { width: 17px; height: 17px; flex-shrink: 0; vertical-align: middle; }
      .obpp-svg-xs { width: 12px; height: 12px; }
      .obpp-svg-sm { width: 14px; height: 14px; }
      .obpp-svg-lg { width: 22px; height: 22px; }

      .obpp-tricolor-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
      .obpp-orb { position: absolute; border-radius: 50%; filter: blur(95px); opacity: 0.45; will-change: transform; }
      [data-theme="light"] .obpp-orb { opacity: 0.12; filter: blur(110px); }
      .obpp-orb-amarillo { width: 430px; height: 430px; background: radial-gradient(circle, #facc15 0%, #ca8a04 100%); top: -8%; left: -6%; animation: obppFloatAmarillo 14s ease-in-out infinite alternate; }
      .obpp-orb-azul { width: 490px; height: 490px; background: radial-gradient(circle, #2563eb 0%, #1e3a8a 100%); top: 25%; right: -10%; animation: obppFloatAzul 18s ease-in-out infinite alternate; }
      .obpp-orb-rojo { width: 450px; height: 450px; background: radial-gradient(circle, #ef4444 0%, #991b1b 100%); bottom: -10%; left: 20%; animation: obppFloatRojo 16s ease-in-out infinite alternate; }

      @keyframes obppFloatAmarillo { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(120px,80px) scale(1.12); } 100% { transform: translate(40px,160px) scale(0.95); } }
      @keyframes obppFloatAzul { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-140px,-60px) scale(1.15); } 100% { transform: translate(-60px,110px) scale(0.92); } }
      @keyframes obppFloatRojo { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(90px,-110px) scale(1.1); } 100% { transform: translate(-80px,-40px) scale(1.05); } }

      #obppLoader {
        position: fixed; inset: 0; background: rgba(6, 9, 19, 0.90);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        z-index: 9999; transition: opacity 0.35s ease, transform 0.35s ease;
      }
      [data-theme="light"] #obppLoader { background: rgba(248, 250, 252, 0.92); }
      #obppLoader.fade-out { opacity: 0; transform: scale(1.08); pointer-events: none; }
      .obpp-loader-circle-wrap { position: relative; width: 105px; height: 105px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
      .obpp-ring { position: absolute; border-radius: 50%; border: 3px solid transparent; }
      .obpp-ring-1 { width: 100%; height: 100%; border-top-color: var(--obpp-amarillo); border-left-color: var(--obpp-amarillo); animation: obppSpinRight 1.6s cubic-bezier(0.68,-0.55,0.27,1.55) infinite; }
      .obpp-ring-2 { width: 78%; height: 78%; border-right-color: var(--obpp-azul); border-bottom-color: var(--obpp-azul); animation: obppSpinLeft 1.3s linear infinite; }
      .obpp-ring-3 { width: 56%; height: 56%; border-top-color: var(--obpp-rojo); border-right-color: var(--obpp-rojo); animation: obppSpinRight 1s ease-in-out infinite; }
      .obpp-core-svg { width: 24px; height: 24px; color: var(--obpp-text); animation: obppPulseCore 1.5s ease-in-out infinite; }

      @keyframes obppSpinRight { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes obppSpinLeft { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
      @keyframes obppPulseCore { 0%, 100% { transform: scale(0.9); opacity: 0.75; } 50% { transform: scale(1.15); opacity: 1; } }

      .obpp-loader-title { font-size: 1.05rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--obpp-text); margin-bottom: 6px; }
      .obpp-loader-sub { font-size: 0.78rem; color: var(--obpp-text-muted); margin-bottom: 14px; }
      .obpp-progress-container { width: 260px; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.15); }
      [data-theme="light"] .obpp-progress-container { background: rgba(0, 36, 125, 0.08); border-color: rgba(0, 36, 125, 0.15); }
      .obpp-progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--obpp-amarillo), var(--obpp-azul), var(--obpp-rojo)); border-radius: 4px; transition: width 0.35s ease-out; }
      .obpp-progress-pct { font-size: 0.72rem; color: var(--obpp-accent); font-weight: 700; margin-top: 6px; letter-spacing: 0.05em; }

      .obpp-top-bar {
        display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding: 14px 18px;
        background: var(--obpp-bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--obpp-border); border-radius: 14px; position: relative; z-index: 50; box-shadow: var(--obpp-shadow);
      }
      .obpp-top-bar::after {
        content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px;
        background: linear-gradient(90deg, var(--obpp-amarillo) 0%, var(--obpp-azul) 50%, var(--obpp-rojo) 100%);
        border-bottom-left-radius: 14px; border-bottom-right-radius: 14px;
      }
      .obpp-brand { display: flex; align-items: center; gap: 12px; }
      .obpp-brand-badge { width: 42px; height: 42px; border-radius: 10px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--obpp-border); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      [data-theme="light"] .obpp-brand-badge { background: rgba(0, 36, 125, 0.05); }
      .obpp-brand h2 { font-size: 1.15rem; font-weight: 800; color: var(--obpp-text); margin: 0; }
      .obpp-brand p { font-size: 0.72rem; color: var(--obpp-text-muted); margin-top: 2px; }
      .obpp-top-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

      .obpp-btn-action {
        background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text);
        padding: 8px 13px; border-radius: 9px; font-size: 0.76rem; font-weight: 700; cursor: pointer;
        display: inline-flex; align-items: center; gap: 7px; transition: var(--obpp-transition-ios); text-decoration: none;
      }
      [data-theme="light"] .obpp-btn-action { background: rgba(0, 36, 125, 0.05); }
      .obpp-btn-action:hover { background: rgba(255, 255, 255, 0.16); transform: translateY(-1px); }
      .obpp-btn-action:active { transform: scale(0.97); }
      .obpp-btn-atras { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.4); color: var(--obpp-accent); }
      .obpp-btn-atras:hover { background: rgba(56, 189, 248, 0.25); color: #ffffff; }
      .obpp-btn-primary { background: linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(37, 99, 235, 0.35)); border-color: rgba(250, 204, 21, 0.55); color: var(--obpp-amarillo); }
      .obpp-btn-reset { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
      [data-theme="light"] .obpp-btn-reset { color: #dc2626; }

      .obpp-dropdown { position: relative; display: inline-block; }
      .obpp-dropdown-content {
        display: none; position: absolute; right: 0; top: calc(100% + 8px); background: var(--obpp-bg-drawer);
        min-width: 230px; box-shadow: 0 14px 40px rgba(0,0,0,0.7); border: 1px solid rgba(56, 189, 248, 0.4);
        border-radius: 12px; z-index: 1000; overflow: hidden; animation: obppIosSlideDown 0.2s ease-out;
      }
      .obpp-dropdown-content.show { display: block; }
      .obpp-dropdown-content button {
        color: var(--obpp-text); padding: 11px 14px; display: flex; align-items: center; gap: 9px; width: 100%;
        border: none; background: none; text-align: left; font-size: 0.76rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease;
      }
      .obpp-dropdown-content button:hover { background: rgba(56, 189, 248, 0.2); color: var(--obpp-accent); }

      .obpp-nav-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 9px; margin-bottom: 16px; z-index: 1; position: relative; }
      .obpp-nav-btn {
        background: var(--obpp-bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 11px 8px; border-radius: 12px;
        font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center;
        gap: 5px; transition: var(--obpp-transition-ios); text-align: center; box-shadow: var(--obpp-shadow);
      }
      .obpp-nav-btn:hover, .obpp-nav-btn.active { border-color: var(--obpp-border-active); background: var(--obpp-bg-card-hover); transform: translateY(-2px); }
      .obpp-nav-btn:active { transform: scale(0.96); }
      .obpp-nav-icon-box { width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      [data-theme="light"] .obpp-nav-icon-box { background: rgba(0, 36, 125, 0.05); }
      .obpp-sub-val { font-size: 0.64rem; color: var(--obpp-accent); font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .obpp-drawer-panel {
        display: none; background: var(--obpp-bg-drawer); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--obpp-border); border-radius: 13px; padding: 16px; margin-bottom: 16px; position: relative;
        z-index: 20; box-shadow: var(--obpp-shadow); animation: obppIosSlideDown 0.25s cubic-bezier(0.25, 1, 0.5, 1);
      }
      .obpp-drawer-panel.show { display: block; }
      @keyframes obppIosSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

      .obpp-drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.82rem; font-weight: 700; color: var(--obpp-amarillo); }
      .obpp-close-drawer { background: rgba(255,255,255,0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); width: 28px; height: 28px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--obpp-transition-ios); }
      .obpp-close-drawer:hover { background: rgba(255,255,255,0.18); }

      .obpp-filter-select, .obpp-search-input, .obpp-date-input {
        width: 100%; background: var(--obpp-input-bg); border: 1px solid var(--obpp-input-border);
        color: var(--obpp-text); padding: 9px 12px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 8px; outline: none; transition: border-color 0.2s ease;
      }
      .obpp-filter-select:focus, .obpp-search-input:focus, .obpp-date-input:focus { border-color: var(--obpp-amarillo); }
      .obpp-quick-days-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: 10px; }

      .obpp-filters-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 14px; }
      .obpp-priority-filters { display: flex; flex-wrap: wrap; gap: 7px; }
      .obpp-pill-btn {
        border: 1px solid var(--obpp-border); background: var(--obpp-bg-card); color: var(--obpp-text);
        padding: 6px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px; transition: var(--obpp-transition-ios);
      }
      .obpp-pill-btn:hover { background: var(--obpp-bg-card-hover); transform: translateY(-1px); }
      .obpp-pill-btn:active { transform: scale(0.96); }
      .obpp-pill-btn.active { border-color: var(--obpp-text); background: rgba(255, 255, 255, 0.18); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
      [data-theme="light"] .obpp-pill-btn.active { border-color: var(--obpp-azul); background: rgba(0, 36, 125, 0.1); }

      .obpp-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      .dot-todos { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
      .dot-alta { background: var(--obpp-alta); box-shadow: 0 0 8px var(--obpp-alta); }
      .dot-media { background: var(--obpp-media); box-shadow: 0 0 8px var(--obpp-media); }
      .dot-baja { background: var(--obpp-baja); box-shadow: 0 0 8px var(--obpp-baja); }
      .dot-renov { background: var(--obpp-renov); box-shadow: 0 0 8px var(--obpp-renov); }

      .obpp-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 11px; margin-bottom: 16px; }
      .obpp-kpi-card {
        background: var(--obpp-bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--obpp-border); border-radius: 13px; padding: 13px; position: relative; overflow: hidden;
        cursor: pointer; transition: var(--obpp-transition-ios); box-shadow: var(--obpp-shadow);
      }
      .obpp-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 16px 36px rgba(0,0,0,0.45); }
      .obpp-kpi-card:active { transform: scale(0.97); }
      .obpp-kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
      .kpi-total::before { background: var(--obpp-azul); }
      .kpi-alta::before { background: var(--obpp-alta); }
      .kpi-media::before { background: var(--obpp-media); }
      .kpi-baja::before { background: var(--obpp-baja); }
      .kpi-renov::before { background: var(--obpp-renov); }

      .obpp-kpi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .obpp-kpi-title { font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--obpp-text-muted); font-weight: 700; }
      .obpp-kpi-num { font-size: 1.65rem; font-weight: 800; margin: 2px 0; font-variant-numeric: tabular-nums; }
      .obpp-kpi-foot { font-size: 0.66rem; font-weight: 600; line-height: 1.3; }

      .obpp-card-section {
        background: var(--obpp-bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--obpp-border); border-radius: 14px; padding: 16px; margin-bottom: 16px;
        position: relative; z-index: 1; box-shadow: var(--obpp-shadow);
      }
      .obpp-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; font-size: 0.82rem; font-weight: 700; }
      .obpp-section-head-title { display: flex; align-items: center; gap: 8px; }

      .obpp-sinco-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-sinco-chip {
        background: rgba(255, 255, 255, 0.06); border: 1px solid var(--obpp-border); border-radius: 8px;
        padding: 6px 11px; font-size: 0.71rem; font-weight: 700; cursor: pointer; display: flex; align-items: center;
        gap: 6px; color: var(--obpp-text); transition: var(--obpp-transition-ios);
      }
      [data-theme="light"] .obpp-sinco-chip { background: rgba(0, 36, 125, 0.04); }
      .obpp-sinco-chip:hover, .obpp-sinco-chip.active { border-color: var(--obpp-amarillo); background: rgba(var(--obpp-amarillo-rgb), 0.16); color: var(--obpp-amarillo); }

      .obpp-view-toggle-btn {
        background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: var(--obpp-accent);
        padding: 5px 12px; border-radius: 7px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px; transition: var(--obpp-transition-ios);
      }
      .obpp-view-toggle-btn:hover { background: rgba(56, 189, 248, 0.25); }

      .obpp-table-view-container { width: 100%; overflow-x: auto; }
      .obpp-detailed-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; }
      .obpp-detailed-table th, .obpp-detailed-table td { padding: 10px 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-detailed-table th { background: rgba(15, 23, 42, 0.95); color: var(--obpp-amarillo); font-weight: 800; }
      [data-theme="light"] .obpp-detailed-table th { background: rgba(0, 36, 125, 0.06); color: var(--obpp-azul); }
      .obpp-detailed-table tr:hover { background: rgba(255, 255, 255, 0.03); cursor: pointer; }
      [data-theme="light"] .obpp-detailed-table tr:hover { background: rgba(0, 36, 125, 0.03); }
      .obpp-detailed-table tr.total-row { background: rgba(37, 99, 235, 0.18); font-weight: 800; border-top: 2px solid var(--obpp-accent); }

      .obpp-parroquias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; width: 100%; }
      .obpp-bar-item { background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); padding: 9px 12px; border-radius: 9px; cursor: pointer; transition: var(--obpp-transition-ios); }
      .obpp-bar-item:hover, .obpp-bar-item.selected-parr { background: rgba(37, 99, 235, 0.18); border-color: var(--obpp-accent); transform: translateY(-1px); }
      .obpp-bar-top { display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 5px; gap: 6px; }
      .obpp-bar-bg { height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; display: flex; }
      [data-theme="light"] .obpp-bar-bg { background: rgba(0, 36, 125, 0.08); }
      .obpp-bar-seg-baja { background: var(--obpp-baja); height: 100%; }
      .obpp-bar-seg-renov { background: var(--obpp-renov); height: 100%; }
      .obpp-bar-seg-media { background: var(--obpp-media); height: 100%; }
      .obpp-bar-seg-alta { background: var(--obpp-alta); height: 100%; }
      .obpp-bar-legend { display: flex; gap: 8px; margin-top: 5px; font-size: 0.65rem; color: var(--obpp-text-muted); }

      .obpp-pagination-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 12px; background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-radius: 10px; margin-bottom: 12px; }
      .obpp-page-controls { display: flex; align-items: center; gap: 6px; }
      .obpp-page-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 11px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: var(--obpp-transition-ios); }
      [data-theme="light"] .obpp-page-btn { background: rgba(0, 36, 125, 0.05); }
      .obpp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .obpp-page-btn:hover:not(:disabled) { background: rgba(250, 204, 21, 0.22); border-color: var(--obpp-amarillo); }
      .obpp-page-size-select { background: var(--obpp-input-bg); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 8px; border-radius: 6px; font-size: 0.72rem; }

      .obpp-cc-list { display: flex; flex-direction: column; gap: 9px; }
      .obpp-cc-item {
        background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-left: 5px solid var(--obpp-text-dim);
        border-radius: 10px; padding: 11px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; transition: var(--obpp-transition-ios);
      }
      .obpp-cc-item:hover { background: var(--obpp-bg-item-hover); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
      .obpp-cc-item.prio-ALTA { border-left-color: var(--obpp-alta); }
      .obpp-cc-item.prio-MEDIA { border-left-color: var(--obpp-media); }
      .obpp-cc-item.prio-BAJA { border-left-color: var(--obpp-baja); }
      .obpp-cc-item.prio-RENOVADO { border-left-color: var(--obpp-renov); }

      .obpp-cc-info h4 { font-size: 0.84rem; font-weight: 700; color: var(--obpp-text); margin-bottom: 5px; }
      .obpp-cc-meta { font-size: 0.7rem; color: var(--obpp-text-muted); display: flex; flex-wrap: wrap; gap: 12px; }
      .obpp-meta-tag { display: inline-flex; align-items: center; gap: 5px; }
      .obpp-cc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
      .obpp-badge-row { display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end; }
      .obpp-badge-status { padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; white-space: nowrap; letter-spacing: 0.03em; }

      .obpp-badge-ALTA { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid var(--obpp-alta); }
      .obpp-badge-MEDIA { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid var(--obpp-media); }
      .obpp-badge-BAJA { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid var(--obpp-baja); }
      .obpp-badge-RENOVADO { background: rgba(168, 85, 247, 0.22); color: #e9d5ff; border: 1px solid var(--obpp-renov); }
      .obpp-badge-SINCO { background: rgba(56, 189, 248, 0.16); color: #bae6fd; border: 1px solid rgba(56, 189, 248, 0.45); }
      [data-theme="light"] .obpp-badge-ALTA { color: #dc2626; }
      [data-theme="light"] .obpp-badge-MEDIA { color: #b45309; }
      [data-theme="light"] .obpp-badge-BAJA { color: #047857; }
      [data-theme="light"] .obpp-badge-RENOVADO { color: #7e22ce; }
      [data-theme="light"] .obpp-badge-SINCO { color: #0369a1; }

      .obpp-btn-edit-card { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-amarillo); padding: 4px 10px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: var(--obpp-transition-ios); }
      .obpp-btn-edit-card:hover { background: rgba(250, 204, 21, 0.2); border-color: var(--obpp-amarillo); }

      .obpp-modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(6, 9, 19, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 5000; align-items: center; justify-content: center; padding: 16px; }
      .obpp-modal-backdrop.show { display: flex; }
      .obpp-modal-box { background: var(--obpp-bg-drawer); border: 1px solid rgba(250, 204, 21, 0.4); border-radius: 14px; width: 100%; max-width: 560px; padding: 20px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75); animation: obppIosModalSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1); max-height: 92vh; overflow-y: auto; }
      @keyframes obppIosModalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .obpp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
      .obpp-form-group { display: flex; flex-direction: column; gap: 4px; }
      .obpp-form-group.full { grid-column: 1 / -1; }
      .obpp-form-group label { font-size: 0.72rem; color: var(--obpp-text-muted); font-weight: 700; }

      @media print {
        body { background: #060913 !important; color: #f8fafc !important; padding: 15px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .main-navbar, .obpp-tricolor-bg, #obppLoader, .obpp-top-actions, .obpp-nav-buttons,
        .obpp-drawer-panel, .obpp-filters-row, .obpp-pagination-bar, .obpp-btn-edit-card,
        .obpp-modal-backdrop, .obpp-kpi-grid, .obpp-top-bar, .top-progress-bar { display: none !important; }

        .obpp-print-header { display: block !important; margin-bottom: 22px !important; padding: 16px 20px !important; background: #0d1322 !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; border-radius: 14px !important; position: relative !important; overflow: hidden !important; }
        .obpp-print-header::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #facc15 0%, #2563eb 50%, #ef4444 100%) !important; }
        .obpp-print-header strong { font-size: 13pt !important; color: #ffffff !important; letter-spacing: 0.03em; }
        .obpp-print-header span { font-size: 8.5pt !important; color: #cbd5e1 !important; display: inline-block; margin-top: 4px; }

        body.print-solo-consolidado #obppSeccionResumen { display: block !important; background: #0d1322 !important; border: 1px solid rgba(255,255,255,0.2) !important; padding: 20px !important; border-radius: 14px !important; }
        body.print-solo-consolidado .obpp-card-section:not(#obppSeccionResumen) { display: none !important; }

        body.print-solo-lista #obppSeccionResumen { display: none !important; }
        body.print-solo-lista #obppSeccionListado { display: block !important; background: #0d1322 !important; border: 1px solid rgba(255,255,255,0.2) !important; padding: 20px !important; border-radius: 14px !important; }

        body.print-ambos #obppSeccionResumen, body.print-ambos #obppSeccionListado { display: block !important; background: #0d1322 !important; border: 1px solid rgba(255,255,255,0.2) !important; padding: 20px !important; border-radius: 14px !important; margin-bottom: 20px !important; }

        .obpp-sinco-strip, .obpp-section-head button, .obpp-pagination-bar { display: none !important; }
        .obpp-detailed-table { width: 100% !important; border: 1px solid rgba(255,255,255,0.2) !important; font-size: 9.5pt !important; background-color: #0d1322 !important; }
        .obpp-detailed-table th { background: #0f172a !important; color: #facc15 !important; border: 1px solid rgba(255,255,255,0.2) !important; }
        .obpp-detailed-table td { border: 1px solid rgba(255,255,255,0.1) !important; color: #f8fafc !important; }
        .obpp-detailed-table tr.total-row { background: #1e3a8a !important; color: #ffffff !important; }
        .obpp-cc-item { background: rgba(13, 19, 33, 0.95) !important; border: 1px solid rgba(255,255,255,0.18) !important; margin-bottom: 10px !important; break-inside: avoid; border-radius: 10px !important; padding: 12px !important; }
      }
      .obpp-print-header { display: none; }
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
          <div class="obpp-loader-title" id="obppLoaderTitle">Cargando la Matriz</div>
          <div class="obpp-loader-sub" id="obppLoaderSub">Sincronizando 1.370 Consejos Comunales...</div>
          <div class="obpp-progress-container">
            <div id="obppProgressBarFill" class="obpp-progress-fill"></div>
          </div>
          <div id="obppProgressPercentage" class="obpp-progress-pct">0%</div>
        </div>

        <div class="obpp-print-header" id="obppPrintHeaderInfo">
          <strong id="obppPrintTituloPersonalizado">REPORTE INSTITUCIONAL OBPP FUNDACOMUNAL MONAGAS</strong><br>
          <span id="obppPrintFiltrosActivos">Filtros activos: Todos</span> | Fecha: <span id="obppPrintFechaHoy"></span>
        </div>

        <div class="obpp-top-bar">
          <div class="obpp-brand">
            <div class="obpp-brand-badge">${SVG.cube}</div>
            <div>
              <h2>MONITOR DINÁMICO OBPP MONAGAS</h2>
              <p id="obppInfoSubtitulo">Sincronizando base de datos institucional Fundacomunal...</p>
            </div>
          </div>

          <div class="obpp-top-actions">
            <button class="obpp-btn-action obpp-btn-atras" onclick="window.AppCore && window.AppCore.showDashboardMenu ? window.AppCore.showDashboardMenu() : history.back()" title="Volver al Panel Principal">
              ${SVG.back}
              <span>Atrás</span>
            </button>

            <div class="obpp-dropdown">
              <button class="obpp-btn-action" onclick="window.MonitorOBPP.togglePrintDropdown(event)">
                ${SVG.printer}
                <span>Imprimir / PDF</span>
                ${SVG.chevronDown}
              </button>
              <div id="obppPrintDropdown" class="obpp-dropdown-content">
                <button onclick="window.MonitorOBPP.ejecutarImpresion('consolidado')">${SVG.doc} <span>Solo Consolidado</span></button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('lista')">${SVG.list} <span>Lista de Consejos Comunales</span></button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('ambos')">${SVG.layers} <span>Consolidado y Lista (Ambos)</span></button>
              </div>
            </div>

            <div id="obppActionRegWrap"></div>

            <button class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.limpiarFiltros()">
              ${SVG.reset}
              <span>Limpiar Filtros</span>
            </button>

            <button class="obpp-btn-action" onclick="window.MonitorOBPP.recargarServidor(true)">
              ${SVG.refresh}
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <div class="obpp-nav-buttons">
          <button class="obpp-nav-btn" id="obppBtnNavMunicipio" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerMunicipio')">
            <div class="obpp-nav-icon-box">${SVG.municipio}</div>
            <span>Municipio</span><span class="obpp-sub-val" id="obppLblMunicipio">TODOS</span>
          </button>

          <button class="obpp-nav-btn" id="obppBtnNavParroquia" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerParroquia')">
            <div class="obpp-nav-icon-box">${SVG.parroquia}</div>
            <span>Parroquia</span><span class="obpp-sub-val" id="obppLblParroquia">TODAS</span>
          </button>

          <button class="obpp-nav-btn" id="obppBtnNavComuna" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerComuna')">
            <div class="obpp-nav-icon-box">${SVG.comuna}</div>
            <span>Comuna</span><span class="obpp-sub-val" id="obppLblComuna">TODAS</span>
          </button>

          <button class="obpp-nav-btn" id="obppBtnNavConsejo" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerConsejo')">
            <div class="obpp-nav-icon-box">${SVG.consejo}</div>
            <span>Consejo Comunal</span><span class="obpp-sub-val" id="obppLblConsejo">BUSCAR / VER</span>
          </button>

          <button class="obpp-nav-btn" id="obppBtnNavCalendario" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerCalendario')">
            <div class="obpp-nav-icon-box">${SVG.calendario}</div>
            <span>Calendario Venc.</span><span class="obpp-sub-val" id="obppLblCalendario">TODOS LOS DÍAS</span>
          </button>

          <button class="obpp-nav-btn active" id="obppBtnNavResumen" onclick="window.MonitorOBPP.scrollResumen()">
            <div class="obpp-nav-icon-box">${SVG.resumen}</div>
            <span>Resumen Condición</span><span class="obpp-sub-val" id="obppLblResumen">TODAS LAS PARROQUIAS</span>
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
          <div class="obpp-drawer-header"><span>Filtrar por Comuna o Circuito Comunal (Columna R)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <select id="obppSelComuna" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('comuna', this.value)"></select>
        </div>

        <div id="obppDrawerConsejo" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Buscar Consejo Comunal (Columna G)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <input type="text" id="obppTxtBuscarCC" class="obpp-search-input" placeholder="Escriba nombre o código SITUR..." oninput="window.MonitorOBPP.aplicarBusquedaCC(this.value)">
          <select id="obppSelConsejo" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('consejo', this.value)"></select>
        </div>

        <div id="obppDrawerCalendario" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Filtro de Días por Vencer</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <label style="font-size:0.73rem; color:var(--obpp-text-muted); display:block; margin-bottom:4px;">Fecha Tope de Vencimiento:</label>
          <input type="date" id="obppInputFechaTope" class="obpp-date-input" onchange="window.MonitorOBPP.aplicarFiltroCalendario(this.value)">
          <div class="obpp-quick-days-grid">
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VENCIDOS')"><span class="obpp-status-dot dot-alta"></span><span>Vencidos (≤ 0)</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('30DIAS')"><span class="obpp-status-dot dot-media"></span><span>Críticos (1-30)</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('90DIAS')"><span class="obpp-status-dot dot-todos"></span><span>Próximos (31-90)</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VIGENTES')"><span class="obpp-status-dot dot-baja"></span><span>Holgados (> 90)</span></button>
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
            <div class="obpp-kpi-head"><div class="obpp-kpi-title">Total en Selección</div></div>
            <div class="obpp-kpi-num" id="obppKpiTotal">0</div>
            <div class="obpp-kpi-foot" style="color:var(--obpp-accent);">100% activo</div>
          </div>
          <div class="obpp-kpi-card kpi-alta" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')">
            <div class="obpp-kpi-head"><div class="obpp-kpi-title">Por Renovar (Neto)</div></div>
            <div class="obpp-kpi-num" id="obppKpiAlta" style="color:var(--obpp-alta);">0</div>
            <div class="obpp-kpi-foot" id="obppPctAlta" style="color:#fca5a5;">Crítico</div>
          </div>
          <div class="obpp-kpi-card kpi-media" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')">
            <div class="obpp-kpi-head"><div class="obpp-kpi-title">Por Vencer (Neto)</div></div>
            <div class="obpp-kpi-num" id="obppKpiMedia" style="color:var(--obpp-media);">0</div>
            <div class="obpp-kpi-foot" id="obppPctMedia" style="color:#fde68a;">Alerta</div>
          </div>
          <div class="obpp-kpi-card kpi-renov" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')">
            <div class="obpp-kpi-head"><div class="obpp-kpi-title">Renovados</div></div>
            <div class="obpp-kpi-num" id="obppKpiRenov" style="color:var(--obpp-renov);">0</div>
            <div class="obpp-kpi-foot" id="obppPctRenov" style="color:#e9d5ff;">Trámite</div>
          </div>
          <div class="obpp-kpi-card kpi-baja" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')">
            <div class="obpp-kpi-head"><div class="obpp-kpi-title">Vocería Registrada</div></div>
            <div class="obpp-kpi-num" id="obppKpiBaja" style="color:var(--obpp-baja);">0</div>
            <div class="obpp-kpi-foot" id="obppPctBaja" style="color:#6ee7b7;">Vigentes</div>
          </div>
        </div>

        <div id="obppSeccionResumen" class="obpp-card-section">
          <div class="obpp-section-head">
            <div class="obpp-section-head-title">
              <span style="color:var(--obpp-amarillo);">${SVG.sinco}</span>
              <span>ESTATUS SINCO (PAPELERÍA)</span>
            </div>
          </div>
          <div id="obppContenedorSinco" class="obpp-sinco-strip"></div>

          <div class="obpp-section-head" style="margin-top:6px;">
            <div class="obpp-section-head-title">
              <span style="color:var(--obpp-accent);">${SVG.resumen}</span>
              <span id="obppTituloDesglose">RESUMEN POR PARROQUIAS</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button class="obpp-view-toggle-btn" onclick="window.MonitorOBPP.alternarVistaResumen()" id="obppBtnToggleView">
                ${SVG.cards}
                <span>Cambiar a Tarjetas</span>
              </button>
              <span id="obppContadorParroquias" style="font-size:0.72rem; color:var(--obpp-amarillo); font-weight:700;">0</span>
            </div>
          </div>

          <div id="obppContenedorBarrasResumen"></div>
        </div>

        <div id="obppSeccionListado" class="obpp-card-section">
          <div class="obpp-section-head">
            <div class="obpp-section-head-title">
              <span style="color:var(--obpp-accent);">${SVG.consejo}</span>
              <span>CONSEJOS COMUNALES FILTRADOS</span>
            </div>
            <span id="obppContadorListaCC" style="font-size:0.73rem; color:var(--obpp-amarillo); font-weight:700;">0</span>
          </div>

          <div class="obpp-pagination-bar">
            <div class="obpp-page-controls">
              <button class="obpp-page-btn" id="obppBtnFirst" onclick="window.MonitorOBPP.cambiarPagina(1)">&laquo; Primera</button>
              <button class="obpp-page-btn" id="obppBtnPrev" onclick="window.MonitorOBPP.cambiarPagina(paginaActual - 1)">&lsaquo; Anterior</button>
              <span id="obppInfoPagina" style="font-size:0.74rem; font-weight:700; padding:0 8px;">Página 1</span>
              <button class="obpp-page-btn" id="obppBtnNext" onclick="window.MonitorOBPP.cambiarPagina(paginaActual + 1)">Siguiente &rsaquo;</button>
              <button class="obpp-page-btn" id="obppBtnLast" onclick="window.MonitorOBPP.cambiarPagina(totalPaginas)">Última &raquo;</button>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <label style="font-size:0.71rem; color:var(--obpp-text-muted);">Mostrar:</label>
              <select id="obppSelTamanoPagina" class="obpp-page-size-select" onchange="window.MonitorOBPP.cambiarTamanoPagina(this.value)">
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100" selected>100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="TODOS">Todos</option>
              </select>
            </div>
          </div>

          <div id="obppListaConsejos" class="obpp-cc-list"></div>
        </div>

        <div id="obppModalRegistro" class="obpp-modal-backdrop">
          <div class="obpp-modal-box">
            <div class="obpp-drawer-header">
              <span id="obppTituloModalReg">ACTUALIZAR CONDICIÓN OBPP</span>
              <button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarModalRegistro()">${SVG.close}</button>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <button type="button" class="obpp-btn-action" id="obppTabModoEditar" onclick="window.MonitorOBPP.cambiarModoModal('EDITAR')" style="flex:1; justify-content:center; border-color:var(--obpp-amarillo);">
                ${SVG.edit} <span>Editar Existente</span>
              </button>
              <button type="button" class="obpp-btn-action" id="obppTabModoNuevo" onclick="window.MonitorOBPP.cambiarModoModal('NUEVO')" style="flex:1; justify-content:center;">
                ${SVG.cube} <span>Nuevo Consejo</span>
              </button>
            </div>

            <div id="obppBloqueBuscadorModal" class="obpp-form-group full" style="margin-bottom:10px;">
              <label>Buscar Consejo Comunal:</label>
              <input type="text" id="obppInputFiltroModalCC" class="obpp-search-input" placeholder="Filtrar por nombre..." oninput="window.MonitorOBPP.filtrarSelectModalCC(this.value)">
              <select id="obppSelModalCC" class="obpp-filter-select" onchange="window.MonitorOBPP.cargarDatosCCEnModal(this.value)"></select>
            </div>

            <form onsubmit="window.MonitorOBPP.guardarCambiosFormulario(event)">
              <div class="obpp-form-grid">
                <input type="hidden" id="obppHidFilaSheet">
                <div class="obpp-form-group full">
                  <label>Nombre del Consejo Comunal:</label>
                  <input type="text" id="obppRegConsejo" class="obpp-search-input" style="margin:0;" required>
                </div>

                <div class="obpp-form-group">
                  <label>Condición Actual:</label>
                  <select id="obppRegCondicion" class="obpp-filter-select" style="margin:0;">
                    <option value="VOCERIA REGISTRADA">VOCERIA REGISTRADA</option>
                    <option value="VOCERIA POR VENCER">VOCERIA POR VENCER</option>
                    <option value="VOCERIA POR RENOVAR">VOCERIA POR RENOVAR</option>
                  </select>
                </div>

                <div class="obpp-form-group">
                  <label>Estatus SINCO (Papelería):</label>
                  <select id="obppRegEstatusSinco" class="obpp-filter-select" style="margin:0;">
                    <option value="REGISTRADA">REGISTRADA</option>
                    <option value="VENCIDA">VENCIDA</option>
                    <option value="TERRITORIO">TERRITORIO</option>
                    <option value="EN CONSIGNACION">EN CONSIGNACION</option>
                    <option value="POR VALIDACION">POR VALIDACION</option>
                    <option value="EN REVICION">EN REVICION</option>
                  </select>
                </div>

                <div class="obpp-form-group">
                  <label>Renovados / Addendum:</label>
                  <select id="obppRegRenovado" class="obpp-filter-select" style="margin:0;" onchange="window.MonitorOBPP.onRenovadoChange(this.value)">
                    <option value="">Sin marca</option>
                    <option value="Renovado">Renovado</option>
                    <option value="NUEVA CONFORMACION">NUEVA CONFORMACION</option>
                  </select>
                </div>

                <div class="obpp-form-group">
                  <label>SITUR Actual:</label>
                  <input type="text" id="obppRegSitur" class="obpp-search-input" style="margin:0;">
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.cerrarModalRegistro()">Cancelar</button>
                <button type="submit" class="obpp-btn-action obpp-btn-primary">${SVG.check} <span>Guardar Registro</span></button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    actualizarBotonRegistroPermisos();
    configurarCierreDropdownFuera();
  }

  function actualizarBotonRegistroPermisos() {
    const wrap = document.getElementById('obppActionRegWrap');
    if (!wrap) return;

    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === "function"
      ? window.AppCore.canEditModule('obpp')
      : true; // Por defecto habilitado para supervisores y directores

    if (canEdit) {
      wrap.innerHTML = `
        <button class="obpp-btn-action obpp-btn-primary" onclick="window.MonitorOBPP.abrirModalRegistroGeneral()">
          ${SVG.edit}
          <span>Registro / Editar</span>
        </button>
      `;
    } else {
      wrap.innerHTML = `
        <span style="padding:6px 12px; background:rgba(255,204,0,0.12); color:var(--obpp-amarillo); border:1px solid rgba(255,204,0,0.3); font-size:0.72rem; font-weight:700; border-radius:8px;">
          Solo Lectura
        </span>
      `;
    }
  }

  function configurarCierreDropdownFuera() {
    window.addEventListener('click', function(event) {
      const dd = document.getElementById('obppPrintDropdown');
      if (dd && dd.classList.contains('show')) {
        if (!event.target.closest('.obpp-dropdown')) {
          dd.classList.remove('show');
        }
      }
    });
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
    }, 140);
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
      if (fill) fill.style.width = '100%';
      if (text) text.innerText = '100%';
      setTimeout(() => {
        if (loader) {
          loader.classList.add('fade-out');
          setTimeout(() => { loader.style.display = 'none'; }, 300);
        }
      }, 350);
    } else {
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; }, 200);
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
        if (sub) sub.innerText = `Hoja: ${res.nombreHoja || 'OBPP'} | ${res.totalRegistros || baseDatos.length} registros`;
        actualizarVista();
      }
    } catch(e) {
      console.warn("[MonitorOBPP] Sincronización secundaria:", e);
    }
  }

  async function cargarDatosServidor(forzar = false) {
    const CACHE_KEY = 'OBPP_CACHE_REGISTROS_V4';
    const CACHE_TIME_KEY = 'OBPP_CACHE_TIME_V4';
    const ahora = Date.now();
    const tiempoMaximo = 5 * 60 * 1000;

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
            setTimeout(() => sincronizarFondo(CACHE_KEY, CACHE_TIME_KEY), 600);
            return;
          }
        }
      } catch(e) {}
    }

    mostrarLoader('Cargando la Matriz', 'Conectando con el Servidor Central...');
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const urlFetch = `${window.AppCore.API_URL}?data=obpp${forzar ? '&nocache=1&t=' + ahora : ''}`;
        const resp = await fetch(urlFetch);
        const res = await resp.json();

        if (res && res.status === 'error') {
          ocultarLoader(false, "Servidor: " + (res.mensaje || res.error));
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
          if (sub) sub.innerText = `Hoja: ${res.nombreHoja || 'OBPP'} | ${res.totalRegistros || baseDatos.length} registros`;
          poblarSelectoresCascada();
          actualizarVista();
          return;
        }
      }
    } catch (e) {
      console.warn("[MonitorOBPP] Falla al conectar:", e);
      ocultarLoader(false, "Error de red: " + e.message);
      return;
    }

    ocultarLoader(true);
    poblarSelectoresCascada();
    actualizarVista();
  }

  function togglePrintDropdown(e) {
    if (e) e.stopPropagation();
    const d = document.getElementById("obppPrintDropdown");
    if (d) d.classList.toggle("show");
  }

  function ejecutarImpresion(tipo) {
    const d = document.getElementById("obppPrintDropdown");
    if (d) d.classList.remove("show");

    let tituloUsuario = prompt("Título personalizado para el reporte institucional:", "REPORTE INSTITUCIONAL OBPP FUNDACOMUNAL MONAGAS");
    if (tituloUsuario && tituloUsuario.trim()) {
      document.getElementById('obppPrintTituloPersonalizado').innerText = tituloUsuario.trim().toUpperCase();
    }

    const fMun = estadoFiltros.municipio !== 'TODOS' ? `Municipio: ${estadoFiltros.municipio}` : 'Todos los Municipios';
    const fParr = estadoFiltros.parroquia !== 'TODOS' ? ` | Parroquia: ${estadoFiltros.parroquia}` : '';
    const fPrio = estadoFiltros.prioridad !== 'TODOS' ? ` | Prioridad: ${estadoFiltros.prioridad}` : '';

    document.getElementById('obppPrintFiltrosActivos').innerText = `${fMun}${fParr}${fPrio} (Registros: ${datosFiltradosGlobal.length})`;
    document.getElementById('obppPrintFechaHoy').innerText = new Date().toLocaleDateString('es-VE');

    document.body.classList.remove('print-solo-consolidado', 'print-solo-lista', 'print-ambos');
    if (tipo === 'consolidado') document.body.classList.add('print-solo-consolidado');
    else if (tipo === 'lista') document.body.classList.add('print-solo-lista');
    else if (tipo === 'ambos') document.body.classList.add('print-ambos');

    window.print();
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
    const inp = document.getElementById('obppInputFechaTope');
    if (inp) inp.value = '';
    paginaActual = 1;
    actualizarVista();
  }

  function filtrarPrioridad(p) {
    estadoFiltros.prioridad = p;
    document.querySelectorAll('.obpp-pill-btn').forEach(b => b.classList.remove('active'));
    const map = {
      TODOS: 'obppPillTODOS',
      ALTA: 'obppPillALTA',
      MEDIA: 'obppPillMEDIA',
      BAJA: 'obppPillBAJA',
      RENOVADO: 'obppPillRENOV'
    };
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
      else if (r.prioridad === 'RENOVADO') map[k].renov++;
      else if (r.prioridad === 'MEDIA') map[k].media++;
      else if (r.prioridad === 'ALTA') map[k].alta++;
    });

    const arr = Object.entries(map).sort((a,b)=> (b[1].baja + b[1].renov + b[1].media + b[1].alta) - (a[1].baja + a[1].renov + a[1].media + a[1].alta));
    const cntEl = document.getElementById('obppContadorParroquias');
    if (cntEl) cntEl.innerText = `${arr.length} parroquias`;

    if (modoVistaTabla) {
      let sB = 0, sR = 0, sM = 0, sA = 0, sTot = 0;
      let html = `<div class="obpp-table-view-container"><table class="obpp-detailed-table">
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
      let html = `<div class="obpp-parroquias-grid">`;
      arr.forEach(([etiq, info]) => {
        const tot = (info.baja + info.renov + info.media + info.alta) || 1;
        html += `
          <div class="obpp-bar-item" onclick="window.MonitorOBPP.aplicarFiltro('parroquia', '${info.parr}')">
            <div class="obpp-bar-top">
              <span style="font-weight:700;">${etiq}</span>
              <span style="color:var(--obpp-amarillo); font-weight:800;">${tot} CC</span>
            </div>
            <div class="obpp-bar-bg">
              <div class="obpp-bar-seg-baja" style="width:${(info.baja/tot)*100}%;" title="Registradas: ${info.baja}"></div>
              <div class="obpp-bar-seg-renov" style="width:${(info.renov/tot)*100}%;" title="Renovadas: ${info.renov}"></div>
              <div class="obpp-bar-seg-media" style="width:${(info.media/tot)*100}%;" title="Por Vencer: ${info.media}"></div>
              <div class="obpp-bar-seg-alta" style="width:${(info.alta/tot)*100}%;" title="Por Renovar: ${info.alta}"></div>
            </div>
            <div class="obpp-bar-legend">
              <span style="color:#10b981;">Reg: ${info.baja}</span>
              <span style="color:#a855f7;">Ren: ${info.renov}</span>
              <span style="color:#f59e0b;">Ven: ${info.media}</span>
              <span style="color:#ef4444;">Renov: ${info.alta}</span>
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
      : true;

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
        <div style="padding:34px; text-align:center; color:var(--obpp-text-muted); font-size:0.88rem;">
          No se encontraron Consejos Comunales con los filtros aplicados.
        </div>
      `;
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
            <span class="obpp-meta-tag">${SVG.calendario} <span>Vence: <strong>${r.fechaVenc || 'S/F'}</strong></span></span>
          </div>
        </div>
        <div class="obpp-cc-right">
          <div class="obpp-badge-row">
            <span class="obpp-badge-status obpp-badge-SINCO">${r.estatusSinco}</span>
            <span class="obpp-badge-status obpp-badge-${r.prioridad}">${r.condicion}</span>
          </div>
          ${canEdit ? `
            <button class="obpp-btn-edit-card" onclick="window.MonitorOBPP.abrirModalEdicionFila(${r.filaSheet})">
              ${SVG.edit} <span>Editar</span>
            </button>
          ` : `
            <span style="font-size:0.68rem; color:var(--obpp-text-dim); padding:2px 8px; background:rgba(255,255,255,0.04); border-radius:4px;">
              Solo Lectura
            </span>
          `}
        </div>
      </div>
    `).join('');

    cont.innerHTML = htmlLote;
  }

  function cambiarModoModal(modo) {
    modoModal = modo;
    const tabEdit = document.getElementById('obppTabModoEditar');
    const tabNuevo = document.getElementById('obppTabModoNuevo');
    const bloqueBuscador = document.getElementById('obppBloqueBuscadorModal');
    const tituloModal = document.getElementById('obppTituloModalReg');

    if (modo === 'NUEVO') {
      if (tabNuevo) tabNuevo.style.borderColor = 'var(--obpp-amarillo)';
      if (tabEdit) tabEdit.style.borderColor = 'var(--obpp-border)';
      if (bloqueBuscador) bloqueBuscador.style.display = 'none';
      if (tituloModal) tituloModal.innerText = 'REGISTRAR NUEVO CONSEJO COMUNAL';

      document.getElementById('obppHidFilaSheet').value = '';
      document.getElementById('obppRegConsejo').value = '';
      document.getElementById('obppRegCondicion').value = 'VOCERIA REGISTRADA';
      document.getElementById('obppRegEstatusSinco').value = 'REGISTRADA';
      document.getElementById('obppRegRenovado').value = '';
      document.getElementById('obppRegSitur').value = '';
    } else {
      if (tabEdit) tabEdit.style.borderColor = 'var(--obpp-amarillo)';
      if (tabNuevo) tabNuevo.style.borderColor = 'var(--obpp-border)';
      if (bloqueBuscador) bloqueBuscador.style.display = 'block';
      if (tituloModal) tituloModal.innerText = 'ACTUALIZAR CONDICIÓN OBPP';

      filtrarSelectModalCC('');
      const sel = document.getElementById('obppSelModalCC');
      if (sel && sel.value) cargarDatosCCEnModal(sel.value);
    }
  }

  function abrirModalRegistroGeneral() {
    const m = document.getElementById('obppModalRegistro');
    if (m) m.classList.add('show');
    cambiarModoModal('EDITAR');
  }

  function abrirModalEdicionFila(fila) {
    abrirModalRegistroGeneral();
    cambiarModoModal('EDITAR');
    const reg = baseDatos.find(r => r.filaSheet == fila);
    const sel = document.getElementById('obppSelModalCC');
    if (sel && reg) {
      // Garantizar que la opción exista en el selector sin importar su posición
      let optExists = Array.from(sel.options).some(o => o.value == fila);
      if (!optExists) {
        const newOpt = document.createElement('option');
        newOpt.value = fila;
        newOpt.text = `${reg.consejo} (${reg.parroquia})`;
        sel.add(newOpt, 0);
      }
      sel.value = fila;
      cargarDatosCCEnModal(fila);
    }
  }

  function cerrarModalRegistro() {
    const m = document.getElementById('obppModalRegistro');
    if (m) m.classList.remove('show');
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
    const filtrados = baseDatos.filter(r => !q || r.consejo.includes(q)).slice(0, 300);
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
    const consejoVal = document.getElementById('obppRegConsejo').value.trim();
    const condicionVal = document.getElementById('obppRegCondicion').value;
    const sincoVal = document.getElementById('obppRegEstatusSinco').value;
    const renovVal = document.getElementById('obppRegRenovado').value;
    const siturVal = document.getElementById('obppRegSitur').value.trim();

    const payload = {
      accion: "guardar_registro_obpp",
      modulo: "obpp",
      modo: modoModal,
      filaSheet: fila,
      consejo: consejoVal,
      condicion: condicionVal,
      estatusSinco: sincoVal,
      renovado: renovVal,
      siturAct: siturVal
    };

    cerrarModalRegistro();

    // Actualización optimista instantánea en el cliente
    if (modoModal === 'EDITAR' && fila) {
      const item = baseDatos.find(x => x.filaSheet == fila);
      if (item) {
        item.consejo = consejoVal;
        item.condicion = condicionVal;
        item.estatusSinco = sincoVal;
        item.renovado = renovVal;
        item.siturAct = siturVal;
        if (renovVal) item.prioridad = 'RENOVADO';
        actualizarVista();
      }
    }

    if (window.AppCore && typeof window.AppCore.showLoading === 'function') {
      window.AppCore.showLoading("Guardando cambios en el Servidor Central...");
    }

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === "function") {
        await window.AppCore.updateRecord(payload);
        if (window.AppCore) {
          if (typeof window.AppCore.hideLoading === 'function') window.AppCore.hideLoading();
          if (typeof window.AppCore.showToast === 'function') {
            window.AppCore.showToast("Consejo Comunal actualizado exitosamente en el Servidor Central.", "success");
          }
        }
      }
    } catch (err) {
      console.error("[MonitorOBPP] Error al sincronizar con el Servidor:", err);
      if (window.AppCore) {
        if (typeof window.AppCore.hideLoading === 'function') window.AppCore.hideLoading();
        if (typeof window.AppCore.showToast === 'function') {
          window.AppCore.showToast("Error de sincronización con el Servidor Central.", "danger");
        }
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
    filtrarSinco,
    scrollResumen,
    limpiarFiltros,
    cambiarTamanoPagina,
    cambiarPagina,
    cambiarModoModal,
    abrirModalRegistroGeneral,
    abrirModalEdicionFila,
    cerrarModalRegistro,
    onRenovadoChange,
    filtrarSelectModalCC,
    cargarDatosCCEnModal,
    guardarCambiosFormulario,
    metasInstitucionales
  };
})();
