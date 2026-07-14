// ---------------- CONFIG ----------------
const BASE_URL = `${window.location.protocol}//${window.location.host}`;
let rol = null;
let tecnicoId = null;
let ticketActual = null;
let firmaBase64 = null;

// ---------------- LOGIN ----------------
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLogin");
  formLogin.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    };
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.error) {
        document.getElementById("loginMsg").innerText = result.error;
      } else {
        rol = result.rol;
        document.getElementById("panelLogin").style.display = "none";
        if (rol === "admin") {
          document.getElementById("panelAdmin").style.display = "block";
        } else if (rol === "tecnico") {
          tecnicoId = result.id;
          document.getElementById("panelTecnico").style.display = "block";
          mostrarMisTickets();
        }
      }
    } catch {
      document.getElementById("loginMsg").innerText = "Error de conexión con el servidor";
    }
  });
});

// ---------------- CLIENTES ----------------
let clienteEditandoId = null;

async function mostrarClientes(){
  const res = await fetch(`${BASE_URL}/clientes`);
  const clientes = await res.json();

  let html = `
    <h3>Clientes</h3>
    <form id="formCliente">
      <input type="text" id="codigoCliente" placeholder="Código" required>
      <input type="text" id="nombreCliente" placeholder="Nombre" required>
      <input type="text" id="telefonoCliente" placeholder="Teléfono">
      <input type="text" id="direccionCliente" placeholder="Dirección">
      <input type="email" id="correoCliente" placeholder="Correo">
      <button type="submit">${clienteEditandoId ? "Guardar Cambios" : "Registrar Cliente"}</button>
      ${clienteEditandoId ? `<button type="button" onclick="cancelarEdicionCliente()">Cancelar</button>` : ""}
    </form>
    <p id="msgCliente"></p>
    <table>
      <tr><th>ID</th><th>Código</th><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Correo</th><th>Acciones</th></tr>
  `;

  clientes.forEach(c => {
    html += `
      <tr>
        <td>${c.id}</td><td>${c.codigo}</td><td>${c.nombre}</td>
        <td>${c.telefono || ""}</td><td>${c.direccion || ""}</td><td>${c.correo || ""}</td>
        <td>
          <button onclick="cargarClienteEnFormulario(${c.id}, '${c.codigo}', '${c.nombre}', '${c.telefono || ""}', '${c.direccion || ""}', '${c.correo || ""}')">Editar</button>
          <button onclick="eliminarCliente(${c.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  document.getElementById("contenidoAdmin").innerHTML = html;

  document.getElementById("formCliente").addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      codigo: document.getElementById("codigoCliente").value,
      nombre: document.getElementById("nombreCliente").value,
      telefono: document.getElementById("telefonoCliente").value,
      direccion: document.getElementById("direccionCliente").value,
      correo: document.getElementById("correoCliente").value
    };
    let res;
    if(clienteEditandoId){
      res = await fetch(`${BASE_URL}/clientes/${clienteEditandoId}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
    } else {
      res = await fetch(`${BASE_URL}/clientes`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
    }
    if(res.ok){
      document.getElementById("msgCliente").innerText = clienteEditandoId ? "✅ Cliente actualizado" : "✅ Cliente registrado";
      document.getElementById("msgCliente").style.color = "green";
      clienteEditandoId = null;
      mostrarClientes();
    } else {
      const err = await res.json();
      document.getElementById("msgCliente").innerText = "⚠ Error: " + err.detail;
      document.getElementById("msgCliente").style.color = "red";
    }
  });
}

function cargarClienteEnFormulario(id, codigo, nombre, telefono, direccion, correo){
  clienteEditandoId = id;
  document.getElementById("codigoCliente").value = codigo;
  document.getElementById("nombreCliente").value = nombre;
  document.getElementById("telefonoCliente").value = telefono;
  document.getElementById("direccionCliente").value = direccion;
  document.getElementById("correoCliente").value = correo;
}

function cancelarEdicionCliente(){
  clienteEditandoId = null;
  mostrarClientes();
}

async function eliminarCliente(id){
  if(confirm("¿Seguro que deseas eliminar este cliente?")){
    const res = await fetch(`${BASE_URL}/clientes/${id}`, { method: "DELETE" });
    if(res.ok){ alert("✅ Cliente eliminado"); mostrarClientes(); }
    else { alert("⚠ Error al eliminar cliente"); }
  }
}
// ---------------- TÉCNICOS ----------------
let tecnicoEditandoId = null;

async function mostrarTecnicos(){
  const res = await fetch(`${BASE_URL}/tecnicos`);
  const tecnicos = await res.json();

  let html = `
    <h3>Técnicos</h3>
    <form id="formTecnico">
      <input type="text" id="codigoTecnico" placeholder="Código" required>
      <input type="text" id="nombreTecnico" placeholder="Nombre" required>
      <input type="text" id="telefonoTecnico" placeholder="Teléfono">
      <input type="text" id="direccionTecnico" placeholder="Dirección">
      <input type="email" id="correoTecnico" placeholder="Correo">
      <input type="text" id="usuarioTecnico" placeholder="Usuario">
      <input type="password" id="passwordTecnico" placeholder="Clave">
      <button type="submit">${tecnicoEditandoId ? "Guardar Cambios" : "Registrar Técnico"}</button>
      ${tecnicoEditandoId ? `<button type="button" onclick="cancelarEdicionTecnico()">Cancelar</button>` : ""}
    </form>
    <p id="msgTecnico"></p>
    <table>
      <tr><th>ID</th><th>Código</th><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Correo</th><th>Usuario</th><th>Acciones</th></tr>
  `;

  tecnicos.forEach(t => {
    html += `
      <tr>
        <td>${t.id}</td><td>${t.codigo}</td><td>${t.nombre}</td>
        <td>${t.telefono || ""}</td><td>${t.direccion || ""}</td><td>${t.correo || ""}</td><td>${t.usuario}</td>
        <td>
          <button onclick="cargarTecnicoEnFormulario(${t.id}, '${t.codigo}', '${t.nombre}', '${t.telefono || ""}', '${t.direccion || ""}', '${t.correo || ""}', '${t.usuario}')">Editar</button>
          <button onclick="eliminarTecnico(${t.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  document.getElementById("contenidoAdmin").innerHTML = html;

  document.getElementById("formTecnico").addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      codigo: document.getElementById("codigoTecnico").value,
      nombre: document.getElementById("nombreTecnico").value,
      telefono: document.getElementById("telefonoTecnico").value,
      direccion: document.getElementById("direccionTecnico").value,
      correo: document.getElementById("correoTecnico").value,
      usuario: document.getElementById("usuarioTecnico").value,
      password: document.getElementById("passwordTecnico").value || ""
    };
    let res;
    if(tecnicoEditandoId){
      // Actualizar técnico existente
      res = await fetch(`${BASE_URL}/tecnicos/${tecnicoEditandoId}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(data)
      });
    } else {
      // Registrar nuevo técnico
      res = await fetch(`${BASE_URL}/tecnicos`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(data)
      });
    }

    if(res.ok){
      document.getElementById("msgTecnico").innerText = tecnicoEditandoId ? "✅ Técnico actualizado" : "✅ Técnico registrado";
      document.getElementById("msgTecnico").style.color = "green";
      tecnicoEditandoId = null;
      mostrarTecnicos();
    } else {
      const err = await res.json();
      document.getElementById("msgTecnico").innerText = "⚠ Error: " + err.detail;
      document.getElementById("msgTecnico").style.color = "red";
    }
  });
}

function cargarTecnicoEnFormulario(id, codigo, nombre, telefono, direccion, correo, usuario){
  tecnicoEditandoId = id;
  document.getElementById("codigoTecnico").value = codigo;
  document.getElementById("nombreTecnico").value = nombre;
  document.getElementById("telefonoTecnico").value = telefono;
  document.getElementById("direccionTecnico").value = direccion;
  document.getElementById("correoTecnico").value = correo;
  document.getElementById("usuarioTecnico").value = usuario;
  document.getElementById("passwordTecnico").value = ""; // se deja vacío para nueva clave opcional
}

function cancelarEdicionTecnico(){
  tecnicoEditandoId = null;
  mostrarTecnicos();
}

async function eliminarTecnico(id){
  if(confirm("¿Seguro que deseas eliminar este técnico?")){
    const res = await fetch(`${BASE_URL}/tecnicos/${id}`, { method: "DELETE" });
    if(res.ok){ alert("✅ Técnico eliminado"); mostrarTecnicos(); }
    else { alert("⚠ Error al eliminar técnico"); }
  }
}
// ---------------- TICKETS TÉCNICO ----------------
async function mostrarMisTickets(){
  const resTickets = await fetch(`${BASE_URL}/tickets`);
  const tickets = await resTickets.json();
  const misTickets = tickets.filter(t => t.tecnico_id === tecnicoId);

  let html = `<h3>Mis Tickets</h3><table>
    <tr><th>ID</th><th>Cliente</th><th>Falla</th><th>Modo</th><th>Inicio</th><th>Cierre</th><th>Acciones</th></tr>`;
  misTickets.forEach(t => {
    html += `<tr>
      <td>${t.id}</td><td>${t.cliente_nombre}</td><td>${t.tipo_falla}</td><td>${t.estado}</td>
      <td>${t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleString() : ""}</td>
      <td>${t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleString() : ""}</td>
      <td>
        ${!t.fecha_inicio ? `<button onclick="iniciarTicket(${t.id})">Iniciar</button>` : ""}
        ${!t.fecha_cierre ? `<button onclick="abrirCierreTecnico(${t.id})">Cerrar</button>` : "<span style='color:green'>✔</span>"}
      </td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById("contenidoTecnico").innerHTML = html;
}

function abrirCierreTecnico(ticketId){
  ticketActual = ticketId;
  document.getElementById("contenidoTecnico").innerHTML = `
    <h3>Cerrar Ticket #${ticketId}</h3>
    <label>Observación:</label><input type="text" id="observacionTicket"><br>
    <label>Foto evidencia:</label><input type="file" id="fotoEvidencia" accept="image/*"><br>
    <label>Firma:</label><canvas id="firmaCanvas" width="300" height="150"></canvas><br>
    <button onclick="guardarFirma()">Guardar Firma</button><br>
    <button onclick="enviarCierreTecnico()">Enviar</button>
    <button onclick="mostrarMisTickets()">Cancelar</button>
  `;
  habilitarFirmaCanvas();
}

function habilitarFirmaCanvas(){
  const canvas = document.getElementById("firmaCanvas");
  const ctx = canvas.getContext("2d");
  let dibujando = false;

  function pos(e){
    const rect = canvas.getBoundingClientRect();
    if(e.touches){ return {x:e.touches[0].clientX-rect.left,y:e.touches[0].clientY-rect.top}; }
    return {x:e.clientX-rect.left,y:e.clientY-rect.top};
  }
  function start(e){ dibujando=true; ctx.beginPath(); const p=pos(e); ctx.moveTo(p.x,p.y); }
  function draw(e){ if(!dibujando) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); }
  function end(){ dibujando=false; }

  canvas.addEventListener("mousedown",start); canvas.addEventListener("mousemove",draw);
  canvas.addEventListener("mouseup",end); canvas.addEventListener("mouseleave",end);
  canvas.addEventListener("touchstart",start); canvas.addEventListener("touchmove",draw);
  canvas.addEventListener("touchend",end);
}

function guardarFirma(){
  const canvas = document.getElementById("firmaCanvas");
  firmaBase64 = canvas.toDataURL("image/png");
}

async function enviarCierreTecnico(){
  const observacion = document.getElementById("observacionTicket").value;
  const fotoFile = document.getElementById("fotoEvidencia").files[0];
  const formData = new FormData();
  if(fotoFile) formData.append("evidencia", fotoFile);
  if(firmaBase64){
    const blob = await (await fetch(firmaBase64)).blob();
    formData.append("firma", blob, "firma.png");
  }
  formData.append("observacion", observacion);

  const res = await fetch(`${BASE_URL}/tickets/${ticketActual}/cerrar`, { method: "PUT", body: formData });
  if(res.ok){ alert("✅ Ticket cerrado"); mostrarMisTickets(); }
  else { alert("⚠ Error al cerrar ticket"); }
}
// ---------------- TICKETS ADMIN ----------------
async function mostrarTickets(){
  const resClientes = await fetch(`${BASE_URL}/clientes`);
  const clientes = await resClientes.json();
  const resTecnicos = await fetch(`${BASE_URL}/tecnicos`);
  const tecnicos = await resTecnicos.json();
  const resTickets = await fetch(`${BASE_URL}/tickets`);
  const tickets = await resTickets.json();

  let html = `
    <h3>Tickets</h3>
    <form id="formTicket">
      <label>Cliente:</label>
      <select id="clienteId" required>
        ${clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("")}
      </select>
      <label>Técnico:</label>
      <select id="tecnicoId" required>
        ${tecnicos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join("")}
      </select>
      <input type="text" id="tipoFalla" placeholder="Descripción de la falla" required>
      <label>Modo de soporte:</label>
      <select id="estado" required>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
      </select>
      <button type="submit">Registrar Ticket</button>
    </form>
    <p id="msgTicket"></p>
    <table>
      <tr>
        <th>ID</th><th>Cliente</th><th>Técnico</th><th>Falla</th><th>Modo</th>
        <th>Inicio</th><th>Cierre</th><th>Evidencias</th><th>Acciones</th>
      </tr>
  `;

  tickets.forEach(t => {
    html += `
      <tr>
        <td>${t.id}</td><td>${t.cliente_nombre}</td><td>${t.tecnico_nombre}</td>
        <td>${t.tipo_falla}</td><td>${t.estado}</td>
        <td>${t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleString() : ""}</td>
        <td>${t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleString() : ""}</td>
      <td>
  ${t.observacion || ""}
  ${t.evidencia ? `<br><img src="/uploads/${t.evidencia}" style="max-width:100px;">` : ""}
  ${t.firma ? `<br><img src="/uploads/${t.firma}" style="max-width:100px;">` : ""}
</td>


        <td>
          <button onclick="eliminarTicket(${t.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  document.getElementById("contenidoAdmin").innerHTML = html;

  // Registrar nuevo ticket
  document.getElementById("formTicket").onsubmit = async e => {
    e.preventDefault();
    const data = {
      cliente_id: parseInt(document.getElementById("clienteId").value),
      tecnico_id: parseInt(document.getElementById("tecnicoId").value),
      tipo_falla: document.getElementById("tipoFalla").value,
      estado: document.getElementById("estado").value
    };
    await fetch(`${BASE_URL}/tickets`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });
    mostrarTickets();
  };
}

async function eliminarTicket(id){
  if(confirm("¿Seguro que deseas eliminar este ticket?")){
    await fetch(`${BASE_URL}/tickets/${id}`, { method: "DELETE" });
    mostrarTickets();
  }
}

// ---------------- MÉTRICAS ----------------
async function mostrarMetricas(){
  const res = await fetch(`${BASE_URL}/metricas`);
  const m = await res.json();

  let html = `
    <h3>Métricas</h3>
    <table>
      <tr><th>Total Tickets</th><td>${m.total_tickets}</td></tr>
      <tr><th>Abiertos</th><td>${m.abiertos}</td></tr>
      <tr><th>Cerrados</th><td>${m.cerrados}</td></tr>
      <tr><th>Promedio Respuesta</th><td>${m.promedio_respuesta || "N/A"}</td></tr>
      <tr><th>Promedio Resolución</th><td>${m.promedio_resolucion || "N/A"}</td></tr>
    </table>
  `;
  document.getElementById("contenidoAdmin").innerHTML = html;
}
