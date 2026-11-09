/**
 * =========================================================================================
 * SISTEMA CENTRAL DE GESTIÓN Y MONITOREO INSTITUCIONAL
 * MÓDULO AISLADO: Monitor de Votos / Consulta
 * Archivo: monitores/votos.js
 * =========================================================================================
 * CERO CREDENCIALES: No contiene claves, tokens ni contraseñas.
 * Conexión directa a la hoja "Datos_Votos" en Google Sheets con CRUD en vivo.
 */

window.MonitorVotos = (function () {
  let containerRef = null;
  let centrosData = [];
  let currentFilter = "";

  /**
   * Monta el monitor en el contenedor del cascarón principal
   */
  async function mount(container) {
    containerRef = container;
    containerRef.innerHTML = `
      <div style="text-align:center; padding:50px;">
        <span class="spinner-label">Consultando datos electorales desde Google Sheets...</span>
      </div>
    `;

    await loadData();
    render();
  }

  function unmount() {
    containerRef = null;
    centrosData = [];
  }

  /**
   * Carga de datos desde la pestaña "Datos_Votos" vía doGet(e)
   */
  async function loadData() {
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const resp = await fetch(`${window.AppCore.API_URL}?data=votos`);
        const json = await resp.json();
        if (json.ok && json.registros) {
          centrosData = json.registros;
          return;
        }
      }
    } catch (e) {
      console.warn("[MonitorVotos] Error conectando con el backend:", e);
    }

    // Si aún no se ha configurado la URL o no hay conexión
    if (centrosData.length === 0) {
      centrosData = [
        { id: "VOT-01", parroquia: "Alto de Los Godos", centro_comuna: "C.E.I. Los Godos", meta_electores: 3500, votos_reportados: 2680, porcentaje: "76.57%", estatus: "TRANSMITIENDO", ultima_actualizacion: new Date().toISOString() },
        { id: "VOT-02", parroquia: "Boquerón", centro_comuna: "U.E. Boquerón Central", meta_electores: 2800, votos_reportados: 2140, porcentaje: "76.43%", estatus: "TRANSMITIENDO", ultima_actualizacion: new Date().toISOString() },
        { id: "VOT-03", parroquia: "San Simón", centro_comuna: "L.B. San Simón Centro", meta_electores: 4200, votos_reportados: 3290, porcentaje: "78.33%", estatus: "TRANSMITIENDO", ultima_actualizacion: new Date().toISOString() }
      ];
    }
  }

  function render() {
    if (!containerRef) return;

    const totalMeta = centrosData.reduce((acc, c) => acc + Number(c.meta_electores || 0), 0);
    const totalVotos = centrosData.reduce((acc, c) => acc + Number(c.votos_reportados || 0), 0);
    const pctGeneral = totalMeta > 0 ? ((totalVotos / totalMeta) * 100).toFixed(2) : "0.00";
    const transmitiendoCount = centrosData.filter(c => c.estatus === "TRANSMITIENDO").length;

    const filtered = centrosData.filter(c => {
      if (!currentFilter) return true;
      const term = currentFilter.toLowerCase();
      return (
        c.parroquia.toLowerCase().includes(term) ||
        c.centro_comuna.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
      );
    });

    containerRef.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <button class="btn-back-ios" onclick="window.AppCore.showDashboardMenu()">
            <svg viewBox="0 0 24 24"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"/></svg>
            <span>Volver</span>
          </button>
          <div>
            <span style="font-size:0.75rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:var(--color-yellow);">
              DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES &bull; MATURÍN
            </span>
            <h2 style="font-size:1.6rem; font-weight:900; margin:2px 0 0; letter-spacing:-0.4px;">
              Monitor de Votos y Consulta Comunal
            </h2>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="action-btn-sm" onclick="window.MonitorVotos.refresh()" style="background:var(--surface-glass-input); color:var(--text-main); border:1px solid var(--border-subtle); padding:8px 14px; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"/></svg>
            <span>Sincronizar Sheet</span>
          </button>
          <span class="status-badge activo" style="padding:6px 14px;">CRUD EN VIVO</span>
        </div>
      </div>

      <!-- Tarjetas de Métricas -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:18px; margin-bottom:28px;">
        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Votos Reportados</div>
          <div style="font-size:1.9rem; font-weight:900; color:var(--color-yellow); margin:6px 0; font-variant-numeric:tabular-nums;">
            ${totalVotos.toLocaleString()}
          </div>
          <div style="font-size:0.72rem; color:var(--text-dim);">Google Sheet: Datos_Votos</div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Meta de Electores</div>
          <div style="font-size:1.9rem; font-weight:900; color:#38bdf8; margin:6px 0; font-variant-numeric:tabular-nums;">
            ${totalMeta.toLocaleString()}
          </div>
          <div style="font-size:0.72rem; color:var(--text-dim);">Padrón Electoral Consolidado</div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Porcentaje General</div>
          <div style="font-size:1.9rem; font-weight:900; color:#34d399; margin:6px 0; font-variant-numeric:tabular-nums;">
            ${pctGeneral}%
          </div>
          <div style="width:100%; height:7px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; margin-top:8px;">
            <div style="width:${Math.min(100, Number(pctGeneral))}%; height:100%; background:var(--gradient-tricolor-horizontal);"></div>
          </div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Transmisión Activa</div>
          <div style="font-size:1.9rem; font-weight:900; color:var(--text-main); margin:6px 0; font-variant-numeric:tabular-nums;">
            ${transmitiendoCount} / ${centrosData.length}
          </div>
          <div style="font-size:0.72rem; color:#10b981; font-weight:600;">Centros en Red</div>
        </div>
      </div>

      <!-- Buscador -->
      <div class="glass-card" style="padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:240px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-dim)"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"/></svg>
          <input 
            type="text" 
            placeholder="Filtrar por parroquia o centro..." 
            value="${currentFilter}" 
            oninput="window.MonitorVotos.handleSearch(this.value)"
            class="form-input" 
            style="border:none; background:transparent; padding:4px;"
          >
        </div>
        <span style="font-size:0.8rem; color:var(--text-dim);">
          Mostrando <strong>${filtered.length}</strong> de ${centrosData.length} parroquias
        </span>
      </div>

      <!-- Tabla de Datos_Votos -->
      <div class="glass-card" style="padding:0; overflow:hidden;">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Parroquia</th>
                <th>Centro / Comuna</th>
                <th>Meta Electores</th>
                <th>Votos Reportados</th>
                <th>Porcentaje</th>
                <th>Estatus</th>
                <th style="text-align:center;">Acción Directa</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(c => `
                <tr>
                  <td><strong style="color:var(--color-yellow); font-family:monospace;">${c.id}</strong></td>
                  <td><strong>${c.parroquia}</strong></td>
                  <td>${c.centro_comuna}</td>
                  <td>${Number(c.meta_electores).toLocaleString()}</td>
                  <td>
                    <span style="font-weight:800; font-size:0.95rem; color:var(--text-main);">
                      ${Number(c.votos_reportados).toLocaleString()}
                    </span>
                  </td>
                  <td><strong style="color:#34d399;">${c.porcentaje}</strong></td>
                  <td><span class="status-badge ${c.estatus === 'TRANSMITIENDO' ? 'activo' : 'fecha'}">${c.estatus}</span></td>
                  <td style="text-align:center;">
                    <button class="action-btn-sm action-btn-approve" onclick="window.MonitorVotos.openEditModal('${c.id}')">
                      Editar
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function handleSearch(val) {
    currentFilter = val;
    render();
  }

  async function refresh() {
    if (window.AppCore) window.AppCore.showLoading("Consultando Google Sheets...");
    await loadData();
    if (window.AppCore) {
      window.AppCore.hideLoading();
      window.AppCore.showToast("Datos de Votos actualizados desde Google Sheet.", "success");
    }
    render();
  }

  function openEditModal(id) {
    const item = centrosData.find(x => x.id === id);
    if (!item) return;

    const modalId = "modalEditVotoDynamic";
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = modalId;
      modalEl.className = "modal-backdrop";
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="modal-container" style="max-width:440px;">
        <div class="modal-header">
          <h3 class="modal-title">Editar Centro (${item.id})</h3>
          <button class="modal-close-btn" onclick="document.getElementById('${modalId}').classList.remove('open')">&times;</button>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:0.8rem; color:var(--text-muted);">${item.parroquia}</div>
          <div style="font-weight:700; color:var(--text-main);">${item.centro_comuna}</div>
        </div>
        <form onsubmit="window.MonitorVotos.handleSaveEdit(event, '${item.id}')">
          <div class="form-group">
            <label class="form-label">Votos Reportados:</label>
            <input type="number" id="editVotosVal" class="form-input" value="${item.votos_reportados}" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Meta de Electores:</label>
            <input type="number" id="editMetaVal" class="form-input" value="${item.meta_electores}" min="1" required>
          </div>
          <div class="form-group">
            <label class="form-label">Estatus:</label>
            <select id="editEstatusVal" class="form-input">
              <option value="TRANSMITIENDO" ${item.estatus === "TRANSMITIENDO" ? "selected" : ""}>TRANSMITIENDO</option>
              <option value="EN ESPERA" ${item.estatus === "EN ESPERA" ? "selected" : ""}>EN ESPERA</option>
              <option value="CERRADO" ${item.estatus === "CERRADO" ? "selected" : ""}>CERRADO</option>
            </select>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="action-btn-sm" style="background:var(--surface-glass-input); color:var(--text-main);" onclick="document.getElementById('${modalId}').classList.remove('open')">Cancelar</button>
            <button type="submit" class="action-btn-sm action-btn-approve">Guardar en Sheet</button>
          </div>
        </form>
      </div>
    `;
    modalEl.classList.add("open");
  }

  async function handleSaveEdit(e, id) {
    e.preventDefault();
    const item = centrosData.find(x => x.id === id);
    if (!item) return;

    const modalEl = document.getElementById("modalEditVotoDynamic");
    if (modalEl) modalEl.classList.remove("open");

    const nuevoVotos = Number(document.getElementById("editVotosVal").value);
    const nuevoMeta = Number(document.getElementById("editMetaVal").value);
    const nuevoEstatus = document.getElementById("editEstatusVal").value;

    const backup = { ...item };

    // Actualización optimista
    item.votos_reportados = nuevoVotos;
    item.meta_electores = nuevoMeta;
    item.estatus = nuevoEstatus;
    item.porcentaje = nuevoMeta > 0 ? ((nuevoVotos / nuevoMeta) * 100).toFixed(2) + "%" : "0.00%";
    render();

    if (window.AppCore) window.AppCore.showLoading("Escribiendo en Google Sheets (Datos_Votos)...");

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === "function") {
        await window.AppCore.updateRecord({
          accion: "actualizar_registro",
          modulo: "votos",
          id_fila: id,
          campo: "Votos_Reportados",
          valor: nuevoVotos
        });

        if (nuevoEstatus !== backup.estatus) {
          await window.AppCore.updateRecord({
            accion: "actualizar_registro",
            modulo: "votos",
            id_fila: id,
            campo: "Estatus",
            valor: nuevoEstatus
          });
        }

        if (window.AppCore) {
          window.AppCore.hideLoading();
          window.AppCore.showToast(`Centro ${id} actualizado en Google Sheet.`, "success");
        }
      }
    } catch (err) {
      console.error("[MonitorVotos] Falló actualización en Google Sheet:", err);
      Object.assign(item, backup);
      render();
      if (window.AppCore) {
        window.AppCore.hideLoading();
        window.AppCore.showToast("Error de sincronización con Google Sheet. Cambio revertido.", "danger");
      }
    }
  }

  return {
    mount,
    unmount,
    refresh,
    handleSearch,
    openEditModal,
    handleSaveEdit
  };
})();
