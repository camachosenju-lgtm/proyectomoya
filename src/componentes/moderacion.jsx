const API_USER = '1456486769';
const API_SECRET = 'MWZsLSybLfuit6bzsDYF6edBEUZXhhsm';

// Sacamos la lista afuera para que no se cree de nuevo en cada llamada
const PALABRAS_PROHIBIDAS = [
  'mierda', 'puta', 'puto', 'perra', 'maldito', 'maldita', 'guevon', 'marico', 'marica', 'coño', 'malparido', 'hdp', 'pendejo', 'estupido', 'idiota', 'imbecil', 'basura', 'zorra', 'bastardo', 'gonorrea', 'culiao', 'weon', 'cabron', 'chupalo', 'chingar', 'pajuo', 'mamaguevo', 'mamaguebo', 'mmgv', 'becerro', 'bruja', 'caretabla', 'trimaldito', 'prostituta', 'ramera', 'cachudo', 'cornudo',
  'matar', 'asesinar', 'muerte', 'sangre', 'pistola', 'rifle', 'balazo', 'bomba', 'terrorismo', 'terrorista', 'atentado', 'secuestro', 'violacion', 'golpear', 'navaja', 'cuchillo', 'suicidio', 'veneno', 'masacre', 'sicario', 'cartel', 'droga', 'cocaina', 'heroina', 'metanfetamina',
  'pene', 'vagina', 'sexo', 'porno', 'xxx', 'ereccion', 'orgasmo', 'cojer', 'anal', 'oral', 'clitoris', 'testiculo', 'vibrador', 'hentai', 'semen', 'esperma', 'fetiche', 'sadismo', 'masoquismo', 'pedofilo', 'incesto', 'zoofilia', 'pornografia', 'intercourse', 'ejaculacion',
  'nazi', 'racista', 'xenofobia', 'homofobia', 'fag', 'faggot', 'nigga', 'nigger', 'kike', 'retard', 'retrasado', 'mojadito', 'sudaca', 'machista', 'feminazi',
  'p.u.t.a', 'pussy','m.i.e.r.d.a', 'p-u-t-a', 'sh-it', 'f-u-c-k', 'p3n3', 'v4g1n4', 'm1erd4','negrito','negrita','singar'
];

export const moderador = {
  validarTexto: async (texto) => {
    if (!texto) return { seguro: true };

    // 1. LIMPIEZA LOCAL (Para que no nos engañen con acentos o puntos)
    const textoLimpio = texto.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quita acentos
    
    const contieneProhibida = PALABRAS_PROHIBIDAS.some(p => textoLimpio.includes(p));

    if (contieneProhibida) {
      return { seguro: false, razon: 'Filtro local detectó lenguaje no permitido.' };
    }

    // 2. CONSULTA API (Solo si pasa el filtro local)
    try {
      const url = `https://api.sightengine.com/1.0/check-text.json?text=${encodeURIComponent(texto)}&lang=es&mode=standard&api_user=${API_USER}&api_secret=${API_SECRET}`;
      const response = await fetch(url);
      const data = await response.json();

      const tieneGroserias = data.profanity?.matches?.length > 0;
      const esOfensivo = data.moderation?.sexual > 0.3 || data.moderation?.toxicity > 0.3;

      return { 
        seguro: !tieneGroserias && !esOfensivo, 
        detalle: data 
      };
    } catch (err) {
      console.warn("API de moderación no disponible, confiando en filtro local.");
      return { seguro: true }; // Si la API falla pero el local ya pasó, lo dejamos pasar
    }
  },

  validarMedia: async (url) => {
    try {
      const response = await fetch(
        `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(url)}&models=nudity-2.0,wad,gore&api_user=${API_USER}&api_secret=${API_SECRET}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        const esExplicito = 
          data.nudity.sexual_activity > 0.2 || 
          data.nudity.erotica > 0.3 ||
          data.wad > 0.4 ||
          data.gore.prob > 0.4;

        return { seguro: !esExplicito, detalle: data };
      }
      return { seguro: true };
    } catch (err) {
      return { seguro: true };
    }
  },

  validarMediaGore: async (url) => {
    const response = await fetch(
      `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(url)}&models=gore&api_user=${API_USER}&api_secret=${API_SECRET}`
    );

    if (!response.ok) {
      throw new Error(`El servicio de moderación respondió con estado ${response.status}.`);
    }

    const data = await response.json();
    if (data.status !== 'success' || typeof data.gore?.prob !== 'number') {
      throw new Error(data.error?.message || 'No se pudo comprobar si el archivo contiene gore.');
    }

    return {
      seguro: data.gore.prob <= 0.4,
      detalle: data
    };
  },

  validarMediaNoExplicita: async (url) => {
    const response = await fetch(
      `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(url)}&models=nudity-2.0,wad,gore&api_user=${API_USER}&api_secret=${API_SECRET}`
    );

    if (!response.ok) {
      throw new Error(`El servicio de moderación respondió con estado ${response.status}.`);
    }

    const data = await response.json();
    if (
      data.status !== 'success' ||
      typeof data.nudity?.sexual_activity !== 'number' ||
      typeof data.nudity?.erotica !== 'number' ||
      typeof data.weapon !== 'number' ||
      typeof data.alcohol !== 'number' ||
      typeof data.drugs !== 'number' ||
      typeof data.gore?.prob !== 'number'
    ) {
      throw new Error(data.error?.message || 'No se pudo verificar que el archivo sea apto para todo público.');
    }

    const contieneContenidoNoApto =
      data.nudity.sexual_activity > 0.2 ||
      data.nudity.erotica > 0.3 ||
      data.weapon > 0.4 ||
      data.alcohol > 0.4 ||
      data.drugs > 0.4 ||
      data.gore.prob > 0.4;

    return {
      seguro: !contieneContenidoNoApto,
      detalle: data
    };
  }
};

export default moderador;