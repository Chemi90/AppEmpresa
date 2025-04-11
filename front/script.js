document.addEventListener('DOMContentLoaded', function() {
  // ----- Login -----
  const loginScreen = document.getElementById('login-screen');
  const mainContent = document.getElementById('main-content');
  const loginButton = document.getElementById('login-button');
  const loginPasswordInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');

  // Permitir enviar la clave al presionar Enter
  loginPasswordInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      loginButton.click();
    }
  });

  loginButton.addEventListener('click', function() {
    const password = loginPasswordInput.value;
    fetch('https://josemiguelruizguevara.com:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    })
    .then(response => {
      if (!response.ok) throw new Error('Clave incorrecta');
      return response.json();
    })
    .then(data => {
      loginScreen.style.display = 'none';
      mainContent.style.display = 'block';
    })
    .catch(error => {
      loginError.textContent = "Clave incorrecta. Inténtalo de nuevo.";
    });
  });

  // ----- Navegación por pestañas -----
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const target = button.getAttribute('data-target');
      tabContents.forEach(content => {
        content.style.display = (content.id === target) ? 'block' : 'none';
      });
    });
  });

  // ----- Desplazamientos -----
  const despKmInput = document.getElementById('desp-km');
  const despDeduccionInput = document.getElementById('desp-deduccion');
  const despGastoInput = document.getElementById('desp-gasto');
  const despCurrentId = document.getElementById('desp-current-id');
  const despSubmitBtn = document.getElementById('desp-submit-btn');
  const despCancelBtn = document.getElementById('desp-cancel-btn');

  function updateTotalCost() {
    const km = parseFloat(despKmInput.value) || 0;
    const costPerKm = parseFloat(despDeduccionInput.value) || 0;
    despGastoInput.value = (km * costPerKm).toFixed(2);
  }
  despKmInput.addEventListener('input', updateTotalCost);
  despDeduccionInput.addEventListener('input', updateTotalCost);

  const despForm = document.getElementById('desplazamientos-form');
  despForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = {
      fecha: document.getElementById('desp-fecha').value,
      destino: document.getElementById('desp-destino').value,
      distancia: document.getElementById('desp-km').value,
      descripcion: document.getElementById('desp-descripcion').value,
      dia: document.getElementById('desp-dia').value,
      cliente: document.getElementById('desp-cliente').value,
      deduccion: document.getElementById('desp-deduccion').value,
      gasto: document.getElementById('desp-gasto').value
    };

    // Si hay un ID se actualiza; de lo contrario se agrega
    if (despCurrentId.value) {
      fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos/${despCurrentId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar desplazamiento');
        return response.json();
      })
      .then(data => {
        alert("Desplazamiento actualizado exitosamente.");
        despForm.reset();
        despCurrentId.value = "";
        despSubmitBtn.textContent = "Agregar Desplazamiento";
        despCancelBtn.style.display = "none";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    } else {
      fetch('https://josemiguelruizguevara.com:5000/api/desplazamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || 'Error al agregar desplazamiento'); 
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Desplazamiento agregado exitosamente. ID: " + data.id);
        despForm.reset();
        despGastoInput.value = "";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  despCancelBtn.addEventListener('click', function() {
    despForm.reset();
    despCurrentId.value = "";
    despSubmitBtn.textContent = "Agregar Desplazamiento";
    despCancelBtn.style.display = "none";
  });

  const despFilterBtn = document.getElementById('desp-filter-btn');
  despFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('desp-filter-start').value;
    const endDate = document.getElementById('desp-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        const resultsContainer = document.getElementById('desp-results');
        resultsContainer.innerHTML = "";
        let total = 0;
        if (data.length === 0) {
          resultsContainer.innerHTML = "<p>No se encontraron desplazamientos en esas fechas.</p>";
          document.getElementById('desp-total').textContent = "0.00";
        } else {
          const table = document.createElement('table');
          table.style.width = '100%';
          table.setAttribute('border', '1');
          const header = table.createTHead();
          const headerRow = header.insertRow();
          const columns = ["ID", "Fecha", "Origen", "Destino", "Km", "Descripción", "Día", "Cliente", "Deducción", "Gasto", "Acciones"];
          columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
          });
          const tbody = document.createElement('tbody');
          data.forEach(item => {
            const row = tbody.insertRow();
            row.insertCell().textContent = item.id;
            row.insertCell().textContent = item.fecha;
            row.insertCell().textContent = item.origen;
            row.insertCell().textContent = item.destino;
            row.insertCell().textContent = item.distancia;
            row.insertCell().textContent = item.descripcion;
            row.insertCell().textContent = item.dia;
            row.insertCell().textContent = item.cliente;
            row.insertCell().textContent = item.deduccion;
            row.insertCell().textContent = item.gasto;
            total += parseFloat(item.gasto) || 0;
            // Botones de editar y eliminar
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `<button class="edit-desp" 
              data-id="${item.id}"
              data-fecha="${item.fecha}"
              data-destino="${item.destino}"
              data-distancia="${item.distancia}"
              data-descripcion="${item.descripcion}"
              data-dia="${item.dia}"
              data-cliente="${item.cliente}"
              data-deduccion="${item.deduccion}"
              data-gasto="${item.gasto}"
              >✏️</button>
              <button class="delete-desp" data-id="${item.id}">🗑️</button>`;
          });
          table.appendChild(tbody);
          resultsContainer.appendChild(table);
          document.getElementById('desp-total').textContent = total.toFixed(2);
        }
      })
      .catch(error => {
        alert("Error al filtrar desplazamientos: " + error.message);
      });
  });

  document.getElementById('desplazamientos-export-btn').addEventListener('click', function() {
    const startDate = document.getElementById('desp-filter-start').value;
    const endDate = document.getElementById('desp-filter-end').value;
    let url = 'https://josemiguelruizguevara.com:5000/api/desplazamientos/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

  // ----- Tickets de Comida -----
  const ticketsForm = document.getElementById('tickets-form');
  const ticketAutofillBtn = document.getElementById('ticket-autofill-btn');
  const ticketCancelBtn = document.getElementById('ticket-cancel-btn'); // Botón cancelar para Tickets
  if(ticketAutofillBtn) {
    ticketAutofillBtn.addEventListener('click', function() {
      const formData = new FormData();
      const fotoInput = document.getElementById('ticket-foto');
      if (fotoInput.files.length > 0) {
        formData.append('foto', fotoInput.files[0]);
      } else {
        alert("Por favor, selecciona un archivo para autorrellenar.");
        return;
      }
      fetch('https://josemiguelruizguevara.com:5000/api/tickets/autofill', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if(data.localizacion)
          document.getElementById('ticket-localizacion').value = data.localizacion;
        if(data.dinero)
          document.getElementById('ticket-dinero').value = parseFloat(data.dinero).toFixed(2);
        if(data.motivo)
          document.getElementById('ticket-motivo').value = data.motivo;
        if(data.fecha) {
          const parts = data.fecha.split('/');
          if (parts.length === 3) {
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            document.getElementById('ticket-fecha').value = isoDate;
          } else {
            document.getElementById('ticket-fecha').value = data.fecha;
          }
        }
      })
      .catch(error => {
        alert("Error en autofill del ticket: " + error.message);
      });
    });
  }

  ticketsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const ticketCurrentId = document.getElementById('ticket-current-id').value;
    // Si existe el ID, se actualiza; de lo contrario se agrega
    if (ticketCurrentId) {
      const data = {
        localizacion: document.getElementById('ticket-localizacion').value,
        dinero: document.getElementById('ticket-dinero').value,
        motivo: document.getElementById('ticket-motivo').value,
        fecha: document.getElementById('ticket-fecha').value
      };
      fetch(`https://josemiguelruizguevara.com:5000/api/tickets/${ticketCurrentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar ticket');
        return response.json();
      })
      .then(data => {
        alert("Ticket actualizado exitosamente.");
        ticketsForm.reset();
        document.getElementById('ticket-submit-btn').textContent = "Agregar Ticket";
        document.getElementById('ticket-current-id').value = "";
        ticketCancelBtn.style.display = "none";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    } else {
      const formData = new FormData();
      const fotoInput = document.getElementById('ticket-foto');
      if (fotoInput.files.length > 0) {
        formData.append('foto', fotoInput.files[0]);
      }
      formData.append('localizacion', document.getElementById('ticket-localizacion').value);
      formData.append('dinero', document.getElementById('ticket-dinero').value);
      formData.append('motivo', document.getElementById('ticket-motivo').value);
      formData.append('fecha', document.getElementById('ticket-fecha').value);

      fetch('https://josemiguelruizguevara.com:5000/api/tickets', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || "Error al agregar ticket"); 
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Ticket agregado exitosamente. ID: " + data.id);
        ticketsForm.reset();
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  ticketCancelBtn.addEventListener('click', function() {
    ticketsForm.reset();
    document.getElementById('ticket-current-id').value = "";
    document.getElementById('ticket-submit-btn').textContent = "Agregar Ticket";
    ticketCancelBtn.style.display = "none";
  });

  const ticketFilterBtn = document.getElementById('ticket-filter-btn');
  ticketFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('ticket-filter-start').value;
    const endDate = document.getElementById('ticket-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`https://josemiguelruizguevara.com:5000/api/tickets?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        let totalDinero = 0;
        let html = "";
        if (data.length === 0) {
          html = "<p>No se encontraron tickets en esas fechas.</p>";
          document.getElementById('ticket-total').textContent = "0.00";
        } else {
          html += "<table border='1' style='width:100%;'><thead><tr>";
          const cols = ["ID", "Foto", "Localización", "Dinero", "Motivo", "Fecha", "Acciones"];
          cols.forEach(col => {
            html += `<th>${col}</th>`;
          });
          html += "</tr></thead><tbody>";
          data.forEach(item => {
            html += "<tr>";
            html += `<td>${item.id}</td>`;
            html += `<td>${item.foto}</td>`;
            html += `<td>${item.localizacion}</td>`;
            html += `<td>${item.dinero}</td>`;
            html += `<td>${item.motivo}</td>`;
            html += `<td>${item.fecha}</td>`;
            html += `<td>
                    <button class="edit-ticket" 
                      data-id="${item.id}"
                      data-localizacion="${item.localizacion}"
                      data-dinero="${item.dinero}"
                      data-motivo="${item.motivo}"
                      data-fecha="${item.fecha}"
                    >✏️</button>
                    <button class="delete-ticket" data-id="${item.id}">🗑️</button>
                   </td>`;
            html += "</tr>";
            totalDinero += parseFloat(item.dinero) || 0;
          });
          html += "</tbody></table>";
          document.getElementById('ticket-total').textContent = totalDinero.toFixed(2);
        }
        document.getElementById('ticket-results').innerHTML = html;
      })
      .catch(error => {
        alert("Error al filtrar tickets: " + error.message);
      });
  });

  document.getElementById('ticket-export-btn').addEventListener('click', function() {
    const startDate = document.getElementById('ticket-filter-start').value;
    const endDate = document.getElementById('ticket-filter-end').value;
    let url = 'https://josemiguelruizguevara.com:5000/api/tickets/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

  // ----- Facturas -----
  const facturaAutofillBtn = document.getElementById('factura-autofill-btn');
  const facturaCancelBtn = document.getElementById('factura-cancel-btn'); // Botón cancelar para Facturas
  if(facturaAutofillBtn) {
    facturaAutofillBtn.addEventListener('click', function() {
      const formData = new FormData();
      const archivoInput = document.getElementById('factura-archivo');
      if (archivoInput.files.length > 0) {
        formData.append('archivo', archivoInput.files[0]);
      } else {
        alert("Por favor, selecciona un archivo para autorrellenar.");
        return;
      }
      fetch('https://josemiguelruizguevara.com:5000/api/facturas/autofill', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if(data.fecha) {
          const parts = data.fecha.split('/');
          if (parts.length === 3) {
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            document.getElementById('factura-fecha').value = isoDate;
          } else {
            document.getElementById('factura-fecha').value = data.fecha;
          }
        }
        if(data.cantidad_bruta) 
          document.getElementById('factura-bruta').value = parseFloat(data.cantidad_bruta).toFixed(2);
        if(data.cantidad_neta) 
          document.getElementById('factura-neta').value = parseFloat(data.cantidad_neta).toFixed(2);
        if(data.retencion) {
          document.getElementById('factura-retencion').value = parseFloat(data.retencion).toFixed(2);
        }
        if(data.nombre_empresa)
          document.getElementById('factura-empresa').value = data.nombre_empresa;
      })
      .catch(error => {
        alert("Error en autofill de factura: " + error.message);
      });
    });
  }

  const facturasForm = document.getElementById('facturas-form');
  facturasForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const facturaCurrentId = document.getElementById('factura-current-id').value;
    if (facturaCurrentId) {
      const data = {
        fecha: document.getElementById('factura-fecha').value,
        bruta: document.getElementById('factura-bruta').value,
        neta: document.getElementById('factura-neta').value,
        retencion: document.getElementById('factura-retencion').value,
        empresa: document.getElementById('factura-empresa').value
      };
      fetch(`https://josemiguelruizguevara.com:5000/api/facturas/${facturaCurrentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar factura');
        return response.json();
      })
      .then(data => {
        alert("Factura actualizada exitosamente.");
        facturasForm.reset();
        document.getElementById('factura-submit-btn').textContent = "Agregar Factura";
        document.getElementById('factura-current-id').value = "";
        facturaCancelBtn.style.display = "none";
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    } else {
      const formData = new FormData();
      formData.append('fecha', document.getElementById('factura-fecha').value);
      formData.append('bruta', document.getElementById('factura-bruta').value);
      formData.append('neta', document.getElementById('factura-neta').value);
      formData.append('retencion', document.getElementById('factura-retencion').value);
      formData.append('empresa', document.getElementById('factura-empresa').value);
      const archivoInput = document.getElementById('factura-archivo');
      if (archivoInput.files.length > 0) {
        formData.append('archivo', archivoInput.files[0]);
      }

      fetch('https://josemiguelruizguevara.com:5000/api/facturas', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || "Error al agregar factura");
          });
        }
        return response.json();
      })
      .then(data => {
        alert("Factura agregada exitosamente. ID: " + data.id);
        facturasForm.reset();
      })
      .catch(error => {
        alert("Error: " + error.message);
      });
    }
  });

  facturaCancelBtn.addEventListener('click', function() {
    facturasForm.reset();
    document.getElementById('factura-current-id').value = "";
    document.getElementById('factura-submit-btn').textContent = "Agregar Factura";
    facturaCancelBtn.style.display = "none";
  });

  const facturaFilterBtn = document.getElementById('factura-filter-btn');
  facturaFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('factura-filter-start').value;
    const endDate = document.getElementById('factura-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`https://josemiguelruizguevara.com:5000/api/facturas?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        let totalBruto = 0;
        let totalNeto = 0;
        let html = "";
        if (data.length === 0) {
          html = "<p>No se encontraron facturas en esas fechas.</p>";
        } else {
          html += "<table border='1' style='width:100%;'><thead><tr>";
          const cols = ["ID", "Fecha", "Bruta (€)", "Neta (€)", "Retención (%)", "Empresa", "Archivo", "Acciones"];
          cols.forEach(col => {
            html += `<th>${col}</th>`;
          });
          html += "</tr></thead><tbody>";
          data.forEach(item => {
            html += "<tr>";
            html += `<td>${item.id}</td>`;
            html += `<td>${item.fecha}</td>`;
            html += `<td>${item.cantidad_bruta}</td>`;
            html += `<td>${item.cantidad_neta}</td>`;
            html += `<td>${item.retencion}</td>`;
            html += `<td>${item.nombre_empresa}</td>`;
            html += `<td>${item.archivo}</td>`;
            html += `<td>
                    <button class="edit-factura" 
                      data-id="${item.id}"
                      data-fecha="${item.fecha}"
                      data-bruta="${item.cantidad_bruta}"
                      data-neta="${item.cantidad_neta}"
                      data-retencion="${item.retencion}"
                      data-empresa="${item.nombre_empresa}"
                    >✏️</button>
                    <button class="delete-factura" data-id="${item.id}">🗑️</button>
                   </td>`;
            html += "</tr>";
            totalBruto += parseFloat(item.cantidad_bruta) || 0;
            totalNeto += parseFloat(item.cantidad_neta) || 0;
          });
          html += "</tbody></table>";
        }
        document.getElementById('factura-results').innerHTML = html;
        document.getElementById('factura-total-bruto').textContent = totalBruto.toFixed(2);
        document.getElementById('factura-total-neto').textContent = totalNeto.toFixed(2);
      })
      .catch(error => {
        alert("Error al filtrar facturas: " + error.message);
      });
  });

  document.getElementById('factura-export-btn').addEventListener('click', function() {
    const startDate = document.getElementById('factura-filter-start').value;
    const endDate = document.getElementById('factura-filter-end').value;
    let url = 'https://josemiguelruizguevara.com:5000/api/facturas/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

// ----- Gastos Varios -----
const gastoTipoSelect = document.getElementById('gasto-tipo');
const gastoTotalInput = document.getElementById('gasto-total');
const gastoCheckbox = document.getElementById('gasto-compartido');
const gastoPorcentajeInput = document.getElementById('gasto-porcentaje');
const gastoDeducibleInput = document.getElementById('gasto-deducible');
const gastoCurrentId = document.getElementById('gasto-current-id');
const gastoSubmitBtn = document.getElementById('gasto-submit-btn');
const gastoCancelBtn = document.getElementById('gasto-cancel-btn');
// Checkbox para dividir deducción en 4 años
const dividirDeduccionCheckbox = document.getElementById('dividir-deduccion');

// Función para establecer un porcentaje por defecto según el tipo de gasto.
function setDefaultPercentage() {
  const tipo = gastoTipoSelect.value;
  let defaultPercentage = 100;
  if (tipo === "Terminal móvil") {
    defaultPercentage = 50;
  } else if (tipo === "ChatGPT Plus") {
    defaultPercentage = 100;
  } else if (tipo === "Electricidad") {
    defaultPercentage = 33;
  } else if (tipo === "Internet") {
    defaultPercentage = 26.16;
  } else if (tipo === "Seguro coche") {
    defaultPercentage = 40;
  } else if (tipo === "Gasolina") {
    defaultPercentage = 40;
  } else if (tipo === "IBI vivienda") {
    defaultPercentage = 33;
  } else if (tipo === "Comunidad de vecinos") {
    defaultPercentage = 33;
  }
  gastoPorcentajeInput.value = defaultPercentage;
}

gastoTipoSelect.addEventListener('change', function() {
  setDefaultPercentage();
  updateGastoDeducible();
});

gastoCheckbox.addEventListener('change', function() {
  if (gastoCheckbox.checked) {
    gastoPorcentajeInput.disabled = false;
  } else {
    gastoPorcentajeInput.disabled = true;
    setDefaultPercentage();
  }
  updateGastoDeducible();
});

// Actualiza el valor del "Importe Deducible" según el total y el porcentaje;
// si se activa la división, muestra la cuota anual (deducción total / 4).
function updateGastoDeducible() {
  const total = parseFloat(gastoTotalInput.value) || 0;
  const porcentaje = parseFloat(gastoPorcentajeInput.value) || 0;
  const overallDeduction = total * (porcentaje / 100);
  
  if (total > 300 && dividirDeduccionCheckbox.checked) {
    gastoDeducibleInput.value = (overallDeduction / 4).toFixed(2);
  } else {
    gastoDeducibleInput.value = overallDeduction.toFixed(2);
  }
}

gastoTotalInput.addEventListener('input', updateGastoDeducible);
gastoPorcentajeInput.addEventListener('input', updateGastoDeducible);
dividirDeduccionCheckbox.addEventListener('change', updateGastoDeducible);

// Evento submit del formulario de gastos
gastosForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  // Creamos el objeto FormData a partir del formulario.
  const formData = new FormData(gastosForm);
  formData.set('gasto_compartido', gastoCheckbox.checked ? '1' : '0');
  formData.set('dividir_deduccion', dividirDeduccionCheckbox.checked ? '1' : '0');

  // Si el checkbox de dividir deducción está marcado, ejecutamos el endpoint 4 veces
  if (dividirDeduccionCheckbox.checked) {
    let originalDateStr = document.getElementById('gasto-fecha').value;
    let originalDate = new Date(originalDateStr);
    let responses = [];
    // Ejecutar 4 llamadas consecutivas, ajustando la fecha en cada una.
    for (let i = 0; i < 4; i++) {
      let newDate = new Date(originalDate);
      newDate.setFullYear(newDate.getFullYear() + i);
      let newDateStr = newDate.toISOString().substring(0, 10);
      // Clonamos los datos del formulario y actualizamos el valor de la fecha.
      let formDataClone = new FormData(gastosForm);
      formDataClone.set('fecha', newDateStr);
      // Realizamos la llamada al endpoint.
      const response = await fetch('https://josemiguelruizguevara.com:5000/api/gastos', {
        method: 'POST',
        body: formDataClone
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert("Error al agregar gasto: " + (errorData.error || ''));
        return;
      }
      const data = await response.json();
      responses.push(data);
    }
    alert("Gastos agregados exitosamente. IDs: " + responses.map(r => r.id).join(', '));
    gastosForm.reset();
    setDefaultPercentage();
    gastoDeducibleInput.value = "";
  } else {
    // Si el checkbox no está marcado, se ejecuta el endpoint una sola vez.
    fetch('https://josemiguelruizguevara.com:5000/api/gastos', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { 
          throw new Error(err.error || 'Error al agregar gasto'); 
        });
      }
      return response.json();
    })
    .then(data => {
      alert("Gasto agregado exitosamente. ID: " + data.id);
      gastosForm.reset();
      setDefaultPercentage();
      gastoDeducibleInput.value = "";
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
  }
});

gastoCancelBtn.addEventListener('click', function() {
  gastosForm.reset();
  gastoCurrentId.value = "";
  gastoSubmitBtn.textContent = "Agregar Gasto";
  gastoCancelBtn.style.display = "none";
});

  const gastosFilterBtn = document.getElementById('gastos-filter-btn');
  gastosFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('gastos-filter-start').value;
    const endDate = document.getElementById('gastos-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`https://josemiguelruizguevara.com:5000/api/gastos?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        let totalGastos = 0;
        let html = "";
        if (data.length === 0) {
          html = "<p>No se encontraron gastos en esas fechas.</p>";
          document.getElementById('gastos-total').textContent = "0.00";
        } else {
          html += "<table border='1' style='width:100%;'><thead><tr>";
          const cols = ["ID", "Fecha", "Tipo", "Importe Total (€)", "% Deducible", "Importe Deducible (€)", "Nota", "Gasto Compartido", "Acciones"];
          cols.forEach(col => {
            html += `<th>${col}</th>`;
          });
          html += "</tr></thead><tbody>";
          data.forEach(item => {
            html += "<tr>";
            html += `<td>${item.id}</td>`;
            html += `<td>${item.fecha}</td>`;
            html += `<td>${item.tipo}</td>`;
            html += `<td>${item.importe_total}</td>`;
            html += `<td>${item.porcentaje_deducible}</td>`;
            html += `<td>${item.importe_deducible}</td>`;
            html += `<td>${item.nota || ''}</td>`;
            html += `<td>${item.gasto_compartido == 1 ? 'Sí' : 'No'}</td>`;
            html += `<td>
              <button class="edit-gasto" 
                data-id="${item.id}"
                data-fecha="${item.fecha}"
                data-tipo="${item.tipo}"
                data-importe_total="${item.importe_total}"
                data-porcentaje_deducible="${item.porcentaje_deducible}"
                data-importe_deducible="${item.importe_deducible}"
                data-nota="${item.nota}"
                data-gasto_compartido="${item.gasto_compartido}"
                >✏️</button>
              <button class="delete-gasto" data-id="${item.id}">🗑️</button>
              </td>`;
            html += "</tr>";
            totalGastos += parseFloat(item.importe_total) || 0;
          });
          html += "</tbody></table>";
          document.getElementById('gastos-total').textContent = totalGastos.toFixed(2);
        }
        document.getElementById('gastos-results').innerHTML = html;
      })
      .catch(error => {
        alert("Error al filtrar gastos: " + error.message);
      });
  });

  document.getElementById('gastos-export-btn').addEventListener('click', function() {
    const startDate = document.getElementById('gastos-filter-start').value;
    const endDate = document.getElementById('gastos-filter-end').value;
    let url = 'https://josemiguelruizguevara.com:5000/api/gastos/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

  // ----- Delegación de eventos para botones de editar y eliminar -----
  document.addEventListener('click', function(e) {
    // Para desplazamientos
    if(e.target.classList.contains('delete-desp')) {
      const id = e.target.getAttribute('data-id');
      if(confirm("¿Está seguro de eliminar este desplazamiento?")) {
        fetch(`https://josemiguelruizguevara.com:5000/api/desplazamientos/${id}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (!response.ok) throw new Error('Error al eliminar desplazamiento');
          return response.json();
        })
        .then(data => {
          alert("Desplazamiento eliminado.");
          e.target.parentElement.parentElement.remove();
        })
        .catch(error => {
          alert("Error: " + error.message);
        });
      }
    }
    if(e.target.classList.contains('edit-desp')) {
      despCurrentId.value = e.target.getAttribute('data-id');
      document.getElementById('desp-fecha').value = e.target.getAttribute('data-fecha');
      document.getElementById('desp-destino').value = e.target.getAttribute('data-destino');
      document.getElementById('desp-km').value = e.target.getAttribute('data-distancia');
      document.getElementById('desp-descripcion').value = e.target.getAttribute('data-descripcion');
      document.getElementById('desp-dia').value = e.target.getAttribute('data-dia');
      document.getElementById('desp-cliente').value = e.target.getAttribute('data-cliente');
      document.getElementById('desp-deduccion').value = e.target.getAttribute('data-deduccion');
      document.getElementById('desp-gasto').value = e.target.getAttribute('data-gasto');
      despSubmitBtn.textContent = "Actualizar Desplazamiento";
      despCancelBtn.style.display = "inline-block";
      window.scrollTo(0,0);
    }

    // Para gastos
    if(e.target.classList.contains('delete-gasto')) {
      const id = e.target.getAttribute('data-id');
      if(confirm("¿Está seguro de eliminar este gasto?")) {
        fetch(`https://josemiguelruizguevara.com:5000/api/gastos/${id}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (!response.ok) throw new Error('Error al eliminar gasto');
          return response.json();
        })
        .then(data => {
          alert("Gasto eliminado.");
          e.target.parentElement.parentElement.remove();
        })
        .catch(error => {
          alert("Error: " + error.message);
        });
      }
    }
    if(e.target.classList.contains('edit-gasto')) {
      gastoCurrentId.value = e.target.getAttribute('data-id');
      document.getElementById('gasto-fecha').value = e.target.getAttribute('data-fecha');
      document.getElementById('gasto-tipo').value = e.target.getAttribute('data-tipo');
      document.getElementById('gasto-total').value = e.target.getAttribute('data-importe_total');
      document.getElementById('gasto-porcentaje').value = e.target.getAttribute('data-porcentaje_deducible');
      document.getElementById('gasto-deducible').value = e.target.getAttribute('data-importe_deducible');
      document.getElementById('gasto-nota').value = e.target.getAttribute('data-nota');
      document.getElementById('gasto-compartido').checked = (e.target.getAttribute('data-gasto_compartido') == 1);
      gastoSubmitBtn.textContent = "Actualizar Gasto";
      gastoCancelBtn.style.display = "inline-block";
      window.scrollTo(0,document.body.scrollHeight);
    }
    // Para Tickets
    if(e.target.classList.contains('delete-ticket')) {
      const id = e.target.getAttribute('data-id');
      if(confirm("¿Está seguro de eliminar este ticket?")) {
        fetch(`https://josemiguelruizguevara.com:5000/api/tickets/${id}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (!response.ok) throw new Error('Error al eliminar ticket');
          return response.json();
        })
        .then(data => {
          alert("Ticket eliminado.");
          e.target.parentElement.parentElement.remove();
        })
        .catch(error => {
          alert("Error: " + error.message);
        });
      }
    }
    if(e.target.classList.contains('edit-ticket')) {
      document.getElementById('ticket-localizacion').value = e.target.getAttribute('data-localizacion');
      document.getElementById('ticket-dinero').value = parseFloat(e.target.getAttribute('data-dinero')).toFixed(2);
      document.getElementById('ticket-motivo').value = e.target.getAttribute('data-motivo');
      document.getElementById('ticket-fecha').value = e.target.getAttribute('data-fecha');
      document.getElementById('ticket-current-id').value = e.target.getAttribute('data-id');
      document.getElementById('ticket-submit-btn').textContent = "Actualizar Ticket";
      ticketCancelBtn.style.display = "inline-block";
    }
    // Para Facturas
    if(e.target.classList.contains('delete-factura')) {
      const id = e.target.getAttribute('data-id');
      if(confirm("¿Está seguro de eliminar esta factura?")) {
        fetch(`https://josemiguelruizguevara.com:5000/api/facturas/${id}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (!response.ok) throw new Error('Error al eliminar factura');
          return response.json();
        })
        .then(data => {
          alert("Factura eliminada.");
          e.target.parentElement.parentElement.remove();
        })
        .catch(error => {
          alert("Error: " + error.message);
        });
      }
    }
    if(e.target.classList.contains('edit-factura')) {
      document.getElementById('factura-fecha').value = e.target.getAttribute('data-fecha');
      document.getElementById('factura-bruta').value = parseFloat(e.target.getAttribute('data-bruta')).toFixed(2);
      document.getElementById('factura-neta').value = parseFloat(e.target.getAttribute('data-neta')).toFixed(2);
      document.getElementById('factura-retencion').value = parseFloat(e.target.getAttribute('data-retencion')).toFixed(2);
      document.getElementById('factura-empresa').value = e.target.getAttribute('data-empresa');
      document.getElementById('factura-current-id').value = e.target.getAttribute('data-id');
      document.getElementById('factura-submit-btn').textContent = "Actualizar Factura";
      facturaCancelBtn.style.display = "inline-block";
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registrado con éxito:', registration.scope);
        })
        .catch(err => {
          console.log('Error al registrar el ServiceWorker:', err);
        });
    });
  }
  
});
