import React from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import './estilos.css';

const VARIANTES = {
  error: { Icono: CircleAlert, clase: 'error', titulo: 'Error', color: 'var(--peligro)' },
  exito: { Icono: CircleCheck, clase: 'exito', titulo: '¡Éxito!', color: 'var(--marca-400)' },
  confirm: { Icono: Info, clase: 'aviso', titulo: 'Confirmación', color: 'var(--aviso)' },
};

// Modal de alerta simple o de confirmación (sí/no).
// Comparte el mismo lenguaje visual que ModalMensaje.
const AlertModal = ({ alerta, setAlerta }) => {
  if (!alerta?.visible) return null;

  const esConfirmacion = alerta.tipo === 'confirm';
  const { Icono, clase, titulo, color } = VARIANTES[alerta.tipo] || VARIANTES.confirm;

  const cerrar = () => setAlerta({ ...alerta, visible: false });

  const confirmar = () => {
    cerrar();
    if (typeof alerta.onConfirm === 'function') alerta.onConfirm();
  };

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" onClick={cerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <Icono size={42} className="icono-modal" style={{ color }} />
        <h3 className={`modal-titulo ${clase}`}>{alerta.titulo || titulo}</h3>
        <p className="modal-texto">{alerta.mensaje}</p>
        <div className="modal-acciones">
          {esConfirmacion ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primario" onClick={confirmar}>
                Confirmar
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primario" onClick={cerrar}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
