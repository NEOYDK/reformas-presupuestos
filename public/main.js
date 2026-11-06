(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const P = window.Precios;
  const $ = (s, sc) => (sc || document).querySelector(s);
  const $$ = (s, sc) => Array.from((sc || document).querySelectorAll(s));
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  const wa = (num, text) => "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
  const pesos = n => "$ " + Math.round(n).toLocaleString("es-AR");
  const mil = n => Math.round(n / 1000) * 1000;
  const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) && n > 0 ? n : 0; };
  const m2 = n => n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  const CLAVE = "obrafina-calc-v1";

  const inicial = () => ({
    sel: ["pintura"], mat: "con", calidad: "estandar",
    m: {
      pintura: { reparar: false, ambientes: [{ nombre: "Living", largo: "4,5", ancho: "3,5", alto: "2,6", puertas: 1, ventanas: 1, techo: true }, { nombre: "Dormitorio", largo: "3,2", ancho: "3", alto: "2,6", puertas: 1, ventanas: 1, techo: true }] },
      frente: { largo: "8", alto: "3,5" }, tabique: { largo: "3", alto: "2,6" }, cielorraso: { largo: "4", ancho: "3,5" },
      piso: { largo: "4", ancho: "3,5" }, revestimiento: { m2: "18" }, techo: { largo: "10", ancho: "8" }, electricidad: { cantidad: "6" },
    },
  });
  let est = inicial();
  try { const g = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (g && Array.isArray(g.sel) && g.m) est = Object.assign(inicial(), g, { m: Object.assign(inicial().m, g.m) }); } catch (_) { /* sin almacenamiento */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(est)); } catch (_) { /* nada */ } };

  // m² de cada ambiente: paredes (perímetro × alto) menos puertas y ventanas, más el techo si se pinta
  const PUERTA = 1.8, VENTANA = 1.4;
  function areaAmbiente(a) {
    const L = num(a.largo), A = num(a.ancho), H = num(a.alto);
    const paredes = Math.max(0, 2 * (L + A) * H - (+a.puertas || 0) * PUERTA - (+a.ventanas || 0) * VENTANA);
    return { paredes, techo: a.techo ? L * A : 0, total: paredes + (a.techo ? L * A : 0) };
  }
  function cantidad(t) {
    const m = est.m[t.id] || {};
    if (t.medida === "ambientes") return (m.ambientes || []).reduce((s, a) => s + areaAmbiente(a).total, 0);
    if (t.medida === "largoAlto") return num(m.largo) * num(m.alto);
    if (t.medida === "largoAncho") return num(m.largo) * num(m.ancho);
    if (t.medida === "m2") return num(m.m2);
    return Math.round(num(m.cantidad));
  }

  // ---------- trabajos (paso 1) ----------
  function pintarTrabajos() {
    const caja = $("[data-trabajos]");
    caja.replaceChildren(...P.TRABAJOS.map(t => {
      const lab = document.createElement("label");
      lab.className = "trabajo";
      lab.innerHTML = '<input type="checkbox"><span><b></b><small></small></span>';
      const inp = lab.querySelector("input");
      inp.value = t.id; inp.checked = est.sel.includes(t.id);
      lab.querySelector("b").textContent = t.nombre;
      lab.querySelector("small").textContent = t.detalle;
      inp.addEventListener("change", () => {
        est.sel = P.TRABAJOS.map(x => x.id).filter(id => id === t.id ? inp.checked : est.sel.includes(id));
        guardar(); pintarMedidas(); calcular();
      });
      return lab;
    }));
  }

  // ---------- medidas (paso 2) ----------
  function campo(etiqueta, valor, alCambiar, opciones) {
    const lab = document.createElement("label");
    lab.className = "campo" + (opciones && opciones.chico ? " chico" : "");
    lab.innerHTML = "<span></span><input type=\"text\" autocomplete=\"off\">";
    lab.firstChild.textContent = etiqueta;
    const inp = lab.lastChild;
    inp.inputMode = opciones && opciones.entero ? "numeric" : "decimal";
    inp.value = valor == null ? "" : valor;
    if (opciones && opciones.placeholder) inp.placeholder = opciones.placeholder;
    inp.addEventListener("input", () => { alCambiar(inp.value.replace(/[^\d.,]/g, "")); guardar(); calcular(true); });
    return lab;
  }
  function tarjetaPintura(t) {
    const m = est.m.pintura;
    const art = document.createElement("article");
    art.className = "medida";
    const h = document.createElement("h3"); h.textContent = t.nombre;
    const lista = document.createElement("div"); lista.className = "ambientes";
    m.ambientes.forEach((a, i) => {
      const fila = document.createElement("div");
      fila.className = "ambiente";
      const nombre = document.createElement("input");
      nombre.type = "text"; nombre.className = "amb-nombre"; nombre.value = a.nombre || ""; nombre.placeholder = "Ambiente " + (i + 1); nombre.maxLength = 30;
      nombre.setAttribute("aria-label", "Nombre del ambiente " + (i + 1));
      nombre.addEventListener("input", () => { a.nombre = nombre.value; guardar(); calcular(true); });
      const x = document.createElement("button");
      x.type = "button"; x.className = "amb-x"; x.textContent = "×"; x.setAttribute("aria-label", "Quitar el ambiente " + (i + 1));
      x.addEventListener("click", () => { m.ambientes.splice(i, 1); guardar(); pintarMedidas(); calcular(); });
      const area = document.createElement("p"); area.className = "amb-area";
      const actualizarArea = () => { const r = areaAmbiente(a); area.textContent = m2(r.paredes) + " m² de paredes" + (a.techo ? " + " + m2(r.techo) + " m² de techo" : ""); };
      const cambiarYActualizar = k => v => { a[k] = v; actualizarArea(); };
      const techo = document.createElement("label");
      techo.className = "check";
      techo.innerHTML = '<input type="checkbox"> <span>Pintar el techo</span>';
      techo.firstChild.checked = !!a.techo;
      techo.firstChild.addEventListener("change", e => { a.techo = e.target.checked; actualizarArea(); guardar(); calcular(true); });
      const cab = document.createElement("div"); cab.className = "amb-cab"; cab.append(nombre, x);
      const medidas = document.createElement("div"); medidas.className = "amb-medidas";
      medidas.append(campo("Largo (m)", a.largo, cambiarYActualizar("largo"), { chico: true }), campo("Ancho (m)", a.ancho, cambiarYActualizar("ancho"), { chico: true }),
        campo("Alto (m)", a.alto, cambiarYActualizar("alto"), { chico: true }), campo("Puertas", a.puertas, v => { a.puertas = Math.round(num(v)); actualizarArea(); }, { chico: true, entero: true }),
        campo("Ventanas", a.ventanas, v => { a.ventanas = Math.round(num(v)); actualizarArea(); }, { chico: true, entero: true }));
      fila.append(cab, medidas, techo, area);
      actualizarArea();
      lista.appendChild(fila);
    });
    const mas = document.createElement("button");
    mas.type = "button"; mas.className = "btn btn-line btn-sm"; mas.textContent = "+ Agregar ambiente";
    mas.addEventListener("click", () => {
      m.ambientes.push({ nombre: "", largo: "", ancho: "", alto: "2,6", puertas: 1, ventanas: 1, techo: true });
      guardar(); pintarMedidas(); calcular();
      const ult = $$(".ambiente").pop(); if (ult) $(".amb-medidas input", ult).focus();
    });
    const reparar = document.createElement("label");
    reparar.className = "check";
    reparar.innerHTML = '<input type="checkbox"> <span>Hay humedad, grietas o paredes para emparejar <small>(suma enduido)</small></span>';
    reparar.firstChild.checked = !!m.reparar;
    reparar.firstChild.addEventListener("change", e => { m.reparar = e.target.checked; guardar(); calcular(); });
    art.append(h, lista, mas, reparar);
    return art;
  }
  function tarjetaSimple(t) {
    const m = est.m[t.id];
    const art = document.createElement("article");
    art.className = "medida";
    const h = document.createElement("h3"); h.textContent = t.nombre;
    const fila = document.createElement("div"); fila.className = "medida-campos";
    const total = document.createElement("p"); total.className = "amb-area";
    const actualizar = () => { const q = cantidad(t); total.textContent = q ? (t.unidad === "boca" ? q + (q === 1 ? " boca" : " bocas") : m2(q) + " m²" + (t.desperdicio ? " (más 10% de material por cortes)" : "")) : "Cargá las medidas"; };
    const set = k => v => { m[k] = v; actualizar(); };
    if (t.medida === "largoAlto") fila.append(campo("Largo (m)", m.largo, set("largo")), campo("Alto (m)", m.alto, set("alto")));
    else if (t.medida === "largoAncho") fila.append(campo("Largo (m)", m.largo, set("largo")), campo("Ancho (m)", m.ancho, set("ancho")));
    else if (t.medida === "m2") fila.append(campo("Metros cuadrados", m.m2, set("m2")));
    else fila.append(campo("Cantidad de bocas", m.cantidad, set("cantidad"), { entero: true }));
    actualizar();
    art.append(h, fila, total);
    return art;
  }
  function pintarMedidas() {
    const caja = $("[data-medidas]");
    const elegidos = P.TRABAJOS.filter(t => est.sel.includes(t.id));
    if (!elegidos.length) { caja.replaceChildren(); return; }
    const fs = document.createElement("fieldset");
    fs.className = "caja";
    const lg = document.createElement("legend");
    lg.className = "caja-tit"; lg.textContent = "2 · Las medidas";
    fs.append(lg, ...elegidos.map(t => t.medida === "ambientes" ? tarjetaPintura(t) : tarjetaSimple(t)));
    caja.replaceChildren(fs);
  }

  // ---------- resultado ----------
  let tCalc = 0;
  function calcular(conPausa) {
    clearTimeout(tCalc);
    if (conPausa) { tCalc = setTimeout(() => calcular(false), 160); return; }
    const conMat = est.mat === "con", premium = est.calidad === "premium";
    const fm = premium ? P.PREMIUM.mo : 1, ft = premium ? P.PREMIUM.mat : 1;
    const filas = [];
    let min = 0, max = 0, dias = 0;
    P.TRABAJOS.filter(t => est.sel.includes(t.id)).forEach(t => {
      const q = cantidad(t);
      if (!q) { filas.push({ t, q, sinDatos: true }); return; }
      const qm = q * (1 + (t.desperdicio || 0));
      let lo = q * t.mo[0] * fm + (conMat ? qm * t.mat[0] * ft : 0);
      let hi = q * t.mo[1] * fm + (conMat ? qm * t.mat[1] * ft : 0);
      let d = q / t.dias, extra = "";
      if (t.id === "pintura" && est.m.pintura.reparar) {
        const paredes = est.m.pintura.ambientes.reduce((s, a) => s + areaAmbiente(a).paredes, 0);
        lo += paredes * (P.ENDUIDO.mo[0] * fm + (conMat ? P.ENDUIDO.mat[0] * ft : 0));
        hi += paredes * (P.ENDUIDO.mo[1] * fm + (conMat ? P.ENDUIDO.mat[1] * ft : 0));
        d += paredes / P.ENDUIDO.dias;
        extra = " con enduido";
      }
      filas.push({ t, q, lo: mil(lo), hi: mil(hi), extra });
      min += mil(lo); max += mil(hi); dias += d;
    });
    const lista = $("[data-res-lista]");
    lista.replaceChildren(...filas.map(f => {
      const li = document.createElement("li");
      li.innerHTML = "<span><b></b><small></small></span><em></em>";
      li.querySelector("b").textContent = f.t.nombre + (f.extra || "");
      li.querySelector("small").textContent = f.sinDatos ? "Faltan las medidas" : (f.t.unidad === "boca" ? f.q + (f.q === 1 ? " boca" : " bocas") : m2(f.q) + " m²");
      li.querySelector("em").textContent = f.sinDatos ? "—" : pesos(f.lo) + " a " + pesos(f.hi);
      return li;
    }));
    const hay = filas.some(f => !f.sinDatos);
    $("[data-res-vacio]").hidden = filas.length > 0;
    $("[data-res-total]").hidden = !hay;
    $("[data-total]").textContent = pesos(min) + " a " + pesos(max);
    const dMin = Math.max(1, Math.round(dias)), dMax = Math.max(dMin + 1, Math.ceil(dias * 1.35) + 1);
    $("[data-plazo]").textContent = hay ? dMin + " a " + dMax + " días hábiles" : "—";
    // Pedido de visita por WhatsApp (sin emojis: en WhatsApp Web llegan rotos)
    const detalle = filas.filter(f => !f.sinDatos).map(f => {
      let txt = "- " + f.t.nombre + (f.extra || "") + ": " + (f.t.unidad === "boca" ? f.q + " bocas" : m2(f.q) + " m²");
      if (f.t.id === "pintura") txt += " (" + est.m.pintura.ambientes.filter(a => areaAmbiente(a).total > 0).map(a => (a.nombre || "ambiente") + " " + (a.largo || "?") + " × " + (a.ancho || "?") + " m").join(", ") + ")";
      return txt;
    });
    const texto = hay
      ? "¡Hola Obra Fina! Calculé mi reforma en la web y quiero pedir la visita sin cargo.\n" + detalle.join("\n") + "\n" +
        (conMat ? "Con materiales" : "Solo mano de obra") + ", " + (premium ? "primeras marcas" : "calidad estándar") + ".\n" +
        "Estimado de la web: " + pesos(min) + " a " + pesos(max) + ", en " + dMin + " a " + dMax + " días hábiles.\n¿Qué día pueden venir a ver?"
      : "¡Hola Obra Fina! Quiero pedir una visita sin cargo para una reforma.";
    const a = $("[data-pedir]");
    a.href = wa(data.whatsapp, texto); a.target = "_blank"; a.rel = "noopener";
  }

  function initCalc() {
    if (!$("[data-calc]") || !P) return;
    pintarTrabajos();
    pintarMedidas();
    $$("[name=mat]").forEach(r => { r.checked = r.value === est.mat; r.addEventListener("change", () => { est.mat = r.value; guardar(); calcular(); }); });
    $$("[name=calidad]").forEach(r => { r.checked = r.value === est.calidad; r.addEventListener("change", () => { est.calidad = r.value; guardar(); calcular(); }); });
    calcular();
  }

  function initLinks() {
    $$("[data-maker]").forEach(a => { a.href = wa(data.makerWhatsapp, data.makerText); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-wa-contacto]").forEach(a => { a.href = wa(data.whatsapp, "¡Hola! Quiero consultar por una reforma."); a.target = "_blank"; a.rel = "noopener"; });
  }

  function boot() {
    document.documentElement.classList.remove("no-js");
    safe(initLinks, "initLinks");
    safe(initCalc, "initCalc");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
