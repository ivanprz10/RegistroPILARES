// ==========================================
// ⚠️ TU URL DE APPS SCRIPT
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-2PQFK8_Zy7BHtQtuBVxfeUXmzE4KMfrLmAzAZb0X9yQrIqQybhbrOZAzX7XwRndh/exec"; 

let datosFormulario = { modo: "", folio: "", nombre: "", actividad: "" };
let html5QrcodeScanner = null;

function mostrarNotificacion(mensaje, esError = false) {
  const barra = document.getElementById('notification-bar');
  const msg = document.getElementById('notif-msg');
  const icon = document.getElementById('notif-icon');
  msg.innerText = mensaje;
  icon.innerText = esError ? "⚠️" : "✅";
  barra.className = esError ? 'notif-error' : 'notif-success';
  barra.style.top = "0"; 
  setTimeout(() => { barra.style.top = "-100px"; }, 2500);
}

function mostrarVista(idVista) {
  const vistas = document.querySelectorAll('.view');
  vistas.forEach(v => { v.classList.remove('active'); v.style.display = 'none'; });
  const nueva = document.getElementById(idVista);
  nueva.style.display = 'flex'; 
  setTimeout(() => { nueva.classList.add('active'); }, 10);
}

function volverInicio() {
    if (html5QrcodeScanner) {
        try { html5QrcodeScanner.stop().then(() => html5QrcodeScanner.clear()).catch(e => {}); } catch(e) {}
    }
    document.getElementById('inputFolio').value = "";
    document.getElementById('inputNombreNuevo').value = "";
    document.getElementById('overlay').style.display = "none";
    mostrarVista('viewMenu');
}

function volverAScan() { mostrarVista('viewScan'); iniciarCamara(); }

function iniciarFlujo(modo) {
  datosFormulario = { modo: modo, folio: "", nombre: "", actividad: "" };
  const btnSig = document.getElementById('btnSiguiente');
  const titulo = document.getElementById('tituloScan');
  if (modo === 'ENTRADA') {
    titulo.innerText = "Entrada"; btnSig.innerText = "CONTINUAR ➡️"; btnSig.className = "btn-main bg-blue"; 
  } else {
    titulo.innerText = "Salida"; btnSig.innerText = "FINALIZAR SALIDA ✅"; btnSig.className = "btn-main bg-red"; 
  }
  mostrarVista('viewScan');
  iniciarCamara();
}

function iniciarCamara() {
  setTimeout(() => {
    if (!html5QrcodeScanner) { html5QrcodeScanner = new Html5Qrcode("reader"); }
    const config = { fps: 10, qrbox: { width: 300, height: 250 } };
    try {
        html5QrcodeScanner.start({ facingMode: "user" }, config, 
          (decodedText) => {
            const inputFolio = document.getElementById('inputFolio');
            if (inputFolio.value !== decodedText) {
                inputFolio.value = decodedText;
                mostrarNotificacion("¡Código Escaneado!");
                inputFolio.classList.add('input-success');
                if (navigator.vibrate) navigator.vibrate(200);
            }
          }, () => {}
        ).catch(err => console.log("Cámara ocupada"));
    } catch(e) {}
  }, 300);
}

function detenerCamara() {
  if (html5QrcodeScanner) { try { html5QrcodeScanner.stop().then(() => html5QrcodeScanner.clear()).catch(e => {}); } catch(e) {} }
}

function validarFolio() {
  const inputFolio = document.getElementById('inputFolio');
  const folio = inputFolio.value.trim().toUpperCase();
  if (!folio) { 
    mostrarNotificacion("Falta el FOLIO", true);
    inputFolio.classList.add('input-error');
    return;
  }
  inputFolio.classList.remove('input-error');
  datosFormulario.folio = folio;
  if (datosFormulario.modo === 'SALIDA') {
    datosFormulario.nombre = "-"; datosFormulario.actividad = "-";
    enviarDatosGoogle();
    return;
  }
  detenerCamara();
  buscarUsuarioEnBaseDatos(folio);
}

function buscarUsuarioEnBaseDatos(folio) {
  mostrarOverlayCarga(true, "BUSCANDO", "Verificando registro...");
  fetch(SCRIPT_URL + "?accion=buscar&folio=" + encodeURIComponent(folio))
    .then(response => response.json())
    .then(data => {
      mostrarOverlayCarga(false);
      if (data.encontrado) {
        datosFormulario.nombre = data.nombre;
        document.getElementById('saludoUsuario').innerText = "Hola " + data.nombre + ", ¿a qué vienes?";
        mostrarVista('viewActivity');
      } else {
        mostrarVista('viewNombre');
      }
    })
    .catch(err => {
      console.error(err);
      mostrarOverlayCarga(false);
      mostrarVista('viewNombre'); 
    });
}

function guardarNombreYContinuar() {
  const input = document.getElementById('inputNombreNuevo');
  const nombre = input.value.trim().toUpperCase();
  if (!nombre) {
    mostrarNotificacion("Escribe tu nombre", true);
    input.classList.add('input-error');
    return;
  }
  datosFormulario.nombre = nombre;
  document.getElementById('saludoUsuario').innerText = "Hola " + nombre + ", ¿a qué vienes?";
  mostrarVista('viewActivity');
}

function seleccionarActividad(actividad) {
  datosFormulario.actividad = actividad;
  enviarDatosGoogle();
}

function irAModulos(nombreBase, max) {
  const grid = document.getElementById('gridModulos');
  document.getElementById('tituloModulo').innerText = nombreBase;
  grid.className = 'num-grid'; grid.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const btn = document.createElement('button');
    btn.innerText = i; btn.className = 'btn-num';
    btn.onclick = () => {
      datosFormulario.actividad = `${nombreBase} - Módulo ${i}`;
      enviarDatosGoogle();
    };
    grid.appendChild(btn);
  }
  mostrarVista('viewModules');
}

function irAMaterias(nombreBase, listaOpciones) {
  const grid = document.getElementById('gridModulos');
  document.getElementById('tituloModulo').innerText = nombreBase;
  grid.className = 'text-grid'; grid.innerHTML = "";
  listaOpciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.innerText = opcion; btn.className = 'btn-num btn-materia';
    btn.onclick = () => {
      datosFormulario.actividad = `${nombreBase} - ${opcion}`;
      enviarDatosGoogle();
    };
    grid.appendChild(btn);
  });
  mostrarVista('viewModules');
}

function mostrarOverlayCarga(mostrar, titulo = "", mensaje = "") {
    const overlay = document.getElementById('overlay');
    const spinner = document.getElementById('loaderSpinner');
    const check = document.getElementById('successCheck');
    const tit = document.getElementById('overlayTitle');
    const msg = document.getElementById('overlayMessage');
    const container = document.getElementById('mensajeContainer');
    if (mostrar) {
        overlay.style.display = "flex"; spinner.style.display = "block"; check.style.display = "none";
        container.classList.remove('alerta-salida'); tit.innerText = titulo; msg.innerText = mensaje;
    } else { overlay.style.display = "none"; }
}

function mostrarOverlayExito(titulo, mensaje, alerta = false) {
    const overlay = document.getElementById('overlay');
    const spinner = document.getElementById('loaderSpinner');
    const check = document.getElementById('successCheck');
    const tit = document.getElementById('overlayTitle');
    const msg = document.getElementById('overlayMessage');
    const container = document.getElementById('mensajeContainer');
    overlay.style.display = "flex"; spinner.style.display = "none"; check.style.display = "block";
    tit.innerText = titulo; msg.innerText = mensaje;
    if (alerta) container.classList.add('alerta-salida'); else container.classList.remove('alerta-salida');
}

function enviarDatosGoogle() {
  mostrarOverlayCarga(true, "REGISTRANDO", "Guardando datos...");
  detenerCamara(); 
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(datosFormulario)
  })
  .then(() => {
    setTimeout(() => {
        if (datosFormulario.modo === 'ENTRADA') {
            const msj = (datosFormulario.nombre !== "-") ? 
                datosFormulario.nombre + "\nRecuerda registrar tu SALIDA" : "Recuerda registrar tu SALIDA";
            mostrarOverlayExito("¡BIENVENIDO!", msj, true);
        } else {
            mostrarOverlayExito("¡HASTA LUEGO!", "Vuelve pronto.", false);
        }
        setTimeout(() => { volverInicio(); }, 4000); 
    }, 800);
  })
  .catch(err => {
    mostrarOverlayCarga(false);
    mostrarNotificacion("Error de conexión", true);
  });
}