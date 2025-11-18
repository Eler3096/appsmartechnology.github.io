// PROTECCIÓN DE ACCESO
// =======================
auth.onAuthStateChanged(user => {
  if (!user) location.href = "admin-login.html";
});
function logout() { auth.signOut(); }

// =======================
// VARIABLES GLOBALES
// =======================
let editId = null; 
let prevSize = null; 

// =======================
// MOSTRAR / OCULTAR LISTA
// =======================
function toggleApps() {
  const box = document.getElementById("appsContainer");
  const btn = document.getElementById("toggleBtn");

  box.classList.toggle("hidden");
  btn.textContent = box.classList.contains("hidden")
    ? "📦 Apps Subidas"
    : "📦 Ocultar Apps";
}

// =======================
// LISTADO DE APPS
// =======================
const appsList = document.getElementById("appsList");

db.collection("apps").orderBy("fecha", "desc").onSnapshot(snap => {
  appsList.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><img src="${a.icono}" class="table-icon"></td>
      <td>${a.nombre}</td>
      <td>${a.categoria}</td>
      <td>${a.version}</td>
      <td>
        <button class="btn-edit" onclick="cargarParaEditar('${a.id}')">✏️ Editar</button>
        <button class="btn-delete" onclick="eliminarApp('${a.id}')">🗑 Eliminar</button>
      </td>
    `;

    appsList.appendChild(tr);
  });
});

// =======================
// CARGAR APP PARA EDITAR
// =======================
function cargarParaEditar(id) {
  editId = id;

  document.getElementById("formTitle").textContent = "✏️ Editar Aplicación";
  document.getElementById("subirBtn").textContent = "GUARDAR";

  db.collection("apps").doc(id).get().then(doc => {
    const a = doc.data();

    document.getElementById("nombre").value = a.nombre;
    document.getElementById("descripcion").value = a.descripcion;
    document.getElementById("version").value = a.version;
    document.getElementById("categoria").value = a.categoria;
    document.getElementById("idioma").value = a.idioma;
    document.getElementById("tipo").value = a.tipo;
    document.getElementById("internet").value = a.internet;

    document.getElementById("sistema").value = a.sistemaOperativo || "";
    document.getElementById("requisitos").value = a.requisitos || "";
    document.getElementById("fechaAct").value = a.fechaActualizacion || "";
    document.getElementById("edad").value = a.edad || "";
    document.getElementById("anuncios").value = a.anuncios || "no";
    document.getElementById("privacidad").value = a.privacidadUrl || "";

    // Asignación de las URLs de las capturas (hasta 6)
    document.getElementById("imagenUrl").value = a.imagen || "";
    for (let i = 0; i < 6; i++) {
      document.getElementById(`capturaUrl${i + 1}`).value = a.imgSecundarias ? a.imgSecundarias[i] || "" : "";
    }
    document.getElementById("iconoUrl").value = a.icono || "";  // Campo para el icono
    document.getElementById("apkUrl").value = a.apk || "";  // Campo para el APK

    prevSize = a.size || null;

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// =======================
// ELIMINAR APP
// =======================
function eliminarApp(id) {
  if (!confirm("¿Eliminar esta aplicación?")) return;

  const ref = db.collection("apps").doc(id);

  ref.delete()
  .then(() => alert("Aplicación eliminada ✔"))
  .catch(err => alert("Error: " + err.message));
}

// =======================
// GUARDAR / EDITAR APP
// =======================
function guardarApp() {
  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const version = document.getElementById("version").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const idioma = document.getElementById("idioma").value.trim();
  const tipo = document.getElementById("tipo").value.trim();
  const internet = document.getElementById("internet").value;

  const sistema = document.getElementById("sistema").value.trim();
  const requisitos = document.getElementById("requisitos").value.trim();
  const fechaAct = document.getElementById("fechaAct").value;
  const edad = document.getElementById("edad").value.trim();
  const anuncios = document.getElementById("anuncios").value;
  const privacidad = document.getElementById("privacidad").value.trim();

  // NUEVOS CAMPOS
  const imagenUrl = document.getElementById("imagenUrl").value.trim();
  const capturasUrl1 = document.getElementById("capturaUrl1").value.trim();
  const capturasUrl2 = document.getElementById("capturaUrl2").value.trim();
  const capturasUrl3 = document.getElementById("capturaUrl3").value.trim();
  const capturasUrl4 = document.getElementById("capturaUrl4").value.trim();
  const capturasUrl5 = document.getElementById("capturaUrl5").value.trim();
  const capturasUrl6 = document.getElementById("capturaUrl6").value.trim();
  const iconoUrl = document.getElementById("iconoUrl").value.trim(); // Enlace del icono
  const apkUrl = document.getElementById("apkUrl").value.trim();  // Enlace del APK

  const estado = document.getElementById("estado");
  const btn = document.getElementById("subirBtn");

  if (!nombre || !descripcion || !version) {
    alert("Completa los campos requeridos");
    return;
  }

  btn.disabled = true;
  estado.textContent = "Procesando…";

  let docRef, id;

  if (editId === null) {
    docRef = db.collection("apps").doc();
    id = docRef.id;
  } else {
    docRef = db.collection("apps").doc(editId);
    id = editId;
  }

  // Agrupamos las URLs de las capturas
  const capturas = [capturasUrl1, capturasUrl2, capturasUrl3, capturasUrl4, capturasUrl5, capturasUrl6].filter(url => url);

  const data = {
    id,
    nombre,
    descripcion,
    version,
    categoria,
    idioma,
    tipo,
    internet,
    sistemaOperativo: sistema,
    requisitos,
    fechaActualizacion: fechaAct,
    edad,
    anuncios,
    privacidadUrl: privacidad,
    fecha: Date.now(),
    imagen: imagenUrl,
    imgSecundarias: capturas,
    icono: iconoUrl,
    apk: apkUrl,
    size: prevSize || "N/A"
  };

  docRef.set(data, { merge: true })
  .then(() => {
    estado.textContent = "Guardado ✔";
    btn.disabled = false;

    editId = null;
    prevSize = null;

    document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
    document.getElementById("subirBtn").textContent = "SUBIR APP";

    limpiarFormulario();
  })
  .catch(err => {
    estado.textContent = "Error: " + err.message;
    btn.disabled = false;
  });
}

// =======================
// LIMPIAR FORMULARIO
// =======================
function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("version").value = "";
  document.getElementById("categoria").value = "Educación";
  document.getElementById("idioma").value = "";
  document.getElementById("tipo").value = "Gratis";
  document.getElementById("internet").value = "offline";

  document.getElementById("sistema").value = "";
  document.getElementById("requisitos").value = "";
  document.getElementById("fechaAct").value = "";
  document.getElementById("edad").value = "";
  document.getElementById("anuncios").value = "no";
  document.getElementById("privacidad").value = "";

  document.getElementById("imagenUrl").value = "";
  document.getElementById("capturaUrl1").value = "";
  document.getElementById("capturaUrl2").value = "";
  document.getElementById("capturaUrl3").value = "";
  document.getElementById("capturaUrl4").value = "";
  document.getElementById("capturaUrl5").value = "";
  document.getElementById("capturaUrl6").value = "";
  document.getElementById("iconoUrl").value = "";  // Limpiar campo del icono
  document.getElementById("apkUrl").value = "";  // Limpiar campo del APK
}
