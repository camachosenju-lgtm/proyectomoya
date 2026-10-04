import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { TEMAS, leerTemaGuardado, aplicarTema, alternarTema } from '../estilos/tema';

// Botón flotante para alternar entre tema oscuro y claro.
// Se monta una sola vez en App, por eso aparece en todas las pantallas.
const BotonTema = () => {
  const [tema, setTema] = useState(TEMAS.OSCURO);

  useEffect(() => {
    const inicial = leerTemaGuardado();
    setTema(aplicarTema(inicial));
  }, []);

  const manejarClick = () => {
    const nuevo = alternarTema(tema);
    setTema(aplicarTema(nuevo));
  };

  const esOscuro = tema === TEMAS.OSCURO;
  const descripcion = esOscuro
    ? 'Cambiar a tema claro (salón con luz)'
    : 'Cambiar a tema oscuro';

  return (
    <button
      type="button"
      className="boton-tema"
      onClick={manejarClick}
      title={descripcion}
      aria-label={descripcion}
    >
      {esOscuro ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default BotonTema;
