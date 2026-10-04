import React from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import './estilos.css';

const VARIANTES = {
  error: { Icono: CircleAlert, clase: 'error', titulo: 'Algo salió mal', color: 'var(--peligro)' },
  exito: { Icono: CircleCheck, clase: 'exito', titulo: '¡Listo!', color: 'var(--marca-400)' },
  info: { Icono: Info, clase: 'aviso', titulo: 'Aviso', color: 'var(--aviso)' },
};

// Modal único de mensajes para toda la aplicación.
const ModalMensaje = ({ mensaje, tipo, onClose, onAccept }) => {
  if (!mensaje) return null;

  const { Icono, clase, titulo, color } = VARIANTES[tipo] || VARIANTES.info;
  const cerrar = onAccept || onClose;

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" onClick={cerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <Icono size={46} className="icono-modal" style={{ color }} />
        <h3 className={`modal-titulo ${clase}`}>{titulo}</h3>
        <p className="modal-texto">{mensaje}</p>
        <button type="button" className="btn btn-primario btn-bloque" onClick={cerrar}>
          Entendido
        </button>
      </div>
    </div>
  );
};

export default ModalMensaje;
