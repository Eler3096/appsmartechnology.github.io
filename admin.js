// =======================
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

    // Campos URL
    document.getElementById("imagenUrl").value = a.imagen || "";
    document.getElementById("capturasUrl").value = a.imgSecundarias ? a.imgSecundarias.join(",") : "";
    document.getElementById("iconoUrl").value = a.icono || "";  // Campo para el icono
    document.getElementById("apkUrl").value = a.apk || "";  // Campo para el APK

    prevSize = a.size || null;
    document.getElementById("size").value = a.size || "";  // Cargar tamaño si existe

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
// GUARDAR / EDITAR APP
// =======================
async function guardarApp() {
  // Obtener los valores de los campos
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
  const imagenFile = document.getElementById("imagen").files[0];
  const apkFile = document.getElementById("apk").files[0];
  const capturasFiles = document.getElementById("capturas").files;
  
  // Obtener el tamaño de la app ingresado manualmente
  const size = document.getElementById("size").value.trim();

  // Inicializamos las variables para las URLs
  let imagenUrl = document.getElementById("imagenUrl").value.trim();  // URL existente
  let apkUrl = document.getElementById("apkUrl").value.trim();  // URL existente
  let capturasUrls = capturasFiles.length > 0 ? [] : document.getElementById("capturasUrl").value.split(",").map(u => u.trim()); // URLs existentes

  // Deshabilitar el botón de guardar inmediatamente
  const btn = document.getElementById("subirBtn");
  btn.disabled = true;

  // Mostrar el estado de "Guardando..."
  const estado = document.getElementById("estado");
  estado.textContent = "Guardando...";

  // Subir los archivos a Firebase Storage solo si son nuevos
  const storageRef = firebase.storage().ref();

  // Variables para almacenar las promesas de las subidas
  let imagenPromise = Promise.resolve();
  let apkPromise = Promise.resolve();
  let capturasPromise = Promise.resolve();

  // Subir Imagen principal si se ha seleccionado un nuevo archivo
  if (imagenFile) {
    imagenPromise = storageRef.child('images/' + imagenFile.name).put(imagenFile)
      .then(() => storageRef.child('images/' + imagenFile.name).getDownloadURL())
      .then(url => {
        imagenUrl = url;  // Actualizamos la URL
      });
  }

  // Subir APK si se ha seleccionado un nuevo archivo
  if (apkFile) {
    apkPromise = storageRef.child('apk/' + apkFile.name).put(apkFile)
      .then(() => storageRef.child('apk/' + apkFile.name).getDownloadURL())
      .then(url => {
        apkUrl = url;  // Actualizamos la URL
      });
  }

  // Subir Capturas si se han seleccionado nuevas imágenes
  if (capturasFiles.length > 0) {
    capturasPromise = Promise.all(Array.from(capturasFiles).map(file => {
      const capturaRef = storageRef.child('capturas/' + file.name);
      return capturaRef.put(file)
        .then(() => capturaRef.getDownloadURL())
        .then(url => capturasUrls.push(url));
    }));
  }

  // Esperar a que todas las subidas se completen
  await Promise.all([imagenPromise, apkPromise, capturasPromise]);

  // Verificar campos requeridos antes de guardar
  if (!nombre || !descripcion || !version) {
    alert("Completa los campos requeridos");
    btn.disabled = false;  // Habilitar el botón en caso de error
    estado.textContent = "";
    return;
  }

  let docRef, id;

  if (editId === null) {
    docRef = db.collection("apps").doc();
    id = docRef.id;
  } else {
    docRef = db.collection("apps").doc(editId);
    id = editId;
  }

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
    imagen: imagenUrl,  // Usar la URL existente o nueva
    imgSecundarias: capturasUrls,  // Usar URLs de capturas existentes o nuevas
    icono: "",  // Puedes añadir un campo para icono si es necesario
    apk: apkUrl,  // Usar la URL existente o nueva
    size: size || "N/A"  // Guardar el tamaño de la app
  };

  try {
    await docRef.set(data, { merge: true });
    estado.textContent = "Guardado ✔";
    btn.disabled = false;  // Habilitar el botón después de guardar correctamente
    editId = null;
    prevSize = null;

    document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
    document.getElementById("subirBtn").textContent = "SUBIR APP";
    limpiarFormulario();
  } catch (err) {
    estado.textContent = "Error: " + err.message;
    btn.disabled = false;  // Habilitar el botón en caso de error
  }
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
  document.getElementById("capturasUrl").value = "";
  document.getElementById("iconoUrl").value = "";  // Limpiar campo del icono
  document.getElementById("apkUrl").value = "";  // Limpiar campo del APK
  document.getElementById("size").value = "";  // Limpiar campo de tamaño

  // Desactivar los campos de carga de archivos
  document.getElementById("apk").value = "";
  document.getElementById("imagen").value = "";
  document.getElementById("capturas").value = "";
}
