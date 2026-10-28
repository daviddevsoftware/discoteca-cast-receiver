// Letra LRC para el receptor de Discoteca: «[mm:ss.xx]línea» y, si las trae, marcas por palabra «<mm:ss.xx>».
// Sin dependencias: lo usa index.html en el Cast y lo prueba node (letra.test.mjs).

const MARCA = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g;
const PALABRA = /<(\d{1,3}):(\d{2}(?:\.\d{1,3})?)>/g;

function segundos(min, seg) {
  return Number(min) * 60 + Number(seg);
}

/** Convierte un LRC en líneas ordenadas por tiempo. Lo que no se entiende se ignora (nunca falla). */
export function parseLRC(texto) {
  if (typeof texto !== "string" || texto.length > 200000) return [];
  const lineas = [];
  for (const cruda of texto.split(/\r?\n/)) {
    const tiempos = [...cruda.matchAll(MARCA)].map((m) => segundos(m[1], m[2]));
    if (tiempos.length === 0) continue;
    const cuerpo = cruda.replace(MARCA, "");
    // split con dos grupos de captura: [antes, min, seg, texto, min, seg, texto, ...].
    const trozos = cuerpo.split(PALABRA);
    const palabras = [];
    for (let i = 1; i + 2 < trozos.length; i += 3) {
      const textoPalabra = trozos[i + 2].trim();
      if (textoPalabra) palabras.push({ t: segundos(trozos[i], trozos[i + 1]), texto: textoPalabra });
    }
    const limpio = cuerpo.replace(PALABRA, "").replace(/\s+/g, " ").trim();
    for (const t of tiempos) lineas.push({ t, texto: limpio, palabras });
  }
  return lineas.sort((a, b) => a.t - b.t);
}

/** Índice de la línea que suena en el segundo `t` (-1 antes de la primera). Búsqueda binaria. */
export function lineaEn(lineas, t) {
  if (!Array.isArray(lineas) || !Number.isFinite(t)) return -1;
  let bajo = 0;
  let alto = lineas.length - 1;
  let encontrada = -1;
  while (bajo <= alto) {
    const medio = (bajo + alto) >> 1;
    if (lineas[medio].t <= t) {
      encontrada = medio;
      bajo = medio + 1;
    } else {
      alto = medio - 1;
    }
  }
  return encontrada;
}

/** Colores «#RRGGBB» válidos (como mucho 6); el resto se descarta. Lo que llega por la red no se pinta sin revisar. */
export function coloresSeguros(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter((c) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c)).slice(0, 6);
}

/** Cuántas palabras de la línea ya se cantaron en el segundo `t`. */
export function palabrasDichas(linea, t) {
  if (!linea || !Array.isArray(linea.palabras) || !Number.isFinite(t)) return 0;
  return linea.palabras.filter((p) => p.t <= t).length;
}
