/**
 * =========================================================================================
 * DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES DEL MUNICIPIO MATURÍN
 * MÓDULO ESPECIALIZADO: Monitor Dinámico OBPP Monagas (Columnas A-R + Meta Maturín 427)
 * Archivo: monitores/obpp.js | Versión: 7.1.0
 * =========================================================================================
 */
window.MonitorOBPP = (function () {
  let containerRef = null, baseDatos = [], datosFiltradosGlobal = [];
  let paginaActual = 1, tamanoPagina = 100, totalPaginas = 1, modoVistaTabla = true;
  let loaderInterval = null, searchDebounceTimer = null, modoModal = 'EDITAR';

  let metasInstitucionales = { metaTotalMonagas: 1370, metaMaturin: 427, metaRenovacionPct: 100 };
  let estadoFiltros = {
    municipio: 'TODOS', parroquia: 'TODOS', comuna: 'TODOS', consejo: 'TODOS',
    estatusSinco: 'TODOS', busqueda: '', prioridad: 'TODOS', fechaTope: '', rangoDias: 'TODOS'
  };

  const SVG = {
    printer: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
    chevronDown: `<svg class="obpp-svg obpp-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    doc: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
    list: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>`,
    layers: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    edit: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    reset: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>`,
    refresh: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path></svg>`,
    back: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    municipio: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="22" x2="21" y2="22"></line><polygon points="12 2 20 7 4 7"></polygon></svg>`,
    parroquia: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    comuna: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`,
    consejo: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`,
    calendario: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    resumen: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    table: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>`,
    cards: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect></svg>`,
    sinco: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>`,
    close: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    check: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    target: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    cube: `<svg class="obpp-svg obpp-core-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path></svg>`
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
    containerRef = null; baseDatos = []; datosFiltradosGlobal = [];
    const styleEl = document.getElementById('styles-monitor-obpp');
    if (styleEl) styleEl.remove();
  }

  function injectScopedStyles() {
    if (document.getElementById('styles-monitor-obpp')) return;
    const style = document.createElement('style');
    style.id = 'styles-monitor-obpp';
    style.innerHTML = `
      #obpp-monitor-scope {
        --obpp-bg-card: rgba(13, 20, 36, 0.88); --obpp-bg-card-hover: rgba(22, 32, 54, 0.95);
        --obpp-bg-drawer: rgba(10, 15, 28, 0.96); --obpp-bg-item: rgba(9, 14, 26, 0.82);
        --obpp-bg-item-hover: rgba(20, 30, 52, 0.96); --obpp-border: rgba(255, 255, 255, 0.13);
        --obpp-border-active: rgba(250, 204, 21, 0.6); --obpp-text: #f8fafc; --obpp-text-muted: #cbd5e1;
        --obpp-text-dim: #94a3b8; --obpp-input-bg: rgba(6, 9, 19, 0.92); --obpp-input-border: rgba(255, 255, 255, 0.2);
        --obpp-accent: #38bdf8; --obpp-amarillo: #facc15; --obpp-amarillo-rgb: 250, 204, 21;
        --obpp-azul: #2563eb; --obpp-rojo: #ef4444; --obpp-alta: #ef4444; --obpp-media: #f59e0b;
        --obpp-baja: #10b981; --obpp-renov: #a855f7; --obpp-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
        --obpp-transition-ios: all 0.28s cubic-bezier(0.25, 1, 0.5, 1);
        position: relative; min-height: 100%; color: var(--obpp-text); font-family: system-ui, sans-serif;
      }
      [data-theme="light"] #obpp-monitor-scope {
        --obpp-bg-card: rgba(255, 255, 255, 0.94); --obpp-bg-card-hover: rgba(248, 250, 252, 0.98);
        --obpp-bg-drawer: rgba(255, 255, 255, 0.98); --obpp-bg-item: rgba(255, 255, 255, 0.92);
        --obpp-border: rgba(0, 36, 125, 0.12); --obpp-text: #0f172a; --obpp-text-muted: #475569;
        --obpp-input-bg: #ffffff; --obpp-input-border: rgba(0, 36, 125, 0.22); --obpp-accent: #0284c7;
        --obpp-amarillo: #d97706; --obpp-azul: #00247D; --obpp-shadow: 0 10px 30px rgba(0, 36, 125, 0.08);
      }
      .obpp-svg { width: 17px; height: 17px; flex-shrink: 0; vertical-align: middle; }
      .obpp-svg-xs { width: 12px; height: 12px; }
      .obpp-tricolor-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
      .obpp-orb { position: absolute; border-radius: 50%; filter: blur(95px); opacity: 0.45; }
      .obpp-orb-amarillo { width: 430px; height: 430px; background: radial-gradient(circle, #facc15, #ca8a04); top: -8%; left: -6%; }
      .obpp-orb-azul { width: 490px; height: 490px; background: radial-gradient(circle, #2563eb, #1e3a8a); top: 25%; right: -10%; }
      .obpp-orb-rojo { width: 450px; height: 450px; background: radial-gradient(circle, #ef4444, #991b1b); bottom: -10%; left: 20%; }

      #obppLoader { position: fixed; inset: 0; background: rgba(6, 9, 19, 0.90); backdrop-filter: blur(20px); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; transition: opacity 0.3s ease; }
      #obppLoader.fade-out { opacity: 0; pointer-events: none; }
      .obpp-loader-circle-wrap { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
      .obpp-ring { position: absolute; border-radius: 50%; border: 3px solid transparent; }
      .obpp-ring-1 { width: 100%; height: 100%; border-top-color: var(--obpp-amarillo); animation: obppSpin 1.5s linear infinite; }
      .obpp-ring-2 { width: 78%; height: 78%; border-right-color: var(--obpp-azul); animation: obppSpinRev 1.2s linear infinite; }
      .obpp-ring-3 { width: 56%; height: 56%; border-top-color: var(--obpp-rojo); animation: obppSpin 1s linear infinite; }
      @keyframes obppSpin { 100% { transform: rotate(360deg); } } @keyframes obppSpinRev { 100% { transform: rotate(-360deg); } }
      .obpp-progress-container { width: 260px; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-top: 10px; }
      .obpp-progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--obpp-amarillo), var(--obpp-azul), var(--obpp-rojo)); transition: width 0.3s; }

      .obpp-top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding: 14px 18px; background: var(--obpp-bg-card); backdrop-filter: blur(16px); border: 1px solid var(--obpp-border); border-radius: 14px; position: relative; z-index: 50; box-shadow: var(--obpp-shadow); }
      .obpp-top-bar::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--obpp-amarillo), var(--obpp-azul), var(--obpp-rojo)); }
      .obpp-brand { display: flex; align-items: center; gap: 12px; }
      .obpp-brand-badge { width: 42px; height: 42px; border-radius: 10px; background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      .obpp-brand h2 { font-size: 1.15rem; font-weight: 800; margin: 0; }
      .obpp-brand p { font-size: 0.72rem; color: var(--obpp-text-muted); margin-top: 2px; }
      .obpp-top-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

      .obpp-btn-action { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 8px 13px; border-radius: 9px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; transition: var(--obpp-transition-ios); }
      .obpp-btn-action:hover { background: rgba(255, 255, 255, 0.16); transform: translateY(-1px); }
      .obpp-btn-atras { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.4); color: var(--obpp-accent); }
      .obpp-btn-primary { background: linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(37, 99, 235, 0.35)); border-color: rgba(250, 204, 21, 0.55); color: var(--obpp-amarillo); }
      .obpp-btn-reset { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
      .obpp-dropdown { position: relative; display: inline-block; }
      .obpp-dropdown-content { display: none; position: absolute; right: 0; top: calc(100% + 8px); background: var(--obpp-bg-drawer); min-width: 230px; box-shadow: 0 14px 40px rgba(0,0,0,0.7); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; z-index: 1000; }
      .obpp-dropdown-content.show { display: block; }
      .obpp-dropdown-content button { color: var(--obpp-text); padding: 11px 14px; display: flex; align-items: center; gap: 9px; width: 100%; border: none; background: none; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
      .obpp-dropdown-content button:hover { background: rgba(56, 189, 248, 0.2); color: var(--obpp-accent); }

      .obpp-meta-card { background: var(--obpp-bg-card); border: 1px solid rgba(250, 204, 21, 0.35); border-radius: 14px; padding: 15px 18px; margin-bottom: 16px; cursor: pointer; transition: var(--obpp-transition-ios); box-shadow: var(--obpp-shadow); }
      .obpp-meta-card:hover { transform: translateY(-2px); border-color: var(--obpp-amarillo); }
      .obpp-meta-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
      .obpp-meta-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(var(--obpp-amarillo-rgb), 0.16); color: var(--obpp-amarillo); border: 1px solid rgba(var(--obpp-amarillo-rgb), 0.4); padding: 3px 9px; border-radius: 20px; font-size: 0.66rem; font-weight: 800; margin-bottom: 4px; }
      .obpp-meta-header h3 { margin: 0; font-size: 0.96rem; font-weight: 800; }
      .obpp-meta-pct-wrap { text-align: right; }
      .obpp-meta-pct-big { font-size: 1.65rem; font-weight: 900; color: var(--obpp-amarillo); display: block; line-height: 1.1; }
      .obpp-meta-pct-sub { font-size: 0.72rem; color: var(--obpp-accent); font-weight: 700; }
      .obpp-meta-progress-track { width: 100%; height: 10px; background: rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
      .obpp-meta-progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #38bdf8, #facc15); transition: width 0.6s; }
      .obpp-meta-breakdown { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.73rem; color: var(--obpp-text-muted); }

      .obpp-nav-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 9px; margin-bottom: 16px; }
      .obpp-nav-btn { background: var(--obpp-bg-card); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 11px 8px; border-radius: 12px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: var(--obpp-transition-ios); box-shadow: var(--obpp-shadow); }
      .obpp-nav-btn:hover, .obpp-nav-btn.active { border-color: var(--obpp-border-active); background: var(--obpp-bg-card-hover); transform: translateY(-2px); }
      .obpp-nav-icon-box { width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      .obpp-sub-val { font-size: 0.64rem; color: var(--obpp-accent); font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .obpp-drawer-panel { display: none; background: var(--obpp-bg-drawer); border: 1px solid var(--obpp-border); border-radius: 13px; padding: 16px; margin-bottom: 16px; box-shadow: var(--obpp-shadow); }
      .obpp-drawer-panel.show { display: block; }
      .obpp-drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.82rem; font-weight: 700; color: var(--obpp-amarillo); }
      .obpp-close-drawer { background: rgba(255,255,255,0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); width: 28px; height: 28px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .obpp-filter-select, .obpp-search-input, .obpp-date-input { width: 100%; background: var(--obpp-input-bg); border: 1px solid var(--obpp-input-border); color: var(--obpp-text); padding: 9px 12px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 8px; outline: none; }
      .obpp-quick-days-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: 10px; }

      .obpp-filters-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .obpp-priority-filters { display: flex; flex-wrap: wrap; gap: 7px; }
      .obpp-pill-btn { border: 1px solid var(--obpp-border); background: var(--obpp-bg-card); color: var(--obpp-text); padding: 6px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .obpp-pill-btn.active { border-color: var(--obpp-text); background: rgba(255, 255, 255, 0.18); }
      .obpp-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .dot-todos { background: #38bdf8; } .dot-alta { background: var(--obpp-alta); } .dot-media { background: var(--obpp-media); } .dot-baja { background: var(--obpp-baja); } .dot-renov { background: var(--obpp-renov); }

      .obpp-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 11px; margin-bottom: 16px; }
      .obpp-kpi-card { background: var(--obpp-bg-card); border: 1px solid var(--obpp-border); border-radius: 13px; padding: 13px; position: relative; overflow: hidden; cursor: pointer; transition: var(--obpp-transition-ios); box-shadow: var(--obpp-shadow); }
      .obpp-kpi-card:hover { transform: translateY(-3px); }
      .obpp-kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
      .kpi-total::before { background: var(--obpp-azul); } .kpi-alta::before { background: var(--obpp-alta); } .kpi-media::before { background: var(--obpp-media); } .kpi-baja::before { background: var(--obpp-baja); } .kpi-renov::before { background: var(--obpp-renov); }
      .obpp-kpi-title { font-size: 0.67rem; text-transform: uppercase; color: var(--obpp-text-muted); font-weight: 700; }
      .obpp-kpi-num { font-size: 1.65rem; font-weight: 800; margin: 2px 0; }
      .obpp-kpi-foot { font-size: 0.66rem; font-weight: 600; }

      .obpp-card-section { background: var(--obpp-bg-card); border: 1px solid var(--obpp-border); border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: var(--obpp-shadow); }
      .obpp-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; font-size: 0.82rem; font-weight: 700; }
      .obpp-section-head-title { display: flex; align-items: center; gap: 8px; }
      .obpp-sinco-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-sinco-chip { background: rgba(255, 255, 255, 0.06); border: 1px solid var(--obpp-border); border-radius: 8px; padding: 6px 11px; font-size: 0.71rem; font-weight: 700; cursor: pointer; color: var(--obpp-text); }
      .obpp-sinco-chip.active { border-color: var(--obpp-amarillo); background: rgba(var(--obpp-amarillo-rgb), 0.16); color: var(--obpp-amarillo); }

      .obpp-view-toggle-btn { background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: var(--obpp-accent); padding: 5px 12px; border-radius: 7px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .obpp-table-view-container { width: 100%; overflow-x: auto; }
      .obpp-detailed-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; }
      .obpp-detailed-table th, .obpp-detailed-table td { padding: 10px 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-detailed-table th { background: rgba(15, 23, 42, 0.95); color: var(--obpp-amarillo); font-weight: 800; }
      .obpp-detailed-table tr:hover { background: rgba(255, 255, 255, 0.03); cursor: pointer; }
      .obpp-detailed-table tr.total-row { background: rgba(37, 99, 235, 0.18); font-weight: 800; border-top: 2px solid var(--obpp-accent); }

      .obpp-parroquias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; }
      .obpp-bar-item { background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); padding: 9px 12px; border-radius: 9px; cursor: pointer; }
      .obpp-bar-top { display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 5px; }
      .obpp-bar-bg { height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; display: flex; }
      .obpp-bar-seg-baja { background: var(--obpp-baja); } .obpp-bar-seg-renov { background: var(--obpp-renov); } .obpp-bar-seg-media { background: var(--obpp-media); } .obpp-bar-seg-alta { background: var(--obpp-alta); }
      .obpp-bar-legend { display: flex; gap: 8px; margin-top: 5px; font-size: 0.65rem; }

      .obpp-pagination-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 12px; background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-radius: 10px; margin-bottom: 12px; }
      .obpp-page-controls { display: flex; align-items: center; gap: 6px; }
      .obpp-page-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 11px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; }
      .obpp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .obpp-page-size-select { background: var(--obpp-input-bg); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 8px; border-radius: 6px; font-size: 0.72rem; }

      .obpp-cc-list { display: flex; flex-direction: column; gap: 9px; }
      .obpp-cc-item { background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-left: 5px solid var(--obpp-text-dim); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
      .obpp-cc-item.prio-ALTA { border-left-color: var(--obpp-alta); } .obpp-cc-item.prio-MEDIA { border-left-color: var(--obpp-media); } .obpp-cc-item.prio-BAJA { border-left-color: var(--obpp-baja); } .obpp-cc-item.prio-RENOVADO { border-left-color: var(--obpp-renov); }
      .obpp-cc-info { flex: 1; min-width: 260px; }
      .obpp-cc-info h4 { font-size: 0.86rem; font-weight: 700; margin: 0 0 6px 0; }
      .obpp-cc-meta { font-size: 0.7rem; color: var(--obpp-text-muted); display: flex; flex-wrap: wrap; gap: 10px; row-gap: 5px; }
      .obpp-meta-tag { display: inline-flex; align-items: center; gap: 4px; }
      .obpp-cc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
      .obpp-badge-row { display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end; }
      .obpp-badge-status { padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; }
      .obpp-badge-ALTA { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid var(--obpp-alta); }
      .obpp-badge-MEDIA { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid var(--obpp-media); }
      .obpp-badge-BAJA { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid var(--obpp-baja); }
      .obpp-badge-RENOVADO { background: rgba(168, 85, 247, 0.22); color: #e9d5ff; border: 1px solid var(--obpp-renov); }
      .obpp-badge-SINCO { background: rgba(56, 189, 248, 0.16); color: #bae6fd; border: 1px solid rgba(56, 189, 248, 0.45); }

      .obpp-btn-edit-card { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-amarillo); padding: 4px 10px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
      .obpp-modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(6, 9, 19, 0.85); backdrop-filter: blur(12px); z-index: 5000; align-items: center; justify-content: center; padding: 16px; }
      .obpp-modal-backdrop.show { display: flex; }
      .obpp-modal-box { background: var(--obpp-bg-drawer); border: 1px solid rgba(250, 204, 21, 0.4); border-radius: 14px; width: 100%; max-width: 620px; padding: 20px; max-height: 92vh; overflow-y: auto; }
      .obpp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
      .obpp-form-group { display: flex; flex-direction: column; gap: 4px; }
      .obpp-form-group.full { grid-column: 1 / -1; }
      .obpp-form-group label { font-size: 0.72rem; color: var(--obpp-text-muted); font-weight: 700; }
      .obpp-print-header { display: none; }
    `;
    document.head.appendChild(style);
  }

  function renderBaseShell() {
    if (!containerRef) return;
    containerRef.innerHTML = `
      <div id="obpp-monitor-scope">
        <div class="obpp-tricolor-bg"><div class="obpp-orb obpp-orb-amarillo"></div><div class="obpp-orb obpp-orb-azul"></div><div class="obpp-orb obpp-orb-rojo"></div></div>
        <div id="obppLoader">
          <div class="obpp-loader-circle-wrap"><div class="obpp-ring obpp-ring-1"></div><div class="obpp-ring obpp-ring-2"></div><div class="obpp-ring obpp-ring-3"></div>${SVG.cube}</div>
          <div id="obppLoaderTitle" style="font-weight:800; margin-bottom:4px;">Cargando la Matriz A-R</div>
          <div id="obppLoaderSub" style="font-size:0.78rem; color:var(--obpp-text-muted);">Conectando con Google Sheets...</div>
          <div class="obpp-progress-container"><div id="obppProgressBarFill" class="obpp-progress-fill"></div></div>
          <div id="obppProgressPercentage" style="font-size:0.72rem; color:var(--obpp-accent); margin-top:6px;">0%</div>
        </div>

        <div class="obpp-print-header" id="obppPrintHeaderInfo">
          <strong id="obppPrintTituloPersonalizado">REPORTE INSTITUCIONAL OBPP FUNDACOMUNAL MONAGAS</strong><br>
          <span id="obppPrintFiltrosActivos">Filtros: Todos</span> | Fecha: <span id="obppPrintFechaHoy"></span>
        </div>

        <div class="obpp-top-bar">
          <div class="obpp-brand">
            <div class="obpp-brand-badge">${SVG.cube}</div>
            <div><h2>MONITOR DINÁMICO OBPP MONAGAS</h2><p id="obppInfoSubtitulo">Sincronizando Columnas A-R &bull; Meta Maturín: 427</p></div>
          </div>
          <div class="obpp-top-actions">
            <button class="obpp-btn-action obpp-btn-atras" onclick="window.AppCore && window.AppCore.showDashboardMenu ? window.AppCore.showDashboardMenu() : history.back()">${SVG.back} <span>Atrás</span></button>
            <div class="obpp-dropdown">
              <button class="obpp-btn-action" onclick="window.MonitorOBPP.togglePrintDropdown(event)">${SVG.printer} <span>Imprimir / PDF</span> ${SVG.chevronDown}</button>
              <div id="obppPrintDropdown" class="obpp-dropdown-content">
                <button onclick="window.MonitorOBPP.ejecutarImpresion('consolidado')">${SVG.doc} <span>Solo Consolidado</span></button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('lista')">${SVG.list} <span>Lista de Consejos</span></button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('ambos')">${SVG.layers} <span>Ambos</span></button>
              </div>
            </div>
            <div id="obppActionRegWrap"></div>
            <button class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.limpiarFiltros()">${SVG.reset} <span>Limpiar Filtros</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.recargarServidor(true)">${SVG.refresh} <span>Actualizar</span></button>
          </div>
        </div>

        <div class="obpp-meta-card" id="obppMetaMaturinCard" onclick="window.MonitorOBPP.filtrarMaturin()" title="Clic para filtrar por Municipio Maturín">
          <div class="obpp-meta-header">
            <div><span class="obpp-meta-badge">${SVG.target} <span>META MUNICIPAL MATURÍN</span></span><h3>Cumplimiento Territorial: <span id="obppMetaValor">427</span> Consejos Comunales</h3></div>
            <div class="obpp-meta-pct-wrap"><span class="obpp-meta-pct-big" id="obppMetaPctPrincipal">0.00%</span><span class="obpp-meta-pct-sub" id="obppMetaSubConteo">0 / 427 consolidados</span></div>
          </div>
          <div class="obpp-meta-progress-track"><div class="obpp-meta-progress-fill" id="obppMetaProgressFill" style="width:0%;"></div></div>
          <div class="obpp-meta-breakdown">
            <span><strong>Total en Maturín:</strong> <span id="obppMatTotal">0</span> (<span id="obppMatTotalPct">0%</span> de 427)</span>
            <span style="color:#10b981;"><strong>Vigentes:</strong> <span id="obppMatReg">0</span> (<span id="obppMatRegPct">0%</span>)</span>
            <span style="color:#a855f7;"><strong>Renovados:</strong> <span id="obppMatRenov">0</span> (<span id="obppMatRenovPct">0%</span>)</span>
            <span style="color:#f59e0b;"><strong>Por Vencer:</strong> <span id="obppMatVencer">0</span></span>
            <span style="color:#ef4444;"><strong>Por Renovar:</strong> <span id="obppMatPorRenovar">0</span> (<span id="obppMatPorRenovarPct">0%</span>)</span>
          </div>
        </div>

        <div class="obpp-nav-buttons">
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerMunicipio')"><div class="obpp-nav-icon-box">${SVG.municipio}</div><span>Municipio</span><span class="obpp-sub-val" id="obppLblMunicipio">TODOS</span></button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerParroquia')"><div class="obpp-nav-icon-box">${SVG.parroquia}</div><span>Parroquia</span><span class="obpp-sub-val" id="obppLblParroquia">TODAS</span></button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerComuna')"><div class="obpp-nav-icon-box">${SVG.comuna}</div><span>Comuna (Col R)</span><span class="obpp-sub-val" id="obppLblComuna">TODAS</span></button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerConsejo')"><div class="obpp-nav-icon-box">${SVG.consejo}</div><span>Buscador A-R</span><span class="obpp-sub-val" id="obppLblConsejo">BUSCAR</span></button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerCalendario')"><div class="obpp-nav-icon-box">${SVG.calendario}</div><span>Calendario Venc.</span><span class="obpp-sub-val" id="obppLblCalendario">TODOS</span></button>
          <button class="obpp-nav-btn active" onclick="window.MonitorOBPP.scrollResumen()"><div class="obpp-nav-icon-box">${SVG.resumen}</div><span>Resumen</span><span class="obpp-sub-val">PARROQUIAS</span></button>
        </div>

        <div id="obppDrawerMunicipio" class="obpp-drawer-panel"><div class="obpp-drawer-header"><span>Municipio (Columna C)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div><select id="obppSelMunicipio" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('municipio', this.value)"></select></div>
        <div id="obppDrawerParroquia" class="obpp-drawer-panel"><div class="obpp-drawer-header"><span>Parroquia (Columna D)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div><select id="obppSelParroquia" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('parroquia', this.value)"></select></div>
        <div id="obppDrawerComuna" class="obpp-drawer-panel"><div class="obpp-drawer-header"><span>Nombre de Comuna o Circuito (Columna R)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div><select id="obppSelComuna" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('comuna', this.value)"></select></div>
        <div id="obppDrawerConsejo" class="obpp-drawer-panel"><div class="obpp-drawer-header"><span>Buscar Consejo, SITUR, CNE o Comuna</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div><input type="text" id="obppTxtBuscarCC" class="obpp-search-input" placeholder="Escriba nombre, SITUR, CNE o Comuna..." oninput="window.MonitorOBPP.aplicarBusquedaCC(this.value)"><select id="obppSelConsejo" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('consejo', this.value)"></select></div>
        <div id="obppDrawerCalendario" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Días por Vencer (Columnas I y K)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <input type="date" id="obppInputFechaTope" class="obpp-date-input" onchange="window.MonitorOBPP.aplicarFiltroCalendario(this.value)">
          <div class="obpp-quick-days-grid">
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VENCIDOS')">Vencidos (≤ 0)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('30DIAS')">Críticos (1-30)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('90DIAS')">Próximos (31-90)</button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VIGENTES')">Holgados (> 90)</button>
          </div>
        </div>

        <div class="obpp-filters-row"><div class="obpp-priority-filters">
          <button class="obpp-pill-btn active" id="obppPillTODOS" onclick="window.MonitorOBPP.filtrarPrioridad('TODOS')"><span class="obpp-status-dot dot-todos"></span><span>Todos (<span id="obppCntTodos">0</span>)</span></button>
          <button class="obpp-pill-btn" id="obppPillALTA" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')"><span class="obpp-status-dot dot-alta"></span><span>Por Renovar (<span id="obppCntAlta">0</span>)</span></button>
          <button class="obpp-pill-btn" id="obppPillMEDIA" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')"><span class="obpp-status-dot dot-media"></span><span>Por Vencer (<span id="obppCntMedia">0</span>)</span></button>
          <button class="obpp-pill-btn" id="obppPillRENOV" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')"><span class="obpp-status-dot dot-renov"></span><span>Renovados (<span id="obppCntRenov">0</span>)</span></button>
          <button class="obpp-pill-btn" id="obppPillBAJA" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')"><span class="obpp-status-dot dot-baja"></span><span>Registrada (<span id="obppCntBaja">0</span>)</span></button>
        </div></div>

        <div class="obpp-kpi-grid">
          <div class="obpp-kpi-card kpi-total" onclick="window.MonitorOBPP.filtrarPrioridad('TODOS')"><div class="obpp-kpi-title">Total en Selección</div><div class="obpp-kpi-num" id="obppKpiTotal">0</div><div class="obpp-kpi-foot" id="obppKpiTotalPctMeta" style="color:var(--obpp-accent);">0.0% de Meta 427</div></div>
          <div class="obpp-kpi-card kpi-alta" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')"><div class="obpp-kpi-title">Por Renovar (Neto)</div><div class="obpp-kpi-num" id="obppKpiAlta" style="color:var(--obpp-alta);">0</div><div class="obpp-kpi-foot" id="obppPctAlta" style="color:#fca5a5;">Bruto: 0</div></div>
          <div class="obpp-kpi-card kpi-media" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')"><div class="obpp-kpi-title">Por Vencer (Neto)</div><div class="obpp-kpi-num" id="obppKpiMedia" style="color:var(--obpp-media);">0</div><div class="obpp-kpi-foot" id="obppPctMedia" style="color:#fde68a;">Bruto: 0</div></div>
          <div class="obpp-kpi-card kpi-renov" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')"><div class="obpp-kpi-title">Renovados</div><div class="obpp-kpi-num" id="obppKpiRenov" style="color:var(--obpp-renov);">0</div><div class="obpp-kpi-foot" id="obppPctRenov" style="color:#e9d5ff;">Trámite</div></div>
          <div class="obpp-kpi-card kpi-baja" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')"><div class="obpp-kpi-title">Vocería Registrada</div><div class="obpp-kpi-num" id="obppKpiBaja" style="color:var(--obpp-baja);">0</div><div class="obpp-kpi-foot" id="obppPctBaja" style="color:#6ee7b7;">Vigentes</div></div>
        </div>

        <div id="obppSeccionResumen" class="obpp-card-section">
          <div class="obpp-section-head"><div class="obpp-section-head-title"><span style="color:var(--obpp-amarillo);">${SVG.sinco}</span><span>ESTATUS SINCO (COLUMNA J)</span></div></div>
          <div id="obppContenedorSinco" class="obpp-sinco-strip"></div>
          <div class="obpp-section-head"><div class="obpp-section-head-title"><span style="color:var(--obpp-accent);">${SVG.resumen}</span><span>RESUMEN POR PARROQUIAS (COLUMNA D)</span></div>
          <div style="display:flex; align-items:center; gap:10px;"><button class="obpp-view-toggle-btn" onclick="window.MonitorOBPP.alternarVistaResumen()" id="obppBtnToggleView">${SVG.cards} <span>Cambiar a Tarjetas</span></button><span id="obppContadorParroquias" style="font-size:0.72rem; color:var(--obpp-amarillo); font-weight:700;">0</span></div></div>
          <div id="obppContenedorBarrasResumen"></div>
        </div>

        <div id="obppSeccionListado" class="obpp-card-section">
          <div class="obpp-section-head"><div class="obpp-section-head-title"><span style="color:var(--obpp-accent);">${SVG.consejo}</span><span>CONSEJOS COMUNALES (CAMPOS A - R)</span></div><span id="obppContadorListaCC" style="font-size:0.73rem; color:var(--obpp-amarillo); font-weight:700;">0</span></div>
          <div class="obpp-pagination-bar">
            <div class="obpp-page-controls">
              <button class="obpp-page-btn" id="obppBtnFirst" onclick="window.MonitorOBPP.cambiarPagina(1)">&laquo; Primera</button>
              <button class="obpp-page-btn" id="obppBtnPrev" onclick="window.MonitorOBPP.cambiarPagina(paginaActual - 1)">&lsaquo; Anterior</button>
              <span id="obppInfoPagina" style="font-size:0.74rem; font-weight:700; padding:0 8px;">Página 1</span>
              <button class="obpp-page-btn" id="obppBtnNext" onclick="window.MonitorOBPP.cambiarPagina(paginaActual + 1)">Siguiente &rsaquo;</button>
              <button class="obpp-page-btn" id="obppBtnLast" onclick="window.MonitorOBPP.cambiarPagina(totalPaginas)">Última &raquo;</button>
            </div>
            <select id="obppSelTamanoPagina" class="obpp-page-size-select" onchange="window.MonitorOBPP.cambiarTamanoPagina(this.value)">
              <option value="25">25</option><option value="50">50</option><option value="100" selected>100</option><option value="250">250</option><option value="500">500</option><option value="TODOS">Todos</option>
            </select>
          </div>
          <div id="obppListaConsejos" class="obpp-cc-list"></div>
        </div>

        <div id="obppModalRegistro" class="obpp-modal-backdrop"><div class="obpp-modal-box">
          <div class="obpp-drawer-header"><span id="obppTituloModalReg">ACTUALIZAR CONDICIÓN OBPP (A - R)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarModalRegistro()">${SVG.close}</button></div>
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <button type="button" class="obpp-btn-action" id="obppTabModoEditar" onclick="window.MonitorOBPP.cambiarModoModal('EDITAR')" style="flex:1; justify-content:center; border-color:var(--obpp-amarillo);">${SVG.edit} <span>Editar Existente</span></button>
            <button type="button" class="obpp-btn-action" id="obppTabModoNuevo" onclick="window.MonitorOBPP.cambiarModoModal('NUEVO')" style="flex:1; justify-content:center;">${SVG.cube} <span>Nuevo Consejo</span></button>
          </div>
          <div id="obppBloqueBuscadorModal" class="obpp-form-group full"><label>Buscar Consejo Comunal:</label><input type="text" id="obppInputFiltroModalCC" class="obpp-search-input" placeholder="Filtrar..." oninput="window.MonitorOBPP.filtrarSelectModalCC(this.value)"><select id="obppSelModalCC" class="obpp-filter-select" onchange="window.MonitorOBPP.cargarDatosCCEnModal(this.value)"></select></div>
          <form onsubmit="window.MonitorOBPP.guardarCambiosFormulario(event)"><div class="obpp-form-grid">
            <input type="hidden" id="obppHidFilaSheet">
            <div class="obpp-form-group full"><label>Nombre del Consejo Comunal (Columna G):</label><input type="text" id="obppRegConsejo" class="obpp-search-input" style="margin:0;" required></div>
            <div class="obpp-form-group"><label>Parroquia (Columna D):</label><input type="text" id="obppRegParroquia" class="obpp-search-input" style="margin:0;"></div>
            <div class="obpp-form-group"><label>Comuna o Circuito (Columna R):</label><input type="text" id="obppRegComuna" class="obpp-search-input" style="margin:0;"></div>
            <div class="obpp-form-group"><label>Condición Actual (Columna L):</label><select id="obppRegCondicion" class="obpp-filter-select" style="margin:0;"><option value="VOCERIA REGISTRADA">VOCERIA REGISTRADA</option><option value="VOCERIA POR VENCER">VOCERIA POR VENCER</option><option value="VOCERIA POR RENOVAR">VOCERIA POR RENOVAR</option></select></div>
            <div class="obpp-form-group"><label>Estatus SINCO (Columna J):</label><select id="obppRegEstatusSinco" class="obpp-filter-select" style="margin:0;"><option value="REGISTRADA">REGISTRADA</option><option value="VENCIDA">VENCIDA</option><option value="TERRITORIO">TERRITORIO</option><option value="EN CONSIGNACION">EN CONSIGNACION</option><option value="POR VALIDACION">POR VALIDACION</option></select></div>
            <div class="obpp-form-group"><label>Renovados / Addendum (Columna M):</label><select id="obppRegRenovado" class="obpp-filter-select" style="margin:0;" onchange="window.MonitorOBPP.onRenovadoChange(this.value)"><option value="">Sin marca</option><option value="Renovado">Renovado</option><option value="NUEVA CONFORMACION">NUEVA CONFORMACION</option></select></div>
            <div class="obpp-form-group"><label>SITUR Actual (Columna F):</label><input type="text" id="obppRegSitur" class="obpp-search-input" style="margin:0;"></div>
            <div class="obpp-form-group full"><label>Fecha Vencimiento (Columna I):</label><input type="date" id="obppRegFechaVenc" class="obpp-date-input" style="margin:0;"></div>
          </div><div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;"><button type="button" class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.cerrarModalRegistro()">Cancelar</button><button type="submit" class="obpp-btn-action obpp-btn-primary">${SVG.check} <span>Guardar</span></button></div></form>
        </div></div>
      </div>
    `;
    actualizarBotonRegistroPermisos();
    window.addEventListener('click', (e) => {
      const dd = document.getElementById('obppPrintDropdown');
      if (dd && dd.classList.contains('show') && !e.target.closest('.obpp-dropdown')) dd.classList.remove('show');
    });
  }

  function actualizarBotonRegistroPermisos() {
    const wrap = document.getElementById('obppActionRegWrap');
    if (!wrap) return;
    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === "function" ? window.AppCore.canEditModule('obpp') : false;
    wrap.innerHTML = canEdit
      ? `<button class="obpp-btn-action obpp-btn-primary" onclick="window.MonitorOBPP.abrirModalRegistroGeneral()">${SVG.edit} <span>Registro / Editar</span></button>`
      : `<span style="padding:6px 12px; background:rgba(255,204,0,0.12); color:var(--obpp-amarillo); border:1px solid rgba(255,204,0,0.3); font-size:0.72rem; font-weight:700; border-radius:8px;">Solo Lectura</span>`;
  }

  function mostrarLoader(t, s) {
    const lt = document.getElementById('obppLoaderTitle'), ls = document.getElementById('obppLoaderSub'), ld = document.getElementById('obppLoader');
    if (lt) lt.innerText = t; if (ls) ls.innerText = s;
    if (ld) { ld.classList.remove('fade-out'); ld.style.display = 'flex'; }
    let prog = 15; const fill = document.getElementById('obppProgressBarFill'), txt = document.getElementById('obppProgressPercentage');
    if (loaderInterval) clearInterval(loaderInterval);
    loaderInterval = setInterval(() => { if (prog < 95) { prog += 6; if (fill) fill.style.width = prog + '%'; if (txt) txt.innerText = prog + '%'; } }, 120);
  }

  function ocultarLoader(ok = true, msg = "") {
    if (loaderInterval) { clearInterval(loaderInterval); loaderInterval = null; }
    const ld = document.getElementById('obppLoader'), fill = document.getElementById('obppProgressBarFill'), txt = document.getElementById('obppProgressPercentage');
    if (ok) { if (fill) fill.style.width = '100%'; if (txt) txt.innerText = '100%'; setTimeout(() => { if (ld) { ld.classList.add('fade-out'); setTimeout(() => ld.style.display = 'none', 250); } }, 250); }
    else { if (ld) { ld.classList.add('fade-out'); setTimeout(() => ld.style.display = 'none', 200); } if (msg && window.AppCore && window.AppCore.showToast) window.AppCore.showToast(msg, "danger"); }
  }

  async function cargarDatosServidor(forzar = false) {
    const CACHE_KEY = 'OBPP_CACHE_REGISTROS_V6', CACHE_TIME = 'OBPP_CACHE_TIME_V6', ahora = Date.now();
    if (!forzar) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY), tm = parseInt(sessionStorage.getItem(CACHE_TIME) || '0', 10);
        if (raw && (ahora - tm) < 300000) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.length > 0 && parsed[0].comuna) {
            baseDatos = parsed;
            const sub = document.getElementById('obppInfoSubtitulo');
            if (sub) sub.innerText = `Registros: ${baseDatos.length} | Comunas: ${new Set(baseDatos.map(r=>r.comuna).filter(Boolean)).size} | Caché`;
            poblarSelectoresCascada(); actualizarVista(); return;
          }
        }
      } catch(e) {}
    }

    mostrarLoader('Cargando la Matriz A-R', 'Leyendo columnas A-R del Google Sheets...');
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const resp = await fetch(`${window.AppCore.API_URL}?data=obpp&t=${ahora}`);
        const res = await resp.json();
        if (res && res.status === 'error') { ocultarLoader(false, res.mensaje || res.error); return; }
        if (res && (res.status === 'ok' || res.ok) && res.registros) {
          ocultarLoader(true);
          baseDatos = res.registros;
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(baseDatos)); sessionStorage.setItem(CACHE_TIME, ahora.toString()); } catch(e) {}
          const sub = document.getElementById('obppInfoSubtitulo');
          const comCount = new Set(baseDatos.map(r => r.comuna).filter(Boolean)).size;
          if (sub) sub.innerText = `Hoja: ${res.nombreHoja || 'OBPP'} | ${baseDatos.length} Reg. | ${comCount} Comunas | Backend v${res.versionBackend || 'Antiguo'}`;
          poblarSelectoresCascada(); actualizarVista(); return;
        }
      }
    } catch (e) { ocultarLoader(false, "Error de red: " + e.message); return; }
    ocultarLoader(true); poblarSelectoresCascada(); actualizarVista();
  }

  function filtrarMaturin() {
    const targetMun = [...new Set(baseDatos.map(r => r.municipio).filter(Boolean))].find(m => m.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('MATURIN')) || 'MP. MATURIN';
    aplicarFiltro('municipio', targetMun);
  }

  function togglePrintDropdown(e) { if (e) e.stopPropagation(); const d = document.getElementById("obppPrintDropdown"); if (d) d.classList.toggle("show"); }
  function ejecutarImpresion(tipo) {
    const d = document.getElementById("obppPrintDropdown"); if (d) d.classList.remove("show");
    let tit = prompt("Título del reporte:", "REPORTE INSTITUCIONAL OBPP FUNDACOMUNAL MONAGAS");
    if (tit && tit.trim()) document.getElementById('obppPrintTituloPersonalizado').innerText = tit.trim().toUpperCase();
    document.getElementById('obppPrintFiltrosActivos').innerText = `Municipio: ${estadoFiltros.municipio} | Parroquia: ${estadoFiltros.parroquia} (${datosFiltradosGlobal.length})`;
    document.getElementById('obppPrintFechaHoy').innerText = new Date().toLocaleDateString('es-VE');
    document.body.classList.remove('print-solo-consolidado', 'print-solo-lista', 'print-ambos');
    document.body.classList.add(tipo === 'consolidado' ? 'print-solo-consolidado' : (tipo === 'lista' ? 'print-solo-lista' : 'print-ambos'));
    window.print();
  }

  function alternarVistaResumen() {
    modoVistaTabla = !modoVistaTabla;
    const btn = document.getElementById('obppBtnToggleView');
    if (btn) btn.innerHTML = modoVistaTabla ? `${SVG.cards} <span>Cambiar a Tarjetas</span>` : `${SVG.table} <span>Cambiar a Tabla</span>`;
    renderizarResumenParroquias(datosFiltradosGlobal);
  }

  function abrirDrawer(id) { const d = document.getElementById(id), open = d && d.classList.contains('show'); cerrarDrawers(); if (d && !open) d.classList.add('show'); }
  function cerrarDrawers() { document.querySelectorAll('.obpp-drawer-panel').forEach(p => p.classList.remove('show')); }

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
    const s = document.getElementById(id); if (!s) return;
    s.innerHTML = `<option value="TODOS">${def} (${opts.length})</option>` + opts.map(o => `<option value="${o}" ${o === act ? 'selected' : ''}>${o}</option>`).join('');
  }

  function aplicarFiltro(campo, val) {
    estadoFiltros[campo] = val;
    if (campo === 'municipio') { estadoFiltros.parroquia = 'TODOS'; estadoFiltros.comuna = 'TODOS'; estadoFiltros.consejo = 'TODOS'; }
    else if (campo === 'parroquia') { estadoFiltros.comuna = 'TODOS'; estadoFiltros.consejo = 'TODOS'; }
    paginaActual = 1; poblarSelectoresCascada(); actualizarEtiquetas(); actualizarVista();
  }

  function filtrarSinco(est) { estadoFiltros.estatusSinco = (estadoFiltros.estatusSinco === est) ? 'TODOS' : est; paginaActual = 1; actualizarVista(); }
  function aplicarBusquedaCC(txt) { clearTimeout(searchDebounceTimer); searchDebounceTimer = setTimeout(() => { estadoFiltros.busqueda = txt.trim().toUpperCase(); paginaActual = 1; actualizarVista(); }, 150); }
  function aplicarFiltroCalendario(f) { estadoFiltros.fechaTope = f; estadoFiltros.rangoDias = 'TODOS'; paginaActual = 1; actualizarVista(); }
  function aplicarRangoDias(r) { estadoFiltros.rangoDias = r; estadoFiltros.fechaTope = ''; const i = document.getElementById('obppInputFechaTope'); if (i) i.value = ''; paginaActual = 1; actualizarVista(); }

  function filtrarPrioridad(p) {
    estadoFiltros.prioridad = p;
    document.querySelectorAll('.obpp-pill-btn').forEach(b => b.classList.remove('active'));
    const map = { TODOS: 'obppPillTODOS', ALTA: 'obppPillALTA', MEDIA: 'obppPillMEDIA', BAJA: 'obppPillBAJA', RENOVADO: 'obppPillRENOV' };
    if (map[p] && document.getElementById(map[p])) document.getElementById(map[p]).classList.add('active');
    paginaActual = 1; actualizarVista();
  }

  function scrollResumen() { cerrarDrawers(); const el = document.getElementById('obppSeccionResumen'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
  function limpiarFiltros() {
    estadoFiltros = { municipio: 'TODOS', parroquia: 'TODOS', comuna: 'TODOS', consejo: 'TODOS', estatusSinco: 'TODOS', busqueda: '', prioridad: 'TODOS', fechaTope: '', rangoDias: 'TODOS' };
    ['obppTxtBuscarCC', 'obppInputFechaTope'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    paginaActual = 1; cerrarDrawers(); poblarSelectoresCascada(); actualizarEtiquetas(); filtrarPrioridad('TODOS');
  }

  function actualizarEtiquetas() {
    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppLblMunicipio', estadoFiltros.municipio); setT('obppLblParroquia', estadoFiltros.parroquia); setT('obppLblComuna', estadoFiltros.comuna);
  }

  function actualizarMetaMaturinUI() {
    const meta = metasInstitucionales.metaMaturin || 427;
    const norm = t => (t || '').toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const enMaturin = baseDatos.filter(r => norm(r.municipio).includes('MATURIN'));
    let matReg = 0, matRenov = 0, matVencer = 0, matPorRenov = 0;
    for (let i = 0; i < enMaturin.length; i++) {
      const m = enMaturin[i];
      if (m.prioridad === 'RENOVADO' || m.renovado) matRenov++;
      else if (m.condicionBase === 'ALTA') matPorRenov++;
      else if (m.condicionBase === 'MEDIA') matVencer++;
      else matReg++;
    }
    const consolidado = matReg + matRenov, pct = (consolidado / meta) * 100;
    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppMetaValor', meta); setT('obppMetaPctPrincipal', pct.toFixed(2) + '%'); setT('obppMetaSubConteo', `${consolidado} / ${meta} consolidados`);
    const fill = document.getElementById('obppMetaProgressFill'); if (fill) fill.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + '%';
    setT('obppMatTotal', enMaturin.length); setT('obppMatTotalPct', ((enMaturin.length / meta) * 100).toFixed(1) + '%');
    setT('obppMatReg', matReg); setT('obppMatRegPct', ((matReg / meta) * 100).toFixed(1) + '%');
    setT('obppMatRenov', matRenov); setT('obppMatRenovPct', ((matRenov / meta) * 100).toFixed(1) + '%');
    setT('obppMatVencer', matVencer); setT('obppMatPorRenovar', matPorRenov); setT('obppMatPorRenovarPct', ((matPorRenov / meta) * 100).toFixed(1) + '%');
  }

  function actualizarVista() {
    actualizarMetaMaturinUI();
    const pre = baseDatos.filter(r => {
      if (estadoFiltros.municipio !== 'TODOS' && r.municipio !== estadoFiltros.municipio) return false;
      if (estadoFiltros.parroquia !== 'TODOS' && r.parroquia !== estadoFiltros.parroquia) return false;
      if (estadoFiltros.comuna !== 'TODOS' && r.comuna !== estadoFiltros.comuna) return false;
      if (estadoFiltros.consejo !== 'TODOS' && r.consejo !== estadoFiltros.consejo) return false;
      if (estadoFiltros.estatusSinco !== 'TODOS' && r.estatusSinco !== estadoFiltros.estatusSinco) return false;
      if (estadoFiltros.busqueda) {
        const b = estadoFiltros.busqueda;
        const ok = (r.consejo && r.consejo.toUpperCase().includes(b)) || (r.siturAct && r.siturAct.toUpperCase().includes(b)) || (r.comuna && r.comuna.toUpperCase().includes(b)) || (r.codCne && r.codCne.toUpperCase().includes(b));
        if (!ok) return false;
      }
      if (estadoFiltros.fechaTope && (!r.fechaVenc || r.fechaVenc > estadoFiltros.fechaTope)) return false;
      if (estadoFiltros.rangoDias !== 'TODOS') {
        const d = r.dias;
        if (estadoFiltros.rangoDias === 'VENCIDOS' && (d === null || d > 0)) return false;
        if (estadoFiltros.rangoDias === '30DIAS' && (d === null || d <= 0 || d > 30)) return false;
        if (estadoFiltros.rangoDias === '90DIAS' && (d === null || d <= 30 || d > 90)) return false;
        if (estadoFiltros.rangoDias === 'VIGENTES' && (d === null || d <= 90)) return false;
      }
      return true;
    });

    let bAlta = 0, rAlta = 0, bMed = 0, rMed = 0, totalRenovados = 0, netoBaja = 0;
    for (let i = 0; i < pre.length; i++) {
      const r = pre[i], isRenov = (r.prioridad === 'RENOVADO' || Boolean(r.renovado));
      if (isRenov) totalRenovados++;
      if (r.condicionBase === 'ALTA') { bAlta++; if (isRenov) rAlta++; }
      else if (r.condicionBase === 'MEDIA') { bMed++; if (isRenov) rMed++; }
      else if (!isRenov) netoBaja++;
    }
    const netoAlta = bAlta - rAlta, netoMedia = bMed - rMed, totalNeto = netoAlta + netoMedia + totalRenovados + netoBaja;
    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppCntTodos', totalNeto); setT('obppCntAlta', netoAlta); setT('obppCntMedia', netoMedia); setT('obppCntRenov', totalRenovados); setT('obppCntBaja', netoBaja);

    const prio = estadoFiltros.prioridad;
    if (prio === 'TODOS') datosFiltradosGlobal = pre;
    else if (prio === 'RENOVADO') datosFiltradosGlobal = pre.filter(r => r.prioridad === 'RENOVADO' || r.renovado);
    else datosFiltradosGlobal = pre.filter(r => r.prioridad === prio && !r.renovado);

    const metaMat = metasInstitucionales.metaMaturin || 427;
    setT('obppKpiTotal', datosFiltradosGlobal.length);
    setT('obppKpiTotalPctMeta', `${((datosFiltradosGlobal.length / metaMat) * 100).toFixed(1)}% de Meta 427`);
    setT('obppKpiAlta', netoAlta); setT('obppKpiMedia', netoMedia); setT('obppKpiRenov', totalRenovados); setT('obppKpiBaja', netoBaja);
    setT('obppPctAlta', `Bruto: ${bAlta} − Renovados: ${rAlta}`);
    setT('obppPctMedia', `Bruto: ${bMed} − Renovados: ${rMed}`);
    setT('obppPctRenov', `${((totalRenovados / (totalNeto || 1)) * 100).toFixed(1)}% | ${((totalRenovados / metaMat) * 100).toFixed(1)}% de 427`);
    setT('obppPctBaja', `${((netoBaja / (totalNeto || 1)) * 100).toFixed(1)}% solventes`);

    renderizarEstatusSinco(pre); renderizarResumenParroquias(datosFiltradosGlobal); renderizarListaPaginada();
  }

  function renderizarEstatusSinco(datos) {
    const cont = document.getElementById('obppContenedorSinco'); if (!cont) return;
    const counts = {}; datos.forEach(d => { const e = d.estatusSinco || 'SIN ESTATUS'; counts[e] = (counts[e] || 0) + 1; });
    cont.innerHTML = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([est, cnt]) =>
      `<button type="button" class="obpp-sinco-chip${estadoFiltros.estatusSinco === est ? ' active' : ''}" onclick="window.MonitorOBPP.filtrarSinco('${est}')"><span>${est}: <strong>${cnt}</strong></span></button>`
    ).join('');
  }

  function renderizarResumenParroquias(datos) {
    const cont = document.getElementById('obppContenedorBarrasResumen'); if (!cont) return;
    const map = {};
    datos.forEach(r => {
      const m = r.municipio || 'MATURIN', p = r.parroquia || 'SIN PARROQUIA', k = estadoFiltros.municipio === 'TODOS' ? `${m} › ${p}` : p;
      if (!map[k]) map[k] = { mun: m, parr: p, baja: 0, renov: 0, media: 0, alta: 0 };
      if (r.prioridad === 'RENOVADO' || r.renovado) map[k].renov++;
      else if (r.condicionBase === 'ALTA') map[k].alta++;
      else if (r.condicionBase === 'MEDIA') map[k].media++;
      else map[k].baja++;
    });
    const arr = Object.entries(map).sort((a,b)=> (b[1].baja+b[1].renov+b[1].media+b[1].alta)-(a[1].baja+a[1].renov+a[1].media+a[1].alta));
    const cntEl = document.getElementById('obppContadorParroquias'); if (cntEl) cntEl.innerText = `${arr.length} parroquias`;
    const metaMat = metasInstitucionales.metaMaturin || 427;

    if (modoVistaTabla) {
      let sB = 0, sR = 0, sM = 0, sA = 0, sTot = 0;
      let html = `<div class="obpp-table-view-container"><table class="obpp-detailed-table"><thead><tr><th>Parroquia</th><th>Registrada</th><th>Renovada</th><th>Por Vencer</th><th>Por Renovar</th><th>Total CC</th><th>% Meta 427</th></tr></thead><tbody>`;
      arr.forEach(([etiq, info]) => {
        const tot = info.baja + info.renov + info.media + info.alta; sB+=info.baja; sR+=info.renov; sM+=info.media; sA+=info.alta; sTot+=tot;
        html += `<tr onclick="window.MonitorOBPP.aplicarFiltro('parroquia', '${info.parr}')"><td><strong>${etiq}</strong></td><td style="color:#10b981;">${info.baja}</td><td style="color:#a855f7;">${info.renov}</td><td style="color:#f59e0b;">${info.media}</td><td style="color:#ef4444;">${info.alta}</td><td><strong>${tot}</strong></td><td style="color:var(--obpp-accent);">${((tot/metaMat)*100).toFixed(1)}%</td></tr>`;
      });
      html += `<tr class="total-row"><td><strong>TOTAL GENERAL</strong></td><td>${sB}</td><td>${sR}</td><td>${sM}</td><td>${sA}</td><td><strong>${sTot}</strong></td><td style="color:#facc15;">${((sTot/metaMat)*100).toFixed(1)}%</td></tr></tbody></table></div>`;
      cont.innerHTML = html;
    } else {
      cont.innerHTML = `<div class="obpp-parroquias-grid">` + arr.map(([etiq, info]) => {
        const tot = (info.baja + info.renov + info.media + info.alta) || 1;
        return `<div class="obpp-bar-item" onclick="window.MonitorOBPP.aplicarFiltro('parroquia', '${info.parr}')"><div class="obpp-bar-top"><strong>${etiq}</strong><span style="color:var(--obpp-amarillo);">${tot} CC</span></div><div class="obpp-bar-bg"><div class="obpp-bar-seg-baja" style="width:${(info.baja/tot)*100}%;"></div><div class="obpp-bar-seg-renov" style="width:${(info.renov/tot)*100}%;"></div><div class="obpp-bar-seg-media" style="width:${(info.media/tot)*100}%;"></div><div class="obpp-bar-seg-alta" style="width:${(info.alta/tot)*100}%;"></div></div><div class="obpp-bar-legend"><span style="color:#10b981;">Reg:${info.baja}</span> <span style="color:#a855f7;">Ren:${info.renov}</span> <span style="color:#f59e0b;">Ven:${info.media}</span> <span style="color:#ef4444;">Renov:${info.alta}</span></div></div>`;
      }).join('') + `</div>`;
    }
  }

  function cambiarTamanoPagina(val) { tamanoPagina = val === 'TODOS' ? 999999 : parseInt(val, 10); paginaActual = 1; renderizarListaPaginada(); }
  function cambiarPagina(p) { if (p >= 1 && p <= totalPaginas) { paginaActual = p; renderizarListaPaginada(); } }

  function renderizarListaPaginada() {
    const cont = document.getElementById('obppListaConsejos'); if (!cont) return;
    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === "function" ? window.AppCore.canEditModule('obpp') : false;
    const total = datosFiltradosGlobal.length; totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    const ini = (paginaActual - 1) * tamanoPagina, fin = Math.min(ini + tamanoPagina, total), lote = datosFiltradosGlobal.slice(ini, fin);

    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppContadorListaCC', `${total > 0 ? ini + 1 : 0} - ${fin} de ${total}`); setT('obppInfoPagina', `Página ${paginaActual} de ${totalPaginas}`);
    ['obppBtnFirst', 'obppBtnPrev'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = (paginaActual <= 1); });
    ['obppBtnNext', 'obppBtnLast'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = (paginaActual >= totalPaginas); });

    if (lote.length === 0) { cont.innerHTML = `<div style="padding:34px; text-align:center; color:var(--obpp-text-muted);">No se encontraron Consejos Comunales.</div>`; return; }
    cont.innerHTML = lote.map(r => `
      <div class="obpp-cc-item prio-${r.prioridad}">
        <div class="obpp-cc-info">
          <h4><span style="color:var(--obpp-text-dim); font-size:0.75rem; margin-right:6px;">#${r.num}</span>${r.consejo}</h4>
          <div class="obpp-cc-meta">
            <span class="obpp-meta-tag">${SVG.municipio} <span>${r.municipio}</span></span>
            <span class="obpp-meta-tag">${SVG.parroquia} <span>${r.parroquia}</span></span>
            <span class="obpp-meta-tag">${SVG.comuna} <span>${r.comuna || 'SIN COMUNA'}</span></span>
            <span class="obpp-meta-tag">${SVG.calendario} <span>Vence: <strong>${r.fechaVenc || 'S/F'}</strong> (${r.diasTexto || '—'})</span></span>
            ${r.siturAct ? `<span class="obpp-meta-tag" style="color:var(--obpp-accent); font-family:monospace;">SITUR: ${r.siturAct}</span>` : ''}
            ${r.codCne ? `<span class="obpp-meta-tag" style="color:var(--obpp-amarillo); font-family:monospace;">CNE: ${r.codCne}</span>` : ''}
          </div>
        </div>
        <div class="obpp-cc-right">
          <div class="obpp-badge-row">
            <span class="obpp-badge-status obpp-badge-SINCO">${r.estatusSinco}</span>
            <span class="obpp-badge-status obpp-badge-${r.prioridad}">${r.condicion}</span>
            ${r.renovado ? `<span class="obpp-badge-status obpp-badge-RENOVADO">${r.renovado}</span>` : ''}
          </div>
          ${canEdit ? `<button class="obpp-btn-edit-card" onclick="window.MonitorOBPP.abrirModalEdicionFila(${r.filaSheet})">${SVG.edit} <span>Editar</span></button>` : ''}
        </div>
      </div>
    `).join('');
  }

  function cambiarModoModal(modo) {
    modoModal = modo;
    const bloq = document.getElementById('obppBloqueBuscadorModal'); if (bloq) bloq.style.display = (modo === 'NUEVO') ? 'none' : 'block';
    if (modo === 'NUEVO') ['obppHidFilaSheet', 'obppRegConsejo', 'obppRegParroquia', 'obppRegComuna', 'obppRegSitur', 'obppRegFechaVenc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    else { filtrarSelectModalCC(''); const sel = document.getElementById('obppSelModalCC'); if (sel && sel.value) cargarDatosCCEnModal(sel.value); }
  }

  function abrirModalRegistroGeneral() { const m = document.getElementById('obppModalRegistro'); if (m) m.classList.add('show'); cambiarModoModal('EDITAR'); }
  function abrirModalEdicionFila(fila) {
    abrirModalRegistroGeneral(); cambiarModoModal('EDITAR');
    const reg = baseDatos.find(r => r.filaSheet == fila), sel = document.getElementById('obppSelModalCC');
    if (sel && reg) {
      if (!Array.from(sel.options).some(o => o.value == fila)) { const opt = document.createElement('option'); opt.value = fila; opt.text = `${reg.consejo} (${reg.parroquia})`; sel.add(opt, 0); }
      sel.value = fila; cargarDatosCCEnModal(fila);
    }
  }
  function cerrarModalRegistro() { const m = document.getElementById('obppModalRegistro'); if (m) m.classList.remove('show'); }
  function onRenovadoChange(val) { if (val === 'Renovado' || val === 'NUEVA CONFORMACION') { const e = document.getElementById('obppRegEstatusSinco'); if (e) e.value = 'TERRITORIO'; } }
  function filtrarSelectModalCC(txt) {
    const sel = document.getElementById('obppSelModalCC'); if (!sel) return; const q = txt ? txt.toUpperCase().trim() : '';
    sel.innerHTML = baseDatos.filter(r => !q || r.consejo.toUpperCase().includes(q)).slice(0, 300).map(r => `<option value="${r.filaSheet}">${r.consejo} (${r.parroquia})</option>`).join('');
  }
  function cargarDatosCCEnModal(fila) {
    const reg = baseDatos.find(r => r.filaSheet == fila); if (!reg) return;
    document.getElementById('obppHidFilaSheet').value = reg.filaSheet;
    document.getElementById('obppRegConsejo').value = reg.consejo;
    document.getElementById('obppRegParroquia').value = reg.parroquia || "";
    document.getElementById('obppRegComuna').value = reg.comuna || "";
    document.getElementById('obppRegCondicion').value = reg.condicion;
    document.getElementById('obppRegEstatusSinco').value = reg.estatusSinco;
    document.getElementById('obppRegRenovado').value = reg.renovado || "";
    document.getElementById('obppRegSitur').value = reg.siturAct || "";
    document.getElementById('obppRegFechaVenc').value = reg.fechaVenc || "";
  }

  async function guardarCambiosFormulario(e) {
    if (e && e.preventDefault) e.preventDefault();
    const g = id => document.getElementById(id).value;
    const payload = {
      accion: "guardar_registro_obpp", modulo: "obpp", modo: modoModal, filaSheet: g('obppHidFilaSheet'),
      consejo: g('obppRegConsejo').trim(), parroquia: g('obppRegParroquia').trim(), comuna: g('obppRegComuna').trim(),
      condicion: g('obppRegCondicion'), estatusSinco: g('obppRegEstatusSinco'), renovado: g('obppRegRenovado'),
      siturAct: g('obppRegSitur').trim(), fechaVenc: g('obppRegFechaVenc')
    };
    cerrarModalRegistro();
    if (modoModal === 'EDITAR' && payload.filaSheet) {
      const item = baseDatos.find(x => x.filaSheet == payload.filaSheet);
      if (item) { Object.assign(item, payload); item.prioridad = item.renovado ? 'RENOVADO' : (item.condicion.includes('RENOVAR') ? 'ALTA' : (item.condicion.includes('POR VENCER') ? 'MEDIA' : 'BAJA')); actualizarVista(); }
    }
    try { if (window.AppCore && window.AppCore.updateRecord) await window.AppCore.updateRecord(payload); } catch(err) {}
  }

  return {
    montar, desmontar, mount: montar, unmount: desmontar, recargarServidor: cargarDatosServidor,
    filtrarMaturin, togglePrintDropdown, ejecutarImpresion, alternarVistaResumen, abrirDrawer,
    cerrarDrawers, aplicarFiltro, aplicarBusquedaCC, aplicarFiltroCalendario, aplicarRangoDias,
    filtrarPrioridad, filtrarSinco, scrollResumen, limpiarFiltros, cambiarTamanoPagina,
    cambiarPagina, cambiarModoModal, abrirModalRegistroGeneral, abrirModalEdicionFila,
    cerrarModalRegistro, onRenovadoChange, filtrarSelectModalCC, cargarDatosCCEnModal,
    guardarCambiosFormulario, metasInstitucionales
  };
})();
