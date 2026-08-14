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
const metricCasos = document.getElementById("metric-casos");
const metricCiudades = document.getElementById("metric-ciudades");
const dashList = document.getElementById("dash-list");
const dashDetail = document.getElementById("dash-detail");
const modalDetalle = document.getElementById("modal-detalle");

const ETIQUETAS = {
  vivienda: "Vivienda",
  alimentos: "Alimentos",
  dinero: "Dinero",
  medicina: "Medicina",
  otro: "Otro",
};

const URGENCIA_TEXTO = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

const SILUETA_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 21c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"/></svg>`;

const MAPPIN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`;

const SHARE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><line x1="8" y1="10.8" x2="16" y2="6.2"/><line x1="8" y1="13.2" x2="16" y2="17.8"/></svg>`;

const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="4 12.5 9.5 18 20 6"/></svg>`;

function fotoPrincipal(caso) {
  return (caso.caso_fotos && caso.caso_fotos[0] && caso.caso_fotos[0].url) || caso.foto_url || null;
}

function crearGaleriaHTML(caso) {
  const fotos = caso.caso_fotos && caso.caso_fotos.length
    ? caso.caso_fotos.map((f) => f.url)
    : caso.foto_url
    ? [caso.foto_url]
    : [];

  if (fotos.length === 0) {
    return `<div class="det-foto">${SILUETA_SVG}</div>`;
  }

  const miniaturas = fotos.length > 1
    ? `<div class="galeria-miniaturas">${fotos
        .map((url, i) => `<img src="${url}" class="galeria-mini${i === 0 ? " activa" : ""}" data-url="${url}" alt="Foto ${i + 1} de ${caso.nombre}">`)
        .join("")}</div>`
    : "";

  return `<div class="det-foto"><img class="galeria-principal" src="${fotos[0]}" alt="Foto de ${caso.nombre}"></div>${miniaturas}`;
}

function activarGaleria(contenedor) {
  const principal = contenedor.querySelector(".galeria-principal");
  if (!principal) return;
  contenedor.querySelectorAll(".galeria-mini").forEach((mini) => {
    mini.addEventListener("click", () => {
      principal.src = mini.dataset.url;
      contenedor.querySelectorAll(".galeria-mini").forEach((m) => m.classList.remove("activa"));
      mini.classList.add("activa");
    });
  });
}

function pct(item) {
  return Math.max(0, Math.min(100, Math.round((item.cantidad_recibida / item.cantidad_requerida) * 100)));
}

function crearItemsMiniHTML(items) {
  if (!items || items.length === 0) return "";
  const visibles = items.slice(0, 2);
  const resto = items.length - visibles.length;
  const barras = visibles
    .map(
      (item) => `
    <div class="item-mini">
      <div class="item-mini-cabeza"><span>${item.nombre}</span><b>${pct(item)}%</b></div>
      <div class="barra"><div class="barra-fill" style="width:${pct(item)}%"></div></div>
    </div>`
    )
    .join("");
  const mas = resto > 0 ? `<span class="item-mini-mas">+${resto} más</span>` : "";
  return barras + mas;
}

function crearItemsFullHTML(items) {
  if (!items || items.length === 0) return "";
  return `
    <div class="dash-items-row">
      ${items
        .map(
          (item) => `
        <div class="item-full">
          <div class="item-full-cabeza"><span class="item-full-nombre">${item.nombre}</span><span class="item-full-pct">${pct(item)}%</span></div>
          <div class="barra"><div class="barra-fill" style="width:${pct(item)}%"></div></div>
          <div class="item-full-detalle">${item.cantidad_recibida} de ${item.cantidad_requerida} ${item.unidad}</div>
        </div>`
        )
        .join("")}
    </div>`;
}

let casos = [];
let casoSeleccionadoId = null;

function linkWhatsapp(contacto, texto) {
  const soloNumeros = contacto.replace(/[^0-9]/g, "");
  const esTelefono = soloNumeros.length >= 7 && soloNumeros.length === contacto.replace(/[\s()-]/g, "").length;
  const base = esTelefono ? `https://wa.me/${soloNumeros}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}

function crearCardHTML(caso) {
  const url = fotoPrincipal(caso);
  const foto = url
    ? `<img src="${url}" alt="Foto de ${caso.nombre}">`
    : `<div class="foto-placeholder">${SILUETA_SVG}</div>`;

  return `
    <div class="foto-wrap">
      ${foto}
      <span class="badge-urgencia badge-urgencia-${caso.urgencia}">${URGENCIA_TEXTO[caso.urgencia] || caso.urgencia}</span>
      <span class="badge-verif">${CHECK_SVG}Verificado</span>
    </div>
    <div class="card-body">
      <h3>${caso.nombre}</h3>
      <div class="ubicacion">${MAPPIN_SVG}${caso.ciudad}</div>
      <span class="tag">${ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad}</span>
      ${caso.caso_items && caso.caso_items.length ? crearItemsMiniHTML(caso.caso_items) : `<div class="descripcion">${caso.descripcion}</div>`}
      <div class="card-acciones">
        <button class="btn-ayudar">Quiero ayudar</button>
        <button class="btn-compartir" aria-label="Compartir">${SHARE_SVG}</button>
      </div>
    </div>
  `;
}

function crearMiniListItemHTML(caso, activo) {
  const url = fotoPrincipal(caso);
  const foto = url ? `<img src="${url}" alt="Foto de ${caso.nombre}">` : SILUETA_SVG;
  const resumenItems = caso.caso_items && caso.caso_items.length
    ? caso.caso_items.slice(0, 2).map((item) => `${item.nombre} ${pct(item)}%`).join(" · ")
    : ETIQUETAS[caso.tipo_necesidad] || caso.tipo_necesidad;

  return `
    <button type="button" class="need-card-mini${activo ? " activo" : ""}" data-id="${caso.id}">
      <span class="need-thumb">${foto}</span>
      <span class="need-mini-info">
        <h4>${caso.nombre}</h4>
        <span class="need-mini-meta"><span class="dot dot-${caso.urgencia}"></span>${URGENCIA_TEXTO[caso.urgencia] || caso.urgencia} · ${caso.ciudad}</span>
        <span class="need-mini-pct">${resumenItems}</span>
      </span>
    </button>
  `;
}

function crearDetallePanelHTML(caso) {
  return `
    ${crearGaleriaHTML(caso)}
    <h3 class="det-nombre">${caso.nombre}</h3>
    <div class="det-verif">${CHECK_SVG.replace('stroke="#fff"', 'stroke="currentColor"')}Necesidad verificada · ${caso.ciudad}</div>
    <p class="det-desc">${caso.descripcion}</p>
    ${caso.caso_items && caso.caso_items.length ? crearItemsFullHTML(caso.caso_items) : ""}
    <div class="card-acciones" style="margin-top:1rem; max-width:340px;">
      <button class="btn-ayudar" id="dash-btn-ayudar">Quiero ayudar</button>
      <button class="btn-compartir" id="dash-btn-compartir" aria-label="Compartir">${SHARE_SVG}</button>
    </div>
  `;
}

function renderDashDetail(caso) {
  casoSeleccionadoId = caso.id;
  dashDetail.innerHTML = crearDetallePanelHTML(caso);
  dashDetail.querySelector("#dash-btn-ayudar").addEventListener("click", () => abrirModal(caso));
  dashDetail.querySelector("#dash-btn-compartir").addEventListener("click", () => compartirCaso(caso));
  activarGaleria(dashDetail);
}

function renderDashList(filtrados) {
  if (filtrados.length === 0) {
    dashList.innerHTML = "";
    dashDetail.innerHTML = "";
    return;
  }

  const activoId = filtrados.some((c) => c.id === casoSeleccionadoId) ? casoSeleccionadoId : filtrados[0].id;

  dashList.innerHTML = filtrados.map((c) => crearMiniListItemHTML(c, c.id === activoId)).join("");
  dashList.querySelectorAll(".need-card-mini").forEach((btn) => {
    btn.addEventListener("click", () => {
      const caso = filtrados.find((c) => c.id === btn.dataset.id);
      dashList.querySelectorAll(".need-card-mini").forEach((b) => b.classList.remove("activo"));
      btn.classList.add("activo");
      renderDashDetail(caso);
    });
  });

  renderDashDetail(filtrados.find((c) => c.id === activoId));
}

function abrirModal(caso) {
  modalNombre.textContent = caso.nombre;
  modalDetalle.innerHTML = `
    ${crearGaleriaHTML(caso)}
    <p class="descripcion">${caso.descripcion}</p>
    ${caso.caso_items && caso.caso_items.length ? crearItemsFullHTML(caso.caso_items) : ""}
  `;
  modalContacto.textContent = caso.contacto;
  modalWhatsapp.href = linkWhatsapp(caso.contacto, `Hola, vi tu caso en Somos Vecinos y quiero ayudar`);
  overlay.classList.remove("hidden");
  activarGaleria(modalDetalle);
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
    dashList.innerHTML = "";
    dashDetail.innerHTML = "";
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

  renderDashList(filtrados);
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
    .select("*, caso_items(*), caso_fotos(*)")
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
  metricCasos.textContent = casos.length;
  metricCiudades.textContent = new Set(casos.map((c) => c.ciudad)).size;
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
