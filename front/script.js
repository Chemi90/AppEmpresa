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
    fetch('http://localhost:5000/api/login', {
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

    fetch('http://localhost:5000/api/desplazamientos', {
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
  });

  const despFilterBtn = document.getElementById('desp-filter-btn');
  despFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('desp-filter-start').value;
    const endDate = document.getElementById('desp-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`http://localhost:5000/api/desplazamientos?start=${startDate}&end=${endDate}`)
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
          const columns = ["ID", "Fecha", "Origen", "Destino", "Km", "Descripción", "Día", "Cliente", "Deducción", "Gasto"];
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
    let url = 'http://localhost:5000/api/desplazamientos/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

  // ----- Tickets de Comida -----
  const ticketsForm = document.getElementById('tickets-form');
  const ticketAutofillBtn = document.getElementById('ticket-autofill-btn');
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
      fetch('http://localhost:5000/api/tickets/autofill', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if(data.localizacion)
          document.getElementById('ticket-localizacion').value = data.localizacion;
        if(data.dinero)
          document.getElementById('ticket-dinero').value = data.dinero.replace(',', '.');
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
    const formData = new FormData();
    const fotoInput = document.getElementById('ticket-foto');
    if (fotoInput.files.length > 0) {
      formData.append('foto', fotoInput.files[0]);
    }
    formData.append('localizacion', document.getElementById('ticket-localizacion').value);
    formData.append('dinero', document.getElementById('ticket-dinero').value);
    formData.append('motivo', document.getElementById('ticket-motivo').value);
    formData.append('fecha', document.getElementById('ticket-fecha').value);

    fetch('http://localhost:5000/api/tickets', {
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
  });

  const ticketFilterBtn = document.getElementById('ticket-filter-btn');
  ticketFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('ticket-filter-start').value;
    const endDate = document.getElementById('ticket-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`http://localhost:5000/api/tickets?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        let totalDinero = 0;
        let html = "";
        if (data.length === 0) {
          html = "<p>No se encontraron tickets en esas fechas.</p>";
          document.getElementById('ticket-total').textContent = "0.00";
        } else {
          html += "<table border='1' style='width:100%;'><thead><tr>";
          const cols = ["ID", "Foto", "Localización", "Dinero", "Motivo", "Fecha"];
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
    let url = 'http://localhost:5000/api/tickets/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });

  // ----- Facturas -----
  const facturaAutofillBtn = document.getElementById('factura-autofill-btn');
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
      fetch('http://localhost:5000/api/facturas/autofill', {
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
          document.getElementById('factura-bruta').value = data.cantidad_bruta.replace(',', '.');
        if(data.cantidad_neta) 
          document.getElementById('factura-neta').value = data.cantidad_neta.replace(',', '.');
        if(data.retencion) {
          let ret = data.retencion.replace(',', '.');
          ret = Math.abs(parseFloat(ret));
          document.getElementById('factura-retencion').value = ret.toFixed(2);
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

    fetch('http://localhost:5000/api/facturas', {
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
  });

  const facturaFilterBtn = document.getElementById('factura-filter-btn');
  facturaFilterBtn.addEventListener('click', function() {
    const startDate = document.getElementById('factura-filter-start').value;
    const endDate = document.getElementById('factura-filter-end').value;
    if (!startDate || !endDate) {
      alert("Por favor, seleccione ambas fechas de filtro.");
      return;
    }
    fetch(`http://localhost:5000/api/facturas?start=${startDate}&end=${endDate}`)
      .then(response => response.json())
      .then(data => {
        let totalBruto = 0;
        let totalNeto = 0;
        let html = "";
        if (data.length === 0) {
          html = "<p>No se encontraron facturas en esas fechas.</p>";
        } else {
          html += "<table border='1' style='width:100%;'><thead><tr>";
          const cols = ["ID", "Fecha", "Bruta (€)", "Neta (€)", "Retención (%)", "Empresa", "Archivo"];
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
    let url = 'http://localhost:5000/api/facturas/export';
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    window.open(url, '_blank');
  });
});
