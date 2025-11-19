// =======================================================
// PROTECCIÓN DE ACCESO
// =======================================================
auth.onAuthStateChanged(user => {
  if (!user) location.href = "admin-login.html";
});

function logout() {
  auth.signOut();
}

// =======================================================
// VARIABLES GLOBALES
// =======================================================
let editId = null;
let prevSize = null;
const appsList = document.getElementById("appsList");

// =======================================================
// MODAL APPS SUBIDAS
// =======================================================
function openAppsModal() {
  document.getElementById("modalApps").classList.remove("hidden");
}

function closeAppsModal() {
  document.getElementById("modalApps").classList.add("hidden");
}

// =======================================================
// CARGAR LISTA DE APPS AUTOMÁTICAMENTE
// =======================================================
db.collection("apps").orderBy("fecha", "desc").onSnapshot(snap => {
  appsList.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();

    const row = `
      <tr>
        <td><img src="${a.icono || a.imagen}" class="table-icon"></td>
        <td>${a.nombre}</td>
        <td>${a.categoria}</td>
        <td>${a.version}</td>

        <td>
          <button class="btn-edit" onclick="cargarParaEditar('${a.id}')">✏️ Editar</button>
          <button class="btn-delete" onclick="eliminarApp('${a.id}')">🗑 Eliminar</button>
        </td>
      </tr>
    `;

    appsList.innerHTML += row;
  });
});


// =======================================================
// CARGAR APP PARA EDITAR
// =======================================================
function cargarParaEditar(id) {
  editId = id;

  document.getElementById("formTitle").textContent = "✏️ Editar Aplicación";
  document.getElementById("subirBtn").textContent = "GUARDAR";

  db.collection("apps").doc(id).get().then(doc => {
    const a = doc.data();

    // Campos principales
    document.getElementById("nombre").value = a.nombre;
    document.getElementById("descripcion").value = a.descripcion;
    document.getElementById("version").value = a.version;
    document.getElementById("categoria").value = a.categoria;
    document.getElementById("idioma").value = a.idioma;
    document.getElementById("tipo").value = a.tipo;
    document.getElementById("internet").value = a.internet;

    // Extras
    document.getElementById("sistema").value = a.sistemaOperativo || "";
    document.getElementById("requisitos").value = a.requisitos || "";
    document.getElementById("fechaAct").value = a.fechaActualizacion || "";
    document.getElementById("edad").value = a.edad || "";
    document.getElementById("anuncios").value = a.anuncios || "no";
    document.getElementById("privacidad").value = a.privacidadUrl || "";

    // URLs
    document.getElementById("imagenUrl").value = a.imagen || "";
    document.getElementById("capturasUrl").value = a.imgSecundarias ? a.imgSecundarias.join(",") : "";
    document.getElementById("iconoUrl").value = a.icono || "";
    document.getElementById("apkUrl").value = a.apk || "";

    document.getElementById("size").value = a.size || "";
    prevSize = a.size || null;

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


// =======================================================
// ELIMINAR APP
// =======================================================
function eliminarApp(id) {
  if (!confirm("¿Eliminar esta aplicación?")) return;

  db.collection("apps").doc(id).delete()
  .then(() => alert("Aplicación eliminada ✔"))
  .catch(err => alert("Error: " + err.message));
}


// =======================================================
// GUARDAR / EDITAR APP
// =======================================================
async function guardarApp() {

  const btn = document.getElementById("subirBtn");
  const estado = document.getElementById("estado");

  // Desactivar botón
  btn.disabled = true;
  estado.textContent = "Guardando...";

  // Capturar campos
  const campos = {
    nombre: nombre.value.trim(),
    descripcion: descripcion.value.trim(),
    version: version.value.trim(),
    categoria: categoria.value.trim(),
    idioma: idioma.value.trim(),
    tipo: tipo.value.trim(),
    internet: internet.value,
    sistemaOperativo: sistema.value.trim(),
    requisitos: requisitos.value.trim(),
    fechaActualizacion: fechaAct.value,
    edad: edad.value.trim(),
    anuncios: anuncios.value,
    privacidadUrl: privacidad.value.trim(),
    imagen: imagenUrl.value.trim(),
    apk: apkUrl.value.trim(),
    size: size.value.trim() || "N/A",
    imgSecundarias: capturasUrl.value.split(",").map(u => u.trim()).filter(u => u !== "")
  };

  // Validación mínima
  if (!campos.nombre || !campos.descripcion || !campos.version) {
    alert("Completa al menos nombre, descripción y versión.");
    btn.disabled = false;
    estado.textContent = "";
    return;
  }

  // Archivos nuevos
  const imagenFile = imagen.files[0];
  const apkFile = apk.files[0];
  const capturasFiles = capturas.files;

  const storageRef = firebase.storage().ref();

  // Promesas
  let promesas = [];

  // Imagen principal
  if (imagenFile) {
    promesas.push(
      storageRef.child("images/" + imagenFile.name)
        .put(imagenFile)
        .then(r => r.ref.getDownloadURL())
        .then(url => campos.imagen = url)
    );
  }

  // APK
  if (apkFile) {
    promesas.push(
      storageRef.child("apk/" + apkFile.name)
        .put(apkFile)
        .then(r => r.ref.getDownloadURL())
        .then(url => campos.apk = url)
    );
  }

  // Capturas
  if (capturasFiles.length > 0) {
    campos.imgSecundarias = [];
    promesas.push(
      Promise.all(
        [...capturasFiles].map(file =>
          storageRef.child("capturas/" + file.name)
          .put(file)
          .then(r => r.ref.getDownloadURL())
          .then(url => campos.imgSecundarias.push(url))
        )
      )
    );
  }

  // Esperar todas las subidas
  await Promise.all(promesas);

  // Crear o editar ID
  let id = editId || db.collection("apps").doc().id;

  const data = {
    id,
    ...campos,
    fecha: Date.now()
  };

  // Guardar
  db.collection("apps").doc(id).set(data, { merge: true })
    .then(() => {
      estado.textContent = "Guardado ✔";
      btn.disabled = false;
      editId = null;

      document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
      btn.textContent = "SUBIR APP";

      limpiarFormulario();
    })
    .catch(err => {
      estado.textContent = "Error: " + err.message;
      btn.disabled = false;
    });
}


// =======================================================
// LIMPIAR FORMULARIO
// =======================================================
function limpiarFormulario() {
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(i => i.value = "");

  categoria.value = "Educación";
  tipo.value = "Gratis";
  internet.value = "offline";
  anuncios.value = "no";

  imagen.value = "";
  apk.value = "";
  capturas.value = "";

  prevSize = null;
}
