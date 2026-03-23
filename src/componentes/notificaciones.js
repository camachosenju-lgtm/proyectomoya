import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';

const STORAGE_KEY_NOTIF_LEIDAS = 'pocketwork_notificaciones_leidas';

const Notificaciones = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [notificaciones, setNotificaciones] = useState(Array.isArray(location.state?.notificaciones) ? location.state.notificaciones : []);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (notificaciones.length === 0) {
        await cargarNotificacionesDB();
      } else {
        localStorage.setItem(STORAGE_KEY_NOTIF_LEIDAS, String(notificaciones.length));
      }
    };
    init();
  }, []);

  const cargarNotificacionesDB = async () => {
    setCargando(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setCargando(false);
      return;
    }

    // Buscamos tus proyectos para saber qué comentarios te pertenecen
    const { data: proyectos } = await supabase
      .from('proyectos')
      .select('id')
      .eq('usuario_id', user.id);

    const ids = (proyectos || []).map(p => p.id);
    if (ids.length === 0) {
      setNotificaciones([]);
      setCargando(false);
      return;
    }

    // CONSULTA MAESTRA: Trae Comentario + Título del Proyecto + Perfil del Autor
    const { data: comentarios, error } = await supabase
      .from('comentarios')
      .select(`
        id,
        contenido,
        creado_el,
        proyecto_id,
        proyectos (titulo),
        perfiles (nombre_completo, avatar_url)
      `)
      .in('proyecto_id', ids)
      .neq('usuario_id', user.id) // No mostrar mis propios comentarios
      .order('creado_el', { ascending: false });

    if (error) {
      console.error('Error:', error.message);
      setCargando(false);
      return;
    }

    const items = (comentarios || []).map(c => ({
      id: c.id,
      nombre: c.perfiles?.nombre_completo || 'Usuario',
      foto: c.perfiles?.avatar_url || 'https://via.placeholder.com/50',
      contenido: c.contenido,
      tituloProyecto: c.proyectos?.titulo || 'tu publicación',
      fecha: c.creado_el
    }));

    setNotificaciones(items);
    setCargando(false);
  };

  return (
    <div style={{...estilos.padre, ...estilos.fondoConImagen}}>
      <div style={estilos.cajaActividad}>
        <div style={estilos.cabeceraActividad}>
          <img src={logoPocketwork} alt="Logo" style={estilos.logo} />
          <h2 style={estilos.titulo}>Actividad Reciente</h2>
          <button style={estilos.botonVolver} onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>

        {cargando && <p style={estilos.textoSecundario}>Cargando actividad...</p>}

        {!cargando && notificaciones.length === 0 && (
          <p style={estilos.textoSecundario}>No tienes comentarios nuevos por ahora.</p>
        )}

        {!cargando && notificaciones.length > 0 && (
          <ul style={estilos.listaActividad}>
            {notificaciones.map(n => (
              <li key={n.id} style={estilos.itemActividad}>
                <img src={n.foto} alt="Perfil" style={estilos.fotoMiniatura} />
                <div style={estilos.contenedorTexto}>
                  <p style={estilos.textoActividad}>
                    <span style={estilos.nombreUsuario}>{n.nombre}</span> comentó: 
                    <span style={estilos.comentarioTexto}> "{n.contenido}"</span>
                  </p>
                  <p style={estilos.referenciaProyecto}>
                    En tu obra: <strong>{n.tituloProyecto}</strong>
                  </p>
                  <small style={estilos.fechaActividad}>
                    {new Date(n.fecha).toLocaleString('es-VE')}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const estilos = {
  padre: { minHeight: '100vh', minWidth: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  fondoConImagen: { backgroundImage: `url(${imagenDeFondo})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  cajaActividad: { backgroundColor: 'rgba(15, 15, 15, 0.95)', padding: '30px', borderRadius: '22px', width: '90%', maxWidth: '520px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' },
  cabeceraActividad: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px' },
  logo: { width: '50px', height: 'auto' },
  titulo: { color: '#f07e11', fontSize: '18px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' },
  botonVolver: { padding: '8px 15px', borderRadius: '8px', border: 'none', background: '#f07e11', color: '#000', cursor: 'pointer', fontWeight: 'bold' },
  textoSecundario: { color: '#ccc', textAlign: 'center', fontSize: '1.1em' },
  listaActividad: { listStyle: 'none', padding: 0, margin: 0, maxHeight: '480px', overflowY: 'auto' },
  itemActividad: { display: 'flex', alignItems: 'flex-start', gap: '15px', padding: '15px 10px', borderBottom: '1px solid #222' },
  fotoMiniatura: { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f07e11' },
  contenedorTexto: { display: 'flex', flexDirection: 'column', gap: '4px' },
  nombreUsuario: { color: '#f07e11', fontWeight: 'bold' },
  comentarioTexto: { color: '#fff', fontStyle: 'italic' },
  referenciaProyecto: { color: '#888', fontSize: '0.85em', margin: 0 },
  textoActividad: { margin: 0, lineHeight: '1.4', fontSize: '0.95em' },
  fechaActividad: { color: '#666', fontSize: '0.75em', marginTop: '4px' }
};

export default Notificaciones;