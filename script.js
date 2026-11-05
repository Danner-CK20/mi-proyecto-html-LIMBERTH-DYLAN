// =====================================================
// GALERÍA VIRTUAL ESTUDIANTIL
// Los datos se guardan en localStorage (temporal).
// Cuando se conecte Firebase, solo hay que reemplazar
// las funciones de la sección "ALMACENAMIENTO".
// =====================================================

const obras = [
    {
        id: 1,
        titulo: "Paisaje de Comarapa",
        autor: "Estudiante 1",
        curso: "4to de Secundaria",
        categoria: "pintura",
        imagen: "img/obras/paisaje.svg",
        descripcion: "Pintura inspirada en los paisajes de nuestra comunidad.",
        likes: 12
    },
    {
        id: 2,
        titulo: "Mi comunidad",
        autor: "Estudiante 2",
        curso: "3ro de Secundaria",
        categoria: "dibujo",
        imagen: "img/obras/dibujo.svg",
        descripcion: "Dibujo realizado a lápiz sobre nuestra comunidad.",
        likes: 8
    },
    {
        id: 3,
        titulo: "Naturaleza",
        autor: "Estudiante 3",
        curso: "5to de Secundaria",
        categoria: "pintura",
        imagen: "img/obras/naturaleza.svg",
        descripcion: "Obra inspirada en el cuidado de la naturaleza.",
        likes: 15
    }
];

const NOMBRES_CATEGORIA = {
    dibujo: "Dibujo", pintura: "Pintura", musica: "Música",
    poesia: "Poesía", manualidades: "Manualidades"
};


// =====================================================
// ALMACENAMIENTO (aquí irá Firebase más adelante)
// =====================================================

function leer(clave, porDefecto) {
    try {
        const valor = JSON.parse(localStorage.getItem(clave));
        return valor === null ? porDefecto : valor;
    } catch (error) {
        return porDefecto;
    }
}

function guardar(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

const obtenerSesion = () => leer("gv_sesion", null);
const esInvitado = () => !obtenerSesion() || obtenerSesion().tipo === "invitado";

// La contraseña nunca se guarda en texto plano.
async function hashPassword(correo, password) {
    const texto = correo + ":" + password;
    if (window.crypto && crypto.subtle) {
        const bytes = new TextEncoder().encode(texto);
        const hash = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 0; // respaldo para navegadores sin crypto.subtle
    for (const c of texto) h = (h * 31 + c.charCodeAt(0)) | 0;
    return "s" + h;
}


// =====================================================
// UTILIDADES
// =====================================================

// Evita que texto escrito por usuarios inyecte HTML.
function esc(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto);
    return div.innerHTML;
}

function aviso(mensaje) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.classList.add("visible");
    clearTimeout(toast.temporizador);
    toast.temporizador = setTimeout(
        () => toast.classList.remove("visible"), 2800
    );
}

function iniciarSesion(datos) {
    guardar("gv_sesion", datos);
    window.location.href = "preferencias.html";
}

// Páginas que requieren haber entrado (como usuario o invitado).
const pagina = window.location.pathname.split("/").pop() || "index.html";
const paginasProtegidas = ["galeria.html", "obra.html", "preferencias.html"];

if (paginasProtegidas.includes(pagina) && !obtenerSesion()) {
    window.location.replace("index.html");
}

if (pagina === "preferencias.html" && esInvitado() && obtenerSesion()) {
    window.location.replace("galeria.html");
}


// =====================================================
// INICIO DE SESIÓN
// =====================================================

const formLogin = document.getElementById("formLogin");

if (formLogin) {
    formLogin.addEventListener("submit", async function(event) {
        event.preventDefault();

        const correo = document.getElementById("correo").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const mensaje = document.getElementById("mensajeError");

        if (!correo || !password) {
            mensaje.textContent = "Complete todos los campos.";
            return;
        }

        const usuarios = leer("gv_usuarios", {});
        const usuario = usuarios[correo];
        const hash = await hashPassword(correo, password);

        if (!usuario || usuario.hash !== hash) {
            mensaje.textContent = "Correo o contraseña incorrectos.";
            return;
        }

        const yaEligio = (leer("gv_preferencias", {})[correo] || []).length > 0;
        guardar("gv_sesion", {
            tipo: "registrado", correo: correo,
            nombre: usuario.nombre, curso: usuario.curso
        });
        window.location.href = yaEligio ? "galeria.html" : "preferencias.html";
    });
}


// =====================================================
// INGRESO COMO INVITADO
// =====================================================

const btnInvitado = document.getElementById("btnInvitado");

if (btnInvitado) {
    btnInvitado.addEventListener("click", function() {
        guardar("gv_sesion", { tipo: "invitado" });
        window.location.href = "galeria.html";
    });
}


// =====================================================
// REGISTRO
// =====================================================

const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
    formRegistro.addEventListener("submit", async function(event) {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const curso = document.getElementById("curso").value;
        const correo = document.getElementById("correoRegistro").value.trim().toLowerCase();
        const password = document.getElementById("passwordRegistro").value;
        const mensaje = document.getElementById("mensajeError");

        if (!nombre || !curso || !correo) {
            mensaje.textContent = "Por favor complete todos los datos.";
            return;
        }

        if (password.length < 6) {
            mensaje.textContent = "La contraseña debe tener al menos 6 caracteres.";
            return;
        }

        const usuarios = leer("gv_usuarios", {});

        if (usuarios[correo]) {
            mensaje.textContent = "Ese correo ya está registrado. Inicia sesión.";
            return;
        }

        usuarios[correo] = {
            nombre: nombre, curso: curso,
            hash: await hashPassword(correo, password)
        };
        guardar("gv_usuarios", usuarios);

        iniciarSesion({
            tipo: "registrado", correo: correo,
            nombre: nombre, curso: curso
        });
    });
}


// =====================================================
// PREFERENCIAS
// =====================================================

const botonesPreferencia = document.querySelectorAll(".preferencia");
let preferencias = [];

botonesPreferencia.forEach(function(boton) {
    boton.setAttribute("aria-pressed", "false");

    boton.addEventListener("click", function() {
        const categoria = boton.dataset.categoria;
        const activa = !preferencias.includes(categoria);

        boton.classList.toggle("seleccionada", activa);
        boton.setAttribute("aria-pressed", String(activa));

        preferencias = activa
            ? preferencias.concat(categoria)
            : preferencias.filter(item => item !== categoria);
    });
});

const guardarPreferencias = document.getElementById("guardarPreferencias");

if (guardarPreferencias) {
    guardarPreferencias.addEventListener("click", function() {
        if (preferencias.length === 0) {
            aviso("Seleccione al menos una categoría.");
            return;
        }

        const sesion = obtenerSesion();
        const todas = leer("gv_preferencias", {});
        todas[sesion.correo] = preferencias;
        guardar("gv_preferencias", todas);

        window.location.href = "galeria.html";
    });
}

function misPreferencias() {
    const sesion = obtenerSesion();
    if (!sesion || sesion.tipo !== "registrado") return [];
    return leer("gv_preferencias", {})[sesion.correo] || [];
}


// =====================================================
// ME GUSTA Y FAVORITOS (guardados por usuario)
// =====================================================

function totalLikes(obra) {
    const likes = leer("gv_likes", {});
    return obra.likes + (likes[obra.id] || []).length;
}

function leGusta(id) {
    const sesion = obtenerSesion();
    if (!sesion || sesion.tipo !== "registrado") return false;
    return (leer("gv_likes", {})[id] || []).includes(sesion.correo);
}

function alternarLike(id) {
    const sesion = obtenerSesion();
    const likes = leer("gv_likes", {});
    const lista = likes[id] || [];

    likes[id] = lista.includes(sesion.correo)
        ? lista.filter(c => c !== sesion.correo)
        : lista.concat(sesion.correo);

    guardar("gv_likes", likes);
}

function misFavoritos() {
    const sesion = obtenerSesion();
    if (!sesion || sesion.tipo !== "registrado") return [];
    return leer("gv_favoritos", {})[sesion.correo] || [];
}

function alternarFavorito(id) {
    if (esInvitado()) {
        aviso("Inicia sesión para guardar favoritos.");
        return;
    }

    const sesion = obtenerSesion();
    const todos = leer("gv_favoritos", {});
    const lista = todos[sesion.correo] || [];

    todos[sesion.correo] = lista.includes(id)
        ? lista.filter(f => f !== id)
        : lista.concat(id);

    guardar("gv_favoritos", todos);
    filtrarObras();
}


// =====================================================
// MOSTRAR GALERÍA
// =====================================================

const contenedorObras = document.getElementById("contenedorObras");
const verFavoritos =
    new URLSearchParams(window.location.search).get("vista") === "favoritos";

function mostrarObras(lista) {
    if (!contenedorObras) return;

    contenedorObras.innerHTML = "";

    if (lista.length === 0) {
        contenedorObras.innerHTML = `
            <p class="vacio">
                ${verFavoritos
                    ? "Aún no tienes obras favoritas."
                    : "No se encontraron obras con esos filtros."}
            </p>`;
        return;
    }

    const preferidas = misPreferencias();
    const favoritos = misFavoritos();

    lista.forEach(function(obra, indice) {
        const esFav = favoritos.includes(obra.id);
        const recomendada = preferidas.includes(obra.categoria);
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-obra";
        tarjeta.style.setProperty("--i", indice);

        tarjeta.innerHTML = `
            <img src="${esc(obra.imagen)}" alt="${esc(obra.titulo)}"
                 loading="lazy">

            <button class="btn-fav" type="button"
                    aria-pressed="${esFav}"
                    aria-label="${esFav ? "Quitar de favoritos" : "Guardar en favoritos"}">
                ${esFav ? "♥" : "♡"}
            </button>

            <div class="contenido-tarjeta">
                <span class="etiqueta cat-${esc(obra.categoria)}">${esc(NOMBRES_CATEGORIA[obra.categoria] || obra.categoria)}</span>
                ${recomendada ? '<span class="etiqueta recomendada">Para ti</span>' : ""}
                <h3>${esc(obra.titulo)}</h3>
                <p class="autor">${esc(obra.autor)} · ${esc(obra.curso)}</p>
                <p>❤️ ${totalLikes(obra)}</p>
                <a class="btn btn-principal" href="obra.html?id=${obra.id}">
                    Ver obra
                </a>
            </div>
        `;

        tarjeta.querySelector(".btn-fav").addEventListener(
            "click", () => alternarFavorito(obra.id)
        );

        contenedorObras.appendChild(tarjeta);
    });
}


// =====================================================
// BUSCADOR Y FILTRO POR CATEGORÍA
// =====================================================

const filtroCategoria = document.getElementById("filtroCategoria");
const buscador = document.getElementById("buscador");

if (filtroCategoria) filtroCategoria.addEventListener("change", filtrarObras);
if (buscador) buscador.addEventListener("input", filtrarObras);

function filtrarObras() {
    if (!contenedorObras) return;

    const texto = buscador ? buscador.value.trim().toLowerCase() : "";
    const categoria = filtroCategoria ? filtroCategoria.value : "todos";
    const preferidas = misPreferencias();
    const favoritos = misFavoritos();

    const resultado = obras
        .filter(function(obra) {
            const coincideTexto =
                obra.titulo.toLowerCase().includes(texto) ||
                obra.autor.toLowerCase().includes(texto);
            const coincideCategoria =
                categoria === "todos" || obra.categoria === categoria;
            const coincideVista =
                !verFavoritos || favoritos.includes(obra.id);

            return coincideTexto && coincideCategoria && coincideVista;
        })
        // Las categorías elegidas por el usuario aparecen primero.
        .sort((a, b) =>
            preferidas.includes(b.categoria) - preferidas.includes(a.categoria)
        );

    mostrarObras(resultado);
}

if (contenedorObras) {
    if (verFavoritos) {
        document.getElementById("tituloHero").textContent = "Mis favoritos";
    }

    const sesion = obtenerSesion();
    const enlaceFavoritos = document.getElementById("enlaceFavoritos");

    if (enlaceFavoritos && sesion && sesion.tipo === "registrado") {
        enlaceFavoritos.textContent = "Mis favoritos";
    }

    filtrarObras();
}


// =====================================================
// DETALLE DE LA OBRA (la obra se indica en la URL: obra.html?id=1)
// =====================================================

const tituloObra = document.getElementById("tituloObra");
let obraActual = null;

function pintarLikes() {
    const boton = document.getElementById("btnLike");
    const activo = leGusta(obraActual.id);

    document.getElementById("numeroLikes").textContent = totalLikes(obraActual);
    boton.classList.toggle("activo", activo);
    boton.setAttribute("aria-pressed", String(activo));
}

function pintarComentarios() {
    const lista = document.getElementById("listaComentarios");
    const comentarios = leer("gv_comentarios", {})[obraActual.id] || [];

    lista.innerHTML = comentarios.length === 0
        ? '<p class="vacio">Sé el primero en comentar.</p>'
        : comentarios.map(c => `
            <div class="comentario">
                <small>${esc(c.autor)} · ${esc(c.fecha)}</small>
                ${esc(c.texto)}
            </div>`).join("");
}

if (tituloObra) {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    obraActual = obras.find(o => o.id === id);

    if (!obraActual) {
        document.querySelector(".detalle-obra").innerHTML = `
            <p class="vacio">
                No encontramos esa obra.
                <a href="galeria.html"><strong>Volver a la galería</strong></a>
            </p>`;
    } else {
        document.title = obraActual.titulo + " | Galería Virtual";
        const imagen = document.getElementById("imagenObra");
        imagen.src = obraActual.imagen;
        imagen.alt = obraActual.titulo;
        tituloObra.textContent = obraActual.titulo;
        document.getElementById("autorObra").textContent = obraActual.autor;
        document.getElementById("cursoObra").textContent = obraActual.curso;
        document.getElementById("categoriaObra").className =
            "etiqueta cat-" + obraActual.categoria;
        document.getElementById("categoriaObra").textContent =
            NOMBRES_CATEGORIA[obraActual.categoria] || obraActual.categoria;
        document.getElementById("descripcionObra").textContent =
            obraActual.descripcion;

        pintarLikes();
        pintarComentarios();
    }
}


// =====================================================
// ME GUSTA (un voto por usuario; se puede quitar)
// =====================================================

const btnLike = document.getElementById("btnLike");

if (btnLike && obraActual) {
    btnLike.addEventListener("click", function() {
        if (esInvitado()) {
            aviso("Debes iniciar sesión para dar Me gusta.");
            return;
        }
        alternarLike(obraActual.id);
        pintarLikes();
        btnLike.classList.remove("pop");
        void btnLike.offsetWidth;
        btnLike.classList.add("pop");
    });
}


// =====================================================
// COMENTARIOS (se guardan y muestran autor y fecha)
// =====================================================

const formComentario = document.getElementById("formComentario");

if (formComentario && obraActual) {
    formComentario.addEventListener("submit", function(event) {
        event.preventDefault();

        if (esInvitado()) {
            aviso("Debes iniciar sesión para comentar.");
            return;
        }

        const campo = document.getElementById("comentario");
        const texto = campo.value.trim();

        if (!texto) return;

        const todos = leer("gv_comentarios", {});
        const lista = todos[obraActual.id] || [];

        lista.push({
            autor: obtenerSesion().nombre,
            fecha: new Date().toLocaleDateString("es-BO"),
            texto: texto.slice(0, 500)
        });

        todos[obraActual.id] = lista;
        guardar("gv_comentarios", todos);

        campo.value = "";
        pintarComentarios();
    });
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

const cerrarSesion = document.getElementById("cerrarSesion");

if (cerrarSesion) {
    cerrarSesion.addEventListener("click", function() {
        localStorage.removeItem("gv_sesion");
        window.location.href = "index.html";
    });
}


// =====================================================
// INTERACCIÓN EXTRA
// =====================================================

// Saludo personalizado en la galería
(function() {
    const sesion = obtenerSesion();
    const parrafo = document.querySelector(".hero p");

    if (parrafo && sesion && sesion.tipo === "registrado" && !verFavoritos) {
        parrafo.textContent =
            "¡Hola, " + sesion.nombre.split(" ")[0] +
            "! Descubre las creaciones de nuestros estudiantes. 🎉";
    }
})();

// Botones de categoría (chips) conectados al filtro
const zonaChips = document.getElementById("chips");

if (zonaChips && filtroCategoria) {
    const opciones = [["todos", "✨ Todas"], ["dibujo", "✏️ Dibujo"],
        ["pintura", "🎨 Pintura"], ["musica", "🎵 Música"],
        ["poesia", "📖 Poesía"], ["manualidades", "✂️ Manualidades"]];

    opciones.forEach(function(par) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip" + (par[0] === "todos" ? " activo" : "");
        chip.textContent = par[1];

        chip.addEventListener("click", function() {
            filtroCategoria.value = par[0];
            zonaChips.querySelectorAll(".chip").forEach(
                c => c.classList.toggle("activo", c === chip)
            );
            filtrarObras();
        });

        zonaChips.appendChild(chip);
    });
}

// Mostrar / ocultar contraseña
document.querySelectorAll('input[type="password"]').forEach(function(campo) {
    const envoltorio = document.createElement("div");
    envoltorio.className = "campo-clave";
    campo.parentNode.insertBefore(envoltorio, campo);
    envoltorio.appendChild(campo);

    const ojo = document.createElement("button");
    ojo.type = "button";
    ojo.className = "ver-clave";
    ojo.textContent = "👁️";
    ojo.setAttribute("aria-label", "Mostrar contraseña");

    ojo.addEventListener("click", function() {
        const oculta = campo.type === "password";
        campo.type = oculta ? "text" : "password";
        ojo.textContent = oculta ? "🙈" : "👁️";
        ojo.setAttribute("aria-label", oculta ? "Ocultar contraseña" : "Mostrar contraseña");
    });

    envoltorio.appendChild(ojo);
});

// Ampliar la imagen de la obra
const imagenDetalle = document.getElementById("imagenObra");

if (imagenDetalle && obraActual) {
    const visor = document.createElement("div");
    visor.className = "visor";
    visor.innerHTML = '<img alt="">';
    document.body.appendChild(visor);

    imagenDetalle.addEventListener("click", function() {
        visor.querySelector("img").src = imagenDetalle.src;
        visor.querySelector("img").alt = imagenDetalle.alt;
        visor.classList.add("abierto");
    });

    visor.addEventListener("click", () => visor.classList.remove("abierto"));
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") visor.classList.remove("abierto");
    });
}

// Compartir (copia el enlace de la obra)
const btnCompartir = document.getElementById("btnCompartir");

if (btnCompartir) {
    btnCompartir.addEventListener("click", async function() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            aviso("¡Enlace copiado! 🔗");
        } catch (error) {
            aviso("Copia el enlace desde la barra del navegador.");
        }
    });
}

// Contador de caracteres del comentario
const cajaComentario = document.getElementById("comentario");

if (cajaComentario) {
    cajaComentario.addEventListener("input", function() {
        document.getElementById("cuenta").textContent = cajaComentario.value.length;
    });
}
