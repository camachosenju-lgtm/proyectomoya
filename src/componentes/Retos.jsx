import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AlertModal from './AlertModal';
import '../estilos/galeria.css';
import { ArrowLeft, Trophy, Send, Users } from 'lucide-react';

const Retos = () => {
  const navigate = useNavigate();
  const [retos, setRetos] = useState([]);
  const [participaciones, setParticipaciones] = useState([]);
  const [misObras, setMisObras] = useState([]);
  const [userId, setUserId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [retoAbierto, setRetoAbierto] = useState(null);
  const [obraElegida, setObraElegida] = useState('');
  const [alerta, setAlerta] = useState({ visible: false, mensaje: '', tipo: 'info', titulo: '', onConfirm: null });

  const avisar = (mensaje, tipo = 'info', titulo) =>
    setAlerta({ visible: true, mensaje, tipo, titulo, onConfirm: null });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      const { data: r } = await supabase
        .from('retos').select('*').eq('activo', true).order('creado_el', { ascending: false });
      setRetos(r || []);
      await cargarParticipaciones();
      if (user) {
        const { data: m } = await supabase
          .from('proyectos').select('id, titulo').eq('usuario_id', user.id)
          .order('creado_el', { ascending: false });
        setMisObras(m || []);
      }
      setCargando(false);
    };
    init();
  }, []);

  const cargarParticipaciones = async () => {
    const { data } = await supabase
      .from('reto_participaciones')
      .select('reto_id, proyecto_id, proyectos (id, titulo, archivo_url, tipo_archivo)');
    setParticipaciones(data || []);
  };

  const participar = async (retoId) => {
    if (!userId) {
      avisar('Inicia sesión para participar.', 'info');
      return;
    }
    if (!obraElegida) {
      avisar('Elige una de tus obras para participar.', 'info');
      return;
    }
    const { error } = await supabase.from('reto_participaciones').insert({
      reto_id: retoId, proyecto_id: obraElegida, usuario_id: userId,
    });
    if (error) {
      avisar('No se pudo registrar: ' + error.message, 'error');
      return;
    }
    setObraElegida('');
    setRetoAbierto(null);
    await cargarParticipaciones();
    avisar('¡Participación registrada!', 'exito');
  };

  const partesDe = (retoId) => participaciones.filter((p) => String(p.reto_id) === String(retoId));

  return (
    <section className="gal-pantalla">
      <div className="gal-panel">
        <nav className="gal-barra">
          <h1 className="gal-titulo">Retos creativos</h1>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/galeria')}>
            <ArrowLeft size={18} /> Galería
          </button>
        </nav>

        <div className="gal-grid">
          {cargando ? (
            <p className="gal-cargando">Cargando retos...</p>
          ) : retos.length === 0 ? (
            <div className="gal-vacio">
              <Trophy size={34} />
              <span>No hay retos activos por ahora.</span>
            </div>
          ) : (
            retos.map((reto) => {
              const partes = partesDe(reto.id);
              return (
                <article key={reto.id} className="gal-tarjeta">
                  <div className="gal-info">
                    <h3 className="gal-obra-titulo">{reto.titulo}</h3>
                    {reto.descripcion && <p className="texto-2 sin-margen">{reto.descripcion}</p>}
                    <div className="gal-metricas">
                      <span className="gal-metrica"><Users size={13} /> {partes.length}</span>
                      {reto.termina_el && (
                        <span className="gal-metrica">Cierra: {reto.termina_el}</span>
                      )}
                    </div>
                    {partes.length > 0 && (
                      <div className="fila">
                        {partes.slice(0, 8).map((p) => (
                          <img
                            key={p.proyecto_id}
                            src={p.proyectos?.archivo_url}
                            className="avatar avatar-sm"
                            alt={p.proyectos?.titulo || ''}
                            title={p.proyectos?.titulo || ''}
                          />
                        ))}
                      </div>
                    )}
                    {retoAbierto === reto.id ? (
                      <div className="columna">
                        <select
                          className="campo"
                          value={obraElegida}
                          onChange={(e) => setObraElegida(e.target.value)}
                        >
                          <option value="">Elige tu obra...</option>
                          {misObras.map((o) => (
                            <option key={o.id} value={o.id}>{o.titulo}</option>
                          ))}
                        </select>
                        <div className="fila">
                          <button type="button" className="btn btn-primario" onClick={() => participar(reto.id)}>
                            <Send size={16} /> Participar
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => setRetoAbierto(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={() => { setRetoAbierto(reto.id); setObraElegida(''); }}
                      >
                        <Trophy size={16} /> Participar
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
      <AlertModal alerta={alerta} setAlerta={setAlerta} />
    </section>
  );
};

export default Retos;
