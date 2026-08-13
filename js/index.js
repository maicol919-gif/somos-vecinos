const grid = document.getElementById("grid");
const vacio = document.getElementById("vacio");
const skeleton = document.getElementById("skeleton");
const filtroCiudad = document.getElementById("filtro-ciudad");
const filtroNecesidad = document.getElementById("filtro-necesidad");
const overlay = document.getElementById("overlay");
const modalNombre = document.getElementById("modal-nombre");
const modalContacto = document.getElementById("modal-contacto");
const modalWhatsapp = document.getElementById("modal-whatsapp");
const cerrarModal = document.getElementById("cerrar-modal");
const contadorCasos = document.getElementById("contador-casos");
const destacadoWrap = document.getElementById("destacado-wrap");

const ETIQUETAS = {
  vivienda: "Vivienda",
  alimentos: "Alimentos",
  dinero: "Dinero",
  medicina: "Medicina",
  otro: "Otro",
};

const ICONOS = {
  vivienda: "\u{1F3E0}",
  alimentos: "\u{1F372}",
  dinero: "\u{1F4B0}",
  medicina: "\u{1F48A}",
  otro: "\u{1F91D}",
};

let casos = [];

function linkWhatsapp(contacto, texto) {
  const soloNumeros = contacto.replace(/[^0-9]/g, "");
  const esTelefono = soloNumeros.length >= 7 && soloNumeros.length === contacto.replace(/[\s()-]/g, "").length;
  const base = esTelefono ? `https://wa.me/${soloNumeros}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}

function crearCardHTML(caso) {
  const foto = caso.foto_url
    ? `<img src="${caso.foto_url}" alt="Foto de ${caso.nombre}">`
    : `<div class="foto-placeholder">Sin foto</div>`;

  return `
    ${foto}
    <div class="card-body">
      <div class="ciudad">${caso.ciudad}</div>
      <span class="tag">${ICONOS[caso.tipo_necesidad] || ""} ${ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad}</span>
      <span class="badge-verificado">Verificado</span>
      <h3>${caso.nombre}</h3>
      <div class="descripcion">${caso.descripcion}</div>
      <div class="card-acciones">
        <button class="btn-ayudar">Quiero ayudar</button>
        <button class="btn-compartir">Compartir</button>
      </div>
    </div>
  `;
}

function abrirModal(caso) {
  modalNombre.textContent = caso.nombre;
  modalContacto.textContent = caso.contacto;
  modalWhatsapp.href = linkWhatsapp(caso.contacto, `Hola, vi tu caso en Somos Vecinos y quiero ayudar`);
  overlay.classList.remove("hidden");
}

function compartirCaso(caso) {
  const url = `${window.location.origin}${window.location.pathname}`;
  const texto = `${caso.nombre} en ${caso.ciudad} necesita ayuda (${ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad}). Míralo en Somos Vecinos: ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
}

function renderDestacado(caso) {
  destacadoWrap.innerHTML = "";
  if (!caso) return;

  const wrap = document.createElement("div");
  wrap.className = "destacado";
  wrap.innerHTML = `<div class="destacado-etiqueta">Caso destacado</div>`;

  const card = document.createElement("div");
  card.className = "card card-destacado";
  card.innerHTML = crearCardHTML(caso);
  card.querySelector(".btn-ayudar").addEventListener("click", () => abrirModal(caso));
  card.querySelector(".btn-compartir").addEventListener("click", () => compartirCaso(caso));

  wrap.appendChild(card);
  destacadoWrap.appendChild(wrap);
}

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
    card.innerHTML = crearCardHTML(caso);

    card.querySelector(".btn-ayudar").addEventListener("click", () => abrirModal(caso));
    card.querySelector(".btn-compartir").addEventListener("click", () => compartirCaso(caso));

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

  skeleton.classList.add("hidden");

  if (error) {
    grid.innerHTML = `<p class="mensaje error">Error al cargar casos: ${error.message}</p>`;
    return;
  }

  casos = data;
  contadorCasos.textContent = `${casos.length} caso${casos.length === 1 ? "" : "s"} activo${casos.length === 1 ? "" : "s"}`;
  contadorCasos.classList.remove("hidden");
  renderDestacado(casos[0]);
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
