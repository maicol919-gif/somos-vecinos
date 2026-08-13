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

function filaCaso(caso) {
  const div = document.createElement("div");
  div.className = "fila-caso";

  const foto = caso.foto_url
    ? `<img src="${caso.foto_url}" alt="Foto de ${caso.nombre}">`
    : "";

  const acciones = caso.estado === "pendiente"
    ? `<button class="btn-verificar" data-id="${caso.id}" data-estado="verificado">Verificar</button>
       <button class="btn-rechazar" data-id="${caso.id}" data-estado="rechazado">Rechazar</button>`
    : `<span class="estado-badge estado-${caso.estado}">${caso.estado}</span>`;

  div.innerHTML = `
    ${foto}
    <div class="info">
      <h4>${caso.nombre} — ${caso.ciudad}</h4>
      <p>${ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad}</p>
      <p>${caso.descripcion}</p>
      <p><strong>Contacto:</strong> ${caso.contacto}</p>
    </div>
    <div class="acciones">${acciones}</div>
  `;

  div.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => cambiarEstado(caso.id, btn.dataset.estado));
  });

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

async function cargarCasos() {
  const { data, error } = await supabaseClient
    .from("casos")
    .select("*")
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
