// Levantando España: catálogo + formulario de propuestas.
// Las marcas viven en marcas.json; esta página solo las pinta.

// Propuestas por email vía Web3Forms. La access key es pública por diseño:
// solo permite enviar al correo con el que se creó (david.pombar+levantando@gmail.com).
const DESTINO = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "3f866f43-bc7a-43db-a9e5-10d922af625f";
const MAX_FILAS = 20;

// Nombres cortos para el índice (estilo catálogo)
const SECCION = {
  "Moda y complementos": "Moda",
  "Cosmética y cuidado personal": "Cosmética",
  "Hogar y decoración": "Hogar",
  "Comida y bebida": "Despensa",
  "Papelería y libros": "Papelería",
};
const seccion = c => SECCION[c] || c;
const PRECIOS = [["Todos"], ["€", "hasta 30"], ["€€", "30–80"], ["€€€", "más de 80"]];

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = n => `Nº ${String(n).padStart(3, "0")}`;

const estado = { cat: "Todo", precio: "Todos" };
let marcas = [];

/* ---------- Catálogo ---------- */

async function cargar() {
  const datos = await (await fetch("marcas.json")).json();
  marcas = datos.marcas.map((m, i) => ({ ...m, n: i + 1 }));

  $("#n-marcas").textContent = marcas.length;
  $("#n-prov").textContent = new Set(
    marcas.map(m => m.origen.split(",").pop().trim()).filter(o => o !== "España")
  ).size;

  const portada = marcas.find(m => m.id === datos.portada) || marcas[0];
  $("#lamina").href = portada.web;
  $("#lamina-img").src = portada.imagen;
  $("#lamina-img").alt = `${portada.nombre}: ${portada.descripcion}`;
  $("#lamina-pie").textContent = `En portada: ${portada.nombre}`;
  $("#lamina-num").textContent = `${num(portada.n)} →`;

  pintar();
  // Si se llega con un ancla (#proponer), saltar cuando el catálogo ya ocupa su sitio
  // (y con las fuentes cargadas, que cambian la altura de las fichas)
  if (location.hash) document.fonts.ready.then(() => document.querySelector(location.hash)?.scrollIntoView());
}

function botones(el, opciones, clave) {
  el.innerHTML = opciones.map(([v, etiqueta, contador]) => `
    <button type="button" aria-pressed="${estado[clave] === v}" data-v="${esc(v)}">${esc(etiqueta ? `${v} ${etiqueta}` : v)}${contador != null ? `<sup>${contador}</sup>` : ""}</button>`).join("");
  el.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    estado[clave] = b.dataset.v;
    pintar();
  };
}

function pintar() {
  const cats = ["Todo", ...new Set(marcas.map(m => seccion(m.categoria)))];
  botones($("#f-cat"), cats.map(c => [c, null, c === "Todo" ? marcas.length : marcas.filter(m => seccion(m.categoria) === c).length]), "cat");
  botones($("#f-precio"), PRECIOS, "precio");

  const lista = marcas.filter(m =>
    (estado.cat === "Todo" || seccion(m.categoria) === estado.cat) &&
    (estado.precio === "Todos" || m.precio === estado.precio));

  $("#contador").textContent = `${lista.length} ${lista.length === 1 ? "marca" : "marcas"}`;
  $("#catalogo").innerHTML = lista.map(m => `
    <a class="ficha${m.ancha ? " ancha" : ""}" href="${esc(m.web)}" target="_blank" rel="noopener">
      <div class="foto"><img src="${esc(m.imagen)}" alt="${esc(m.nombre)}: ${esc(m.descripcion)}" loading="lazy"><span class="num">${num(m.n)}</span></div>
      <div class="pie-ficha">
        <div class="arriba mono"><span>${esc(seccion(m.categoria))}</span><span class="precio">${esc(m.precio)}</span></div>
        <div class="nombre">${esc(m.nombre)}</div>
        <p class="desc">${esc(m.descripcion)}</p>
        <span class="origen">${esc(m.origen)}</span>
      </div>
    </a>`).join("");
}

/* ---------- Formulario de propuestas ---------- */

function renumerar() {
  const filas = [...document.querySelectorAll(".fila")];
  filas.forEach((f, i) => {
    f.querySelector(".n").textContent = String(i + 1).padStart(2, "0");
    f.querySelector(".quitar").hidden = filas.length === 1;
  });
  $("#anadir").hidden = filas.length >= MAX_FILAS;
}

function anadirFila(foco = false) {
  const fila = document.createElement("div");
  fila.className = "fila";
  fila.innerHTML = `
    <span class="n"></span>
    <input name="marca" placeholder="Nombre de la marca" aria-label="Nombre de la marca" autocomplete="off">
    <input name="web" placeholder="Web o Instagram" aria-label="Web o Instagram" autocomplete="off">
    <button type="button" class="quitar" aria-label="Quitar esta marca">×</button>`;
  fila.querySelector(".quitar").onclick = () => { fila.remove(); renumerar(); };
  $("#filas").appendChild(fila);
  renumerar();
  if (foco) fila.querySelector("input").focus();
}

function mensaje(texto, tipo) {
  const el = $("#estado");
  el.textContent = texto;
  el.className = `estado ${tipo || ""}`;
}

async function enviar(e) {
  e.preventDefault();
  const form = e.target;
  if (form.botcheck.checked) return; // bot

  document.querySelectorAll(".error-campo").forEach(el => el.classList.remove("error-campo"));

  const propuestas = [...document.querySelectorAll(".fila")]
    .map(f => ({ nombre: f.querySelector('[name="marca"]').value.trim(), web: f.querySelector('[name="web"]').value.trim(), fila: f }))
    .filter(p => p.nombre || p.web);
  const lista = form.lista.value.trim().split("\n").map(l => l.trim()).filter(Boolean);

  if (!propuestas.length && !lista.length) {
    document.querySelector('.fila [name="marca"]').classList.add("error-campo");
    mensaje("Añade al menos una marca, aunque sea solo el nombre.", "error");
    return;
  }
  const email = form.email.value.trim();
  if (email && !form.email.checkValidity()) {
    form.email.classList.add("error-campo");
    mensaje("Ese email no parece válido. Puedes dejarlo vacío.", "error");
    return;
  }

  const lineas = [
    ...propuestas.map((p, i) => `${i + 1}. ${p.nombre || "(sin nombre)"} — ${p.web || "(sin web)"}`),
    ...lista.map((l, i) => `${propuestas.length + i + 1}. ${l}`),
  ];
  const total = lineas.length;

  const datos = {
    access_key: WEB3FORMS_KEY,
    subject: `Levantando España: ${total} ${total === 1 ? "marca propuesta" : "marcas propuestas"}`,
    from_name: "Levantando España",
    botcheck: false,
    Marcas: lineas.join("\n"),
    "Propone": form.nombre.value.trim() || "(anónimo)",
    "¿Es su marca?": form.propia.checked ? "Sí, alguna es suya" : "No",
  };
  if (email) { datos.email = email; datos.replyto = email; }

  const boton = $("#boton");
  boton.disabled = true;
  mensaje("Enviando…");
  try {
    const r = await fetch(DESTINO, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(datos),
    });
    const res = await r.json().catch(() => ({}));
    if (!r.ok || res.success !== true) throw new Error(res.message || r.status);

    form.reset();
    $("#filas").innerHTML = "";
    anadirFila();
    mensaje(`¡Gracias! Hemos recibido ${total === 1 ? "tu marca" : `tus ${total} marcas`}. Las revisaremos y, si encajan, aparecerán aquí pronto.`, "ok");
  } catch (err) {
    mensaje("No se ha podido enviar. Inténtalo de nuevo en un momento.", "error");
    console.error(err);
  } finally {
    boton.disabled = false;
  }
}

anadirFila();
$("#anadir").onclick = () => anadirFila(true);
$("#form").addEventListener("submit", enviar);
cargar().catch(err => {
  $("#catalogo").innerHTML = `<p class="mono">No se ha podido cargar el catálogo.</p>`;
  console.error(err);
});
