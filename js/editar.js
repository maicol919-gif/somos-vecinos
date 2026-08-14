const params = new URLSearchParams(window.location.search);
const casoId = params.get("id");
const token = params.get("token");

const cargando = document.getElementById("cargando");
const noEncontrado = document.getElementById("no-encontrado");
const editarWrap = document.getElementById("editar-wrap");
const form = document.getElementById("form-editar");
const mensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btn-guardar");
const descripcion = document.getElementById("descripcion");
const contadorDesc = document.getElementById("contador-desc");
const itemsLista = document.getElementById("items-lista");
const btnAgregarItem = document.getElementById("btn-agregar-item");
const fotoInput = document.getElementById("foto-input");
const btnAgregarFoto = document.getElementById("btn-agregar-foto");
const fotosPreview = document.getElementById("fotos-preview");

const MAX_FOTOS = 5;
let fotosExistentes = [];
let fotosEliminadas = [];
let fotosNuevas = [];

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

function agregarFilaItem(item) {
  const fila = document.createElement("div");
  fila.className = "item-fila";
  fila.innerHTML = `
    <input type="text" class="item-nombre" placeholder="Ej: Agua" maxlength="60" value="${item ? item.nombre : ""}">
    <input type="number" class="item-cantidad" placeholder="Cantidad" min="0.1" step="0.1" value="${item ? item.cantidad_requerida : ""}">
    <input type="text" class="item-unidad" placeholder="Unidad (L, raciones...)" maxlength="20" value="${item ? item.unidad : ""}">
    <button type="button" class="item-quitar" aria-label="Quitar ítem">&times;</button>
  `;
  fila.querySelector(".item-quitar").addEventListener("click", () => fila.remove());
  itemsLista.appendChild(fila);
}

btnAgregarItem.addEventListener("click", () => agregarFilaItem());

function leerItems() {
  return [...itemsLista.querySelectorAll(".item-fila")]
    .map((fila) => ({
      nombre: fila.querySelector(".item-nombre").value.trim(),
      cantidad_requerida: parseFloat(fila.querySelector(".item-cantidad").value),
      unidad: fila.querySelector(".item-unidad").value.trim(),
    }))
    .filter((item) => item.nombre && item.unidad && item.cantidad_requerida > 0);
}

function actualizarFotosPreview() {
  fotosPreview.innerHTML = "";

  fotosExistentes.forEach((foto) => {
    const item = document.createElement("div");
    item.className = "foto-preview-item";
    item.innerHTML = `<img src="${foto.url}" alt="Foto"><button type="button" class="foto-preview-quitar" aria-label="Quitar foto">&times;</button>`;
    item.querySelector(".foto-preview-quitar").addEventListener("click", () => {
      fotosEliminadas.push(foto.id);
      fotosExistentes = fotosExistentes.filter((f) => f.id !== foto.id);
      actualizarFotosPreview();
    });
    fotosPreview.appendChild(item);
  });

  fotosNuevas.forEach((archivo, i) => {
    const item = document.createElement("div");
    item.className = "foto-preview-item";
    item.innerHTML = `<img src="${URL.createObjectURL(archivo)}" alt="Foto nueva"><button type="button" class="foto-preview-quitar" aria-label="Quitar foto">&times;</button>`;
    item.querySelector(".foto-preview-quitar").addEventListener("click", () => {
      fotosNuevas.splice(i, 1);
      actualizarFotosPreview();
    });
    fotosPreview.appendChild(item);
  });

  const total = fotosExistentes.length + fotosNuevas.length;
  btnAgregarFoto.disabled = total >= MAX_FOTOS;
  btnAgregarFoto.textContent = total >= MAX_FOTOS ? "Máximo 5 fotos" : "+ Agregar fotos";
}

btnAgregarFoto.addEventListener("click", () => fotoInput.click());

fotoInput.addEventListener("change", () => {
  const disponibles = MAX_FOTOS - (fotosExistentes.length + fotosNuevas.length);
  fotosNuevas.push(...[...fotoInput.files].slice(0, disponibles));
  fotoInput.value = "";
  actualizarFotosPreview();
});

descripcion.addEventListener("input", () => {
  contadorDesc.textContent = descripcion.value.length;
});

async function subirFoto(archivo) {
  const ext = archivo.name.split(".").pop();
  const nombreArchivo = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage.from("fotos-casos").upload(nombreArchivo, archivo);
  if (error) throw error;
  const { data } = supabaseClient.storage.from("fotos-casos").getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

async function cargarCaso() {
  if (!casoId || !token) {
    cargando.classList.add("hidden");
    noEncontrado.classList.remove("hidden");
    return;
  }

  const { data, error } = await supabaseClient
    .from("casos")
    .select("*, caso_items(*), caso_fotos(*)")
    .eq("id", casoId)
    .eq("edit_token", token)
    .maybeSingle();

  cargando.classList.add("hidden");

  if (error || !data) {
    noEncontrado.classList.remove("hidden");
    return;
  }

  document.getElementById("ciudad").value = data.ciudad;
  descripcion.value = data.descripcion;
  contadorDesc.textContent = data.descripcion.length;
  document.getElementById("tipo_necesidad").value = data.tipo_necesidad;
  document.getElementById("urgencia").value = data.urgencia;
  document.getElementById("contacto").value = data.contacto;

  (data.caso_items || []).forEach((item) => agregarFilaItem(item));
  if (!data.caso_items || data.caso_items.length === 0) agregarFilaItem();

  fotosExistentes = (data.caso_fotos || []).map((f) => ({ id: f.id, url: f.url }));
  actualizarFotosPreview();

  editarWrap.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";
  mensaje.className = "mensaje hidden";

  try {
    const { data: actualizado, error } = await supabaseClient
      .from("casos")
      .update({
        ciudad: document.getElementById("ciudad").value.trim(),
        descripcion: descripcion.value.trim(),
        tipo_necesidad: document.getElementById("tipo_necesidad").value,
        urgencia: document.getElementById("urgencia").value,
        contacto: document.getElementById("contacto").value.trim(),
      })
      .eq("id", casoId)
      .eq("edit_token", token)
      .select();

    if (error) throw error;
    if (!actualizado || actualizado.length === 0) throw new Error("Link inválido, no se pudo actualizar.");

    await supabaseClient.from("caso_items").delete().eq("caso_id", casoId);
    const items = leerItems();
    if (items.length > 0) {
      const { error: errorItems } = await supabaseClient
        .from("caso_items")
        .insert(items.map((item) => ({ ...item, caso_id: casoId })));
      if (errorItems) throw errorItems;
    }

    if (fotosEliminadas.length > 0) {
      await supabaseClient.from("caso_fotos").delete().in("id", fotosEliminadas);
      fotosEliminadas = [];
    }

    if (fotosNuevas.length > 0) {
      const urls = await Promise.all(fotosNuevas.map((archivo) => subirFoto(archivo)));
      const { error: errorFotos } = await supabaseClient
        .from("caso_fotos")
        .insert(urls.map((url) => ({ url, caso_id: casoId })));
      if (errorFotos) throw errorFotos;
      fotosNuevas = [];
    }

    mostrarMensaje("Cambios guardados.", "ok");
  } catch (err) {
    mostrarMensaje(`Error al guardar: ${err.message}`, "error");
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar cambios";
  }
});

cargarCaso();
