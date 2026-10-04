// Temas predefinidos para la cabecera del perfil.
// Cada tema fija los 4 colores con contraste garantizado, así la
// personalización nunca rompe la armonía del diseño (tema.css).
// Los valores se guardan en las columnas ya existentes de `perfiles`:
// color_principal, color_fondo_web, color_letra_nombre, color_letra_bio.

export const TEMA_POR_DEFECTO_ID = 'pocketwork';

export const TEMAS_PERFIL = [
  {
    id: 'pocketwork',
    nombre: 'Pocketwork',
    colorPrincipal: '#f07e11',
    colorFondoWeb: '#101014',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#e6e6ec',
  },
  {
    id: 'medianoche',
    nombre: 'Medianoche',
    colorPrincipal: '#38bdf8',
    colorFondoWeb: '#02285c',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#c9d8e8',
  },
  {
    id: 'bosque',
    nombre: 'Bosque',
    colorPrincipal: '#58c37f',
    colorFondoWeb: '#02532b',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#cfe8d8',
  },
  {
    id: 'vino',
    nombre: 'Vino',
    colorPrincipal: '#f3639d',
    colorFondoWeb: '#550b23',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#f0d3e0',
  },
  {
    id: 'lavanda',
    nombre: 'Lavanda',
    colorPrincipal: '#8b5cf6',
    colorFondoWeb: '#4d3483',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#ddd3f5',
  },
  {
    id: 'arena',
    nombre: 'Arena',
    colorPrincipal: '#c25f06',
    colorFondoWeb: '#f2e8d8',
    colorLetraNombre: '#1c1410',
    colorLetraBio: '#5b4a3a',
  },
];

export const buscarTemaPerfil = (id) =>
  TEMAS_PERFIL.find((t) => t.id === id) || null;

// Detecta qué tema coincide con los colores actuales (para marcarlo).
export const detectarTemaPerfil = (perfil) => {
  if (!perfil) return null;
  const hallado = TEMAS_PERFIL.find(
    (t) =>
      t.colorPrincipal === perfil.colorPrincipal &&
      t.colorFondoWeb === perfil.colorFondoWeb &&
      t.colorLetraNombre === perfil.colorLetraNombre &&
      t.colorLetraBio === perfil.colorLetraBio
  );
  return hallado ? hallado.id : null;
};

// true si el fondo de cabecera es claro: la píldora de la bio usa
// fondo claro en vez del oscuro fijo (ej. tema Arena).
export const esFondoClaro = (hex) => {
  if (typeof hex !== 'string') return false;
  const limpio = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return false;
  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.55;
};

// Las 50 plantillas locales de public/imagenes/plantillas.
export const PLANTILLAS_FONDO = Array.from(
  { length: 50 },
  (_, i) => `/imagenes/plantillas/textura${i + 1}.png`
);
