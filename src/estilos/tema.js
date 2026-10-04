// Gestiona el tema visual (oscuro / claro) y su persistencia.
// El tema claro se usa cuando el salón de presentación tiene luz
// y el videobeam pierde contraste con fondos oscuros.

const CLAVE_TEMA = 'pocketwork_tema';

export const TEMAS = {
  OSCURO: 'oscuro',
  CLARO: 'claro',
};

const esTemaValido = (valor) =>
  valor === TEMAS.OSCURO || valor === TEMAS.CLARO;

export const leerTemaGuardado = () => {
  try {
    const guardado = window.localStorage.getItem(CLAVE_TEMA);
    if (esTemaValido(guardado)) return guardado;
  } catch (error) {
    // localStorage puede estar bloqueado; se usa el tema por defecto.
  }
  return TEMAS.OSCURO;
};

export const aplicarTema = (tema) => {
  const temaFinal = esTemaValido(tema) ? tema : TEMAS.OSCURO;
  document.documentElement.dataset.tema = temaFinal;
  try {
    window.localStorage.setItem(CLAVE_TEMA, temaFinal);
  } catch (error) {
    // Si no se puede persistir, igual se aplica en memoria.
  }
  return temaFinal;
};

export const alternarTema = (temaActual) =>
  temaActual === TEMAS.OSCURO ? TEMAS.CLARO : TEMAS.OSCURO;

export const aplicarTemaGuardado = () => aplicarTema(leerTemaGuardado());
