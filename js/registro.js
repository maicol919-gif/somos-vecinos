const form = document.getElementById("form-registro");
const descripcion = document.getElementById("descripcion");
const contadorDesc = document.getElementById("contador-desc");
const mensaje = document.getElementById("mensaje");
const btnEnviar = document.getElementById("btn-enviar");
const itemsLista = document.getElementById("items-lista");
const btnAgregarItem = document.getElementById("btn-agregar-item");
const fotoInput = document.getElementById("foto-input");
const btnAgregarFoto = document.getElementById("btn-agregar-foto");
const fotosPreview = document.getElementById("fotos-preview");
const exitoRegistro = document.getElementById("exito-registro");
const linkEditarInput = document.getElementById("link-editar");
const btnCopiarLink = document.getElementById("btn-copiar-link");
const linkEditarWhatsapp = document.getElementById("link-editar-whatsapp");

btnCopiarLink.addEventListener("click", async () => {
  await navigator.clipboard.writeText(linkEditarInput.value);
  btnCopiarLink.textContent = "¡Copiado!";
  setTimeout(() => { btnCopiarLink.textContent = "Copiar"; }, 2000);
});

const MAX_FOTOS = 5;
let fotosSeleccionadas = [];

function actualizarFotosPreview() {
  fotosPreview.innerHTML = "";
  fotosSeleccionadas.forEach((archivo, i) => {
    const item = document.createElement("div");
    item.className = "foto-preview-item";
    item.innerHTML = `<img src="${URL.createObjectURL(archivo)}" alt="Foto ${i + 1}"><button type="button" class="foto-preview-quitar" aria-label="Quitar foto">&times;</button>`;
    item.querySelector(".foto-preview-quitar").addEventListener("click", () => {
      fotosSeleccionadas.splice(i, 1);
      actualizarFotosPreview();
    });
    fotosPreview.appendChild(item);
  });
  btnAgregarFoto.disabled = fotosSeleccionadas.length >= MAX_FOTOS;
  btnAgregarFoto.textContent = fotosSeleccionadas.length >= MAX_FOTOS ? "Máximo 5 fotos" : "+ Agregar fotos";
}

btnAgregarFoto.addEventListener("click", () => fotoInput.click());

fotoInput.addEventListener("change", () => {
  const disponibles = MAX_FOTOS - fotosSeleccionadas.length;
  const nuevas = [...fotoInput.files].slice(0, disponibles);
  fotosSeleccionadas.push(...nuevas);
  fotoInput.value = "";
  actualizarFotosPreview();
});

descripcion.addEventListener("input", () => {
  contadorDesc.textContent = descripcion.value.length;
});

function agregarFilaItem() {
  const fila = document.createElement("div");
  fila.className = "item-fila";
  fila.innerHTML = `
    <input type="text" class="item-nombre" placeholder="Ej: Agua" maxlength="60">
    <input type="number" class="item-cantidad" placeholder="Cantidad" min="0.1" step="0.1">
    <input type="text" class="item-unidad" placeholder="Unidad (L, raciones...)" maxlength="20">
    <button type="button" class="item-quitar" aria-label="Quitar ítem">&times;</button>
  `;
  fila.querySelector(".item-quitar").addEventListener("click", () => fila.remove());
  itemsLista.appendChild(fila);
}

btnAgregarItem.addEventListener("click", agregarFilaItem);
agregarFilaItem();

function leerItems() {
  return [...itemsLista.querySelectorAll(".item-fila")]
    .map((fila) => ({
      nombre: fila.querySelector(".item-nombre").value.trim(),
      cantidad_requerida: parseFloat(fila.querySelector(".item-cantidad").value),
      unidad: fila.querySelector(".item-unidad").value.trim(),
    }))
    .filter((item) => item.nombre && item.unidad && item.cantidad_requerida > 0);
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

async function subirFoto(archivo) {
  const ext = archivo.name.split(".").pop();
  const nombreArchivo = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("fotos-casos")
    .upload(nombreArchivo, archivo);

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("fotos-casos")
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";
  mensaje.className = "mensaje hidden";

  try {
    const { data: casoCreado, error } = await supabaseClient
      .from("casos")
      .insert({
        nombre: document.getElementById("nombre").value.trim(),
        ciudad: document.getElementById("ciudad").value.trim(),
        tipo_necesidad: document.getElementById("tipo_necesidad").value,
        urgencia: document.getElementById("urgencia").value,
        descripcion: descripcion.value.trim(),
        contacto: document.getElementById("contacto").value.trim(),
        estado: "pendiente",
      })
      .select()
      .single();

    if (error) throw error;

    const items = leerItems();
    if (items.length > 0) {
      const { error: errorItems } = await supabaseClient.from("caso_items").insert(
        items.map((item) => ({ ...item, caso_id: casoCreado.id }))
      );
      if (errorItems) throw errorItems;
    }

    if (fotosSeleccionadas.length > 0) {
      const urls = await Promise.all(fotosSeleccionadas.map((archivo) => subirFoto(archivo)));
      const { error: errorFotos } = await supabaseClient.from("caso_fotos").insert(
        urls.map((url) => ({ url, caso_id: casoCreado.id }))
      );
      if (errorFotos) throw errorFotos;
    }

    const linkEditar = `${window.location.origin}${window.location.pathname.replace("registro.html", "")}editar.html?id=${casoCreado.id}&token=${casoCreado.edit_token}`;
    linkEditarInput.value = linkEditar;
    linkEditarWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(`Este es el link para editar mi caso en Somos Vecinos: ${linkEditar}`)}`;
    exitoRegistro.classList.remove("hidden");
    exitoRegistro.scrollIntoView({ behavior: "smooth" });

    form.reset();
    contadorDesc.textContent = "0";
    itemsLista.innerHTML = "";
    agregarFilaItem();
    fotosSeleccionadas = [];
    actualizarFotosPreview();
  } catch (err) {
    mostrarMensaje(`Error al registrar: ${err.message}`, "error");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar caso";
  }
});
