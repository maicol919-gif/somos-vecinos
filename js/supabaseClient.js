// Config Supabase - proyecto "somos-vecinos"
const SUPABASE_URL = "https://rgxmtxrymncsnzozjtkd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneG10eHJ5bW5jc256b3pqdGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDMzNzUsImV4cCI6MjEwMjIxOTM3NX0.z_8nUe_JcgnK4bfSjynSMv4gjoBuCnMa8JxMUVsCziQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
