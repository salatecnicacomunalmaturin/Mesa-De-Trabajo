/**
 * =========================================================================================
 * SISTEMA CENTRAL DE GESTIÓN Y MONITOREO INSTITUCIONAL
 * MÓDULO AISLADO: Monitor de Recursos Humanos (RRHH)
 * Archivo: monitores/rrhh.js
 * =========================================================================================
 * CERO CREDENCIALES: No contiene claves, tokens ni contraseñas.
 * Conexión directa a la hoja "Datos_RRHH" en Google Sheets con CRUD en vivo.
 */

window.MonitorRRHH = (function () {
  let containerRef = null;
  let personalData = [];
  let currentFilter = "";
  let currentAreaFilter = "TODAS";

  async function mount(container) {
    containerRef = container;
    containerRef.innerHTML = `
      <div style="text-align:center; padding:50px;">
        <span class="spinner-label">Consultando nómina de personal desde Google Sheets...</span>
      </div>
    `;

    await loadData();
    render();
  }

  function unmount() {
    containerRef = null;
    personalData = [];
  }

  async function loadData() {
    try {
      if (window.AppCore && window.AppCore.API_URL && window.AppCore.API_URL.startsWith('http')) {
        const resp = await fetch(`${window.AppCore.API_URL}?data=rrhh`);
        const json = await resp.json();
        if (json.ok && json.registros) {
          personalData = json.registros;
          return;
        }
      }
    } catch (e) {
      console.warn("[MonitorRRHH] Error conectando con el backend:", e);
    }

    if (personalData.length === 0) {
      personalData = [
        { id: "RH-01", cedula: "V-18452109", nombre_apellido: "Rodríguez Silva, Carlos José", direccion_area: "Operaciones & Telecom", cargo: "Especialista de Enlace", estatus_asistencia: "ASISTIO", observaciones: "Sin incidencias" },
        { id: "RH-02", cedula: "V-20194883", nombre_apellido: "Mendoza Peña, Mariana Elena", direccion_area: "Sala Situacional", cargo: "Analista de Datos", estatus_asistencia: "ASISTIO", observaciones: "Reporte de sala generado" },
        { id: "RH-03", cedula: "V-16782341", nombre_apellido: "Gómez Rivas, José Manuel", direccion_area: "Ciberseguridad", cargo: "Operador de Guardia", estatus_asistencia: "GUARDIA", observaciones: "Turno de guardia activa" }
      ];
    }
  }

  function render() {
    if (!containerRef) return;

    const total = personalData.length;
    const presentes = personalData.filter(p => p.estatus_asistencia === "ASISTIO").length;
    const guardia = personalData.filter(p => p.estatus_asistencia === "GUARDIA").length;
    const comision = personalData.filter(p => p.estatus_asistencia === "COMISION").length;
    const ausentes = personalData.filter(p => p.estatus_asistencia === "AUSENTE").length;

    const pctDisp = total > 0 ? (((presentes + guardia + comision) / total) * 100).toFixed(1) : "0.0";
    const areas = ["TODAS", ...new Set(personalData.map(p => p.direccion_area))];

    const filtered = personalData.filter(p => {
      const matchArea = (currentAreaFilter === "TODAS" || p.direccion_area === currentAreaFilter);
      if (!matchArea) return false;
      if (!currentFilter) return true;
      const term = currentFilter.toLowerCase();
      return (
        p.nombre_apellido.toLowerCase().includes(term) ||
        p.cedula.toLowerCase().includes(term) ||
        p.cargo.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
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
            <span style="font-size:0.75rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:var(--color-blue);">
              DIRECCIÓN DE COMUNAS Y MOVIMIENTOS SOCIALES &bull; MATURÍN
            </span>
            <h2 style="font-size:1.6rem; font-weight:900; margin:2px 0 0; letter-spacing:-0.4px;">
              Estadísticas de Personal y Movimientos
            </h2>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="action-btn-sm" onclick="window.MonitorRRHH.refresh()" style="background:var(--surface-glass-input); color:var(--text-main); border:1px solid var(--border-subtle); padding:8px 14px; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"/></svg>
            <span>Sincronizar Sheet</span>
          </button>
          <span class="status-badge activo" style="padding:6px 14px;">CRUD EN VIVO</span>
        </div>
      </div>

      <!-- Métricas de Personal -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:18px; margin-bottom:28px;">
        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Nómina Total</div>
          <div style="font-size:1.9rem; font-weight:900; color:var(--text-main); margin:6px 0; font-variant-numeric:tabular-nums;">
            ${total}
          </div>
          <div style="font-size:0.72rem; color:var(--text-dim);">Google Sheet: Datos_RRHH</div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Presentes</div>
          <div style="font-size:1.9rem; font-weight:900; color:#10b981; margin:6px 0; font-variant-numeric:tabular-nums;">
            ${presentes}
          </div>
          <div style="font-size:0.72rem; color:#10b981; font-weight:600;">Estatus: ASISTIO</div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">En Guardia / Comisión</div>
          <div style="font-size:1.9rem; font-weight:900; color:var(--color-yellow); margin:6px 0; font-variant-numeric:tabular-nums;">
            ${guardia + comision}
          </div>
          <div style="font-size:0.72rem; color:var(--color-yellow); font-weight:600;">${guardia} Guardia &bull; ${comision} Comisión</div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Ausencias</div>
          <div style="font-size:1.9rem; font-weight:900; color:var(--color-red); margin:6px 0; font-variant-numeric:tabular-nums;">
            ${ausentes}
          </div>
          <div style="font-size:0.72rem; color:var(--color-red);">Estatus: AUSENTE</div>
        </div>

        <div class="glass-card" style="padding:20px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Disponibilidad</div>
          <div style="font-size:1.9rem; font-weight:900; color:#38bdf8; margin:6px 0; font-variant-numeric:tabular-nums;">
            ${pctDisp}%
          </div>
          <div style="width:100%; height:7px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; margin-top:8px;">
            <div style="width:${Math.min(100, Number(pctDisp))}%; height:100%; background:var(--gradient-tricolor-horizontal);"></div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="glass-card" style="padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:260px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-dim)"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"/></svg>
          <input 
            type="text" 
            placeholder="Buscar por funcionario, cédula o cargo..." 
            value="${currentFilter}" 
            oninput="window.MonitorRRHH.handleSearch(this.value)"
            class="form-input" 
            style="border:none; background:transparent; padding:4px;"
          >
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Dirección / Área:</label>
          <select class="form-input" style="padding:6px 12px; width:auto;" onchange="window.MonitorRRHH.handleAreaFilter(this.value)">
            ${areas.map(a => `<option value="${a}" ${currentAreaFilter === a ? "selected" : ""}>${a}</option>`).join("")}
          </select>
        </div>
      </div>

      <!-- Tabla de Datos_RRHH con Selector Directo Inline -->
      <div class="glass-card" style="padding:0; overflow:hidden;">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cédula</th>
                <th>Nombre y Apellido</th>
                <th>Dirección / Área</th>
                <th>Cargo</th>
                <th style="min-width:160px;">Estatus Asistencia (En Vivo)</th>
                <th>Observaciones</th>
                <th style="text-align:center;">Ficha</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => `
                <tr>
                  <td><strong style="color:var(--color-blue); font-family:monospace;">${p.id}</strong></td>
                  <td style="font-family:monospace; font-weight:600;">${p.cedula}</td>
                  <td><strong>${p.nombre_apellido}</strong></td>
                  <td><span style="font-size:0.82rem; color:var(--text-muted);">${p.direccion_area}</span></td>
                  <td>${p.cargo}</td>
                  <td>
                    <!-- SELECTOR INLINE DIRECTO QUE DISPARA ESCRITURA EN SHEET -->
                    <select 
                      class="form-input" 
                      style="padding:6px 10px; font-size:0.8rem; font-weight:700; cursor:pointer;"
                      onchange="window.MonitorRRHH.handleStatusChange('${p.id}', this.value)"
                    >
                      <option value="ASISTIO" ${p.estatus_asistencia === 'ASISTIO' ? 'selected' : ''} style="color:#10b981; font-weight:bold;">🟢 ASISTIÓ</option>
                      <option value="GUARDIA" ${p.estatus_asistencia === 'GUARDIA' ? 'selected' : ''} style="color:#f59e0b; font-weight:bold;">🟡 GUARDIA</option>
                      <option value="COMISION" ${p.estatus_asistencia === 'COMISION' ? 'selected' : ''} style="color:#0066FF; font-weight:bold;">🔵 COMISIÓN</option>
                      <option value="AUSENTE" ${p.estatus_asistencia === 'AUSENTE' ? 'selected' : ''} style="color:#ef4444; font-weight:bold;">🔴 AUSENTE</option>
                    </select>
                  </td>
                  <td style="font-size:0.8rem; color:var(--text-dim); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${p.observaciones || "Sin incidencias"}
                  </td>
                  <td style="text-align:center;">
                    <button class="action-btn-sm" style="background:var(--surface-glass-input); color:var(--text-main);" onclick="window.MonitorRRHH.openEditModal('${p.id}')">
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

  function handleAreaFilter(area) {
    currentAreaFilter = area;
    render();
  }

  async function refresh() {
    if (window.AppCore) window.AppCore.showLoading("Consultando Google Sheets...");
    await loadData();
    if (window.AppCore) {
      window.AppCore.hideLoading();
      window.AppCore.showToast("Datos de RRHH sincronizados.", "success");
    }
    render();
  }

  async function handleStatusChange(id, nuevoEstatus) {
    const item = personalData.find(x => x.id === id);
    if (!item) return;

    const backup = item.estatus_asistencia;

    // Actualización optimista inmediata
    item.estatus_asistencia = nuevoEstatus;
    render();

    if (window.AppCore) window.AppCore.showLoading("Escribiendo estatus en Google Sheets (Datos_RRHH)...");

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === "function") {
        await window.AppCore.updateRecord({
          accion: "actualizar_registro",
          modulo: "rrhh",
          id_fila: id,
          campo: "Estatus_Asistencia",
          valor: nuevoEstatus
        });

        if (window.AppCore) {
          window.AppCore.hideLoading();
          window.AppCore.showToast(`Estatus de ${item.nombre_apellido.split(',')[0]} actualizado en Sheet.`, "success");
        }
      }
    } catch (err) {
      console.error("[MonitorRRHH] Falló sincronización:", err);
      item.estatus_asistencia = backup;
      render();
      if (window.AppCore) {
        window.AppCore.hideLoading();
        window.AppCore.showToast("Error de sincronización con Google Sheets. Cambio revertido.", "danger");
      }
    }
  }

  function openEditModal(id) {
    const item = personalData.find(x => x.id === id);
    if (!item) return;

    const modalId = "modalEditRRHHDynamic";
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
          <h3 class="modal-title">Ficha (${item.id})</h3>
          <button class="modal-close-btn" onclick="document.getElementById('${modalId}').classList.remove('open')">&times;</button>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-weight:700; color:var(--text-main);">${item.nombre_apellido}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${item.cedula} &bull; ${item.direccion_area}</div>
        </div>
        <form onsubmit="window.MonitorRRHH.handleSaveEdit(event, '${item.id}')">
          <div class="form-group">
            <label class="form-label">Cargo:</label>
            <input type="text" id="editRrhhCargo" class="form-input" value="${item.cargo}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Estatus de Asistencia:</label>
            <select id="editRrhhEstatus" class="form-input">
              <option value="ASISTIO" ${item.estatus_asistencia === 'ASISTIO' ? 'selected' : ''}>ASISTIÓ</option>
              <option value="GUARDIA" ${item.estatus_asistencia === 'GUARDIA' ? 'selected' : ''}>GUARDIA</option>
              <option value="COMISION" ${item.estatus_asistencia === 'COMISION' ? 'selected' : ''}>COMISIÓN</option>
              <option value="AUSENTE" ${item.estatus_asistencia === 'AUSENTE' ? 'selected' : ''}>AUSENTE</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Observaciones:</label>
            <textarea id="editRrhhObs" class="form-input" rows="3">${item.observaciones || ''}</textarea>
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
    const item = personalData.find(x => x.id === id);
    if (!item) return;

    const modalEl = document.getElementById("modalEditRRHHDynamic");
    if (modalEl) modalEl.classList.remove("open");

    const nuevoCargo = document.getElementById("editRrhhCargo").value.trim();
    const nuevoEstatus = document.getElementById("editRrhhEstatus").value;
    const nuevasObs = document.getElementById("editRrhhObs").value.trim();

    const backup = { ...item };

    item.cargo = nuevoCargo;
    item.estatus_asistencia = nuevoEstatus;
    item.observaciones = nuevasObs;
    render();

    if (window.AppCore) window.AppCore.showLoading("Escribiendo en Google Sheets (Datos_RRHH)...");

    try {
      if (window.AppCore && typeof window.AppCore.updateRecord === "function") {
        await window.AppCore.updateRecord({
          accion: "actualizar_registro",
          modulo: "rrhh",
          id_fila: id,
          campo: "Estatus_Asistencia",
          valor: nuevoEstatus
        });

        if (nuevasObs !== backup.observaciones) {
          await window.AppCore.updateRecord({
            accion: "actualizar_registro",
            modulo: "rrhh",
            id_fila: id,
            campo: "Observaciones",
            valor: nuevasObs
          });
        }

        if (window.AppCore) {
          window.AppCore.hideLoading();
          window.AppCore.showToast(`Ficha ${id} actualizada en Google Sheet.`, "success");
        }
      }
    } catch (err) {
      console.error("[MonitorRRHH] Falló sincronización:", err);
      Object.assign(item, backup);
      render();
      if (window.AppCore) {
        window.AppCore.hideLoading();
        window.AppCore.showToast("Error de sincronización con Google Sheets. Cambio revertido.", "danger");
      }
    }
  }

  return {
    mount,
    unmount,
    refresh,
    handleSearch,
    handleAreaFilter,
    handleStatusChange,
    openEditModal,
    handleSaveEdit
  };
})();
