// Precios de ejemplo de Obra Fina (los usan la calculadora del cliente y el presupuestador del dueño).
// mo y mat: rango de mano de obra y de materiales por unidad, en pesos. dias: rendimiento (unidades por día de un equipo).
(function (raiz) {
  "use strict";
  const TRABAJOS = [
    { id: "pintura", nombre: "Pintura interior", detalle: "Látex 2 manos en paredes (y techo si querés)", unidad: "m²", medida: "ambientes", mo: [4200, 6800], mat: [1600, 2600], dias: 45 },
    { id: "frente", nombre: "Pintura de frente", detalle: "Látex exterior o impermeabilizante", unidad: "m²", medida: "largoAlto", mo: [5500, 8500], mat: [2200, 3600], dias: 30 },
    { id: "tabique", nombre: "Tabique de durlock", detalle: "Placa simple de cada lado, listo para pintar", unidad: "m²", medida: "largoAlto", mo: [11000, 16000], mat: [10000, 15000], dias: 12 },
    { id: "cielorraso", nombre: "Cielorraso de durlock", detalle: "Junta tomada, listo para pintar", unidad: "m²", medida: "largoAncho", mo: [12000, 17000], mat: [9000, 14000], dias: 14 },
    { id: "piso", nombre: "Piso cerámico o porcelanato", detalle: "Colocación con pegamento y pastina (+10% de material por cortes)", unidad: "m²", medida: "largoAncho", desperdicio: 0.1, mo: [9000, 14000], mat: [11000, 28000], dias: 12 },
    { id: "revestimiento", nombre: "Revestimiento de baño o cocina", detalle: "Cerámica en paredes, con guardas y esquineros", unidad: "m²", medida: "m2", mo: [11000, 16000], mat: [12000, 30000], dias: 8 },
    { id: "techo", nombre: "Impermeabilizar el techo", detalle: "Membrana líquida o asfáltica según el techo", unidad: "m²", medida: "largoAncho", mo: [5000, 8000], mat: [7000, 12000], dias: 40 },
    { id: "electricidad", nombre: "Electricidad", detalle: "Bocas nuevas con cableado y llaves", unidad: "boca", medida: "cantidad", mo: [22000, 34000], mat: [9000, 16000], dias: 8 },
  ];
  const ENDUIDO = { mo: [3000, 5500], mat: [600, 1100], dias: 60 };  // se suma a la pintura si las paredes necesitan arreglo
  const PREMIUM = { mo: 1.1, mat: 1.45 };

  // Lista de precios del presupuestador (precio por unidad, con materiales salvo que diga lo contrario)
  const CATALOGO = [
    { id: "c1", nombre: "Pintura interior látex 2 manos", unidad: "m²", precio: 7600 },
    { id: "c2", nombre: "Pintura de frente con látex exterior", unidad: "m²", precio: 9900 },
    { id: "c3", nombre: "Enduido y lijado", unidad: "m²", precio: 5100 },
    { id: "c4", nombre: "Tabique de durlock, listo para pintar", unidad: "m²", precio: 26000 },
    { id: "c5", nombre: "Cielorraso de durlock", unidad: "m²", precio: 26000 },
    { id: "c6", nombre: "Colocación de porcelanato (sin material)", unidad: "m²", precio: 11500 },
    { id: "c7", nombre: "Revestimiento cerámico de baño (sin material)", unidad: "m²", precio: 13500 },
    { id: "c8", nombre: "Impermeabilización con membrana", unidad: "m²", precio: 16000 },
    { id: "c9", nombre: "Boca eléctrica completa", unidad: "u", precio: 40000 },
    { id: "c10", nombre: "Retiro de escombros", unidad: "viaje", precio: 45000 },
    { id: "c11", nombre: "Ayudante", unidad: "día", precio: 38000 },
  ];

  raiz.Precios = { TRABAJOS, ENDUIDO, PREMIUM, CATALOGO };
})(typeof window !== "undefined" ? window : globalThis);
