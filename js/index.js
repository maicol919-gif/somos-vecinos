const grid = document.getElementById("grid");
const vacio = document.getElementById("vacio");
const filtroCiudad = document.getElementById("filtro-ciudad");
const filtroNecesidad = document.getElementById("filtro-necesidad");
const overlay = document.getElementById("overlay");
const modalNombre = document.getElementById("modal-nombre");
const modalContacto = document.getElementById("modal-contacto");
const cerrarModal = document.getElementById("cerrar-modal");

const ETIQUETAS = {
  vivienda: "Vivienda",
  alimentos: "Alimentos",
  dinero: "Dinero",
  medicina: "Medicina",
  otro: "Otro",
};

let casos = [];

function renderCasos() {
  const ciudad = filtroCiudad.value;
  const necesidad = filtroNecesidad.value;

  const filtrados = casos.filter((c) => {
    return (!ciudad || c.ciudad === ciudad) && (!necesidad || c.tipo_necesidad === necesidad);
  });

  grid.innerHTML = "";

  if (filtrados.length === 0) {
    vacio.classList.remove("hidden");
    return;
  }
  vacio.classList.add("hidden");

  for (const caso of filtrados) {
    const card = document.createElement("div");
    card.className = "card";

    const foto = caso.foto_url
      ? `<img src="${caso.foto_url}" alt="Foto de ${caso.nombre}">`
      : `<div class="foto-placeholder">Sin foto</div>`;

    card.innerHTML = `
      ${foto}
      <div class="card-body">
        <span class="tag">${ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad}</span>
        <h3>${caso.nombre}</h3>
        <div class="ciudad">${caso.ciudad}</div>
        <div class="descripcion">${caso.descripcion}</div>
        <button class="btn-ayudar">Quiero ayudar</button>
      </div>
    `;

    card.querySelector(".btn-ayudar").addEventListener("click", () => {
      modalNombre.textContent = caso.nombre;
      modalContacto.textContent = caso.contacto;
      overlay.classList.remove("hidden");
    });

    grid.appendChild(card);
  }
}

function poblarFiltroCiudades() {
  const ciudades = [...new Set(casos.map((c) => c.ciudad))].sort();
  for (const ciudad of ciudades) {
    const opt = document.createElement("option");
    opt.value = ciudad;
    opt.textContent = ciudad;
    filtroCiudad.appendChild(opt);
  }
}

async function cargarCasos() {
  const { data, error } = await supabaseClient
    .from("casos")
    .select("*")
    .eq("estado", "verificado")
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="mensaje error">Error al cargar casos: ${error.message}</p>`;
    return;
  }

  casos = data;
  poblarFiltroCiudades();
  renderCasos();
}

filtroCiudad.addEventListener("change", renderCasos);
filtroNecesidad.addEventListener("change", renderCasos);
cerrarModal.addEventListener("click", () => overlay.classList.add("hidden"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.add("hidden");
});

cargarCasos();
