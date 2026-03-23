import React from 'react';
import './estilos.css';

const ModalMensaje = ({ mensaje, tipo, onClose, onAccept }) => {
  if (!mensaje) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-contenido">
        <h3 className={tipo === 'error' ? 'modal-titulo-error' : 'modal-titulo-exito'}>
          {tipo === 'error' ? 'Error' : '¡Éxito!'}
        </h3>
        <p className="modal-texto">{mensaje}</p>
        <button 
           className="login-boton" 
           onClick={onAccept || onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default ModalMensaje;
