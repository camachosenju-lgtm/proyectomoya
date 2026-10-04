import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Flag } from 'lucide-react';

const MOTIVOS = [
  'Spam o publicidad',
  'Contenido ofensivo',
  'Contenido sexual o violento',
  'Derechos de autor',
  'Suplantación de identidad',
  'Otro',
];

// Modal genérico de reporte (proyecto, comentario o perfil).
// reporte: { tipo: 'proyecto'|'comentario'|'perfil', objetivoId, tituloObjetivo }
const ModalReporte = ({ reporte, onClose }) => {
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!reporte) return null;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEnviando(false);
      onClose(false);
      return;
    }
    const { error } = await supabase.from('reportes').insert({
      reportado_por: user.id,
      tipo: reporte.tipo,
      objetivo_id: String(reporte.objetivoId),
      motivo,
      detalle: detalle.trim() || null,
    });
    setEnviando(false);
    onClose(!error);
  };

  return (
    <div className="modal-fondo" onClick={() => onClose(false)}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <Flag size={36} className="icono-modal" style={{ color: 'var(--aviso)' }} />
        <h3 className="modal-titulo aviso">Reportar {reporte.tipo}</h3>
        <p className="modal-texto">{reporte.tituloObjetivo}</p>
        <form onSubmit={enviar} className="columna">
          <select className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <textarea
            className="campo"
            placeholder="Detalle (opcional, máx 200)"
            maxLength={200}
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
          />
          <div className="modal-acciones">
            <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReporte;
