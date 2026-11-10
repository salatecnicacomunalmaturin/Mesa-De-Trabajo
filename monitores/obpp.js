/**
 * =========================================================================================
 * DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES DEL MUNICIPIO MATURÍN
 * SISTEMA CENTRAL DE GESTIÓN Y MONITOREO INSTITUCIONAL
 * MÓDULO ESPECIALIZADO: Monitor Dinámico OBPP Monagas (Consejos Comunales y Vocerías)
 * Archivo: monitores/obpp.js
 * Versión: 7.2.0 - Mapeo Exacto A:R (0..17), Conteos L/M Precisos y Meta Maturín 427
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
  let printListenerBound = false;

  const metasInstitucionales = {
    metaTotalMonagas: 1370,
    metaMaturin: 427,
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
    rangoDias: 'TODOS',
    agrupacionResumen: 'PARROQUIAS'
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
    target: `<svg class="obpp-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    cube: `<svg class="obpp-svg obpp-core-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`
  };

  function sinTildes(val) {
    if (val === null || val === undefined) return '';
    return val.toString().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  }

  function textoLimpio(val) {
    if (val === null || val === undefined) return '';
    return val.toString().trim().toUpperCase().replace(/\s+/g, ' ');
  }

  function esc(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function extraerEnteroConSigno(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number' && !isNaN(val)) return Math.trunc(val);
    const str = String(val).trim();
    const match = str.match(/-?\d+/);
    if (!match) return null;
    const parsed = parseInt(match[0], 10);
    return isNaN(parsed) ? null : parsed;
  }

  function normalizarFecha(val) {
    if (val === null || val === undefined || val === '') return '';
    const str = String(val).trim();
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3].length === 2 ? '20' + dmy[3] : dmy[3];
      return `${y}-${m}-${d}`;
    }
    return str;
  }

  /**
   * Lector universal por nombre de columna o por índice de respaldo (0..17)
   */
  function obtenerCampo(raw, claves, idxFallback) {
    if (Array.isArray(raw)) {
      return (raw[idxFallback] !== undefined && raw[idxFallback] !== null) ? raw[idxFallback] : '';
    }
    if (!raw || typeof raw !== 'object') return '';
    for (let i = 0; i < claves.length; i++) {
      const k = claves[i];
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== '') {
        return raw[k];
      }
    }
    const rawKeys = Object.keys(raw);
    for (let i = 0; i < claves.length; i++) {
      const targetNorm = sinTildes(claves[i]).replace(/[^A-Z0-9]/g, '');
      for (let j = 0; j < rawKeys.length; j++) {
        const rkNorm = sinTildes(rawKeys[j]).replace(/[^A-Z0-9]/g, '');
        if (rkNorm === targetNorm && raw[rawKeys[j]] !== undefined && raw[rawKeys[j]] !== null && String(raw[rawKeys[j]]).trim() !== '') {
          return raw[rawKeys[j]];
        }
      }
    }
    if (raw[idxFallback] !== undefined && raw[idxFallback] !== null) return raw[idxFallback];
    if (raw['col_' + idxFallback] !== undefined && raw['col_' + idxFallback] !== null) return raw['col_' + idxFallback];
    return '';
  }

  /**
   * Normaliza cada fila A:R (índices 0 al 17) sin cruzar columnas J, K, L, M o O..R
   */
  function normalizarRegistro(raw, idx) {
    const filaSheet = raw.filaSheet || (idx + 2);
    const num = textoLimpio(obtenerCampo(raw, ['num', 'N°', 'NO', 'NRO', 'ID'], 0)) || String(idx + 1);
    const estado = textoLimpio(obtenerCampo(raw, ['estado', 'ESTADO'], 1)) || 'EDO. MONAGAS';
    const municipio = textoLimpio(obtenerCampo(raw, ['municipio', 'MUNICIPIO'], 2)) || 'MATURIN';
    const parroquia = textoLimpio(obtenerCampo(raw, ['parroquia', 'PARROQUIA'], 3));
    const siturAnt = textoLimpio(obtenerCampo(raw, ['siturAnt', 'CODIGO SITUR ANTERIOR', 'SITUR_ANTERIOR'], 4));
    const siturAct = textoLimpio(obtenerCampo(raw, ['siturAct', 'CODIGO SITUR ACTUAL', 'SITUR_ACTUAL'], 5));
    const consejo = textoLimpio(obtenerCampo(raw, ['consejo', 'NOMBRE DEL CONSEJO COMUNAL', 'NOMBRE_CONSEJO_COMUNAL', 'nombreCC'], 6)) || `CONSEJO COMUNAL (FILA ${filaSheet})`;
    const fechaReg = normalizarFecha(obtenerCampo(raw, ['fechaReg', 'Fecha de Registro SINCO', 'FECHA_REGISTRO'], 7));
    const fechaVenc = normalizarFecha(obtenerCampo(raw, ['fechaVenc', 'FECHA DE VENCIMIENTO SINCO', 'FECHA_VENCIMIENTO'], 8));

    // Col J (9): Estatus SINCO estricto
    const estatusSincoRaw = textoLimpio(obtenerCampo(raw, ['estatusSinco', 'Estatus SINCO', 'ESTATUS_SINCO'], 9));
    const estatusSinco = estatusSincoRaw || 'SIN ESTATUS';

    // Col K (10): Días por vencer (entero con signo)
    const rawDias = obtenerCampo(raw, ['diasTexto', 'dias', 'DÍAS POR VENCER', 'DIAS_POR_VENCER'], 10);
    let dias = extraerEnteroConSigno(raw.dias !== undefined && raw.dias !== null ? raw.dias : rawDias);
    if (dias === null && fechaVenc && /^\d{4}-\d{2}-\d{2}$/.test(fechaVenc)) {
      const p = fechaVenc.split('-');
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fv = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      if (!isNaN(fv.getTime())) dias = Math.round((fv.getTime() - hoy.getTime()) / 86400000);
    }
    const diasTexto = (typeof rawDias === 'string' && rawDias.trim() !== '') ? rawDias.trim() : (dias !== null ? `${dias} días` : '—');

    // Col L (11): Condición Actual estricta
    const condRawOriginal = textoLimpio(obtenerCampo(raw, ['condicion', 'CONDICIÓN ACTUAL', 'CONDICION ACTUAL', 'CONDICION'], 11));
    const condNorm = sinTildes(condRawOriginal);

    let condicionBase = 'BAJA';
    let condicion = condRawOriginal;
    if (condNorm.includes('POR RENOVAR') || condNorm.includes('RENOVAR') || condNorm.includes('VENCID')) {
      condicionBase = 'ALTA';
      if (!condicion) condicion = 'VOCERIA POR RENOVAR';
    } else if (condNorm.includes('POR VENCER') || condNorm.includes('VENCER')) {
      condicionBase = 'MEDIA';
      if (!condicion) condicion = 'VOCERIA POR VENCER';
    } else if (condNorm.includes('REGISTRADA')) {
      condicionBase = 'BAJA';
      if (!condicion) condicion = 'VOCERIA REGISTRADA';
    } else if (dias !== null && dias < 0) {
      condicionBase = 'ALTA';
      if (!condicion) condicion = 'VOCERIA POR RENOVAR';
    } else if (dias !== null && dias <= 30) {
      condicionBase = 'MEDIA';
      if (!condicion) condicion = 'VOCERIA POR VENCER';
    } else {
      condicionBase = 'BAJA';
      if (!condicion) condicion = 'VOCERIA REGISTRADA';
    }

    // Col M (12): Renovados / Addendum estricto
    const renovado = textoLimpio(obtenerCampo(raw, ['renovado', 'RENOVADOS / ADDENDUM', 'RENOVADOS_ADDENDUM'], 12));
    const renovNorm = sinTildes(renovado);
    const esRenovado = renovNorm.includes('RENOVADO');

    // Col N (13): Fecha propuesta de elección de vocerías
    const fechaElec = normalizarFecha(obtenerCampo(raw, ['fechaElec', 'FECHA PROPUESTA DE ELECCION DE VOCERIAS', 'FECHA_ELECCION'], 13));

    // Col O (14): Comuna o Circuito Comunal (Tipo agrupación)
    const tipoAgrup = textoLimpio(obtenerCampo(raw, ['tipoAgrup', 'COMUNA O CIRCUITO COMUNAL', 'TIPO_AGRUPACION'], 14)) || 'COMUNA';

    // Col P (15): Código Comuna CNE
    const codCne = textoLimpio(obtenerCampo(raw, ['codCne', 'CODIGO COMUNA CNE', 'COD_COMUNA_CNE'], 15));

    // Col Q (16): Código SITUR Comuna o Circuito Comunal
    const codSiturComuna = textoLimpio(obtenerCampo(raw, ['codSiturComuna', 'codSitur', 'CODIGO SITUR COMUNA O CIRCUITO COMUNAL', 'COD_SITUR_COMUNA'], 16));

    // Col R (17): Nombre de Comuna o Circuito Comunal
    let comuna = textoLimpio(obtenerCampo(raw, ['comuna', 'NOMBRE DE COMUNA O CIRCUITO COMUNAL', 'COMUNA_O_CIRCUITO'], 17));
    if (comuna === 'SIN COMUNA ASIGNADA') comuna = '';

    const prioridad = esRenovado ? 'RENOVADO' : condicionBase;

    return {
      filaSheet,
      num,
      estado,
      municipio,
      parroquia,
      siturAnt,
      siturAct,
      consejo,
      fechaReg,
      fechaVenc,
      estatusSinco,
      dias,
      diasTexto,
      condicion,
      condNorm,
      condicionBase,
      renovado,
      esRenovado,
      esRegistrada: condNorm.includes('REGISTRADA') || (!condNorm && condicionBase === 'BAJA'),
      esPorVencer: condNorm.includes('POR VENCER') || (!condNorm && condicionBase === 'MEDIA'),
      esPorRenovar: condNorm.includes('POR RENOVAR') || (!condNorm && condicionBase === 'ALTA'),
      fechaElec,
      tipoAgrup,
      codCne,
      codSiturComuna,
      comuna,
      prioridad
    };
  }

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
      .obpp-tricolor-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
      .obpp-orb { position: absolute; border-radius: 50%; filter: blur(95px); opacity: 0.45; will-change: transform; }
      [data-theme="light"] .obpp-orb { opacity: 0.12; filter: blur(110px); }
      .obpp-orb-amarillo { width: 430px; height: 430px; background: radial-gradient(circle, #facc15 0%, #ca8a04 100%); top: -8%; left: -6%; animation: obppFloatAmarillo 14s ease-in-out infinite alternate; }
      .obpp-orb-azul { width: 490px; height: 490px; background: radial-gradient(circle, #2563eb 0%, #1e3a8a 100%); top: 25%; right: -10%; animation: obppFloatAzul 18s ease-in-out infinite alternate; }
      .obpp-orb-rojo { width: 450px; height: 450px; background: radial-gradient(circle, #ef4444 0%, #991b1b 100%); bottom: -10%; left: 20%; animation: obppFloatRojo 16s ease-in-out infinite alternate; }
      @keyframes obppFloatAmarillo { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(120px,80px) scale(1.12); } 100% { transform: translate(40px,160px) scale(0.95); } }
      @keyframes obppFloatAzul { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-140px,-60px) scale(1.15); } 100% { transform: translate(-60px,110px) scale(0.92); } }
      @keyframes obppFloatRojo { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(90px,-110px) scale(1.1); } 100% { transform: translate(-80px,-40px) scale(1.05); } }

      #obppLoader { position: fixed; inset: 0; background: rgba(6, 9, 19, 0.90); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; transition: opacity 0.35s ease, transform 0.35s ease; }
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

      .obpp-top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding: 14px 18px; background: var(--obpp-bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--obpp-border); border-radius: 14px; position: relative; overflow: visible; z-index: 50; box-shadow: var(--obpp-shadow); }
      .obpp-top-bar::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--obpp-amarillo) 0%, var(--obpp-azul) 50%, var(--obpp-rojo) 100%); border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; }
      .obpp-brand { display: flex; align-items: center; gap: 12px; }
      .obpp-brand-badge { width: 42px; height: 42px; border-radius: 10px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--obpp-border); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      [data-theme="light"] .obpp-brand-badge { background: rgba(0, 36, 125, 0.05); }
      .obpp-brand h2 { font-size: 1.15rem; font-weight: 800; color: var(--obpp-text); margin: 0; }
      .obpp-brand p { font-size: 0.72rem; color: var(--obpp-text-muted); margin-top: 2px; }
      .obpp-top-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

      .obpp-btn-action { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 8px 13px; border-radius: 9px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; transition: var(--obpp-transition-ios); text-decoration: none; }
      [data-theme="light"] .obpp-btn-action { background: rgba(0, 36, 125, 0.05); }
      .obpp-btn-action:hover { background: rgba(255, 255, 255, 0.16); transform: translateY(-1px); }
      .obpp-btn-action:active { transform: scale(0.97); }
      .obpp-btn-atras { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.4); color: var(--obpp-accent); }
      .obpp-btn-atras:hover { background: rgba(56, 189, 248, 0.25); color: #ffffff; }
      .obpp-btn-primary { background: linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(37, 99, 235, 0.35)); border-color: rgba(250, 204, 21, 0.55); color: var(--obpp-amarillo); }
      .obpp-btn-reset { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
      [data-theme="light"] .obpp-btn-reset { color: #dc2626; }

      .obpp-dropdown { position: relative; display: inline-block; }
      .obpp-dropdown-content { display: none; position: absolute; right: 0; top: calc(100% + 8px); background: var(--obpp-bg-drawer); min-width: 230px; box-shadow: 0 14px 40px rgba(0,0,0,0.7); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; z-index: 1000; overflow: hidden; animation: obppIosSlideDown 0.2s ease-out; }
      .obpp-dropdown-content.show { display: block; }
      .obpp-dropdown-content button { color: var(--obpp-text); padding: 11px 14px; display: flex; align-items: center; gap: 9px; width: 100%; border: none; background: none; text-align: left; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
      .obpp-dropdown-content button:hover { background: rgba(56, 189, 248, 0.2); color: var(--obpp-accent); }

      /* Tarjeta Meta Municipal Maturín 427 */
      .obpp-meta-card { background: var(--obpp-bg-card); backdrop-filter: blur(16px); border: 1px solid rgba(250, 204, 21, 0.38); border-radius: 14px; padding: 15px 18px; margin-bottom: 16px; position: relative; cursor: pointer; transition: var(--obpp-transition-ios); box-shadow: var(--obpp-shadow); }
      .obpp-meta-card:hover { transform: translateY(-2px); border-color: var(--obpp-amarillo); }
      .obpp-meta-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
      .obpp-meta-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(var(--obpp-amarillo-rgb), 0.16); color: var(--obpp-amarillo); border: 1px solid rgba(var(--obpp-amarillo-rgb), 0.4); padding: 3px 9px; border-radius: 20px; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px; }
      .obpp-meta-header h3 { margin: 0; font-size: 0.96rem; font-weight: 800; color: var(--obpp-text); }
      .obpp-meta-pct-wrap { text-align: right; }
      .obpp-meta-pct-big { font-size: 1.75rem; font-weight: 900; color: var(--obpp-amarillo); display: block; line-height: 1.1; font-variant-numeric: tabular-nums; }
      .obpp-meta-pct-sub { font-size: 0.72rem; color: var(--obpp-accent); font-weight: 700; }
      .obpp-meta-progress-track { width: 100%; height: 10px; background: rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; margin-bottom: 10px; border: 1px solid var(--obpp-border); }
      [data-theme="light"] .obpp-meta-progress-track { background: rgba(0, 36, 125, 0.08); }
      .obpp-meta-progress-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #facc15 100%); border-radius: 8px; transition: width 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
      .obpp-meta-breakdown { display: flex; flex-wrap: wrap; gap: 14px; row-gap: 6px; font-size: 0.73rem; color: var(--obpp-text-muted); }

      .obpp-nav-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 9px; margin-bottom: 16px; position: relative; z-index: 1; }
      .obpp-nav-btn { background: var(--obpp-bg-card); backdrop-filter: blur(16px); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 11px 8px; border-radius: 12px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: var(--obpp-transition-ios); text-align: center; box-shadow: var(--obpp-shadow); }
      .obpp-nav-btn:hover, .obpp-nav-btn.active { border-color: var(--obpp-border-active); background: var(--obpp-bg-card-hover); transform: translateY(-2px); }
      .obpp-nav-icon-box { width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; color: var(--obpp-amarillo); }
      [data-theme="light"] .obpp-nav-icon-box { background: rgba(0, 36, 125, 0.05); }
      .obpp-sub-val { font-size: 0.64rem; color: var(--obpp-accent); font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .obpp-drawer-panel { display: none; background: var(--obpp-bg-drawer); backdrop-filter: blur(20px); border: 1px solid var(--obpp-border); border-radius: 13px; padding: 16px; margin-bottom: 16px; position: relative; z-index: 20; box-shadow: var(--obpp-shadow); animation: obppIosSlideDown 0.25s cubic-bezier(0.25, 1, 0.5, 1); }
      .obpp-drawer-panel.show { display: block; }
      @keyframes obppIosSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      .obpp-drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.82rem; font-weight: 700; color: var(--obpp-amarillo); }
      .obpp-close-drawer { background: rgba(255,255,255,0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); width: 28px; height: 28px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .obpp-filter-select, .obpp-search-input, .obpp-date-input { width: 100%; background: var(--obpp-input-bg); border: 1px solid var(--obpp-input-border); color: var(--obpp-text); padding: 9px 12px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 8px; outline: none; }
      .obpp-filter-select:focus, .obpp-search-input:focus, .obpp-date-input:focus { border-color: var(--obpp-amarillo); }
      .obpp-quick-days-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 8px; margin-top: 10px; }

      .obpp-filters-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 14px; }
      .obpp-priority-filters { display: flex; flex-wrap: wrap; gap: 7px; }
      .obpp-pill-btn { border: 1px solid var(--obpp-border); background: var(--obpp-bg-card); color: var(--obpp-text); padding: 6px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: var(--obpp-transition-ios); }
      .obpp-pill-btn.active { border-color: var(--obpp-text); background: rgba(255, 255, 255, 0.18); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
      [data-theme="light"] .obpp-pill-btn.active { border-color: var(--obpp-azul); background: rgba(0, 36, 125, 0.1); }
      .obpp-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      .dot-todos { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
      .dot-alta { background: var(--obpp-alta); box-shadow: 0 0 8px var(--obpp-alta); }
      .dot-media { background: var(--obpp-media); box-shadow: 0 0 8px var(--obpp-media); }
      .dot-baja { background: var(--obpp-baja); box-shadow: 0 0 8px var(--obpp-baja); }
      .dot-renov { background: var(--obpp-renov); box-shadow: 0 0 8px var(--obpp-renov); }

      .obpp-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 11px; margin-bottom: 16px; }
      .obpp-kpi-card { background: var(--obpp-bg-card); backdrop-filter: blur(16px); border: 1px solid var(--obpp-border); border-radius: 13px; padding: 13px; position: relative; overflow: hidden; cursor: pointer; transition: var(--obpp-transition-ios); box-shadow: var(--obpp-shadow); }
      .obpp-kpi-card:hover { transform: translateY(-3px); }
      .obpp-kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
      .kpi-total::before { background: var(--obpp-azul); }
      .kpi-alta::before { background: var(--obpp-alta); }
      .kpi-media::before { background: var(--obpp-media); }
      .kpi-baja::before { background: var(--obpp-baja); }
      .kpi-renov::before { background: var(--obpp-renov); }
      .obpp-kpi-title { font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--obpp-text-muted); font-weight: 700; }
      .obpp-kpi-num { font-size: 1.65rem; font-weight: 800; margin: 2px 0; font-variant-numeric: tabular-nums; }
      .obpp-kpi-foot { font-size: 0.66rem; font-weight: 600; line-height: 1.3; }

      .obpp-card-section { background: var(--obpp-bg-card); backdrop-filter: blur(16px); border: 1px solid var(--obpp-border); border-radius: 14px; padding: 16px; margin-bottom: 16px; position: relative; z-index: 1; box-shadow: var(--obpp-shadow); }
      .obpp-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; font-size: 0.82rem; font-weight: 700; }
      .obpp-section-head-title { display: flex; align-items: center; gap: 8px; }
      .obpp-sinco-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-sinco-chip { background: rgba(255, 255, 255, 0.06); border: 1px solid var(--obpp-border); border-radius: 8px; padding: 6px 11px; font-size: 0.71rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--obpp-text); transition: var(--obpp-transition-ios); }
      [data-theme="light"] .obpp-sinco-chip { background: rgba(0, 36, 125, 0.04); }
      .obpp-sinco-chip.active, .obpp-sinco-chip:hover { border-color: var(--obpp-amarillo); background: rgba(var(--obpp-amarillo-rgb), 0.16); color: var(--obpp-amarillo); }

      .obpp-view-toggle-btn { background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: var(--obpp-accent); padding: 5px 12px; border-radius: 7px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .obpp-group-select { background: var(--obpp-input-bg); border: 1px solid var(--obpp-input-border); color: var(--obpp-text); padding: 5px 10px; border-radius: 7px; font-size: 0.72rem; font-weight: 700; outline: none; }
      .obpp-table-view-container { width: 100%; overflow-x: auto; }
      .obpp-detailed-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; }
      .obpp-detailed-table th, .obpp-detailed-table td { padding: 10px 12px; border-bottom: 1px solid var(--obpp-border); }
      .obpp-detailed-table th { background: rgba(15, 23, 42, 0.95); color: var(--obpp-amarillo); font-weight: 800; }
      [data-theme="light"] .obpp-detailed-table th { background: rgba(0, 36, 125, 0.06); color: var(--obpp-azul); }
      .obpp-detailed-table tr:hover { background: rgba(255, 255, 255, 0.03); cursor: pointer; }
      .obpp-detailed-table tr.total-row { background: rgba(37, 99, 235, 0.18); font-weight: 800; border-top: 2px solid var(--obpp-accent); }
      .obpp-mini-bar-bg { width: 64px; height: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; margin-left: 6px; }
      .obpp-mini-bar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #facc15); }

      .obpp-parroquias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; width: 100%; }
      .obpp-bar-item { background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); padding: 9px 12px; border-radius: 9px; cursor: pointer; transition: var(--obpp-transition-ios); }
      .obpp-bar-item:hover { border-color: var(--obpp-accent); transform: translateY(-1px); }
      .obpp-bar-top { display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 5px; gap: 6px; }
      .obpp-bar-bg { height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; display: flex; }
      .obpp-bar-seg-baja { background: var(--obpp-baja); height: 100%; }
      .obpp-bar-seg-renov { background: var(--obpp-renov); height: 100%; }
      .obpp-bar-seg-media { background: var(--obpp-media); height: 100%; }
      .obpp-bar-seg-alta { background: var(--obpp-alta); height: 100%; }
      .obpp-bar-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; font-size: 0.65rem; color: var(--obpp-text-muted); }

      .obpp-pagination-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 12px; background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-radius: 10px; margin-bottom: 12px; }
      .obpp-page-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .obpp-page-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 11px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; }
      .obpp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .obpp-page-size-select { background: var(--obpp-input-bg); border: 1px solid var(--obpp-border); color: var(--obpp-text); padding: 5px 8px; border-radius: 6px; font-size: 0.72rem; }

      .obpp-cc-list { display: flex; flex-direction: column; gap: 10px; }
      .obpp-cc-item { background: var(--obpp-bg-item); border: 1px solid var(--obpp-border); border-left: 5px solid var(--obpp-text-dim); border-radius: 10px; padding: 13px 15px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; transition: var(--obpp-transition-ios); }
      .obpp-cc-item:hover { background: var(--obpp-bg-item-hover); transform: translateY(-1px); }
      .obpp-cc-item.prio-ALTA { border-left-color: var(--obpp-alta); }
      .obpp-cc-item.prio-MEDIA { border-left-color: var(--obpp-media); }
      .obpp-cc-item.prio-BAJA { border-left-color: var(--obpp-baja); }
      .obpp-cc-item.prio-RENOVADO { border-left-color: var(--obpp-renov); }
      .obpp-cc-info { flex: 1; min-width: 280px; }
      .obpp-cc-info h4 { font-size: 0.88rem; font-weight: 700; color: var(--obpp-text); margin: 0 0 7px 0; }
      .obpp-cc-meta { font-size: 0.70rem; color: var(--obpp-text-muted); display: flex; flex-wrap: wrap; gap: 10px; row-gap: 6px; }
      .obpp-meta-tag { display: inline-flex; align-items: center; gap: 4px; }
      .obpp-cc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
      .obpp-badge-row { display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end; }
      .obpp-badge-status { padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; white-space: nowrap; }
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

      .obpp-btn-edit-card { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--obpp-border); color: var(--obpp-amarillo); padding: 4px 10px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
      .obpp-modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(6, 9, 19, 0.85); backdrop-filter: blur(12px); z-index: 5000; align-items: center; justify-content: center; padding: 16px; }
      .obpp-modal-backdrop.show { display: flex; }
      .obpp-modal-box { background: var(--obpp-bg-drawer); border: 1px solid rgba(250, 204, 21, 0.4); border-radius: 14px; width: 100%; max-width: 640px; padding: 20px; max-height: 92vh; overflow-y: auto; }
      .obpp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
      .obpp-form-group { display: flex; flex-direction: column; gap: 4px; }
      .obpp-form-group.full { grid-column: 1 / -1; }
      .obpp-form-group label { font-size: 0.72rem; color: var(--obpp-text-muted); font-weight: 700; }

      @media print {
        body { background: #060913 !important; color: #f8fafc !important; padding: 15px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .main-navbar, .obpp-tricolor-bg, #obppLoader, .obpp-top-actions, .obpp-nav-buttons,
        .obpp-drawer-panel, .obpp-filters-row, .obpp-pagination-bar, .obpp-btn-edit-card,
        .obpp-modal-backdrop, .obpp-kpi-grid, .obpp-top-bar, .top-progress-bar { display: none !important; }
        .obpp-print-header { display: block !important; margin-bottom: 18px !important; padding: 16px 20px !important; background: #0d1322 !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; border-radius: 14px !important; }
        .obpp-meta-card { display: block !important; background: #0d1322 !important; border: 1px solid rgba(250,204,21,0.4) !important; }
        body.print-solo-consolidado #obppSeccionResumen { display: block !important; }
        body.print-solo-consolidado .obpp-card-section:not(#obppSeccionResumen) { display: none !important; }
        body.print-solo-lista #obppSeccionResumen { display: none !important; }
        body.print-solo-lista #obppSeccionListado { display: block !important; }
        body.print-ambos #obppSeccionResumen, body.print-ambos #obppSeccionListado { display: block !important; margin-bottom: 20px !important; }
        .obpp-sinco-strip, .obpp-section-head button, .obpp-section-head select { display: none !important; }
        .obpp-cc-item { break-inside: avoid; }
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
          <div class="obpp-loader-title" id="obppLoaderTitle">Cargando la Matriz A-R</div>
          <div class="obpp-loader-sub" id="obppLoaderSub">Sincronizando 1.370 Consejos Comunales...</div>
          <div class="obpp-progress-container"><div id="obppProgressBarFill" class="obpp-progress-fill"></div></div>
          <div id="obppProgressPercentage" class="obpp-progress-pct">0%</div>
        </div>

        <div class="obpp-print-header" id="obppPrintHeaderInfo">
          <strong id="obppPrintTituloPersonalizado">REPORTE INSTITUCIONAL OBPP FUNDACOMUNAL MONAGAS</strong><br>
          <span id="obppPrintFiltrosActivos">Filtros activos: Todos</span> | <span id="obppPrintMetaResumen">Meta Maturín: 427</span> | Fecha: <span id="obppPrintFechaHoy"></span>
        </div>

        <div class="obpp-top-bar">
          <div class="obpp-brand">
            <div class="obpp-brand-badge">${SVG.cube}</div>
            <div>
              <h2>MONITOR DINÁMICO OBPP MONAGAS</h2>
              <p id="obppInfoSubtitulo">Lectura integral Columnas A-R &bull; Meta Maturín: 427</p>
            </div>
          </div>

          <div class="obpp-top-actions">
            <button class="obpp-btn-action obpp-btn-atras" onclick="window.AppCore && window.AppCore.showDashboardMenu ? window.AppCore.showDashboardMenu() : history.back()">
              ${SVG.back} <span>Atrás</span>
            </button>

            <div class="obpp-dropdown">
              <button class="obpp-btn-action" onclick="window.MonitorOBPP.togglePrintDropdown(event)">
                ${SVG.printer} <span>Imprimir / PDF</span> ${SVG.chevronDown}
              </button>
              <div id="obppPrintDropdown" class="obpp-dropdown-content">
                <button onclick="window.MonitorOBPP.ejecutarImpresion('consolidado')">${SVG.doc} <span>Solo Consolidado</span></button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('lista')">${SVG.list} <span>Lista de Consejos Comunales</span></button>
                <button onclick="window.MonitorOBPP.ejecutarImpresion('ambos')">${SVG.layers} <span>Consolidado y Lista (Ambos)</span></button>
              </div>
            </div>

            <div id="obppActionRegWrap"></div>

            <button class="obpp-btn-action obpp-btn-reset" onclick="window.MonitorOBPP.limpiarFiltros()">
              ${SVG.reset} <span>Limpiar Filtros</span>
            </button>

            <button class="obpp-btn-action" onclick="window.MonitorOBPP.recargarServidor(true)">
              ${SVG.refresh} <span>Actualizar</span>
            </button>
          </div>
        </div>

        <!-- PANEL META MUNICIPAL MATURÍN: 427 -->
        <div class="obpp-meta-card" id="obppMetaMaturinCard" onclick="window.MonitorOBPP.filtrarMaturin()" title="Clic para filtrar exclusivamente al Municipio Maturín">
          <div class="obpp-meta-header">
            <div>
              <span class="obpp-meta-badge">${SVG.target} <span>META MUNICIPAL MATURÍN: <span id="obppMetaValor">427</span></span></span>
              <h3>Cumplimiento Exclusivo MP. MATURIN sobre Meta Fija (427)</h3>
            </div>
            <div class="obpp-meta-pct-wrap">
              <span class="obpp-meta-pct-big" id="obppMetaPctPrincipal">0.00%</span>
              <span class="obpp-meta-pct-sub" id="obppMetaSubConteo">0 / 427 en Maturín (0%) &bull; 0 / 427 Renovados (0%)</span>
            </div>
          </div>
          <div class="obpp-meta-progress-track">
            <div class="obpp-meta-progress-fill" id="obppMetaProgressFill" style="width: 0%;"></div>
          </div>
          <div class="obpp-meta-breakdown">
            <span><strong>Meta Maturín:</strong> 427</span>
            <span><strong>Total en Maturín:</strong> <span id="obppMatTotal">0</span> (<span id="obppMatTotalPct">0%</span> de 427)</span>
            <span style="color:#10b981;"><strong>Vigentes / Registradas (Col L):</strong> <span id="obppMatReg">0</span> (<span id="obppMatRegPct">0%</span> de 427)</span>
            <span style="color:#a855f7;"><strong>Renovados (Col M):</strong> <span id="obppMatRenov">0</span> (<span id="obppMatRenovPct">0%</span> de 427)</span>
            <span style="color:#f59e0b;"><strong>Por Vencer (Col L):</strong> <span id="obppMatVencer">0</span> (<span id="obppMatVencerPct">0%</span> de 427)</span>
            <span style="color:#ef4444;"><strong>Por Renovar (Col L):</strong> <span id="obppMatPorRenovar">0</span> (<span id="obppMatPorRenovarPct">0%</span> de 427)</span>
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
            <span>Comuna</span><span class="obpp-sub-val" id="obppLblComuna">TODAS</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerConsejo')">
            <div class="obpp-nav-icon-box">${SVG.consejo}</div>
            <span>Consejo / Código</span><span class="obpp-sub-val" id="obppLblConsejo">BUSCAR (A-R)</span>
          </button>
          <button class="obpp-nav-btn" onclick="window.MonitorOBPP.abrirDrawer('obppDrawerCalendario')">
            <div class="obpp-nav-icon-box">${SVG.calendario}</div>
            <span>Calendario Venc.</span><span class="obpp-sub-val" id="obppLblCalendario">TODOS LOS DÍAS</span>
          </button>
          <button class="obpp-nav-btn active" onclick="window.MonitorOBPP.scrollResumen()">
            <div class="obpp-nav-icon-box">${SVG.resumen}</div>
            <span>Resumen Condición</span><span class="obpp-sub-val" id="obppLblResumen">PARROQUIAS</span>
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
          <div class="obpp-drawer-header"><span>Filtrar por Nombre de Comuna o Circuito (Columna R)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <select id="obppSelComuna" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('comuna', this.value)"></select>
        </div>

        <div id="obppDrawerConsejo" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Buscar en Nombre CC (G), SITUR (E/F), CNE/SITUR Comuna (P/Q) o Comuna (R)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <input type="text" id="obppTxtBuscarCC" class="obpp-search-input" placeholder="Escriba nombre CC, código SITUR, CNE o nombre de Comuna..." oninput="window.MonitorOBPP.aplicarBusquedaCC(this.value)">
          <select id="obppSelConsejo" class="obpp-filter-select" onchange="window.MonitorOBPP.aplicarFiltro('consejo', this.value)"></select>
        </div>

        <div id="obppDrawerCalendario" class="obpp-drawer-panel">
          <div class="obpp-drawer-header"><span>Filtro por Días por Vencer (Columna K) y Elección Propuesta (Columna N)</span><button class="obpp-close-drawer" onclick="window.MonitorOBPP.cerrarDrawers()">${SVG.close}</button></div>
          <label style="font-size:0.73rem; color:var(--obpp-text-muted); display:block; margin-bottom:4px;">Fecha Tope de Vencimiento SINCO (Columna I):</label>
          <input type="date" id="obppInputFechaTope" class="obpp-date-input" onchange="window.MonitorOBPP.aplicarFiltroCalendario(this.value)">
          <div class="obpp-quick-days-grid">
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VENCIDOS')"><span class="obpp-status-dot dot-alta"></span><span>Vencidos (&lt; 0 días)</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('30DIAS')"><span class="obpp-status-dot dot-media"></span><span>Próximos 30 días</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('31_60')"><span class="obpp-status-dot dot-media"></span><span>31 a 60 días</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('61_90')"><span class="obpp-status-dot dot-todos"></span><span>61 a 90 días</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('VIGENTES')"><span class="obpp-status-dot dot-baja"></span><span>Más de 90 días</span></button>
            <button class="obpp-btn-action" onclick="window.MonitorOBPP.aplicarRangoDias('CON_ELECCION')"><span class="obpp-status-dot dot-renov"></span><span>Con Elección (Col N)</span></button>
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
            <div class="obpp-kpi-title">Total en Selección</div>
            <div class="obpp-kpi-num" id="obppKpiTotal">0</div>
            <div class="obpp-kpi-foot" id="obppKpiTotalPctMeta" style="color:var(--obpp-accent);">0.0% de Meta 427</div>
          </div>
          <div class="obpp-kpi-card kpi-alta" onclick="window.MonitorOBPP.filtrarPrioridad('ALTA')">
            <div class="obpp-kpi-title">Por Renovar (Col L)</div>
            <div class="obpp-kpi-num" id="obppKpiAlta" style="color:var(--obpp-alta);">0</div>
            <div class="obpp-kpi-foot" id="obppPctAlta" style="color:#fca5a5;">Bruto: 0 — Renovados: 0</div>
          </div>
          <div class="obpp-kpi-card kpi-media" onclick="window.MonitorOBPP.filtrarPrioridad('MEDIA')">
            <div class="obpp-kpi-title">Por Vencer (Col L)</div>
            <div class="obpp-kpi-num" id="obppKpiMedia" style="color:var(--obpp-media);">0</div>
            <div class="obpp-kpi-foot" id="obppPctMedia" style="color:#fde68a;">Bruto: 0 — Renovados: 0</div>
          </div>
          <div class="obpp-kpi-card kpi-renov" onclick="window.MonitorOBPP.filtrarPrioridad('RENOVADO')">
            <div class="obpp-kpi-title">Renovados (Col M)</div>
            <div class="obpp-kpi-num" id="obppKpiRenov" style="color:var(--obpp-renov);">0</div>
            <div class="obpp-kpi-foot" id="obppPctRenov" style="color:#e9d5ff;">0.0% del total | 0.0% de Meta 427</div>
          </div>
          <div class="obpp-kpi-card kpi-baja" onclick="window.MonitorOBPP.filtrarPrioridad('BAJA')">
            <div class="obpp-kpi-title">Vocería Registrada (Col L)</div>
            <div class="obpp-kpi-num" id="obppKpiBaja" style="color:var(--obpp-baja);">0</div>
            <div class="obpp-kpi-foot" id="obppPctBaja" style="color:#6ee7b7;">0.0% solventes</div>
          </div>
        </div>

        <div id="obppSeccionResumen" class="obpp-card-section">
          <div class="obpp-section-head">
            <div class="obpp-section-head-title"><span style="color:var(--obpp-amarillo);">${SVG.sinco}</span><span>ESTATUS SINCO (COLUMNA J)</span></div>
          </div>
          <div id="obppContenedorSinco" class="obpp-sinco-strip"></div>

          <div class="obpp-section-head" style="margin-top:6px;">
            <div class="obpp-section-head-title"><span style="color:var(--obpp-accent);">${SVG.resumen}</span><span id="obppTituloDesglose">RESUMEN POR PARROQUIAS (COLUMNA D)</span></div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
              <select id="obppSelAgrupacionResumen" class="obpp-group-select" onchange="window.MonitorOBPP.cambiarAgrupacionResumen(this.value)">
                <option value="PARROQUIAS" selected>Agrupar por: Parroquias (Col D)</option>
                <option value="MUNICIPIOS">Agrupar por: Municipios (Col C)</option>
                <option value="COMUNAS">Agrupar por: Comunas / Circuitos (Col R)</option>
              </select>
              <button class="obpp-view-toggle-btn" onclick="window.MonitorOBPP.alternarVistaResumen()" id="obppBtnToggleView">
                ${SVG.cards} <span>Cambiar a Tarjetas</span>
              </button>
              <span id="obppContadorParroquias" style="font-size:0.72rem; color:var(--obpp-amarillo); font-weight:700;">0</span>
            </div>
          </div>
          <div id="obppContenedorBarrasResumen"></div>
        </div>

        <div id="obppSeccionListado" class="obpp-card-section">
          <div class="obpp-section-head">
            <div class="obpp-section-head-title"><span style="color:var(--obpp-accent);">${SVG.consejo}</span><span>LISTADO DETALLADO DE CONSEJOS COMUNALES (COLUMNAS A - R)</span></div>
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
              <span id="obppTituloModalReg">ACTUALIZAR CONDICIÓN OBPP (A - R)</span>
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
                  <label>Condición Actual (Columna L):</label>
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
                    <option value="EN REVISION">EN REVISION</option>
                  </select>
                </div>
                <div class="obpp-form-group">
                  <label>Renovados / Addendum (Columna M):</label>
                  <select id="obppRegRenovado" class="obpp-filter-select" style="margin:0;" onchange="window.MonitorOBPP.onRenovadoChange(this.value)">
                    <option value="">Sin marca</option>
                    <option value="Renovado">Renovado</option>
                    <option value="NUEVA CONFORMACION">NUEVA CONFORMACION</option>
                  </select>
                </div>
                <div class="obpp-form-group">
                  <label>SITUR Actual (Columna F):</label>
                  <input type="text" id="obppRegSitur" class="obpp-search-input" style="margin:0;">
                </div>
                <div class="obpp-form-group full">
                  <label>Fecha de Vencimiento SINCO (Columna I):</label>
                  <input type="date" id="obppRegFechaVenc" class="obpp-date-input" style="margin:0;">
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
    if (!printListenerBound) {
      printListenerBound = true;
      window.addEventListener('click', function (event) {
        const dd = document.getElementById('obppPrintDropdown');
        if (dd && dd.classList.contains('show') && !event.target.closest('.obpp-dropdown')) {
          dd.classList.remove('show');
        }
      });
    }
  }

  function actualizarBotonRegistroPermisos() {
    const wrap = document.getElementById('obppActionRegWrap');
    if (!wrap) return;
    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === 'function'
      ? window.AppCore.canEditModule('obpp')
      : false;

    wrap.innerHTML = canEdit
      ? `<button class="obpp-btn-action obpp-btn-primary" onclick="window.MonitorOBPP.abrirModalRegistroGeneral()">${SVG.edit} <span>Registro / Editar</span></button>`
      : `<span style="padding:6px 12px; background:rgba(255,204,0,0.12); color:var(--obpp-amarillo); border:1px solid rgba(255,204,0,0.3); font-size:0.72rem; font-weight:700; border-radius:8px;">Solo Lectura</span>`;
  }

  function mostrarLoader(titulo, sub) {
    const lt = document.getElementById('obppLoaderTitle');
    const ls = document.getElementById('obppLoaderSub');
    const ld = document.getElementById('obppLoader');
    if (lt) lt.innerText = titulo || 'Cargando la Matriz A-R';
    if (ls) ls.innerText = sub || 'Sincronizando registros OBPP Monagas...';
    if (ld) {
      ld.classList.remove('fade-out');
      ld.style.display = 'flex';
    }
    let prog = 15;
    const fill = document.getElementById('obppProgressBarFill');
    const txt = document.getElementById('obppProgressPercentage');
    if (fill) fill.style.width = prog + '%';
    if (txt) txt.innerText = prog + '%';
    if (loaderInterval) clearInterval(loaderInterval);
    loaderInterval = setInterval(() => {
      if (prog < 95) {
        prog += Math.floor(Math.random() * 8) + 4;
        if (prog > 95) prog = 95;
        if (fill) fill.style.width = prog + '%';
        if (txt) txt.innerText = prog + '%';
      }
    }, 120);
  }

  function ocultarLoader(ok = true, msg = '') {
    if (loaderInterval) {
      clearInterval(loaderInterval);
      loaderInterval = null;
    }
    const ld = document.getElementById('obppLoader');
    const fill = document.getElementById('obppProgressBarFill');
    const txt = document.getElementById('obppProgressPercentage');
    if (ok) {
      if (fill) fill.style.width = '100%';
      if (txt) txt.innerText = '100%';
      setTimeout(() => {
        if (ld) {
          ld.classList.add('fade-out');
          setTimeout(() => { ld.style.display = 'none'; }, 260);
        }
      }, 260);
    } else {
      if (ld) {
        ld.classList.add('fade-out');
        setTimeout(() => { ld.style.display = 'none'; }, 200);
      }
      if (msg && window.AppCore && typeof window.AppCore.showToast === 'function') {
        window.AppCore.showToast(msg, 'danger');
      }
    }
  }

  async function cargarDatosServidor(forzar = false) {
    const CACHE_KEY = 'OBPP_CACHE_REGISTROS_V7';
    const CACHE_TIME = 'OBPP_CACHE_TIME_V7';
    const ahora = Date.now();
    const ttl = 5 * 60 * 1000;

    if (!forzar) {
      try {
        const rawCache = sessionStorage.getItem(CACHE_KEY);
        const cacheTime = parseInt(sessionStorage.getItem(CACHE_TIME) || '0', 10);
        if (rawCache && (ahora - cacheTime) < ttl) {
          const parsed = JSON.parse(rawCache);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].esPorRenovar !== undefined) {
            baseDatos = parsed;
            const comCount = new Set(baseDatos.map(r => r.comuna).filter(Boolean)).size;
            const sub = document.getElementById('obppInfoSubtitulo');
            if (sub) sub.innerText = `Registros: ${baseDatos.length} | Comunas (Col R): ${comCount} | Meta Maturín: 427`;
            poblarSelectoresCascada();
            actualizarVista();
            return;
          }
        }
      } catch (e) {}
    }

    mostrarLoader('Cargando la Matriz A-R', 'Leyendo 1.370 registros desde Google Sheets...');
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const urlFetch = `${window.AppCore.API_URL}?data=obpp&t=${ahora}`;
        const resp = await fetch(urlFetch);
        const res = await resp.json();

        if (res && res.status === 'error') {
          ocultarLoader(false, 'Servidor: ' + (res.mensaje || res.error));
          return;
        }

        const rawList = (res && Array.isArray(res.registros)) ? res.registros
          : (res && Array.isArray(res.datos)) ? res.datos
          : (res && Array.isArray(res.data)) ? res.data
          : (Array.isArray(res) ? res : null);

        if (rawList) {
          baseDatos = rawList.map((row, idx) => normalizarRegistro(row, idx));
          ocultarLoader(true);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(baseDatos));
            sessionStorage.setItem(CACHE_TIME, ahora.toString());
          } catch (e) {}
          const comCount = new Set(baseDatos.map(r => r.comuna).filter(Boolean)).size;
          const sub = document.getElementById('obppInfoSubtitulo');
          if (sub) {
            sub.innerText = `Hoja: ${(res && res.nombreHoja) || 'MONAGAS_1370CC_OBPP'} | ${baseDatos.length} Reg. | ${comCount} Comunas (Col R) | Meta Maturín: 427`;
          }
          poblarSelectoresCascada();
          actualizarVista();
          return;
        }
      }
    } catch (err) {
      ocultarLoader(false, 'Error de red: ' + err.message);
      return;
    }

    ocultarLoader(true);
    poblarSelectoresCascada();
    actualizarVista();
  }

  function filtrarMaturin() {
    const munList = [...new Set(baseDatos.map(r => r.municipio).filter(Boolean))];
    const targetMun = munList.find(m => sinTildes(m).includes('MATURIN')) || 'MP. MATURIN';
    aplicarFiltro('municipio', targetMun);
  }

  function togglePrintDropdown(e) {
    if (e) e.stopPropagation();
    const d = document.getElementById('obppPrintDropdown');
    if (d) d.classList.toggle('show');
  }

  function ejecutarImpresion(tipo) {
    const d = document.getElementById('obppPrintDropdown');
    if (d) d.classList.remove('show');
    const tituloUsuario = prompt('Ingrese el título personalizado para el reporte institucional:', 'REPORTE INSTITUCIONAL OBPP FUNDACOMUNAL MONAGAS');
    if (tituloUsuario && tituloUsuario.trim()) {
      document.getElementById('obppPrintTituloPersonalizado').innerText = tituloUsuario.trim().toUpperCase();
    }
    const fMun = estadoFiltros.municipio !== 'TODOS' ? `Municipio: ${estadoFiltros.municipio}` : 'Todos los Municipios';
    const fParr = estadoFiltros.parroquia !== 'TODOS' ? ` | Parroquia: ${estadoFiltros.parroquia}` : '';
    const fCom = estadoFiltros.comuna !== 'TODOS' ? ` | Comuna: ${estadoFiltros.comuna}` : '';
    const fPrio = estadoFiltros.prioridad !== 'TODOS' ? ` | Condición: ${estadoFiltros.prioridad}` : '';
    document.getElementById('obppPrintFiltrosActivos').innerText = `${fMun}${fParr}${fCom}${fPrio} (Registros: ${datosFiltradosGlobal.length})`;
    document.getElementById('obppPrintFechaHoy').innerText = new Date().toLocaleDateString('es-VE');

    const metaPct = document.getElementById('obppMetaPctPrincipal');
    const metaSub = document.getElementById('obppMetaSubConteo');
    const printMeta = document.getElementById('obppPrintMetaResumen');
    if (printMeta && metaPct && metaSub) {
      printMeta.innerText = `Meta Maturín 427: ${metaPct.innerText} (${metaSub.innerText})`;
    }

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

  function cambiarAgrupacionResumen(modo) {
    estadoFiltros.agrupacionResumen = modo || 'PARROQUIAS';
    const tit = document.getElementById('obppTituloDesglose');
    const lbl = document.getElementById('obppLblResumen');
    if (modo === 'MUNICIPIOS') {
      if (tit) tit.innerText = 'RESUMEN POR MUNICIPIOS (COLUMNA C)';
      if (lbl) lbl.innerText = 'MUNICIPIOS';
    } else if (modo === 'COMUNAS') {
      if (tit) tit.innerText = 'RESUMEN POR COMUNAS / CIRCUITOS (COLUMNA R)';
      if (lbl) lbl.innerText = 'COMUNAS';
    } else {
      if (tit) tit.innerText = 'RESUMEN POR PARROQUIAS (COLUMNA D)';
      if (lbl) lbl.innerText = 'PARROQUIAS';
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

    const dMun = estadoFiltros.municipio === 'TODOS'
      ? baseDatos
      : baseDatos.filter(r => r.municipio === estadoFiltros.municipio);
    const par = [...new Set(dMun.map(r => r.parroquia).filter(Boolean))].sort();
    llenarSelect('obppSelParroquia', par, estadoFiltros.parroquia, 'TODAS LAS PARROQUIAS');

    const dPar = estadoFiltros.parroquia === 'TODOS'
      ? dMun
      : dMun.filter(r => r.parroquia === estadoFiltros.parroquia);
    const com = [...new Set(dPar.map(r => r.comuna).filter(Boolean))].sort();
    llenarSelect('obppSelComuna', com, estadoFiltros.comuna, 'TODAS LAS COMUNAS');

    const dCom = estadoFiltros.comuna === 'TODOS'
      ? dPar
      : dPar.filter(r => r.comuna === estadoFiltros.comuna);
    const con = [...new Set(dCom.map(r => r.consejo).filter(Boolean))].sort();
    llenarSelect('obppSelConsejo', con, estadoFiltros.consejo, 'TODOS LOS CONSEJOS');
  }

  function llenarSelect(id, opts, act, def) {
    const s = document.getElementById(id);
    if (!s) return;
    let html = `<option value="TODOS">${esc(def)} (${opts.length})</option>`;
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      html += `<option value="${esc(o)}" ${o === act ? 'selected' : ''}>${esc(o)}</option>`;
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
    } else if (campo === 'comuna') {
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
      estadoFiltros.busqueda = sinTildes(txt);
      paginaActual = 1;
      actualizarVista();
    }, 150);
  }

  function aplicarFiltroCalendario(f) {
    estadoFiltros.fechaTope = f;
    estadoFiltros.rangoDias = 'TODOS';
    actualizarEtiquetas();
    paginaActual = 1;
    actualizarVista();
  }

  function aplicarRangoDias(r) {
    estadoFiltros.rangoDias = r;
    estadoFiltros.fechaTope = '';
    const inp = document.getElementById('obppInputFechaTope');
    if (inp) inp.value = '';
    actualizarEtiquetas();
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
    const agruparActual = estadoFiltros.agrupacionResumen;
    estadoFiltros = {
      municipio: 'TODOS',
      parroquia: 'TODOS',
      comuna: 'TODOS',
      consejo: 'TODOS',
      estatusSinco: 'TODOS',
      busqueda: '',
      prioridad: 'TODOS',
      fechaTope: '',
      rangoDias: 'TODOS',
      agrupacionResumen: agruparActual
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
    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppLblMunicipio', estadoFiltros.municipio);
    setT('obppLblParroquia', estadoFiltros.parroquia);
    setT('obppLblComuna', estadoFiltros.comuna);
    setT('obppLblConsejo', estadoFiltros.consejo !== 'TODOS' ? estadoFiltros.consejo : (estadoFiltros.busqueda ? `"${estadoFiltros.busqueda}"` : 'BUSCAR (A-R)'));
    const calMap = {
      TODOS: estadoFiltros.fechaTope ? `HASTA ${estadoFiltros.fechaTope}` : 'TODOS LOS DÍAS',
      VENCIDOS: 'VENCIDOS (< 0)',
      '30DIAS': 'PRÓX. 30 DÍAS',
      '31_60': '31 A 60 DÍAS',
      '61_90': '61 A 90 DÍAS',
      VIGENTES: '> 90 DÍAS',
      CON_ELECCION: 'CON ELECCIÓN (N)'
    };
    setT('obppLblCalendario', calMap[estadoFiltros.rangoDias] || 'TODOS LOS DÍAS');
  }

  /**
   * Meta Municipal Maturín (427): Cálculo exclusivo de MP. MATURIN sin duplicar sumas
   */
  function actualizarMetaMaturinUI() {
    const meta = metasInstitucionales.metaMaturin || 427;
    const enMaturin = baseDatos.filter(r => sinTildes(r.municipio).includes('MATURIN'));

    let totalMat = enMaturin.length;
    let regMat = 0;
    let renovMat = 0;
    let porVencerMat = 0;
    let porRenovarMat = 0;

    for (let i = 0; i < enMaturin.length; i++) {
      const m = enMaturin[i];
      if (m.esRegistrada) regMat++;
      if (m.esPorVencer) porVencerMat++;
      if (m.esPorRenovar) porRenovarMat++;
      if (m.esRenovado) renovMat++;
    }

    // Porcentaje de cumplimiento sobre la meta fija 427 (sin sumar Registradas + Renovados)
    const pctVigentes427 = (regMat / meta) * 100;
    const pctTotal427 = (totalMat / meta) * 100;
    const pctRenov427 = (renovMat / meta) * 100;
    const pctPorVencer427 = (porVencerMat / meta) * 100;
    const pctPorRenovar427 = (porRenovarMat / meta) * 100;

    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppMetaValor', meta);
    setT('obppMetaPctPrincipal', pctVigentes427.toFixed(2) + '%');
    setT(
      'obppMetaSubConteo',
      `${totalMat} / ${meta} en Maturín (${pctTotal427.toFixed(1)}%) • ${renovMat} / ${meta} Renovados (${pctRenov427.toFixed(1)}%)`
    );

    const fill = document.getElementById('obppMetaProgressFill');
    if (fill) fill.style.width = Math.min(100, Math.max(0, pctVigentes427)).toFixed(2) + '%';

    setT('obppMatTotal', totalMat);
    setT('obppMatTotalPct', pctTotal427.toFixed(1) + '%');
    setT('obppMatReg', regMat);
    setT('obppMatRegPct', pctVigentes427.toFixed(1) + '%');
    setT('obppMatRenov', renovMat);
    setT('obppMatRenovPct', pctRenov427.toFixed(1) + '%');
    setT('obppMatVencer', porVencerMat);
    setT('obppMatVencerPct', pctPorVencer427.toFixed(1) + '%');
    setT('obppMatPorRenovar', porRenovarMat);
    setT('obppMatPorRenovarPct', pctPorRenovar427.toFixed(1) + '%');
  }

  function actualizarVista() {
    actualizarMetaMaturinUI();

    const mun = estadoFiltros.municipio;
    const par = estadoFiltros.parroquia;
    const com = estadoFiltros.comuna;
    const con = estadoFiltros.consejo;
    const sinco = estadoFiltros.estatusSinco;
    const busq = estadoFiltros.busqueda;
    const fTope = estadoFiltros.fechaTope;
    const rDias = estadoFiltros.rangoDias;

    const pre = [];
    for (let i = 0; i < baseDatos.length; i++) {
      const r = baseDatos[i];
      if (mun !== 'TODOS' && r.municipio !== mun) continue;
      if (par !== 'TODOS' && r.parroquia !== par) continue;
      if (com !== 'TODOS' && r.comuna !== com) continue;
      if (con !== 'TODOS' && r.consejo !== con) continue;
      if (sinco !== 'TODOS' && r.estatusSinco !== sinco) continue;

      if (busq) {
        const match =
          sinTildes(r.consejo).includes(busq) ||
          sinTildes(r.siturAct).includes(busq) ||
          sinTildes(r.siturAnt).includes(busq) ||
          sinTildes(r.codCne).includes(busq) ||
          sinTildes(r.codSiturComuna).includes(busq) ||
          sinTildes(r.comuna).includes(busq);
        if (!match) continue;
      }

      if (fTope && (!r.fechaVenc || r.fechaVenc > fTope)) continue;
      if (rDias !== 'TODOS') {
        const d = r.dias;
        if (rDias === 'VENCIDOS' && (d === null || d >= 0)) continue;
        if (rDias === '30DIAS' && (d === null || d < 0 || d > 30)) continue;
        if (rDias === '31_60' && (d === null || d < 31 || d > 60)) continue;
        if (rDias === '61_90' && (d === null || d < 61 || d > 90)) continue;
        if (rDias === 'VIGENTES' && (d === null || d <= 90)) continue;
        if (rDias === 'CON_ELECCION' && !r.fechaElec) continue;
      }
      pre.push(r);
    }

    // Conteos estrictos separados entre Columna L (CONDICIÓN ACTUAL) y Columna M (RENOVADOS)
    let totalRegistrada = 0;
    let brutoPorVencer = 0;
    let renovadosPorVencer = 0;
    let brutoPorRenovar = 0;
    let renovadosPorRenovar = 0;
    let totalRenovados = 0;

    for (let i = 0; i < pre.length; i++) {
      const r = pre[i];
      if (r.esRegistrada) totalRegistrada++;
      if (r.esPorVencer) {
        brutoPorVencer++;
        if (r.esRenovado) renovadosPorVencer++;
      }
      if (r.esPorRenovar) {
        brutoPorRenovar++;
        if (r.esRenovado) renovadosPorRenovar++;
      }
      if (r.esRenovado) totalRenovados++;
    }

    const netoPorRenovar = brutoPorRenovar - renovadosPorRenovar;
    const netoPorVencer = brutoPorVencer - renovadosPorVencer;

    const prio = estadoFiltros.prioridad;
    if (prio === 'TODOS') {
      datosFiltradosGlobal = pre;
    } else if (prio === 'ALTA') {
      datosFiltradosGlobal = pre.filter(r => r.esPorRenovar && !r.esRenovado);
    } else if (prio === 'MEDIA') {
      datosFiltradosGlobal = pre.filter(r => r.esPorVencer && !r.esRenovado);
    } else if (prio === 'RENOVADO') {
      datosFiltradosGlobal = pre.filter(r => r.esRenovado);
    } else if (prio === 'BAJA') {
      datosFiltradosGlobal = pre.filter(r => r.esRegistrada);
    } else {
      datosFiltradosGlobal = pre;
    }

    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppCntTodos', pre.length);
    setT('obppCntAlta', netoPorRenovar);
    setT('obppCntMedia', netoPorVencer);
    setT('obppCntRenov', totalRenovados);
    setT('obppCntBaja', totalRegistrada);

    const metaMat = metasInstitucionales.metaMaturin || 427;
    const baseTotal = baseDatos.length || 1;
    setT('obppKpiTotal', datosFiltradosGlobal.length);
    setT('obppKpiTotalPctMeta', `${((datosFiltradosGlobal.length / metaMat) * 100).toFixed(1)}% de Meta 427 • ${((datosFiltradosGlobal.length / baseTotal) * 100).toFixed(1)}% del total`);

    setT('obppKpiAlta', netoPorRenovar);
    setT('obppPctAlta', `Bruto: ${brutoPorRenovar} — Renovados: ${renovadosPorRenovar}`);

    setT('obppKpiMedia', netoPorVencer);
    setT('obppPctMedia', `Bruto: ${brutoPorVencer} — Renovados: ${renovadosPorVencer}`);

    setT('obppKpiRenov', totalRenovados);
    setT('obppPctRenov', `${((totalRenovados / (pre.length || 1)) * 100).toFixed(1)}% del total | ${((totalRenovados / metaMat) * 100).toFixed(1)}% de Meta 427`);

    setT('obppKpiBaja', totalRegistrada);
    setT('obppPctBaja', `${((totalRegistrada / (pre.length || 1)) * 100).toFixed(1)}% solventes`);

    renderizarEstatusSinco(pre);
    renderizarResumenParroquias(datosFiltradosGlobal);
    renderizarListaPaginada();
  }

  function renderizarEstatusSinco(datos) {
    const cont = document.getElementById('obppContenedorSinco');
    if (!cont) return;
    const counts = {};
    for (let i = 0; i < datos.length; i++) {
      const est = datos[i].estatusSinco || 'SIN ESTATUS';
      counts[est] = (counts[est] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    cont.innerHTML = '';
    entries.forEach(([est, cnt]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `obpp-sinco-chip${estadoFiltros.estatusSinco === est ? ' active' : ''}`;
      btn.innerHTML = `<span>${esc(est)}: <strong>${cnt}</strong></span>`;
      btn.onclick = () => filtrarSinco(est);
      cont.appendChild(btn);
    });
  }

  function renderizarResumenParroquias(datos) {
    const cont = document.getElementById('obppContenedorBarrasResumen');
    if (!cont) return;
    cont.innerHTML = '';

    const modo = estadoFiltros.agrupacionResumen || 'PARROQUIAS';
    const map = {};

    datos.forEach(r => {
      const mun = r.municipio || 'SIN MUNICIPIO';
      const parr = r.parroquia || 'SIN PARROQUIA';
      const com = r.comuna || 'SIN COMUNA ASIGNADA';

      let key = parr;
      let filterField = 'parroquia';
      let filterValue = parr;

      if (modo === 'MUNICIPIOS') {
        key = mun;
        filterField = 'municipio';
        filterValue = mun;
      } else if (modo === 'COMUNAS') {
        key = com;
        filterField = 'comuna';
        filterValue = r.comuna || 'TODOS';
      } else {
        key = estadoFiltros.municipio === 'TODOS' ? `${mun} › ${parr}` : parr;
        filterField = 'parroquia';
        filterValue = parr;
      }

      if (!map[key]) {
        map[key] = {
          etiq: key,
          filterField,
          filterValue,
          registrada: 0,
          renovada: 0,
          porVencer: 0,
          porRenovar: 0,
          totalCC: 0
        };
      }

      // Acumulación exacta e independiente sin ocultarse mutuamente
      map[key].totalCC++;
      if (r.esRegistrada) map[key].registrada++;
      if (r.esRenovado) map[key].renovada++;
      if (r.esPorVencer) map[key].porVencer++;
      if (r.esPorRenovar) map[key].porRenovar++;
    });

    const arr = Object.values(map).sort((a, b) => b.totalCC - a.totalCC);
    const cntEl = document.getElementById('obppContadorParroquias');
    const unidad = modo === 'MUNICIPIOS' ? 'municipios' : (modo === 'COMUNAS' ? 'comunas' : 'parroquias');
    if (cntEl) cntEl.innerText = `${arr.length} ${unidad}`;

    const metaMat = metasInstitucionales.metaMaturin || 427;

    if (modoVistaTabla) {
      let sReg = 0, sRen = 0, sVen = 0, sPRen = 0, sTot = 0;
      const wrap = document.createElement('div');
      wrap.className = 'obpp-table-view-container';
      const table = document.createElement('table');
      table.className = 'obpp-detailed-table';
      const colHeader = modo === 'MUNICIPIOS' ? 'Municipio' : (modo === 'COMUNAS' ? 'Comuna / Circuito' : 'Parroquia');

      table.innerHTML = `<thead><tr><th>${colHeader}</th><th>Registrada</th><th>Renovada</th><th>Por Vencer</th><th>Por Renovar</th><th>Total CC</th><th>% Meta 427</th></tr></thead>`;
      const tbody = document.createElement('tbody');

      arr.forEach(info => {
        sReg += info.registrada;
        sRen += info.renovada;
        sVen += info.porVencer;
        sPRen += info.porRenovar;
        sTot += info.totalCC;
        const pctMeta = ((info.totalCC / metaMat) * 100).toFixed(1);
        const barW = Math.min(100, parseFloat(pctMeta));

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${esc(info.etiq)}</strong></td>
          <td style="color:#10b981;">${info.registrada}</td>
          <td style="color:#a855f7;">${info.renovada}</td>
          <td style="color:#f59e0b;">${info.porVencer}</td>
          <td style="color:#ef4444;">${info.porRenovar}</td>
          <td><strong>${info.totalCC}</strong></td>
          <td style="color:var(--obpp-accent); white-space:nowrap;">${pctMeta}%<span class="obpp-mini-bar-bg"><span class="obpp-mini-bar-fill" style="display:block; width:${barW}%;"></span></span></td>
        `;
        tr.onclick = () => {
          if (info.filterValue !== 'TODOS') aplicarFiltro(info.filterField, info.filterValue);
        };
        tbody.appendChild(tr);
      });

      const pctTotMeta = ((sTot / metaMat) * 100).toFixed(1);
      const trTot = document.createElement('tr');
      trTot.className = 'total-row';
      trTot.innerHTML = `
        <td><strong>TOTAL GENERAL</strong></td>
        <td style="color:#6ee7b7;">${sReg}</td>
        <td style="color:#e9d5ff;">${sRen}</td>
        <td style="color:#fde68a;">${sVen}</td>
        <td style="color:#fca5a5;">${sPRen}</td>
        <td><strong>${sTot}</strong></td>
        <td style="color:#facc15;">${pctTotMeta}%</td>
      `;
      tbody.appendChild(trTot);
      table.appendChild(tbody);
      wrap.appendChild(table);
      cont.appendChild(wrap);
    } else {
      const grid = document.createElement('div');
      grid.className = 'obpp-parroquias-grid';
      arr.forEach(info => {
        const totSeg = (info.registrada + info.renovada + info.porVencer + info.porRenovar) || 1;
        const pctMeta = ((info.totalCC / metaMat) * 100).toFixed(1);
        const card = document.createElement('div');
        card.className = 'obpp-bar-item';
        card.innerHTML = `
          <div class="obpp-bar-top">
            <span style="font-weight:700;">${esc(info.etiq)}</span>
            <span style="color:var(--obpp-amarillo); font-weight:800;">${info.totalCC} CC (${pctMeta}%)</span>
          </div>
          <div class="obpp-bar-bg">
            <div class="obpp-bar-seg-baja" style="width:${(info.registrada / totSeg) * 100}%;" title="Registradas: ${info.registrada}"></div>
            <div class="obpp-bar-seg-renov" style="width:${(info.renovada / totSeg) * 100}%;" title="Renovadas: ${info.renovada}"></div>
            <div class="obpp-bar-seg-media" style="width:${(info.porVencer / totSeg) * 100}%;" title="Por Vencer: ${info.porVencer}"></div>
            <div class="obpp-bar-seg-alta" style="width:${(info.porRenovar / totSeg) * 100}%;" title="Por Renovar: ${info.porRenovar}"></div>
          </div>
          <div class="obpp-bar-legend">
            <span style="color:#10b981;">Reg: ${info.registrada}</span>
            <span style="color:#a855f7;">Ren: ${info.renovada}</span>
            <span style="color:#f59e0b;">Ven: ${info.porVencer}</span>
            <span style="color:#ef4444;">Renov: ${info.porRenovar}</span>
          </div>
        `;
        card.onclick = () => {
          if (info.filterValue !== 'TODOS') aplicarFiltro(info.filterField, info.filterValue);
        };
        grid.appendChild(card);
      });
      cont.appendChild(grid);
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

    const canEdit = window.AppCore && typeof window.AppCore.canEditModule === 'function'
      ? window.AppCore.canEditModule('obpp')
      : false;

    const total = datosFiltradosGlobal.length;
    totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const ini = (paginaActual - 1) * tamanoPagina;
    const fin = Math.min(ini + tamanoPagina, total);
    const lote = datosFiltradosGlobal.slice(ini, fin);

    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
    setT('obppContadorListaCC', `${total > 0 ? ini + 1 : 0} - ${fin} de ${total}`);
    setT('obppInfoPagina', `Página ${paginaActual} de ${totalPaginas}`);

    ['obppBtnFirst', 'obppBtnPrev'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = (paginaActual <= 1); });
    ['obppBtnNext', 'obppBtnLast'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = (paginaActual >= totalPaginas); });

    if (lote.length === 0) {
      cont.innerHTML = `<div style="padding:34px; text-align:center; color:var(--obpp-text-muted); font-size:0.88rem;">No se encontraron Consejos Comunales con los filtros aplicados.</div>`;
      return;
    }

    cont.innerHTML = lote.map(r => {
      const diasBadgeClass = r.dias === null ? 'obpp-badge-SINCO' : (r.dias < 0 ? 'obpp-badge-ALTA' : (r.dias <= 30 ? 'obpp-badge-MEDIA' : 'obpp-badge-BAJA'));
      return `
        <div class="obpp-cc-item prio-${esc(r.prioridad)}">
          <div class="obpp-cc-info">
            <h4><span style="color:var(--obpp-text-dim); font-size:0.75rem; margin-right:6px;">#${esc(r.num)}</span>${esc(r.consejo)}</h4>
            <div class="obpp-cc-meta">
              <span class="obpp-meta-tag">${SVG.municipio} <span>${esc(r.estado)} &bull; ${esc(r.municipio)}</span></span>
              <span class="obpp-meta-tag">${SVG.parroquia} <span>${esc(r.parroquia || 'SIN PARROQUIA')}</span></span>
              <span class="obpp-meta-tag">${SVG.comuna} <span>${esc(r.tipoAgrup)}: <strong>${esc(r.comuna || 'SIN COMUNA ASIGNADA')}</strong></span></span>
              <span class="obpp-meta-tag">${SVG.calendario} <span>Reg: ${esc(r.fechaReg || '—')} | Vence: <strong>${esc(r.fechaVenc || 'S/F')}</strong> | Elección: ${esc(r.fechaElec || '—')}</span></span>
              <span class="obpp-meta-tag" style="color:var(--obpp-accent); font-family:monospace;">SITUR Act: ${esc(r.siturAct || '—')} | Ant: ${esc(r.siturAnt || '—')}</span>
              <span class="obpp-meta-tag" style="color:var(--obpp-amarillo); font-family:monospace;">CNE: ${esc(r.codCne || '—')} | SITUR Comuna: ${esc(r.codSiturComuna || '—')}</span>
            </div>
          </div>
          <div class="obpp-cc-right">
            <div class="obpp-badge-row">
              <span class="obpp-badge-status obpp-badge-SINCO">SINCO: ${esc(r.estatusSinco)}</span>
              <span class="obpp-badge-status ${diasBadgeClass}">${esc(r.diasTexto)}</span>
              <span class="obpp-badge-status obpp-badge-${esc(r.condicionBase)}">${esc(r.condicion)}</span>
              ${r.renovado ? `<span class="obpp-badge-status obpp-badge-RENOVADO">${esc(r.renovado)}</span>` : ''}
            </div>
            ${canEdit
              ? `<button class="obpp-btn-edit-card" onclick="window.MonitorOBPP.abrirModalEdicionFila(${r.filaSheet})">${SVG.edit} <span>Editar</span></button>`
              : `<span style="font-size:0.68rem; color:var(--obpp-text-dim); padding:2px 8px; background:rgba(255,255,255,0.04); border-radius:4px;">Solo Lectura</span>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  function cambiarModoModal(modo) {
    modoModal = modo;
    const tabEdit = document.getElementById('obppTabModoEditar');
    const tabNuevo = document.getElementById('obppTabModoNuevo');
    const bloq = document.getElementById('obppBloqueBuscadorModal');
    const tit = document.getElementById('obppTituloModalReg');

    if (modo === 'NUEVO') {
      if (tabNuevo) tabNuevo.style.borderColor = 'var(--obpp-amarillo)';
      if (tabEdit) tabEdit.style.borderColor = 'var(--obpp-border)';
      if (bloq) bloq.style.display = 'none';
      if (tit) tit.innerText = 'REGISTRAR NUEVO CONSEJO COMUNAL';
      ['obppHidFilaSheet', 'obppRegConsejo', 'obppRegParroquia', 'obppRegComuna', 'obppRegSitur', 'obppRegFechaVenc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      document.getElementById('obppRegCondicion').value = 'VOCERIA REGISTRADA';
      document.getElementById('obppRegEstatusSinco').value = 'REGISTRADA';
      document.getElementById('obppRegRenovado').value = '';
    } else {
      if (tabEdit) tabEdit.style.borderColor = 'var(--obpp-amarillo)';
      if (tabNuevo) tabNuevo.style.borderColor = 'var(--obpp-border)';
      if (bloq) bloq.style.display = 'block';
      if (tit) tit.innerText = 'ACTUALIZAR CONDICIÓN OBPP (A - R)';
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
      if (!Array.from(sel.options).some(o => o.value == fila)) {
        const opt = document.createElement('option');
        opt.value = fila;
        opt.text = `${reg.consejo} (${reg.parroquia})`;
        sel.add(opt, 0);
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
    if (sinTildes(val).includes('RENOVADO')) {
      const e = document.getElementById('obppRegEstatusSinco');
      if (e) e.value = 'TERRITORIO';
    }
  }

  function filtrarSelectModalCC(txt) {
    const sel = document.getElementById('obppSelModalCC');
    if (!sel) return;
    const q = sinTildes(txt);
    const filtrados = baseDatos.filter(r => !q || sinTildes(r.consejo).includes(q)).slice(0, 300);
    sel.innerHTML = filtrados.map(r => `<option value="${r.filaSheet}">${esc(r.consejo)} (${esc(r.parroquia)})</option>`).join('');
  }

  function cargarDatosCCEnModal(fila) {
    const reg = baseDatos.find(r => r.filaSheet == fila);
    if (!reg) return;
    document.getElementById('obppHidFilaSheet').value = reg.filaSheet;
    document.getElementById('obppRegConsejo').value = reg.consejo;
    document.getElementById('obppRegParroquia').value = reg.parroquia || '';
    document.getElementById('obppRegComuna').value = reg.comuna || '';
    document.getElementById('obppRegCondicion').value = reg.condicion;
    document.getElementById('obppRegEstatusSinco').value = reg.estatusSinco;
    document.getElementById('obppRegRenovado').value = reg.renovado || '';
    document.getElementById('obppRegSitur').value = reg.siturAct || '';
    document.getElementById('obppRegFechaVenc').value = reg.fechaVenc || '';
  }

  async function guardarCambiosFormulario(e) {
    if (e && e.preventDefault) e.preventDefault();
    const g = id => document.getElementById(id).value;
    const payload = {
      accion: 'guardar_registro_obpp',
      modulo: 'obpp',
      modo: modoModal,
      filaSheet: g('obppHidFilaSheet'),
      consejo: textoLimpio(g('obppRegConsejo')),
      parroquia: textoLimpio(g('obppRegParroquia')),
      comuna: textoLimpio(g('obppRegComuna')),
      condicion: textoLimpio(g('obppRegCondicion')),
      estatusSinco: textoLimpio(g('obppRegEstatusSinco')),
      renovado: g('obppRegRenovado').trim(),
      siturAct: textoLimpio(g('obppRegSitur')),
      fechaVenc: g('obppRegFechaVenc')
    };

    cerrarModalRegistro();

    if (modoModal === 'EDITAR' && payload.filaSheet) {
      const idx = baseDatos.findIndex(x => x.filaSheet == payload.filaSheet);
      if (idx !== -1) {
        baseDatos[idx] = normalizarRegistro({ ...baseDatos[idx], ...payload }, idx);
        actualizarVista();
      }
    }

    if (window.AppCore && typeof window.AppCore.showLoading === 'function') {
      window.AppCore.showLoading('Sincronizando cambios en el Servidor Central...');
    }

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === 'function') {
        await window.AppCore.updateRecord(payload);
        if (window.AppCore) {
          if (typeof window.AppCore.hideLoading === 'function') window.AppCore.hideLoading();
          if (typeof window.AppCore.showToast === 'function') {
            window.AppCore.showToast('Consejo Comunal actualizado con éxito en el Servidor Central.', 'success');
          }
        }
      }
    } catch (err) {
      if (window.AppCore) {
        if (typeof window.AppCore.hideLoading === 'function') window.AppCore.hideLoading();
        if (typeof window.AppCore.showToast === 'function') {
          window.AppCore.showToast('Error de sincronización con el Servidor Central.', 'danger');
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
    filtrarMaturin,
    togglePrintDropdown,
    ejecutarImpresion,
    alternarVistaResumen,
    cambiarAgrupacionResumen,
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
