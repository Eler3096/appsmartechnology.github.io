// Protección
auth.onAuthStateChanged(user=>{
  if(!user) location.href="admin-login.html";
});

function logout(){ auth.signOut(); }


// ===============================
// VARIABLES GLOBALES
// ===============================
let editId = null;  // si es null => crear | si tiene id => editar


// ===============================
// MOSTRAR APPS EN TABLA
// ===============================
const appsList = document.getElementById("appsList");

db.collection("apps").orderBy("fecha","desc").onSnapshot(snap=>{
  appsList.innerHTML = "";

  snap.forEach(doc=>{
    const a = doc.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><img src="${a.imagen}" class="table-icon"></td>
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


// ===============================
// CARGAR APP PARA EDITAR
// ===============================
function cargarParaEditar(id){
  editId = id;
  document.getElementById("formTitle").textContent = "✏️ Editar Aplicación";
  document.getElementById("subirBtn").textContent = "GUARDAR CAMBIOS";

  db.collection("apps").doc(id).get().then(doc=>{
    const a = doc.data();

    document.getElementById("nombre").value = a.nombre;
    document.getElementById("descripcion").value = a.descripcion;
    document.getElementById("version").value = a.version;
    document.getElementById("categoria").value = a.categoria;
    document.getElementById("idioma").value = a.idioma;
    document.getElementById("tipo").value = a.tipo;
    document.getElementById("internet").value = a.internet;

  });
}


// ===============================
// ELIMINAR
// ===============================
function eliminarApp(id){
  if(!confirm("¿Eliminar esta aplicación?")) return;

  db.collection("apps").doc(id).delete()
    .then(()=> alert("Eliminada ✔"))
    .catch(err=> alert(err.message));
}



// ===============================
// GUARDAR (CREAR o EDITAR)
// ===============================
function guardarApp(){

  const nombre = nombre.value.trim();
  const descripcion = descripcion.value.trim();
  const version = version.value.trim();
  const categoria = categoria.value.trim();
  const idioma = idioma.value.trim();
  const tipo = tipo.value.trim();
  const internet = internet.value;

  const apkFile = document.getElementById("apk").files[0];
  const imgFile = document.getElementById("imagen").files[0];

  const estado = document.getElementById("estado");
  const btn = document.getElementById("subirBtn");

  if(!nombre || !descripcion || !version){
    alert("Completa los campos requeridos");
    return;
  }

  btn.disabled = true;
  estado.textContent = "Procesando...";

  let docRef;
  let id;

  // si estamos creando
  if(editId === null){
    docRef = db.collection("apps").doc();
    id = docRef.id;
  } else {
    docRef = db.collection("apps").doc(editId);
    id = editId;
  }

  // función para subir archivo y devolver URL
  function upload(ref, file){
    return new Promise(res=>{
      ref.put(file).then(()=> ref.getDownloadURL().then(url=> res(url)));
    });
  }

  let promesaImg = Promise.resolve(null);
  let promesaApk = Promise.resolve(null);

  if(imgFile) promesaImg = upload(storage.ref(`imagenes/${id}.jpg`), imgFile);
  if(apkFile) promesaApk = upload(storage.ref(`apks/${id}.apk`), apkFile);

  Promise.all([promesaImg,promesaApk]).then(([imgURL,apkURL])=>{

    const updateData = {
      id,
      nombre,
      descripcion,
      version,
      categoria,
      idioma,
      tipo,
      internet,
    };

    if(imgURL) updateData.imagen = imgURL;
    if(apkURL){
      updateData.apk = apkURL;
      updateData.size = (apkFile.size / 1024 / 1024).toFixed(1) + " MB";
    }

    return docRef.set(updateData, {merge:true});
  })
  .then(()=>{
    estado.textContent = "Guardado ✔";
    btn.disabled = false;

    // reset si era edición
    if(editId !== null){
      editId = null;
      document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
      document.getElementById("subirBtn").textContent = "SUBIR APP";
    }

  })
  .catch(err=>{
    estado.textContent = "Error: "+err.message;
    btn.disabled = false;
  });
}
