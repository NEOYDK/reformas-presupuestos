// Presupuestador de Obra Fina (demo de Yardak). Corre todo en el navegador y guarda en localStorage ("obrafina-presu-v1").
(function () {
  "use strict";
  const $ = (s, sc) => (sc || document).querySelector(s);
  const $$ = (s, sc) => Array.from((sc || document).querySelectorAll(s));
  function safe(fn, n) { try { fn(); } catch (e) { console.warn("[" + n + "]", e); } }
  const CLAVE = "obrafina-presu-v1";
  const ESTADOS = ["Borrador", "Enviado", "Aceptado", "Rechazado"];
  const UNIDADES = ["m²", "ml", "u", "viaje", "día", "gl"];
  const dos = n => String(n).padStart(2, "0");
  const pesos = n => "$ " + Math.round(n).toLocaleString("es-AR");
  const pesosCorto = n => n >= 1e6 ? "$ " + (n / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " M" : pesos(n);
  const iso = d => d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate());
  const deIso = s => { const [a, m, d] = String(s).split("-").map(Number); return new Date(a, (m || 1) - 1, d || 1); };
  const hoyIso = () => iso(new Date());
  const sumarDias = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const corta = s => { const d = deIso(s); return dos(d.getDate()) + "/" + dos(d.getMonth() + 1) + "/" + d.getFullYear(); };
  const diasDesde = s => Math.round((deIso(hoyIso()) - deIso(s)) / 86400000);
  const n = v => { const x = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(x) ? x : 0; };
  const numero = k => "N.º " + String(k).padStart(4, "0");
  const pila = t => (t || "").trim().split(/\s+/)[0] || "";

  // ---------- datos ----------
  function sembrar() {
    const hoy = hoyIso();
    const cat = window.Precios.CATALOGO.map(c => Object.assign({}, c));
    const item = (id, cant) => { const c = cat.find(x => x.id === id); return { desc: c.nombre, unidad: c.unidad, cant, precio: c.precio }; };
    const base = { validez: 7, descuento: 0, iva: false, pago: "50% al empezar y 50% al terminar", notas: "Incluye cubrir muebles y pisos, y limpieza final." };
    const p = (k, dias, cliente, tel, obra, items, estado, extra) => Object.assign({}, base, { id: "p" + k, numero: k, fecha: sumarDias(hoy, -dias), cliente, tel, obra, items, estado, plazo: "", enviado: estado === "Borrador" ? null : sumarDias(hoy, -dias) }, extra || {});
    const presupuestos = [
      p(121, 26, "Martín Ledesma", "", "Baño completo · Barrio San Agustín", [item("c7", 24), item("c6", 6), item("c9", 3), item("c10", 2), item("c11", 4)], "Aceptado", { plazo: "12 días hábiles" }),
      p(122, 21, "Consultorio Dra. Paz", "", "Dos tabiques y cielorraso · Centro", [item("c4", 18), item("c5", 22), item("c1", 64)], "Aceptado", { plazo: "8 días hábiles", iva: true }),
      p(123, 14, "Hugo Báez", "", "Frente de la casa · Barrio Paraná XIV", [item("c2", 46), item("c3", 12)], "Rechazado", { plazo: "4 días hábiles" }),
      p(124, 6, "Gabriela Ríos", "", "Pintura depto 3 ambientes · Barrio Parque", [item("c1", 86), item("c3", 22), item("c4", 9), item("c10", 1)], "Enviado", { plazo: "6 días hábiles" }),
      p(125, 4, "Diego Sosa", "", "Electricidad cocina · Bajada Grande", [item("c9", 7), item("c11", 1)], "Enviado", { plazo: "2 días hábiles" }),
      p(126, 1, "Laura Acosta", "", "Cielorraso del living · Barrio Las Rosas", [item("c5", 21), item("c1", 21)], "Aceptado", { plazo: "3 días hábiles", descuento: 5 }),
    ];
    return {
      creado: hoy, proximo: 127, actual: null, catalogo: cat, presupuestos,
      negocio: { nombre: "Obra Fina", cuit: "20-31234567-8", condicion: "Monotributo", tel: "343 472-7553", email: "hola@obrafina.com.ar", dir: "Paraná, Entre Ríos" },
    };
  }
  let D = null;
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(D)); } catch (_) { /* queda en memoria */ } };
  function cargar() {
    try { D = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (_) { D = null; }
    if (!D || !Array.isArray(D.presupuestos) || !D.catalogo || !D.negocio) { D = sembrar(); guardar(); }
  }

  function nuevo() {
    const p = { id: "p" + D.proximo + "-" + Date.now().toString(36), numero: D.proximo, fecha: hoyIso(), cliente: "", tel: "", obra: "", validez: 7, estado: "Borrador", items: [],
      descuento: 0, iva: D.negocio.condicion === "Responsable inscripto", pago: "50% al empezar y 50% al terminar", plazo: "", notas: "Incluye cubrir muebles y pisos, y limpieza final.", enviado: null };
    D.proximo++;
    D.presupuestos.unshift(p);
    D.actual = p.id;
    guardar();
    return p;
  }
  const actual = () => D.presupuestos.find(p => p.id === D.actual) || null;

  function totales(p) {
    const sub = p.items.reduce((a, it) => a + n(it.cant) * n(it.precio), 0);
    const desc = sub * Math.min(100, Math.max(0, n(p.descuento))) / 100;
    const neto = sub - desc;
    const iva = p.iva ? neto * 0.21 : 0;
    return { sub, desc, iva, total: neto + iva };
  }

  // ---------- editor ----------
  let tGuardado = 0;
  function marcarGuardado() {
    const g = $("[data-guardado]");
    g.textContent = "Guardando…";
    clearTimeout(tGuardado);
    tGuardado = setTimeout(() => { guardar(); g.textContent = "Guardado ✓"; }, 300);
  }
  function itemFila(p, it, i) {
    const li = document.createElement("li");
    li.className = "item";
    const lab = (c, etiqueta, ctrl) => { const l = document.createElement("label"); l.dataset.c = c; const s = document.createElement("span"); s.textContent = etiqueta; l.append(s, ctrl); return l; };
    const desc = document.createElement("input");
    desc.value = it.desc; desc.maxLength = 90; desc.placeholder = "Descripción del trabajo"; desc.setAttribute("list", "lista-trabajos");
    desc.addEventListener("input", () => {
      it.desc = desc.value;
      const c = D.catalogo.find(x => x.nombre === desc.value);
      if (c) { it.unidad = c.unidad; it.precio = c.precio; uni.value = c.unidad; pre.value = c.precio; }
      cambio();
    });
    const uni = document.createElement("select");
    uni.innerHTML = UNIDADES.map(u => "<option>" + u + "</option>").join("");
    if (!UNIDADES.includes(it.unidad)) { const o = document.createElement("option"); o.textContent = it.unidad; uni.appendChild(o); }
    uni.value = it.unidad;
    uni.addEventListener("change", () => { it.unidad = uni.value; cambio(); });
    const can = document.createElement("input");
    can.type = "number"; can.inputMode = "decimal"; can.min = "0"; can.step = "0.5"; can.value = it.cant;
    can.addEventListener("input", () => { it.cant = can.value; cambio(); });
    const pre = document.createElement("input");
    pre.type = "number"; pre.inputMode = "numeric"; pre.min = "0"; pre.step = "100"; pre.value = it.precio;
    pre.addEventListener("input", () => { it.precio = pre.value; cambio(); });
    const sub = document.createElement("p"); sub.className = "item-sub"; sub.dataset.sub = "";
    const x = document.createElement("button");
    x.type = "button"; x.className = "item-x"; x.textContent = "×"; x.setAttribute("aria-label", "Quitar el ítem " + (i + 1));
    x.addEventListener("click", () => { p.items.splice(i, 1); pintarItems(); cambio(); });
    [desc, uni, can, pre].forEach((c, k) => c.setAttribute("aria-label", ["Descripción", "Unidad", "Cantidad", "Precio por unidad"][k] + " del ítem " + (i + 1)));
    li.append(lab("desc", "Descripción", desc), lab("unidad", "Unidad", uni), lab("cant", "Cantidad", can), lab("precio", "Precio", pre), sub, x);
    return li;
  }
  function pintarItems() {
    const p = actual();
    $("[data-items]").replaceChildren(...p.items.map((it, i) => itemFila(p, it, i)));
    actualizarSubtotales();
  }
  function actualizarSubtotales() {
    const p = actual();
    $$("[data-items] .item").forEach((li, i) => { const it = p.items[i]; li.querySelector("[data-sub]").textContent = pesos(n(it.cant) * n(it.precio)); });
  }
  function pintarFormu() {
    const p = actual(), f = $("[data-formu]");
    $("[data-num]").textContent = numero(p.numero);
    ["cliente", "tel", "obra", "fecha", "validez", "estado", "descuento", "pago", "plazo", "notas"].forEach(k => { if (f[k]) f[k].value = p[k] == null ? "" : p[k]; });
    f.iva.checked = !!p.iva;
    const lista = $("[data-desde-lista]");
    lista.replaceChildren(new Option("+ Agregar de la lista de precios…", ""), ...D.catalogo.map(c => new Option(c.nombre + " · " + pesos(c.precio) + "/" + c.unidad, c.id)));
    let dl = $("#lista-trabajos");
    if (!dl) { dl = document.createElement("datalist"); dl.id = "lista-trabajos"; document.body.appendChild(dl); }
    dl.replaceChildren(...D.catalogo.map(c => new Option(c.nombre)));
    pintarItems();
    pintarHoja();
  }
  function cambio() {
    actualizarSubtotales();
    pintarHoja();
    marcarGuardado();
  }

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function pintarHoja() {
    const p = actual(), N = D.negocio, t = totales(p);
    const hoja = $("[data-hoja]");
    const iniciales = (N.nombre || "OF").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
    const cab = el("div", "h-cab");
    const marca = el("div", "h-marca");
    const neg = el("div", "h-negocio");
    neg.append(el("b", null, N.nombre || "Tu negocio"), el("small", null, [N.condicion, N.cuit ? "CUIT " + N.cuit : ""].filter(Boolean).join(" · ")), el("small", null, [N.tel, N.email, N.dir].filter(Boolean).join(" · ")));
    marca.append(el("span", "h-logo", iniciales), neg);
    const num = el("div", "h-num");
    num.append(el("b", null, "Presupuesto " + numero(p.numero)), el("small", null, "Fecha: " + corta(p.fecha)), el("small", null, "Válido hasta: " + corta(sumarDias(p.fecha, Math.max(1, Math.round(n(p.validez)) || 7)))));
    const est = el("span", "h-estado " + p.estado, p.estado);
    num.appendChild(est);
    cab.append(marca, num);
    const cli = el("div", "h-cli");
    const dato = (k, v) => { const d = el("p"); d.append(el("small", null, k), document.createTextNode(v || "—")); return d; };
    cli.append(dato("Cliente", p.cliente), dato("Obra", p.obra), dato("WhatsApp", p.tel), dato("Plazo de obra", p.plazo));
    const tabla = el("table", "h-tabla");
    tabla.innerHTML = "<thead><tr><th>Trabajo</th><th class=\"n\">Cant.</th><th class=\"n\">Precio</th><th class=\"n\">Subtotal</th></tr></thead>";
    const tb = el("tbody");
    const validos = p.items.filter(it => (it.desc || "").trim() || n(it.cant) * n(it.precio));
    if (!validos.length) { const tr = el("tr"); const td = el("td", "h-vacia", "Agregá los trabajos desde la lista de precios."); td.colSpan = 4; tr.appendChild(td); tb.appendChild(tr); }
    validos.forEach(it => {
      const tr = el("tr");
      tr.append(el("td", null, it.desc || "Trabajo"), el("td", "n", (n(it.cant).toLocaleString("es-AR") || "0") + " " + it.unidad), el("td", "n", pesos(n(it.precio))), el("td", "n", pesos(n(it.cant) * n(it.precio))));
      tb.appendChild(tr);
    });
    tabla.appendChild(tb);
    const tot = el("div", "h-totales");
    const fila = (k, v, cls) => { const r = el("p", cls); r.append(el("span", null, k), el("span", null, v)); return r; };
    tot.appendChild(fila("Subtotal", pesos(t.sub)));
    if (t.desc) tot.appendChild(fila("Descuento " + n(p.descuento).toLocaleString("es-AR") + "%", "− " + pesos(t.desc)));
    if (p.iva) tot.appendChild(fila("IVA 21%", pesos(t.iva)));
    tot.appendChild(fila("Total", pesos(t.total), "h-total"));
    const cond = el("div", "h-cond");
    const c = (k, v) => { const r = el("p"); r.append(el("b", null, k + ": "), document.createTextNode(v)); return r; };
    cond.append(c("Forma de pago", p.pago), c("Validez", (Math.round(n(p.validez)) || 7) + " días desde la fecha"));
    if (!p.iva) cond.appendChild(c("Factura", N.condicion === "Monotributo" ? "C (monotributo)" : "sin IVA discriminado"));
    if ((p.notas || "").trim()) cond.appendChild(c("Notas", p.notas.trim()));
    const firma = el("div", "h-firma");
    firma.append(el("span", null, "Firma de " + (N.nombre || "la empresa")), el("span", null, "Conformidad del cliente"));
    hoja.replaceChildren(cab, cli, tabla, tot, cond, firma);
    // WhatsApp al cliente (sin emojis: en WhatsApp Web llegan rotos)
    const lineas = validos.map(it => "- " + (it.desc || "Trabajo") + ": " + n(it.cant).toLocaleString("es-AR") + " " + it.unidad + " × " + pesos(n(it.precio)) + " = " + pesos(n(it.cant) * n(it.precio)));
    const texto = "¡Hola" + (pila(p.cliente) ? " " + pila(p.cliente) : "") + "! Te paso el presupuesto " + numero(p.numero) + " de " + (N.nombre || "nuestra empresa") + (p.obra ? " para " + p.obra : "") + ":\n" +
      lineas.join("\n") + "\n" + (t.desc ? "Descuento " + n(p.descuento).toLocaleString("es-AR") + "%: − " + pesos(t.desc) + "\n" : "") + (p.iva ? "IVA 21%: " + pesos(t.iva) + "\n" : "") +
      "Total: " + pesos(t.total) + " (válido hasta el " + corta(sumarDias(p.fecha, Math.round(n(p.validez)) || 7)) + ").\n" +
      "Forma de pago: " + p.pago + "." + (p.plazo ? " Plazo: " + p.plazo + "." : "") + "\nTe mando el PDF por acá. Cualquier duda, avisame.";
    const tel = String(p.tel || "").replace(/\D/g, "").replace(/^0/, "").replace(/^(\d{3,4})15/, "$1");
    const a = $("[data-mandar]");
    a.href = "https://wa.me/" + (tel.length >= 10 ? "549" + tel.slice(-10) : "") + "?text=" + encodeURIComponent(texto);
    a.target = "_blank"; a.rel = "noopener";
  }

  function initEditor() {
    const f = $("[data-formu]");
    f.addEventListener("input", e => {
      const p = actual(), k = e.target.name;
      if (!k || !(k in p) && k !== "iva") return;
      if (k === "iva") p.iva = e.target.checked; else p[k] = e.target.value;
      cambio();
    });
    f.addEventListener("change", e => {
      const p = actual();
      if (e.target.name === "estado") { p.estado = e.target.value; if (p.estado !== "Borrador" && !p.enviado) p.enviado = hoyIso(); cambio(); }
      if (e.target.name === "iva") { p.iva = e.target.checked; cambio(); }
    });
    $("[data-desde-lista]").addEventListener("change", e => {
      const c = D.catalogo.find(x => x.id === e.target.value);
      if (!c) return;
      actual().items.push({ desc: c.nombre, unidad: c.unidad, cant: 1, precio: c.precio });
      e.target.value = "";
      pintarItems(); cambio();
      const ult = $$("[data-items] .item").pop(); if (ult) { const q = $("[data-c='cant'] input", ult); q.focus(); q.select(); }
    });
    $("[data-item-libre]").addEventListener("click", () => {
      actual().items.push({ desc: "", unidad: "gl", cant: 1, precio: 0 });
      pintarItems(); cambio();
      const ult = $$("[data-items] .item").pop(); if (ult) $("[data-c='desc'] input", ult).focus();
    });
    $("[data-nuevo]").addEventListener("click", () => { nuevo(); pintarFormu(); toast("Presupuesto " + numero(actual().numero) + " nuevo"); $("[name=cliente]").focus(); });
    $("[data-pdf]").addEventListener("click", () => { guardar(); window.print(); });
    $("[data-mandar]").addEventListener("click", () => {
      const p = actual();
      if (p.estado === "Borrador") { p.estado = "Enviado"; p.enviado = hoyIso(); $("[name=estado]").value = "Enviado"; pintarHoja(); }
      guardar();
    });
  }

  // ---------- mis presupuestos ----------
  let filtro = "todos";
  function pintarLista() {
    const mes = hoyIso().slice(0, 7);
    const todos = D.presupuestos;
    const delMes = todos.filter(p => p.fecha.slice(0, 7) === mes && p.estado !== "Borrador");
    const acep = todos.filter(p => p.estado === "Aceptado");
    const mandados = todos.filter(p => p.estado !== "Borrador");
    const seguir = todos.filter(p => p.estado === "Enviado" && p.enviado && diasDesde(p.enviado) > 2);
    const set = (k, v) => { const x = $("[data-k='" + k + "']"); if (x) x.textContent = v; };
    set("mes", pesosCorto(delMes.reduce((a, p) => a + totales(p).total, 0)));
    set("mes-sub", delMes.length + (delMes.length === 1 ? " presupuesto" : " presupuestos"));
    set("acep", pesosCorto(acep.reduce((a, p) => a + totales(p).total, 0)));
    set("acep-sub", acep.length + " de " + mandados.length + " mandados");
    set("tasa", mandados.length ? Math.round(acep.length / mandados.length * 100) + "%" : "—");
    set("seguir", seguir.length);
    $$("[data-filtros] button").forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filtro ? "true" : "false"));
    const lista = todos.filter(p => filtro === "todos" || p.estado === filtro);
    $("[data-filas]").replaceChildren(...(lista.length ? lista.map(p => {
      const li = el("li", "fila");
      const tit = el("p", "fila-tit");
      tit.append(el("small", null, numero(p.numero)), document.createTextNode(p.cliente || "Sin nombre"), el("span", "estado e-" + p.estado, p.estado));
      const sub = el("p", "fila-sub", (p.obra || "Sin descripción") + " · " + corta(p.fecha) + (p.estado === "Enviado" && p.enviado ? " · enviado hace " + diasDesde(p.enviado) + (diasDesde(p.enviado) === 1 ? " día" : " días") : ""));
      const total = el("p", "fila-total", pesosCorto(totales(p).total));
      const acc = el("div", "fila-acc");
      const sel = document.createElement("select");
      sel.setAttribute("aria-label", "Estado del presupuesto " + numero(p.numero));
      sel.innerHTML = ESTADOS.map(e => "<option>" + e + "</option>").join("");
      sel.value = p.estado;
      sel.addEventListener("change", () => { p.estado = sel.value; if (p.estado !== "Borrador" && !p.enviado) p.enviado = hoyIso(); guardar(); pintarLista(); toast(numero(p.numero) + ": " + p.estado.toLowerCase()); });
      const abrir = el("button", "mini", "Abrir"); abrir.type = "button";
      abrir.addEventListener("click", () => { D.actual = p.id; guardar(); pintarFormu(); location.hash = "editar"; });
      const dup = el("button", "mini", "Duplicar"); dup.type = "button";
      dup.addEventListener("click", () => {
        const c = JSON.parse(JSON.stringify(p));
        Object.assign(c, { id: "p" + D.proximo + "-" + Date.now().toString(36), numero: D.proximo, fecha: hoyIso(), estado: "Borrador", enviado: null });
        D.proximo++; D.presupuestos.unshift(c); D.actual = c.id; guardar(); pintarFormu(); pintarLista(); toast("Copia " + numero(c.numero) + " lista para editar"); location.hash = "editar";
      });
      acc.append(sel, abrir, dup);
      if (p.estado === "Enviado") {
        const texto = "¡Hola" + (pila(p.cliente) ? " " + pila(p.cliente) : "") + "! ¿Pudiste ver el presupuesto " + numero(p.numero) + " de " + (D.negocio.nombre || "la obra") + "? Si querés lo ajustamos o coordinamos la fecha para arrancar.";
        const a = el("a", "mini wa", "Seguimiento"); a.href = "https://wa.me/?text=" + encodeURIComponent(texto); a.target = "_blank"; a.rel = "noopener";
        acc.appendChild(a);
      }
      li.append(tit, sub, total, acc);
      return li;
    }) : [el("li", "vacio", "No hay presupuestos con ese filtro.")]));
  }

  // ---------- lista de precios ----------
  function pintarCatalogo(resaltar) {
    $("[data-cat]").replaceChildren(...D.catalogo.map((c, i) => {
      const li = el("li");
      const nom = document.createElement("input"); nom.value = c.nombre; nom.maxLength = 80; nom.setAttribute("aria-label", "Trabajo " + (i + 1));
      nom.addEventListener("input", () => { c.nombre = nom.value; guardar(); });
      const uni = document.createElement("select"); uni.innerHTML = UNIDADES.map(u => "<option>" + u + "</option>").join(""); uni.value = UNIDADES.includes(c.unidad) ? c.unidad : "u"; uni.setAttribute("aria-label", "Unidad del trabajo " + (i + 1));
      uni.addEventListener("change", () => { c.unidad = uni.value; guardar(); });
      const pre = document.createElement("input"); pre.type = "number"; pre.inputMode = "numeric"; pre.min = "0"; pre.step = "100"; pre.value = c.precio; pre.setAttribute("aria-label", "Precio del trabajo " + (i + 1));
      if (resaltar) pre.classList.add("sube");
      pre.addEventListener("input", () => { c.precio = n(pre.value); guardar(); ejemplo(); });
      const x = el("button", "x", "×"); x.type = "button"; x.setAttribute("aria-label", "Quitar " + c.nombre);
      x.addEventListener("click", () => { D.catalogo.splice(i, 1); guardar(); pintarCatalogo(); ejemplo(); });
      li.append(nom, uni, pre, x);
      return li;
    }));
    ejemplo();
  }
  function ejemplo() {
    const f = $("[data-aumento]"), c = D.catalogo[0], pct = n(f.pct.value);
    $("[data-aumento-ej]").textContent = c ? "Ejemplo: " + c.nombre + " pasa de " + pesos(c.precio) + " a " + pesos(Math.round(c.precio * (1 + pct / 100) / 100) * 100) + ". Se redondea a la centena." : "";
  }
  function initPrecios() {
    const f = $("[data-aumento]");
    f.pct.addEventListener("input", ejemplo);
    f.addEventListener("submit", e => {
      e.preventDefault();
      const pct = n(f.pct.value);
      if (!pct) return;
      D.catalogo.forEach(c => { c.precio = Math.max(0, Math.round(c.precio * (1 + pct / 100) / 100) * 100); });
      guardar(); pintarCatalogo(true); pintarFormu();
      toast("Listo: la lista de precios subió " + pct.toLocaleString("es-AR") + "%");
    });
    $("[data-cat-nuevo]").addEventListener("click", () => {
      D.catalogo.push({ id: "c" + Date.now().toString(36), nombre: "Trabajo nuevo", unidad: "u", precio: 0 });
      guardar(); pintarCatalogo();
      const ult = $$("[data-cat] li").pop(); if (ult) { const i = ult.querySelector("input"); i.focus(); i.select(); }
    });
  }

  // ---------- mis datos ----------
  function initDatos() {
    const f = $("[data-datos]");
    ["nombre", "cuit", "condicion", "tel", "email", "dir"].forEach(k => { f[k].value = D.negocio[k] || ""; });
    f.addEventListener("input", e => { if (e.target.name) { D.negocio[e.target.name] = e.target.value; guardar(); pintarHoja(); } });
    f.addEventListener("change", e => { if (e.target.name) { D.negocio[e.target.name] = e.target.value; guardar(); pintarHoja(); } });
  }

  let tToast = 0;
  function toast(t) { const x = $("[data-toast]"); x.textContent = t; x.hidden = false; clearTimeout(tToast); tToast = setTimeout(() => { x.hidden = true; }, 2600); }

  const VISTAS = ["editar", "lista", "precios", "datos"];
  function mostrar(v, enfocar) {
    if (!VISTAS.includes(v)) v = "editar";
    $$("[data-vista]").forEach(s => { s.hidden = s.dataset.vista !== v; });
    $$("[data-tab]").forEach(b => { if (b.dataset.tab === v) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (v === "lista") pintarLista();
    if (v === "precios") pintarCatalogo();
    if (enfocar) { scrollTo(0, 0); $("#vista").focus({ preventScroll: true }); }
  }

  function init() {
    document.documentElement.classList.remove("no-js");
    if (!window.Precios) return;
    cargar();
    if (!actual()) { const b = D.presupuestos.find(p => p.estado === "Enviado") || D.presupuestos[0]; if (b) D.actual = b.id; else nuevo(); }
    pintarFormu();
    initEditor(); initPrecios(); initDatos();
    $$("[data-tab]").forEach(b => b.addEventListener("click", () => { if (location.hash !== "#" + b.dataset.tab) location.hash = b.dataset.tab; else mostrar(b.dataset.tab, true); }));
    addEventListener("hashchange", () => mostrar(location.hash.slice(1), true));
    mostrar(location.hash.slice(1), false);
    $$("[data-filtros] button").forEach(b => b.addEventListener("click", () => { filtro = b.dataset.f; pintarLista(); }));
    $("[data-reset]").addEventListener("click", () => {
      if (!confirm("¿Volver a los datos de ejemplo? Se borra lo que cargaste.")) return;
      D = sembrar(); D.actual = D.presupuestos[3].id; guardar();
      pintarFormu(); initDatosValores(); mostrar(location.hash.slice(1), false); toast("Listo: datos de ejemplo nuevos");
    });
  }
  function initDatosValores() { const f = $("[data-datos]"); ["nombre", "cuit", "condicion", "tel", "email", "dir"].forEach(k => { f[k].value = D.negocio[k] || ""; }); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => safe(init, "init"));
  else safe(init, "init");
})();
