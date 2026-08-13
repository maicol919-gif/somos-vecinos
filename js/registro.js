const form = document.getElementById("form-registro");
const descripcion = document.getElementById("descripcion");
const contadorDesc = document.getElementById("contador-desc");
const mensaje = document.getElementById("mensaje");
const btnEnviar = document.getElementById("btn-enviar");

descripcion.addEventListener("input", () => {
  contadorDesc.textContent = descripcion.value.length;
});

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

    const { error } = await supabaseClient.from("casos").insert({
      nombre: document.getElementById("nombre").value.trim(),
      ciudad: document.getElementById("ciudad").value.trim(),
      tipo_necesidad: document.getElementById("tipo_necesidad").value,
      descripcion: descripcion.value.trim(),
      foto_url,
      contacto: document.getElementById("contacto").value.trim(),
      estado: "pendiente",
    });

    if (error) throw error;

    mostrarMensaje("¡Caso registrado! Será revisado antes de publicarse.", "ok");
    form.reset();
    contadorDesc.textContent = "0";
  } catch (err) {
    mostrarMensaje(`Error al registrar: ${err.message}`, "error");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar caso";
  }
});
