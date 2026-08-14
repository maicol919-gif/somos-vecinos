// Código de acceso simple (no es autenticación real, solo filtra acceso casual).
const CODIGO_ADMIN = "vecinos2026";

const loginBox = document.getElementById("login-box");
const panel = document.getElementById("panel");
const codigoInput = document.getElementById("codigo-acceso");
const btnEntrar = document.getElementById("btn-entrar");
const loginError = document.getElementById("login-error");
const listaPendientes = document.getElementById("lista-pendientes");
const listaOtros = document.getElementById("lista-otros");

const ETIQUETAS = {
  vivienda: "Vivienda",
  alimentos: "Alimentos",
  dinero: "Dinero",
  medicina: "Medicina",
  otro: "Otro",
};

function linkWhatsapp(contacto, texto) {
  const soloNumeros = contacto.replace(/[^0-9]/g, "");
  const esTelefono = soloNumeros.length >= 7 && soloNumeros.length === contacto.replace(/[\s()-]/g, "").length;
  const base = esTelefono ? `https://wa.me/${soloNumeros}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}

function entrar() {
  if (codigoInput.value === CODIGO_ADMIN) {
    sessionStorage.setItem("sv_admin", "1");
    mostrarPanel();
  } else {
    loginError.textContent = "Código incorrecto.";
    loginError.classList.remove("hidden");
  }
}

btnEntrar.addEventListener("click", entrar);
codigoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrar();
});

function mostrarPanel() {
  loginBox.classList.add("hidden");
  panel.classList.remove("hidden");
  cargarCasos();
}

function filaItem(item) {
  const div = document.createElement("div");
  div.className = "admin-item-fila";
  div.innerHTML = `
    <span class="admin-item-nombre">${item.nombre}</span>
    <input type="number" class="admin-item-input" min="0" step="0.1" value="${item.cantidad_recibida}" data-id="${item.id}">
    <span class="admin-item-de">de ${item.cantidad_requerida} ${item.unidad}</span>
    <button type="button" class="btn-actualizar-item" data-id="${item.id}">Actualizar</button>
  `;
  div.querySelector(".btn-actualizar-item").addEventListener("click", () => {
    const input = div.querySelector(".admin-item-input");
    actualizarItem(item.id, parseFloat(input.value) || 0);
  });
  return div;
}

function filaCaso(caso) {
  const div = document.createElement("div");
  div.className = "fila-caso";

  const fotos = caso.caso_fotos && caso.caso_fotos.length
    ? caso.caso_fotos.map((f) => f.url)
    : caso.foto_url
    ? [caso.foto_url]
    : [];
  const foto = fotos.length ? `<img src="${fotos[0]}" alt="Foto de ${caso.nombre}">` : "";
  const masFotos = fotos.length > 1 ? `<span class="admin-mas-fotos">+${fotos.length - 1} foto${fotos.length - 1 === 1 ? "" : "s"}</span>` : "";

  const reportes = caso.reportes || [];
  const badgeReportes = reportes.length > 0
    ? `<span class="admin-reportes-badge">⚠ ${reportes.length} reporte${reportes.length === 1 ? "" : "s"}</span>`
    : "";

  const acciones = caso.estado === "pendiente"
    ? `<button class="btn-verificar" data-id="${caso.id}" data-estado="verificado">Verificar</button>
       <button class="btn-rechazar" data-id="${caso.id}" data-estado="rechazado">Rechazar</button>`
    : `<span class="estado-badge estado-${caso.estado}">${caso.estado}</span>
       ${caso.estado === "verificado" ? `<button class="btn-enviar-link" data-id="${caso.id}">Enviar link de edición</button>` : ""}`;

  div.innerHTML = `
    ${foto}
    ${masFotos}
    <div class="info">
      <h4>${caso.nombre} — ${caso.ciudad} ${badgeReportes}</h4>
      <p>${ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad} · Urgencia: ${caso.urgencia}</p>
      <p>${caso.descripcion}</p>
      <p><strong>Contacto:</strong> ${caso.contacto}</p>
      <div class="admin-items"></div>
    </div>
    <div class="acciones">${acciones}</div>
  `;

  div.querySelectorAll("button[data-id]").forEach((btn) => {
    if (btn.classList.contains("btn-actualizar-item") || btn.classList.contains("btn-enviar-link")) return;
    btn.addEventListener("click", () => cambiarEstado(caso.id, btn.dataset.estado));
  });

  const btnEnviarLink = div.querySelector(".btn-enviar-link");
  if (btnEnviarLink) {
    btnEnviarLink.addEventListener("click", () => {
      const dir = window.location.pathname.replace(/admin\/(index\.html)?$/, "");
      const link = `${window.location.origin}${dir}editar.html?id=${caso.id}&token=${caso.edit_token}`;
      const texto = `Hola ${caso.nombre}, tu caso en Somos Vecinos ya fue verificado. Este es tu link privado para editarlo si necesitás actualizar algo: ${link}\n\nNo lo compartas, solo es para vos.`;
      window.open(linkWhatsapp(caso.contacto, texto), "_blank", "noopener");
    });
  }

  const contenedorItems = div.querySelector(".admin-items");
  (caso.caso_items || []).forEach((item) => contenedorItems.appendChild(filaItem(item)));

  return div;
}

async function cambiarEstado(id, estado) {
  const { error } = await supabaseClient.from("casos").update({ estado }).eq("id", id);
  if (error) {
    alert(`Error: ${error.message}`);
    return;
  }
  cargarCasos();
}

async function actualizarItem(id, cantidad_recibida) {
  const { error } = await supabaseClient.from("caso_items").update({ cantidad_recibida }).eq("id", id);
  if (error) {
    alert(`Error: ${error.message}`);
    return;
  }
  cargarCasos();
}

async function cargarCasos() {
  const { data, error } = await supabaseClient
    .from("casos")
    .select(
      "id, nombre, ciudad, tipo_necesidad, urgencia, descripcion, foto_url, contacto, estado, created_at, edit_token, caso_items(*), caso_fotos(*), reportes(id, motivo, detalle, created_at)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    listaPendientes.innerHTML = `<p class="mensaje error">Error: ${error.message}</p>`;
    return;
  }

  const pendientes = data.filter((c) => c.estado === "pendiente");
  const otros = data.filter((c) => c.estado !== "pendiente");

  listaPendientes.innerHTML = "";
  listaOtros.innerHTML = "";

  if (pendientes.length === 0) {
    listaPendientes.innerHTML = `<p class="vacio">No hay casos pendientes.</p>`;
  } else {
    pendientes.forEach((c) => listaPendientes.appendChild(filaCaso(c)));
  }

  if (otros.length === 0) {
    listaOtros.innerHTML = `<p class="vacio">Sin otros casos.</p>`;
  } else {
    otros.forEach((c) => listaOtros.appendChild(filaCaso(c)));
  }
}

if (sessionStorage.getItem("sv_admin") === "1") {
  mostrarPanel();
}
