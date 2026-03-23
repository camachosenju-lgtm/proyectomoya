import React from 'react';

const AlertModal = ({ alerta, setAlerta, perfil }) => {
  if (!alerta.visible) return null;

  const esConfirmacion = alerta.tipo === 'confirm';
  const colorBorde = perfil?.colorPrincipal || '#4a90e2';

  const cerrar = () => setAlerta({ ...alerta, visible: false });

  return (
    <div className="overlay" onClick={cerrar} style={{ zIndex: 9999 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          width: '350px', 
          height: 'fit-content', 
          padding: '35px 25px', 
          textAlign: 'center', 
          background: '#ffffffff', 
          border: `1px solid ${colorBorde}`, 
          boxShadow: `0 10px 40px ${colorBorde}33` 
        }}
      >
        <h2 style={{ color: '#000', marginBottom: '10px' }}>
          {alerta.tipo === 'error' ? '⚠️ Error' : alerta.tipo === 'exito' ? '✅ Éxito' : 'Aviso'}
        </h2>
        <p style={{ color: '#696969ff', marginBottom: '25px', fontSize: '15px' }}>
          {alerta.mensaje}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          {esConfirmacion ? (
            <>
              <button onClick={cerrar} className="btnCancelar" style={{ flex: 1 }}>
                Cancelar
              </button>
              <button 
                onClick={() => { cerrar(); alerta.onConfirm && alerta.onConfirm(); }} 
                className="btnConfirmar" style={{ flex: 1 }}
              >
                Confirmar
              </button>
            </>
          ) : (
            <button onClick={cerrar} className="btnConfirmar" style={{ flex: 1 }}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
