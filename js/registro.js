const form = document.getElementById("form-registro");
const descripcion = document.getElementById("descripcion");
const contadorDesc = document.getElementById("contador-desc");
const mensaje = document.getElementById("mensaje");
const btnEnviar = document.getElementById("btn-enviar");
const itemsLista = document.getElementById("items-lista");
const btnAgregarItem = document.getElementById("btn-agregar-item");

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
    const archivo = document.getElementById("foto").files[0];
    let foto_url = null;

    if (archivo) {
      foto_url = await subirFoto(archivo);
    }

    const { data: casoCreado, error } = await supabaseClient
      .from("casos")
      .insert({
        nombre: document.getElementById("nombre").value.trim(),
        ciudad: document.getElementById("ciudad").value.trim(),
        tipo_necesidad: document.getElementById("tipo_necesidad").value,
        urgencia: document.getElementById("urgencia").value,
        descripcion: descripcion.value.trim(),
        foto_url,
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

    mostrarMensaje("¡Caso registrado! Será revisado antes de publicarse.", "ok");
    form.reset();
    contadorDesc.textContent = "0";
    itemsLista.innerHTML = "";
    agregarFilaItem();
  } catch (err) {
    mostrarMensaje(`Error al registrar: ${err.message}`, "error");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar caso";
  }
});
