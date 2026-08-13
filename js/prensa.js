const statCasos = document.getElementById("stat-casos");
const statCiudades = document.getElementById("stat-ciudades");

async function cargarCifras() {
  const { data, error } = await supabaseClient
    .from("casos")
    .select("ciudad")
    .eq("estado", "verificado");

  if (error) {
    statCasos.textContent = "—";
    statCiudades.textContent = "—";
    return;
  }

  statCasos.textContent = data.length;
  statCiudades.textContent = new Set(data.map((c) => c.ciudad)).size;
}

cargarCifras();
